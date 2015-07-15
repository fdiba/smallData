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

    createMenu(years);
    displayListingBasedOnSelection(data);
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

	var color = d3.scale.category20c();
	//var color = d3.scale.category20c();

	var svg = d3.select('svg')
	//var svg = d3.select('#chart')
		//.append('svg')
		//.attr('width', width)
		//.attr('height', height)
		.append('g')
		//donut position
		.attr('transform', 'translate(' + (cwidth/2+15) +  ',' + (height/2+20) + ')');

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
		})
		.each(function(d) { this._current = d; });

	var tooltip = d3.select('.tooltip');

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
	  	tooltip.style('top', (d3.event.pageY - 120) + 'px')
	    	.style('left', (d3.event.pageX - 100) + 'px');
	});*/

	path.on('mouseout', function(d) {
		tooltip.style('display', 'none');
	}); 

	addLegend(color, pie, path, arc);

}
function addLegend(color, pie, path, arc){

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

	    return 'translate(' + (xPos+360) + ',' + (yPos+200) + ')';
		});

	legend.append('rect')
		.attr('width', legendRectSize)
	  	.attr('height', legendRectSize)
	  	.style('stroke-width', '2')
	  	.style('cursor', 'pointer')
	  	.style('fill', color)
	  	.style('stroke', color)
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
	this.enabled = state;
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
			if(!hasBeenIndexed)countries.push(new ctry(country, 1, true));

		} else {
			//countries.push([country, 1]);
			countries.push(new ctry(country, 1, true));
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

	var colors = d3.scale.category20c();

	for(var i=0; i<years.length; i++){

		var c = colors(i);

		var btn = d3.select('.container').append('div')
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

				}

			})
			.text(function () { return years[i]; });

		if(years[i] == selectedYear) {
			btn.attr('class', 'selected');
		}

	}
}
function displayListingBasedOnSelection(data){

	var colors = d3.scale.category20b();

	var hasBeenFound = false;

	console.log(data[0].name);

	for(var i=0; i<data.length; i++){

		if(data[i].year.search(selectedYear)==0){

			hasBeenFound = true;

			d3.select('.container').append('div')
			//.text(function () { return objects.length; });
			.style('font-size', '12px')
			.style('width', '690px')
			.style('color', 'white')
			.style('background-color', colors(i))
			.style('padding', '0 5px')
			.style('margin', '5px 0')
			.text(data[i].name+" "+data[i].firstName+" | "+data[i].country+" | "+data[i].award);


		} else {

			//WARNING LIST NEEDS TO BE IN ORDER BASED ON YEAR !
			if(hasBeenFound) break;

		}

		

	}
}
