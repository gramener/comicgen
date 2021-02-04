async function init() {
  var params = ''
  const response = await fetch('../dist/characterlist.json')
  const chars = await response.json()
  const template = _.template(document.querySelector('#menu-template').innerHTML)
  const code_template = _.template(document.querySelector('#codegen').innerHTML)
  const $codetemp = document.querySelector('#codetemp')
  const $menu = document.querySelector('#menu')
  const $download = document.querySelector('.download')
  const $character = document.querySelector('#character .target')

  if (location.hash) {
    q = g1.url.parse(location.hash.replace(/^#/, '')).searchKey;
    await render(q)
  } else {
    await render()
    $('.form-select').children('option:eq(0)').prop('selected', true)
  }
  change();

  async function render(q) {
    $menu.innerHTML = template({ q: q || {}, chars, template })
    params = new URLSearchParams()
    for (let node of $menu.querySelectorAll('select'))
      params.append(node.name, node.value)
    const response = await fetch('../comic?' + params)
    $character.innerHTML = await response.text()
  }

  async function change() {
    var q = {}
    for (var node of $menu.querySelectorAll('.form-select')) {
      q[node.name] = node.value
    }
    await render(q)
    changeUrl()
    if (q.mirror) {
      let svg_width = $($character).children("svg").attr("width")
      $($character).find("svg g").eq(0).attr("transform", `translate(${svg_width},0)scale(-1,1)`)
    } else
      $($character).find("svg g").eq(0).removeAttr("transform")
  }

  function changeUrl() {
    location.hash = '?' + $('.selector').serialize()
    q = g1.url.parse(location.hash.replace(/^#/, '')).searchKey
    $codetemp.innerHTML = code_template({ url: location.origin + '/comic?' + params || '', code_template })
  }

  $menu.addEventListener('change', function (e) {
    change();
    let targetid = "#" + e.target.id
    $(targetid).trigger('focus')
  }, false)


  $download.addEventListener('click', function (e) {
    // var ext = $(':input[name="ext"]').val()
    var $target = $('#character .target > svg')
    // filename = all character attributes ...
    var filename = $('#menu select').map(function () { return $(this).val() })
    // ... except the last 2 (ext, mirror)
    filename = filename.get().slice(0, -2).join('-')
    // if (ext == 'png')
    //   saveSvgAsPng($target.get(0), filename + '.png')
    // else if (ext == 'svg') {
    // Create a copy of the SVG and replace the <image>s with the actual HTML
    var $svg = $target.clone()
    $svg.attr('xmlns', 'http://www.w3.org/2000/svg')
    var link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([
      '<?xml version="1.0" standalone="no"?>\r\n',
      $svg.get(0).outerHTML
    ], { type: 'image/svg+xml;charset=utf-8' }))
    link.download = filename + '.svg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  })

  $('.bg-color').on('input change', function () {
    // The first rule in the first sheet defines the background color for the target-container
    document.styleSheets[0].cssRules[0].style.backgroundColor = $(this).val()
  })
  new ClipboardJS('.copy')

  // Render part of README.md as Markdown. Sections delimited by <!-- var ... !>...<!-- end -->
  $.get('../README.md')
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
}

init()
