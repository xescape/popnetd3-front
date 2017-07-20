/**
 * 
 */
var data = [{'a':1},{'a':2},{'a':3}];

var svg = d3.select("body").append("svg")
		.attr("height", 500)
		.attr("width", 500);

var nodes = svg.append('g')
			.attr('class', 'nodes')
			.selectAll(".nodes")
			.data(data).enter()
			.append("circle")
				.attr("cx", function(d){ return 100 + 100 * Math.random();})
				.attr("cy", function(d){ return 100 + 100 * Math.random();})
				.attr("r", 10)
				.attr("stroke", "black")
				.call(d3.drag().on('drag', function(d){
					d.cx = d3.event.x;
					d.cy = d3.event.y;
					console.log(this)
					
					d3.select(this)
					.attr('cx', d3.event.x)
					.attr('cy', d3.event.y);
					
				}));

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
            

            

