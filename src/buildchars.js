const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const glob = require('glob')
const get_config = require('../src/getconfig').get_config
const root = path.join(__dirname, '..', 'svg').split(path.sep).join(path.posix.sep)

// Create a dist/characterlist.json that has all characters.
// The keys are character names, e.g. {"aryan": {}, "dee": {}, etc}
// The values have 2 keys.
//    "dirs": list of arguments that map to sub-folders, e.g. ["angle"]
// If "dirs" is empty, i.e "dirs": [], then the 2nd key, "files" looks like this:
//    "files": {directory: [list of SVG file names]}, e.g. {"emotion": ["angry", "blush"]}
// If "dirs" is NOT empty, e.g. "dirs": ["angle"], "files" looks like this
//    "files": {angle-directory: {directory: [list of SVG file names]}}
// The number of nested directories in files is the length of "dirs".
// TODO: Explain this better.

// Find all folders under svg/
const chars = {}
glob.sync(`${root}/*/`).forEach(dir_path => {
  const index_file = path.join(dir_path, 'index.json')
  if (fs.existsSync(index_file)) {
    let config = get_config(index_file, root, fs)
    const dirs = config.dirs || []
    chars[path.basename(dir_path)] = {
      dirs: dirs,
      files: getfiles(dir_path, dirs),
      replace: config.replace
    }
  }
})

function getfiles(dir_path, dirs) {
  // Get all subdirectories under dir_path
  const subdirs = glob.sync(`${dir_path}/*/`).map(v => path.basename(v))
  // If dirs has a length, {subdir: getfiles(subdir, dirs[:-1])}
  if (dirs.length > 0)
    return _.fromPairs(_.zip(subdirs, subdirs.map(subdir => getfiles(`${dir_path}/${subdir}`, dirs.slice(0, dirs.length - 1)))))
  // Else return {subdir: [all non-index SVG files anywhere under subdir]}
  if (subdirs.length > 0)
    return _.fromPairs(_.zip(subdirs, subdirs.map(subdir => {
      const base = `${dir_path}/${subdir}`
      return glob.sync(`${base}/**/*.svg`)
        // Ignore .svg extension. Ignore prefix. But for characters like Humaaans,
        // there may be a sub-folder structure, e.g. head: ["front/afro", "..."]
        .map(v => v.replace(/\.svg$/i, '').slice(base.length))
        // Ignore index.svg
        .filter(v => v != 'index')
    })))
}

// Save under dist/characterlist.json
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
