const fs = require('fs')
const test = require('tape')
const cheerio = require('cheerio')
const comic = require('../src/comicserver')

function comicparse(html) {
  let $ = cheerio.load(html)
  $('comic').each(function (index, el) {
    $(el).replaceWith(comic(el.attribs))
  })
  return $('body').html()
}

function eq(t, actual, expected, msg) {
  return t.equal(
    cheerio.load(actual.trim()).html(),
    cheerio.load(expected.trim()).html(),
    msg)
}

test('comic without options returns an empty string', function (t) {
  t.equal(comic(), '')
  t.end()
})

test('comic loads a single SVG file', function (t) {
  eq(t,
    comicparse('<comic name="dee/side/emotion/afraid.svg"></comic>'),
    fs.readFileSync('svg/dee/side/emotion/afraid.svg', 'utf8'))
  t.end()
})

test('comic parses multiple SVG files', function (t) {
  eq(t,
    comicparse([
      '<comic name="dee/side/emotion/afraid.svg"></comic>',
      '<comic name="dee/side/pose/shrug.svg"></comic>'
    ].join('')),
    [
      fs.readFileSync('svg/dee/side/emotion/afraid.svg', 'utf8'),
      fs.readFileSync('svg/dee/side/pose/shrug.svg', 'utf8')
    ].join(''))
  t.end()
})

test('comic loads a single character', function (t) {
  let result = comic({
    name: 'dee',
    angle: 'straight',
    emotion: 'cry',
    pose: 'angry'
  })
  t.equal(result, fs.readFileSync('test/results/dee-straight-cry-angry.svg', 'utf8'))
  t.end()
})
