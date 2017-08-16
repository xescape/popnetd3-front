/**
 * 
 */

const express = require('express')
const app = express()
//const ada = require('./adapter.js')

app.get('/', function (req, res) {
  res.redirect('/index.html')
})

app.use(express.static('/home/javi/workspace/popnetd3-front'));

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})