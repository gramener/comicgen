const fs = require('fs')
const comic = require('../src/comic')
const express = require('express')
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.urlencoded({ extended: false }))

app.use(express.static('.'))

app.get('/comic', (req, res) => {
  const start = +new Date()
  const result = comic(req.query)
  const duration = +new Date() - start
  res.send(result)
  console.log(duration, req.query)
})


app.listen(3000, () => {
  console.log(`Example app listening at http://localhost:3000`)
})
