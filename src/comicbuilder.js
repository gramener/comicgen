/* globals canvas */
import SvgCanvas from '../node_modules/svgedit/editor/svgcanvas.js'
const container = document.querySelector('#editorContainer')
const { width, height } = { width: 800, height: 500 }
window.width = width
window.height = height

const config = {
  initFill: { color: 'FFFFFF', opacity: 1 },
  initStroke: { color: '000000', opacity: 1, width: 1 },
  text: { stroke_width: 0, font_size: 24, font_family: 'serif' },
  initOpacity: 1,
  imgPath: '../src/editor/images',
  dimensions: [width, height],
  baseUnit: 'px',
  showRulers: true,
  showGrid: true,
  extensions: [
    '../editor/extensions/ext-connector.js', '../editor/extensions/ext-eyedropper.js', '../editor/extensions/ext-shapes.js', '../editor/extensions/ext-imagelib.js', '../editor/extensions/ext-grid.js', '../editor/extensions/ext-polygon.js', '../editor/extensions/ext-star.js'
  ],
  noDefaultExtensions: false
}

window.canvas = new SvgCanvas(container, config)
canvas.updateCanvas(width, height)
window.fill = function (colour) {
  canvas.getSelectedElems().forEach((el) => {
    el.setAttribute('fill', colour)
  })
}
document.getElementById('deebtn').onclick = function () {
  canvas.setMode('g')
  canvas.addSVGElementFromJson({
    'element': 'image',
    'attr': {
      'class': 'imagedee',
      'href': 'https://gramener.com/comicgen/v1/comic?name=deenuova&angle=side&emotion=afraid&pose=explaining&shirt=%23ffcc66&face=%23eeddc5&mirror=',
      'x': 50,
      'y': 205,
      'width': 200,
      'height': 200
    }
  })
}
document.getElementById('deybtn').onclick = function () {
  canvas.setMode('image')
  canvas.setGoodImage('https://gramener.com/comicgen/v1/comic?name=deynuovo&angle=sitting&emotion=laugh&pose=sittingatdesk&shirt=%23bdc59a&face=%23eeddc5&mirror=mirror')
}
document.getElementById('addforeignobject').onclick = function () {
  canvas.setMode('image')
  canvas.setGoodImage('https://gramener.com/comicgen/v1/comic?name=deynuovo&angle=sitting&emotion=laugh&pose=sittingatdesk&shirt=%23bdc59a&face=%23eeddc5&mirror=mirror')
}
document.getElementById('speechbtn').onclick = function () {
  canvas.setMode('image')
  canvas.setGoodImage('https://gramener.com/comicgen/v1/comic?name=speechbubble&text=Hello+folks%21+This+is+exciting%21&width=150&height=100&align=center&font-family=Architects+Daughter&font-size=24&font-weight=normal&pointerx=185&pointery=65&padding=5&fill=%23ffffff&line-height=1&x=0&y=0&scale=0.7&rough=2.5&mirror=')
}
document.getElementById('copyel').onclick = function () {
  // Remembers the current selected elements on the clipboard.
  canvas.copySelectedElements()
}
document.getElementById('pastel').onclick = function () {
  canvas.pasteElements()
}
document.getElementById('duplicate').onclick = function () {
  canvas.cloneSelectedElements(15, 15)
}
document.getElementById('groupel').onclick = function () {
  // Wraps all the selected elements in a group (`g`) element.
  canvas.groupSelectedElements()
}
document.getElementById('ungroupel').onclick = function () {
  // Unwraps all the elements in a selected group (`g`) element.
  canvas.ungroupSelectedElement()
}
document.getElementById('bringforward').onclick = function () {
  //Moves the select element up or down the stack, based on the visibly intersecting elements.
  canvas.moveUpDownSelected('Up')
}
document.getElementById('sendbackward').onclick = function () {
  //Moves the select element up or down the stack, based on the visibly intersecting elements.
  canvas.moveUpDownSelected('Down')
}
document.getElementById('alignels').onclick = function () {
  //Moves the select element up or down the stack, based on the visibly intersecting elements.
  canvas.alignSelectedElements('selected')
}
document.getElementById('addelements').onclick = function () {
  canvas.setMode('g')
  canvas.addSVGElementFromJson({
    'element': 'circle',
    'attr': {
      'cx': 50,
      'cy': 50,
      'r': 25,
      'fill': 'blue',
      'stroke': '#000',
      'stroke-width': 3,
    }
  })
  canvas.addSVGElementFromJson({
    'element': 'circle',
    'attr': {
      'cx': 150,
      'cy': 50,
      'r': 25,
      'fill': 'yellow',
      'stroke': '#000',
      'stroke-width': 3,
    }
  })
}

document.getElementById('addtext').onclick = function () {
  canvas.setMode('g')
  canvas.addSVGElementFromJson({
    'element': 'text',
    'attr': {
      'id': 'text123',
      'x': 50,
      'y': 205,
    },
    'children': [
      'Hello world'
    ]
  })
}


document.getElementById('animaterect').onclick = function () {
  canvas.setMode('g')
  canvas.addSVGElementFromJson({
    'element': 'rect',
    'attr': {
      'id': 'box123',
      'fill': 'red',
      'x': 50,
      'y': 205,
      'width': 100,
      'height': 100
    },
    'children': [
      {
        'element': 'animate',
        'attr': {
          'attributeName': 'rx',
          'values': '0;90;0',
          'dur': '10s',
          'repeatCount': 'indefinite',
        }
      }
    ]
  })
}

document.getElementById('addedittext').onclick = function () {
  canvas.addSVGElementFromJson({
    'element': 'foreignObject',
    'attr': {
      'x': 20,
      'y': 60,
      'width': 200,
      'height': 200
    },
    'children': [
      {
        'element': 'div',
        'attr': {
          'xmlns': 'http://www.w3.org/1999/xhtml',
          'style': 'color:red'
        },
        'children': [
          'This is editable text'
        ]
      }
    ]

  })
}

document.getElementById('savepng').onclick = function () {
  canvas.rasterExport('PNG', 1, 'test')
}
