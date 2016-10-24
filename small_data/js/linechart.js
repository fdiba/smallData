function LineChart(config){

    this.w = 1200;
    this.h = 600;

    // user defined properties
    this.canvas = document.getElementById(config.canvasId);
    this.minY = config.minY;
    this.maxX = config.maxX;
    this.maxY = config.maxY;
    this.unitsPerTickX = config.unitsPerTickX;
    this.unitsPerTickY = config.unitsPerTickY;

    this.data=[];

    this.minYear = config.minYear;
    this.maxYear = config.maxYear;

    // this.countries=[];
    this.lg_btns=[];
    this.bWidth=10;

    

    this.colors=["#bdc3c7", "#4aa3df"];
    //grey silver, blue - peter river

    // constants
    this.padding = 10;
    this.tickSize = 10;
    this.axisColor = "#555";
    this.pointRadius = 2;
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
    this.height = this.h - this.y - this.padding - this.fontHeight;
    this.scaleX = this.width / this.rangeX;
    this.scaleY = this.height / this.rangeY;

    
    this.resetCanvas();
    this.drawXAxis();
    this.drawYAxis();

}
LineChart.prototype.resetCanvas = function(){
    this.context.fillStyle = "#ecf0f1";
    this.context.fillRect(0, 0, this.w, this.h);
}
LineChart.prototype.editData = function(mouseX, mouseY){

    var bWidth=this.bWidth;
    var btns=this.lg_btns;

    for (var i = 0; i < btns.length; i++) {
        
        if(mouseX>=btns[i].x && mouseX<=btns[i].x+bWidth &&
           mouseY>=btns[i].y && mouseY<=btns[i].y+bWidth){
            
            btns[i].state = !btns[i].state;
            // console.log(btns[i].state);
            if(btns[i].state){
                this.drawRectangle(this.context, btns[i], bWidth, this.colors[1]);
            } else {
                this.drawRectangle(this.context, btns[i], bWidth, this.colors[0]);
            }

            var txt=this.data[i].ctry+": "+this.data[i].arr;
            $("#selection p").text(txt);

            this.redrawLineChart();

            break;
            
        } 
    }
}
LineChart.prototype.redrawLineChart = function(){
    
    this.resetCanvas();
    this.drawXAxis();
    this.drawYAxis();

    var data=this.data;
    for (var i = 0; i < data.length; i++) {
        if(this.lg_btns[i].state)this.drawLine(data[i], this.colors[1], 1, false);
    }

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
        ctx.moveTo((n + 1) * this.width / this.numXTicks + this.x, this.y + this.height);
        ctx.lineTo((n + 1) * this.width / this.numXTicks + this.x, this.y + this.height - this.tickSize);
        ctx.stroke();
    }

    // draw labels
    ctx.font = this.font;
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (var i=0; i<=this.numXTicks; i++) {
        var label = i + this.minYear;
        var str = label.toString().substring(2, 4);
        ctx.save();
        ctx.translate(i*this.width / this.numXTicks + this.x, this.y + this.height + this.padding);
        ctx.fillText(str, 0, 0);
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
    ctx.lineWidth = 1;
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
LineChart.prototype.drawRectangle = function(ctx, btn, bWidth, color){
    ctx.strokeStyle = "black";
    ctx.strokeRect(btn.x, btn.y, bWidth, bWidth)
    ctx.fillStyle = color;
    ctx.fillRect(btn.x, btn.y, bWidth, bWidth);
}
LineChart.prototype.drawLegend = function(){

    var arr = this.data;
    var ctx = this.context;
    var xPos = 1235, yPos = 25;

    ctx.font = this.font;
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    var bWidth=this.bWidth;

    for (var i=0; i<arr.length; i++) {

        this.lg_btns.push({x:xPos-18, y:yPos-6, state:true});
        
        var btn = this.lg_btns[this.lg_btns.length-1];

        this.drawRectangle(ctx, btn, bWidth, this.colors[1]);

        ctx.fillStyle = "black";
        ctx.fillText(arr[i].ctry, xPos, yPos);
        
        yPos+=15;
        if(yPos>this.h-15){
            yPos = 20;
            xPos += 185;
        }
    }
}
LineChart.prototype.drawLine = function(obj, color, strokeWidth, init){

    if(init)this.data.push(obj);

    var arr = obj.arr;

    var ctx = this.context;
    ctx.save();
    this.transformContext();
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.beginPath();

    var xPos, yPos;
    xPos = 0;
    
    for (var i=0; i<arr.length; i++) {

        yPos = arr[i];

        if(i===0){
            ctx.beginPath();
            ctx.moveTo(xPos * this.scaleX, yPos * this.scaleY);
        }

        ctx.lineTo(xPos*this.scaleX, yPos*this.scaleY);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(xPos*this.scaleX, yPos*this.scaleY, this.pointRadius, 0, 2*Math.PI);
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(xPos*this.scaleX, yPos*this.scaleY);

        xPos += 5;
        
    }
    ctx.restore();
};
LineChart.prototype.transformContext = function(){
    var ctx = this.context;
    ctx.translate(this.x, this.y + this.height);
    ctx.scale(1, -1);
};