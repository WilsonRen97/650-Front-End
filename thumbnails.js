const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const srcFolder = path.join(__dirname, "public/images");
const destFolder = path.join(__dirname, "public/thumbnails");

if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder);

fs.readdirSync(srcFolder)
  .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file))
  .forEach((file) => {
    sharp(path.join(srcFolder, file))
      .resize(400) // 寬度 400px
      .rotate() // 根據 EXIF 自動修正方向
      .toFile(path.join(destFolder, file), (err) => {
        if (err) console.error("Error:", file, err);
      });
  });

console.log("Thumbnails generated!");
