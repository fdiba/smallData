function MatrixChart(config){

    this.canvas  = document.getElementById(config.canvasId);
    this.context = this.canvas.getContext("2d");

    this.minYear = config.minYear;
    this.maxYear = config.maxYear;
    this.data    = config.data || [];
    this.nCols   = this.maxYear - this.minYear + 1;

    this.seq   = (typeof VIZ_SEQ   !== 'undefined') ? VIZ_SEQ   : ["#1a7d70","#22a692","#2bbfa8","#5ad4bf","#93e5d5","#ccf4ec"];
    this.cat   = (typeof VIZ_CAT   !== 'undefined') ? VIZ_CAT   : ["#1abc9c","#9b59b6","#2ecc71","#d35400","#16a085","#e74c3c","#3498db","#e67e22"];
    this.catMax= (typeof VIZ_CAT_MAX !== 'undefined') ? VIZ_CAT_MAX : 8;
    this.click = (typeof VIZ_CLICK !== 'undefined') ? VIZ_CLICK : this.cat;
    this.hilite= (typeof VIZ_HILITE!== 'undefined') ? VIZ_HILITE: "#f1c40f";
    this.surface=(typeof VIZ_SURFACE!=='undefined') ? VIZ_SURFACE:"#2c3e50";

    this.ink      = "#ecf0f1";
    this.inkMuted = "#8fa3b0";
    this.band     = "#3f5872";

    this.font     = '11px "Helvetica Neue", Helvetica, Arial, sans-serif';
    this.fontBold = '600 11px "Helvetica Neue", Helvetica, Arial, sans-serif';
    this.fontSmall= '10px "Helvetica Neue", Helvetica, Arial, sans-serif';

    this.sortMode = config.sortMode || 'total';

    this.onSort   = config.onSort || null;

    this.solo_btns = [];

    this.soloSlot  = {};
    this.numSolos  = 0;
    this.selectedCells = [];
    this.hoverRow = -1;
    this.hoverCol = -1;
    this.sl_ctry  = "";

    this.ctrlRects = {};

    for (var i=0; i<this.data.length; i++) this.solo_btns.push({state:false});

    this.computeStats();
    this.computeBins();
    this.applySort();
    this.layout();
    this.draw();
}

MatrixChart.prototype.computeStats = function(){

    this.maxCell = 0;
    this.totals  = [];
    this.maxTotal= 0;
    this.rowTotal= [];
    this.rowFirst= [];
    this.maxRowTotal = 0;
    this.grandTotal  = 0;

    for (var j=0; j<this.nCols; j++) this.totals[j]=0;

    for (var i=0; i<this.data.length; i++){
        var arr = this.data[i].arr, t=0, first=-1;
        for (var k=0; k<this.nCols; k++){
            var v = arr[k] || 0;
            if(v>this.maxCell) this.maxCell = v;
            this.totals[k] += v;
            t += v;
            if(v>0 && first<0) first = k;
        }
        this.rowTotal[i] = t;
        this.rowFirst[i] = (first<0) ? this.nCols : first;
        if(t>this.maxRowTotal) this.maxRowTotal = t;
        this.grandTotal += t;
    }
    for (var m=0; m<this.nCols; m++) if(this.totals[m]>this.maxTotal) this.maxTotal=this.totals[m];
    if(this.maxCell<1)  this.maxCell = 1;
    if(this.maxTotal<1) this.maxTotal = 1;
};

MatrixChart.prototype.applySort = function(){
    var self=this;
    var idx=[];
    for (var i=0;i<this.data.length;i++) idx.push(i);

    if(this.sortMode==='az'){
        idx.sort(function(a,b){ return String(self.data[a].ctry).localeCompare(String(self.data[b].ctry)); });
    } else if(this.sortMode==='first'){
        idx.sort(function(a,b){
            if(self.rowFirst[a]!==self.rowFirst[b]) return self.rowFirst[a]-self.rowFirst[b];
            if(self.rowTotal[a]!==self.rowTotal[b]) return self.rowTotal[b]-self.rowTotal[a];
            return String(self.data[a].ctry).localeCompare(String(self.data[b].ctry));
        });
    } else {
        idx.sort(function(a,b){
            if(self.rowTotal[a]!==self.rowTotal[b]) return self.rowTotal[b]-self.rowTotal[a];
            return String(self.data[a].ctry).localeCompare(String(self.data[b].ctry));
        });
    }
    this.order = idx;
};

MatrixChart.prototype.layout = function(){

    var W = this.canvas.width;

    this.padL = 12; this.padR = 16; this.padT = 10;
    this.ctrlH   = 26;
    this.bandH   = 88;
    this.gapBand = 12;
    this.stripH  = 4;
    this.hdrH    = 15;
    this.gutter  = 206;
    this.totalsW = 128;

    this.matX = this.padL + this.gutter;

    var avail = W - this.matX - this.totalsW - this.padR - 10;
    this.colW = Math.min(avail/this.nCols, 56);
    this.matW = this.colW * this.nCols;

    this.totalsX = this.matX + this.matW + 10;

    this.bandY = this.padT + this.ctrlH;
    this.stripY= this.bandY + this.bandH + this.gapBand;
    this.rowsY = this.stripY + this.stripH + this.hdrH + 3;

    var n = this.visibleCount();
    if(n<1) n=1;

    this.rowH = Math.max(7, Math.min(18, Math.floor(920/n)));

    this.matH = n * this.rowH;
    this.footH= 26;

    this.canvas.height = Math.ceil(this.rowsY + this.matH + this.footH + this.padT);

    this.w = this.matX + this.matW;
};

MatrixChart.prototype.visibleCount = function(){ return this.data.length; };

MatrixChart.prototype.isVisible = function(i){ return true; };

MatrixChart.prototype.rowAlpha = function(i){
    if(this.numSolos<=0) return 1;
    if(this.solo_btns[i] && this.solo_btns[i].state) return 1;
    if(this.selectedIndexOf(i) >= 0) return 1;
    return 0.30;
};

MatrixChart.prototype.visibleOrder = function(){ return this.order.slice(); };

MatrixChart.prototype.soloRank = function(i){
    var slot = this.soloSlot[i];
    return (slot === undefined) ? 0 : slot;
};

MatrixChart.prototype.soloColor = function(i){
    if(this.numSolos<=0 || !this.solo_btns[i] || !this.solo_btns[i].state) return null;
    return this.cat[this.soloRank(i) % this.cat.length];
};

MatrixChart.prototype.selectedIndexOf = function(ctryId){
    for (var k=0;k<this.selectedCells.length;k++){ if(this.selectedCells[k].ctryId===ctryId) return k; }
    return -1;
};

MatrixChart.prototype.BIN_BREAKS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

MatrixChart.prototype.computeBins = function(){
    var br=[];
    for (var i=0;i<this.BIN_BREAKS.length;i++){
        if(this.BIN_BREAKS[i] <= this.maxCell) br.push(this.BIN_BREAKS[i]);
    }
    if(br.length<1) br=[1];
    if(br.length > this.seq.length) br = br.slice(0, this.seq.length);
    this.bins = br;

    this.binOpen = (this.maxCell > br[br.length-1]);

    this.binColors=[];
    var n=this.seq.length-1, m=br.length-1;
    for (var k=0;k<br.length;k++){
        var p = (m>0) ? (k/m)*n : n;
        var f = Math.floor(p);
        this.binColors.push( (f>=n) ? this.seq[n] : lerpHexColor(this.seq[f], this.seq[f+1], p-f) );
    }
};

MatrixChart.prototype.cellColor = function(v){
    if(!(v>0)) return null;
    var k=0;
    for (var i=0;i<this.bins.length;i++) if(v>=this.bins[i]) k=i;
    return this.binColors[k];
};

MatrixChart.prototype.colX = function(j){ return this.matX + j*this.colW; };
MatrixChart.prototype.rowY = function(pos){ return this.rowsY + pos*this.rowH; };

MatrixChart.prototype.isSkipped = function(j){ return (this.minYear + j) === 1995; };

MatrixChart.prototype.isFullSpan = function(){
    return this.minYear<=1973 && this.maxYear>=2009;
};
MatrixChart.prototype.spanLabel = function(){
    return this.isFullSpan() ? "total" : "this period";
};

MatrixChart.prototype.repaint = function(){ this.draw(); };
MatrixChart.prototype.retire = function(){
    this._retired=true;
    this.hoverRow=-1; this.hoverCol=-1;
};
MatrixChart.prototype.draw = function(){
    if(this._retired) return;
    var ctx=this.context;
    ctx.fillStyle=this.surface;
    ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.textBaseline="middle";

    this.drawControls();
    this.drawFlowBand();
    this.drawProvenanceStrip();
    this.drawYearLabels(this.stripY + this.stripH + 9);
    this.drawColumnHeads(this.stripY + this.stripH + 9);
    this.drawRows();
    this.drawYearLabels(this.rowsY + this.matH + 13);
    this.drawSelection();
    this.drawCrosshair();
};

MatrixChart.prototype.drawControls = function(){
    var ctx=this.context, y=this.padT+11;
    this.ctrlRects={};

    ctx.textAlign="left";
    ctx.font=this.fontBold;

    ctx.fillStyle=this.hilite;
    ctx.fillText("reset all", this.padL, y);
    this.ctrlRects.reset={x:this.padL-4, y:y-9, w:ctx.measureText("reset all").width+8, h:18};

    var x=this.padL+72;
    ctx.font=this.fontSmall;
    ctx.fillStyle=this.inkMuted;
    ctx.fillText("rows:", x, y); x+=34;

    var opts=[{k:'total',l:'total'},{k:'first',l:'first entry'},{k:'az',l:'A–Z'}];
    this.ctrlRects.sort=[];
    for (var i=0;i<opts.length;i++){
        var on = this.sortMode===opts[i].k;
        ctx.font = on ? this.fontBold : this.fontSmall;
        ctx.fillStyle = on ? this.ink : this.inkMuted;
        var w = ctx.measureText(opts[i].l).width;
        ctx.fillText(opts[i].l, x, y);
        if(on){
            ctx.fillRect(x, y+8, w, 1);
        }
        this.ctrlRects.sort.push({k:opts[i].k, x:x-4, y:y-9, w:w+8, h:18});
        x += w + 14;
    }

    this.drawColorKey(y);
};

MatrixChart.prototype.drawColorKey = function(y){
    var ctx=this.context;
    var n=this.bins.length, sw=24, h=10;
    var kw=n*sw;

    var x0=Math.min(this.canvas.width - this.padR, this.totalsX + this.totalsW) - kw;

    ctx.font=this.fontSmall;
    ctx.textAlign="right";
    ctx.fillStyle=this.inkMuted;
    ctx.fillText("entrants per country · edition", x0-10, y-3);

    for (var i=0;i<n;i++){
        ctx.fillStyle=this.binColors[i];
        ctx.fillRect(x0+i*sw, y-h/2-5, sw-2, h);
    }

    ctx.fillStyle=this.inkMuted;
    ctx.textAlign="center";
    for (var k=0;k<n;k++){
        var lab = String(this.bins[k]) + ((this.binOpen && k===n-1) ? "+" : "");
        ctx.fillText(lab, x0+k*sw+(sw-2)/2, y+11);
    }
    ctx.textAlign="left";
};

MatrixChart.prototype.drawFlowBand = function(){
    var ctx=this.context;
    var y0=this.bandY, h=this.bandH, base=y0+h;
    var self=this;

    function yOf(v){ return base - (v/self.maxTotal)*h; }

    function cx(j){
        if(j===0) return self.matX;
        if(j===self.nCols-1) return self.matX + self.matW;
        return self.colX(j) + self.colW/2;
    }

    ctx.strokeStyle="rgba(255,255,255,0.10)";
    ctx.lineWidth=1;
    var gr=[0.25,0.5,0.75,1];
    for (var g=0; g<gr.length; g++){
        var gy=Math.round(yOf(this.maxTotal*gr[g]))+0.5;
        ctx.beginPath(); ctx.moveTo(this.matX, gy); ctx.lineTo(this.matX+this.matW, gy); ctx.stroke();
    }

    var cols=[];
    for (var j=0;j<this.nCols;j++) if(!this.isSkipped(j)) cols.push(j);
    if(!cols.length) return;

    var stack=[];
    if(this.numSolos>0){
        var vis=this.visibleOrder();
        for (var s=0; s<vis.length; s++){
            var iv=vis[s];

            if(this.solo_btns[iv] && this.solo_btns[iv].state && this.soloRank(iv) < this.catMax){
                stack.push({i:iv, color:this.soloColor(iv)});
            }
        }
    }

    ctx.fillStyle=this.band;
    ctx.beginPath();
    ctx.moveTo(cx(cols[0]), base);
    for (var a=0;a<cols.length;a++) ctx.lineTo(cx(cols[a]), yOf(this.totals[cols[a]]));
    ctx.lineTo(cx(cols[cols.length-1]), base);
    ctx.closePath();
    ctx.fill();

    var cum=[];
    for (var z=0;z<this.nCols;z++) cum[z]=0;

    for (var t=0;t<stack.length;t++){
        var arr=this.data[stack[t].i].arr;
        ctx.fillStyle=stack[t].color;
        ctx.beginPath();

        for (var b=0;b<cols.length;b++){
            var jj=cols[b], top=cum[jj]+(arr[jj]||0);
            if(b===0) ctx.moveTo(cx(jj), yOf(top)); else ctx.lineTo(cx(jj), yOf(top));
        }

        for (var d=cols.length-1; d>=0; d--){
            var kk=cols[d];
            ctx.lineTo(cx(kk), yOf(cum[kk]));
        }
        ctx.closePath();
        ctx.fill();
        for (var e=0;e<cols.length;e++){ var mm=cols[e]; cum[mm]+= (arr[mm]||0); }
    }

    ctx.strokeStyle=this.ink;
    ctx.lineWidth=2;
    ctx.beginPath();
    for (var f=0;f<cols.length;f++){
        var jf=cols[f];
        if(f===0) ctx.moveTo(cx(jf), yOf(this.totals[jf])); else ctx.lineTo(cx(jf), yOf(this.totals[jf]));
    }
    ctx.stroke();
    ctx.lineWidth=1;

    ctx.font=this.fontSmall;
    ctx.textAlign="right";
    ctx.fillStyle=this.inkMuted;

    ctx.fillText(String(this.maxTotal), this.matX-6, Math.max(yOf(this.maxTotal)+4, y0+6));
    ctx.fillText("0", this.matX-6, base-1);

    ctx.textAlign="left";
    ctx.font=this.fontBold;
    ctx.fillStyle=this.ink;
    ctx.fillText("entrants per edition", this.padL, y0+8);
    ctx.font=this.fontSmall;
    ctx.fillStyle=this.inkMuted;
    var note = (stack.length)
        ? (stack.length + " isolated countries stacked" + (this.numSolos>stack.length ? " (of "+this.numSolos+")" : ""))
        : "isolate countries below to stack their share";
    this.wrapText(note, this.padL, y0+24, this.gutter-10, 12);

    ctx.textAlign="left";
    ctx.font=this.fontSmall;
    var cum2=[];
    for (var q=0;q<this.nCols;q++) cum2[q]=0;
    var last=cols[cols.length-1], lastY=null;
    for (var t2=0;t2<stack.length;t2++){
        var arr2=this.data[stack[t2].i].arr;
        var thick=Math.abs(yOf(cum2[last]) - yOf(cum2[last]+(arr2[last]||0)));
        var midY=(yOf(cum2[last]) + yOf(cum2[last]+(arr2[last]||0)))/2;

        if(thick>=9 && (lastY===null || Math.abs(midY-lastY)>=12)){
            ctx.fillStyle=this.ink;
            ctx.fillText(this.data[stack[t2].i].ctry, this.matX+this.matW+6, midY);
            lastY=midY;
        }
        for (var r=0;r<this.nCols;r++) cum2[r]+= (arr2[r]||0);
    }
};

MatrixChart.prototype.drawProvenanceStrip = function(){
    var ctx=this.context;
    if(typeof pvKnown === 'function' && !pvKnown()) return;
    for (var j=0;j<this.nCols;j++){
        if(this.isSkipped(j)) continue;
        var year=this.minYear+j;

        ctx.fillStyle = (typeof pvColor==='function') ? pvColor(year) : '#7f8c8d';
        ctx.fillRect(this.colX(j)+1, this.stripY, Math.max(1,this.colW-2), this.stripH);
    }
    ctx.font=this.fontSmall;
    ctx.textAlign="right";
    ctx.fillStyle=this.inkMuted;
    ctx.fillText("on what authority", this.matX-6, this.stripY+this.stripH/2);
};

MatrixChart.prototype.drawColumnHeads = function(y){
    var ctx=this.context;
    ctx.font=this.fontSmall;
    ctx.fillStyle=this.inkMuted;

    ctx.textAlign="right";

    ctx.fillText("with works / entrants · all editions", this.matX-8, y);
    ctx.fillText(this.spanLabel(), this.totalsX+this.totalsW-20, y);
};

MatrixChart.prototype.drawYearLabels = function(y){
    var ctx=this.context;
    ctx.font=this.fontSmall;
    ctx.textAlign="center";
    for (var j=0;j<this.nCols;j++){
        var year=this.minYear+j;
        var skip=this.isSkipped(j);
        ctx.fillStyle = skip ? "#5d6d7e" : (this.hoverCol===j ? this.hilite : this.inkMuted);
        ctx.fillText("'"+String(year).substring(2,4), this.colX(j)+this.colW/2, y);
    }
};

MatrixChart.prototype.drawRows = function(){
    var ctx=this.context;
    var vis=this.visibleOrder();
    var gapX = (this.colW>14) ? 1.5 : 0.5;
    var gapY = (this.rowH>9)  ? 1.5 : 0.5;
    var labelEvery = (this.rowH>=11) ? 1 : 2;

    for (var p=0;p<vis.length;p++){
        var i=vis[p], y=this.rowY(p);
        var arr=this.data[i].arr;
        var solo=this.soloColor(i);
        var hovered=(this.hoverRow===i);
        var alpha=this.rowAlpha(i);

        ctx.globalAlpha = hovered ? 1 : alpha;

        if(hovered){
            ctx.fillStyle="rgba(241,196,15,0.10)";
            ctx.fillRect(this.padL-4, y, this.totalsX+this.totalsW-this.padL+4, this.rowH);
        }

        var sq=Math.min(10, this.rowH-2);
        if(sq>=4){
            ctx.strokeStyle="rgba(236,240,241,0.5)";
            ctx.strokeRect(this.padL+0.5, y+(this.rowH-sq)/2+0.5, sq, sq);
            ctx.fillStyle = solo ? solo : (this.solo_btns[i].state ? this.inkMuted : "rgba(236,240,241,0.12)");
            ctx.fillRect(this.padL+1, y+(this.rowH-sq)/2+1, sq-1, sq-1);
        }

        if(p % labelEvery === 0 || hovered || solo){
            ctx.font = (solo||hovered) ? this.fontBold : this.font;
            ctx.fillStyle = (solo||hovered) ? this.ink : "#b7c4cf";
            ctx.textAlign="left";
            var nameX=this.padL+16, nameMax=this.gutter-16-52;
            ctx.fillText(this.fit(this.data[i].ctry, nameMax), nameX, y+this.rowH/2);

            var cid=this.data[i].cId;
            var counts = (typeof numCpByCountry!=='undefined' && numCpByCountry[cid])
                       ? numCpByCountry[cid].c+"/"+numCpByCountry[cid].t : "";
            if(counts){
                ctx.font=this.fontSmall;
                ctx.fillStyle=this.inkMuted;
                ctx.textAlign="right";
                ctx.fillText(counts, this.matX-8, y+this.rowH/2);
            }
        }

        for (var j=0;j<this.nCols;j++){
            if(this.isSkipped(j)) continue;
            var v=arr[j]||0;
            var c=this.cellColor(v);
            if(!c) continue;
            ctx.fillStyle=c;
            ctx.fillRect(this.colX(j)+gapX, y+gapY, Math.max(1,this.colW-2*gapX), Math.max(1,this.rowH-2*gapY));
        }

        var tx=this.totalsX, tw=this.totalsW-16;
        var frac=Math.sqrt(this.rowTotal[i]/(this.maxRowTotal||1));
        ctx.fillStyle = solo ? solo : "rgba(43,191,168,0.45)";
        ctx.fillRect(tx, y+gapY, Math.max(1, frac*(tw-34)), Math.max(1,this.rowH-2*gapY));
        if(p % labelEvery === 0 || hovered || solo){
            ctx.font=this.fontSmall;
            ctx.fillStyle=(solo||hovered)?this.ink:this.inkMuted;
            ctx.textAlign="right";
            ctx.fillText(String(this.rowTotal[i]), this.totalsX+this.totalsW-20, y+this.rowH/2);
        }

        ctx.globalAlpha = 1;
    }

    for (var s=0;s<this.nCols;s++){
        if(!this.isSkipped(s)) continue;
        ctx.save();
        ctx.strokeStyle="rgba(255,255,255,0.14)";
        ctx.beginPath();
        var xm=this.colX(s)+this.colW/2;
        ctx.moveTo(xm, this.rowsY); ctx.lineTo(xm, this.rowsY+this.matH);
        ctx.stroke();
        ctx.translate(xm, this.rowsY+this.matH/2);
        ctx.rotate(-Math.PI/2);
        ctx.font=this.fontSmall;
        ctx.fillStyle="#7f8c8d";
        ctx.textAlign="center";
        ctx.fillText("no competition in 1995", 0, 3);
        ctx.restore();
    }
};

MatrixChart.prototype.drawSelection = function(){
    var ctx=this.context;
    var vis=this.visibleOrder();
    for (var s=0;s<this.selectedCells.length;s++){
        var sel=this.selectedCells[s];
        var pos=vis.indexOf(sel.ctryId);
        if(pos<0) continue;
        var x=this.colX(sel.yearId), y=this.rowY(pos);
        ctx.strokeStyle=this.surface;
        ctx.lineWidth=3;
        ctx.strokeRect(x+0.5, y+0.5, this.colW-1, this.rowH-1);
        ctx.strokeStyle=this.click[s % this.click.length];
        ctx.lineWidth=2;
        ctx.strokeRect(x+0.5, y+0.5, this.colW-1, this.rowH-1);
        ctx.lineWidth=1;
    }
};

MatrixChart.prototype.drawCrosshair = function(){
    if(this.hoverCol<0 || this.isSkipped(this.hoverCol)) return;
    var ctx=this.context;
    var x=this.colX(this.hoverCol);
    ctx.fillStyle="rgba(241,196,15,0.13)";
    ctx.fillRect(x, this.bandY, this.colW, this.bandH);
    ctx.fillRect(x, this.rowsY, this.colW, this.matH);
};

MatrixChart.prototype.fit = function(txt, maxW){
    var ctx=this.context;
    txt=String(txt);
    if(ctx.measureText(txt).width<=maxW) return txt;
    while(txt.length>1 && ctx.measureText(txt+"…").width>maxW) txt=txt.slice(0,-1);
    return txt+"…";
};
MatrixChart.prototype.wrapText = function(txt, x, y, maxW, lh){
    var ctx=this.context, words=String(txt).split(" "), line="", n=0;
    for (var i=0;i<words.length;i++){
        var test=line?line+" "+words[i]:words[i];
        if(ctx.measureText(test).width>maxW && line){
            ctx.fillText(line, x, y+n*lh); line=words[i]; n++;
        } else line=test;
    }
    if(line) ctx.fillText(line, x, y+n*lh);
};

MatrixChart.prototype.hitCell = function(mx,my){
    if(mx<this.matX || mx>this.matX+this.matW) return null;
    if(my<this.rowsY || my>this.rowsY+this.matH) return null;
    var j=Math.floor((mx-this.matX)/this.colW);
    var p=Math.floor((my-this.rowsY)/this.rowH);
    var vis=this.visibleOrder();
    if(j<0||j>=this.nCols||p<0||p>=vis.length) return null;
    return {i:vis[p], j:j, pos:p};
};
MatrixChart.prototype.hitRowGutter = function(mx,my){
    if(mx>=this.matX && mx<=this.matX+this.matW) return -1;
    if(mx<this.padL-4 || mx>this.totalsX+this.totalsW) return -1;
    if(my<this.rowsY || my>this.rowsY+this.matH) return -1;
    var p=Math.floor((my-this.rowsY)/this.rowH);
    var vis=this.visibleOrder();
    return (p>=0 && p<vis.length) ? vis[p] : -1;
};
function _inRect(mx,my,r){ return r && mx>=r.x && mx<=r.x+r.w && my>=r.y && my<=r.y+r.h; }

MatrixChart.prototype.handleClick = function(mx,my){

    if(this._retired) return;

    if(_inRect(mx,my,this.ctrlRects.reset)){ this.resetCountries(); return; }

    var so=this.ctrlRects.sort||[];
    for (var s=0;s<so.length;s++){
        if(_inRect(mx,my,so[s])){
            if(this.sortMode!==so[s].k){
                this.sortMode=so[s].k;
                this.applySort(); this.layout(); this.draw();
                if(this.onSort) this.onSort(this.sortMode);
            }
            return;
        }
    }

    var g=this.hitRowGutter(mx,my);
    if(g>=0){ this.toggleSolo(g); return; }

    var c=this.hitCell(mx,my);
    if(c && !this.isSkipped(c.j)){
        var year  = this.minYear + c.j;
        var value = parseInt(this.data[c.i].arr[c.j], 10) || 0;
        var cId   = parseInt(this.data[c.i].cId, 10);
        this.sl_ctry = this.data[c.i].ctry;

        var k=this.selectedIndexOf(c.i);

        if(k>=0 && this.selectedCells[k].yearId===c.j){
            this.selectedCells.splice(k,1);
            this.draw();

            if(!this.selectedCells.length && typeof clearWorkPanel === 'function') clearWorkPanel();
            return;
        }

        if(k>=0) this.selectedCells[k].yearId=c.j;
        else     this.selectedCells.push({ctryId:c.i, yearId:c.j});

        this.draw();

        this.retrieveData(cId, year, value);
        return;
    }

    return;
};

MatrixChart.prototype.toggleSolo = function(i){
    if(this._retired) return;
    this.solo_btns[i].state=!this.solo_btns[i].state;
    this.numSolos += this.solo_btns[i].state ? 1 : -1;
    if(this.numSolos<0) this.numSolos=0;

    if(this.solo_btns[i].state){
        this.soloSlot[i] = (typeof vizTakeSlot==='function') ? vizTakeSlot(this.soloSlot) : i;
    } else {
        delete this.soloSlot[i];
    }
    this.draw();
};

MatrixChart.prototype.resetCountries = function(){
    for (var i=0;i<this.solo_btns.length;i++) this.solo_btns[i].state=false;
    this.soloSlot={};
    this.numSolos=0;
    this.selectedCells=[];
    this.hoverRow=-1; this.hoverCol=-1;
    this.draw();
};

MatrixChart.prototype.handleHover = function(mx,my){

    if(this._retired) return "";

    var row=-1, col=-1, label="";

    var c=this.hitCell(mx,my);
    if(c){
        row=c.i; col=c.j;
        var year=this.minYear+c.j;
        if(this.isSkipped(c.j)) label = "1995 · no competition was held";
        else {
            var v=this.data[c.i].arr[c.j]||0;
            label = this.data[c.i].ctry + " · " + year + " · " +
                    (v>0 ? (v + (v>1?" entrants":" entrant")) : "no entrant recorded") +
                    (this.selectedIndexOf(c.i)>=0 && this.selectedCells[this.selectedIndexOf(c.i)].yearId===c.j
                        ? " · click again to clear" : " · click to list them");
        }
    } else {
        var g=this.hitRowGutter(mx,my);
        if(g>=0){
            row=g;
            var cid=this.data[g].cId;
            var cc=(typeof numCpByCountry!=='undefined' && numCpByCountry[cid]) ? numCpByCountry[cid] : null;

            var etendue = this.isFullSpan() ? "" : " in " + this.minYear + "–" + this.maxYear;
            label = this.data[g].ctry + " · " + this.rowTotal[g] + " entrants" + etendue
                  + (cc ? " · " + cc.c + " of " + cc.t + " with archived works, all editions" : "")
                  + " · click to isolate";
        } else if(my>=this.bandY && my<=this.bandY+this.bandH && mx>=this.matX && mx<=this.matX+this.matW){
            col=Math.floor((mx-this.matX)/this.colW);
            if(col>=0 && col<this.nCols){
                var yy=this.minYear+col;
                label = this.isSkipped(col) ? "1995 · no competition was held"
                                            : (yy + " · " + this.totals[col] + " entrants in all");
            }
        }
    }

    if(row!==this.hoverRow || col!==this.hoverCol){
        this.hoverRow=row; this.hoverCol=col;
        this.draw();
    }
    return label;
};

MatrixChart.prototype.clearHover = function(){
    if(this.hoverRow!==-1 || this.hoverCol!==-1){
        this.hoverRow=-1; this.hoverCol=-1;
        this.draw();
    }
};

if(typeof LineChart === 'function'){
    MatrixChart.prototype.retrieveData = LineChart.prototype.retrieveData;
}
