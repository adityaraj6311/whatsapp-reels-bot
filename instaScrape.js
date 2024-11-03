const axios = require("axios");

const url = "https://www.instagram.com/api/graphql";
const headers = {
  "Accept-Encoding": "gzip",
  Connection: "Keep-Alive",
  "Content-Length": "1255",
  "Content-Type": "application/x-www-form-urlencoded",
  Host: "www.instagram.com",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36",
  "X-ASBD-ID": "129477",
  "X-CSRFToken": "RVDUooU5MYsBbS1CNN3CzVAuEP8oHB52",
  "X-FB-Friendly-Name": "PolarisPostActionLoadPostQueryQuery",
  "X-FB-LSD": "AVqbxe3J_YA",
  "X-IG-App-ID": "1217981644879628",
};

function getPayload(reel_id) {
  const payload = `doc_id=10015901848480474&server_timestamps=true&variables=%7B%22shortcode%22%3A%22${reel_id}%22%2C%22fetch_comment_count%22%3A%22null%22%2C%22fetch_related_profile_media_count%22%3A%22null%22%2C%22parent_comment_count%22%3A%22null%22%2C%22child_comment_count%22%3A%22null%22%2C%22fetch_like_count%22%3A%22null%22%2C%22fetch_tagged_user_count%22%3A%22null%22%2C%22fetch_preview_comment_count%22%3A%22null%22%2C%22has_threaded_comments%22%3A%22false%22%2C%22hoisted_comment_id%22%3A%22null%22%2C%22hoisted_reply_id%22%3A%22null%22%7D&fb_api_req_friendly_name=PolarisPostActionLoadPostQueryQuery&fb_api_caller_class=RelayModern&__spin_t=1695523385&__spin_b=trunk&__spin_r=1008824440&jazoest=2957&lsd=AVqbxe3J_YA&__comet_req=7&__csr=gZ3yFmJkillQvV6ybimnG8AmhqujGbLADgjyEOWz49z9XDlAXBJpC7Wy-vQTSvUGWGh5u8KibG44dBiigrgjDxGjU0150Q0848azk48N09C02IR0go4SaR70r8owyg9pU0V23hwiA0LQczA48S0f-x-27o05NG0fkw&__dyn=7xeUmwlEnwn8K2WnFw9-2i5U4e0yoW3q32360CEbo1nEhw2nVE4W0om78b87C0yE5ufz81s8hwGwQwoEcE7O2l0Fwqo31w9a9x-0z8-U2zxe2GewGwso88cobEaU2eUlwhEe87q7-0iK2S3qazo7u1xwIw8O321LwTwKG1pg661pwr86C1mwraCg&__hsi=7282217488877343271&__s=xf44ne%3Azhh75g%3Axr51e7&__rev=1008824440&__ccg=UNKNOWN&dpr=3&__hs=19624.HYP%3Ainstagram_web_pkg.2.1..0.0&__req=3&__a=1&__user=0&__d=www&av=0`;
  return payload;
}

const getReel = async (reel_url) => {
  try {
    const reel_id = reel_url.match(/\/(reel|reels)\/([^/?]+)/)[2];
    const response = await axios.post(url, getPayload(reel_id), { headers });

    const reel_title =
      response.data.data?.xdt_shortcode_media?.edge_media_to_caption?.edges[0]
        ?.node?.text;
    const reel_mp4 = response.data.data.xdt_shortcode_media.video_url;

    return {
      mp4Link: reel_mp4 || "Here is the reel video!",
      title: reel_title,
    };
  } catch (error) {
    return {
      mp4Link: null,
      title: "Error fetching reel video!"
    };
  }
};

module.exports = getReel;
