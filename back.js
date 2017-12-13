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
router.get('/:file/:id.png', getPainting);
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

	draw()

	function draw(){
		
		console.log('drawing once')
		
		var outpath = '/c/' + params['file'] + '/' + params['id'] + "\_" + params['chr'] + '.png'
		d3n = new d3node()
		if(settings === null){settings = JSON.parse(fs.readFileSync(settingspath, 'utf8'))}
		
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
		paintChr(node, data.colorTable, outpath)
		
		var svgBuffer = new Buffer(d3n.svgString(), 'utf-8')
		svg2png(svgBuffer)
			.then(function(buffer){
				console.log(outpath)
				fs.writeFileSync(__dirname + outpath, buffer, function(err){
					console.log('write file ' + err)
				})
				res.sendFile(outpath, {root : __dirname}, function(err){ if(err) console.log('sendfile error')})
			})
			.catch(function(err){console.log('svg2png error ' + err)})
		
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
				
				console.log("n is" + n + 'inds is' + inds)
				
				return {
					ids : new_ids,
					name : node.name,
					lengths : new_lengths,
					id : node.id,
					group : node.group
				}
			}
	}
}

function paintChr(node, colorTable, outpath){
	
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

module.exports = router