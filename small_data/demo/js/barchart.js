/* =====================================================================
   BarChart — un diagramme en barres par canvas.
   Seul appelant : generateBarChart() dans js/animated_data.js, quand une
   SEULE edition est selectionnee (bouton rouge eteint). Une barre = un pays.

   2026-08-08 — LARGEUR ET ECHELLE. Le graphe etait fige a 900 x 500 et
   la largeur des barres arrivait toute faite de l'appelant. Depuis que la
   liste cc4160 est versee, une edition compte jusqu'a une CINQUANTAINE de
   pays au lieu d'une trentaine : les etiquettes se chevauchaient et les
   barres tombaient a 1 ou 2 pixels (le map() de l'appelant devenait meme
   negatif au-dela de 50 pays).

   Ce qui a change, et rien d'autre :
     1. `width` / `height` se recoivent en config (defaut 900 x 500) —
        c'est l'appelant qui sait combien de pays il a a montrer ;
     2. `barWidth` se DEDUIT de l'espacement si l'appelant ne l'impose pas ;
     3. la police des etiquettes retrecit quand l'espacement l'exige, au
        lieu de laisser les noms se superposer ;
     4. la marge de gauche s'ouvre de ce qu'il faut pour que la premiere
        etiquette — inclinee a 45°, elle deborde vers la gauche — ne soit
        plus coupee par le bord du canvas ;
     5. le maximum de l'axe est ARRONDI AU-DESSUS du plus haut compte, et
        non plus au-dessous : la barre la plus haute (la France, en 2009)
        sortait du cadre par le haut.
   ===================================================================== */
function BarChart(config){

	this.w = config.width  || 900;
	this.h = config.height || 500;

	this.canvas = document.getElementById(config.canvasId);
	this.data = config.data;
	this.gridLineIncrement = config.gridLineIncrement;

	// L'axe doit CONTENIR la plus haute barre : on prend le multiple
	// STRICTEMENT superieur, pour que la plus haute barre ne vienne pas
	// buter contre le haut du cadre. (Avant : `- (maxValue % increment)`,
	// soit l'arrondi INFERIEUR — la France de 2009, a 96, sortait du
	// graphe par le haut, coupee net.)
	this.minValue = config.minValue;
	this.maxValue = (Math.floor(config.maxValue / this.gridLineIncrement) + 1) * this.gridLineIncrement;
	if(this.maxValue <= this.minValue) this.maxValue = this.minValue + this.gridLineIncrement;

	this.colors = ["#3498db"]; //blue - peter river
	this.valueFont = "12pt Calibri";   // graduations de l'axe vertical
	this.font = "12pt Calibri";        // etiquettes des pays, ajustee plus bas
	this.axisColor = "#8fa3b0";
	this.gridColor = "rgba(255, 255, 255, 0.15)";
	this.padding = 10;

	this.context = this.canvas.getContext("2d");
	this.range = this.maxValue - this.minValue;
	this.numGridLines = Math.max(1, Math.round(this.range/this.gridLineIncrement));
	this.longestValueWidth = this.getLongestValueWidth();

	var n = Math.max(1, this.data.length);

	// --- police des etiquettes ------------------------------------------
	// Inclinees a 45°, deux etiquettes voisines se chevauchent des que
	// l'espacement descend sous une hauteur de ligne divisee par sin(45°),
	// soit environ 1,4 fois la hauteur de police. On retrecit plutot que
	// de laisser les noms se marcher dessus.
	var room = this.w - (this.padding*2 + this.longestValueWidth);
	var spacing = room / n;
	var pt = Math.min(12, Math.max(7, Math.floor(spacing / 1.9)));
	this.font = pt + "pt Calibri";

	// --- marge de gauche -------------------------------------------------
	// L'etiquette est calee a droite puis tournee de -45° : elle part de son
	// ancre vers la GAUCHE et vers le BAS, d'une largeur/racine(2). Les
	// premieres peuvent donc sortir du canvas. On ouvre la marge de ce qui
	// manque, mesure sur les etiquettes elles-memes.
	this.x = this.padding + this.longestValueWidth;
	var over = this.leftOverhang(this.x, spacing);
	if(over > 0){
		this.x += Math.ceil(over);
		spacing = (this.w - this.x - this.padding) / n;
	}

	this.width = this.w - this.x - this.padding;
	this.height = this.h - (this.getLabelAreaHeight() + this.padding * 4);

	// --- largeur des barres ---------------------------------------------
	// Deduite de l'espacement, sauf si l'appelant l'impose explicitement.
	var bw = (typeof config.barWidth === 'number' && config.barWidth > 0)
	         ? config.barWidth
	         : Math.round((this.width/n) * 0.6);
	this.barWidth = Math.max(2, Math.min(40, bw));

	this.y = this.padding * 2;

	this.context.fillStyle = "#2c3e50";
	this.context.fillRect(0, 0, this.w, this.h);

	this.drawGridlines();

	this.drawXYAxis();

	this.drawBars(this.colors[0]);

	this.drawXLabels();
	this.drawYValues();
}

/* De combien la plus debordante des etiquettes sort-elle a gauche du
   canvas, si l'axe commence en `x0` et que les barres sont espacees de
   `spacing` ? Zero si aucune ne deborde. */
BarChart.prototype.leftOverhang = function(x0, spacing){
	this.context.font = this.font;
	var worst = 0;
	for(var i=0; i<this.data.length; i++){
		var w = this.context.measureText(this.data[i].label).width / Math.SQRT2;
		worst = Math.max(worst, w - (x0 + (i + 1/2) * spacing));
	}
	return worst;
};

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
	this.context.font = this.valueFont;
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
	ctx.fillStyle = "#ecf0f1";
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

	ctx.moveTo(this.x, this.y);
	ctx.lineTo(this.x, this.height + this.y);

	ctx.strokeStyle = this.axisColor;
	ctx.lineWidth = 1;
	ctx.stroke();
	ctx.restore();
};
