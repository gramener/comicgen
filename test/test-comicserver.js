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


function check(t, expected_file, options) {
  let actual = comic(options)
  if (regenerate)
    fs.writeFileSync(expected_file, actual)
  eq(t, actual, fs.readFileSync(expected_file, 'utf8'))
}

test('comic loads a single character as XML attributes or JSON config', function (t) {
  check(t, 'test/results/dee-straight-cry-angry.svg',
    { name: 'dee', angle: 'straight', emotion: 'cry', pose: 'angry' })
  check(t, 'test/results/dee-straight-cry-angry.svg',
    '<comic name="dee" angle="straight" emotion="cry" pose="angry">')
  t.end()
})

test('comic ignores missing attributes', function (t) {
  check(t, 'test/results/dee-straight--angry.svg',
    { name: 'dee', angle: 'straight', pose: 'angry' })
  check(t, 'test/results/dee-straight-cry-.svg',
    { name: 'dee', angle: 'straight', emotion: 'cry' })
  t.end()
})

test('comic works for all characters', function (t) {
  check(t, 'test/results/aryan-something-something.svg', {name: 'aryan', })
  check(t, 'test/results/ava-annoyed-yuhoo.svg', { name: 'ava', emotion: 'annoyed', pose: 'yuhoo' })
  check(t, 'test/results/bean-something-something.svg', {name: 'bean', })
  check(t, 'test/results/biden-something-something.svg', {name: 'biden', })
  // check(t, 'test/results/chini-something-something.svg', {name: 'chini', })
  check(t, 'test/results/dee-something-something.svg', {name: 'dee', })
  check(t, 'test/results/deenuova-something-something.svg', {name: 'deenuova', })
  check(t, 'test/results/dey-straight-afraid-angry.svg', { name: 'dey', angle: 'straight', emotion: 'afraid', pose: 'angry' })
  check(t, 'test/results/deynuovo-something-something.svg', {name: 'deynuovo', })
  check(t, 'test/results/ethan-something-something.svg', {name: 'ethan', })
  check(t, 'test/results/evan-something-something.svg', {name: 'evan', })
  check(t, 'test/results/facesketch-something-something.svg', {name: 'facesketch', })
  check(t, 'test/results/holmes-straight-cry-shrug.svg', { name: 'holmes', angle: 'straight', emotion: 'cry', pose: 'shrug' })
  // check(t, 'test/results/humaaans-something-something.svg', {name: 'humaaans', })
  check(t, 'test/results/jaya-something-something.svg', {name: 'jaya', })
  // check(t, 'test/results/panda-something-something.svg', {name: 'panda', })
  check(t, 'test/results/priya-something-something.svg', {name: 'priya', })
  check(t, 'test/results/priyanuova-something-something.svg', {name: 'priyanuova', })
  check(t, 'test/results/ricky-something-something.svg', {name: 'ricky', })
  check(t, 'test/results/rickynuovo-something-something.svg', {name: 'rickynuovo', })
  check(t, 'test/results/ringo-something-something.svg', {name: 'ringo', })
  check(t, 'test/results/ringonuovo-something-something.svg', {name: 'ringonuovo', })
  check(t, 'test/results/speechbubbles-something-something.svg', {name: 'speechbubbles', })
  check(t, 'test/results/trump-something-something.svg', {name: 'trump', })
  check(t, 'test/results/watson-something-something.svg', {name: 'watson', })
  check(t, 'test/results/zoe-something-something.svg', {name: 'zoe', })
  // check(t, 'test/results/zoozoo-something-something.svg', {name: 'zoozoo', })
  t.end()
})
