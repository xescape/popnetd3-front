/**
 * 
 */
//var data = [{'a':1},{'a':2},{'a':3}];
//
//var svg = d3.select("body").append("svg")
//		.attr("height", 500)
//		.attr("width", 500);
//
//var nodes = svg.append('g')
//			.attr('class', 'nodes')
//			.selectAll(".nodes")
//			.data(data).enter()
//			.append("circle")
//				.attr("cx", function(d){ return 100 + 100 * Math.random();})
//				.attr("cy", function(d){ return 100 + 100 * Math.random();})
//				.attr("r", 10)
//				.attr("stroke", "black")
//				.call(d3.drag().on('drag', function(d){
//					d.cx = d3.event.x;
//					d.cy = d3.event.y;
//					console.log(this)
//					
//					d3.select(this)
//					.attr('cx', d3.event.x)
//					.attr('cy', d3.event.y);
//				}));

//var simulation = d3.forceSimulation()
//				.force("charge", d3.forceManyBody())
//				.nodes(nodes)
//				.on("tick", function(d){
//					d.cx = 100 * Math.random();
//					d.cy = 100 * Math.random();
//				});

//console.log(simulation.nodes())


//var svg = d3.select("body").append("svg")
//      .attr("width", 1000)
//      .attr("height", 300);
//
//var group = svg.append("svg:g")
//    .attr("transform", "translate(10, 10)")
//    .attr("id", "group");
//
//var drag = d3.drag()
//.on('drag', function (d) {
//
//    d.x += d3.event.dx;
//    d.y += d3.event.dy;
//    console.log(d)
//    d3.select(this).attr('transform', 'translate(' + d.x + ',' + d.y + ')');
//});
//
//var data = [{'x': 2.5, 'y': 2.5}], // here's a dataset that has one item in it
//    rects = group.selectAll('node').data(data) // do a data join on 'rect' nodes
//        .enter()
//        .append('svg:g')
//        .call(drag)
//        .append('rect') // for all new items append new nodes with the following attributes:
//            .attr('x', function (d) { return d.x; })
//            .attr('y', function (d) { return d.y; })
//            .attr('width', 100)
//            .attr('height', 100)
//            .attr('stroke', 'black');
            


var width,height
var chartWidth, chartHeight
var margin
var svg = d3.select("body").append("svg")
var chartLayer = svg.append("g").classed("chartLayer", true)

main()

function main() {
    var range = 100
    var data = {
        nodes:d3.range(0, range).map(function(d){ return {label: "l"+d ,r:~~d3.randomUniform(8, 28)()}}),
        links:d3.range(0, range).map(function(){ return {source:~~d3.randomUniform(range)(), target:~~d3.randomUniform(range)()} })        
    }
    
//    console.log(data)
    setSize(data)
    drawChart(data)    
}

function setSize(data) {
    width = 1600
	height = 900
	
	margin = {top:0, left:0, bottom:0, right:0 }
	
	
	chartWidth = width - (margin.left+margin.right)
	chartHeight = height - (margin.top+margin.bottom)
	
	svg.attr("width", width).attr("height", height)
	
	
	chartLayer
	    .attr("width", chartWidth)
	    .attr("height", chartHeight)
	    .attr("transform", "translate("+[margin.left, margin.top]+")")
        
        
}

function drawChart(data) {
    
    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.index }))
	    .force("collide",d3.forceCollide( function(d){return d.r + 8 }).iterations(16) )
	    .force("charge", d3.forceManyBody())
	    .force("center", d3.forceCenter(chartWidth / 2, chartWidth / 2))
	    .force("y", d3.forceY(0))
	    .force("x", d3.forceX(0))

	var link = svg.append("g")
	    .attr("class", "links")
	    .selectAll("line")
	    .data(data.links)
	    .enter()
	    .append("line")
	    .attr("stroke", "black")
	
	var node = svg.append("g")
	    .attr("class", "nodes")
	    .selectAll("circle")
	    .data(data.nodes)
	    .enter().append("circle")
	    .attr("r", function(d){  return d.r })
	    .call(d3.drag()
	        .on("start", dragstarted)
	        .on("drag", dragged)
	        .on("end", dragended));    

	
	
	var ticked = function() {
	    link
	        .attr("x1", function(d) { return d.source.x; })
	        .attr("y1", function(d) { return d.source.y; })
	        .attr("x2", function(d) { return d.target.x; })
	        .attr("y2", function(d) { return d.target.y; });
	    
//	    console.log(link.each(function(d){console.log(d)}))
	    
	    node
	        .attr("cx", function(d) { return d.x; })
	        .attr("cy", function(d) { return d.y; });
}  

	simulation
	    .nodes(data.nodes)
	    .on("tick", ticked);
	
	simulation.force("link")
	            .links(data.links);    
        
	console.log(JSON.stringify(data.nodes));     
        
        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }
        
        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        } 
                
    }

            

