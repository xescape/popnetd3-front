/**
 * 
 */

var express = require('express')
var router = express.Router()
var fs = require('fs-extra')
const { exec } = require('child_process')
var nodemailer = require('nodemailer')
var multer = require("multer")
var upload = multer()

var dir = "./data"
var absdir = "/home/javi/workspace/popnetd3-front/data"
var results = "./results"
var ids = './ids.txt'
var baseconfig = './bin/baseconfig.txt'
var execpath = './popnet/PopNet.py'
	
	
var cpUpload = upload.fields([{name: 'species', maxCount: 1}, {name: 'format', maxCount: 1}, 
								{name: 'reference', maxCount: 1},{name: 'ival', maxCount: 1},
								{name: 'pival', maxCount: 1},{name: 'sl', maxCount: 1},
								{name: 'file', maxCount: 1},{name: 'email', maxCount: 1}])
	
router.post('/run', cpUpload, run)

function run(req, res){
	
	if(!fs.existsSync(dir)){
		fs.mkdirSync(dir)
	}
	
	if(!fs.existsSync(ids)){
		fs.writeFileSync(ids, "")
	}
	
	if(!fs.existsSync(res)){
		fs.writeFileSync(ids, "")
	}
	
	var id = makeid(8),
		config = req.body,
		data = req.files.file[0],
		folderpath = dir + "/" + id,
		absfolderpath = absdir + '/' + id,
		filepath = folderpath + ".tsv",
		configpath = folderpath + "_config.txt"
	
	console.log('Initiated job ' + id)	
	
	fs.appendFileSync(ids, id + "," + data.originalname + "\n", encoding='utf8')
	fs.writeFileSync(filepath, data.buffer, 'utf-8')
	makeConfig(config, id, absfolderpath, configpath)
	
	console.log("python3 " + execpath + " " + configpath)
	
	res.send('received.')
	exec("python3 " + execpath + " " + configpath, function(stdout, stederr){
		
		var oldpath = folderpath + "/cytoscape/graph.json"
		var newpath = results + "/" + id + ".json"
		fs.rename(oldpath, newpath, function(){
			console.log("Job " + id + " complete.")
		})
		
		exec("echo '" + makeEmailMessage(id) + "' | mail -s 'PopNetD3 Job Complete' " + config['email'])
		
		console.log('email sent to ' + config['email'])
		
	})	
}

function makeid(n) {
	  var text = "";
	  var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

	  for (var i = 0; i < n; i++)
	    text += possible.charAt(Math.floor(Math.random() * possible.length));

	  return text;
}

function checkid(id){
	lines = fs.readFileSync(ids, 'utf-8').split("\n")
	
	if(lines.length < 1){return false}

	for (var line of lines){
		if(line.split(",")[0] === id){
			return false
		}
		
	}
	return true
}

function makeConfig(config, id, folderpath, configpath){
	
	base = fs.readFileSync(baseconfig, 'utf-8')
	var species_map = {
		'Plasmodium(Default)': 'plasmodium',
		'Toxoplasma': 'toxoplasma',
		'Saccharomyces': 'yeast'
	}
	var input_map = {
		'Tabular(Default)': 'tabular',
		'Nucmer(In Development)': 'nucmer',
	}
	
	var species = species_map[config['species']],
		format = input_map[config['format']],
		reference = config['reference'],
		ival = config['ival'],
		pival = config['pival'],
		sl = config['sl'],
		output = folderpath,
		dir = absdir,
		filename = id + ".tsv"
		
	fs.writeFileSync(configpath, eval(base), 'utf-8')
	
}

function makeEmailMessage(id){
	
	return "Hello,\n\nYour PopNet job has completed. Please use the JobID '" + id + "' in the visualization tab of the website to retreive your results.\n\nThank you for using PopNetD3!"
	
}

module.exports = router
