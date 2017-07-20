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
var input = "http://localhost:3000/data.json";

//TODO: init the svg element

//define size of the image element
var width = 1600,
	height = 900,
	nodeRadius = 50,
	bandWidth = 25;
//create svg in body.
//Change this to a div later
var svg = d3.select("#graph").append("svg")
				.attr("width", width)
				.attr("height", height);

//TODO: Add the control elements that let you upload a file

//TODO: load node data. Assume local file
d3.json(input, function(data){
	
	var colorTable = data.colorTable;
//TODO: construct nodes and edges

	var force = d3.forceSimulation();
	
	
	
	var drag = d3.drag()
		.on("drag", function(d){
			d.x += d3.event.dx;
			d.y += d3.event.dy;
			d3.select(this).attr('transform', 'translate(' + d.x + ',' + d.y + ')');
		});

	var nodes = svg.selectAll(".node")
	.data(data.nodes)
	.enter().append("g")
		.attr("class", "node")
		.each(function(d, i){
			d.x = width * Math.random() * (1 - nodeRadius / width);
			d.y = height * Math.random() * (1- nodeRadius / height);
//			d3.select(this).attr("transform", "translate(" + d.x + "," + d.y + ")");
		});
	
	var edges = svg.append("g")
	.attr("class", "link")
		.selectAll(".link")
		.data(data.edges).enter()
		.append('line')
		.attr('stroke', 'black')
		.attr('stroke-width', 2);
	
	nodes
		.call(drag)
		.append(function(d){return paintChr(d);});

	force.nodes(nodes)
		.force("link", d3.forceLink().id(function(d){ return d.index }))
		.force("link")
		.links(data.edges);
			
	force.on('tick', function(){
			edges.attr("x1", function(d){return d.source.x;})
				.attr("y1", function(d){return d.source.y;})
				.attr("x2", function(d){return d.target.x;})
				.attr("x2", function(d){return d.target.y;})
//		
			nodes.attr("transform", function(d){
				return "translate(" + d.x + "," + d.y + ")"});
			
			edges.attr("x1", 100)
				.attr("x2", 200)
				.attr("y1", 100)
				.attr("y2", 200);
			
//			console.log(edges.attr('source'))
	});
	
	//	.size([width, height])
//		.force("link", d3.forceLink().id(function(d) { return d.index }));
	
	
	
	//TODO: load chromosome painting data
	//data should be like {name: name, ids: [id], lengths: [lengths]}
	//color table should be like {id: color}
	function paintChr(node){
		
//		console.log(node.name);
	
		e = document.createElementNS("http://www.w3.org/2000/svg", "svg")
			
		var svg = d3.select(e)
			.attr("width", nodeRadius * 2.2)
			.attr("height", nodeRadius * 2.2)
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
		
		svg.append("circle")
		.attr('r', nodeRadius)
		.attr("stroke", 'black')
		.attr("stroke-width", "2")
		.attr('fill', "white")
		.attr("fill-opacity", 100);
		
		var g = svg.selectAll(".arc")
			.data(pie(node.lengths))
			.enter().append("g")
			.attr("class", "arc");
			
		g.append("path")
			.attr("d", arc)
			.style("fill", function(d, i){
				return colorTable[node.ids[i]];
				});

		return e
	}
	
	//TODO: construct a network with force directed and update
	


});




