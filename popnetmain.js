/**
 * Main drawing script of the PopNetD3 platform. Contains functions for converting JSON source data
 * to nodes and edges, construction of chromosome paintings, and graph organization.
 * 
 * One JSON per graph. The JSON should formatted as:
 * {
 * 	"nodes":[
 * 		{
 * 		"name": "name",
 * 		"id": "id",
 *		"group": group name (str), 1-2 characters in upper case,
 * 		"ids": section colors of the chromosome painting. array of 1-2 char long strings,
 * 		"lengths": length of the sections defined above. array of ints,
 * 		others: other misc supporting data, not required but can be used for overlays
 * 		}
 * 	],
 * 	"edges":[
 * 		{
 * 		"id" : numeric id
 * 		"start": name of a node,
 * 		"end": name of a node,
 * 		"width": float/double value,
 * 		others: other values for overlays;
 * 		}	
 * 	]	
 * }
 * 
 * this script should define the colors based on some other method. 
 */

//TODO: User defined variables
var url = "."
var input = url + "/results/data3.json";


//define size of the image element
var base_width = 1280,
	base_height = 720,
	width = base_width * 2,
	height = base_height * 2,
	margin = 100,
	scale = 5,
	nodeRadius = 25,
	bandWidth = 10
	
// utilities
	var domparser = new DOMParser();
//TODO: init the svg element

var labelAttrs = {
	'x' : 0,
//	'y' : (10) * scale, //offsize same as fontsize?
	'y' : (nodeRadius + 20) * scale, //offsize same as fontsize?
	'font-size': 11 * scale,
	'font-family': 'Arial',
	'text-anchor': 'middle',
	'class': 'nodetext'
}

var edgeAttrs = {
	"stroke": function(d){
		if(d.width >= 0.5){
			return 'grey'
		}
		else{
			return 'lightgrey'
		}
		
	},
	'stroke-width': function(d){return translateEdge(d.width) + "px"}
}

var invisEdgeAttrs = {
	'stroke-width': 0
	}

var borderAttrs = {
	'r' : (nodeRadius + 5) * scale,
	"stroke-width": 5 * scale,
	'fill': "white",
	"fill-opacity": 100
}

var settings = {
		nodeRadius: nodeRadius * scale,
		bandWidth: bandWidth * scale,
		scale: scale,
		labelAttrs: labelAttrs,
		borderAttrs: borderAttrs
}
//create svg in body.

//simulation-based params	
var colorTable,
	baseLinkStrength = 0.0002,
	linkMultiplier = 2,
	linkOn = false,
	baseChargeStrength = 60,
	chargeMultiplier = 2,
	centerStrength = 10,
	fast = 0.3,
	slow = 0.9,
	borderWidth = settings.borderAttrs['stroke-width'] / settings.scale,
	simulation,
//	scale = 1,
	dx = 0,
	dy = 0;	
	
//Change this to a div later
var svg = d3.select("#graph").append("svg")
				.attr("width", width)
				.attr("height", height)
				.attr("transform", "translate(-" + (width - base_width) / 2 + ",-" + (height - base_height) /2 + ")")
				.attr("id", "popnet_container")
	svg.append("rect")
		.attr("width", width)
		.attr("height", height)
		.attr("fill", "gray")
					
	svg = svg.append("svg")
			 .attr("id", 'popnet')
//			   .attr("style", 'border: 1px solid black;');

//TODO: Add the control elements that let you upload a file
//listeners
var chr = 'all'
var chrn
var draw_state
var node_list = []

var cutoff = 0.5
var edge_weights = {
	
	0.90: 8,
	0.80: 6,
	0.70: 4,
	0.50: 2,
	0.40: 1,
	0.30: 1,
	0.20: 1,
	0.10: 1,
	0.00: 1
	
}
var edge_weight_keys = Object.keys(edge_weights).map(function(d){return parseFloat(d)}).sort(function(a, b){return b - a})

document.getElementById("chr").addEventListener("change", function(){
//	console.log(document.getElementById("chr").getAttribute("data-val"))
	chr = document.getElementById("chr2").value;
//	svg.html("")
//	d3.json(input, draw)
	draw_state = redraw(draw_state)
//	console.log(document.getElementById("chr2"))
})

document.getElementById("edge").addEventListener("change", function(){
//	console.log(document.getElementById("chr").getAttribute("data-val"))
	cutoff = document.getElementById("edge2").value;
//	svg.html("")
//	d3.json(input, draw)
	draw_state = redrawEdges(draw_state, cutoff)
//	console.log(document.getElementById("chr2"))
})

document.getElementById("button-reset").addEventListener("click", function(){
	svg.html("")
	d3.json(input, function(d){ draw_state = draw(d)})
})

document.getElementById("button-save").addEventListener("click", save, false);

document.getElementById("button-linear").addEventListener("click", getLinear, false);

$.post(url + '/c/settings', {settings: JSON.stringify(settings)}, function(data){
	d3.json(input, function(d){ 
		draw_state = draw(d)
		console.log('draw_state is now ' + draw_state)
		redrawEdges(draw_state, document.getElementById("edge2").value)
	})
})

document.getElementById("uploadBtn").onchange = function () {
    document.getElementById("uploadFile").value = this.files[0].name;
};

document.getElementById("submit").addEventListener("click", submit, false);

document.getElementById("launch").addEventListener("click", launch, false);

document.getElementById("example").addEventListener("click", launch_example, false);



function submit(){
	
	console.log("submitting")	
	defaults = {
		'species': 'pla',
		'format': 'tab',
		'reference': 'none',
		'ival': 4,
		'pival':1.5,
		'sl':5000
		}
	
	var config = new FormData(),
		ival = document.getElementById("ival").value,
		pival = document.getElementById("pival").value,
		sl = document.getElementById("sl").value
		
	config.append('test', 'asdf')
	config.append('species', document.getElementById("species").value)
	config.append('format', document.getElementById("input").value)
	config.append('reference', document.getElementById("reference").value)
	config.append('ival', document.getElementById("ival").value)
	config.append('pival', document.getElementById("pival").value)
	config.append('sl', document.getElementById("sl").value)
	config.append('file', document.getElementById("uploadBtn").files[0], document.getElementById("uploadBtn").files[0].name)
	config.append('email', document.getElementById("email").value)
	
	var flag = false
	for(let i of Object.keys(defaults)){
		if(config.get(i) == null){
			config.set(i, defaults.i)
			flag = true
		}
	}
	if(flag==true){
		alert('empty values have been replaced with defaults.')
	}
		
	
	console.log(config)
	
	if(0 > ival > 20 || 0 > pival > 20 || 0 > sl){ alert("Please set appropriate cluster parameters according to tooltip.")}
	else{
		
		var request = new XMLHttpRequest();
		request.open('POST', url + "/data/run")
		
		request.onreadystatechange = function(){
			if(request.readyState == XMLHttpRequest.DONE && request.status == 200){
				alert('Your job has been received. Please wait for an email response when it is completed.')
			}
		}
		
		request.send(config)
	}
	
	
}

function launch(){
	id = document.getElementById('jobid').value
	input = url + "/results/" + id + ".json"
	svg.html("")
	d3.json(input, function(d){ 
		draw_state = draw(d)
		console.log('draw_state is now ' + draw_state)
		redrawEdges(draw_state, document.getElementById("edge2").value)
	})
}

function launch_example(){
	id = "data3"
	input = url + "/results/" + id + ".json"
	svg.html("")
	d3.json(input, function(d){ 
		draw_state = draw(d)
		console.log('draw_state is now ' + draw_state)
		redrawEdges(draw_state, document.getElementById("edge2").value)
	})
}


//TODO: load graph data


function draw(data){
	//session variables
	colorTable = data.colorTable
	//prep for chr zooming
	chr_count = countChrs(data.nodes[0].ids)
	updateChrs(chr_count)
	updateEdgeCutoff()
	
	//bind forces
	simulation = d3.forceSimulation()
		.force("link", d3.forceLink().id(function(d) { return d.name; }).strength(0))
//		.force("charge", d3.forceManyBody().strength(0))
		.force("collide",d3.forceCollide( function(d){return nodeRadius }).iterations(1))
//		.force("center", d3.forceCenter(width / 2, height / 2));
//		.force("y", d3.forceY(width/3))
//	    .force("x", d3.forceX(height/3))
	
	//simulation behavior
	//allows forces to rearrange in the beginning and then shut them off
	//drag behavior. Activates charge and link force
	function dragStartGroup(d){
		d3.event.sourceEvent.stopPropagation();
		if (!d3.event.active){
			
			if(!linkOn){
				linkOn = true;
//				simulation.force('link').strength(function(d){return baseLinkStrength * d.width;});
//				simulation.force('charge').strength(baseChargeStrength)
				console.log('link on')
			}
			
			simulation.alpha(0.3).restart();
			d.fx = d.x;
			d.fy = d.y;	
			
			d.tx = d.x;
			d.ty = d.y;
		}
	}

	function draggedGroup(d){
		
		simulation.alpha(0.2)
//		d.tx = boundx(d.tx + d3.event.dx);
//		d.ty = boundy(d.ty + d3.event.dy);
		
		d.fx = boundx(d.fx + d3.event.dx);
		d.fy = boundy(d.fy + d3.event.dy);
		
		d3.select('.temp')
			.attr("cx", d3.event.x + nodeRadius + borderWidth * 2)
			.attr("cy", d3.event.y + nodeRadius + borderWidth * 2)

	}

	function dragEndGroup(d){
		if (!d3.event.active){
			linkOn = false;
			simulation.alpha(0.1)
//				.force('link').strength(0);
			
//			simulation.force('charge').strength(0);

			d.x = d.fx;
			d.y = d.fy;
			
			d.fx = null;
			d.fy = null;
			
			d3.selectAll(".temp").remove()
			groupCircle(simulation, false);
		}
	}
		
		
		
	function dragStart(d){
//	d3.event.sourceEvent.stopPropagation();
		if (!d3.event.active){
			
			if(!linkOn){
				linkOn = true;
	//				simulation.force('link').strength(function(d){return baseLinkStrength * d.width;});
	//				simulation.force('charge').strength(baseChargeStrength)
				console.log('link on')
			}
			
			simulation.alpha(0.3).restart();
			d.fx = d.x;
			d.fy = d.y;	
			
			d.tx = d.x;
			d.ty = d.y;
	
			container.append('circle')
				.attr("class", "temp")
				.attr("fill", "none")
				.attr("r", nodeRadius)
				.attr("stroke", "gray")
				.attr("stroke-width", '5')
				.attr("cx", d.tx + nodeRadius + borderWidth * 2)
				.attr("cy", d.ty + nodeRadius + borderWidth * 2)
			}
	}

	function dragged(d){
		simulation.alpha(0.2)
		d.tx = boundx(d.tx + d3.event.dx);
		d.ty = boundy(d.ty + d3.event.dy);
		
		d3.selectAll(".temp")
			.attr("cx", d3.event.x + nodeRadius + borderWidth * 2)
			.attr("cy", d3.event.y + nodeRadius + borderWidth * 2)
	}

	function dragEnd(d){
		if (!d3.event.active){
			linkOn = false;
			simulation.alpha(0.1)
//				.force('link').strength(0);
//			simulation.force('charge').strength(0);
			d.x = d.tx;
			d.y = d.ty;
			
			d.fx = null;
			d.fy = null;
			
			d3.selectAll(".temp").remove()
//			groupCircle(false);
		}
	}

	
	function zoomed(d){
		container.attr("transform", d3.event.transform);
		var scale = d3.event.transform.k
		dx = d3.event.transform.x
		dy = d3.event.transform.y
//		width = base_width / scale
//		height = base_height / scale
		
//		console.log('dx ' + dx + '\ndy '+ dy + "\nw " + width + "\nh " + height + "\ns " + scale)
//		console.log(simulation.nodes()[0].x)

	}
	
	var drag = d3.drag()
		.on("start", dragStart)
		.on("drag", dragged)
		.on("end", dragEnd);	
	

	
	var zoom = d3.zoom()
				.scaleExtent([0.1,10])
				.on("zoom", zoomed)
				.filter(function(){
					return !d3.event.click
				});
	//tick behavior		
	simulation.on('tick', function(){
		
			simulation.nodes().forEach(function(d){
				d.x = boundx(d.x)
				d.y = boundy(d.y)
			})
		
			edges.attr("x1", function(d){return d.source.x + nodeRadius + borderWidth;})
				.attr("y1", function(d){return d.source.y + nodeRadius + borderWidth * 1.5;})
				.attr("x2", function(d){return d.target.x + nodeRadius + borderWidth;})
				.attr("y2", function(d){return d.target.y + nodeRadius + + borderWidth * 1.5;})
				
			nodes.attr("transform", function(d){
				return "translate(" + d.x + "," + d.y + ")"});
			
			d3.selectAll('.group').attr("transform", function(d){
				return "translate(" + d.x + "," + d.y + ")"});
			
			
			d3.selectAll('.glink').attr("x1", function(d){return d.source.x;})
			.attr("y1", function(d){return d.source.y;})
			.attr("x2", function(d){return d.target.x + nodeRadius + borderWidth;})
			.attr("y2", function(d){return d.target.y + nodeRadius + borderWidth;})
	});
	
	
	//construct nodes and edges	
	var container = svg.append("g");
	
	container.append("rect")
	.attr("width", width)
	.attr("height", height)
	.attr("fill", "white")
	
	var edges = container.append("g")
	.attr("class", "link")
		.selectAll(".link")
		.data(minEdges(data.edges, 0)).enter()
		.append('line');
	attachAttr(edges, edgeAttrs);
	
	var nodes = container.selectAll(".node")
	.data(data.nodes)
	.enter().append("g")
		.attr("class", "node")
//		.each(function(d, i){
//			d.x = randRange(margin, width - margin),
//			d.y = randRange(margin, height - margin);;
//		});

	nodes
		.call(drag)
		.each(getChr)
//		.call(getChr(d))
//		.append(function(d){return getChr(d);})
//	nodes.each(function(d){appendSVG(d)});
	
	
	//bind nodes and edges	
	simulation.nodes(data.nodes)
		.force("link")
		.links(data.edges);
	
	
	//zoom and pan behavior
	svg.call(zoom)
	   .on("click", null)
	
	groupForce(simulation, container);
	groupCircle(simulation, true);
	forceInit();
	
	return {
		simulation: simulation,
		nodes: nodes,
		edges: edges
	}

//	console.log(document.getElementById('chr').value)
	
	//draw invisible vectors for zooming
//	nodes.append(function(d){return getZoomVectors(d)})
	function groupForce(sim, container){
		
		//make an invis node for each group, and link it to each member
		//with a width of 10000, then apply a link force
		function getGroup(g, e){
			if(!contains(g, e.group)){
				g.push(e.group);
			}
			return g
		}
		function getGroupMembers(g){
			return sim.nodes().filter(function(d){
				return d.group === g.name;
			})
		}
		function toNode(d, i){
			return {
				'name': d,
				'id': sim.nodes().length + i};
		}
		function contains(a, obj) {
		    for (var i = 0; i < a.length; i++) {
		        if (a[i] === obj) {
		            return true;
		        }
		    }
		    return false;
		}

		
		var groups = sim.nodes().reduce(getGroup, []);
		var gnodes = groups.map(toNode);
		var glinks = [];


		var groupDrag = d3.drag()
		.on("start", dragStartGroup)
		.on("drag", draggedGroup)
		.on("end", dragEndGroup);
		
		var s = container.selectAll('.group').data(gnodes)
				.enter().append('g')
				.attr('class', 'group')
				.each(function(d, i){
					d.x = randRange(margin, width - margin),
					d.y = randRange(margin, height - margin),
					d.fx = d.x;
					d.fy = d.y;
					d.group = true;
				})
				.call(groupDrag);
		
		s.append('circle')
			.attr('fill', function(d){return colorTable[d.name]})
			.attr('r', 10);

		sim.nodes(data.nodes.concat(gnodes));
		
		gnodes.forEach(function(g){
			getGroupMembers(g).forEach(function(m){
				var tmp = {
					source: g.name,
					target: m.name,
					width: 1 //unique characteristic of this!
				}
				glinks.push(tmp)

			})
		})
		
		var e = container.selectAll('.glink')
				.data(glinks).enter()
//				.append('line')
//				.attr('class' , 'glink');
//		attachAttr(e, invisEdgeAttrs);
				
		sim.force('glink', d3.forceLink().id(function(d){return d.name;}).strength(0));
		sim.force('glink').links(glinks);

		return sim	
	}
}


function updateChrs(n){
	chrn = n
	
	var all = "<li class=\"mdl-menu__item\" data-val=\"all\">All</li>\n"
	
	var html = _.range(n).map(function(val){
		val = val + 1
		return "<li class=\"mdl-menu__item\" data-val=\"CHR" + val + "\">Chromosome " + val + "</li>\n"
	}).join('')
	
	document.getElementById('chr_select').innerHTML = all + html;
	getmdlSelect.init('.getmdl-select')
}


function updateEdgeCutoff(){
	var all = "<li class=\"mdl-menu__item\" data-val=\"0.5\">Default(0.5)</li>\n"
		
	var html = Object.keys(edge_weights).map(function(val){
		return "<li class=\"mdl-menu__item\" data-val=\"" + val + "\">" + val + "</li>\n"
	}).join('')
	
	document.getElementById('edge_select').innerHTML = all + html;
	getmdlSelect.init('.getmdl-select')
}


function countChrs(ids){
	var n = ids.reduce(function(total, curr){
				
		if(curr === 'SPACER'){
			return total + 1
		}
		else{
			return total
		}
	}, 0)
	
	return n	
}

function translateEdge(p){
	
	
	var a = edge_weight_keys.map(function(a){return Math.abs(parseFloat(a) - p)})
	var b = a.indexOf(Math.min(...a))
	
	console.log(p)
	console.log(a)
	
//	console.log('value ' + p + ' translated to ' + edge_weights[edge_weight_keys[b]])
	if(edge_weight_keys[b] <= p){
		return edge_weights[edge_weight_keys[b]]
	}
	else{
		return edge_weights[edge_weight_keys[b] + 1]
	}
	
	
}

function redrawEdges(state, cutoff){
	
	console.log('cut off is ' + cutoff)
	
	state.edges.attr('visibility', 'hidden')
	
	state.edges.filter(function(d){ return d.width > cutoff}).attr('visibility', 'visible')
	
	return state
	
}

//console.log('beep')
//console.log(simulation.nodes().filter(function(d){
//	return d.group === true;
//}));
//d3.selectAll('.glink').each(function(d){console.log(d)})

//document.getElementById("button-save").addEventListener("click", function(){
//	alert('saved!')
//})





function boundx(i){ //keeps nodes in the boundaries
	
	if(i<0){
		return 0;
	}
	if(i>=(width - 2 * nodeRadius)){
		return width - 2 * nodeRadius;
	}
	return i
	
}

function boundy(i){ //keeps nodes in the boundaries
		
	if(i<0){
		return 0;
	}
	if(i>=height - 2 * nodeRadius - labelAttrs['font-size']){
		return height - 2 * nodeRadius - labelAttrs['font-size'];
	}
	return i
}

function appendSVG(node){
	console.log(node)
	var file = input.match(/[/](\w+?).json/)[1]
	var svgpath = "./c/" + file + "/" + node.name + "\_" + chr + ".svg"
	
//	console.log(node)
	
	var svgtext = $.get(svgpath, function(){
		svgdom = domparser.parseFromString(svgtext.responseText, "image/svg+xml").querySelectorAll("[name='" + node.name + "']")[0]
		svgdom.removeAttribute("xmlns")


		//listener for chr switching
		if(chr === 'all'){
			
			var arcs = svgdom.childNodes[0].childNodes
			
			console.log(_.range(d3.select("[name=\"" + node.name + "\"]")))
			
			var arc_nodes = d3.select(this).selectAll('.arcs').data(_.range(arcs.length))
			
//			var arc_nodes = d3.select("[name=\"" + node.name + "\"]").selectAll('.arcs').data(_.range(arcs.length))
//			.enter()
//			.append(function(d){
//				return arcs[d]
//			})

			arc_nodes.each(function(d, i){
				d.on('click', function(){
					console.log('event clicked!')
					chr = 'CHR' + (i + 1)
					redraw()
				})
			})

		}
		console.log(node)
		
		
	})
	
}


function getChr(node){
//	console.log('getchr')
//	console.log(node)
	
	var file = input.match(/[/](\w+?).json/)[1]
	var e = document.createElementNS("http://www.w3.org/2000/svg", "svg")
	var svg = d3.select(this).append(function(d){ return e}).attr("name", node.name)
//	console.log(node)
	
	var path = "./c/" + file + "/" + node.name + "\_" + chr + ".png"
	var svgpath = "./c/" + file + "/" + node.name + "\_" + chr + ".svg"
	var ref_this = this
	
	svg.attr("height", (nodeRadius * 2 + borderWidth * 4) * scale + + labelAttrs['font-size'])
	.attr("width", (nodeRadius * 2 + borderWidth * 4) * scale)
	
	
	
	var g = svg.append('g')
	.attr("transform", "scale(" + 1 / scale + ")")
//	.attr("transform", "scale(" + 0.1 + ")")
	
	getDataURI(path, function(uri){
		g.append("image")
		 .attr("xlink:href", uri)
		 .attr("width", (nodeRadius * 2 + borderWidth * 4) * scale)
		 .attr("height", (nodeRadius * 2 + borderWidth * 4) * scale + labelAttrs['font-size'])
		
		var svgtext = $.get(svgpath, function(){
			svgdom = domparser.parseFromString(svgtext.responseText, "image/svg+xml").querySelectorAll("[name='" + node.name + "']")[0]
			svgdom.removeAttribute("xmlns")
	
			//listener for chr switching
			if(chr === 'all'){
				
				var arcs = Array.from(svgdom.childNodes[0].childNodes)

				
				var archeader = svgdom.childNodes[0]

				var zzz = _.range(arcs.length)

				var arc_nodes = g.append(function(d){return archeader;})
								.selectAll('.arcs').data(zzz)
								.enter()
								.append(function(e){
									return arcs[e];
								})
//								.attr("transform", "scale(" + 1 / scale + ")")

								
				arc_nodes.each(function(d, i){
					
//					console.log('attaching trigger to chr ' + (i + 1))
//					console.log('d is ' + d + ' i is ' + i)
					
					d3.select(this).on('click', function(){
						console.log('event clicked!')
						chr = 'CHR' + (i + 1)
//						console.log('chr is ' + chr)
						redraw(draw_state)
					})
					
				})
	
			}
			else{
				g.on("click", function(){
					
					if($.inArray(node.name, node_list) >= 0){
						d3.select(this).selectAll(".selected").remove()
						node_list.splice(node_list.indexOf(node.name), 1)
						console.log(node.name + " removed from")
					}
					else{
						d3.select(this).append('circle')
						.attr("class", "selected")
						.attr("fill", "none")
						.attr("r", settings.nodeRadius)
						.attr("stroke", "yellow")
						.attr("stroke-width", '20')
						.attr("cx", 40 + settings.nodeRadius + borderWidth * 2)
						.attr("cy", settings.nodeRadius + borderWidth * 2 + 40)
					
						node_list.push(node.name)
						console.log(node.name + " added to list")
					}
					
				})
			}
//			console.log(node)
			
		})
	})
//	return e
	
	
//	console.log(svgdom)
//	svgdom.setAttribute("height", (nodeRadius * 2 + borderWidth * 4) * settings.scale + labelAttrs.y)
//	svgdom.setAttribute("width", (nodeRadius * 2 + borderWidth * 4) * settings.scale)
//	svgdom.setAttribute("transform", "scale(" + 1 / scale + ")")
	
//	svg.append(svgdom)
		
// you have to attach it as some inner html
	
	function getDataURI(path, callback){
		var image = new Image()
		var	data;
		image.onload = function(){
			var canvas = document.createElement('canvas')
			canvas.width = this.naturalWidth
			canvas.height = this.naturalHeight
			canvas.getContext('2d').drawImage(this, 0, 0)
			callback(canvas.toDataURL('image/png'))
		}
		
		image.src = path

	}
	
}


//draws invisible vectors over the actual donut so you can click to zoom
//should work a lot like paintChr
function getInvisVectors(node){
	
}

//TODO: load chromosome painting data
//data should be like {name: name, ids: [id], lengths: [lengths]}
//color table should be like {id: color}
function paintChr(node){

	e = document.createElementNS("http://www.w3.org/2000/svg", "svg")
		
	var svg = d3.select(e)
		.attr("width", nodeRadius * 2.2)
		.attr("height", nodeRadius * 2.2 + labelAttrs.y)
		.attr("name", node.name)
		.append("g")
			.attr("transform", "translate(" + (nodeRadius * 1.1) + "," + (nodeRadius * 1.1)  + ")");
	var	arc = d3.arc()
		.outerRadius(nodeRadius - 10)
		.innerRadius(nodeRadius - bandWidth);
	
	var pie = d3.pie()
		.sort(null)
		.value(function(d){
			return d;
		});
	
	var circle = svg.append("circle")
				.attr("stroke", function(d){ return colorTable[node.name]});
	attachAttr(circle, borderAttrs);

	
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
	attachAttr(label, labelAttrs)
	
	return e
}

//attaches static attibutes to things. So they can be arranged like CSS sheets.
function attachAttr(selection, attribute){
	Object.keys(attribute).forEach(function(d){
		selection.attr(d, attribute[d]);
	})
	return selection;
}

function randRange(min, max){
	return Math.floor(Math.random() * (max - min) + min)
}

//TODO: construct a network with force directed and update
function forceInit(){
	
//	simulation.force("link").strength(function(d){ return baseLinkStrength * d.width * 5});
//	simulation.force("charge").strength(baseChargeStrength * chargeMultiplier);
//	simulation.velocityDecay(fast);
	
	var t = d3.timeout(function(){
//		simulation.force("link").strength(0);
//		simulation.force("charge").strength(0);
		simulation.velocityDecay(slow);
		simulation.alpha(0);
	}, 1)
	
	return t
	
	
}



function groupCircle(simulation, reset = false){
	
	function getGroupMembers(nodes, g){
		//get the members of a group give the group node
		//uses members from a higher scope
		return nodes.filter(function(d){
		
			return d.group === g.name;
		})
	}
	
	function calculatePositions(g, n){
		//calculated x positions in a circle around the center
		//when each node has a certain radius
		
		function calcRings(n, m, k){
		//n is how many nodes you still have, m is how many nodes are in this ring
		// for now let's have m and k start off the same
			if(n <= m){
				return [n]
			}
			else{
				var a = calcRings(n - m, m + k, k)
				a.unshift(m)
				return a
			}
		}
		
		function placeNodes(g, n, i, k){
			var r = Math.max(n * (nodeRadius * 2 + borderWidth * 4) / (2 * Math.PI), Math.max(2 * (nodeRadius + 20), k * (i + 1) * (nodeRadius * 2 + borderWidth * 4) / (2 * Math.PI)))
			return _.range(n).map(function(i){
				return {
					x: g.x + r * Math.cos(2 * Math.PI * i / n) - nodeRadius - 10,
					y: g.y + r * Math.sin(2 * Math.PI * i / n) - nodeRadius - 10
				}
			})	
		}
			
		var k = 8 //8 more per ring
		var rings = calcRings(n, k, k) //inner ring
		var results = rings.map(function(n, i){ return placeNodes(g, n, i, k)})
		
		console.log(results)
		
		return results.reduce(function(a, b){ return a.concat(b)}, [])
		
		
	}
	
	function positionNodes(nodes, g){
		var members = getGroupMembers(nodes, g),
			positions = calculatePositions(g, members.length, nodeRadius);
		
//		console.log(members)
		
		members.forEach(function(x, i){
			x.x = positions[i].x
			x.y = positions[i].y
			
//			console.log('node repos: ' + x.x + " , " + x.y)
		})	
	}
	
	function positionCenters(n){
		//n is how many centers
		//just gives everyone an equal space
		//returns a list of n length

		var x = Math.ceil(Math.sqrt(n)) - 1,
			ls = [],
			c = 0,
			xorigin = (width - base_width) / 2,
			yorigin = (height - base_height) / 2,
			xstep = Math.ceil(base_width / Math.ceil(Math.sqrt(n))),
			xstart = xorigin + Math.ceil(xstep / 2),
			ystep = Math.ceil(base_height / Math.ceil(Math.sqrt(n))),
			ystart = yorigin + Math.ceil(ystep/2);
			
		for( var i = 0; i <= x; i++){
			for( var j = 0; j <= x; j++){
				if(c >= n) break;
				ls.push([xstart + xstep * i, ystart + ystep * j]);
				c++;
			}
			if(c >= n) break;
		}
		
		return ls;			
	}
	
//	console.log(simulation)
	var nodes = simulation.nodes(),
		centers = nodes.filter(function(d){
			return d.group === true;
		})
	
	if(reset === true){
		positionCenters(centers.length).forEach(function(p, i){
			centers[i].x = p[0]
			centers[i].y = p[1]
			
			centers[i].fx = centers[i].x
			centers[i].fy = centers[i].y
			
//			console.log(centers[i].x + " , " + centers[i].y)
		}) //positions the centers
	}
	
	centers.forEach(function(g){
		positionNodes(nodes, g)
	}) //positions the nodes

}

//function save(){
//    // Select the first svg element
//    var thissvg = document.getElementById("popnet"),
//    	img = new Image(),
//        serializer = new XMLSerializer(),
//        svgStr = serializer.serializeToString(thissvg),
//		svgBlob = new Blob([svgStr], {type: 'image/svg+xml;charset=utf-8'}),
//		DOMURL = window.URL || windows.webkitURL || window,
//		url = DOMURL.createObjectURL(svgBlob),
//		canvas = document.createElement("canvas"),
//		scale = 10;
//    
//    document.body.appendChild(canvas);
//    canvas.style.width = width + 'px';
//    canvas.style.height = height + 'px';
//    canvas.width = Math.ceil(width * scale);
//    canvas.height = Math.ceil(height * scale);
//    
//    var ctx = canvas.getContext("2d")
//    ctx.scale(scale, scale)
//    
//	img.onload = function () {
//    	ctx.drawImage(img, 0, 0);
//    	DOMURL.revokeObjectURL(url);
//
//	    var imgURI = canvas
//	        .toDataURL('image/png')
//	        .replace('image/png', 'image/octet-stream');
//	    
//	    triggerDownload(imgURI);
//    }
//    
//	img.src = url
//}

function save(){
	
	var target = document.getElementById("popnet")
	doc = new PDFDocument({
		size: [width, height]
	})
	stream = doc.pipe(blobStream())
	
	//add content
	SVGtoPDF(doc, target, 0, 0, {useCSS:true})
	doc.end()
	stream.on('finish', function(){
//		blob = stream.toBlob('application/pdf')
		url = stream.toBlobURL('application/pdf')
		triggerDownload(url);
	})
}

function triggerDownload(imgURI){
    var evt = new MouseEvent('click', {
        view: window,
        bubbles: false,
        cancelable: true
      });

	var a = document.getElementById('dl');
	a.setAttribute('download', 'popnet.pdf');
	a.setAttribute('href', imgURI);
	a.setAttribute('target', '_blank');
	
	a.dispatchEvent(evt);
}    




function redraw(state){
	
	var nodes = state.nodes
	console.log('redraw')
	console.log(nodes)
	
	nodes.each(function(){
//		console.log(this)
		this.removeChild(this.childNodes[0])
	})
	nodes.each(getChr)
	
	return state
}


function getLinear(){
//	chr = 'CHR1'
//	node_list = ["B73", 'ME49', "TGSK", "RAY"]
	if(document.getElementById('linear')){
		removeLinearPanel()
	}	
	else{
		
		createLinearPanel()
		
		var length = 900,
			height = 40,
			front = 300,
			margin = {top: 20, right: 20, bottom: 30, left: 20},
			padding = [10, 10, 10, 10]
		
		var attach = JSON.stringify(node_list.map(function(d, i){
			return d + "\_" + chr		
		}))
		
		
		var file = input.match(/[/](\w+?).json/)[1]
		var e = document.createElementNS("http://www.w3.org/2000/svg", "svg")
		var svg = d3.select(this).append(function(d){ return e})
		            
	//	console.log(node)
		
		var path = "./c/" + file + "/" + attach + ".linear"
		
		svg.attr("width", length + padding[1] + padding[3] + front + margin.left + margin.right)
		 .attr("height", (height + padding[0] + padding[2]) * node_list.length + 1 + margin.top + margin.bottom)
		 .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		
//		svg.attr("height", (nodeRadius * 2 + borderWidth * 4) * settings.scale + labelAttrs.y)
//		.attr("width", (nodeRadius * 2 + borderWidth * 4) * settings.scale)
//		.attr("transform", "scale(" + 1 / scale + ")")
	//	.attr("transform", "scale(" + 0.1 + ")")
		
		getDataURI(path, function(uri){
			svg.append("image").attr("xlink:href", uri)		
			document.getElementById('linear_panel').appendChild(e)
		})
		
		
		
		function getDataURI(path, callback){
			var image = new Image()
			var	data;
			image.onload = function(){
				var canvas = document.createElement('canvas')
				canvas.width = this.naturalWidth
				canvas.height = this.naturalHeight
				canvas.getContext('2d').drawImage(this, 0, 0)
				callback(canvas.toDataURL('image/png'))
			}
			
			image.src = path
	
		}
		
	}
}

function createLinearPanel(){
	
	var container = document.getElementById('graph_container')
	var outer = document.createElement('div')
	var top = document.createElement('div')
	var tt = document.createElement('div')
	var main = document.createElement('div')
	var close = document.createElement('button')
	
	container.append(outer)
	outer.appendChild(top)
	top.appendChild(tt)
	top.appendChild(close)
	outer.appendChild(main)
	
	
	
	outer.classList.add("mdl-card")
	top.classList.add("mdl-card__title")
//	tt.classList.add("mdl-card__title-text")
	main.classList.add("mdl-card__media")
	main.classList.add("mdl-card__border")
	
	outer.id = 'linear'
	outer.style.width = 'fit-content'
	outer.style.position = 'absolute'
	outer.style.right = '20px'
	outer.style.bottom = '80px'
	outer.style.zIndex = '100'
	outer.style.border = '1px solid black'
	outer.style.overflow = 'auto'
	outer.style.display = 'block'
	
	main.id = 'linear_panel'
	main.style.backgroundColor = 'white' 
	top.id = 'linear_header'
	top.style.height = '10px'
	top.style.backgroundColor = '#3f51b5'
//	top.style.position = "relative"

	tt.style.fontSize = '12pt'	
	tt.style.color = 'white'
	tt.innerHTML = "Chromosome Alignment Panel"
	
	close.innerHTML = '<i class="material-icons">close</i>'
	close.style.outline = "none"
	close.style.backgroundColor = "Transparent"
	close.style.overflow = "hidden"
	close.style.border = "0px solid black"
	close.style.position = "absolute"
	close.style.right = "10px"
	close.addEventListener('click', removeLinearPanel)
		
	dragElement(outer)
}

function removeLinearPanel(){
	document.getElementById('graph_container').removeChild(document.getElementById('linear'))
}


function dragElement(elmnt) {
	  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
	  if (document.getElementById(elmnt.id + "_header")) {
		/* if present, the header is where you move the DIV from:*/
		document.getElementById(elmnt.id + "_header").onmousedown = dragMouseDown;
	  } 
	  else {
	    /* otherwise, move the DIV from anywhere inside the DIV:*/
	    elmnt.onmousedown = dragMouseDown;
	  }
	
	  function dragMouseDown(e) {
		console.log('trying to drag!')
	    e = e || window.event;
	    // get the mouse cursor position at startup:
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
	// call a function whenever the cursor moves:
	    document.onmousemove = elementDrag;
	  }
	
	  function elementDrag(e) {
	    e = e || window.event;
	    // calculate the new cursor position:
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
	// set the element's new position:
		elmnt.style.bottom = (parsepx(elmnt.style.bottom) + pos2) + "px";
		elmnt.style.right = (parsepx(elmnt.style.right) + pos1) + "px";
	  }
	
	  function closeDragElement() {
	    /* stop moving when mouse button is released:*/
		console.log('stopped trying to drag')
	    document.onmouseup = null;
	    document.onmousemove = null;
	  }
	  
	  function parsepx(string){
		  return parseInt(string.substring(0,string.length - 2))
	  }

}

function minEdges(array, min){
	  for(i in _.range(array.length)){
		  
		  if(array[i].width <= min){
			  array[i].width = min
		  }
	  }

	  return array
}
    // You could also use the actual string without base64 encoding it:
    //img.src = "data:image/svg+xml;utf8," + svgStr;

    
//    // Now save as png
//    
//    var dt = canvas.toDataURL('image/png');
//    /* Change MIME type to trick the browser to downlaod the file instead of displaying it */
//    dt = dt.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');
//    /* In addition to <a>'s "download" attribute, you can define HTTP-style headers */
////    dt = dt.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=popnet.png');
//    location.href = dt;
//    console.log(dt)





