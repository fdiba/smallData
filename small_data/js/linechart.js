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

    this.cleared=true;

    this.data=[];
    this.composers=[];

    this.minYear = config.minYear;
    this.maxYear = config.maxYear;

    // this.countries=[];
    this.lg_btns=[];
    this.solo_btns=[];
    this.numSolos=0;
    this.bWidth=10;

    this.lines=[];

    this.colors=["#bdc3c7", "#4aa3df", "#2ecc71", "#16a085"];
    //grey: silver, blue: peter river, emerald: green, green sea: dark green

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
LineChart.prototype.requestData = function(mouseX, mouseY){
    
    var lines=this.lines;
    var ctx=this.context;
    var cp={x:-999, y:-999, value:20};//closest point

    for (var i=0; i<lines.length; i++) {
        
        var points=lines[i];

        for (var j=0; j<points.length; j++) {
            
            var p=points[j];
            var distance = dist(p.x, mouseX, p.y, mouseY);

            if(distance < cp.value && this.numSolos===0){
                cp={x:p.x, y:p.y, value:distance, ctryId:i, yearId:j};
            } else if(distance < cp.value && this.solo_btns[i]){
                if(this.solo_btns[i].state)cp={x:p.x, y:p.y, value:distance, ctryId:i, yearId:j};
            }
        }
    }

    if(cp.value<20){

        var ctry = this.data[cp.ctryId].ctry;
        var year = parseInt(cp.yearId) + this.minYear;
        var value = parseInt(this.data[cp.ctryId].arr[cp.yearId]);
        var cId = parseInt(this.data[cp.ctryId].cId);
        
        $("#selection").empty();
        $("#selection").append('<p>');
        var txt=cId+" "+ctry+" "+year+" "+value;
        $("#selection p").text(txt);

        this.redrawLineChart();

        ctx.strokeStyle=this.colors[3];
        ctx.fillStyle=this.colors[2];
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, this.pointRadius*2, 0, 2*Math.PI);
        ctx.stroke();
        ctx.fill();
        ctx.closePath();

        this.cleared=false; //one year selected

        this.retrieveData(cId, year, value);

    } else if(!this.cleared) {
        this.redrawLineChart();
        this.cleared=true;
    }
}
LineChart.prototype.retrieveData = function(cId, year, value){
    $.ajax({                                      
        url: 'php/retrieve_data.php',       
        type: "POST",
        data: { cId: cId, year:year, value:value } 
    }).done(function(str) {

        var arr=str.split("%");
        this.composers=[];
        $("#composers").empty();

        for (var i=0; i<arr.length-2; i+=3) {
            this.composers.push({id:arr[i], fn:arr[i+1], n:arr[i+2]});
            var div='<li>'+arr[i]+" "+arr[i+1]+" "+arr[i+2]+'</li>';
            $("#composers").append(div);

            $("#composers li:last-child").click(function(event) {
                console.log($(event.target).text());
            });
        }
    });
}
LineChart.prototype.editData = function(mouseX, mouseY){

    var bWidth=this.bWidth;
    var btns=this.lg_btns;
    var solos=this.solo_btns;
    var touched=false;

    for (var i=0; i<btns.length; i++) { //remove country
        
        if(mouseX>=btns[i].x && mouseX<=btns[i].x+bWidth && mouseY>=btns[i].y && mouseY<=btns[i].y+bWidth){
            
            btns[i].state = !btns[i].state;

            this.drawRectangle(this.context, btns[i], bWidth, this.colors[1]);            

            this.redrawLineChart();

            touched=true;
            break;
        } 
    }

    if(!touched){ //highlight country

        for (var i=0; i<solos.length; i++) {

            if(mouseX>=solos[i].x && mouseX<=solos[i].x+bWidth && mouseY>=solos[i].y && mouseY<=solos[i].y+bWidth){

                solos[i].state = !solos[i].state;

                if(solos[i].state)this.numSolos++;
                else this.numSolos--;

                this.drawRectangle(this.context, solos[i], bWidth, this.colors[2]);

                this.redrawLineChart();

                touched=true;
                break;
            }
        }
    }


    //display infos
    if(touched){
        
        var arr;
        if(this.numSolos>0)arr=solos;
        else arr=btns;

        $("#selection").empty();
        for (var i=0; i<arr.length; i++) {
            if(arr[i].state){
                var txt='<p>'+this.data[i].arr+" - "+this.data[i].ctry+" ID "+this.data[i].cId+'</p>';
                $("#selection").append(txt);
            }
        }
    }
}
LineChart.prototype.redrawLineChart = function(){
    
    this.resetCanvas();
    this.drawXAxis();
    this.drawYAxis();


    // console.log('numSolos:', this.numSolos);
    var alpha=1;
    if(this.numSolos>0)alpha=.3;
    else alpha=1;

    this.context.globalAlpha=alpha;

    var data=this.data;
    var btns=this.lg_btns;
    var solos=this.solo_btns;

    for (var i = 0; i < data.length; i++) {
        if(btns[i].state && !solos[i].state)this.drawLine(data[i], this.colors[1], 1, false);
    }

    this.context.globalAlpha = 1;

    if(this.numSolos>0){
        for (var i = 0; i < data.length; i++) {
            if(solos[i].state)this.drawLine(data[i], this.colors[2], 2, false);
        }
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

    // console.log(this.x);

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
    ctx.strokeStyle = "black";
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
    if(!btn.state)color=this.colors[0];
    ctx.strokeStyle = "black";
    ctx.strokeRect(btn.x, btn.y, bWidth, bWidth)
    ctx.fillStyle = color;
    ctx.fillRect(btn.x, btn.y, bWidth, bWidth);
}
LineChart.prototype.drawLegend = function(){

    var arr = this.data;
    var ctx = this.context;
    var xPos = 1255, yPos = 25;

    ctx.font = this.font;
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    var bWidth=this.bWidth;

    for (var i=0; i<arr.length; i++) {

        this.lg_btns.push({x:xPos-38, y:yPos-6, state:true});
        this.solo_btns.push({x:xPos-22, y:yPos-6, state:false});
        
        var btn = this.lg_btns[this.lg_btns.length-1];
        this.drawRectangle(ctx, btn, bWidth, this.colors[1]);

        var solo = this.solo_btns[this.solo_btns.length-1];
        this.drawRectangle(ctx, solo, bWidth, this.colors[2]);
        
        ctx.fillStyle = "black";
        ctx.fillText(arr[i].ctry, xPos, yPos);
        
        yPos+=15;
        if(yPos>this.h-15){
            yPos = 20;
            xPos += 205;
        }
    }
}
LineChart.prototype.drawLine = function(obj, color, strokeWidth, init){

    if(init)this.data.push(obj);

    var arr = obj.arr;

    var points=[];

    var ctx = this.context;

    var xOffset = this.x;
    var yOffset = this.y + this.height;

    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.beginPath();

    var xPos, yPos;
    xPos=0;
    
    for (var i=0; i<arr.length; i++) {

        yPos = arr[i];

        var x=xPos*this.scaleX+xOffset;
        var y=yOffset-(yPos*this.scaleY);

        if(i===0){
            ctx.beginPath();
            ctx.moveTo(x, y);
        }

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.closePath();

        points.push({x: x, y:y});

        ctx.beginPath();
        ctx.arc(x, y, this.pointRadius, 0, 2*Math.PI);
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(x, y);

        xPos += 5;
        
    }
    this.lines.push(points);
};