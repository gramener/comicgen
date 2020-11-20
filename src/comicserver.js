// comicserver() takes a configuration object and returns a fully-rendered SVG
const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')


let comic_root = 'svg/'   // TODO: compute this path

function comic(options) {
  // comic() or comic({}) return an empty string
  if (!options || !options.name)
    return ''
  let filepath = path.join(comic_root, options.name)
  // Using the `name=`, find which template to pick up
  let stat = fs.lstatSync(filepath)
  let svg
  // If the template is an SVG file, read it directly
  if (stat.isFile()) {
    svg = fs.readFileSync(filepath, 'utf8')
  }
  // Else, it’s a folder that should have an `index.svg` and `index.json`
  else if (stat.isDirectory()) {
    svg = fs.readFileSync(path.join(filepath, 'index.svg'), 'utf8')
    // TODO: replace $xxx template values
  }
  else {
    throw new Error('TODO')
  }
  // If the template contains a <comic> object, recursively replace it with comic()
  // parser.parse()
  return comicparse(svg)
}

function comicparse(html) {
  let $ = cheerio.load(html)
  $('comic').each(function (index, el) {
    $(el).replaceWith(comic(el.attribs))
  })
  return $('body').html()
}



module.exports = comic
