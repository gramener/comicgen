var fs = require('fs')
var glob = require('glob')
var jsbase64 = require('js-base64')
var fabric = require('fabric').fabric

glob('./svg/**/*.svg', {}, function (er, files) {
  files.forEach(function (file) {
    fs.mkdir(file.replace(/\/svg\//, '/png/').replace(/\/[^/]+$/, ''), { recursive: true }, function (error) {
      if (error) throw error
      svg2png(fs.readFileSync(file), function(outputBuffer) {
        fs.writeFileSync(file.replace(/\/svg\//, '/png/').replace(/\.svg/, '.png'), outputBuffer)
      })
    })
  })
})

function svg2png(buffer, callback) {
  var canvas = new fabric.Canvas('c')
  var url = dataToUrl(buffer.toString(), 'svg')
  fabric.Image.fromURL(url, (img) => {
    canvas.add(img)
    const s = canvas.toDataURL({ height: img.height, width: img.width, format: 'png' })
    var buffer = Buffer.from(urlToBase64(s), 'base64')
    callback(buffer)
  })
}

function dataToUrl(data, mimeType, fileName) {
  return base64ToUrl(dataToBase64(data), mimeType, fileName)
}

function urlToBase64(s) {
  return s.substring(s.indexOf(';base64,') + ';base64,'.length)
}

function base64ToUrl(base64, mimeType, fileName) {
  return `data:${mimeType}${fileName ? `;name=${fileName}` : ''};base64,${base64}`
}

function dataToBase64(data) {
  return jsbase64.Base64.encode(data)
}
