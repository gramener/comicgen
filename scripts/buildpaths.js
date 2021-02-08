const fs = require("fs");
const path = require("path");
const dirTree = require("directory-tree");

const dir = path.join(__dirname, "..", "svg");

const tree = dirTree(dir,{normalizePath : true});
let comicdata = {}

console.log(tree);
function getpath(files) {
  files.forEach(child => {
    // console.log(child.path);
    if(child.type == 'directory'){
      comicdata[child.path] = ''
      getpath(child.children)
    }
    else{
      comicdata[child.path] = fs.readFileSync(child.path, 'utf8')
    }
  });
}
getpath(tree.children)
fs.writeFile(
  "./src/chars.json",
  JSON.stringify(comicdata, undefined, 4),
  "utf-8",
  function (err) {
    if (err) throw err;
    console.log("Done!");
  }
);
