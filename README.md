# comicgen

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
<script async src="https://cdn.jsdelivr.net/npm/comicgen/"></script>
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

To embed a comic, add:

```html
<div class="comicgen" name="dee" angle="straight" emotion="smile" pose="thumbsup"></div>
```

This embeds the following SVG image inside your `<div>`.
(You can embed the comic inside any tag, including `<svg>`)

![name=dee angle=straight emotion=smile pose=thumbsup](docs/dee-straight-smile-thumbsup.png)

Each comic accepts 4 attributes:

- `name`: the name of the character (e.g. `dee`, `dey`)
- `angle`: which angle are they are facing (e.g. `straight`, `side`)
- `emotion`: what emotion their face expresses (e.g. `sad`, `happy`)
- `pose`: what pose their body shows (e.g. `pointingup`, `holdinglaptop`)

The list of valid combinations are available on the
[comicgen interactive gallery](https://gramener.com/comicgen/).

The comics are drawn on a 500 x 600 canvas. You can change this using:

- `width`: width of the image
- `height`: height of the image
- `x`: x-offset
- `y`: y-offset
- `scale`: how much larger to make the image

Comicgen is tested on Chrome, Edge, and Firefox. It does not work on Internet Explorer.

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


## Contributions

- Designed by Ramya Mylavarapu <ramya.mylavarapu@gramener.com>
- Developed by Kriti Rohilla <kriti.rohilla@gramenerit.com> and S Anand <s.anand@gramener.com>
- Supported by Richie Lionell <richie.lionell@gramener.com>
