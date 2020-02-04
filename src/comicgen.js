/* eslint-disable no-console */
import files from './../files.json'
console.log('files', files)

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
          files['name'][attr].forEach(function(filename) {
            var id = generate_unique_id(attr)
            svg.push(`<g id="${id}" width="${row.width}" height="${row.height}" transform="translate(${row.x},${row.y})"></g>`)

            var img = row.file.replace(/\$([a-z]*)/g, function (match, group) { return group == row.param ? filename : attrs[group] })
            parametricUrls.push({
              getRequest: $.get(`${comicgen.base}svg/${img}.svg`, undefined, undefined, 'text'),
              id: id,
              attr: attr,
              filename: filename,
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
      .done(function(...svg_responses) {
          // svg_responses length is always even. Each consecutive pair is one body part.
          for (var i=0; i<parametricUrls.length; i=i+2) {
            var filename1 = parametricUrls[i]['filename'], filename2 = parametricUrls[i+1]['filename']
            $(parametricUrls[i]['id']).append(svg_responses[i][0])
            $(parametricUrls[i]['id']).append(`<template id="template-${filename1}">${svg_responses[i][0]}</template>`)
            $(parametricUrls[i]['id']).append(`<template id="template-${filename2}">${svg_responses[i+1][0]}</template>`)
          }

          svg.push('</g></svg>')
          node.innerHTML = svg.join('')

          for (var i=0; i<parametricUrls.length; i=i+2) {
            var filename1 = parametricUrls[i]['filename'], filename2 = parametricUrls[i+1]['filename']
            create_parametric_svg(node, filename1, filename2, parametricUrls[i])
          }
        })

    // Add the SVG footer
    svg.push('</g></svg>')
    node.innerHTML = svg.join('')

    // TODO: trigger an event
  })
}


function create_parametric_svg(node, filename1, filename2, paramUrl) {
  var original_id = node.querySelector(`#${paramUrl.id} svg g`).id

  var all_character_tags = node.querySelectorAll('#'+original_id + ' *')

  function get_path_d(start_element, end_element) {
    var start_path_d = start_element.getAttribute('d')
    var end_path_d = end_element.getAttribute('d')
    return flubber.interpolate(start_path_d, end_path_d, { maxSegmentLength: 5 })(slider_val)
  }

  all_character_tags.forEach(function (character_tag) {
    if(!character_tag.id) return

    var visible_svg_element = node.querySelector('#'+character_tag.id)
    var start_element = node.querySelector(`template#template-${filename1} #${character_tag.id}`)
    var end_element = node.querySelector(`template#template-${filename2} #${character_tag.id}`)

    function get_non_path_attr_val(attr) {
      return ($(end_element).attr(attr) - $(start_element).attr(attr))*slider_val + +$(start_element).attr(attr)
    }

    if (start_element.tagName == 'path' && end_element.tagName == 'path') {
      visible_svg_element.setAttribute('d', get_path_d(start_element, end_element))
    } else if (start_element.tagName == 'circle' && end_element.tagName == 'circle') {
      ['cx', 'cy', 'r'].forEach(function(attr) {
        visible_svg_element.setAttribute(attr, get_non_path_attr_val(attr))
      })
    } else if (start_element.tagName == 'ellipse' && end_element.tagName == 'ellipse') {
      ['cx', 'cy', 'rx', 'ry'].forEach(function(attr) {
        visible_svg_element.setAttribute(attr, get_non_path_attr_val(attr))
      })
    }

    var attrNames = ['transform', 'fill', 'stroke', 'stroke-width']
    attrNames.forEach(function (attrName) {
      visible_svg_element.getAttribute(attrName) &&
      end_element.getAttribute(attrName) &&
      visible_svg_element
        .setAttribute(attrName, d3.interpolate($(start_element).attr(attrName), $(end_element).attr(attrName))(slider_val))
    })
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
    width: 200,
    height: 200,
    dirs: [],
    files: {
      face: { param: 'face', file: '$name/face/$face', width: 500, height: 600, x:0, y:0 }
    }
  },
  paramfacebody: {
    width: 200,
    height: 200,
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
