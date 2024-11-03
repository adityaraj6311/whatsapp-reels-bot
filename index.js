const express = require("express");
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const qrcode = require("qrcode");
const getReel = require("./instaScrape");

let qrCodeData = ""; // Variable to hold the latest QR code data

async function downloadVideo(mp4Link, filename) {
  const response = await axios.get(mp4Link, { responseType: "arraybuffer" });
  fs.writeFileSync(filename, response.data);
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false, // Disable QR printing in terminal
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    // If there's a QR code, generate a Base64 string
    if (qr) {
      qrcode.toDataURL(qr, (err, url) => {
        if (err) {
          console.error("Error generating QR code", err);
        } else {
          qrCodeData = url; // Update the QR code data
        }
      });
    }

    if (connection === "close") {
      if (
        lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
      ) {
        startBot(); // reconnect if not logged out
      }
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    const message = m.messages[0];
    if (!message.message || message.key.fromMe) return;

    const messageType = Object.keys(message.message)[0];
    if (
      messageType === "conversation" ||
      messageType === "extendedTextMessage"
    ) {
      try {
        const isGroup = message.key.remoteJid.endsWith("@g.us");
        let text;

        if (isGroup) {
          // In a group, use extendedTextMessage for more comprehensive text handling
          console.log(message);
          
          text = message.message.extendedTextMessage?.text?.trim() || message.message.conversation?.trim();
        } else {
          // In DMs, use conversation directly
          text =
            message.message.conversation?.trim() ||
            message.message.extendedTextMessage?.text?.trim();
        }
        
        console.log(isGroup)
        console.log("text: " + text);
        

        const reelRegex =
          /https:\/\/www\.instagram\.com\/(reel|reels)\/[A-Za-z0-9_-]+\/?/;
        const match = text?.match(reelRegex);
        if (!match) return;

        if (match) {
          const reelLink = match[0];
          const { mp4Link, title } = await getReel(reelLink);

          if (mp4Link) {
            const videoPath = path.resolve(__dirname, "video.mp4");
            await downloadVideo(mp4Link, videoPath);

            await sock.sendMessage(
              message.key.remoteJid,
              { video: { url: videoPath }, caption: title },
              { quoted: message }
            );

            // Delete the video after sending
            fs.unlinkSync(videoPath);
          } else {
            await sock.sendMessage(
              message.key.remoteJid,
              { text: "Failed to retrieve Reel video link." },
              { quoted: message }
            );
          }
        }
      } catch (error) {
        console.log("Error in message handling", error);
        return;
      }
    }
  });
}

// Initialize the WhatsApp bot
startBot();

// Set up Express server to serve the QR code
const app = express();

app.get("/", (req, res) => {
  res.json({ qr: "/qr" });
});

app.get("/qr", (req, res) => {
  if (qrCodeData) {
    res.send(`
      <html>
        <body>
          <h1>Scan this QR code with WhatsApp</h1>
          <img src="${qrCodeData}" alt="QR Code"/>
        </body>
      </html>
    `);
  } else {
    res.send("QR Code not generated yet. Please wait...");
  }
});

app.get("/delauth", (req, res) => {
  // delete auth_info folder
  if (!fs.existsSync("./auth_info")) res.send("Auth folder not found");
  fs.rmdirSync("./auth_info", { recursive: true });
  res.send("Auth info deleted");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Express server running on http://localhost:3000");
});
