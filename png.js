var convertor = require('svg-png-converter')
var glob = require('glob')
var fs = require('fs')

glob('./svg/**/*.svg', {}, function (er, files) {
  files.forEach(function (file) {
    fs.mkdir(file.replace(/\/svg\//, '/png/').replace(/\/[^/]+$/, ''), { recursive: true }, function (error) {
      if (error) throw error
      convertor.svg2png({
        input: fs.readFileSync(file),
        encoding: 'buffer',
        format: 'png',
      }).then(function (outputBuffer) {
        fs.writeFileSync(file.replace(/\/svg\//, '/png/').replace(/\.svg/, '.png'), outputBuffer)
      })
    })
  })
})
