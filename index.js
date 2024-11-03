const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const getReel = require("./instaScrape");

async function downloadVideo(mp4Link, filename) {
  const response = await axios.get(mp4Link, { responseType: "arraybuffer" });
  fs.writeFileSync(filename, response.data);
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
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
      const text =
        message.message.conversation ||
        message.message.extendedTextMessage.text;

      const reelRegex =
        /https:\/\/www\.instagram\.com\/(reel|reels)\/[A-Za-z0-9_-]+\/?/;
      const match = text.match(reelRegex);

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
    }
  });
}

startBot();
