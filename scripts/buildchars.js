const fs = require('fs')
const path = require('path')
const svg_dir = path.join(__dirname, '..', 'svg')
const chars = {}


// Find all folders under svg/
fs.readdirSync(svg_dir, { withFileTypes: true }).forEach(dirent => {
  if (!dirent.isDirectory())
    return
  const dir = path.join(svg_dir, dirent.name)
  // .. that have an index.json
  const index_file = path.join(dir, 'index.json')
  if (fs.existsSync(index_file)) {
    let index = JSON.parse(fs.readFileSync(index_file, 'utf8'))
    // If it imports another file, use that instead (e.g. bean/index.json -> dee/index.json)
    while (index.import)
      index = JSON.parse(fs.readFileSync(path.join(dir, index.import), 'utf8'))

    // Get dirs from index.json
    const dirs = index.dirs || []
    chars[dirent.name] = {
      dirs: dirs,
      files: getfiles(dir, dirs, dirent.name)
    }
  }
})

function getfiles(folder, dirs, foldername) {
  const files = {}
  // If dirs is empty, just get all SVGs under the sub-folders
  if (dirs.length == 0) {
    let directfolders = new Set(), directfiles = {}
    fs.readdirSync(folder, { withFileTypes: true }).forEach(dirent => {
      if (!dirent.isDirectory()) {
        if (dirent.name.search("index") < 0) {
          if (!files[foldername]) {
            console.log("no");
            files[foldername] = []
          }
          files[foldername].push(dirent.name.replace(/\.svg$/i, ''))
        }

        return
      }


      const option = files[dirent.name] = []

      fs.readdirSync(path.join(folder, dirent.name)).forEach(file => {

        if (file.toLowerCase().endsWith('.svg'))
          option.push(file.replace(/\.svg$/i, ''))
        else {
          fs.readdirSync(path.join(folder, dirent.name, file)).forEach(child => {
            if (child.toLowerCase().endsWith('.svg'))
              if (dirent.name == "bottom" || dirent.name == "head")
                option.push(file + "/" + child.replace(/\.svg$/i, ''))
              else
                option.push(child.replace(/\.svg$/i, ''))
          })
        }
      })
    })
  }
  // If dirs is not empty, e.g. dirs = ['angle', 'direction'], this will take every directory
  // and create sub-dictionaries like {'dir1': ..., 'dir2': ...}. The values will be taken
  // from that folder with dirs = ['direction'] (since we've consumed angle)
  else {
    fs.readdirSync(folder, { withFileTypes: true }).forEach(dirent => {
      if (dirent.isDirectory()) {
        files[dirent.name] = getfiles(path.join(folder, dirent.name), dirs.slice(1))
      }
    })
  }
  return files
}

// Save under dist/characterlist.json
const target_dir = path.join(__dirname, '..', 'dist')
if (!fs.existsSync(target_dir))
  fs.mkdirSync(target_dir)
const target = path.join(target_dir, 'characterlist.json')
fs.writeFileSync(target, JSON.stringify(chars), { encoding: 'utf8' })
