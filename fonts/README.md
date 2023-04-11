# Fonts

Font files were downloaded Google Fonts via this script:

```js
const GetGoogleFonts = require("get-google-fonts");
let ggf = new GetGoogleFonts();
// fonts is defined in speechbubble.js
for (let fontName of Object.keys(fonts))
  ggf.download(`https://fonts.googleapis.com/css?family=${fontName}`, {
    outputDir: fontRoot,
  });
```

... but since get [get-google-fonts@1.2.2](https://www.npmjs.com/package/get-google-fonts)
used [request@2.88.0](https://www.npmjs.com/package/request) which has a
[high vulnerability](https://github.com/request/request/issues/3411),
we're committing the font files directly.
