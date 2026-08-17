function BarChart(config){

	this.w = config.width  || 900;
	this.h = config.height || 500;

	this.canvas = document.getElementById(config.canvasId);
	this.data = config.data;
	this.gridLineIncrement = config.gridLineIncrement;

	this.year = config.year;

	this.minValue = config.minValue;
	this.maxValue = (Math.floor(config.maxValue / this.gridLineIncrement) + 1) * this.gridLineIncrement;
	if(this.maxValue <= this.minValue) this.maxValue = this.minValue + this.gridLineIncrement;

	this.colors = ["#3498db"];

	this.cWorks    = (typeof VIZ_WORKS    !== 'undefined') ? VIZ_WORKS    : "#2ecc71";
	this.cEntrants = (typeof VIZ_ENTRANTS !== 'undefined') ? VIZ_ENTRANTS : "#3498db";
	this.hilite    = (typeof VIZ_HILITE   !== 'undefined') ? VIZ_HILITE   : "#f1c40f";
	this.cat       = (typeof VIZ_CAT      !== 'undefined') ? VIZ_CAT      : ["#1abc9c","#9b59b6","#2ecc71"];
	this.click     = (typeof VIZ_CLICK    !== 'undefined') ? VIZ_CLICK    : this.cat;

	this.valueFont = "12pt Calibri";
	this.font = "12pt Calibri";
	this.keyFont = '11px "Helvetica Neue", Helvetica, Arial, sans-serif';
	this.smallFont = '10px "Helvetica Neue", Helvetica, Arial, sans-serif';
	this.boldFont = '600 11px "Helvetica Neue", Helvetica, Arial, sans-serif';
	this.axisColor = "#8fa3b0";
	this.inkMuted = "#8fa3b0";
	this.ink = "#ecf0f1";
	this.gridColor = "rgba(255, 255, 255, 0.15)";
	this.padding = 10;

	this.hoverIdx = -1;
	this.selected = [];
	this.solo_btns = [];
	this.soloSlot = {};
	this.numSolos = 0;
	this.sl_ctry = "";
	this.ctrlRects = {};
	this._retired = false;

	this.sortMode = config.sortMode || 'value';
	this.onSort   = config.onSort || null;

	for (var s0=0; s0<this.data.length; s0++) this.solo_btns.push({state:false});

	this.context = this.canvas.getContext("2d");
	this.range = this.maxValue - this.minValue;
	this.numGridLines = Math.max(1, Math.round(this.range/this.gridLineIncrement));
	this.longestValueWidth = this.getLongestValueWidth();

	this.applySort();
	this.layout();
	this.draw();
}

BarChart.prototype.applySort = function(){
	var self=this, idx=[];
	for (var i=0;i<this.data.length;i++) idx.push(i);
	if(this.sortMode==='az'){
		idx.sort(function(a,b){ return String(self.data[a].label).localeCompare(String(self.data[b].label)); });
	} else {
		idx.sort(function(a,b){
			if(self.data[a].value!==self.data[b].value) return self.data[b].value-self.data[a].value;
			return String(self.data[a].label).localeCompare(String(self.data[b].label));
		});
	}
	this.order = idx;
};

BarChart.prototype.layout = function(){

	var n = Math.max(1, this.data.length);

	this.hdr1 = this.padding + 3;
	this.hdr2 = this.hdr1 + 16;
	this.y = this.hdr2 + 15;

	var room = this.w - (this.padding*2 + this.longestValueWidth);
	var spacing = room / n;
	var pt = Math.min(12, Math.max(7, Math.floor(spacing / 1.9)));
	this.font = pt + "pt Calibri";

	this.x = this.padding + this.longestValueWidth;
	var over = this.leftOverhang(this.x, spacing);
	if(over > 0){
		this.x += Math.ceil(over);
		spacing = (this.w - this.x - this.padding) / n;
	}

	this.width = this.w - this.x - this.padding;
	this.height = Math.max(60, this.h - this.y - this.getLabelAreaHeight() - this.padding*2);

	var bw = Math.round((this.width/n) * 0.6);
	this.barWidth = Math.max(2, Math.min(40, bw));
};

BarChart.prototype.draw = function(){
	if(this._retired) return;

	this.context.fillStyle = "#2c3e50";
	this.context.fillRect(0, 0, this.w, this.h);

	this.drawHoverColumn();
	this.drawGridlines();
	this.drawXYAxis();
	this.drawBars();
	this.drawXLabels();
	this.drawYValues();
	this.drawControls();
	this.drawKey();
	this.drawProvenance();
};
BarChart.prototype.repaint = function(){ this.draw(); };

BarChart.prototype.retire = function(){
	this._retired = true;
	this.hoverIdx = -1;
};

BarChart.prototype.leftOverhang = function(x0, spacing){
	this.context.font = this.font;
	var worst = 0, ord = this.order || [];
	for(var p=0; p<ord.length; p++){
		var w = this.context.measureText(this.data[ord[p]].label).width / Math.SQRT2;
		worst = Math.max(worst, w - (x0 + (p + 1/2) * spacing));
	}
	return worst;
};

BarChart.prototype.getLabelAreaHeight = function(){
	this.context.font = this.font;
	var maxLabelWidth = 0;
	for (var i=0; i<this.data.length; i++){
		maxLabelWidth = Math.max(maxLabelWidth, this.context.measureText(this.data[i].label).width);
	}
	return Math.round(maxLabelWidth / Math.sqrt(2));
};

BarChart.prototype.getLongestValueWidth = function(){
	this.context.font = this.valueFont;
	var longestValueWidth = 0;
	for(var i=0; i<=this.numGridLines; i++){
		var value = this.maxValue - (i*this.gridLineIncrement);
		longestValueWidth = Math.max(longestValueWidth, this.context.measureText(value).width);
	}
	return longestValueWidth;
};

BarChart.prototype.barSpacing = function(){
	return this.width/Math.max(1, this.data.length);
};

BarChart.prototype.rowAlpha = function(i){
	if(this.numSolos<=0) return 1;
	if(this.solo_btns[i] && this.solo_btns[i].state) return 1;
	if(this.selectedIndexOf(i) >= 0) return 1;
	return 0.30;
};
BarChart.prototype.soloColor = function(i){
	if(this.numSolos<=0 || !this.solo_btns[i] || !this.solo_btns[i].state) return null;
	var slot = this.soloSlot[i];
	if(slot === undefined) slot = 0;
	return this.cat[slot % this.cat.length];
};
BarChart.prototype.selectedIndexOf = function(i){
	for (var k=0;k<this.selected.length;k++){ if(this.selected[k]===i) return k; }
	return -1;
};

BarChart.prototype.drawControls = function(){
	var ctx=this.context, y=this.hdr1;
	this.ctrlRects={};

	ctx.save();
	ctx.textAlign="left";
	ctx.textBaseline="middle";

	ctx.font=this.boldFont;
	ctx.fillStyle=this.hilite;
	ctx.fillText("reset all", this.padding, y);
	this.ctrlRects.reset={x:this.padding-4, y:y-9, w:ctx.measureText("reset all").width+8, h:18};

	var x=this.padding+72;
	ctx.font=this.smallFont;
	ctx.fillStyle=this.inkMuted;
	ctx.fillText("bars:", x, y); x+=32;

	var opts=[{k:'value',l:'value'},{k:'az',l:'A–Z'}];
	this.ctrlRects.sort=[];
	for (var i=0;i<opts.length;i++){
		var on = this.sortMode===opts[i].k;
		ctx.font = on ? this.boldFont : this.smallFont;
		ctx.fillStyle = on ? this.ink : this.inkMuted;
		var w = ctx.measureText(opts[i].l).width;
		ctx.fillText(opts[i].l, x, y);
		if(on) ctx.fillRect(x, y+8, w, 1);
		this.ctrlRects.sort.push({k:opts[i].k, x:x-4, y:y-9, w:w+8, h:18});
		x += w + 14;
	}
	ctx.restore();
};

BarChart.prototype.drawKey = function(){
	var ctx = this.context;
	ctx.save();
	ctx.font = this.keyFont;
	ctx.textBaseline = "middle";
	ctx.textAlign = "left";

	var reste = false;
	for (var i=0;i<this.data.length;i++){
		if(this.data[i].value > (this.data[i].withWorks||0)){ reste = true; break; }
	}

	var items = [];
	if(reste) items.push({c: this.cEntrants, t: "entrant only"});
	items.push({c: this.cWorks, t: "with a work in the collection"});

	var w = 0, sw = 11, gap = 6, pad = 16;
	for (var k=0;k<items.length;k++) w += sw + gap + ctx.measureText(items[k].t).width + pad;
	var x = this.x + this.width - w + pad, y = this.hdr1;
	if(x < this.x + 180) x = this.x + 180;

	for (var j=0;j<items.length;j++){
		ctx.fillStyle = items[j].c;
		ctx.fillRect(x, y-sw/2, sw, sw);
		x += sw + gap;
		ctx.fillStyle = "#b7c4cf";
		ctx.fillText(items[j].t, x, y);
		x += ctx.measureText(items[j].t).width + pad;
	}
	ctx.restore();
};

BarChart.prototype.drawProvenance = function(){
	var ctx = this.context;
	ctx.save();
	ctx.textBaseline = "middle";
	ctx.textAlign = "left";

	var y = this.hdr2;
	ctx.font = this.smallFont;
	ctx.fillStyle = this.inkMuted;

	ctx.textAlign = "right";
	ctx.fillText("entrants per country", this.x + this.width, y);

	if(typeof pvKnown === 'function' && pvKnown()){
		ctx.textAlign = "left";
		ctx.fillStyle = pvColor(this.year);
		ctx.fillRect(this.padding, y-4, 22, 3);
		ctx.fillStyle = this.inkMuted;
		ctx.fillText(this.year + " · " + pvLabel(this.year), this.padding + 28, y);
	}
	ctx.restore();
};

BarChart.prototype.drawXLabels = function(){
	var ctx = this.context;
	ctx.save();
	var ord = this.order;
	var barSpacing = this.barSpacing();

	ctx.font = this.font;
	ctx.textAlign = "right";
	ctx.textBaseline = "middle";

	for(var p=0; p<ord.length; p++){
		var i = ord[p], solo = this.soloColor(i);
		ctx.save();
		ctx.translate(this.x + ((p+1/2)*barSpacing), this.y + this.height + 10);
		ctx.rotate(-1*Math.PI/4);
		ctx.globalAlpha = (i===this.hoverIdx) ? 1 : this.rowAlpha(i);
		ctx.fillStyle = (i===this.hoverIdx) ? this.hilite : (solo ? solo : "#ecf0f1");
		ctx.fillText(this.data[i].label, 0, 0);
		ctx.restore();
	}
	ctx.restore();
};

BarChart.prototype.drawYValues = function(){
	var ctx = this.context;
	ctx.save();
	ctx.font = this.valueFont;
	ctx.fillStyle = "#ecf0f1";
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
	var ord = this.order;
	var barSpacing = this.barSpacing();
	var unitHeight = this.height/this.range;
	var base = this.y + this.height;

	for(var p=0; p<ord.length; p++) {

		var i = ord[p];
		var total = this.data[i].value - this.minValue;
		var cx = Math.round(this.x + ((p+1/2) * barSpacing));
		var x0 = cx - this.barWidth/2;
		var solo = this.soloColor(i);

		ctx.globalAlpha = (i===this.hoverIdx) ? 1 : this.rowAlpha(i);

		if(solo){
			ctx.fillStyle = solo;
			ctx.fillRect(x0, base+3, this.barWidth, 3);
		}

		if(total>0){
			var works = Math.max(0, Math.min(this.data[i].value, this.data[i].withWorks||0));
			var hTot  = total*unitHeight;

			var hWork = (this.data[i].value>0) ? (works/this.data[i].value)*hTot : 0;

			ctx.fillStyle = this.cEntrants;
			ctx.fillRect(x0, base-hTot, this.barWidth, hTot-hWork);

			if(hWork>0){
				ctx.fillStyle = this.cWorks;
				ctx.fillRect(x0, base-hWork, this.barWidth, hWork);
			}
			if(hWork>=2 && (hTot-hWork)>=2){
				ctx.fillStyle = "#2c3e50";
				ctx.fillRect(x0, base-hWork-1, this.barWidth, 1);
			}

			var k = this.selectedIndexOf(i);
			if(k>=0){
				var cSel = this.click[k % this.click.length];

				ctx.strokeStyle = "#2c3e50";
				ctx.lineWidth = 3;
				ctx.strokeRect(x0-1.5, base-hTot-1.5, this.barWidth+3, hTot+3);
				ctx.strokeStyle = cSel;
				ctx.lineWidth = 2;
				ctx.strokeRect(x0-1.5, base-hTot-1.5, this.barWidth+3, hTot+3);
				ctx.lineWidth = 1;

				var cy = base - hTot;
				ctx.beginPath();
				ctx.arc(cx, cy, 4, 0, 2*Math.PI);
				ctx.fillStyle = cSel;
				ctx.strokeStyle = "#ecf0f1";
				ctx.lineWidth = 2;
				ctx.fill();
				ctx.stroke();
				ctx.closePath();
				ctx.lineWidth = 1;
			}
		}
	}
	ctx.globalAlpha = 1;
	ctx.restore();
};

BarChart.prototype.drawHoverColumn = function(){
	if(this.hoverIdx<0) return;
	var p = this.order.indexOf(this.hoverIdx);
	if(p<0) return;
	var s = this.barSpacing();
	this.context.fillStyle = "rgba(241,196,15,0.10)";
	this.context.fillRect(this.x + p*s, this.y, s, this.h - this.y);
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
	ctx.moveTo(this.x, this.y);
	ctx.lineTo(this.x, this.height + this.y);
	ctx.strokeStyle = this.axisColor;
	ctx.lineWidth = 1;
	ctx.stroke();
	ctx.restore();
};

BarChart.prototype.zoneOf = function(mx, my){
	if(mx < this.x || mx > this.x + this.width) return null;
	var p = Math.floor((mx - this.x)/this.barSpacing());
	if(p<0 || p>=this.order.length) return null;
	var i = this.order[p];
	if(my >= this.y && my <= this.y + this.height)  return {i:i, zone:'bar'};
	if(my >  this.y + this.height && my <= this.h)  return {i:i, zone:'label'};
	return null;
};
BarChart.prototype.handleClick = function(mx, my){
	if(this._retired) return;

	if(_barInRect(mx,my,this.ctrlRects.reset)){ this.resetCountries(); return; }

	var so=this.ctrlRects.sort||[];
	for (var s=0;s<so.length;s++){
		if(_barInRect(mx,my,so[s])){
			if(this.sortMode!==so[s].k){
				this.sortMode=so[s].k;
				this.applySort(); this.layout(); this.draw();
				if(this.onSort) this.onSort(this.sortMode);
			}
			return;
		}
	}

	var z = this.zoneOf(mx, my);
	if(!z) return;

	if(z.zone==='label'){ this.toggleSolo(z.i); return; }

	var i = z.i;

	var k = this.selectedIndexOf(i);
	if(k>=0){
		this.selected.splice(k,1);
		if(!this.selected.length) this.sl_ctry = "";
		this.draw();
		if(!this.selected.length && typeof clearWorkPanel === 'function') clearWorkPanel();
		return;
	}

	var cId = parseInt(this.data[i].cId, 10);
	if(isNaN(cId)) return;

	this.selected.push(i);
	this.sl_ctry = this.data[i].label;
	this.draw();

	this.retrieveData(cId, this.year, this.data[i].value);
};

BarChart.prototype.toggleSolo = function(i){
	this.solo_btns[i].state = !this.solo_btns[i].state;
	this.numSolos += this.solo_btns[i].state ? 1 : -1;
	if(this.numSolos<0) this.numSolos=0;

	if(this.solo_btns[i].state){
		this.soloSlot[i] = (typeof vizTakeSlot==='function') ? vizTakeSlot(this.soloSlot) : i;
	} else {
		delete this.soloSlot[i];
	}
	this.draw();
};

BarChart.prototype.resetCountries = function(){
	for (var i=0;i<this.solo_btns.length;i++) this.solo_btns[i].state=false;
	this.soloSlot={};
	this.numSolos=0;
	this.selected=[];
	this.sl_ctry="";
	this.hoverIdx=-1;
	this.draw();
	if(typeof clearWorkPanel === 'function') clearWorkPanel();
};

BarChart.prototype.handleHover = function(mx, my){
	if(this._retired) return "";
	var z = this.zoneOf(mx, my);
	var i = z ? z.i : -1;
	if(i !== this.hoverIdx){ this.hoverIdx = i; this.draw(); }
	if(i<0) return "";

	var d = this.data[i], t = d.value, c = d.withWorks||0;

	if(z.zone==='label'){
		return d.label + " · " + t + (t>1?" entrants":" entrant") + " in " + this.year
		     + " · click to isolate";
	}
	return d.label + " · " + this.year + " · " + t + (t>1?" entrants":" entrant")
	     + " · " + c + " with a work in the collection"
	     + (this.selectedIndexOf(i)>=0 ? " · click again to clear" : " · click to list them");
};

BarChart.prototype.clearHover = function(){
	if(this.hoverIdx !== -1){ this.hoverIdx = -1; this.draw(); }
};

function _barInRect(mx,my,r){ return r && mx>=r.x && mx<=r.x+r.w && my>=r.y && my<=r.y+r.h; }

BarChart.prototype.retrieveData = function(cId, year, value){
	if(typeof LineChart !== 'function') return;
	return LineChart.prototype.retrieveData.call(this, cId, year, value);
};
