/* eslint-env node */
let fontkit = require('fontkit')
let fonts = {
  'Arial': fontkit.openSync('C:/Windows/Fonts/arial.ttf'),
  'Consolas': fontkit.openSync('C:/Windows/Fonts/consola.ttf'),
  'Architects Daughter': fontkit.openSync('C:/Users/anand/AppData/Roaming/Monotype/skyfonts-google/Architects Daughter regular.ttf'),
}
// text-anchor uses start/middle/end but users prefer align=left/center/right. Map these
let alignMap = {
  'left': 'start',
  'center': 'middle',
  'right': 'end'
}

function width(word, font) {
  let width = 0
  font.layout(word).glyphs.forEach(g => width += g._metrics.advanceWidth)
  return width
}

function wrap(sentence, maxWidth, font) {
  let lines = []
  let line = []
  let words = sentence.split(/\s+/)
  for (let start=0, word=0; word < words.length; ) {
    let w = width(words[word] + ' ', font)
    if (start > 0 && start + w > maxWidth) {
      start = 0
      lines.push(line.join(' '))
      line = []
    } else {
      line.push(words[word])
      start += w
      word += 1
    }
  }
  lines.push(line.join(' '))
  return lines
}

let dx = {
  'start': 0,
  'middle': 0.5,
  'end': 1
}
let attr_map = {
  text: {
    x: 'x',
    y: 'y',
    'font-size': 'font-size',
    'font-family': 'font-family',
    'font-weight': 'font-weight',
    'font-fill': 'fill'
  },
  path: {
    x: 'x',
    y: 'y',
    width: 'width',
    height: 'height',
    fill: 'fill',
    stroke: 'stroke'
  }
}

function speechshape({x = 0, y = 0, width, height, pointerx, pointery, fill = '#fff', stroke = '#000'}) {
  // Convert to numbers
  [x, y, width, height, pointerx, pointery] = [+x, +y, +width, +height, +pointerx, +pointery]
  // Create main speech shape
  const paths = [
    `M ${x},${y}`,
    `L ${x + width},${y}`,
    `L ${x + width},${y + height}`,
    `L ${x},${y + height}`,
  ]
  // Add pointer arc if present
  const dx = pointerx - (x + width / 2)
  const dy = pointery - (y + height / 2)
  let insertion
  let p1, p2 = {x: pointerx, y: pointery}, p3
  // TODO: Write logic manually, then generalize
  if (Math.abs(dy) > Math.abs(dx)) {
    // If pointer is on top
    if (dy < 0) {
      insertion = 1   // insert at top
      // if pointer is on left
      if (dx < 0) {
        p1 = { x: x + width / 6 * 1, y: y }
        p3 = { x: x + width / 6 * 2, y: y }
      } else if (dx >= 0) {
        p1 = { x: x + width / 6 * 4, y: y }
        p3 = { x: x + width / 6 * 5, y: y }
      }
    } else if (dy > 0) {
      insertion = 3   // insert at bottom
      // if pointer is on left
      if (dx < 0) {
        p1 = { x: x + width / 6 * 2, y: y + height }
        p3 = { x: x + width / 6 * 1, y: y + height }
      } else if (dx >= 0) {
        p1 = { x: x + width / 6 * 5, y: y + height }
        p3 = { x: x + width / 6 * 4, y: y + height }
      }
    }
  } else {
  // If P2 is on left, insertion point is on left
    if (dx < 0) {
      insertion = 4   // insert at left
      // if pointer is on top
      if (dy < 0) {
        p1 = { x: x, y: y + height / 6 * 2 }
        p3 = { x: x, y: y + height / 6 * 1 }
      } else if (dy >= 0) {
        p1 = { x: x, y: y + height / 6 * 5 }
        p3 = { x: x, y: y + height / 6 * 4 }
      }
    } else if (dx > 0) {
      insertion = 2   // insert at right
      // if pointer is on top
      if (dy < 0) {
        p1 = { x: x + width, y: y + height / 6 * 1 }
        p3 = { x: x + width, y: y + height / 6 * 2 }
      } else if (dy >= 0) {
        p1 = { x: x + width, y: y + height / 6 * 4 }
        p3 = { x: x + width, y: y + height / 6 * 5 }
      }
    }
  }
  if (dx || dy)
    paths.splice(insertion, 0, `L${p1.x},${p1.y} L${p2.x},${p2.y} L${p3.x},${p3.y}`)
  return `<path d="${paths.join(' ')} Z" fill="${fill}" stroke="${stroke}"></path>`
}

function speechbubble(options) {
  options = Object.assign({
    x: 0,
    y: 0,
    width: 400,
    height: 200,
    'font-family': Object.keys(fonts)[0],
    'font-size': 16,
    'line-height': 1.5,
    align: 'middle'
  }, options)
  if (!fonts[options['font-family']])
    options['font-family'] = Object.keys(fonts)[0]
  let font = fonts[options['font-family']]
  let fontSize = +options['font-size']
  let lineHeight = +options['font-size'] * +options['line-height']
  let maxWidth = options.width * font.unitsPerEm / fontSize
  let align = alignMap[options.align] || options.align
  // Get the attributes of <text...> and <path...> into attrs.text and attrs.path
  let attrs = {
    text: [`text-anchor="${align}"`, `dx="${(dx[align] || 0) * options.width}"`],
    path: [],
  }
  for (let type of Object.keys(attrs))
    for (let [attr, target] of Object.entries(attr_map[type]))
      if (options[attr])
        attrs[type].push(`${target}="${options[attr]}"`)
  // Render the text
  let text = wrap(options.text, maxWidth, font)
    .map((line, i) => `<text font-size="${fontSize}" dy="${(i + 1) * lineHeight}" ${attrs.text.join(' ')}>${line}</text>`).join('\n')
  // Render the path
  return speechshape(options) + text
}

// eslint-disable-next-line
function main() {
  const express = require('express')
  const app = express()
  app.get('/', async (req, res) => {
    res.set('Content-Type', 'text/html')
    let options = {
      // 'text': '0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 ',
      text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      // text: 'Lorem ipsum.',
      // x: 30,
      // y: 40,
      // width: 300,
      // height: 400,
      // fill: 'white',
      // align: 'middle',
      // 'font-fill': 'red',
      // 'font-family': 'Consolas',
      // 'font-size': 15,
      // 'font-weight': 'bold',
      // 'line-height': 1.3,
      // pointerx: 500, pointery: 250,
      // [x] TL: 100, 10
      // [x] TR: 300, 10
      // [x] RT: 400, 100
      // [x] RB: 400, 400
      // [x] BR: 300, 500
      // [x] BL: 100, 500
      // [x] LB: 0, 400
      // [x] LT: 0, 100
    }
    res.send(`
    <!doctype html>
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com">
        <link href="https://fonts.googleapis.com/css2?family=Architects+Daughter&display=swap" rel="stylesheet">
      </head>
      <body>
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" style="background-color:#eee">
          ${speechbubble(options)}
        </svg>
      </body>
    </html>
    `)
  })

  app.listen(4444, () => {
    console.log('Example app listening at http://localhost:4444')
  })
}

module.exports = speechbubble
