const fs = require("fs");
const path = require("path");

const folder = path.join(__dirname, "public/images");

const imageFiles = fs
  .readdirSync(folder)
  .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));

fs.writeFileSync(
  path.join(__dirname, "public/images.json"),
  JSON.stringify(imageFiles)
);

console.log("images.json generated!");
