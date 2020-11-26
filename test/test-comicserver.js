const fs = require('fs')
const process = require('process')
const test = require('tape')
const parser = require('fast-xml-parser')
const comic = require('../src/comicserver')

const argv = require('minimist')(process.argv.slice(2))
const regenerate = argv._.indexOf('regenerate') >= 0


function eq(t, actual, expected, msg) {
  return t.deepEqual(
    parser.parse(actual.trim(), { ignoreAttributes: false }),
    parser.parse(expected.trim(), { ignoreAttributes: false }),
    msg)
}

test('comic without options returns an empty string', function (t) {
  t.equal(comic(), '')
  t.end()
})

test('comic loads a single SVG file', function (t) {
  eq(t,
    comic('<comic name="dee/side/emotion/afraid.svg"></comic>'),
    fs.readFileSync('svg/dee/side/emotion/afraid.svg', 'utf8'))
  t.end()
})

test('comic parses multiple SVG files', function (t) {
  eq(t,
    comic([
      '<comic name="dee/side/emotion/afraid.svg"></comic>',
      '<comic name="dee/side/pose/shrug.svg"></comic>'
    ].join('')),
    [
      fs.readFileSync('svg/dee/side/emotion/afraid.svg', 'utf8'),
      fs.readFileSync('svg/dee/side/pose/shrug.svg', 'utf8')
    ].join(''))
  t.end()
})

test('comic loads a single character as XML attributes or JSON config', function (t) {
  const expected_file = 'test/results/dee-straight-cry-angry.svg'
  let actual = comic({
    name: 'dee',
    angle: 'straight',
    emotion: 'cry',
    pose: 'angry'
  })
  if (regenerate)
    fs.writeFileSync(expected_file, actual)
  eq(t, actual, fs.readFileSync(expected_file, 'utf8'))
  actual = comic('<comic name="dee" angle="straight" emotion="cry" pose="angry">')
  eq(t, actual, fs.readFileSync(expected_file, 'utf8'))
  t.end()
})
