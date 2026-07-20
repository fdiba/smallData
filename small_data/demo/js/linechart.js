function LineChart(config){

    this.w = 1200;
    this.h = 600;

    this.canvas = document.getElementById(config.canvasId);
    this.context = this.canvas.getContext("2d");

    this.minY = config.minY;
    this.maxX = config.maxX;
    this.maxY = config.maxY;
    this.unitsPerTickX = config.unitsPerTickX;
    this.unitsPerTickY = config.unitsPerTickY;

    this.cleared=true;

    this.data=[];

    this.minYear = config.minYear;
    this.maxYear = config.maxYear;

    this.lg_btns=[];
    this.solo_btns=[];
    this.numSolos=0;
    this.bWidth=10;

    this.lines=[];

    this.colors=["#bdc3c7", "#4aa3df", "#2ecc71", "#16a085"];
    //grey: silver, blue: peter river, emerald: green, green sea: dark green

    //couleurs attribuees aux pays surlignes (une par pays)
    this.soloColors=["#3987e5", "#2aa42a", "#dc6791", "#c98500",
                     "#1aa876", "#e06a36", "#9085e9", "#e66767"];

    this.padding = 10;
    this.tickSize = 10;
    this.axisColor = "#8fa3b0";
    this.pointRadius = 2;
    this.font = "12pt Calibri";

    this.fontHeight = 12;

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

    this.sl_ctry="";

    this.resetCanvas();
    this.drawXAxis();
    this.drawYAxis();

}
//position verticale d'une valeur, en echelle racine carree :
//dilate le bas de l'axe pour que les pays a faibles effectifs restent lisibles
LineChart.prototype.yPos = function(value){
    if(this.maxY<=0)return this.y + this.height;
    var f = Math.sqrt(value / this.maxY);
    return this.y + this.height - f * this.height;
};
LineChart.prototype.resetCanvas = function(){
    this.context.fillStyle = "#2c3e50";
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

        this.sl_ctry = this.data[cp.ctryId].ctry;

        var year = parseInt(cp.yearId) + this.minYear;
        var value = parseInt(this.data[cp.ctryId].arr[cp.yearId]);
        var cId = parseInt(this.data[cp.ctryId].cId);

        this.redrawLineChart();

        //le cercle de selection prend la couleur de la ligne cliquee,
        //avec un anneau clair pour rester visible sur le fond sombre
        var sl_btn = this.solo_btns[cp.ctryId];
        var lineColor = (sl_btn && sl_btn.state && sl_btn.color) ? sl_btn.color : this.colors[1];

        ctx.lineWidth=2;
        ctx.strokeStyle="#ecf0f1";
        ctx.fillStyle=lineColor;
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

    var sl_ctry=this.sl_ctry;
    
    $.ajax({                                      
        url: 'php/retrieve_data.php',       
        type: "POST",
        data: { cId: cId, year:year, value:value, case:0 } 
    }).done(function(str) {

        var arr=str.split("%");
        composers=[];

        for (var i=0; i<arr.length-3; i+=4) {
            composers.push({id:arr[i], fn:arr[i+1], n:arr[i+2], y:arr[i+3]});
        }

        getNumComposersInCapsulesAndTitles(cId, year, composers);

        editTitleInfo(sl_ctry, year, value, composers.length, yearSelection);
        displayCpInfos();

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

                if(solos[i].state){
                    solos[i].color = this.pickSoloColor();
                    this.numSolos++;
                } else {
                    solos[i].color = null;
                    this.numSolos--;
                }

                this.drawRectangle(this.context, solos[i], bWidth, solos[i].color || this.colors[2]);

                this.redrawLineChart();

                touched=true;
                break;
            }
        }
    }


    //display infos
    if(touched && this.numSolos>0){
        
        /*var arr;
        if(this.numSolos>0)arr=solos;
        else arr=btns;*/

        var arr=solos;

        $("#selection").empty();
        for (var i=0; i<arr.length; i++) {
            if(arr[i].state){
                var txt='<p>'+this.data[i].arr+" - "+this.data[i].ctry+" ID "+this.data[i].cId+'</p>';
                $("#selection").append(txt);
            }
        }
    } else if(touched){
        $("#selection p").text("no selection");
    }
}
LineChart.prototype.pickSoloColor = function(){
    var used = [];
    for (var i=0; i<this.solo_btns.length; i++) {
        if(this.solo_btns[i].state && this.solo_btns[i].color)used.push(this.solo_btns[i].color);
    }
    for (var j=0; j<this.soloColors.length; j++) {
        if(used.indexOf(this.soloColors[j])===-1)return this.soloColors[j];
    }
    return this.soloColors[this.numSolos % this.soloColors.length];
};
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
            if(solos[i].state)this.drawLine(data[i], solos[i].color || this.colors[2], 2, false);
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
    ctx.lineWidth = 1;
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
    ctx.fillStyle = "#ecf0f1";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    var yOffset=3;

    for (var i=0; i<=this.numXTicks; i++) {
        var label = i + this.minYear;
        var str = label.toString().substring(2, 4);
        ctx.save();
        ctx.translate(i*this.width / this.numXTicks + this.x, this.y + this.height + this.padding);
        ctx.fillText(str, 0, yOffset);
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

    //graduations rondes, placees selon l'echelle racine carree
    var niceValues = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    var ticks = [];
    for (var i = 0; i < niceValues.length; i++) {
        if(niceValues[i] < this.maxY)ticks.push(niceValues[i]);
    }
    ticks.push(this.maxY);

    ctx.font = this.font;

    for (var n = 0; n < ticks.length; n++) {

        var y = this.yPos(ticks[n]);

        //ligne de grille discrete sur toute la largeur
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.beginPath();
        ctx.moveTo(this.x, y);
        ctx.lineTo(this.x + this.width, y);
        ctx.stroke();

        //graduation
        ctx.strokeStyle = "#8fa3b0";
        ctx.beginPath();
        ctx.moveTo(this.x, y);
        ctx.lineTo(this.x + this.tickSize, y);
        ctx.stroke();

        //valeur
        ctx.fillStyle = "#ecf0f1";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(ticks[n], this.x - this.padding, y);
    }
    ctx.restore();

};
LineChart.prototype.drawRectangle = function(ctx, btn, bWidth, color){
    if(!btn.state)color=this.colors[0];
    ctx.strokeStyle = "rgba(236, 240, 241, 0.6)";
    ctx.strokeRect(btn.x, btn.y, bWidth, bWidth)
    ctx.fillStyle = color;
    ctx.fillRect(btn.x, btn.y, bWidth, bWidth);
}
LineChart.prototype.drawLegend = function(){

    var arr = this.data;
    var ctx = this.context;
    var xPos = 1255, yPos = 25;

    ctx.font = this.font;
    ctx.fillStyle = "#ecf0f1";
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
        
        ctx.fillStyle = "#ecf0f1";

        var ctry_id=arr[i].cId;
        var counts=' '+numCpByCountry[ctry_id].c+'/'+numCpByCountry[ctry_id].t;
        var str=arr[i].ctry+counts;

        //tronque les noms trop longs (Bosnia Herzegovina...) pour ne pas
        //deborder sur la colonne suivante ; les compteurs restent visibles
        var maxTextWidth = 158;
        if(ctx.measureText(str).width > maxTextWidth){
            var name=arr[i].ctry;
            while(name.length>1 && ctx.measureText(name+'\u2026'+counts).width > maxTextWidth){
                name=name.slice(0, -1);
            }
            str=name+'\u2026'+counts;
        }

        ctx.fillText(str, xPos, yPos);
        
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
        var y=this.yPos(yPos);

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