const comic = require('../src/comicserver')
const express = require('express')
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.urlencoded())

app.get('/', (req, res) => {
  res.send(comic(req.query))
})


app.listen(3000, () => {
  console.log(`Example app listening at http://localhost:3000`)
})
