const express = require("express");
const line = require("@line/bot-sdk");
const fs = require("fs");
const compareImages = require("./compare");

const app = express();

app.use("/output", express.static("output"));

app.use(express.static(__dirname));

// ======================
// LINE 設定
// ======================
const config = {
 channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

// 暫存圖片
const userImages = {};

// ======================
// webhook
// ======================
app.post("/webhook", line.middleware(config), async (req, res) => {
  console.log("📩 webhook");

  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// ======================
// handle event
// ======================
async function handleEvent(event) {
  try {
    if (!event || event.type !== "message") return;

    const msg = event.message;

    // ===== text =====
    if (msg.type === "text") {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "請傳兩張圖片給我 📷",
      });
    }

    // ===== image =====
    if (msg.type === "image") {
      const userId = event.source.userId;

      const stream = await client.getMessageContent(msg.id);

      const filePath = `img-${Date.now()}.jpg`;
      const writeStream = fs.createWriteStream(filePath);

      stream.pipe(writeStream);

      await new Promise((resolve) =>
        writeStream.on("finish", resolve)
      );

      if (!userImages[userId]) {
        userImages[userId] = [];
      }

      userImages[userId].push(filePath);

      // 第一張
      if (userImages[userId].length === 1) {
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "收到第一張 📷，請再傳第二張",
        });
      }

      // 第二張 → 比對
      if (userImages[userId].length === 2) {
        const [img1, img2] = userImages[userId];

        console.log("🧠 比對中...");

        const result = await compareImages(img1, img2);

        const baseUrl = "https://line-resemble-bot.onrender.com";
        const imageUrl = `${baseUrl}/output/${result.filename}`;

        userImages[userId] = [];

        return client.replyMessage(event.replyToken, [
          {
            type: "text",
            text: `🧠 比對完成\n📊 差異率：${result.mismatch}%`,
          },
          {
            type: "image",
            originalContentUrl: imageUrl,
            previewImageUrl: imageUrl,
          },
        ]);
      }
    }
  } catch (err) {
    console.error("handleEvent error:", err);
  }
}

// ======================
// start server
// ======================
const PORT = 3000;

app.listen(PORT, () => {
  console.log("🚀 http://localhost:" + PORT);
});