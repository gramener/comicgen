var defaults = {
  x: 0,
  y: 0,
  width: 500,
  height: 600,
  scale: 1
}

export default function comicgen(selector, options) {
  // if selector is not specified or false-y, pick all .comicgen elements
  if (!selector)
    selector = document.querySelectorAll('.comicgen')
  // If selector is a string, render all selectors
  else if (typeof selector == 'string')
    selector = document.querySelectorAll(selector)
  // If selector is a node (HTML or SVG), render it
  else if (selector instanceof Element)
    selector = [selector]
  // Otherwise, it must be a NodeList
  else if (!(selector instanceof NodeList))
    throw TypeError('comicgen selector must be a string, HTML/SVG Element, or a NodeList')

  // By now, selector is a node list. Render each node
  Array.from(selector).forEach(function (node) {
    var attr = Object.assign({}, defaults, options)
    for (var j=0; j<node.attributes.length; j++)
      attr[node.attributes[j].name] = node.attributes[j].value

    // TODO: what if the attribute is missing? Use defaults
    // TODO: how to determine the width and height?
    node.innerHTML = [
      '<svg viewBox="' + (-attr.x) + ' ' + (-attr.y) + ' 500 600" width="' + attr.width + '" height="' + attr.height + '" preserveAspectRatio="xMidYMin slice">',
      '<g transform="scale(' + attr.scale + ')">',
      '<image width="500" height="600" xlink:href="' + comicgen.base + 'files/' + attr.name + '/' + attr.angle + '/pose/' + attr.pose + '.svg"/>',
      '<image width="500" height="600" xlink:href="' + comicgen.base + 'files/' + attr.name + '/' + attr.angle + '/emotion/' + attr.emotion + '.svg"/>',
      '</g></svg>'
    ].join('')
    // TODO: trigger an event
  })
}

// This file will be at /dist/comicgen.min.js. Strip out that suffix.
comicgen.base = document.currentScript.src.replace(/dist\/comicgen.min.js$/, '')
document.addEventListener('DOMContentLoaded', function () { comicgen() })
