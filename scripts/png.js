const fs = require('fs')
const cliProgress = require('cli-progress');
const glob = require('glob')
const jsbase64 = require('js-base64')
const fabric = require('fabric').fabric

const progressBar = new cliProgress.SingleBar({
    format: ' >> [\u001B[35m{bar}\u001b[0m] {percentage}% | ETA: {eta}s | {value}/{total}',
    barGlue: '\u001B[34m',
    barCompleteChar: '\u2591',
    barIncompleteChar: '\u2591',
    stopOnComplete: true
  })


glob('./svg/**/*.svg', {}, function (er, files) {
  if (er) console.error(er)
  const filesCount = files.length
  progressBar.start(filesCount, 0)
  let fileCounter = 0
  files.forEach(function (file) {
    fs.mkdir(file.replace(/\/svg\//, '/png/').replace(/\/[^/]+$/, ''), { recursive: true }, function (error) {
      if (error) throw error
      let path = file.replace(/\/svg\//, '/png/').replace(/\.svg/, '.png')
      progressBar.update(++fileCounter)
      if (fs.existsSync(path)) return
      svg2png(fs.readFileSync(file), function(outputBuffer) {
        fs.writeFileSync(path, outputBuffer)
      })
    })
  })
})

function svg2png(buffer, callback) {
  let canvas = new fabric.Canvas('c')
  let url = dataToUrl(buffer.toString(), 'svg')
  fabric.Image.fromURL(url, (img) => {
    canvas.add(img)
    const s = canvas.toDataURL({ height: img.height, width: img.width, multiplier: 2, enableRetinaScaling: true, format: 'png' })
    const buffer = Buffer.from(urlToBase64(s), 'base64')
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
