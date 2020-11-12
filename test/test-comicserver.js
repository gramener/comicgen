const fs = require('fs')
const test = require('tape')
const parser = require('fast-xml-parser')
const comic = require('../src/comicserver')

function comicxml(xml) {
  var config = parser.parse(xml, { ignoreAttributes: false, attributeNamePrefix: "" })
  return comic(config.comic)
}

test('comic without options returns an empty string', function (t) {
  t.equal(comic(), '')
  t.end()
})

test('comic loads a single SVG file', function (t) {
  t.equal(
    comicxml('<comic name="dee/side/emotion/afraid.svg"></comic>'),
    fs.readFileSync('svg/dee/side/emotion/afraid.svg', 'utf8'))
  t.end()
})

test('comic parses multiple SVG files', function (t) {
  t.equal(
    comicxml([
      '<comic name="dee/side/emotion/afraid.svg"></comic>',
      '<comic name="dee/side/pose/angry.svg"></comic>'
    ].join('')),
    [
      fs.readFileSync('svg/dee/side/emotion/afraid.svg', 'utf8'),
      fs.readFileSync('svg/dee/side/pose/angry.svg', 'utf8')
    ].join(''))
  t.end()
})



// test('comic loads a single character', function (t) {
//   let result = comic({
//     name: 'dee',
//     angle: 'straight',
//     emotion: 'cry',
//     pose: 'angry'
//   })
//   t.equal(result, fs.readFileSync('test/results/dee-straight-cry-angry.svg', 'utf8'))
//   t.end()
// })
