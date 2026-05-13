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

          // 有些版本用 getBuffer()
          const buffer = data.getBuffer();

          const fileName = `result-${Date.now()}.png`;

          fs.writeFileSync(fileName, buffer);

          resolve({
            mismatch,
            path: fileName,
          });
        } catch (err) {
          reject(err);
        }
      });
  });
}

module.exports = compareImages;