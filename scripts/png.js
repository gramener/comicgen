const fs = require('fs')
const glob = require('glob')
const puppeteer = require('puppeteer')
const cliProgress = require('cli-progress')

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
    })
    const page = await browser.newPage()
    const files = glob.sync('./svg/**/*.svg')
    progressBar.start(files.length, 0)
    for (let i=0; i < files.length; i++) {
      const svg_file = files[i]
      const png_file = svg_file.replace(/\/svg\//, '/png/').replace(/\.svg/, '.png')
      progressBar.update(i + 1)

      // Skip if PNG exists and PNG is newer than SVG
      if (fs.existsSync(png_file) && (fs.statSync(png_file).mtime >= fs.statSync(svg_file).mtime))
        continue

      const png_dir = png_file.replace(/\/[^/]+$/, '')
      await fs.promises.mkdir(png_dir, { recursive: true })
      const svg = (await fs.promises.readFile(svg_file)).toString()
      await page.setContent(`<html><body>${svg}</body></html>`)
      const svgElement = await page.$('svg')
      await page.setViewport({
        width: 500,
        height: 600,
        deviceScaleFactor: 2,   // humaaans and facesketch are small. So scale all characters
      })
      await svgElement.screenshot({ path: png_file, omitBackground: true })
    }
    await page.close()
    await browser.close()
  } catch (e) {
    console.log(e)    // eslint-disable-line no-console
  }
}

run_puppeteer()
