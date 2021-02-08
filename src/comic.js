// comicserver() takes a configuration object and returns a fully-rendered SVG
const path = require('path')
const _ = require('lodash')
const cheerio = require('cheerio')
const mustache = require('mustache')
const filesystem = require('../scripts/fs.js')

// TODO: Allow users to override root in options
let root = path.join(__dirname, '..', 'svg')

function comic(template, _replacements) {
  if (!template)
    return ''

  // If options are a string, treat it as a HTML template. Replace all <comic> instances
  else if (typeof template == 'string') {
    // If there is no <comic> tag, just return the string as-is
    if (!template.match(/<\s*comic\b/i))
      return template.trim()
    // Otherwise, replace all <comic> instances via comic()
    let $ = cheerio.load(template, { xmlMode: true })
    $('comic').each(function (index, el) {
      $(el).replaceWith(comic(el.attribs, _replacements))
    })
    _.each(_replacements, replace => {
      if (replace.value)
        $(replace.selector).attr(replace.attr, replace.value)
    })
    return $.html().trim()
  }

  // Else, if we get a dict of options...
  else if (typeof template == 'object') {
    // comic({}) return an empty string
    if (!template.name)
      return ''
    let svg_path = path.join(root, template.name)
    let stat
    try {
      stat = filesystem.statFile(svg_path)
    } catch(e) {
      throw new ComicError(`Unknown character ${template.name}`, { name: template.name })
    }
    // If it’s a directory, read the `index.svg`. Else read the file intself
    if (stat.isDirectory)
      svg_path = path.join(svg_path, 'index.svg')
    let svg = get_template(svg_path)

    // Merge all index.json files in every directory from root to svg_path to get the config
    const config = get_config(svg_path, root)
    // Render the SVG as a template
    const attrs = _.merge({}, config.defaults, template)
    const comic_width_half = config.defaults.width / 2
    const comic_height_half = config.defaults.height / 2
    svg = `
<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMin slice" width="${attrs.width}" height="${attrs.height}" viewBox="0 0 ${config.defaults.width} ${config.defaults.height}">
  <g transform="translate(${comic_width_half},${comic_height_half}) scale(${attrs.scale}) translate(-${comic_width_half},-${comic_height_half}) translate(${attrs.x},${attrs.y})">
    ${mustache.render(svg, attrs)}
  </g>
</svg>`
    // If the template contains a <comic> object, recursively replace it with comic()
    const _replacements = _.mapValues(config.replace, (v, k) => _.merge(v, { value: template[k] }))
    return comic(svg, _replacements)
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
    if (filesystem.existsFile(json_path)) {
      // Load every index.json found
      let subconfig = JSON.parse(filesystem.readFile(json_path))
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
  console.log(svg_path);
  let svg = filesystem.readFile(svg_path)
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
