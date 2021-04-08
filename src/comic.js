// comicserver() takes a configuration object and returns a fully-rendered SVG
const path = require('path')
const _ = require('lodash')
const cheerio = require('cheerio')
const mustache = require('mustache')
const roughjs = require('roughjs')
const get_config = require('./getconfig').get_config

// TODO: Allow users to override root in options
let root = path.join(__dirname, '..', 'svg')

function comicgen(fs) {
  function comic(template, _replacements) {
    // comic() or comic('') returns just an empty string.
    if (!template)
      return ''

    // If we got a string, treat it as a HTML template. Render all <comic> instances
    else if (typeof template == 'string') {
      // Replace all <comic> instances with the underlying SVG via comic({...})
      let $ = cheerio.load(template, { xmlMode: true })
      $('comic').each(function (index, el) {
        $(el).replaceWith(comic(el.attribs, _replacements))
      })
      // Replace attributes of the SVG, e.g. change fill colors.
      // _replacements is like {name: {selector, attr, value}}.
      // In the SVG, we find all matching selectors and set attr=value
      // Note: Prefer case-insensitive selectors - https://caniuse.com/css-case-insensitive
      // {selector: 'path[fill="#ccc"]'} is case-sensitive. Won't match #CCC.
      // {selector: 'path[fill="#ccc" i]'} is case-INsensitive. It will also match #CCC. Use this.
      _.each(_replacements, replace => {
        if (replace.value && replace.selector)
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
        stat = fs.lstatSync(svg_path)
      } catch(e) {
        throw new ComicError(`Unknown character ${template.name}`, { name: template.name })
      }
      // If it’s a directory, read the `index.svg`. Else read the file intself
      if (stat.isDirectory())
        svg_path = path.join(svg_path, 'index.svg')
      let svg = get_template(svg_path)
      // Merge all index.json files in every directory from root to svg_path to get the config
      const config = get_config(svg_path, root, fs)
      // Render the SVG as a template
      const attrs = _.merge({}, config.defaults, template, comic.functions)
      const comic_width_half = config.defaults.width / 2
      const comic_height_half = config.defaults.height / 2
      const mirror_transform = attrs.mirror ? `translate(${config.defaults.width},0) scale(-1, 1)` : ''
      const aspect = config.aspect || 'xMidYMin slice'
      svg = `
  <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="${aspect}" width="${attrs.width}" height="${attrs.height}" viewBox="0 0 ${config.defaults.width} ${config.defaults.height}">
    <g transform="${mirror_transform} translate(${comic_width_half},${comic_height_half}) scale(${attrs.scale}) translate(-${comic_width_half},-${comic_height_half}) translate(${attrs.x},${attrs.y})">
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

  // These functions can be used by mustache in templates
  comic.functions = {
    roughrect: function () {
      return function (shape, render) {
        let [x, y, w, h, r, t] = shape.split(/[\s,]+/)
        r = +render(r)
        t = +render(t)
        const gap = r + t
        const gen = roughjs.generator({options: {roughness: r}})
        return gen.opsToPath(gen.rectangle(+x+gap, +y+gap, +w-2*gap, +h-2*gap).sets[0])
      }
    }
  }

  // Return the SVG at svg_path. If there is an <import "../path/file.svg">, insert that file here.
  // This is done recursively. That makes this function hard to cache -- since it may involve
  // loading multiple files.
  function get_template(svg_path) {
    let svg = fs.readFileSync(svg_path, { encoding: 'utf-8' })
    return svg.replace(/<\?import\s+(.*?)\?>/, function(match, import_path) {
      return get_template(path.join(svg_path, '..', import_path.replace(/^["']|["']$/g, '')))
    })
  }

  return comic
}

class ComicError extends Error {
  constructor(message, options) {
    super(message)
    this.options = options
  }
}

// Usage:
// const comic = require('../src/comic')(require('fs'))
// const comic = require('../src/comic')(require('fsjson'))
module.exports = comicgen
