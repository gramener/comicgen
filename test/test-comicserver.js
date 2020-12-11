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
  check(t, 'test/results/aryan-angry-handsfolded.svg', {name: 'aryan', emotion: 'angry', pose: 'handsinpocket' })
  check(t, 'test/results/ava-annoyed-yuhoo.svg', { name: 'ava', emotion: 'annoyed', pose: 'yuhoo' })
  check(t, 'test/results/bean-straight-curious-handsheldback.svg', {name: 'bean', angle: 'straight', emotion: 'curious', pose: 'handsheldback'})
  check(t, 'test/results/biden-angry-handsonhip.svg', {name: 'biden', emotion: 'angry', pose: 'handsonhip'})
  // check(t, 'test/results/chini-something-something.svg', {name: 'chini', })
  check(t, 'test/results/dee-straight-angry-handsinpocket.svg', {name: 'dee', angle: 'straight', emotion: 'angry', pose: 'handsinpocket'})
  check(t, 'test/results/deenuova-straight-angry-handsinpocket.svg', {name: 'deenuova', angle: 'straight', emotion: 'angry', pose: 'handsinpocket'})
  check(t, 'test/results/dey-straight-afraid-angry.svg', { name: 'dey', angle: 'straight', emotion: 'afraid', pose: 'angry' })
  check(t, 'test/results/deynuovo-straight-afraid-angry.svg', {name: 'deynuovo', angle: 'straight', emotion: 'afraid', pose: 'angry' })
  check(t, 'test/results/ethan-side-angry-holdingstick.svg', {name: 'ethan', angle: 'side', emotion: 'angry', pose: 'holdingstick'})
  check(t, 'test/results/evan-angryfrustrated-handsfolded.svg', {name: 'evan', emotion: 'angryfrustrated', pose: 'handsfolded'})
  check(t, 'test/results/facesketch-face1-ear2-hair1-eyes1-mouth1-nose1.svg', {name: 'facesketch', face: 'face1-ear2', hair: 'hair1', eye: 'eyes1', mouth: 'mouth1', nose: 'nose1'})
  check(t, 'test/results/holmes-straight-cry-shrug.svg', { name: 'holmes', angle: 'straight', emotion: 'cry', pose: 'shrug' })
  // check(t, 'test/results/humaaans-something-something.svg', {name: 'humaaans', })
  check(t, 'test/results/jaya-normal-explaining.svg', {name: 'jaya', emotion: 'normal', pose: 'explaining'})
  // check(t, 'test/results/panda-something-something.svg', {name: 'panda', })
  check(t, 'test/results/priya-sitting-annoyed-sittingatdesk.svg', {name: 'priya', angle: 'sitting', emotion: 'annoyed', pose: 'sittingatdesk'})
  check(t, 'test/results/priyanuova-sitting-annoyed-sittingatdesk.svg', {name: 'priyanuova', angle: 'sitting', emotion: 'annoyed', pose: 'sittingatdesk'})
  check(t, 'test/results/ricky-side-sadlookingup-explaining.svg', {name: 'ricky', angle: 'side', emotion: 'sadlookingup', pose: 'explaining'})
  check(t, 'test/results/rickynuovo-side-sadlookingup-explaining.svg', {name: 'rickynuovo', angle: 'side', emotion: 'sadlookingup', pose: 'explaining'})
  check(t, 'test/results/ringo-straight-angry-handsinpocket.svg', {name: 'ringo', angle: 'straight', emotion: 'angry', pose: 'handsinpocket'})
  check(t, 'test/results/ringonuovo-straight-angry-handsinpocket.svg', {name: 'ringonuovo', angle: 'straight', emotion: 'angry', pose: 'handsinpocket'})
  check(t, 'test/results/speechbubbles-cloud.svg', {name: 'speechbubbles', speechbubble: 'cloud'})
  check(t, 'test/results/trump-happy-clapping.svg', {name: 'trump', emotion: 'happy', pose: 'clapping'})
  check(t, 'test/results/watson-straight-afraid-explaining.svg', {name: 'watson', angle: 'straight', emotion: 'afraid', pose: 'explaining'})
  check(t, 'test/results/zoe-attitude-holdingbag.svg', {name: 'zoe', emotion: 'attitude', pose: 'holdingbag'})
  // check(t, 'test/results/zoozoo-something-something.svg', {name: 'zoozoo', })
  t.end()
})
