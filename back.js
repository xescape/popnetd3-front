/**
 * 
 */
var fs = require('fs-extra')
var svg2png = require('svg2png')
var d3node = require('d3-node')
var d3n = new d3node()
var d3 = d3node.d3
var express = require('express')
var router = express.Router()
var file = null
var data = null
var settings = null
var settingspath = 'settings.json'
var bodyParser = require("body-parser")
var reload = false

router.use(bodyParser.urlencoded({extended: false}))
router.use(bodyParser.json())

makeDefaultSettings(settingspath)
router.get('/:file/:id.png', getPainting)
router.get('/:file/:id.svg', getSVG)
router.post('/settings', changeSettings)
console.log('initiated once')


function changeSettings(req, res){
	console.log('changed settings!')
	settings = JSON.parse(req.body.settings)
//	console.log(req.body)
	reload = true
	res.send('settings complete!')
}

function getPainting(req, res){
	console.log('getpainting called once')
	
	var params = parseParams(req)
	params['outpath'] = '/c/' + params['file'] + '/' + params['id'] + "\_" + params['chr'] + '.png'
	if(!fs.existsSync(params['outpath'])){	
		svg2png(draw(params))
		.then(function(buffer){
			fs.writeFileSync(__dirname + params['outpath'], buffer, function(err){
				console.log('write file ' + err)
			})
			console.log('sending '+ params['outpath'])
			res.sendFile(params['outpath'], {root : __dirname}, function(err){ if(err) console.log('sendfile error, ' + err)})
		})
		.catch(function(err){console.log('svg2png error ' + err)})
	}
	else{
		console.log('sending '+ params['outpath'])
		res.sendFile(params['outpath'], {root : __dirname}, function(err){ if(err) console.log('sendfile error, ' + err)})
	}
}

function getSVG(req, res){
	console.log('getsvg called once')
	var d3n = drawSVG(parseParams(req))
//	console.log(d3n.svgString().substring(0,100))
	console.log('sending svg ' + d3n.svgString().substring(0,100))
	res.send(d3n.svgString())
}


function draw(params){
	
	console.log('drawing' + params['id'] + params['chr'])
	var outpath = params['outpath']
	
	d3n = new d3node()
	if(settings === null){settings = JSON.parse(fs.readFileSync(settingspath, 'utf8'))}
	
	var node = getNode(params)
	
	paintChr(node, data.colorTable, outpath)
	
	var svgBuffer = new Buffer(d3n.svgString(), 'utf-8')
	
	return svgBuffer
	
	console.log('draw ends for ' + outpath)
}

function drawSVG(params){
	
	d3n = new d3node()
	
	if(!params['chr'] === 'all'){
		console.log('tried to generate svg for chr')
		return d3n.append('svg')
	}
	
	console.log('drawing svg once')
	
	if(settings === null){settings = JSON.parse(fs.readFileSync(settingspath, 'utf8'))}
	
	var node = getNode(params)
	
	paintChr(node, data.colorTable, '', 'SVG')
	
	return d3n
	
}

function parseParams(req){
	
	var params = req.params
//	console.log('./' + params['file'] + '.json')
	var dir = './c/' + params['file']
	
	var id_split = params['id'].split("_")
	params['id'] = id_split[0]
	params['chr'] = id_split[1]
	
	if(!fs.existsSync(dir)){
		fs.mkdirSync(dir)
	}
	else{
		if(reload){
			console.log('clearing ' + dir)
			fs.removeSync(dir)
			fs.mkdirSync(dir)
			reload = false
		}

	}
	
	var path = './results/' + params['file'] + '.json'
	if(params['file'] != file){
		file = params['file']
		data = JSON.parse(fs.readFileSync(path, 'utf8'))
	}
	
	return params
}

function getNode(params){
		
	if(params['chr'] !== 'all'){
		
		var node = getChr(data.nodes.filter(function(e){
			return e.name === params.id
		})[0], params['chr'])
	}
	else{
		var node = data.nodes.filter(function(e){
			return e.name === params.id
		})[0]
	}
	
	return node
}



function getChr(node, chr){
	var format = /CHR([0-9]+)$/,
		n = format.exec(chr)[1]
		
	var inds = []
	for(i = 0; i < node.ids.length; i++){
		if (node.ids[i] === 'SPACER'){
			inds.push(i)
		}
	}
	
	var new_ids = node.ids.slice(inds[n-1] + 1, inds[n]),
		new_lengths = node.lengths.slice(inds[n-1] + 1, inds[n])
	
//	console.log("n is" + n + 'inds is' + inds)
	
	return {
		ids : new_ids,
		name : node.name,
		lengths : new_lengths,
		id : node.id,
		group : node.group
	}
}

function paintChr(node, colorTable, outpath, mode = 'PNG'){
	
//	e = document.createElementNS("http://www.w3.org/2000/svg", "svg")
	
	var nodeRadius = settings.nodeRadius
	var scale = settings.scale
	var borderWidth = settings.borderAttrs["stroke-width"]
	
	svg = d3n.createSVG()
			.attr("width", (nodeRadius + borderWidth * 2) * 2)
			.attr("height", (nodeRadius + borderWidth * 2) * 2 + settings.labelAttrs.y)
			.attr("name", node.name)
			.append("g")
				.attr("transform", "translate(" + (nodeRadius + borderWidth * 2) + "," + (nodeRadius + borderWidth * 2)  + ")");
	
	var	arc = d3.arc()
		.outerRadius(nodeRadius - 10)
		.innerRadius(nodeRadius - settings.bandWidth);
	
	var pie = d3.pie()
		.sort(null)
		.value(function(d){
			return d;
		});
	
	if(mode === 'PNG'){
		
		var circle = svg.append("circle")
			.attr("stroke", function(d){ return colorTable[node.name]});
		attachAttr(circle, settings.borderAttrs);

		
		var g = svg.selectAll(".arc")
			.data(pie(node.lengths))
			.enter().append("g")
			.attr("class", "arc");
		
		g.append("path")
			.attr("d", arc)
			.style("fill", function(d, i){
				return colorTable[node.ids[i]];
				});
		
		label = svg.append("svg:text")
			.text(node.name)		
		attachAttr(label, settings.labelAttrs)	
	}
	else{
				
		svg.attr("class", 'svg')
		var g = svg.selectAll(".arc")
			.data(pie(findOutline(node.ids, node.lengths)))
			.enter().append("g")
			.attr("class", "arc")
			.attr("stroke", "black")
			.attr("stroke-width", 1)
			.attr("fill-opacity", 0);
		
		g.append("path")
			.attr("d", arc)
	}
	
}

function makeDefaultSettings(path){
	
	var scale = 5
	var nodeRadius = 25 * scale
	var bandWidth = 10 * scale
	
	var settings = {
		nodeRadius : nodeRadius,
		bandWidth : bandWidth,
		scale : scale,
		borderAttrs : {
			'r' : nodeRadius + 5 * scale,
			"stroke-width": 5 * scale,
			'fill': "white",
			"fill-opacity": 100
		},	
		labelAttrs : {
			'x' : 0,
			'y' : nodeRadius + 20 * scale, //offsize same as fontsize?
			'font-size': 14 * scale + "pt",
			'font-family': 'Arial',
			'text-anchor': 'middle',
			'class': 'nodetext',
			'scale': scale
		}
	}
	
	fs.writeFile(path, JSON.stringify(settings), function(e){
		if(e){
			console.log("error error")
		}

	})
		
}

function attachAttr(selection, attribute){
	Object.keys(attribute).forEach(function(d){
		selection.attr(d, attribute[d]);
	})
	return selection;
}

function findOutline(ids, lengths){
	

	var result = [],
		run_sum = 11
	
	for(i = 1; i < ids.length; i++){
		
		run_sum += parseInt(lengths[i])
	
		
		if(ids[i] === 'SPACER'){
			result.push(run_sum)
			run_sum = 0
		}

	
		
	}
	
	result.push(run_sum)
	
	return result
	
	
}

module.exports = router