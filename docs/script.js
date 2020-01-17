/* globals comicgen, showdown, hljs, ClipboardJS, fabric */

var speechbubbles = 'speechbubbles'

// If the URL hash has a path, it's a non-home tab. Change to it and exit
var url = g1.url.parse(location.hash.replace(/^#/, ''))
$('a[href="#' + url.pathname + '"]').tab('show')

// Render part of README.md as Markdown. Sections delimited by <!-- var ... !>...<!-- end -->
$.get('README.md')
  .done(function (text) {
    var converter = new showdown.Converter({ ghCodeBlocks: true, tables: true })
    text.match(/<!--\s*var\s+\S*\s*-->[\s\S]*?<!--\s*end\s*-->/igm).forEach(function (match) {
      var lines = match.split(/\n/)
      var name = lines[0].replace(/^<!--\s*var\s+/, '').replace(/\s*-->$/, '')
      $('md[data-target="' + name + '"]')
        .addClass('d-block my-4')
        .html(converter.makeHtml(lines.slice(1, -1).join('\n')))
        .find('pre')
        .each(function () { hljs.highlightBlock(this) })
    })
    $('md table').addClass('table table-sm')
      .find('a').each(function () {
        $(this).attr('target', '_blank')
      })
  })

// q holds the current state of the application, and the comicgen parameters
var q, fabric_objs = {}
var defaults = comicgen.defaults
$.getJSON('files.json')
  .done(function (data) {
    // Any change in selection changes the URL
    $('.selector').on('change', ':input', function () {
      location.hash = '?' + $('.selector').serialize()
    })
    // Any tab selection updates the URL path without hashchange
    $('#comic-tab').on('shown.bs.tab', function (e) {
      var url = g1.url.parse(location.hash.replace(/^#/, ''))
      url.pathname = $(e.target).attr('href').replace(/^#/, '')
      url.pathname = url.pathname == 'home' ? '' : url.pathname
      location.hash = url.toString()
    })

    var canvas_size = $('.target').width()

    $('.target')
      .append('<canvas id="canvas" width="' + canvas_size + '" height="' + canvas_size + '"></canvas>')
    var canvas = new fabric.Canvas('canvas')

    // .canvas-container was created by fabric.Canvas
    $('.canvas-container').append('<div id="contextmenu" class="d-none"></div>')
    var contextMenu = $('#contextmenu')
    createContextMenu(contextMenu)
    canvas.on('selection:cleared', function () {
      contextMenu.addClass('d-none')
    })
    canvas.on('selection:created', function () {
      contextMenu.removeClass('d-none')
      repositionContextMenu(canvas, contextMenu)
    })
    canvas.on('selection:updated', function () {
      repositionContextMenu(canvas, contextMenu)
    })
    canvas.on('object:modified', function () {
      repositionContextMenu(canvas, contextMenu)
    })

    // Any change in URL re-renders the strip
    $(window).on('#', function (e, url) {
      var node = data
      // Render the dropdowns
      q = url.searchKey
      $('.comicgen-attrs .attr').addClass('wip')
      // Everything starts with a name
      options(q, 'name', node)
      node = node[q.name]
      var format = comicgen.formats[comicgen.namemap[q.name]]
      format.dirs.forEach(function (attr) {
        options(q, attr, node)
        node = node[q[attr]]
      })
      // Render dropdowns for each of the files. Use order in URL
      _.each(Object.assign({}, q, format.files), function (val, attr) {
        if (attr in format.files)
          options(q, attr, node[attr])
      })

      $('.comicgen-attrs .wip').remove()

      $('.download-png').off('click').on('click', function () {
        var image = new Image()
        image.src = canvas.toDataURL('png')
        window.open('').document.write(image.outerHTML)
      })

      $('.download-svg').off('click').on('click', function () {
        window.open('').document.write(canvas.toSVG())
      })

      $('body')
        .off('keyup')
        .on('keyup', function (e) { if (e.keyCode == 46) object_action(canvas, 'delete') })


      var _attrs = Object.assign({}, comicgen.defaults, q)

      deleteCharacter(canvas, q.name)

      // TODO: Text layer must be added to canvas AFTER speechbubble layer is rendered
      if (q.name == speechbubbles) {
        var newID = (new Date()).getTime().toString().substr(5)
        var text = new fabric.IText('Add text here...', {
          fontFamily: 'Neucha',
          fontSize: 20,
          left: 100,
          top: 100,
          myid: newID,
          objecttype: 'text'
        })
        text.setControlsVisibility({
          mt: false, // middle top 
          mb: false, // midle bottom
          ml: false, // middle left
          mr: false, // middle right
        })
        canvas.add(text)
      }

      $('body')
        .off('click', '#fab-delete').on('click', '#fab-delete', function () {
          object_action(canvas, 'delete')
        })
        .off('click', '#fab-mirror').on('click', '#fab-mirror', function () {
          object_action(canvas, 'mirror')
        })
        .off('click', '#fab-bringfront').on('click', '#fab-bringfront', function () {
          object_action(canvas, 'bringfront')
        })
        .off('click', '#fab-sendback').on('click', '#fab-sendback', function () {
          object_action(canvas, 'sendback')
        })

      for (var attr in _attrs) {
        if (attr in format.files) {
          var row = format.files[attr]
          var img = row.file.replace(/\$([a-z]*)/g, function (match, group) { return _attrs[group] })

          var character_parts_url = `${comicgen.base}${_attrs.ext}/${img}.${_attrs.ext}`
          // var character_parts_url = `${comicgen.base}${'svg'}/${img}.${'svg'}`

          // fabric.Image.fromURL(character_parts_url, function(img) {
          //   canvas.add(img)

          //   img.set({ top: row.y + img.top + 40, left: row.x + img.left })
          //   img.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false })

          //   canvas.add(img)
          //   if (q.name in fabric_objs) fabric_objs[q.name].push(img)
          //   else {
          //     fabric_objs[q.name] = []
          //     fabric_objs[q.name].push(img)
          //   }
          // })
          $.get(character_parts_url)
            .done(onload(row))
        }
      }
      canvas.renderAll()

      function onload(row) {
        return function (res) {
          var svg_string = getSVGstring(res)
          fabric.loadSVGFromString(svg_string, function (objects, options) {
            var obj = fabric.util.groupSVGElements(objects, options)
            obj.set({ top: row.y + obj.top + 40, left: row.x + obj.left })
            obj.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false })

            canvas.add(obj)
            if (q.name in fabric_objs) fabric_objs[q.name].push(obj)
            else {
              fabric_objs[q.name] = []
              fabric_objs[q.name].push(obj)
            }
          })
          canvas.renderAll()
        }
      }

      for (var key in defaults) {
        $('input[name="' + key + '"]').val(q[key] || defaults[key])
        // If a value is the same as the default, drop it
        if (q[key] == defaults[key])
          delete q[key]
      }
      $('.codegen').template({ q: q })
    }).urlchange()
  })

// Reset button reverts to defaults on size, position & scale
$('.reset').attr('href', '?' + $.param(defaults))
$('body').urlfilter()

// Change background / stroke colors if requested
$('.bg-color').on('input, change', function () {
  // The first rule in the first sheet defines the background color for the target-container
  document.styleSheets[0].cssRules[0].style.backgroundColor = $(this).val()
})

// Click on copy button to copy code
new ClipboardJS('.copy')

// Utility: Set a default value for q[key] using data. Render <select> dropdown using data
function options(q, key, data) {
  data = _.isArray(data) ? data : _.keys(data)
  // If q[key] is not in data, pick the first item from the data list/dict
  q[key] = q[key] && data.indexOf(q[key]) > 0 ? q[key] : data[0]
  var options = data.map(function (v) { return '<option>' + v + '</option>' }).join('')
  var $el = $('.comicgen-attrs .attr[name="' + key + '"]').removeClass('wip')
  if (!$el.length) {
    $el = $('<div>').addClass('attr mr-2 mb-2').attr('name', key)
    $el.append($('<select>').addClass('form-control').attr('name', key))
    var $after = $('.comicgen-attrs .attr:not(.wip):last')
    if ($after.length)
      $el.insertAfter($after)
    else
      $el.appendTo('.comicgen-attrs')
  }
  $el.find('select').html(options).val(q[key])
}

var allurls = []
function emotionposecombinations(basestr, emotionarr, posarr) {
  posarr.forEach(function (p) {
    emotionarr.forEach(function (e) {
      var q = '#' + g1.url.parse(basestr).update({
        pose: p, emotion: e, ext: 'svg', mirror: '',
        x: '0', y: '0', scale: '1', width: '500', height: '600'
      }).toString()
      allurls.push([q, e])
    })
  })
  for (var i = allurls.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var temp = allurls[i]
    allurls[i] = allurls[j]
    allurls[j] = temp
  }
}

function getallcharacters(obj, q) {
  if (Array.isArray(obj)) return
  if (obj['emotion'] || obj['pose']) {
    var baseurl = g1.url.parse(location.href).update({ name: q[0], angle: q[1] }).toString()
    emotionposecombinations(baseurl, obj['emotion'], obj['pose'])
    return
  }
  Object.keys(obj).forEach(function (key) {
    q.push(key)
    getallcharacters(obj[key], q)
    q.pop()
  })
}

$.getJSON('files.json')
  .done(function (data) {
    getallcharacters(data, [])
  })

$.getJSON('docs/synonym.json')
  .done(function (synonym) {
    var linktemplate = _.template($('.search-links').html())
    var result = linktemplate({ links: allurls })
    $('.target-search-panel').html(result)

    allurls.forEach(function (url, index) {
      var q = g1.url.parse(url[0].replace(/#/, ''))
      comicgen('#comicgen' + index, Object.assign({}, q.searchKey, { width: 200, height: 300 }))
    })

    // TODO LATER: Replace with a fuzzy string matching library
    jQuery.fn.search.changes['synonymsearch'] = function (word) {
      if (synonym[word]) {
        return synonym[word].join('~').replace(/~/g, '|').replace(/\s+/g, '|')
      }
      return word.replace(/\s+/g, '.*')
    }

    $('body').search({ change: 'synonymsearch' })
  })



function deleteCharacter(canvas, char_name) {
  if (char_name in fabric_objs && char_name !== speechbubbles) {
    fabric_objs[char_name].forEach(function (obj) { canvas.remove(obj) })
    delete fabric_objs[char_name]
  }
}

var actions = {
  delete: function (obj, canvas) {
    canvas.remove(obj)
  },
  mirror: function (obj) {
    obj.set('flipX', !obj.flipX)
  },
  bringfront: function (obj) {
    obj.bringToFront()
  },
  sendback: function (obj) {
    obj.sendToBack()
  }
}

function object_action(canvas, action) {
  var activeGroup = canvas.getActiveObjects()
  if (!activeGroup.length) return

  activeGroup.forEach(function (obj) {
    actions[action](obj, canvas)
  })
  canvas.renderAll()
}


function createContextMenu(contextMenu) {
  var controls = [
    {
      title: 'Delete Selection',
      icon: 'far fa-trash-alt',
      id: 'fab-delete'
    },
    {
      title: 'Mirror Selection',
      icon: 'fas fa-exchange-alt',
      id: 'fab-mirror'
    },
    {
      title: 'Send to Back',
      icon: 'fas fa-angle-double-down',
      id: 'fab-sendback'
    },
    {
      title: 'Bring to Front',
      icon: 'fas fa-angle-double-up',
      id: 'fab-bringfront'
    }
  ]
  var control_html = []
  controls.forEach(function (action_item) {
    control_html.push([`<button type="button" class="btn border round bg-color6 pb-0 px-2" id="${action_item.id}"
            title="${action_item.title}">
            <i class="${action_item.icon}"></i>
            </button>`])
  })
  contextMenu.html(control_html.join('')).show()
}

function repositionContextMenu(canvas, contextMenu) {
  var active_obj = canvas.getActiveObject()
  contextMenu.css({
    'top': (active_obj.top + active_obj.height * active_obj.scaleX) + 'px',
    'left': (active_obj.left + active_obj.width / 2 * active_obj.scaleY) + 'px'
  })
}

function getSVGstring(res) {
  $('body').append('<template></template>')
  $('template').append(res.documentElement)
  var temp_svg_jquery = $('template svg')
  $('template').remove()
  var temp_children = temp_svg_jquery.children()
  var grouped_elm = temp_children.is('g') ? temp_children : $(document.createElement('g')).append(temp_children)
  temp_svg_jquery.children().remove()
  temp_svg_jquery.append(grouped_elm)

  if ('getBoundingClientRect' in grouped_elm.get(0)) {
    var bbox = { x: 0, y: 0 }
    bbox = grouped_elm.get(0).getBoundingClientRect()
    var svg_attrs = {
      width: bbox.width,
      height: bbox.height,
      viewBox: [bbox.x, bbox.y, bbox.width, bbox.height].join(' ')
    }
    for (var prop in svg_attrs) {
      temp_svg_jquery.get(0).setAttribute(prop, svg_attrs[prop])
    }
  }
  return temp_svg_jquery.get(0).outerHTML
}
