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

function speechshape({x = 0, y = 0, width, height, pointerx, pointery, fill = '#fff', stroke = '#000', rough=0}) {
  // Convert to numbers
  [x, y, width, height, pointerx, pointery, rough] = [+x, +y, +width, +height, +pointerx, +pointery, +rough]
  // Create main speech shape
  const paths = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
    [x, y],
  ]
  // Add pointer arc if present
  const dx = pointerx - (x + width / 2)
  const dy = pointery - (y + height / 2)
  let insertion
  let p1, p3
  let p2 = [pointerx, pointery]
  // TODO: Write logic manually, then generalize
  if (Math.abs(dy) > Math.abs(dx)) {
    // If pointer is on top
    if (dy < 0) {
      insertion = 1   // insert at top
      // if pointer is on left
      if (dx < 0) {
        p1 = [x + width / 6 * 1, y ]
        p3 = [x + width / 6 * 2, y ]
      } else if (dx >= 0) {
        p1 = [x + width / 6 * 4, y ]
        p3 = [x + width / 6 * 5, y ]
      }
    } else if (dy > 0) {
      insertion = 3   // insert at bottom
      // if pointer is on left
      if (dx < 0) {
        p1 = [x + width / 6 * 2, y + height ]
        p3 = [x + width / 6 * 1, y + height ]
      } else if (dx >= 0) {
        p1 = [x + width / 6 * 5, y + height ]
        p3 = [x + width / 6 * 4, y + height ]
      }
    }
  } else {
  // If P2 is on left, insertion point is on left
    if (dx < 0) {
      insertion = 4   // insert at left
      // if pointer is on top
      if (dy < 0) {
        p1 = [x, y + height / 6 * 2 ]
        p3 = [x, y + height / 6 * 1 ]
      } else if (dy >= 0) {
        p1 = [x, y + height / 6 * 5 ]
        p3 = [x, y + height / 6 * 4 ]
      }
    } else if (dx > 0) {
      insertion = 2   // insert at right
      // if pointer is on top
      if (dy < 0) {
        p1 = [x + width, y + height / 6 * 1 ]
        p3 = [x + width, y + height / 6 * 2 ]
      } else if (dy >= 0) {
        p1 = [x + width, y + height / 6 * 4 ]
        p3 = [x + width, y + height / 6 * 5 ]
      }
    }
  }
  if (dx || dy)
    paths.splice(insertion, 0, p1, p2, p3)

  // Jitter the points with radius "r" to convert them into rough lines
  function jitter(point) {
    return `${point[0] + Math.round((Math.random() - 0.5) * 2 * rough)},${point[1] + Math.round((Math.random() - 0.5) * 2 * rough)}`
  }
  let pathstr = []
  paths.forEach((p, i) => pathstr.push(i > 0 ? `M${jitter(paths[i - 1])} L${jitter(p)} M${jitter(paths[i - 1])} L${jitter(p)}` : `M${jitter(p)}`))
  return `<path d="${pathstr.join(' ')}" fill="${fill}" stroke="${stroke}"></path>`
}

function speechbubble(options) {
  /* options = {
      text: 'Hello'
      x: 30,
      y: 40,
      width: 300,
      height: 400,
      fill: 'white',
      align: 'middle',
      'font-fill': 'red',
      'font-family': 'Consolas',
      'font-size': 15,
      'font-weight': 'bold',
      'line-height': 1.3,
      pointerx: 130, pointery: 50,
      padding: 5,
      rough: 2.5
     }
  */

  options = Object.assign({
    x: 0,
    y: 0,
    width: 400,
    height: 200,
    padding: 5,
    'font-family': Object.keys(fonts)[0],
    'font-size': 16,
    'line-height': 1.5,
    align: 'middle',
    rough: 2.5
  }, options)
  if (!fonts[options['font-family']])
    options['font-family'] = Object.keys(fonts)[0]
  let font = fonts[options['font-family']]
  let fontSize = +options['font-size']
  let lineHeight = +options['font-size'] * +options['line-height']
  let padding = +options['padding']
  let width = options.width - 2 * padding
  let maxWidth = width * font.unitsPerEm / fontSize
  let align = alignMap[options.align] || options.align
  // Get the attributes of <text...> and <path...> into attrs.text and attrs.path
  let attrs = {
    text: [`text-anchor="${align}"`, `dx="${(dx[align] || 0) * width}"`],
    path: [],
  }
  for (let type of Object.keys(attrs))
    for (let [attr, target] of Object.entries(attr_map[type]))
      if (options[attr])
        attrs[type].push(`${target}="${options[attr]}"`)
  // Render the text
  let text = wrap(options.text, maxWidth, font)
    .map((line, i) => `<text transform="translate(${padding},${padding})"
      font-size="${fontSize}" dy="${(i + 1) * lineHeight}" ${attrs.text.join(' ')}>${line}</text>`).join('\n')
  // Render the path
  return speechshape(options) + text
}

module.exports = speechbubble
