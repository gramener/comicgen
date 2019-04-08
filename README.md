# comicgen

<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.1/css/all.css" crossorigin="anonymous">

<!-- var introduction -->
We love comics. We badly wanted to create comic strips. But there was one
problem. Some of us can't draw a straight line for nuts.

But why should that stop us from creating comics? So here's a gift to ourselves
and the world &mdash; a **Comic Creator**.

We are sure you'd love the company of our friends [Dee](#?name=dee) &
[Dey](#?name=dey). Go on & have some fun.
<!-- end -->

<!-- var usage -->
## Installation

Load the comicgen library by adding this line in your HTML page's `<head>`:

```html
<script async src="https://cdn.jsdelivr.net/npm/comicgen"></script>
```

You can also instal comicgen locally using `npm` or `yarn`:

```bash
npm install comicgen
yarn install comicgen
```

... and then include:

```html
<script src="node_modules/comicgen/dist/comicgen.min.js"></script>
```

## Usage

To embed a character, add:

```html
<g class="comicgen" name="dee" angle="straight" emotion="smile" pose="thumbsup"></g>
```

This inserts the following image in your HTML.
You can embed it anywhere, including inside an `<svg>` element.

![name=dee angle=straight emotion=smile pose=thumbsup](docs/dee-straight-smile-thumbsup.png)

The character is defined by 4 attributes:

- `name`: the name of the character (e.g. `dee`, `dey`)
- `angle`: which angle are they are facing (e.g. `straight`, `side`)
- `emotion`: what emotion their face expresses (e.g. `sad`, `happy`)
- `pose`: what pose their body shows (e.g. `pointingup`, `holdinglaptop`)

The list of valid combinations are available on the
[comicgen interactive gallery](https://gramener.com/comicgen/).

The characters are drawn on a 500 x 600 canvas. You can change this using:

- `width`: width of the image. Default: 500
- `height`: height of the image. Default: 600
- `x`: left position or x-offset. Default: 0
- `y`: top position or y-offset. Default: 1
- `mirror`: shsow mirror image. Value can be empty string or 1. Default: empty string
- `scale`: how much larger to make the image. Default: 1

Comicgen is tested on Chrome, Edge, and Firefox. It does not work on Internet Explorer.

## API

To explicitly run comicgen on a selector, run `comicgen(selector, options)`.
For example:

```js
comicgen('.comicgen', {
  name: 'dee',
  angle: 'straight',
  emotion: 'smile',
  pose: 'thumbsup',
  width: 400,
  height: 300
})
```

... renders all elements with `class="comicgen"` as a comic. It sets the default
name, angle, etc to the values above.

## Composition

To combine multiple characters in a panel, embed them in an `<svg>` element.

You can change the `x`, `y`, `width`, `height`, `mirror` and `scale` to position each character.

```html
<svg width="300" height="200">
  <g class="comicgen" name="dee" angle="straight" emotion="smilehappy" pose="pointingright" x="-120"></g>
  <g class="comicgen" name="dey" angle="straight" emotion="smile" pose="handsinpocket" x="150"></g>
</svg>
```

![Dee and Dey together](docs/dee-and-dey-together.png)

You can resize the combined image by changing the `width` and `height` of the
SVG container.

```html
<svg width="300" height="200" viewBox="0 0 500 600">
  <g class="comicgen" name="dee" angle="straight" emotion="smilehappy" pose="pointingright" x="-120"></g>
  <g class="comicgen" name="dey" angle="straight" emotion="smile" pose="handsinpocket" x="150"></g>
</svg>
```

Set `viewBox` to the width and height of the comicgen elements. Then you can set
the outer `width` and `height` to anything.

![Dee and Dey scaled down](docs/dee-and-dey-meet.png)

This normally scales the image to fit both the width and height. To fit only one
side, use [preserveAspectRatio](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/preserveAspectRatio).
For example, `preserveAspectRatio="xMidYMin slice"` in this case fits to width
and slices the height, preserving the top (YMin) of the image.

```html
<svg width="300" height="200" viewBox="0 0 500 600" preserveAspectRatio="xMidYMin slice">
  <g class="comicgen" name="dee" angle="straight" emotion="smilehappy" pose="pointingright" x="-120"></g>
  <g class="comicgen" name="dey" angle="straight" emotion="smile" pose="handsinpocket" x="150"></g>
</svg>
```

![Dee and Dey fit width](docs/dee-and-dey-slice.png)

## Panels

You can embed characters in panels CSS. For example, this defines a panel:

```css
.comic-panel {
  height: 200px;          /* Each panel has a height of 200 px */
  margin: 10px;           /* ... and a little bit of spacing around it */
  border: 2px solid grey; /* ... with a thick grey border */
  overflow: hidden;       /* Comics should not spill out of the border */
  position: relative;     /* This will be useful when we add captions */
}
```

Now, `<div class="comic-panel">` draws a thick grey border.
You can insert your character inside that.

```html
<div class="comic-panel">
  <g class="comicgen" name="dee" angle="straight" emotion="smilehappy" pose="handsfolded"
    x="-320" y="-120" scale="2.2" width="200" height="200"></g>
</div>
```

![Dee in a panel](docs/dee-panel.png)

Panels are typically placed inside a row:

```css
.comic-row {
  display: flex;
  flex-direction: row;
}
```

For rows of panels, embed `.comicgen` inside a `.comic-panel` inside a `.comic-row`.

Here's an example with 2 panels. The second panel has 2 characters.

```html
<div class="comic-row">
  <div class="comic-panel">
    <g class="comicgen" name="dee" angle="straight" emotion="smilehappy" pose="handsfolded"
      x="-320" y="-120" scale="2.2" width="200" height="200"></g>
  </div>
  <div class="comic-panel">
    <svg width="200" height="200">
      <g class="comicgen" name="dey" angle="straight" emotion="smile" pose="handsinpocket"
        x="-200" y="-120" scale="2.2" width="200" height="200"></g>
      <g class="comicgen" name="dee" angle="straight" emotion="smilehappy" pose="handsfolded"
        x="-250" y="-120" scale="1.4" width="200" height="200"></g>
    </svg>
  </div>
</div>
```

![Dee and Dey in panels](docs/dee-and-dey-panels.png)

For a panel with multiple, embed your `.comicgen` inside a `.comic-panel` inside
a `.comic-row`.


## Captions

You can add captions using CSS. For example, this defines a caption on top:

```css
.comic-caption-top {
  position: absolute;             /* Caption sits on top of the image */
  width: 100%;                    /* It occupies the full width of the panel */
  top: 0;                         /* Position the panel at the top */
  border-bottom: 2px solid grey;  /* ... and top a bottom below. */
  background-color: white;        /* Hide anything behind the caption - for legibility */
  padding: 0.25rem;               /* Give a bit of room for white-space */
  font-family: Neucha, cursive;   /* Pick a handwriting font from Google Fonts */
  text-transform: uppercase;      /* Comic lettering is usually uppercase */
}
```

Adding a `<div class="comic-caption-top">...</div>` inside a
`<div class="comic-panel">` adds a text caption to the top of the strip.

```html
<div class="comic-row">
  <div class="comic-panel">
    <div class="comic-caption-top">Hi! I'm Dee.</div>
    <g class="comicgen" name="dee" angle="straight" emotion="smilehappy" pose="handsfolded" x="-317" y="-119" scale="2.2" width="150" height="200"></g>
  </div>
  <div class="comic-panel">
    <div class="comic-caption-top">I'm in a comic strip called Dee & Dey.</div>
    <g class="comicgen" name="dee" angle="straight" emotion="smilehappy" pose="handsfolded" x="-150" y="10" scale="1.5" width="150" height="200" mirror="1"></g>
  </div>
  <div class="comic-panel">
    <div class="comic-caption-top">And this is Dey, my co-star on this strip.</div>
    <svg width="300" height="200">
      <g class="comicgen" name="dee" angle="straight" emotion="smilehappy" pose="pointingright" x="160" y="0" scale="0.88" width="300" height="200" mirror="1"></g>
      <g class="comicgen" name="dey" angle="straight" emotion="smile" pose="handsinpocket" x="-120" y="10" scale="0.88" width="300" height="200"></g>
    </svg>
  </div>
</div>
```

![Dee and Dey with captions](docs/dee-and-dey-captions.png)

<!-- end -->


## Release

To publish a new version on npm:

```bash
# Update package.json version
# Run tests on dev branch
npm run lint
npm test
npm run test-chrome
npm run test-edge
npm run test-firefox

# Ensure that there are no build errors on the server
git commit . -m"DOC: Release version x.x.x"
git push

# Merge into dev branch
git checkout master
git merge dev
git tag -a v0.x.x -m"Add a one-line summary"
git push --follow-tags

# Publish to https://www.npmjs/package/comicgen maintained by @sanand0
npm publish

git checkout dev
```


<!-- var credits -->

## Credits

- Developed by Kriti Rohilla <kriti.rohilla@gramenerit.com> and S Anand <s.anand@gramener.com>
- Conceived & designed by Ramya Mylavarapu <ramya.mylavarapu@gramener.com> & Richie Lionell <richie.lionell@gramener.com>

<!-- end -->

<!-- var social -->
## Share

<p class="d-flex">
  <a href="https://twitter.com/intent/tweet?text=Make%20your%20own%20%23comics%20with%20the%20JS%20API%20by%20%40Gramener%20https%3A%2F%2Fgramener.com%2Fcomicgen%2F" class="btn btn-link py-0 pl-0 pr-1" target="_blank" rel="noopener" title="Share on Twitter">
    <i class="fab fa-twitter-square fa-2x"></i>
  </a>
  <a href="https://www.facebook.com/dialog/share?app_id=163328100435225&display=page&href=https%3A%2F%2Fgramener.com%2Fcomicgen%2F&redirect_uri=https%3A%2F%2Fgramener.com%2Fcomicgen%2F&quote=Make%20your%20own%20%23comics%20with%20the%20JS%20API%20by%20%40Gramener%20https%3A%2F%2Fgramener.com%2Fcomicgen%2F" class="btn btn-link py-0 pl-0 pr-1" target="_blank" rel="noopener" title="Share on Facebook">
    <i class="fab fa-facebook-square fa-2x"></i>
  </a>
  <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://gramener.com/comicgen/" class="btn btn-link py-0 pl-0 pr-1" target="_blank" rel="noopener" title="Share on LinkedIn">
    <i class="fab fa-linkedin fa-2x"></i>
  </a>
</p>
<!-- end -->
