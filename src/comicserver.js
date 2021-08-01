/* eslint-disable no-console */

const comicgen = require('./comicgen')(require('fs'))
const express = require('express')
const bodyParser = require('body-parser')
const sharp = require('sharp')

const app = express()
app.use(bodyParser.urlencoded({ extended: false }))

app.use(express.static('.'))

app.get('/comic', async (req, res) => {
  const start = new Date()
  let result = comicgen(req.query)
  res.set('Cache-Control', 'public, max-age=3600')
  res.set('Access-Control-Allow-Origin', '*')
  if (req.query.ext && req.query.ext.match(/png/i)) {
    res.set('Content-Type', 'image/png')
    result = await sharp(Buffer.from(result, 'utf8')).toFormat('png', { colors: 256 }).toBuffer()
  } else {
    res.set('Content-Type', 'image/svg+xml')
  }
  res.send(result)
  const duration = +new Date() - start
  console.log(start, duration, req.url)
})


app.listen(3000, () => {
  console.log('Comicgen is running at http://localhost:3000')
})
