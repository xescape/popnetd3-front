#!/usr/bin/env node
/**
 * 
 */


const express = require('express')
const back = require("./back.js")
const run = require("./run.js")
const app = express()
const bodyParser = require('body-parser')
//const ada = require('./adapter.js')


app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(express.static('/var/html/popnetd3-front'));

app.use('/c', back);
app.use('/data', run);

app.get('/', function (req, res) {
  res.redirect('/index.html')
})


app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
