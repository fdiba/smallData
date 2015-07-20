var table = [];
var years = [];

var selectedYear = 2009;

var countries = [];
var categories = [];
var studios = [];

var countryDivs = [];

var sceneWidth = 394, sceneHeight = 400;

var panorama = false;

resetVariables();
editTitle(selectedYear);
addTooltip(sceneWidth, sceneHeight);

d3.csv("data/smallData.csv", function(data){

	//console.log(data);
	table = data;

	years.push('Panorama');

	for(key in data) {
		
		setYearsArray(data, key);

		setArray(data, key, countries, 0);
		setArray(data, key, categories, 1);
		setArray(data, key, studios, 2);
	
	}

	years.reverse();

	var barWidth = 150,
        barHeight = 20,
        barOffset = 5;

    createSvg('#pie01', 'firstPie');
    createSvg('#pie02', 'secondPie');
	createSvg('#pie03', 'thirdPie');

    createMenu(years);

    createPie(sceneWidth, sceneHeight, '#firstPie', countries);
    createPie(sceneWidth, sceneHeight, '#secondPie', studios);
    createPie(sceneWidth, sceneHeight, '#thirdPie', categories);

    d3.select('#pie01').append('div').attr('id', 'awards');	
    displayListingBasedOnSelection(data);
});
function createSvg(divName, idName){
	d3.select(divName).style('position', 'relative')
		.attr('width', sceneWidth)
		.attr('height', sceneHeight)
		.append('svg')
		.attr('id', idName)
		.attr('width', sceneWidth)
        .attr('height', sceneHeight)
        .style('background', '#FDF6E3');
}
function addTooltip(sWidth, sHeight){

	var padding = 10;
	var width = 80;
	var margin = 20;

	var tooltip = d3.select('#charts')         
  		.append('div')
  		.attr('id', 'tooltip');  		            

	tooltip.append('div').attr('class', 'label');
	tooltip.append('div').attr('class', 'count');             
	tooltip.append('div').attr('class', 'percent'); 
}
function createPie(sWidth, sHeight, svgId, array){

	var padding = 20;
	var width = sWidth-padding*2;
	var height = sHeight-padding*2;
	var radius = Math.min(width, height) / 2; 

	var colors = d3.scale.category20();

	var max = array.length-1;

	/*var colors = d3.scale.linear()
		.domain([0, max*.25, max*.5, max*.75, max])
		.range(['#6abfeb', '#b9d3c3', '#f7e998', '#f4bcac', '#f495b3']);*/

	var colors = d3.scale.linear()
		.domain([0, max*.25, max*.5, max*.75, max])
		.range(['#5dbf8c', '#8ecb84', '#bad97a', '#dab470', '#f08f67']);

	var svg = d3.select(svgId)
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
  		.value(function(d) {
  			//console.log(d.count);
  			return d.count;
  		})
  		//do not sort it because of animation
  		.sort(null);

  	var path = svg.selectAll('path')

  		//TODO 

  		.data(pie(array))
  		//.data(pie(countries))
	  	
	  	.enter()
	  	.append('path')
	  	.attr('d', arc)
	  	.attr('fill', function(d, i) { 
	  		//console.log(d.data.label);
	  		return colors(i);
	    	//return colors(d.data.label);
		})
		.each(function(d) {
			//console.log(d);
			this._current = d;
		});

	var tooltip = d3.select('#tooltip');

	path.on('mouseover', function(d) {

		var total = d3.sum(array.map(function(d) {
	    	//return d.count;
	    	return (d.enabled) ? d.count : 0;  
	  	}));
		
		var percent = Math.round(1000 * d.data.count / total) / 10;
		
		tooltip.select('.label').html(d.data.label);
		tooltip.select('.count').html(d.data.count); 
		tooltip.select('.percent').html(percent + '%'); 
		tooltip.style('display', 'block');

	});

	path.on('mousemove', function(d) {
	  	tooltip.style('top', (d3.event.pageY - 70) + 'px')
	    	.style('left', (d3.event.pageX + 15) + 'px');
	});

	path.on('mouseout', function(d) {
		tooltip.style('display', 'none');
	}); 

	addLegend(colors, pie, path, arc, sWidth, sHeight, svgId, array);
}
function addLegend(colors, pie, path, arc, sWidth, sHeight, svgId, array){

	var legendRectSize = 18;
	var legendSpacing = 4;

	var tooBig = false;

	if(panorama){
		d3.select('#firstPie').attr('width', sceneWidth+340);
		d3.select('#thirdPie').attr('width', sceneWidth+340);
	} else if(array.length>7 && svgId.search('#firstPie')==0) {
		tooBig=true;
		d3.select('#firstPie').attr('width', sceneWidth+150);
		d3.select('#thirdPie').attr('width', sceneWidth);
	} else if (svgId.search('#firstPie')==0){
		d3.select('#firstPie').attr('width', sceneWidth);
		d3.select('#thirdPie').attr('width', sceneWidth);
	}


	var labels = [];
	for(var i=0; i<array.length; i++) labels.push(array[i].label);

	var idColumn = 0;
	var columnLength;
	var rowWidth;

	var svg = d3.select(svgId);
	var legend = svg.selectAll('.legend')
		.data(labels)
		//.data(colors.domain())
		.enter()
		.append('g')
	  	.attr('class', 'legend')
	  	.style('font-size', '12px')
	  	.attr('transform', function(d, i) {

		    if( (panorama  && svgId.search('#firstPie')==0) || (panorama  && svgId.search('#thirdPie')==0) ){

		    	if(svgId.search('#firstPie')==0){
		    		columnLength = 17;
		    		rowWidth = 100;
		    	} else {
		    		columnLength = 11;
		    		rowWidth = 140;
		    	}

		    	var pos = i%columnLength;
		    	if(pos==0 && i!=0)idColumn++;

		    	var height = legendRectSize + legendSpacing;
			    var offset =  height * columnLength / 2;
			    var xPos = -2 * legendRectSize + idColumn*rowWidth;
			    var yPos = pos * height - offset;

		    	return 'translate(' + (xPos+sWidth + 60) + ',' + (yPos+sHeight/2) + ')';

		    } else {

		    	var height = legendRectSize + legendSpacing;
			    var offset =  height * labels.length / 2;
			    var xPos = -2 * legendRectSize;
			    var yPos = i * height - offset;

			    if(tooBig  && svgId.search('#firstPie')==0){
			    	return 'translate(' + (xPos+sWidth + 60) + ',' + (yPos+sHeight/2) + ')';
			    } else {
			    	return 'translate(' + (xPos+sWidth/2) + ',' + (yPos+sHeight/2) + ')';
			    }
		    }

		});

	var color = function(d, i) { return array[i].color};

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

  			var totalEnabled = d3.sum(array.map(function(d) {
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

		  	path = path.data(pie(array));


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
function obj(label, count, state){
	this.label = label;
	this.count = count;
	this.color = 'pink';
	this.enabled = state;
}
function setArray(data, key, array, propertyId){

	if(data[key].year == selectedYear  || panorama){

		var value = '';

		switch(propertyId){
		case 0:
			value = data[key].country;
			if(value=='')value="Inconnu";
			break;
		case 1:
			value = data[key].category;
			if(value=='')value="Inconnue";
			break;
		case 2:
			value = data[key].studio;
			if(value=='')value="Inconnu";
			break;
		default:
			value = 'default';
			break;
		}

		if(array.length>0){

			var hasBeenIndexed = false;

			for(var i=0; i<array.length; i++){

				var pos = array[i].label.search(value);

				if(pos>-1) {

					hasBeenIndexed = true;
					array[i].count++;
					break;
				
				}

			}

			if(!hasBeenIndexed)array.push(new obj(value, 1, true));

		} else {
			array.push(new obj(value, 1, true));
		}
	}

	//var colors = d3.scale.category20();

	//TODO IN DOUBLE
	var max = array.length-1;

	var colors = d3.scale.linear()
		.domain([0, max*.25, max*.5, max*.75, max])
		.range(['#5dbf8c', '#8ecb84', '#bad97a', '#dab470', '#f08f67']);

	for (var k=0; k<array.length; k++) array[k].color = colors(k);

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

	/*var colors = d3.scale.category20b()
		.domain([0, years.length]);*/

	var max = years.length-1;

	var colors = d3.scale.linear()
		.domain([0, max*.25, max*.5, max*.75, max])
		.range(['#5dbf8c', '#8ecb84', '#bad97a', '#dab470', '#f08f67']);

	for(var i=0; i<years.length; i++){

		var c = colors(i);

		var btn = d3.select('#nav').append('div')
			.style('background-color', c)
			.style('border', '2px solid ' + c)
			.on('click', function() {

				var value = this.innerHTML;

				if(value.search(selectedYear)!=0){

					//console.log(value);

					d3.selectAll('.selected').attr('class', '');
					d3.select(this).attr('class', 'selected');
					
					selectedYear = value;
					if(selectedYear=='Panorama'){
						panorama = true;
					} else {
						panorama = false;
					}
					
					
					editTitle(selectedYear);

					resetVariables();

					for(var j=0; j<table.length; j++) {
						setArray(table, j, countries, 0);
						setArray(table, j, categories, 1);
						setArray(table, j, studios, 2);
					}
					
					d3.select('#awards').selectAll("*").remove();
					displayListingBasedOnSelection(table);
					//console.log(countries.length);

					//TODO animate it
					d3.select('#firstPie').selectAll("*").remove();
					d3.select('#secondPie').selectAll("*").remove();
					d3.select('#thirdPie').selectAll("*").remove();

					createPie(sceneWidth, sceneHeight, '#firstPie', countries);
					createPie(sceneWidth, sceneHeight, '#secondPie', studios);
					createPie(sceneWidth, sceneHeight, '#thirdPie', categories);

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
	studios = [];
	categories = [];

}
function editTitle(slYear){
	d3.select('h1').text('Concours Internationaux de Bourges ' + slYear);
}
function displayListingBasedOnSelection(data){

	var hasBeenFound = false;
	countryDivs = [];

	for(var i=0; i<data.length; i++){

		if(data[i].year.search(selectedYear)==0 || panorama){

			var country = data[i].country;

			for(var j=0; j<countries.length; j++){

				if(country.search(countries[j].label) == 0){

					color = countries[j].color;
					break;

				} else {
					//WARNING SHOULD NEVER HAPPENED
					color = 'black';
				}
			}

			hasBeenFound = true;

			var divAlreadyExist = false;
			var id = -1;

			for(var k=0; k<countryDivs.length; k++){

				if(country.search(countryDivs[k]) == 0){

					divAlreadyExist = true;
					id = k;
					break;
				}

			}


			var cat = data[i].category;
			var award = data[i].award;
			if(award.search('M')==0)award="Mention";
			if(country=='')country = "Inconnu";

			var str = '';

			str = data[i].name+" "+data[i].firstName+" | "+data[i].year+" | "+award;
			if(cat!='')str += " | "+cat;

			if(divAlreadyExist){

				d3.select('#ctry'+id)
				.append('p')
				.text(str);

			} else {

				var newDiv = d3.select('#awards').append('div')
					.attr('id', 'ctry'+countryDivs.length)
					.style('font-size', '12px')
					.style('color', 'white')
					.style('background-color', color)
					
					.style('margin', '0 0 1px 0')
					.style('line-height', '1em');

				newDiv.style('padding', '0 0 1px 0')
					.append('div')
					.attr('class', 'titleC')
					.append('p').text(country);

				newDiv.append('p').text(str);

				countryDivs.push(country);

			}

		} else {

			//WARNING LIST NEEDS TO BE IN ORDER BASED ON YEAR !
			if(hasBeenFound) break;

		}
	}
}
