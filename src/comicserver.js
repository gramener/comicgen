// comicserver() takes a configuration object and returns a fully-rendered SVG
const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const cheerio = require('cheerio')
const mustache = require('mustache')

// TODO: Allow users to override root in options
let root = path.join(__dirname, '..', 'svg')

function comic(options) {
  if (!options)
    return ''

  // If options are a string, treat it as a HTML template. Replace all <comic> instances
  else if (typeof options == 'string') {
    // If there is no <comic> tag, just return the string as-is
    if (!options.match(/<\s*comic\b/i))
      return options.trim()
    // Otherwise, replace all <comic> instances via comic()
    let $ = cheerio.load(options, { xmlMode: true })
    $('comic').each(function (index, el) {
      $(el).replaceWith(comic(el.attribs))
    })
    return $.html().trim()
  }

  // Else, if we get a dict of options...
  else if (typeof options == 'object') {
    // comic({}) return an empty string
    if (!options.name)
      return ''
    let filepath = path.join(root, options.name)
    let stat
    try {
      stat = fs.lstatSync(filepath)
    } catch(e) {
      throw new ComicError(`Unknown character ${options.name}`, { name: options.name })
    }
    // If it’s a directory, read the `index.svg`. Else read the file intself
    if (stat.isDirectory())
      filepath = path.join(filepath, 'index.svg')
    let svg
    try {
      svg = fs.readFileSync(filepath , 'utf8')
    } catch(e) {
      throw new ComicError(`Missing ${options.name}/index.svg`, { name: options.name })
    }

    // Load all index.json files in every directory from root to filepath
    const config = getconfig(filepath, root)
    // Render the SVG as a template
    svg = mustache.render(svg, _.merge({
      comic_width: config.defaults.width,
      comic_height: config.defaults.height,
      comic_width_half: config.defaults.width / 2,
      comic_height_half: config.defaults.height / 2,
    }, config.defaults, options))

    // If the template contains a <comic> object, recursively replace it with comic()
    return comic(svg)
  }
  else
    throw new Error('TODO')
}


function getconfig(filepath, root) {
  let dirs = path.relative(root, filepath).split(path.sep)
  let config = {}
  dirs.forEach(function (dir, index) {
    const json_path = path.join(root, ...dirs.slice(0, index), 'index.json')
    if (fs.existsSync(json_path)) {
      let subconfig = JSON.parse(fs.readFileSync(json_path, 'utf8'))
      let baseconfig = subconfig.extends ? getconfig(subconfig.extends) : {}
      _.merge(config, baseconfig, subconfig)
    }
  })
  return config
}


class ComicError extends Error {
  constructor(message, options) {
    super(message)
    this.options = options
  }
}


module.exports = comic
