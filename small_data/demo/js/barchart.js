/* =====================================================================
   BarChart — un diagramme en barres par canvas.
   Seul appelant : generateBarChart() dans js/animated_data.js, quand une
   SEULE edition est selectionnee (bouton rouge eteint). Une barre = un pays.

   2026-08-08 (matin) — LARGEUR ET ECHELLE. Le graphe etait fige a 900 x 500
   et la largeur des barres arrivait toute faite de l'appelant. Depuis que la
   liste cc4160 est versee, une edition compte jusqu'a une CINQUANTAINE de
   pays au lieu d'une trentaine : les etiquettes se chevauchaient et les
   barres tombaient a 1 ou 2 pixels (le map() de l'appelant devenait meme
   negatif au-dela de 50 pays).

   Ce qui a change alors, et rien d'autre :
     1. `width` / `height` se recoivent en config (defaut 900 x 500) ;
     2. `barWidth` se DEDUIT de l'espacement si l'appelant ne l'impose pas ;
     3. la police des etiquettes retrecit quand l'espacement l'exige ;
     4. la marge de gauche s'ouvre de ce qu'il faut pour que la premiere
        etiquette — inclinee a 45°, elle deborde vers la gauche — ne soit
        plus coupee par le bord du canvas ;
     5. le maximum de l'axe est ARRONDI AU-DESSUS du plus haut compte.

   =====================================================================
   2026-08-08 (soir) — LA BARRE DIT DEUX CHOSES, ET ELLE EST CLIQUABLE
   =====================================================================

   1. UNE BARRE SE LIT EN DEUX PARTS. La hauteur totale reste le nombre de
      candidats du pays a cette edition — exactement ce que dit la hauteur
      d'un point dans le line chart et la couleur d'une cellule dans la
      matrice. Le pied de la barre porte, en emeraude, la part de ces
      candidats qui a une oeuvre AU FONDS.

      ⚠️ C'est l'ecart entre les deux qui est le sujet de cette base. Sur les
         2 550 personnes que l'index compte, la moitie n'a laisse qu'une
         CANDIDATURE. Le diagramme empilait les deux dans une seule hauteur
         bleue : un pays a quarante candidats dont deux archives et un pays a
         quarante candidats tous archives donnaient la meme barre.

   2. ON PEUT CLIQUER UNE BARRE. Elle charge les compositeurs du pays pour
      cette edition, comme le clic sur un point de courbe ou sur une cellule.

   =====================================================================
   2026-08-08 (troisieme lot) — MISE AU NIVEAU DES DEUX AUTRES VUES
   =====================================================================

   Le diagramme etait la vue la plus en retrait des trois : pas de tri, pas
   d'isolement de pays, pas de « reset all », et une selection UNIQUE marquee
   en JAUNE — alors que le jaune designe le SURVOL partout ailleurs sur le
   site, et que les deux autres vues acceptent plusieurs selections, chacune
   dans une couleur de la palette de clic. Trois grammaires pour un meme
   geste, sur une meme page.

   Il recoit donc, dans la forme exacte de la matrice :

     - un TRI commutable (« value » par defaut, « A–Z ») ;
     - l'ISOLEMENT de pays au clic sur leur nom, avec les MEMES couleurs que
       le line chart et la matrice (le rang de palette suit le pays d'une vue
       a l'autre — voir vizTakeSlot dans js/variables.js) ;
     - « reset all », meme libelle et meme jaune ;
     - la SELECTION MULTIPLE, chaque pays choisi cercle dans sa couleur de
       clic, le jaune rendu au seul survol ;
     - le LISERE DE PROVENANCE de l'edition, ecrit en toutes lettres : une
       edition unique n'a qu'une autorite documentaire, autant la nommer.

   ⚠️ L'ORDRE D'AFFICHAGE VIT DANS `this.order`, PAS DANS `this.data`. Trier
      le tableau lui-meme invaliderait tout ce qui l'indexe — `solo_btns`,
      `soloSlot`, `selected`. C'est la solution deja retenue par la matrice,
      et c'est la seule qui permette de changer de tri sans rien reconstruire.
   ===================================================================== */
function BarChart(config){

	this.w = config.width  || 900;
	this.h = config.height || 500;

	this.canvas = document.getElementById(config.canvasId);
	this.data = config.data;
	this.gridLineIncrement = config.gridLineIncrement;

	// l'edition affichee : elle voyage avec le clic vers retrieveData()
	this.year = config.year;

	// L'axe doit CONTENIR la plus haute barre : multiple STRICTEMENT
	// superieur, pour que la plus haute barre ne bute pas contre le cadre.
	this.minValue = config.minValue;
	this.maxValue = (Math.floor(config.maxValue / this.gridLineIncrement) + 1) * this.gridLineIncrement;
	if(this.maxValue <= this.minValue) this.maxValue = this.minValue + this.gridLineIncrement;

	this.colors = ["#3498db"]; //blue - peter river
	// les deux parts d'une barre, partagees avec le reste du site (js/variables.js)
	this.cWorks    = (typeof VIZ_WORKS    !== 'undefined') ? VIZ_WORKS    : "#2ecc71";
	this.cEntrants = (typeof VIZ_ENTRANTS !== 'undefined') ? VIZ_ENTRANTS : "#3498db";
	this.hilite    = (typeof VIZ_HILITE   !== 'undefined') ? VIZ_HILITE   : "#f1c40f";
	this.cat       = (typeof VIZ_CAT      !== 'undefined') ? VIZ_CAT      : ["#1abc9c","#9b59b6","#2ecc71"];
	this.click     = (typeof VIZ_CLICK    !== 'undefined') ? VIZ_CLICK    : this.cat;

	this.valueFont = "12pt Calibri";   // graduations de l'axe vertical
	this.font = "12pt Calibri";        // etiquettes des pays, ajustee plus bas
	this.keyFont = '11px "Helvetica Neue", Helvetica, Arial, sans-serif';
	this.smallFont = '10px "Helvetica Neue", Helvetica, Arial, sans-serif';
	this.boldFont = '600 11px "Helvetica Neue", Helvetica, Arial, sans-serif';
	this.axisColor = "#8fa3b0";
	this.inkMuted = "#8fa3b0";
	this.ink = "#ecf0f1";
	this.gridColor = "rgba(255, 255, 255, 0.15)";
	this.padding = 10;

	this.hoverIdx = -1;
	this.selected = [];                 // index de pays, dans l'ordre des clics
	this.solo_btns = [];
	this.soloSlot = {};
	this.numSolos = 0;
	this.sl_ctry = "";
	this.ctrlRects = {};
	this._retired = false;

	this.sortMode = config.sortMode || 'value';   // value | az
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

/* --------------------------------------------------------------------- tri
   Deux ordres, deux questions : quelle est la forme de l'edition (value), et
   ou est tel pays (A–Z). Pas de « first entry » ici — il n'y a qu'une annee,
   la question ne se pose pas. */
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

	/* Deux lignes d'en-tete au-dessus du trace : la premiere porte « reset
	   all », le tri et la cle des deux parts ; la seconde, la provenance de
	   l'edition et le nom de la mesure. Meme disposition que la matrice —
	   commandes a gauche, cle a droite. */
	this.hdr1 = this.padding + 3;
	this.hdr2 = this.hdr1 + 16;
	this.y = this.hdr2 + 15;

	// --- police des etiquettes ------------------------------------------
	// Inclinees a 45°, deux etiquettes voisines se chevauchent des que
	// l'espacement descend sous ~1,4 fois la hauteur de police.
	var room = this.w - (this.padding*2 + this.longestValueWidth);
	var spacing = room / n;
	var pt = Math.min(12, Math.max(7, Math.floor(spacing / 1.9)));
	this.font = pt + "pt Calibri";

	// --- marge de gauche -------------------------------------------------
	// L'etiquette est calee a droite puis tournee de -45° : elle part de son
	// ancre vers la GAUCHE et vers le BAS, d'une largeur/racine(2).
	this.x = this.padding + this.longestValueWidth;
	var over = this.leftOverhang(this.x, spacing);
	if(over > 0){
		this.x += Math.ceil(over);
		spacing = (this.w - this.x - this.padding) / n;
	}

	this.width = this.w - this.x - this.padding;
	this.height = Math.max(60, this.h - this.y - this.getLabelAreaHeight() - this.padding*2);

	// --- largeur des barres ---------------------------------------------
	var bw = Math.round((this.width/n) * 0.6);
	this.barWidth = Math.max(2, Math.min(40, bw));
};

/* Tout le rendu. Il etait dans le constructeur — il en sort parce que le
   graphe se redessine a chaque survol, selection, isolement et changement de
   tri. `repaint` est le nom commun aux trois vues (cf. js/animated_data.js). */
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

/* ⚠️ RETIRER, C'EST AUSSI CESSER DE REPONDRE — meme note que dans
   linechart.js et matrixchart.js : un graphe qui ne peint plus mais accepte
   encore les clics laisse l'ecran fige pendant que l'etat change et que des
   requetes partent. */
BarChart.prototype.retire = function(){
	this._retired = true;
	this.hoverIdx = -1;
};

/* De combien la plus debordante des etiquettes sort-elle a gauche du canvas ? */
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
/* Opacite d'un pays : pleine s'il est isole, s'il est SELECTIONNE, ou si
   aucun pays n'est isole.

   ⚠️ LA SELECTION COMPTE AUTANT QUE L'ISOLEMENT. Sans elle, une barre qu'on
      venait de choisir au clic restait attenuee parce qu'un AUTRE pays etait
      isole — le geste le plus explicite de la page produisait une barre
      effacee, et son disque de selection avec elle. Deux facons de designer
      un pays ne peuvent pas se contredire. */
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

/* ------------------------------------------------- commandes (1re ligne) */
BarChart.prototype.drawControls = function(){
	var ctx=this.context, y=this.hdr1;
	this.ctrlRects={};

	ctx.save();
	ctx.textAlign="left";
	ctx.textBaseline="middle";

	// « reset all » : meme libelle et meme jaune que dans les deux autres vues
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

/* La cle des deux parts. ⚠️ ELLE EST OBLIGATOIRE, pas decorative : deux
   couleurs empilees dans une barre ne disent rien d'elles-memes, et la
   distinction qu'elles portent — candidature contre oeuvre archivee — est
   precisement ce que cette base a de moins evident.

   L'entree « entrant only » DISPARAIT quand aucune barre n'en porte : c'est
   le cas des que le commutateur de compte est sur « only those with a work ».
   Une entree de legende qui ne designe rien a l'ecran se lit comme une
   categorie vide, c'est-a-dire comme une information fausse. */
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

/* ------------------------------------ provenance + mesure (2e ligne)
   ⚠️ UNE EDITION UNIQUE N'A QU'UNE AUTORITE DOCUMENTAIRE : autant l'ecrire
   en toutes lettres plutot que de laisser le lecteur la chercher dans le
   liseré de la bande de navigation, qui est a un autre pas horizontal. Meme
   source que partout ailleurs — pvState(), qui lit la base (case 12), jamais
   un tableau recopie a la main. */
BarChart.prototype.drawProvenance = function(){
	var ctx = this.context;
	ctx.save();
	ctx.textBaseline = "middle";
	ctx.textAlign = "left";

	var y = this.hdr2;
	ctx.font = this.smallFont;
	ctx.fillStyle = this.inkMuted;

	// le nom de la mesure, a droite : la meme phrase que dans les deux autres
	// vues, et il ne depend pas de la provenance
	ctx.textAlign = "right";
	ctx.fillText("entrants per country", this.x + this.width, y);

	// cf. l'en-tete de pvKnown() dans js/animated_data.js
	if(typeof pvKnown === 'function' && pvKnown()){
		ctx.textAlign = "left";
		ctx.fillStyle = pvColor(this.year);
		ctx.fillRect(this.padding, y-4, 22, 3);
		ctx.fillStyle = this.inkMuted;
		ctx.fillText(this.year + " — " + pvLabel(this.year), this.padding + 28, y);
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

/* Les barres, en deux parts empilees : au pied, les candidats qui ONT une
   oeuvre au fonds (emeraude) ; au-dessus, ceux dont la base ne connait que la
   candidature (bleu). La hauteur TOTALE reste le nombre de candidats.

   Un filet de 1 px a la couleur du fond separe les deux parts : sans lui,
   emeraude et bleu se touchent et la frontiere se lit comme un degrade. Il
   n'est pose que si les deux parts font au moins 2 px.

   ⚠️ L'ECHELLE RESTE LINEAIRE, ET C'EST VOULU. Les deux autres vues sont en
      racine carree ; une barre, elle, se lit par sa LONGUEUR, donc elle doit
      etre proportionnelle. Une barre en √ ment sur les rapports — c'est un
      anti-patron reconnu. La divergence est ecrite dans la legende plutot que
      supprimee. */
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

		/* Le chip d'isolement, sous l'axe : meme role que le carre du menu du
		   line chart et que celui de la gouttiere de la matrice — dire QUELLE
		   couleur de palette ce pays porte. On ne peut pas la mettre dans la
		   barre : elle y ecraserait les deux parts, qui sont l'information. */
		if(solo){
			ctx.fillStyle = solo;
			ctx.fillRect(x0, base+3, this.barWidth, 3);
		}

		if(total>0){
			var works = Math.max(0, Math.min(this.data[i].value, this.data[i].withWorks||0));
			var hTot  = total*unitHeight;
			/* La part emeraude est une PROPORTION de la barre, pas une valeur
			   reprojetee sur l'axe : `withWorks - minValue` serait faux des
			   que le plancher de l'axe n'est pas zero. */
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

			/* Contour du pays SELECTIONNE, dans SA couleur de clic — comme la
			   ligne cliquee du line chart et la cellule cerclee de la matrice.
			   ⚠️ Ce contour etait JAUNE, et le jaune designe le survol partout
			      ailleurs sur le site : une barre selectionnee avait donc
			      l'air d'etre survolee, et deux gestes differents portaient la
			      meme couleur. Le double trait — fond puis couleur — tient sur
			      les deux parts de la barre, quelle que soit celle qu'il longe. */
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

				/* ⚠️ ET UN DISQUE AU SOMMET, CERCLE DE CLAIR — le meme repere
				   que le point colorie d'une ligne selectionnee dans le line
				   chart, et que l'anneau d'une cellule dans la matrice.

				   Il n'est pas decoratif : le contour SEUL ne suffit pas ici.
				   La premiere couleur de la palette de clic est `#1abc9c`, et
				   le pied de la barre est `#2ecc71` — ecart OKLab 8,4 en
				   vision normale (plancher 15), mesure. Un liseré turquoise
				   de deux pixels longeant une part emeraude ne se voit pas.
				   Reordonner la palette ne reglerait rien : elle porte
				   plusieurs verts, et n'importe lequel tomberait un jour a
				   cote de ce pied-la. Un disque cercle de clair, lui, se
				   detache de n'importe quelle couleur — c'est exactement la
				   raison pour laquelle le line chart en pose un. */
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

//colonne survolee : la cible du clic est toute la colonne, pas la seule barre
//(elle peut ne faire que deux pixels de large) — autant le montrer.
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

/* ================================================== interaction ============
   Meme surface que LineChart et MatrixChart : handleClick / handleHover /
   clearHover / retire / repaint. js/animated_data.js n'a donc pas a savoir
   lequel des trois graphes il tient.
   ========================================================================= */

/* DEUX ZONES, comme dans la matrice : la GRILLE selectionne, la LEGENDE
   isole. Ici la legende est la bande des etiquettes, sous l'axe. Sans cette
   separation, un meme clic devrait deviner lequel des deux gestes on veut. */
BarChart.prototype.zoneOf = function(mx, my){
	if(mx < this.x || mx > this.x + this.width) return null;
	var p = Math.floor((mx - this.x)/this.barSpacing());
	if(p<0 || p>=this.order.length) return null;
	var i = this.order[p];
	if(my >= this.y && my <= this.y + this.height)  return {i:i, zone:'bar'};
	if(my >  this.y + this.height && my <= this.h)  return {i:i, zone:'label'};
	return null;
};
BarChart.prototype.hitBar = function(mx, my){
	var z = this.zoneOf(mx, my);
	return z ? z.i : -1;
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

	// recliquer une barre choisie la relache — meme geste que dans la matrice
	var k = this.selectedIndexOf(i);
	if(k>=0){
		this.selected.splice(k,1);
		if(!this.selected.length) this.sl_ctry = "";
		this.draw();
		if(!this.selected.length && typeof clearWorkPanel === 'function') clearWorkPanel();
		return;
	}

	/* ⚠️ ON NE SELECTIONNE PAS CE QU'ON NE SAURA PAS CHARGER. Sans identifiant
	   de pays lisible, le contour se posait quand meme et l'infobulle
	   promettait « click to list them » — puis l'appel etait avale en silence. */
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
	// le rang de palette se prend a l'isolement et se rend au relachement
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
		     + " — click to isolate";
	}
	return d.label + " · " + this.year + " · " + t + (t>1?" entrants":" entrant")
	     + " · " + c + " with a work in the collection"
	     + (this.selectedIndexOf(i)>=0 ? " — click again to clear" : " — click to list them");
};

BarChart.prototype.clearHover = function(){
	if(this.hoverIdx !== -1){ this.hoverIdx = -1; this.draw(); }
};

function _barInRect(mx,my,r){ return r && mx>=r.x && mx<=r.x+r.w && my>=r.y && my<=r.y+r.h; }

/* ⚠️ DELEGATION TARDIVE, ET NON EMPRUNT DE PROTOTYPE. La matrice ecrit
   `MatrixChart.prototype.retrieveData = LineChart.prototype.retrieveData` a
   la lecture de son fichier, parce qu'elle est chargee APRES linechart.js.
   Ce fichier-ci est charge AVANT : `LineChart` n'existe pas encore ici, et
   l'emprunt echouerait sans bruit — le clic sur une barre ne chargerait
   simplement rien. La resolution se fait donc au moment du clic, ce qui rend
   l'ordre des balises <script> indifferent plutot que de le confier a la
   vigilance de qui les ecrit.

   La methode n'utilise que `this.sl_ctry` et les globales de la page : les
   trois vues chargent donc les compositeurs par LE MEME code, et ne peuvent
   pas diverger si le `case 0` evolue. */
BarChart.prototype.retrieveData = function(cId, year, value){
	if(typeof LineChart !== 'function') return;
	return LineChart.prototype.retrieveData.call(this, cId, year, value);
};
