/* eslint-disable no-console */
import files from './../files.json'

var unique_id_counter = 0
function generate_unique_id(attr_key) {
  return 'gcontainer-' + attr_key + unique_id_counter++ 
}

export default function comicgen(selector, options) {
  // Selector can be false-y, string selector or DOM node. Defaults to ".comicgen"
  // Convert into a list of nodes
  selector = selector instanceof Element ? [selector] : document.querySelectorAll(selector || '.comicgen')

  // Render each node
  Array.from(selector).forEach(function (node) {
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
    if (!format.dirs.every(function (attr) { return attr in attrs }))
      return console.error('Missing attr', format.dirs.join(', '), 'in', node)

    // Create a mirror image transformation
    var mirror = attrs.mirror ? `translate(${format.width},0)scale(-1,1)` : ''

    // Build the SVG header
    var svg = [
      `<svg viewBox="${-attrs.x} ${-attrs.y} ${format.width} ${format.height}" width="${attrs.width || format.width}" height="${attrs.height || format.height}" preserveAspectRatio="xMidYMin slice">`,
      `<g transform="scale(${attrs.scale})${mirror}">`
    ]

    var parametricUrls = []
    // Loop through all attributes (e.g. emotion=, pose=, body=, etc)
    // If the attribute is in format.file, there's an image for it. Add it.
    for (var attr in attrs) {
      if (attr in format.files) {
        var row = format.files[attr]
        // Substitute any $variable with the corresponding attribute value
        if (row.param) {
          var sliderVal = attrs[attr]

          files[attrs['name']][attr].forEach(function(filename) {
            var id = generate_unique_id(attr)
            svg.push(`<g id="${id}"></g>`)

            var img = row.file.replace(/\$([a-z]*)/g, function (match, group) { return group == row.param ? filename : attrs[group] })
            parametricUrls.push({
              getRequest: $.get(`${comicgen.base}svg/${img}.svg`, undefined, undefined, 'text'),
              id: id,
              sliderVal: sliderVal
            })
          })
        }
        else {
          var img = row.file.replace(/\$([a-z]*)/g, function (match, group) { return attrs[group] })
          svg.push(`<image width="${row.width}" height="${row.height}" transform="translate(${row.x},${row.y})" xlink:href="${comicgen.base}${attrs.ext}/${img}.${attrs.ext}"/>`)
        }
      }
    }

    $.when(...parametricUrls.map(function(d) {return d.getRequest}))
      .done(function (...svg_responses) {
        // svg_responses length is always even. Each consecutive pair is one body part.
        for (var i = 0; i < parametricUrls.length; i = i + 2) {
          $('#'+parametricUrls[i]['id']).append(svg_responses[i][0])
          $('#'+parametricUrls[i]['id']).append(`<template>${svg_responses[i][0]}</template>`)
          $('#'+parametricUrls[i]['id']).append(`<template>${svg_responses[i + 1][0]}</template>`)
          create_parametric_svg(node, parametricUrls[i])
        }
      })

    // Add the SVG footer
    svg.push('</g></svg>')
    node.innerHTML = svg.join('')

    // TODO: trigger an event
  })
}


function create_parametric_svg(node, param) {
  var original_id = node.querySelector(`#${param.id} svg g`).id
  var all_character_tags = node.querySelectorAll('#'+original_id + ' *')

  function get_path_d(attr, start_element, end_element) {
    var start_path_d = start_element.getAttribute(attr)
    var end_path_d = end_element.getAttribute(attr)
    return flubber.interpolate(start_path_d, end_path_d, { maxSegmentLength: 0.2 })(param.sliderVal)
  }

  function get_non_path_attr_val(attr, start_element, end_element) {
    return ($(end_element).attr(attr) - $(start_element).attr(attr)) * param.sliderVal + +$(start_element).attr(attr)
  }

  function cosmetic_props(attr, start_element, end_element) {
    return d3.interpolate($(start_element).attr(attr), $(end_element).attr(attr))(param.sliderVal)
  }

  var interpolatorMap = {
    'transform': cosmetic_props, 
    'fill': cosmetic_props, 
    'stroke': cosmetic_props, 
    'stroke-width': cosmetic_props,
    'd': get_path_d,
    'cx': get_non_path_attr_val,
    'cy': get_non_path_attr_val,
    'r': get_non_path_attr_val,
    'rx': get_non_path_attr_val,
    'ry': get_non_path_attr_val,
  }
  var elementTypes = {
    path: {
      attributes: ['d']
    },
    circle: {
      attributes: ['cx', 'cy', 'r']
    },
    ellipse: {
      attributes: ['cx', 'cy', 'rx', 'ry']
    }
  }

  all_character_tags.forEach(function (character_tag) {
    if(!character_tag.id) return

    var real_element = node.querySelector(`#${param.id} #${character_tag.id}`)
    var start_element = node.querySelector(`#${param.id} template:nth-child(2)`).content
      .cloneNode(true).querySelector(`#${character_tag.id}`)
    var end_element = node.querySelector(`#${param.id} template:nth-child(3)`).content
      .cloneNode(true).querySelector(`#${character_tag.id}`)

    let elementType = elementTypes[start_element.tagName]
    elementType && elementType['attributes'].concat(['transform', 'fill', 'stroke', 'stroke-width'])
      .forEach(d => real_element.getAttribute(d) && 
        real_element.setAttribute(d, interpolatorMap[d](d, start_element, end_element))
        )
  })
}

// This script may be sourced from:
//  https://cdn.jsdelivr.net/npm/comicgen         -> https://cdn.jsdelivr.net/npm/comicgen/
//  node_modules/comicgen/dist/comicgen.min.js    -> node_modules/comicgen/
// Handle all scenarios and get the base location
comicgen.base = (document.currentScript.src + '/').replace(/[a-z]*\/[a-z.]*\.js\/$/, '')

// If no options are provided, use these default options.
// This is equivalent to adding a `x="0" y="0" scale="1" mirror=""` to each comicgen.
comicgen.defaults = {
  x: 0,
  y: 0,
  scale: 1,
  ext: 'svg',
  mirror: '',
}

// We pick characters from multiple sources / people, and each have their format.
// comicgen.namemap maps the character name to the format.
// This is intentionally exposed publicly, and can be changed / extended by others.
comicgen.namemap = {
  aryan: 'emotionpose',
  ava: 'emotionpose',
  bean: 'deedey',
  chini: 'paramface',
  panda: 'paramface',
  zoozoo: 'paramfacebody',
  dee: 'deedey',
  dey: 'deedey',
  evan: 'emotionpose',
  facesketch: 'facesketch',
  humaaans: 'humaaans',
  jaya: 'emotionpose',
  priya: 'deedey',
  ringo: 'deedey',
  speechbubbles: 'speechbubbles',
  zoe: 'emotionpose'
}

// Defines the format for characters. Each format has:
//  width: default width of the SVG container
//  height: default height of the SVG container
//  dirs: list of directory tree attrs. For example, ["angle"] means
//      that the file is under svg/$name/$angle/...
//  files: dict of {attr: filespec}. If the attr is set, draw the image
//  filespec is a dict of:
//      file: file template, where $<var> is replaced by the value of var="..."
//      width: actual width of the SVG image
//      height: actual height of the SVG image
//      x: x-offset of the SVG image
//      y: y-offset of the SVG image
comicgen.formats = {
  paramface: {
    width: 500,
    height: 600,
    dirs: [],
    files: {
      face: { param: 'face', file: '$name/face/$face', width: 500, height: 600, x:0, y:0 }
    }
  },
  paramfacebody: {
    width: 500,
    height: 600,
    dirs: [],
    files: {
      face: { param: 'face', file: '$name/face/$face', width: 500, height: 600, x:0, y:0 },
      body: { param: 'body', file: '$name/body/$body', width: 500, height: 600, x:0, y:0 }
    }
  },
  deedey: {
    width: 500,
    height: 600,
    dirs: ['angle'],
    files: {
      emotion: { file: '$name/$angle/emotion/$emotion', width: 500, height: 600, x: 0, y: 0 },
      pose:    { file: '$name/$angle/pose/$pose',       width: 500, height: 600, x: 0, y: 0 }
    }
  },
  emotionpose: {
    width: 500,
    height: 600,
    dirs: [],
    files: {
      emotion: { file: '$name/emotion/$emotion', width: 500, height: 600, x: 0, y: 0 },
      pose: { file: '$name/pose/$pose', width: 500, height: 600, x: 0, y: 0 }
    }
  },
  humaaans: {
    width: 300,
    height: 600,
    dirs: [],
    files: {
      // We don't cover scenes and objects yet.
      // scene: { file: '$name/scene/$scene' },
      // object: { file: '$name/objects/$object', x: 0, y: 0 }
      head:   { file: '$name/head/$head',     width: 136, height: 104, x: 63, y: 0 },
      bottom: { file: '$name/bottom/$bottom', width: 300, height: 238, x: -15, y: 199 },
      body:   { file: '$name/body/$body',     width: 256, height: 187, x: 0, y: 85 }
    }
  },
  facesketch: {
    width: 180,
    height: 200,
    dirs: [],
    files: {
      face: { file: '$name/face/$face',    width: 180, height: 200, x: 0, y: 0 },
      hair: { file: '$name/hair/$hair',    width: 180, height: 200, x: 0, y: 0 },
      eye: { file: '$name/eye/$eye',       width: 180, height: 200, x: 0, y: 0 },
      mouth: { file: '$name/mouth/$mouth', width: 180, height: 200, x: 0, y: 0 },
      nose: { file: '$name/nose/$nose',    width: 180, height: 200, x: 0, y: 0 }
    }
  },
  speechbubbles: {
    width: 500,
    height: 600,
    dirs: [],
    files: {
      speechbubble: { file: '$name/$speechbubble', width: 200, height: 200, x: 40, y:110 }
    }
  }
}

// This script could be loaded async or not. If async, DOMContentLoaded is already executed.
// So if readyState is not 'loading' (i.e. 'interactive' or 'complete'), run comicgen directly.
// https://javascript.info/onload-ondomcontentloaded
// https://github.com/jquery/jquery/blob/master/src/core/ready.js
if (document.readyState == 'loading')
  document.addEventListener('DOMContentLoaded', function () { comicgen() })
else
  window.setTimeout(comicgen)
