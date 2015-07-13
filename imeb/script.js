var names = [];

d3.csv("data/smallData.csv", function(data){

	console.log(data);

	for(key in data) names.push(data[key].name);

	var height = 400,
        width = 600,
        barWidth = 150,
        barHeight = 20,
        barOffset = 5;

    var colors = d3.scale.linear()
    .domain([0, names.length*.33, names.length*.66, names.length])
    .range(['#B58929','#C61C6F', '#268BD2', '#85992C']);

	var chart = d3.select('#chart').append('svg')
		.style('background', '#FDF6E3')
		.attr('width', width)
        .attr('height', height)

    var bar = chart.selectAll('rect').data(names)
		.enter().append('g')
		.attr("transform", function(d, i) { return "translate(0," + i*(barHeight+barOffset) + ")"; });

    bar.append('rect')
    	.style('fill', function(d,i) { return colors(i); })
       	.attr('x', '0')
       	.attr('y', '0')
       	.attr('width', barWidth)
       	.attr('height', barHeight);
    
    bar.append('text')
    	.attr('x', '10')
    	.attr('y', '0')
    	.attr('dy', '15')
    	.attr('fill', 'white')
    	.attr('font-family', 'sans-serif')
    	.attr('font-size', '10px')
    	.text(function(d,i) { return data[i].name; });

});
