var init=false;
var allData, slData;
var canvas, context;
var cv_nav, ctx_nav;
var years=[1, 1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980];
var sl_years=[];
var inBtwYears=[];
var menu;
var colors=["#ecf0f1", "#2c3e50", "#e74c3c", "#f1c40f"];
//clouds grey, midnight blue - dark grey, red alizarin, yellow - sun flower
var bw=15, bh=15;
var btn01;

window.onload = function() {

	//------------ canvas ------------//
    canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');
    //----------------------------------//

    cv_nav = document.getElementById('cv_nav');
    ctx_nav = cv_nav.getContext('2d');
    cv_nav.width = $(document).width()-25;
    cv_nav.height = 40;

    ctx_nav.fillStyle=colors[0];
    ctx_nav.fillRect(0, 0, cv_nav.width, cv_nav.height);

    menu = createMenu();
    
    var lr = menu[menu.length-1];
    btn01 = {x:lr.x+23, y:lr.y, state:false};

    drawMenu(menu);

    document.getElementById('cv_nav').addEventListener("click", slData);
    //----------------------------------//

	document.getElementById('get_all').addEventListener("click", getData);

	canvas.width = $(document).width()-25; //context left pad = 10;
	// canvas.width = 600;
    canvas.height = 600;
    // canvas.height = 300;

    context.fillStyle=colors[0];
    context.fillRect(0, 0, canvas.width, canvas.height);

    getData();

    //--------------------------------------//

    var data = [{
	label: "Eating",
	value: 2
	}, {
	label: "Working",
	value: 8
	}, {
	label: "Sleeping",
	value: 8
	}, {
	label: "Errands",
	value: 2
	}, {
	label: "Entertainment",
	value: 4
	}];

	new BarChart({
	canvasId: "myCanvas",
	data: data,
	color: "blue",
	barWidth: 50,
	minValue: 0,
	maxValue: 10,
	gridLineIncrement: 2
	});

//----------------- functions -----------------//
}
function updateSlData(){

	slData = [];

	var tmpY = sl_years.concat(inBtwYears);

	console.log(sl_years, inBtwYears, tmpY);
	console.log(sl_years.length, inBtwYears.length, tmpY.length);

	for (var i=0; i<allData.length-2; i+=3) {

		if(tmpY.includes(parseInt(allData[i+2])) || sl_years.length<1){
			slData.push({id: allData[i], ctry: allData[i+1], edition: allData[i+2]});
		}
	}

	var info = "allData/3: " + allData.length/3;
    $("#info p:eq(0)").text(info);
    var inf1 = "slData: " + slData.length;
    $("#info p:eq(1)").text(inf1);

}
//---------------------------------------//
function slData(evt){

    var cv = cv_nav.getBoundingClientRect();
    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    for (var i=0; i<menu.length; i++) {

        if(mouseX>=menu[i].x && mouseX<=menu[i].x+bw && mouseY>=menu[i].y && mouseY<=menu[i].y+bh){

            if(!init)getData();
            
            if(i==0 && !menu[i].state){

                if(sl_years.length>0){
                    resetMenu();
                    sl_years=[];
                    inBtwYears=[];
                }

	            activateBtn(i);

                resetInBetweenBtn(colors[3]);
                updateSlData();

            } else if(!menu[i].state){ //not already activated

            	menu[0].state = false;

                if(btn01.state){

                    if(sl_years.length==2) {
                        removeFirstElement();
                    } else if(sl_years.length<2){ //reset first btn + in between
                        menu[0].state=false;
                        resetInBetweenBtn(colors[0]);
                    }
                    sl_years.push(menu[i].id);
                
                } else {

	                resetMenu();
	                sl_years=[];
	                sl_years.push(menu[i].id);
                
            	}
                       
	            activateBtn(i);

	            if(sl_years.length==2)checkInBetweenBtn();
    			else inBtwYears=[];

	            updateSlData();

	            break;

	        }
        }
    }

    if(mouseX>=btn01.x && mouseX<=btn01.x+bw && mouseY>=btn01.y && mouseY<=btn01.y+bh){

        btn01.state = !btn01.state;

        if(btn01.state){
            ctx_nav.fillStyle=colors[2];
            ctx_nav.fillRect(btn01.x, btn01.y, bw, bh);
        } else {
            ctx_nav.fillStyle=colors[0];
            ctx_nav.fillRect(btn01.x, btn01.y, bw, bh);
            while(sl_years.length>1)removeFirstElement();
            resetInBetweenBtn(colors[0]);

            // console.log("test");
            inBtwYears=[];
            updateSlData();

        }

    }

    /*if(sl_years.length==2)checkInBetweenBtn();
    else inBtwYears=[];*/

}
function activateBtn(id){
	menu[id].state = true;
    ctx_nav.fillStyle=colors[1];
    ctx_nav.fillRect(menu[id].x, menu[id].y, bw, bh);
}
function removeFirstElement(){
    var y = sl_years.shift();
    var id = years.indexOf(y);
    menu[id].state=false;
    ctx_nav.fillStyle=colors[0];
    ctx_nav.fillRect(menu[id].x, menu[id].y, bw, bh);
}
function checkInBetweenBtn(){

    // console.log(sl_years);

    // if(btn01.state){

    ctx_nav.fillStyle=colors[2];
    ctx_nav.fillRect(btn01.x, btn01.y, bw, bh);

    var pt1, pt2;
    if(sl_years[0]<sl_years[1]){
        pt1 = sl_years[0];
        pt2 = sl_years[1];
    } else {
        pt1 = sl_years[1];
        pt2 = sl_years[0];
    }

    for (var i = 1; i < years.length; i++) {
        if((years[i]<pt1 || years[i]>pt2) && !menu[i].state){ //reset btn outside actual range
            ctx_nav.fillStyle=colors[0];
            ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
        }
    }

    var id1, id2;
    id1 = years.indexOf(pt1);
    id2 = years.indexOf(pt2);
    // console.log(id1, id2);

    inBtwYears=[];

    while(id1<id2-1){ //set in between btns
        id1++;
        ctx_nav.fillStyle=colors[3];
        ctx_nav.fillRect(menu[id1].x, menu[id1].y, bw, bh);

        inBtwYears.push(menu[id1].id);
    }

    // }
}
function resetInBetweenBtn(c){
    for (var i=0; i<menu.length; i++) {
        if(!menu[i].state){
            ctx_nav.fillStyle=c;
            ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
        }
    }
}
function resetMenu(){
    for (var i=0; i<menu.length; i++) {
        menu[i].state=false;
        ctx_nav.fillStyle=colors[0];
        ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
    }
}
function createMenu(){
    var arr=[];
    var xPos=10, yPos=13;
    for (var i=0; i<years.length; i++) {
        arr.push({x:xPos, y:yPos, id:years[i], state:false});
        xPos += 23;
    }
    return arr;
}
function drawMenu(menu){
    for (var i = 0; i < menu.length; i++) {
        ctx_nav.lineWidth="0.75";
        ctx_nav.strokeStyle=colors[1];
        ctx_nav.strokeRect(menu[i].x, menu[i].y, bw, bh);
        ctx_nav.fillStyle=colors[0];
        ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
    }

    ctx_nav.lineWidth="0.75";
    ctx_nav.strokeStyle=colors[2];
    ctx_nav.strokeRect(btn01.x, btn01.y, bw, bh);
    ctx_nav.fillStyle=colors[0];
    ctx_nav.fillRect(btn01.x, btn01.y, bw, bh);

}
//---------------------------------------//
function getData(){

    init = true;
	
    document.getElementById('get_all').removeEventListener("click", getData);

	$("#get_all").toggleClass('b_off b_on');

	$.ajax({                                      
        url: 'php/animated_data.php',       
        type: "POST"
    }).done(function(str) {

    	allData = str.split("%");
    	// allData = str.split("%");

    	var txt = allData[0] + " " + allData[1] + " " + allData[2];

    	var num = allData.length / 3;
    	var txt2 = "allData: " + num;

        $("#selection p").text(txt);
        $("#info p:eq(0)").text(txt2);
        // $("#selection p").text(allData[0]);
        // console.log(msg);

    });
}

//------------ charts ------------------//
function BarChart(config){

	var cWidth = 600;
	var cHeight = 300;

	this.canvas = document.getElementById(config.canvasId);
	this.data = config.data;
	this.color = config.color;
	this.barWidth = config.barWidth;
	this.gridLineIncrement = config.gridLineIncrement;

	this.maxValue = config.maxValue - Math.floor(config.maxValue % this.gridLineIncrement);
	this.minValue = config.minValue;

	this.font = "12pt Calibri";
	this.axisColor = "#555";
	this.gridColor = "aaa";
	this.padding = 10;

	this.context = this.canvas.getContext("2d");
	this.range = this.maxValue - this.minValue;
	this.numGridLines = Math.round(this.range/this.gridLineIncrement);
	this.longestValueWidth = this.getLongestValueWidth();
	this.x = this.padding + this.longestValueWidth;
	this.y = this.padding * 2;
	this.width = cWidth - (this.longestValueWidth + this.padding * 2);
	this.height = cHeight - (this.getLabelAreaHeight() + this.padding * 4);

	this.drawGridlines();
	
	this.drawXAxis();
	this.drawYAxis();
	
	this.drawBars();

	this.drawXLabels();
	this.drawYValues();
}

BarChart.prototype.getLabelAreaHeight = function(){
	this.context.font = this.font;
	var maxLabelWidth = 0;

	for (var n=0; n<this.data.length; n++){
		var label = this.data[n].label;
		maxLabelWidth = Math.max(maxLabelWidth, this.context.measureText(label).width);
	}


	return Math.round(maxLabelWidth / Math.sqrt(2));
};

BarChart.prototype.getLongestValueWidth = function(){
	this.context.font = this.font;
	var longestValueWidth = 0;

	for(var n=0; n<=this.numGridLines; n++){
		var value = this.maxValue - (n*this.gridLineIncrement);
		longestValueWidth = Math.max(longestValueWidth, this.context.measureText(value).width);
	}
	return longestValueWidth;
};

BarChart.prototype.drawXLabels = function(){
	var context = this.context;
	context.save();
	var data = this.data;
	var barSpacing = this.width/data.length;

	for(var n=0; n<data.length; n++){
		var label = data[n].label;
		context.save();
		context.translate(this.x + ((n+1/2)*barSpacing), this.y + this.height + 10);
		context.rotate(-1*Math.PI/4);
		context.font = this.font;
		context.fillStyle = "black";
		context.textAlign = "right";
		context.textBaseline = "middle";
		context.fillText(label, 0, 0);
		context.restore();
	}
	context.restore();
};

BarChart.prototype.drawYValues = function(){
	var context = this.context;
	context.save();
	context.font = this.font;
	context.fillStyle = "black";
	context.textAlign = "right";
	context.textBaseline = "middle";

	for (var n = 0; n <= this.numGridLines; n++) {
		var value = this.maxValue - (n*this.gridLineIncrement);
		var thisY = (n*this.height/this.numGridLines)+this.y;
		context.fillText(value, this.x-5, thisY);
	}
	context.restore();
};

BarChart.prototype.drawBars = function(){
	var context = this.context;
	context.save();
	var data = this.data;
	var barSpacing = this.width/data.length;
	var unitHeight = this.height/this.range;

	for(var n=0; n<data.length; n++) {
		var bar=data[n];
		var barHeight=(data[n].value-this.minValue)*unitHeight;
	

		if(barHeight>0){
			context.save();
			context.translate(Math.round(this.x + ((n+1/2) * barSpacing)), Math.round(this.y+this.height));

			context.scale(1, -1);

			context.beginPath();
			context.rect(-this.barWidth/2, 0, this.barWidth, barHeight);
			context.fillStyle = this.color;
			context.fill();
			context.restore();
		}
	}
	context.restore();
};

BarChart.prototype.drawGridlines = function(){

	var context = this.context;
	context.save();
	context.strokeStyle = this.gridColor;
	context.lineWidth = 2;

	for (var n = 0; n < this.numGridLines; n++) {
		var y = (n*this.height/this.numGridLines)+this.y;
		context.beginPath();
		context.moveTo(this.x, y);
		context.lineTo(this.x+this.width, y);
		context.stroke();
	}
	context.restore();
};

BarChart.prototype.drawXAxis = function(){
	var context = this.context;
	context.save();
	context.beginPath();
	context.moveTo(this.x, this.y + this.height);
	context.lineTo(this.x + this.width, this.y + this.height);
	context.strokeStyle = this.axisColor;
	context.lineWidth = 2;
	context.stroke();
	context.restore();
};

BarChart.prototype.drawYAxis = function(){
	var context = this.context;
	context.save();
	context.beginPath();
	context.moveTo(this.x, this.y);
	context.lineTo(this.x, this.height + this.y);
	context.strokeStyle = this.axisColor;
	context.lineWidth = 2;
	context.stroke();
	context.restore();
};