const fs = require('fs')
const puppeteer = require('puppeteer');
const cliProgress = require('cli-progress');
const glob = require('glob')
const { namemap, formats } = JSON.parse(fs.readFileSync('src/characters.json', 'utf-8'))

const fsPromises = fs.promises

const progressBar = new cliProgress.SingleBar({
  format: ' >> [\u001B[35m{bar}\u001b[0m] {percentage}% | ETA: {eta}s | {value}/{total}',
  barGlue: '\u001B[34m',
  barCompleteChar: '\u2591',
  barIncompleteChar: '\u2591',
  stopOnComplete: true
})


async function run_puppeteer() {
  try {
    const browser = await puppeteer.launch({
      // On Gitlab CI, running as root without --no-sandbox is not supported
      args: ['--no-sandbox'],
      // devtools: true,
      // headless: false
    })
    const width = 500, height = 600
    const page = await browser.newPage()
    const files = glob.sync('./svg/**/*.svg')
    progressBar.start(files.length, 0)
    let fileCounter = 0
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      await fsPromises.mkdir(file.replace(/\/svg\//, '/png/').replace(/\/[^/]+$/, ''), { recursive: true })

      const dest = file.replace(/\/svg\//, '/png/').replace(/\.svg/, '.png')
      progressBar.update(++fileCounter)
      if (fs.existsSync(dest)) continue

      const svg = (await fsPromises.readFile(file)).toString()
      await page.setContent(html(svg))
      const svgElement = await page.$('svg');
      await page.setViewport({ width: width, height: height, deviceScaleFactor: 2 });
      await svgElement.screenshot({ path: dest, omitBackground: true })

    }
    await page.close()
    await browser.close()
  } catch (e) {
    console.log(e)
  }
}


const html = (svg) => `
<html>
  <body>
    ${svg}
  </body>
</html>`


run_puppeteer()
