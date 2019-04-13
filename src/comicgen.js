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

// This script may be sourced from:
//  https://cdn.jsdelivr.net/npm/comicgen         -> https://cdn.jsdelivr.net/npm/comicgen
//  node_modules/comicgen/dist/comicgen.min.js    -> node_modules/comicgen/
// Handle all scenarios and get the base location
comicgen.base = (document.currentScript.src + '/').replace(/[a-z]*\/[a-z.]*\.js\/$/, '')

comicgen.defaults = {
  x: 0,
  y: 0,
  width: 500,
  height: 600,
  scale: 1,
  mirror: 0
}

// This script could be loaded async or not. If async, DOMContentLoaded is already executed.
// So if readyState is not 'loading' (i.e. 'interactive' or 'complete'), run comicgen directly.
// https://javascript.info/onload-ondomcontentloaded
if (document.readyState == 'loading')
  document.addEventListener('DOMContentLoaded', function () { comicgen() })
else
  comicgen()
