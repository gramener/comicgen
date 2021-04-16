/*
characterlist.json is a dict of characters. Keys are character names. Values are objects with
{files, pattern, replace}

{
  "aryan": {                    // Character name
    "files": {                  // File structure
      "emotion": {              //  All folders are keys
        "angry": "",            //  All files are keys too
        "blush": "",            //  Files have "" as value
        ...
      },
      "pose": {
        "handsfolded": "",
        "handsinpocket": ""
      }
    },
    "patterns": [               // Patterns come from index.json
      "emotion/{emotion}",      // ?emotion= can be any file/folder in aryan/emotion/*
      "pose/{pose}"             // ?pose= can be any file/folder in aryan/pose/*
    ],
    "replace": {                // Replacements come from index.json
      "shirt": {
        "type": "color",
        "selector": "path[fill='#EA9A00' i]",
        "attr": "fill",
        "default": "#EA9A00"
      },
      ...
    }
  },
}
*/

const fs = require('fs')
const path = require('path')
const glob = require('glob')
const get_config = require('../src/getconfig').get_config
const root = path.join(__dirname, '..', 'svg').split(path.sep).join(path.posix.sep)

const chars = {}
// Loop through all characters
glob.sync(`${root}/*/`).forEach(dir_path => {
  // Load the index.json
  const index_file = path.join(dir_path, 'index.json')
  if (fs.existsSync(index_file)) {
    // Read the index.json and create the character definition
    let config = get_config(index_file, root, fs)
    chars[path.basename(dir_path)] = {
      patterns: config.patterns || [],
      files: getFiles(dir_path),
      replace: config.replace
    }
  }
})

// Fetch all folders and files under a root
function getFiles(dir) {
  const result = {}
  // Visit each file / folder
  fs.readdirSync(dir).forEach(file => {
    const target = path.join(dir, file)
    if (file.match(/\./)) {
      // If it's a file, just set value as '' (ignoring index.svg/index.json)
      let parts = file.split('.')
      if (parts[0] != 'index')
        result[parts[0]] = ''
    } else
      // If it's a folder, set value as the file listing under it
      result[file] = getFiles(target)
  })
  return result
}

// Save as dist/characterlist.json. Indent for ease of reading
const target_dir = path.join(__dirname, '..', 'dist')
if (!fs.existsSync(target_dir))
  fs.mkdirSync(target_dir)
const target = path.join(target_dir, 'characterlist.json')
fs.writeFileSync(target, JSON.stringify(chars, null, 2), { encoding: 'utf8' })


// Create an object representing the file system for use in embedded platforms (e.g. Power BI)
// This is saved as dist/fs.json and is read by src/fsjson.js with fs.readFileSync, etc.
// {
//    "dee" : "",
//    "dee/index.json": "... contents of index.json..."
//    "dee/side": ""
//    ...
// }
const comicdata = {}
glob.sync(`${root}/**/*`).forEach(file => {
  comicdata[file.replace(`${root}/`, '')] = fs.lstatSync(file).isDirectory() ? '' : fs.readFileSync(file, 'utf8')
})
fs.writeFileSync(path.join(__dirname, '..', 'dist', 'fs.json'), JSON.stringify(comicdata, undefined, 2), 'utf-8')
