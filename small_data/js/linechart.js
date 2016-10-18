function LineChart(config){

    this.w = 900;
    this.h = 500;

    // user defined properties
    this.canvas = document.getElementById(config.canvasId);
    this.minX = config.minX;
    this.minY = config.minY;
    this.maxX = config.maxX;
    this.maxY = config.maxY;
    this.unitsPerTickX = config.unitsPerTickX;
    this.unitsPerTickY = config.unitsPerTickY;

    // constants
    this.padding = 10;
    this.tickSize = 10;
    this.axisColor = "#555";
    this.pointRadius = 5;
    this.font = "12pt Calibri";

    this.fontHeight = 12;

    // relationships
    this.context = this.canvas.getContext("2d");
    this.rangeX = this.maxX - this.minY;
    this.rangeY = this.maxY - this.minY;
    this.numXTicks = Math.round(this.rangeX / this.unitsPerTickX);
    this.numYTicks = Math.round(this.rangeY / this.unitsPerTickY);
    this.x = this.getLongestValueWidth() + this.padding * 2;
    this.y = this.padding * 2;
    this.width = this.w - this.x - this.padding * 2;
    this.height = this.h - this.y - this.padding -
    this.fontHeight;
    this.scaleX = this.width / this.rangeX;
    this.scaleY = this.height / this.rangeY;

    this.context.fillStyle = "#ecf0f1";
    this.context.fillRect(0, 0, this.w, this.h);

    // draw x y axis and tick marks
    this.drawXAxis();
    this.drawYAxis();

}

LineChart.prototype.getLongestValueWidth = function(){

    this.context.font = this.font;
    var longestValueWidth = 0;
    for (var n = 0; n <= this.numYTicks; n++) {
        var value = this.maxY - (n * this.unitsPerTickY);
        longestValueWidth = Math.max(longestValueWidth, this.
        context.measureText(value).width);
    }
    return longestValueWidth;
};

LineChart.prototype.drawXAxis = function(){

    var ctx = this.context;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.height);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.strokeStyle = this.axisColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // draw tick marks
    for (var n = 0; n < this.numXTicks; n++) {
        ctx.beginPath();
        ctx.moveTo((n + 1) * this.width / this.numXTicks +
        this.x, this.y + this.height);
        ctx.lineTo((n + 1) * this.width / this.numXTicks +
        this.x, this.y + this.height - this.tickSize);
        ctx.stroke();
    }

    // draw labels
    ctx.font = this.font;
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (var n = 0; n < this.numXTicks; n++) {
        var label = Math.round((n + 1) * this.maxX / this.numXTicks);
        ctx.save();
        ctx.translate((n + 1) * this.width / this.numXTicks +
        this.x, this.y + this.height + this.padding);
        ctx.fillText(label, 0, 0);
        ctx.restore();
    }
    ctx.restore();

};

LineChart.prototype.drawYAxis = function(){

    var ctx = this.context;
    ctx.save();
    context.save();
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x, this.y + this.height);
    ctx.strokeStyle = this.axisColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // draw tick marks
    for (var n = 0; n < this.numYTicks; n++) {
        ctx.beginPath();
        ctx.moveTo(this.x, n * this.height / this.numYTicks +
        this.y);
        ctx.lineTo(this.x + this.tickSize, n * this.height /
        this.numYTicks + this.y);
        ctx.stroke();
    }

    // draw values
    ctx.font = this.font;
    ctx.fillStyle = "black";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    
    for (var n = 0; n < this.numYTicks; n++) {
        var value = Math.round(this.maxY - n * this.maxY / this.numYTicks);
        ctx.save();
        ctx.translate(this.x - this.padding, n * this.height /
        this.numYTicks + this.y);
        ctx.fillText(value, 0, 0);
        ctx.restore();
    }
    ctx.restore();

};

LineChart.prototype.drawLine = function(data, color, width){

    var ctx = this.context;
    ctx.save();
    this.transformContext();
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(data[0].x * this.scaleX, data[0].y * this.scaleY);
    for (var n = 0; n < data.length; n++) {
    var point = data[n];
    // draw segment
    ctx.lineTo(point.x * this.scaleX, point.y * this.scaleY);
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(point.x * this.scaleX, point.y * this.scaleY,
    this.pointRadius, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();
    // position for next segment
    ctx.beginPath();
    ctx.moveTo(point.x * this.scaleX, point.y * this.scaleY);
    }
    ctx.restore();
};

LineChart.prototype.transformContext = function(){
    var ctx = this.context;
    ctx.translate(this.x, this.y + this.height);
    ctx.scale(1, -1);
}