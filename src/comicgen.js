// comicserver() takes a configuration object and returns a fully-rendered SVG
const path = require('path')
const _ = require('lodash')
const cheerio = require('cheerio')
const mustache = require('mustache')
const roughjs = require('roughjs')
const interpolate = require('d3-interpolate-path')
const colorInterpolate = require('color-interpolate')
const interpolateNumber = require('./interpolate').number
const interpolateString = require('./interpolate').string
const get_config = require('./getconfig').get_config
const speechbubble = require('./speechbubble')

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

      // Replace interpolation elements
      $('interpolate').each(function (index, el) {
        let $source = $(comic({ name: el.attribs['from'] }, _replacements))
        let $target = $(comic({ name: el.attribs['to'] }, _replacements))
        // TODO: we get all interpolation parameters from index.svg. But they're similar to index.json's replacements.
        // Let's move index.json's replacements into index.svg as <param> elements.
        $('param', el).each(function (index, param) {
          let $param = $(param)
          let selector = $param.attr('selector')
          let key = $param.attr('value')
          let method = $param.attr('method')
          let value = (_replacements[key] || { value: 0 }).value
          let attrs = ($param.attr('attr') || 'fill,stroke,d').split(',')
          attrs.forEach(attr => {
            let sourceVal = $target.find(selector).attr(attr)
            let targetVal = $source.find(selector).attr(attr)
            if (!sourceVal || !targetVal)
              return
            let interpolator = () => sourceVal
            if (method == 'path')
              interpolator = interpolate.interpolatePath(targetVal, sourceVal)
            else if (method == 'color')
              interpolator = colorInterpolate([targetVal, sourceVal])
            else if (method == 'number')
              interpolator = interpolateNumber(targetVal, sourceVal)
            else
              interpolator = interpolateString(targetVal, sourceVal)
            $(selector, $source).attr(attr, interpolator(value))
          })
        })
        $(el).replaceWith($source)
      })
      // Replace attributes of the SVG, e.g. change fill colors.
      // _replacements is like {name: {selector, attr, value}}.
      // In the SVG, we find all matching selectors and set attr=value
      // Note: Prefer case-insensitive selectors - https://caniuse.com/css-case-insensitive
      // {selector: 'path[fill="#ccc"]'} is case-sensitive. Won't ma\tch #CCC.
      // {selector: 'path[fill="#ccc" i]'} is case-INsensitive. It will also match #CCC. Use this.
      _.each(_replacements, replace => {
        if (replace.value && replace.selector) {
          let $el = $(replace.selector)
          replace.attr.split(/[, ]+/g).forEach(attr => {
            if ($el.is(`[${attr}]`))
              $el.attr(attr, replace.value)
          })
        }
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
      // Merge all index.json files in every directory from root to svg_path to get the config
      const config = get_config(svg_path, root, fs)
      // Render the SVG as a template
      const attrs = _.merge({
        speechbubble: () => (text, render) => speechbubble({ ...attrs, text: render(text) })
      }, config.defaults, template, comic.functions)
      let width = +attrs.width || config.defaults.width
      let height = +attrs.height || config.defaults.height
      const comic_width_half = width / 2
      const comic_height_half = height / 2
      const mirror_transform = attrs.mirror ? `translate(${width},0) scale(-1, 1)` : ''
      const aspect = config.aspect || 'xMidYMin slice'
      // Characters with a default width & height are drawn to that viewBox.
      // Others (like speechbubbles) are drawn dynamically based on width/height, and have no viewBox
      const viewBox = config.defaults.width && config.defaults.height ? `viewBox="0 0 ${config.defaults.width} ${config.defaults.height}"` : ''
      // If there's a ?box=<thickness>, add a panel around the strip.
      //    ?boxcolor= defines the color. Default: black
      //    ?boxgap= defines the box padding. Default: max(box, jitter)
      let box = ''
      if (attrs.box) {
        const gen = roughjs.generator({ options: { seed: 1, bowing: 2, roughness: Math.max(2, Math.min(attrs.box / 2, 5)) } })
        let padding = +attrs.boxgap || +attrs.box
        let path = gen.opsToPath(gen.rectangle(padding / 2, padding / 2, width - padding, height - padding).sets[0])
        box = `<path d="${path}" fill="none" stroke="${attrs.boxcolor || 'black'}" stroke-width="${attrs.box}"></path>`
      }
      // TODO: check if overflow is working
      const overflow = attrs.box ? '' : 'style="overflow:visible"'
      let svg = get_template(svg_path)
      svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ${overflow}>
    ${box}
    <svg ${viewBox} preserveAspectRatio="${aspect}" width="${config.defaults.width || '100%'}" height="${config.defaults.height || '100%'}" ${overflow}>
      <g transform="${mirror_transform} translate(${comic_width_half},${comic_height_half}) scale(${attrs.scale}) translate(-${comic_width_half},-${comic_height_half}) translate(${attrs.x},${attrs.y})">
        ${render(svg, attrs)}
      </g>
    </svg>
  </svg>`
      // If the template contains a <comic> object, recursively replace it with comic().
      // Get the replacement parameters from the template object, or the parent replacements object.
      const _new_replacements = _.mapValues(config.replace, (v, k) => _.merge(v, { value: template[k] || _replacements?.[k]?.value }))
      return comic(svg, _new_replacements)
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
        const gen = roughjs.generator({options: {roughnesss: r}})
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

  function render(svg, attrs) {
    return mustache.render(svg, attrs)
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
// const comicgen = require('comicgen')(require('fs'))
// const comicgen = require('comicgen')(require('fsjson'))
module.exports = comicgen
