var fs = require('fs')
var test = require('tape')
var comicgen = require('../src/comicserver')

test('comicgen without options returns an empty string', function (t) {
  t.equal(comicgen(), '')
  t.end()
})

test('comicgen loads a single character', function (t) {
  let result = comicgen({
    name: 'dee',
    angle: 'straight',
    emotion: 'cry',
    pose: 'angry'
  })
  t.equal(result, fs.readFileSync('test/results/dee-straight-cry-angry.svg'))
  t.end()
})
