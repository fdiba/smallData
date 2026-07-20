function BarChart(config){

	this.w = 900;
	this.h = 500;

	this.canvas = document.getElementById(config.canvasId);
	this.data = config.data;
	this.barWidth = config.barWidth;
	this.gridLineIncrement = config.gridLineIncrement;

	this.maxValue = config.maxValue - Math.floor(config.maxValue % this.gridLineIncrement);
	this.minValue = config.minValue;

	this.colors = ["#3498db"]; //blue - peter river
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
	this.width = this.w - (this.longestValueWidth + this.padding * 2);
	this.height = this.h - (this.getLabelAreaHeight() + this.padding * 4);


	this.context.fillStyle = "#ecf0f1";
	this.context.fillRect(0, 0, this.w, this.h);

	this.drawGridlines();
	
	this.drawXYAxis();
		
	this.drawBars(this.colors[0]);

	this.drawXLabels();
	this.drawYValues();
}

BarChart.prototype.getLabelAreaHeight = function(){
	this.context.font = this.font;
	var maxLabelWidth = 0;

	for (var i=0; i<this.data.length; i++){
		var label = this.data[i].label;
		maxLabelWidth = Math.max(maxLabelWidth, this.context.measureText(label).width);
	}

	return Math.round(maxLabelWidth / Math.sqrt(2));
};

BarChart.prototype.getLongestValueWidth = function(){
	this.context.font = this.font;
	var longestValueWidth = 0;

	for(var i=0; i<=this.numGridLines; i++){
		var value = this.maxValue - (i*this.gridLineIncrement);
		longestValueWidth = Math.max(longestValueWidth, this.context.measureText(value).width);
	}
	return longestValueWidth;
};

BarChart.prototype.drawXLabels = function(){
	var ctx = this.context;
	ctx.save();
	var data = this.data;
	var barSpacing = this.width/data.length;

	ctx.font = this.font;
	ctx.fillStyle = "black";
	ctx.textAlign = "right";
	ctx.textBaseline = "middle";

	for(var i=0; i<data.length; i++){
		var label = data[i].label;
		ctx.save();
		ctx.translate(this.x + ((i+1/2)*barSpacing), this.y + this.height + 10);
		ctx.rotate(-1*Math.PI/4);
		ctx.fillText(label, 0, 0);
		ctx.restore();
	}
	ctx.restore();
};

BarChart.prototype.drawYValues = function(){
	var ctx = this.context;
	ctx.save();

	ctx.font = this.font;
	ctx.fillStyle = "black";
	ctx.textAlign = "right";
	ctx.textBaseline = "middle";

	for (var i=0; i<=this.numGridLines; i++) {
		var value = this.maxValue - (i*this.gridLineIncrement);
		var thisY = (i*this.height/this.numGridLines)+this.y;
		ctx.fillText(value, this.x-5, thisY);
	}
	ctx.restore();
};

BarChart.prototype.drawBars = function(){
	var ctx = this.context;
	ctx.save();
	var data = this.data;
	var barSpacing = this.width/data.length;
	var unitHeight = this.height/this.range;

	for(var i=0; i<data.length; i++) {

		var bar=data[i];
		var barHeight=(data[i].value-this.minValue)*unitHeight;
	

		if(barHeight>0){
			ctx.save();
			ctx.translate(Math.round(this.x + ((i+1/2) * barSpacing)), Math.round(this.y+this.height));

			ctx.scale(1, -1);

			ctx.beginPath();
			ctx.rect(-this.barWidth/2, 0, this.barWidth, barHeight);
			ctx.fillStyle = this.colors[0];
			ctx.fill();
			ctx.restore();
		}
	}
	ctx.restore();
};

BarChart.prototype.drawGridlines = function(){

	var ctx = this.context;
	ctx.save();
	ctx.strokeStyle = this.gridColor;
	ctx.lineWidth = .1;

	for (var i=0; i<this.numGridLines; i++) {
		var y = (i*this.height/this.numGridLines)+this.y;
		ctx.beginPath();
		ctx.moveTo(this.x, y);
		ctx.lineTo(this.x+this.width, y);
		ctx.stroke();
	}
	ctx.restore();
};

BarChart.prototype.drawXYAxis = function(){
	var ctx = this.context;
	ctx.save();
	ctx.beginPath();

	ctx.moveTo(this.x, this.y + this.height);
	ctx.lineTo(this.x + this.width, this.y + this.height);

	context.moveTo(this.x, this.y);
	context.lineTo(this.x, this.height + this.y);

	ctx.strokeStyle = this.axisColor;
	ctx.lineWidth = 1;
	ctx.stroke();
	ctx.restore();
};