const comicdata = require("../dist/fs.json");

function readFileSync(path) {
  return comicdata[normalize(path)];
}

function existsSync(path) {
  return normalize(path) in comicdata;
}

function lstatSync(path) {
  return { isDirectory: () => comicdata[normalize(path)] == "" };
}

function normalize(path) {
  return path.replace(/\\/g, "/").split("svg/").pop();
}

exports.readFileSync = readFileSync;
exports.existsSync = existsSync;
exports.lstatSync = lstatSync;
