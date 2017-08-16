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
var input = "http://calyptospora:3000/data3.json";

//TODO: init the svg element

//define size of the image element
var base_width = 3200,
	base_height = 1800,
	width = base_width,
	height = base_height,
	margin = 100,
	nodeRadius = 50,
	bandWidth = 25

var labelAttrs = {
	'x' : 0,
	'y' : nodeRadius + 20, //offsize same as fontsize?
	'font-size': 20,
	'font-family': 'Arial',
	'text-anchor': 'middle',
	'class': 'nodetext'
}

var edgeAttrs = {
	"stroke": 'black',
	'stroke-width': function(d){return d.width / 3}
}

var invisEdgeAttrs = {
		"stroke": 'black',
		'stroke-width': 0
	}

var borderAttrs = {
	'r' : nodeRadius,
	"stroke-width": 5,
	'fill': "white",
	"fill-opacity": 100
}
//create svg in body.
//Change this to a div later
var svg = d3.select("#graph").append("svg")
				.attr("width", width)
				.attr("height", height)
				.attr("style", 'border: 1px solid black;');

svg.append("rect")
	.attr("width", width)
	.attr("height", height)
	.attr("fill", "gray")
//	.attr("transform", "translate(" + -1 * width / 4 + ',' + -1 * height / 4 + ")");


var container = svg.append("g");

container.append("rect")
	.attr("width", width)
	.attr("height", height)
	.attr("fill", "white")

//TODO: Add the control elements that let you upload a file

//TODO: load graph data
d3.json(input, function(data){

	//Simulation variables
	var colorTable = data.colorTable;
		baseLinkStrength = 0.0002,
		linkMultiplier = 2,
		linkOn = false,
		baseChargeStrength = 60,
		chargeMultiplier = 2,
		centerStrength = 10,
		fast = 0.3,
		slow = 0.9,
		scale = 1,
		dx = 0,
		dy = 0;
	
	//bind forces
	var simulation = d3.forceSimulation()
		.force("link", d3.forceLink().id(function(d) { return d.name; }).strength(0))
		.force("charge", d3.forceManyBody().strength(0))
		.force("collide",d3.forceCollide( function(d){return nodeRadius + 10 }).iterations(5))
//		.force("center", d3.forceCenter(width / 2, height / 2));
//		.force("y", d3.forceY(width/3))
//	    .force("x", d3.forceX(height/3))
	
	//simulation behavior
	//allows forces to rearrange in the beginning and then shut them off
	//drag behavior. Activates charge and link force
	var drag = d3.drag()
		.on("start", dragStart)
		.on("drag", dragged)
		.on("end", dragEnd);	
	
	var groupDrag = d3.drag()
		.on("start", dragStart)
		.on("drag", draggedGroup)
		.on("end", dragEnd);
	
	var zoom = d3.zoom()
				.scaleExtent([0.1,10])
				.on("zoom", zoomed);
	//tick behavior		
	simulation.on('tick', function(){
		
			simulation.nodes().forEach(function(d){
				d.x = boundx(d.x)
				d.y = boundy(d.y)
			})
		
			edges.attr("x1", function(d){return d.source.x + nodeRadius;})
				.attr("y1", function(d){return d.source.y + nodeRadius;})
				.attr("x2", function(d){return d.target.x + nodeRadius;})
				.attr("y2", function(d){return d.target.y + nodeRadius;})
				
			nodes.attr("transform", function(d){
				return "translate(" + d.x + "," + d.y + ")"});
			
			d3.selectAll('.group').attr("transform", function(d){
				return "translate(" + d.x + "," + d.y + ")"});
			
			
			d3.selectAll('.glink').attr("x1", function(d){return d.source.x;})
			.attr("y1", function(d){return d.source.y;})
			.attr("x2", function(d){return d.target.x + nodeRadius;})
			.attr("y2", function(d){return d.target.y + nodeRadius;})
	});
	
	//construct nodes and edges
	var edges = container.append("g")
	.attr("class", "link")
		.selectAll(".link")
		.data(data.edges).enter()
		.append('line');
	attachAttr(edges, edgeAttrs);
	
	var nodes = container.selectAll(".node")
	.data(data.nodes)
	.enter().append("g")
		.attr("class", "node")
		.each(function(d, i){
			d.x = randRange(margin, width - margin),
			d.y = randRange(margin, height - margin);;
		});

	nodes
		.call(drag)
		.append(function(d){return paintChr(d);});
	
	//bind nodes and edges	
	simulation.nodes(data.nodes)
		.force("link")
		.links(data.edges);
	
	
	//zoom and pan behavior
	svg.call(zoom)
	
	groupForce(simulation);
	groupCircle(true);
	forceInit();

	
	
	console.log('beep')
//	console.log(simulation.nodes().filter(function(d){
//		return d.group === true;
//	}));
//	d3.selectAll('.glink').each(function(d){console.log(d)})
	
	
	function dragStart(d){
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
		}
	}
	
	function dragged(d){
		simulation.alpha(0.2)
		d.fx = boundx(d.fx + d3.event.dx);
		d.fy = boundy(d.fy + d3.event.dy);
	}
	
	function dragEnd(d){
		if (!d3.event.active){
			linkOn = false;
			simulation.alpha(0.1)
				.force('link').strength(0);
			
			simulation.force('charge').strength(0);
			
			groupCircle(false);
			
			d.x = d.fx;
			d.y = d.fy;
			
			d.fx = null;
			d.fy = null;
		}
	}
	
	function draggedGroup(d){
		d.fx += d3.event.dx;
		d.fy += d3.event.dy;
		groupCircle(false);

	}
	
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
	
	
	function zoomed(d){
		container.attr("transform", d3.event.transform);
		scale = d3.event.transform.k
		dx = d3.event.transform.x
		dy = d3.event.transform.y
//		width = base_width / scale
//		height = base_height / scale
		
//		console.log('dx ' + dx + '\ndy '+ dy + "\nw " + width + "\nh " + height + "\ns " + scale)
		console.log(simulation.nodes()[0].x)

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
		
//		simulation.force("link").strength(function(d){ return baseLinkStrength * d.width * 5});
//		simulation.force("charge").strength(baseChargeStrength * chargeMultiplier);
//		simulation.velocityDecay(fast);
		
		var t = d3.timeout(function(){
			simulation.force("link").strength(0);
			simulation.force("charge").strength(0);
			simulation.velocityDecay(slow);
			simulation.alpha(0);
		}, 1)
		
		return t
		
		
	}
	
	function groupForce(sim){
		
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
			.attr('stroke', 'black')
			.attr('r', 20);
	
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
				.append('line')
				.attr('class' , 'glink');
		attachAttr(e, invisEdgeAttrs);
				
		sim.force('glink', d3.forceLink().id(function(d){return d.name;}).strength(0));
		sim.force('glink').links(glinks);

		return sim	
	}
	
	function groupCircle(reset = false){
		
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
			
			var r = Math.max(n * (nodeRadius + 20) / (2 * Math.PI), 2 * (nodeRadius + 20))
			return _.range(n).map(function(i){
				return {
					x: g.x + r * Math.cos(2 * Math.PI * i / n) - nodeRadius,
					y: g.y + r * Math.sin(2 * Math.PI * i / n) - nodeRadius
				}
			})	
		}
		
		function positionNodes(nodes, g){
			var members = getGroupMembers(nodes, g),
				positions = calculatePositions(g, members.length, nodeRadius);
			
//			console.log(members)
			
			members.forEach(function(x, i){
				x.x = positions[i].x
				x.y = positions[i].y
				
//				console.log('node repos: ' + x.x + " , " + x.y)
			})	
		}
		
		function positionCenters(n){
			//n is how many centers
			//just gives everyone an equal space
			//returns a list of n length

			var x = Math.ceil(Math.sqrt(n)) - 1,
				ls = [],
				c = 0;
				step = Math.ceil(width / n)
				start = Math.ceil(step / 2)
			
			for( var i = 0; i <= x; i++){
				for( var j = 0; j <= x; j++){
					if(c >= n) break;
					ls.push([start + step * i, start + step * j]);
					c++;
				}
				if(c >= n) break;
			}
			
			return ls;			
		}
		
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
				
//				console.log(centers[i].x + " , " + centers[i].y)
			}) //positions the centers
		}
		
		centers.forEach(function(g){
			positionNodes(nodes, g)
		}) //positions the nodes
	
	}
	


});




