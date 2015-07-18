var table = [];
var names = [];
var years = [];
var selectedYear = 1973;
var countries = [];

var sceneWidth = 400, sceneHeight = 400;

editTitle(selectedYear);
addTooltip(sceneWidth, sceneHeight);

d3.csv("data/smallData.csv", function(data){

	console.log(data);
	table = data;

	for(key in data) {
		names.push(data[key].name);
		setYearsArray(data, key);
		setCountriesArray(data, key);
	}

	var barWidth = 150,
        barHeight = 20,
        barOffset = 5;

	var chart = d3.select('#pie01').style('position', 'relative')
		.attr('width', sceneWidth)
		.attr('height', sceneHeight)
		.append('svg')
		.attr('id', 'firstPie')
		.attr('width', sceneWidth)
        .attr('height', sceneHeight)
        .style('background', '#FDF6E3');

    createMenu(years);
    displayListingBasedOnSelection(data);
    createPie(sceneWidth, sceneHeight);

});
function addTooltip(sWidth, sHeight){

	var padding = 10;
	var width = 80;
	var margin = 20;

	var tooltip = d3.select('#charts')         
  		.append('div')
  		.attr('id', 'tooltip01')
  		.style('background', '#eee')
  		//.style('box-shadow', '0 0 5px #999999')
  		.style('position', 'absolute')
  		.style('top', '150px')
  		.style('left', padding+'px')
  		//.style('left', (sWidth-(width+padding*2+margin))+"px")
  		//.style('top', '20px')
  		.style('font-size', '12px')
  		.style('text-align', 'center')
  		.style('width', width+'px')
  		.style('padding', '10px')
  		.style('line-height', '1.1em')
  		//.style('display', 'none')
  		.style('z-index', '10');       
  		            

	tooltip.append('div').attr('class', 'label');

	tooltip.append('div').attr('class', 'count');             

	tooltip.append('div').attr('class', 'percent'); 
}
function createPie(sWidth, sHeight){

	var padding = 20;
	var width = sWidth-padding*2;
	var height = sHeight-padding*2;
	var radius = Math.min(width, height) / 2; 

	var colors = d3.scale.category20();

	var svg = d3.select('#firstPie')
		//.attr('width', width)
		//.attr('height', height)
		.append('g')
		//donut position
		.attr('transform', 'translate(' + (sWidth/2) +  ',' + (height/2+padding) + ')');

	var donutWidth = 75;

	var arc = d3.svg.arc()
		.innerRadius(radius - donutWidth)
		.outerRadius(radius);

	var pie = d3.layout.pie()
  		.value(function(d) { return d.count; })
  		//do not sort it because of animation
  		.sort(null);

  	var path = svg.selectAll('path')
  		.data(pie(countries))
	  	.enter()
	  	.append('path')
	  	.attr('d', arc)
	  	.attr('fill', function(d, i) { 
	    	return colors(d.data.label);
		})
		.each(function(d) { this._current = d; });

	var tooltip = d3.select('#tooltip01');

	path.on('mouseover', function(d) {

		var total = d3.sum(countries.map(function(d) {
	    	//return d.count;
	    	return (d.enabled) ? d.count : 0;  
	  	}));
		
		var percent = Math.round(1000 * d.data.count / total) / 10;
		
		tooltip.select('.label').html(d.data.label);
		tooltip.select('.count').html(d.data.count); 
		tooltip.select('.percent').html(percent + '%'); 
		tooltip.style('display', 'block');

	});

	/*path.on('mousemove', function(d) {
	  	tooltip.style('top', (d3.event.pageY - 0) + 'px')
	    	.style('left', (d3.event.pageX - 0) + 'px');
	});*/

	path.on('mouseout', function(d) {
		tooltip.style('display', 'none');
	}); 

	addLegend(colors, pie, path, arc, sWidth, sHeight);

}
function addLegend(colors, pie, path, arc, sWidth, sHeight){

	var legendRectSize = 18;
	var legendSpacing = 4;

	var svg = d3.select('svg');
	var legend = svg.selectAll('.legend')
		.data(colors.domain())
		.enter()
		.append('g')
	  	.attr('class', 'legend')
	  	.style('font-size', '12px')
	  	.attr('transform', function(d, i) {
	    
	    var height = legendRectSize + legendSpacing;
	    var offset =  height * colors.domain().length / 2;
	    var xPos = -2 * legendRectSize;
	    var yPos = i * height - offset;

	    return 'translate(' + (xPos+sWidth/2) + ',' + (yPos+sHeight/2) + ')';
		});

	legend.append('rect')
		.attr('width', legendRectSize)
	  	.attr('height', legendRectSize)
	  	.style('stroke-width', '2')
	  	.style('cursor', 'pointer')
	  	.style('fill', colors)
	  	.style('stroke', colors)
	  	.on('click', function(label) {

	  		var rect = d3.select(this);
  			var enabled = true;

  			var totalEnabled = d3.sum(countries.map(function(d) {
    			return (d.enabled) ? 1 : 0;
  			}));

  			if (rect.attr('class') === 'disabled') {
			    rect.attr('class', '');
			} else {
			    if (totalEnabled < 2) return;
			    rect.attr('class', 'disabled');
			    enabled = false;
			}

			//var pie = d3.layout.pie();
			pie.value(function(d) {
		    	if (d.label === label) d.enabled = enabled;
		    	return (d.enabled) ? d.count : 0;
		  	});

		  	path = path.data(pie(countries));


		  	path.transition()
			    .duration(750)
			    .attrTween('d', function(d) {
			
					var interpolate = d3.interpolate(this._current, d);
					this._current = interpolate(0);
					return function(t) {
			        	return arc(interpolate(t));
			      	};
			    });


	  	});

	legend.append('text')
  		.attr('x', legendRectSize + legendSpacing)
  		.attr('y', legendRectSize - legendSpacing)
  		//.text(function(d) { return d.toUpperCase(); });
  		.text(function(d) { return d; });


}
function ctry(label, count, state){
	this.label = label;
	this.count = count;
	this.color = 'pink';
	this.enabled = state;
}
function setCountriesArray(data, key){

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

			if(!hasBeenIndexed)countries.push(new ctry(country, 1, true));

		} else {
			countries.push(new ctry(country, 1, true));
		}
	}

	var colors = d3.scale.category20();
	for (var k=0; k<countries.length; k++){
		countries[k].color = colors(k);
	}

}
function setYearsArray(data, key){

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

	var colors = d3.scale.category20b();

	for(var i=0; i<years.length; i++){

		var c = colors(i);

		var btn = d3.select('#nav').append('div')
			//.text(function () { return objects.length; });
			.style('display', 'inline-block')
			//.style('background-color', 'teal')
			.style('background-color', c)
			.style('border', '2px solid ' + c)
			.style('text-align', 'center')
			.style('font-size', '12px')
			.style('cursor', 'pointer')
			
			.style('color', '#fff')
			.style('padding', '0 5px')
			.style('margin-right', '5px')
			.style('width', '55px')
			.on('click', function() {

				var value = this.innerHTML;

				if(value.search(selectedYear)!=0){

					//console.log(value);

					d3.selectAll('.selected').attr('class', '');
					d3.select(this).attr('class', 'selected');
					
					//update data

					selectedYear = value;
					editTitle(selectedYear);

					resetVariables();

					for(var j=0; j<table.length; j++)setCountriesArray(table, j);
					d3.select('#awards').selectAll("*").remove();
					displayListingBasedOnSelection(table);
					//console.log(countries.length);

					//TODO animate it
					d3.select('#firstPie').selectAll("*").remove();
					createPie(sceneWidth, sceneHeight);

				}

			})
			.text(function () { return years[i]; });

		if(years[i] == selectedYear) {
			btn.attr('class', 'selected');
		}

	}
}
function resetVariables(){

	countries = [];
	//TODO use it to use the same color for each country
	/*for(var i=0; i<countries.length;i++){
		countries[i].count = 0;
		countries[i].enabled = true;
	}*/

}
function editTitle(slYear){
	d3.select('h1').text('Concours Internationaux de Bourges ' + slYear);
}
function displayListingBasedOnSelection(data){

	var hasBeenFound = false;

	for(var i=0; i<data.length; i++){

		if(data[i].year.search(selectedYear)==0){

			var country = data[i].country;

			for(var j=0; j<countries.length; j++){

				if(country.search(countries[j].label) == 0){

					color = countries[j].color;
					break;

				}
			}

			hasBeenFound = true;

			d3.select('#awards').append('div')			
			.style('font-size', '12px')
			.style('width', sceneWidth-10+'px')
			.style('color', 'white')
			.style('background-color', color)
			.style('padding', '0 5px')
			.style('margin', '5px 0')
			.text(data[i].name+" "+data[i].firstName+" | "+country+" | "+data[i].award);


		} else {

			//WARNING LIST NEEDS TO BE IN ORDER BASED ON YEAR !
			if(hasBeenFound) break;

		}
	}
}
