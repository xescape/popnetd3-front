/*
Alternative entry file for testing locally
main difference is that the location is different
*/

const express = require("express");
const back = require("./back.js");
const run = require("./run.js");
const app = express();
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("./")); // specific to local

app.use("/c", back);
app.use("/data", run);

app.get("/", function (req, res) {
  res.redirect("/index.html");
});

app.listen(3000, function () {
  console.log("PopNetD3 test running on port 3000");
});
