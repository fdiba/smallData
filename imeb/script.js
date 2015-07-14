var names = [];
var years = [];
var selectedYear = 1973;
var countries = []; //used for charts

addTooltip();

d3.csv("data/smallData.csv", function(data){

	console.log(data);

	for(key in data) {

		names.push(data[key].name);
		editYearsArray(data, key);
		editCountriesArray(data, key);

	}

	var width = 700,
		height = 400,
        barWidth = 150,
        barHeight = 20,
        barOffset = 5;

    var colors = d3.scale.category20c();
    /*var colors = d3.scale.linear()
    .domain([0, names.length*.33, names.length*.66, names.length])
    .range(['#B58929','#C61C6F', '#268BD2', '#85992C']);*/

	var chart = d3.select('#chart').style('position', 'relative')
		.attr('width', width)
		.attr('height', height)
		.append('svg')
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
    	//.style('fill', 'white')
    	.style('font-family', 'sans-serif')
    	.style('font-size', '10px')
    	.text(function(d,i) { return data[i].name; });

    createMenu(years);
    displayCountries();
    createPie(width);

    

});
function addTooltip(){

	var tooltip = d3.select('#chart')         
  		.append('div')
  		.attr('class', 'tooltip')
  		.style('background', '#eee')
  		//.style('box-shadow', '0 0 5px #999999')
  		.style('position', 'absolute')
  		.style('left', '580px')
  		.style('top', '20px')
  		.style('font-size', '12px')
  		.style('text-align', 'center')
  		.style('width', '80px')
  		.style('padding', '10px')
  		.style('line-height', '1.1em')
  		.style('display', 'none')
  		.style('z-index', '10');       
  		            

	tooltip.append('div')                  
  		.attr('class', 'label')
  		.text('wooot');           

	tooltip.append('div')                 
  		.attr('class', 'count');             

	tooltip.append('div')                    
  		.attr('class', 'percent'); 
}
function createPie(cwidth){

	var width = 360;
	var height = 360;
	var radius = Math.min(width, height) / 2; 

	var color = d3.scale.category20b();
	//var color = d3.scale.category20c();

	var svg = d3.select('svg')
	//var svg = d3.select('#chart')
		//.append('svg')
		//.attr('width', width)
		//.attr('height', height)
		.append('g')
		.attr('transform', 'translate(' + (cwidth/2+75) +  ',' + (height/2+20) + ')');

	var donutWidth = 75;

	var arc = d3.svg.arc()
		.innerRadius(radius - donutWidth)
		.outerRadius(radius);

	var pie = d3.layout.pie()
  		.value(function(d) { return d.count; })
  		.sort(null);

  	var path = svg.selectAll('path')
  		.data(pie(countries))
	  	.enter()
	  	.append('path')
	  	.attr('d', arc)
	  	.attr('fill', function(d, i) { 
	    	return color(d.data.label);
		});

	

	path.on('mouseover', function(d) {

		var total = d3.sum(countries.map(function(d) {
	    	return d.count;
	  	}));
		
		var percent = Math.round(1000 * d.data.count / total) / 10;
		
		var tooltip = d3.select('.tooltip');
		tooltip.select('.label').html(d.data.label);
		tooltip.select('.count').html(d.data.count); 
		tooltip.select('.percent').html(percent + '%'); 
		tooltip.style('display', 'block');

	});

	path.on('mouseout', function(d) {
		var tooltip = d3.select('.tooltip');
		tooltip.style('display', 'none');
	}); 

	addLegend(color);

}
function addLegend(color){

	var legendRectSize = 18;
	var legendSpacing = 4;

	var svg = d3.select('svg');
	var legend = svg.selectAll('.legend')
		.data(color.domain())
		.enter()
		.append('g')
	  	.attr('class', 'legend')
	  	.style('font-size', '12px')
	  	.attr('transform', function(d, i) {
	    
	    var height = legendRectSize + legendSpacing;
	    var offset =  height * color.domain().length / 2;
	    var xPos = -2 * legendRectSize;
	    var yPos = i * height - offset;

	    return 'translate(' + (xPos+420) + ',' + (yPos+200) + ')';
		});

	legend.append('rect')
		.attr('width', legendRectSize)
	  	.attr('height', legendRectSize)
	  	.attr('stroke-width', '2')
	  	.style('fill', color)
	  	.style('stroke', color);

	legend.append('text')
  		.attr('x', legendRectSize + legendSpacing)
  		.attr('y', legendRectSize - legendSpacing)
  		//.text(function(d) { return d.toUpperCase(); });
  		.text(function(d) { return d; });


}
function ctry(label, count){
	this.label = label;
	this.count = count;
}
function editCountriesArray(data, key){

	if(data[key].year == selectedYear){
	//if(data[key].year == selectedYear || data[key].year != selectedYear){

		var country = data[key].country;

		if(countries.length>0){

			var hasBeenIndexed = false;

			for(var i=0; i<countries.length; i++){

				var pos = countries[i].label.search(country);

				if(pos>-1) {

					hasBeenIndexed = true;
					countries[i].count++;
					break;
				
				}

			}

			//if(!hasBeenIndexed)countries.push([country, 1]);
			if(!hasBeenIndexed)countries.push(new ctry(country, 1));

		} else {
			//countries.push([country, 1]);
			countries.push(new ctry(country, 1));
		}
	}
}
function editYearsArray(data, key){

	var year = data[key].year;

	if(years.length>0){

		var hasBeenIndexed = false;

		for(var i=0; i<years.length; i++){

			var pos = years[i].search(year);

			if(pos>-1) {
				hasBeenIndexed = true;
				break;
			}
		}

		if(!hasBeenIndexed)years.push(year);

	} else {
		years.push(year);
	}
}
function createMenu(years){

	for(var i=0; i<years.length; i++){

		d3.select('.container').append('div')
			//.text(function () { return objects.length; });
			.style('display', 'inline-block')
			//.style('background-color', 'teal')
			.style('padding-right', '5px')
			.text(function () { return years[i]; });

	}
}
function displayCountries(){

	for(var i=0; i<countries.length; i++){

		d3.select('.container').append('div')
			//.text(function () { return objects.length; });
			//.style('display', 'inline-block')
			//.style('background-color', 'teal')
			//.style('padding-right', '5px')
			.text(countries[i].label+" "+countries[i].count);

	}
}
