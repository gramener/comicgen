/*
characterlist.json is a dict of characters. Keys are character names. Values are objects with
{patterns, files, lookups, replace}

  "dee": {                                // Character name
    "patterns": [                         // Patterns come from index.svg
      "{{angle}}/emotion/{{emotion}}",    // ?emotion= points to file/folder in {{angle}}/emotion/
      "{{angle}}/pose/{{pose}}"           // ?pose= points to file/folder in {{angle}}/pose/
    ],
    "files": {                            // Folder & file structure
      "side": {
        "emotion": {
          "afraid": "",                   // Files have "" as value
          "angry": "",
          ...
        }
      }
    },
    "lookups": {},                              // TODO: yet to implement
    "replace": {                                // Replacements come from index.json
      "shirt": {                                // ?shirt=
        "type": "color",                        // is an input of type color.
        "selector": "path[fill='#EA9A00' i]",   // It changes all selector elements
        "attr": "fill",                         // Replacing the fill value
        "default": "#EA9A00"                    // ?shirt=#EA9A00 by default
      },
      ...
    }
  },
}
*/

const fs = require("fs");
const path = require("path");
const glob = require("glob");
const cheerio = require("cheerio");
const get_config = require("../src/getconfig").get_config;
const root = path.join(__dirname, "..", "svg").split(path.sep).join(path.posix.sep);

const chars = {};
// Loop through all immediate child folders. Each folder is a character/template
glob.sync(`${root}/*/`).forEach((dirPath) => {
  // Each folder must have both index.svg AND index.json
  const index_svg = path.join(dirPath, "index.svg");
  const index_json = path.join(dirPath, "index.json");
  if (!fs.existsSync(index_svg) || !fs.existsSync(index_json)) return;
  // Load the index.svg (svg) and index.json (config)
  const svg = get_template(path.join(dirPath, "index.svg"));
  const config = get_config(index_json, root, fs);
  // Loop through each node. Every node is a potential character
  const $ = cheerio.load(svg, { xmlMode: true }, false);
  const patterns = $("comic[name]")
    .map((i, node) => {
      const name = node.attribs["name"];
      // If the name ends with .svg, it's a file.
      if (name.match(/\.svg$/i)) return name.replace("{{name}}/", "").replace(/.svg$/i, "");
      // Else, it's a comic character lookup. It should be specified in index.json/lookup
    })
    .get();
  chars[path.basename(dirPath)] = {
    patterns: patterns,
    files: getFiles(dirPath),
    lookups: config.lookups || {},
    replace: config.replace,
    type: config.type,
  };
});

// Fetch all folders and files under a root
function getFiles(dir) {
  const result = {};
  // Visit each file / folder
  fs.readdirSync(dir).forEach((file) => {
    const target = path.join(dir, file);
    if (file.match(/\./)) {
      // If it's a file, just set value as '' (ignoring index.svg/index.json)
      let parts = file.split(".");
      if (parts[0] != "index") result[parts[0]] = "";
    }
    // If it's a folder, set value as the file listing under it
    else result[file] = getFiles(target);
  });
  return result;
}

function get_template(svg_path) {
  let svg = fs.readFileSync(svg_path, { encoding: "utf-8" });
  return svg.replace(/<\?import\s+(.*?)\?>/, function (match, import_path) {
    return get_template(path.join(svg_path, "..", import_path.replace(/^["']|["']$/g, "")));
  });
}

// Save as dist/characterlist.json. Indent for ease of reading
const target_dir = path.join(__dirname, "..", "dist");
if (!fs.existsSync(target_dir)) fs.mkdirSync(target_dir);
const target = path.join(target_dir, "characterlist.json");
fs.writeFileSync(target, JSON.stringify(chars, null, 2), { encoding: "utf8" });

// Create an object representing the file system for use in embedded platforms (e.g. Power BI)
// This is saved as dist/fs.json and is read by src/fsjson.js with fs.readFileSync, etc.
// {
//    "dee" : "",
//    "dee/index.json": "... contents of index.json..."
//    "dee/side": ""
//    ...
// }
const comicdata = {};
glob.sync(`${root}/**/*`).forEach((file) => {
  comicdata[file.replace(`${root}/`, "")] = fs.lstatSync(file).isDirectory() ? "" : fs.readFileSync(file, "utf8");
});
fs.writeFileSync(path.join(__dirname, "..", "dist", "fs.json"), JSON.stringify(comicdata, undefined, 2), "utf-8");
