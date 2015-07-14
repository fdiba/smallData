var names = [];
var years = [];
var selectedYear = 1973;
var countries = []; //used for charts

d3.csv("data/smallData.csv", function(data){

	console.log(data);

	for(key in data) {

		names.push(data[key].name);
		editYearsArray(data, key);
		editCountriesArray(data, key);

	}

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
    	.style('fill', 'white')
    	.style('font-family', 'sans-serif')
    	.style('font-size', '10px')
    	.text(function(d,i) { return data[i].name; });

    createMenu(years);
    displayCountries();

});
function editCountriesArray(data, key){

	if(data[key].year == selectedYear){

		var country = data[key].country;

		if(countries.length>0){

			var hasBeenIndexed = false;

			for(var i=0; i<countries.length; i++){

				var pos = countries[i][0].search(country);

				if(pos>-1) {

					hasBeenIndexed = true;
					countries[i][1]++;
					break;
				
				}

			}

			if(!hasBeenIndexed)countries.push([country, 1]);

		} else {
			countries.push([country, 1]);
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
			.text(countries[i][0]+" "+countries[i][1]);

	}

	
}
