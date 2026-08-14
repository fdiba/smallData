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

    this.soloSlot={};
    this.numSolos=0;
    this.bWidth=10;

    this.lines=[];

    this.colors=["#bdc3c7", "#4aa3df", "#2ecc71", "#16a085"];

    this._retired=false;

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

    this.hdr1 = 11;
    this.y = 24;
    this.width = this.w - this.x - this.padding * 2;
    this.height = this.h - this.y - this.padding - this.fontHeight;
    this.scaleX = this.width / this.rangeX;
    this.scaleY = this.height / this.rangeY;

    this.sl_ctry="";

    this.hoverIdx=-1;
    this.hl=[];
    this._hoverAnimating=false;

    this.selectedLines=[];

    this.resetCanvas();
    this.drawXAxis();
    this.drawYAxis();

}

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

    if(this._retired) return;

    var i = (this.hoverIdx>=0 && this.isVisible(this.hoverIdx))
            ? this.hoverIdx : this.findNearestLine(mouseX, mouseY);

    var onLine = (i>=0) && (this.hoverIdx===i || this.distanceToLine(i, mouseX, mouseY) <= 20);

    if(onLine){

        var arr=this.data[i].arr, bj=-1, bd=1e9;
        for (var j=0; j<arr.length; j++){
            if(this.minYear + j === 1995) continue;
            var px=j*5*this.scaleX + this.x, py=this.yPos(arr[j]);
            var d=dist(px, mouseX, py, mouseY);
            if(d<bd){ bd=d; bj=j; }
        }

        if(bj>=0){
            this.sl_ctry = this.data[i].ctry;
            var year  = parseInt(bj) + this.minYear;
            var value = parseInt(this.data[i].arr[bj]);
            var cId   = parseInt(this.data[i].cId);

            var k=this.selectedIndexOf(i);
            if(k>=0) this.selectedLines[k].yearId=bj;
            else     this.selectedLines.push({ctryId:i, yearId:bj});

            this.cleared=false;
            this.redrawLineChart();
            this.retrieveData(cId, year, value);
            return;
        }
    }

    if(this.selectedLines.length){
        this.selectedLines=[];
        this.cleared=true;
        this.redrawLineChart();
    }
}
LineChart.prototype.retrieveData = function(cId, year, value){

    var sl_ctry=this.sl_ctry;

    if(typeof window !== 'undefined'){
        window.lastComposerQuery = {cId: cId, year: year, value: value, ctry: sl_ctry};
    }

    var gen = (typeof dataGen !== 'undefined') ? dataGen : null;

    $.ajax({
        url: 'php/retrieve_data.php',
        type: "POST",

        data: { cId: cId, year:year, value:value, case:0,
                v: (typeof SHOW_ALL_NAMES !== 'undefined' && SHOW_ALL_NAMES) ? 'all' : '' }
    }).done(function(str) {

        if(gen !== null && typeof dataGen !== 'undefined' && gen !== dataGen) return;

        var arr=str.split("%");
        composers=[];

        for (var i=0; i<arr.length-5; i+=6) {
            composers.push({id:arr[i], fn:arr[i+1], n:arr[i+2], y:arr[i+3],
                            isni:arr[i+4], origin:arr[i+5], ctry:sl_ctry});
        }

        getNumComposersInCapsulesAndTitles(cId, year, composers);

        editTitleInfo(sl_ctry, year, value, composers.length, yearSelection);
        displayCpInfos();

    });
}
LineChart.prototype.editData = function(mouseX, mouseY){

    if(this._retired) return;

    var bWidth=this.bWidth;
    var solos=this.solo_btns;

    if(this.resetBtn && mouseX>=this.resetBtn.x && mouseX<=this.resetBtn.x+this.resetBtn.w
        && mouseY>=this.resetBtn.y && mouseY<=this.resetBtn.y+this.resetBtn.h){
        this.resetCountries();
        return;
    }

    for (var i=0; i<solos.length; i++) {
        if(mouseX>=solos[i].x && mouseX<=solos[i].x+bWidth && mouseY>=solos[i].y && mouseY<=solos[i].y+bWidth){
            solos[i].state = !solos[i].state;
            this.numSolos += solos[i].state ? 1 : -1;

            if(solos[i].state){
                this.soloSlot[i] = (typeof vizTakeSlot==='function') ? vizTakeSlot(this.soloSlot) : i;
            } else {
                delete this.soloSlot[i];
            }

            this.refreshLegendButtons();
            this.redrawLineChart();
            break;
        }
    }
}

LineChart.prototype.isVisible = function(i){
    return this.numSolos>0 ? !!(this.solo_btns[i] && this.solo_btns[i].state) : true;
};

LineChart.prototype.soloPalette = (typeof VIZ_CAT !== 'undefined') ? VIZ_CAT :
                                  ["#1abc9c","#3498db","#9b59b6","#e67e22","#e74c3c",
                                   "#2ecc71","#16a085","#d35400","#8e44ad","#2980b9",
                                   "#c0392b","#27ae60"];

LineChart.prototype.soloColor = function(i){
    if(this.numSolos<=0 || !this.solo_btns[i] || !this.solo_btns[i].state) return null;

    var slot = this.soloSlot[i];
    if(slot === undefined) slot = 0;
    return this.soloPalette[slot % this.soloPalette.length];
};

LineChart.prototype.refreshLegendButtons = function(){
    var ctx=this.context, bWidth=this.bWidth;
    for (var i=0;i<this.solo_btns.length;i++){
        var col=this.soloColor(i) || this.colors[1];
        this.drawRectangle(ctx, this.solo_btns[i], bWidth, col);
    }
};

LineChart.prototype.clickPalette = (typeof VIZ_CLICK !== 'undefined') ? VIZ_CLICK :
                                   ["#1abc9c","#9b59b6","#e67e22","#e74c3c","#2ecc71",
                                    "#16a085","#d35400","#8e44ad","#c0392b","#27ae60"];
LineChart.prototype.clickColor = function(k){ return this.clickPalette[k % this.clickPalette.length]; };

LineChart.prototype.selectedIndexOf = function(ctryId){
    for (var k=0;k<this.selectedLines.length;k++){ if(this.selectedLines[k].ctryId===ctryId) return k; }
    return -1;
};

LineChart.prototype.baseColor = function(idx){
    var menu=this.soloColor(idx);
    if(menu) return menu;
    var k=this.selectedIndexOf(idx);
    if(k>=0) return this.clickColor(k);
    return this.colors[1];
};
LineChart.prototype.redrawLineChart = function(){

    this.resetCanvas();
    this.drawXAxis();
    this.drawYAxis();

    var data=this.data;
    var hl=this.hl || (this.hl=[]);
    var YELLOW="#f1c40f", BLUE=this.colors[1];

    var anyHl=0;
    for (var i=0;i<data.length;i++){ var v=hl[i]||0; if(v>anyHl)anyHl=v; }

    var self=this;
    function zKey(i){
        var colored = (self.soloColor(i) || self.selectedIndexOf(i)>=0) ? 1 : 0;
        return colored + 2*(hl[i]||0);
    }
    var order=[];
    for (var i=0;i<data.length;i++){ if(this.isVisible(i))order.push(i); }
    order.sort(function(a,b){ return zKey(a)-zKey(b); });

    for (var o=0;o<order.length;o++){
        var idx=order[o];
        var h=hl[idx]||0;

        var base=this.baseColor(idx);
        var color=lerpHexColor(base, YELLOW, h);
        var alpha=1 - 0.7*(anyHl - h);
        if(alpha<0)alpha=0; else if(alpha>1)alpha=1;
        this.context.globalAlpha=alpha;

        var lw=(this.selectedIndexOf(idx)>=0) ? 2 : 1;
        this.drawLine(data[idx], color, lw, false);
    }
    this.context.globalAlpha=1;

    for (var s=0; s<this.selectedLines.length; s++){
        var sel=this.selectedLines[s], sd=data[sel.ctryId];
        if(!sd || !this.isVisible(sel.ctryId)) continue;
        var sx=sel.yearId*5*this.scaleX + this.x;
        var sy=this.yPos(sd.arr[sel.yearId]);
        var shl=hl[sel.ctryId]||0;
        var sbase=this.baseColor(sel.ctryId);
        var ctx=this.context;
        ctx.lineWidth=2;
        ctx.strokeStyle="#ecf0f1";
        ctx.fillStyle=lerpHexColor(sbase, YELLOW, shl);
        ctx.beginPath();
        ctx.arc(sx, sy, this.pointRadius*2, 0, 2*Math.PI);
        ctx.stroke();
        ctx.fill();
        ctx.closePath();
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

LineChart.prototype.drawHeader = function(){
    var ctx = this.context;
    ctx.save();
    ctx.font = '10px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillStyle = "#8fa3b0";
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.fillText("entrants per country", this.x + this.width, this.hdr1);
    ctx.restore();
};
LineChart.prototype.drawXAxis = function(){

    this.drawHeader();

    var ctx = this.context;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.height);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.strokeStyle = this.axisColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    for (var n = 0; n < this.numXTicks; n++) {
        ctx.beginPath();
        ctx.moveTo((n + 1) * this.width / this.numXTicks + this.x, this.y + this.height);
        ctx.lineTo((n + 1) * this.width / this.numXTicks + this.x, this.y + this.height - this.tickSize);
        ctx.stroke();
    }

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

    var niceValues = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    var ticks = [];
    for (var i = 0; i < niceValues.length; i++) {
        if(niceValues[i] < this.maxY)ticks.push(niceValues[i]);
    }
    ticks.push(this.maxY);

    ctx.font = this.font;

    for (var n = 0; n < ticks.length; n++) {

        var y = this.yPos(ticks[n]);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.beginPath();
        ctx.moveTo(this.x, y);
        ctx.lineTo(this.x + this.width, y);
        ctx.stroke();

        ctx.strokeStyle = "#8fa3b0";
        ctx.beginPath();
        ctx.moveTo(this.x, y);
        ctx.lineTo(this.x + this.tickSize, y);
        ctx.stroke();

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

LineChart.prototype.resetCountries = function(){
    var ctx=this.context, bWidth=this.bWidth;
    this.soloSlot={};
    for (var i=0; i<this.solo_btns.length; i++){
        this.solo_btns[i].state=false;
        this.drawRectangle(ctx, this.solo_btns[i], bWidth, this.colors[1]);
    }
    this.numSolos=0;
    this.selectedLines=[];
    this.cleared=true;
    this.hoverIdx=-1;
    if(this.hl)for (var i=0; i<this.hl.length; i++)this.hl[i]=0;
    this.redrawLineChart();
};
LineChart.prototype.drawLegend = function(){

    var arr = this.data;
    var ctx = this.context;

    var xPos = 1255, yPos = 42;

    var COL_W = 205,
        TXT_W = 158,
        Y_TOP = 20,
        Y_MAX = this.h - 6,
        PAS_MAX = 15, PAS_MIN = 10;

    var toile = (ctx.canvas && ctx.canvas.width) ? ctx.canvas.width : this.w;

    var nbCols = Math.floor((toile - TXT_W - xPos) / COL_W) + 1;
    if(nbCols < 1) nbCols = 1;

    var parCol = Math.ceil(arr.length / nbCols);
    var haut1  = Y_MAX - yPos;
    var hautN  = Y_MAX - Y_TOP;
    var pas    = PAS_MAX;
    if(parCol > 1){
        pas = Math.min(PAS_MAX, Math.floor(Math.min(haut1, hautN) / (parCol - 1)));
        if(pas < PAS_MIN) pas = PAS_MIN;
    }

    var maxCol1 = Math.floor(haut1 / pas) + 1;
    var maxColN = Math.floor(hautN / pas) + 1;
    var placees = 0, dansCol = 0, maxCol = maxCol1;

    ctx.font = this.font;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#f1c40f";
    ctx.fillText("reset all", xPos-38, 18);
    this.resetBtn = {x: xPos-38, y: 6, w: 120, h: 22};

    ctx.fillStyle = "#ecf0f1";

    var bWidth=this.bWidth;

    for (var i=0; i<arr.length; i++) {

        if(xPos + TXT_W > toile) break;

        this.solo_btns.push({x:xPos-22, y:yPos-6, state:false});
        var solo = this.solo_btns[this.solo_btns.length-1];
        this.drawRectangle(ctx, solo, bWidth, this.colors[1]);

        ctx.fillStyle = "#ecf0f1";

        var ctry_id=arr[i].cId;
        var counts=' '+numCpByCountry[ctry_id].c+'/'+numCpByCountry[ctry_id].t;
        var str=arr[i].ctry+counts;

        var maxTextWidth = 158;
        if(ctx.measureText(str).width > maxTextWidth){
            var name=arr[i].ctry;
            while(name.length>1 && ctx.measureText(name+'\u2026'+counts).width > maxTextWidth){
                name=name.slice(0, -1);
            }
            str=name+'\u2026'+counts;
        }

        ctx.fillText(str, xPos, yPos);

        placees++; dansCol++;
        yPos += pas;
        if(dansCol >= maxCol){
            dansCol = 0;
            maxCol  = maxColN;
            yPos    = Y_TOP;
            xPos   += COL_W;
        }
    }

    if(placees < arr.length && typeof console !== 'undefined' && console.warn){
        console.warn('[linechart] legende : ' + placees + ' pays nommes sur ' +
                     arr.length + ' traces — ' + (arr.length - placees) +
                     ' hors de la toile (' + toile + ' px, ' + nbCols + ' colonnes).');
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

        if(this.minYear + i === 1995){
            points.push({x: x, y:y, skip:true});
            xPos += 5;
            continue;
        }

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

};

function distToSegment(px, py, ax, ay, bx, by){
    var dx=bx-ax, dy=by-ay;
    var len2=dx*dx + dy*dy;
    var t = len2 ? ((px-ax)*dx + (py-ay)*dy)/len2 : 0;
    if(t<0)t=0; else if(t>1)t=1;
    var cx=ax + t*dx, cy=ay + t*dy;
    var ex=px-cx, ey=py-cy;
    return Math.sqrt(ex*ex + ey*ey);
}

LineChart.prototype.findNearestLine = function(mouseX, mouseY){
    var data=this.data;
    var best=-1, bestDist=14;
    for (var i=0; i<data.length; i++){
        if(!this.isVisible(i)) continue;
        var arr=data[i].arr, pts=[];
        for (var j=0; j<arr.length; j++){
            if(this.minYear + j === 1995) continue;
            pts.push({x: j*5*this.scaleX + this.x, y: this.yPos(arr[j])});
        }
        if(pts.length===1){
            var d0=dist(pts[0].x, mouseX, pts[0].y, mouseY);
            if(d0<bestDist){ bestDist=d0; best=i; }
        }
        for (var k=0; k<pts.length-1; k++){
            var d=distToSegment(mouseX, mouseY, pts[k].x, pts[k].y, pts[k+1].x, pts[k+1].y);
            if(d<bestDist){ bestDist=d; best=i; }
        }
    }
    return best;
};

LineChart.prototype.distanceToLine = function(i, mouseX, mouseY){
    var arr=this.data[i].arr, pts=[];
    for (var j=0; j<arr.length; j++){
        if(this.minYear + j === 1995) continue;
        pts.push({x: j*5*this.scaleX + this.x, y: this.yPos(arr[j])});
    }
    if(pts.length===1) return dist(pts[0].x, mouseX, pts[0].y, mouseY);
    var best=1e9;
    for (var k=0; k<pts.length-1; k++){
        var d=distToSegment(mouseX, mouseY, pts[k].x, pts[k].y, pts[k+1].x, pts[k+1].y);
        if(d<best)best=d;
    }
    return best;
};

LineChart.prototype.hover = function(mouseX, mouseY){
    if(this._retired) return;
    if(this.hoverIdx>=0 && this.isVisible(this.hoverIdx)){
        if(this.distanceToLine(this.hoverIdx, mouseX, mouseY) <= 24) return;
    }
    var idx=this.findNearestLine(mouseX, mouseY);
    if(idx !== this.hoverIdx){
        this.hoverIdx=idx;
        this.startHoverAnim();
    }
};

LineChart.prototype.handleHover = function(mx, my){
    if(this._retired) return "";

    if(mx >= this.w){ this.clearHover(); return ""; }

    this.hover(mx, my);

    var i = this.hoverIdx;
    if(i<0 || !this.data[i]) return "";

    var arr = this.data[i].arr, bj=-1, bd=1e9;
    for (var j=0; j<arr.length; j++){
        if(this.minYear + j === 1995) continue;
        var px = j*5*this.scaleX + this.x, py = this.yPos(arr[j]);
        var d = dist(px, mx, py, my);
        if(d<bd){ bd=d; bj=j; }
    }

    var lbl = this.data[i].ctry;
    if(bj>=0){
        var v = parseInt(arr[bj], 10) || 0;
        lbl += " · " + (this.minYear+bj) + " · " +
               (v>0 ? v + (v>1 ? " entrants" : " entrant") : "no entrant recorded");
    }
    return lbl + (this.selectedIndexOf(i)>=0 ? " — click to move the marker"
                                             : " — click to list them");
};
LineChart.prototype.clearHover = function(){
    if(this.hoverIdx !== -1){
        this.hoverIdx=-1;
        this.startHoverAnim();
    }
};

LineChart.prototype.repaint = function(){ this.redrawLineChart(); };
LineChart.prototype.retire = function(){
    this._retired=true;
    this.hoverIdx=-1;
};
LineChart.prototype.startHoverAnim = function(){
    if(this._retired) return;
    if(this._hoverAnimating) return;
    this._hoverAnimating=true;
    var self=this;
    function step(){

        if(self._retired){ self._hoverAnimating=false; return; }
        var settled=self.stepHoverAnim();
        self.redrawLineChart();
        if(settled) self._hoverAnimating=false;
        else requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
};
LineChart.prototype.stepHoverAnim = function(){
    if(!this.hl)this.hl=[];
    var settled=true;
    for (var i=0; i<this.data.length; i++){
        var target=(i===this.hoverIdx) ? 1 : 0;
        var cur=this.hl[i]||0;
        var diff=target-cur;
        if(Math.abs(diff)>0.01){ this.hl[i]=cur + diff*0.2; settled=false; }
        else this.hl[i]=target;
    }
    return settled;
};
