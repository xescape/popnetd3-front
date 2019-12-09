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
var absdir = "/var/html/popnetd3-front/data"
var results = "./results"
var ids = './ids.txt'
var baseconfig = './bin/baseconfig.txt'
var execpath = './popnet/PopNet.py'
var selfemail = 'popnetd3@gmail.com'
	
	
var cpUpload = upload.fields([{name: 'format', maxCount: 1}, 
								{name: 'reference', maxCount: 1},{name: 'ival', maxCount: 1},
								{name: 'pival', maxCount: 1},{name: 'sl', maxCount: 1},
								{name: 'file', maxCount: 1},{name: 'email', maxCount: 1}])
var auth = {
	type: "OAuth2",
	user: "popnetd3@gmail.com",
	clientId: "279528384504-ugjngd14851tuc3moplegkkjhguoi0q6.apps.googleusercontent.com",
	clientSecret: "S66AKE_KliuWvnxd7qDPr-NR",

	// With only refresh token - BAD
	refreshToken: "1/Pkwfwwx3IpigB8mtdAGkFp1a8i6HcatZ7j5dtQnr76w",

	// With a fresh access token - OK
	accessToken: "ya29.GlscB1Dht6jPqqLq8Nm_ju5k7cvDcoWp3ZGId1_krLFSRp34rawWxZQoDkGw4LLcpRiak6Pfva6IUfGFqjNn9hKzaGpiSC24gTLmropcjnPneCP573CrEAQItddr",

	// With both accessToken and expires - BAD 
	expires: 1558728453,
	
}
var transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 465,
	secure: true,
	auth: auth,
	logger: false,
	debug: false
})
								
router.post('/run', cpUpload, run)

function run(req, res){
	try {
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
			errorpath = folderpath + "_error.txt"
		
		console.log('Initiated job ' + id)	
		
		fs.appendFileSync(ids, id + "," + data.originalname + "\n", encoding='utf8')
		fs.writeFileSync(filepath, data.buffer, 'utf-8')
		makeConfig(config, id, absfolderpath, configpath)
		
		console.log("python3 " + execpath + " " + configpath)
		
		res.send('received.')
		exec("python3 " + execpath + " " + configpath, {maxBuffer: 1024 * 1024 * 100}, function(error, stdout, stderr){

			if(!error){
				var oldpath = folderpath + "/" + id + ".json",
					newpath = results + "/" + id + ".json",
					oldheatpath = folderpath + "/Heatmaps.pdf",
					newheatpath = folderpath + `/${id}_metrics.pdf`

				fs.rename(oldpath, newpath, function(){
					fs.rename(oldheatpath, newheatpath, function(){
						transporter.sendMail(makeEmail(config.email, id, true, newheatpath), function(err, success){
							if(err){
								console.log(`emailing got this error:\n${err.message}`)
							}
							if(success){
								console.log(`email sent to ${config.email}.`)
							}
						}) //the last thing is for the error message
						console.log("Job " + id + " complete.")
						console.log(`Job ${id} success.`)
					})
				
				})}
			else{
				fs.writeFileSync(errorpath, error.message, 'utf-8')
				transporter.sendMail(makeEmail(config.email, id, false, errorpath), function(err, info){
					if(err){
						console.log(`emailing got this error:\n${err}
						code:${err.code}
						response:${err.response}
						responseCode:${err.responseCode}`)
						console.log(`and this stuff ${info}\n`)
					}
					else{
						console.log('at least the email worked.')
					}
				})
				transporter.sendMail(makeEmail(selfemail, id, false, errorpath), function(err, info){
					if(err){
						console.log(`emailing got this error:\n${err}
						code:${err.code}
						response:${err.response}
						responseCode:${err.responseCode}`)
						console.log(`and this stuff ${info}\n`)
					}
					else{
						console.log('at least the email worked.')
					}
				})
				console.log(`Job ${id} error.`)
			}

			// console.log('email sent to ' + config['email'])
			
		})
	} catch (error) {
		console.log('Run.js got into an error')
		print(error)
	}	
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

	//the base config is a a template literal that takes the various vars here.
	//the eval function fills it in.
	
	base = fs.readFileSync(baseconfig, 'utf-8')

	var reference = config['reference'],
		ival = config['ival'],
		pival = config['pival'],
		sl = config['sl'],
		autogroup = config['autogroup']
		filename = id + ".tsv",
		input = absdir + "/" + filename,
		output = folderpath,
		email = config['email']
	
	if(autogroup==="True"){
		ival = 4
		pival = 1.5
	}
		
	fs.writeFileSync(configpath, eval(base), 'utf-8')
	
}

function makeEmail(target, id, success, attachment){

	var mailOptions = {
		from: 'popnetd3@gmail.com',
		to: target
	}

	if(success){
		mailOptions.subject = 'PopNetD3 Job Complete'
		mailOptions.text = `
Hello,

Your PopNet job has completed. Please use the JobID ${id} in the visualization tab of the website to retreive your results.
A copy of the clustering metrics is attached. Please refer to the tutorial section on how to use them. 

Thank you for using PopNetD3!
`


		mailOptions.attachments = [{
			path: attachment}]
	}
	else{
		mailOptions.subject = 'PopNetD3 Job Error'
		mailOptions.text = `
Hello,

Your PopNet job ran into an error. The job ID was ${id}. Please reply to this email if you require further assistance.

A copy of the error log is attached.
`

		mailOptions.attachments = [{
			path: attachment}]
	}

	console.log(`tried to attach ${attachment}`)

	return mailOptions
		
}

module.exports = router
