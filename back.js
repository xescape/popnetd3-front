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


//for linear
router.get('/:file/:list.linear', getLinChr)


function changeSettings(req, res){
	console.log('changed settings!')
	settings = JSON.parse(req.body.settings)
//	console.log(req.body)
//	reload = true
	res.send('settings complete!')
}

function getLinChr(req, res){
	console.log('linear request received')
	var params = parseLinearParams(req)
	params['outpath'] = '/c/' + params['file'] + '/linear.png'
	
	svg2png(drawLinear(params))
	.then(function(buffer){
		fs.writeFileSync(__dirname + params['outpath'], buffer, function(err){
			console.log('write file error at getlinchr ' + err)
		})
		res.sendFile(params['outpath'], {root: __dirname}, function(err){ if(err) console.log('linear  sendfile error, ' + err)})
	})
	.catch(function(err){console.log('svg2png error ' + err)})
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

function parseLinearParams(req){
	
	var params = req.params
	var dir = './c/' + params['file']
	
	var id_split = JSON.parse(params['list'])[0].split("_")
	params['chr'] = id_split[1]
	
	var raw_names = JSON.parse(req.params['list']).map(function(d){return d.split("_")[0]})
	params['names'] = raw_names
	
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

function getMultiNodes(params){
		
	var names = params['names']
	
	var nodes = names.map(function(d,i){
		if(params['chr'] !== 'all'){
			
			var node = getChr(data.nodes.filter(function(e){
				return e.name === d
			})[0], params['chr'])
		}
		else{
			var node = data.nodes.filter(function(e){
				return e.name === d
			})[0]
		}
		
		return node
	})
	
	return nodes
	
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

function drawLinear(params){
	
	d3n = new d3node()
		
	var nodes = getMultiNodes(params),
		colorTable = data.colorTable
	
	var length = 600,
		height = 30,
		front = 150,
		padding = [10, 10, 10, 10], //top, right, bot, left
		margin = {top: 20, right: 20, bottom: 30, left: 40},
		scale = 5
	
	var svg = d3n.createSVG()
				 .attr("width", (length + padding[1] + padding[3]) * scale)
				 .attr("height", (height + padding[0] + padding[2]) * nodes.length + 1)
				 .append('g')
			  
	
	//various scales?
	var band = d3.scaleBand().rangeRound([0, (height + padding[0]) * nodes.length]).paddingInner(0.05).align(0.1);
	var scale = d3.scaleLinear().range([length, 0])
	
	band.domain(nodes.map(function(d){return d.name}))
	
	scale.domain([d3.max(nodes, function(d){
			return d.lengths.reduce(function(t, d){return t + parseInt(d) }, 0)
		}), 0]).nice();

	
	var selection = svg.selectAll('.nodes')
					   .data(nodes).enter().append('g')
				
	
    var stacks = selection.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
						  .selectAll('rect')
		    			  .data(function(d){return d.lengths}).enter().append('rect')
		    			 	 .attr("height", height)
		    			 	 .attr("width", function(d){ 
		    			 		//console.log(scale(d)); 
		    			 		 return scale(d) })
//		    			 		 return d})
		    			 	 .attr("y", function(d){ 
		    			 		 return band(d3.select(this.parentNode).data()[0].name)})
		    			 	 .attr("x", function(d, i){ 
		    			 		
		    			 		if(i === 0) return 0
		    			 		else{
		    			 			var prev = this.parentNode.childNodes[i - 1]
		    			 			return parseFloat(prev.getAttribute('x')) + parseFloat(prev.getAttribute('width'))
		    			 		}
		    			 		
		//    			 		return scale(d3.select(this.parentNode).data()[0].lengths.slice(0, i)
		//    			 				 .reduce(function(t, d){
		//    			 					 return t + parseInt(d)
		//    			 				 }, 0))
		    			 	})
		    			 	.attr("fill", function(d, i){
		    			 		return colorTable[d3.select(this.parentNode).data()[0].ids[i]]
		    			 	})
    			 	
    			 	
    			 
	//axes
	svg.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.attr("class", "axis")
//		.attr("transform", "translate(0" + height + ")")
		.call(d3.axisLeft(band))
	
	svg.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.attr("class", "axis")
		.call(d3.axisTop(scale))
	
    fs.writeFileSync('./asdf.xml', d3n.svgString())
		
	return d3n
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