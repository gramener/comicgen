/* globals comicgen, showdown, hljs, ClipboardJS, PlainDraggable */
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
var q
var defaults = comicgen.defaults
$.getJSON('files/files.json')
  .done(function (data) {
    // Any change in selection changes the URL
    $('.selector').on('change', ':input', function () {
      location.hash = '?' + $('.selector').serialize()
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
      options(q, 'mirror', { '': '', 'mirror': '1'})
      $('.comicgen-attrs .wip').remove()
      comicgen('.target', q)
      $('.target-container').css({ width: q.width + 'px', height: q.height + 'px' })
      for (var key in defaults) {
        $('input[name="' + key + '"]').val(q[key] || defaults[key])
        // If a value is the same as the default, drop it
        if (q[key] == defaults[key])
          delete q[key]
      }
      $('.codegen').template({q: q})
    }).urlchange()
  })

// Dragging the target image changes the x, y
var pos
new PlainDraggable($('.target').get(0), {
  containment: {left: -10000, top: -10000, width: 50000, height: 50000},
  onDragStart: function () { pos = {left: this.left, top: this.top} },
  onDragEnd: function () {
    $('input[name="x"]').val(Math.round(+(q.x || defaults.x) + this.left - pos.left))
    $('input[name="y"]').val(Math.round(+(q.y || defaults.y) + this.top - pos.top))
    location.hash = '?' + $('.selector').serialize()
    this.left = pos.left
    this.top = pos.top
  }
})

// Zooming target changes scale
$('.target').on('wheel', function (e) {
  if (!e.ctrlKey)
    return
  var scale0 = +(q.scale || defaults.scale)
  var scale = Math.round(scale0 * (1 - e.originalEvent.deltaY * 0.01) * 100, 2) / 100
  if (scale == scale0 && e.originalEvent.deltaY < 0)
    scale = scale0 + 0.01
  $('input[name="scale"]').val(scale)
  // Scale around the center
  $('input[name="x"]').val(Math.round(+(q.x || defaults.x) + (+q.width || defaults.width) * (scale0 - scale) / 2))
  $('input[name="y"]').val(Math.round(+(q.y || defaults.y) + (+q.height || defaults.height) * (scale0 - scale) / 2))
  location.hash = '?' + $('.selector').serialize()
  e.preventDefault()
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

var template_arrows = _.template($('.arrows').html())

// Utility: Set a default value for q[key] using data. Render <select> dropdown using data
function options(q, key, data) {
  data = _.isArray(data) ? data : _.keys(data)
  // If q[key] is not in data, pick the first item from the data list/dict
  q[key] = q[key] && data.indexOf(q[key]) > 0 ? q[key] : data[0]
  var options = data.map(function (v) { return '<option>' + v + '</option>' }).join('')
  var $el = $('.comicgen-attrs .attr[name="' + key + '"]').removeClass('wip')
  if (!$el.length) {
    $el = $('<div>').addClass('attr mr-2 mb-2').attr('name', key)
    $el.append($(template_arrows({key: key})))
    $el.append($('<select>').addClass('form-control').attr('name', key))
    var $after = $('.comicgen-attrs .attr:not(.wip):last')
    if ($after.length)
      $el.insertAfter($after)
    else
      $el.appendTo('.comicgen-attrs')
  }
  $el.find('select').html(options).val(q[key])
}

// Arrow buttons move
_.each(
  [
    {left_or_right: '.move-left', target: 'prev', insert: 'insertBefore'},
    {left_or_right: '.move-right', target: 'next', insert: 'insertAfter'},
  ], function (conf) {
    $('.comicgen-attrs').on('click', conf.left_or_right, function () {
      var $this = $(this).parents('.attr')
      var $target = $this[conf.target]()
      if ($target.length) {
        $this[conf.insert]($target)
        location.hash = '?' + $('.selector').serialize()
        $(window).trigger('#', g1.url.parse(location.hash.replace(/^#/, '')))
      }
    })
  })
