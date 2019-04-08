export default function comicgen(selector, options) {
  // Selector can be false-y (defaults to ".comicgen"), string selector or DOM node
  // Convert into a list of nodes
  selector = selector instanceof Element ? [selector] : document.querySelectorAll(selector || '.comicgen')

  // Render each node
  Array.from(selector).forEach(function (node) {
    var attr = Object.assign({}, comicgen.defaults, options)
    for (var j=0, n=node.attributes; j<n.length; j++)
      attr[n[j].name] = n[j].value
    var mirror = attr.mirror ? 'translate(500,0)scale(-1,1)' : ''
    node.innerHTML = [
      `<svg viewBox="${-attr.x} ${-attr.y} 500 600" width="${attr.width}" height="${attr.height}" preserveAspectRatio="xMidYMin slice">`,
      `<g transform="scale(${attr.scale})${mirror}">`,
      `<image width="500" height="600" xlink:href="${comicgen.base}files/${attr.name}/${attr.angle}/pose/${attr.pose}.svg"/>`,
      `<image width="500" height="600" xlink:href="${comicgen.base}files/${attr.name}/${attr.angle}/emotion/${attr.emotion}.svg"/>`,
      '</g></svg>'
    ].join('')
    // TODO: trigger an event
  })
}

// This file will be at /dist/comicgen.min.js. Strip out that suffix.
comicgen.base = document.currentScript.src.replace(/.*?\/.*?$/, '')

comicgen.defaults = {
  x: 0,
  y: 0,
  width: 500,
  height: 600,
  scale: 1,
  mirror: 0
}


document.addEventListener('DOMContentLoaded', function () { comicgen() })
