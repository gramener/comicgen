/* eslint no-console: 0 */

const path = require('path')
const express = require('express')
const glob = require('glob')

const app = express()
  .use(express.static(path.resolve(__dirname, '..')))

async function run_puppeteer() {
  const puppeteer = require('puppeteer')
  const browser = await puppeteer.launch({
    // On Gitlab CI, running as root without --no-sandbox is not supported
    args: ['--no-sandbox']
  })
  const page = await browser.newPage()
  page.on('console', msg => console.log(msg.text().trim()))    // eslint-disable-line no-console
  const paths = glob.sync('test/test-*.html')
  for (let i = 0; i < paths.length; i++) {
    let url = 'http://localhost:' + port + '/' + paths[i]
    await page.goto(url)
    try {
      await page.waitForFunction('window.renderComplete')
    } catch (e) {
      console.log('not ok ' + paths[i])
    }
  }
  await browser.close()
  server.close()
}

async function run_selenium(browser) {
  const { Builder } = require('selenium-webdriver')
  let driver
  try {
    driver = await new Builder().forBrowser(browser).build()
  } catch (e) {
    return console.error(e)
  }
  const paths = glob.sync('test/test-*.html')
  for (let i = 0; i < paths.length; i++) {
    let url = 'http://localhost:' + port + '/' + paths[i]
    try {
      await driver.get(url)
      let logs = await driver.wait((driver) => driver.executeScript('return window.renderComplete'), 30000)
      console.log(logs.join(''))
    } catch (e) {
      console.log('not ok ' + paths[i])
    }
  }
  await driver.quit()
  server.close()
}

const port = 1999
const server = app.listen(port, function () {
  // If run as "node server.js", start the HTTP server for manual testing
  if (process.argv.length <= 2)
    console.log('Server running on port ' + port)   // eslint-disable-line no-console
  // If run as "node server.js <browser>", run browser on each test case and show console log
  else {
    var browser = process.argv[2]
    if (browser == 'puppeteer')
      run_puppeteer()
    else
      run_selenium(browser)
  }
})
