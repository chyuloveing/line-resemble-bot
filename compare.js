const resemble = require("resemblejs");
const fs = require("fs");

async function compareImages(img1, img2) {
  return new Promise((resolve, reject) => {

    resemble(img1)
      .compareTo(img2)
      .onComplete((data) => {

        try {

          // 差異率
          const mismatch = data.misMatchPercentage;

          // 取得差異圖片 buffer
          const buffer = data.getBuffer();

          // 建立 output 資料夾
          if (!fs.existsSync("output")) {
            fs.mkdirSync("output");
          }

          // 檔名
          const fileName = `result-${Date.now()}.png`;

          // 真正存檔位置
          const outputPath = `output/${fileName}`;

          // 寫入圖片
          fs.writeFileSync(outputPath, buffer);

          // 回傳
          resolve({
            mismatch,
            filename: fileName,
          });

        } catch (err) {
          reject(err);
        }

      });

  });
}

module.exports = compareImages;