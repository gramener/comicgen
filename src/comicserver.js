/* eslint-disable no-console */

const comicgen = require('./comicgen')(require('fs'))
const express = require('express')
const bodyParser = require('body-parser')
const sharp = require('sharp')
const winston = require('winston')
require('winston-daily-rotate-file')

const port = 3000
const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('.'))

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: 'comicgen-%DATE%.log',
      datePattern: 'YYYY-MM',
      zippedArchive: true
    })
  ],
})

app.get('/comic', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')

  const start = new Date()
  let result, duration
  try {
    result = comicgen(req.query)
  } catch(e) {
    return handleException(e, req, res, start)
  }
  res.set('Cache-Control', 'public, max-age=3600')
  if (req.query.ext && req.query.ext.match(/png/i)) {
    try {
      result = await sharp(Buffer.from(result, 'utf8')).toFormat('png', { colors: 256 }).toBuffer()
      res.set('Content-Type', 'image/png')
    } catch(e) {
      return handleException(e, req, res, start)
    }
  } else {
    res.set('Content-Type', 'image/svg+xml')
  }
  res.send(result)
  duration = +new Date() - start
  logger.info(`${start.toISOString()} ${duration} ${req.url}`)
})


app.listen(port, () => {
  const start = new Date()
  logger.info(`${start.toISOString()} Started http://localhost:${port}`)
})


function handleException(e, req, res, start) {
  let duration = +new Date() - start
  let error = e.toString().trim()
  logger.error(`${start.toISOString()} ${duration} ${req.url} ${error}`)
  res.set('Content-Type', 'text/plain')
  res.send(error)
}
