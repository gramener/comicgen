/* eslint-disable no-console */
import files from './files.json'
import { version } from '../package.json'
import { defaults, namemap, formats } from './characters.json'


export default function comicgen(selector, options) {
  // Selector can be false-y, string selector or DOM node. Defaults to ".comicgen"
  // Convert into a list of nodes
  selector = selector instanceof Element ? [selector] : document.querySelectorAll(selector || '.comicgen')

  // Render each node
  Array.from(selector).forEach(node => {
    // Identify the attributes to add from:
    //    1. attrs = DOM node attributes (#1 priority)
    //    2. options (#2 priority)
    //    3. comicgen.defaults (#3 priority)
    // This ensures that attrs follow the order of the node attribute keys.
    for (var attrs = {}, j = 0, n = node.attributes; j < n.length; j++)
      attrs[n[j].name] = n[j].value
    attrs = Object.assign({}, comicgen.defaults, options, attrs)

    // Based on the name= attribute, figure out which format to use from comicgen.formats.
    // If it's an invalid format, report error and continue with the other elements.
    var format = comicgen.formats[comicgen.namemap[attrs.name]]
    if (!format)
      return console.error('Unknown name="' + attrs.name + '" in', node)

    // If any dirs variable is not set, report an error and continue
    if (!format.dirs.every(attr => attr in attrs))
      return console.error('Missing attr', format.dirs.join(', '), 'in', node)

    // Create a mirror image transformation
    var mirror = attrs.mirror ? `translate(${format.width},0)scale(-1,1)` : ''

    // Build the SVG header
    var svg = [
      `<svg viewBox="${-attrs.x} ${-attrs.y} ${format.width} ${format.height}" width="${attrs.width || format.width}" height="${attrs.height || format.height}" preserveAspectRatio="xMidYMin slice">`,
      `<g transform="scale(${attrs.scale})${mirror}">`
    ]

    let continuousUrls = []
    // Loop through all attributes (e.g. emotion=, pose=, body=, etc)
    // If the attribute is in format.file, there's an image for it. Add it.
    for (var attr in attrs) {
      if (attr in format.files) {
        var row = format.files[attr]
        // Substitute any $variable with the corresponding attribute value
        if (row.continuous) {
          files[attrs['name']][attr].forEach(filename => {
            // replace row.continuous (ex: face, body) with filename (ex: meh, surprise)
            let img = row.file.replace(/\$([a-z]*)/g, (match, group) => group === row.continuous ? filename : attrs[group])
            continuousUrls.push({
              fetch: fetch(`${comicgen.base}svg/${img}.svg`).then(res => res.text()),
              sliderVal: attrs[attr]
            })
          })
        }
        else {
          var img = row.file.replace(/\$([a-z]*)/g, (match, group) => attrs[group])
          svg.push(`<image width="${row.width}" height="${row.height}" transform="translate(${row.x},${row.y})" xlink:href="${comicgen.base}${attrs.ext}/${img}.${attrs.ext}"/>`)
        }
      }
    }

    continuousUrls.length && Promise.all(continuousUrls.map(d => d.fetch))
      .then(svg_responses => {
        let character_svg_container = node.querySelector('svg g')
        character_svg_container.innerHTML = ''
        // One body part is interpolated with 2 consecutive svg responses.
        for (let i = 0; i < continuousUrls.length; i = i + 2) {
          character_svg_container.innerHTML += `<g>${svg_responses[i]}<template>${svg_responses[i]}</template>
            <template>${svg_responses[i + 1]}</template></g>`
          // pass the just inserted svg node to function create_parametric_svg
          create_parametric_svg(character_svg_container.querySelector(`svg g:nth-of-type(${i/2+1})`), continuousUrls[i].sliderVal)
        }
      })

    // Add the SVG footer
    svg.push('</g></svg>')
    node.innerHTML = svg.join('')

    // TODO: trigger an event
  })
}


function create_parametric_svg(node, sliderVal) {
  let character_svg_nodes = node.querySelectorAll(':scope > svg g *')
  Array.from(character_svg_nodes).forEach(character_svg_node => {
    // TODO: Refactor to remove use of IDs
    let startnode = node.querySelector(`template:nth-of-type(1) #${character_svg_node.id}`)
    let endnode = node.querySelector(`template:nth-of-type(2) #${character_svg_node.id}`)
    Array.from(character_svg_node.attributes)
      .map(d => d.nodeName)
      .forEach(attr =>
        character_svg_node.setAttribute(attr,
          attr === 'd' ?
            // For smoother paths and worse performance, reduce "maxSegmentLength" value (defaults to 10).
            flubber.interpolate(startnode.getAttribute(attr), endnode.getAttribute(attr), { maxSegmentLength: 5 })(sliderVal)
            :
            d3.interpolate(startnode.getAttribute(attr), endnode.getAttribute(attr))(sliderVal)
        )
      )
  })
}

// This script may be sourced from:
//  https://cdn.jsdelivr.net/npm/comicgen         -> https://cdn.jsdelivr.net/npm/comicgen/
//  node_modules/comicgen/dist/comicgen.min.js    -> node_modules/comicgen/
// Handle all scenarios and get the base location
comicgen.base = (document.currentScript.src + '/').replace(/[a-z]*\/[a-z.]*\.js\/$/, '')

// Import comicgen version from package.json
comicgen.version = version

// Import character configurations from characters.json
comicgen.defaults = defaults
comicgen.namemap = namemap
comicgen.formats = formats

// This script could be loaded async or not. If async, DOMContentLoaded is already executed.
// So if readyState is not 'loading' (i.e. 'interactive' or 'complete'), run comicgen directly.
// https://javascript.info/onload-ondomcontentloaded
// https://github.com/jquery/jquery/blob/master/src/core/ready.js
if (document.readyState == 'loading')
  document.addEventListener('DOMContentLoaded', () => comicgen())
else
  window.setTimeout(comicgen)
