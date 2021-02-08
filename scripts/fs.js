const comicdata = require("../src/chars.json");

function readFile(path) {
  path = path.replace(/\\/g, "/");
  console.log(path,"............");

  return comicdata[path]
}

function existsFile(path) {
  path = path.replace(/\\/g, "/");
  if(path in comicdata) return true;
  else return false;
}

function statFile(path) {
  path = path.replace(/\\/g, "/");
  if(comicdata[path] !== '') return {isDirectory: false};
  else return {isDirectory: true};
}

exports.readFile = readFile;
exports.existsFile = existsFile;
exports.statFile = statFile;
