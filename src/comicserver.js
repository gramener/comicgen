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
    let svg_path = path.join(root, options.name)
    let stat
    try {
      stat = fs.lstatSync(svg_path)
    } catch(e) {
      throw new ComicError(`Unknown character ${options.name}`, { name: options.name })
    }
    // If it’s a directory, read the `index.svg`. Else read the file intself
    if (stat.isDirectory())
      svg_path = path.join(svg_path, 'index.svg')
    let svg = get_template(svg_path)

    // Merge all index.json files in every directory from root to svg_path to get the config
    const config = get_config(svg_path, root)
    // Render the SVG as a template
    const comic_attrs = _.merge({
      comic_width: config.defaults.width,
      comic_height: config.defaults.height,
      comic_width_half: config.defaults.width / 2,
      comic_height_half: config.defaults.height / 2
    }, config.defaults, options)
    svg = mustache.render(svg, comic_attrs)

    // If the template contains a <comic> object, recursively replace it with comic()
    return comic(svg)
  }
  else
    throw new Error('TODO')
}


// Get config from index.json for an SVG file. Search in the svg_path directory and all parent
// directories up to root.
// TODO: cache this
function get_config(svg_path, root) {
  let dirs = path.relative(root, svg_path).split(path.sep)
  let config = {}
  dirs.forEach(function (dir, index) {
    // Search for index.json in all folders from the filepath up to root
    const json_path = path.join(root, ...dirs.slice(0, index), 'index.json')
    if (fs.existsSync(json_path)) {
      // Load every index.json found
      let subconfig = JSON.parse(fs.readFileSync(json_path, 'utf8'))
      // If it has is an "import", import that configuration
      if (subconfig.import) {
        const extend_path = path.join(json_path, '..', subconfig.import)
        _.merge(config, get_config(extend_path, root))
        _.unset(subconfig, 'import')
      }
      // In any case, merge this index.json
      _.merge(config, subconfig)
    }
  })
  return config
}


function get_template(svg_path) {
  let svg = fs.readFileSync(svg_path, 'utf8')
  return svg.replace(/<\?import\s+(.*?)\?>/, function(match, import_path) {
    return get_template(path.join(svg_path, '..', import_path.replace(/^["']|["']$/g, '')))
  })
}

class ComicError extends Error {
  constructor(message, options) {
    super(message)
    this.options = options
  }
}


module.exports = comic
