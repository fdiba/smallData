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

   =====================================================================
   2026-08-08 (soir) — LA BARRE DIT DEUX CHOSES, ET ELLE EST CLIQUABLE
   =====================================================================

   Le diagramme etait la seule des trois vues de la page a ne RIEN dire de
   plus que sa hauteur, et la seule ou l'on ne pouvait rien selectionner.
   Deux manques, et ils tiennent ensemble.

   1. UNE BARRE SE LIT MAINTENANT EN DEUX PARTS. La hauteur totale reste le
      nombre de candidats du pays a cette edition — exactement ce que dit la
      hauteur d'un point dans le line chart et la couleur d'une cellule dans
      la matrice. Mais le pied de la barre porte, en emeraude, la part de ces
      candidats qui a une oeuvre AU FONDS.

      ⚠️ C'est l'ecart entre les deux qui est le sujet de cette base. Sur les
         2 550 personnes que l'index compte, la moitie n'a laisse qu'une
         CANDIDATURE — un nom lu sur une liste d'inscription, sans musique
         attachee. La page l'ecrit depuis toujours en tete (« 1259 / 2550 »)
         et dans la legende du line chart (« c/t »), mais le diagramme, lui,
         empilait les deux dans une seule hauteur bleue. Un pays a quarante
         candidats dont deux archives et un pays a quarante candidats tous
         archives donnaient la meme barre.

   2. ON PEUT CLIQUER UNE BARRE. Elle charge alors les compositeurs du pays
      pour cette edition, comme le clic sur un point de courbe ou sur une
      cellule de la matrice — meme barre orange, meme liste, meme panneau
      d'oeuvres. C'etait le seul endroit de la page ou l'on voyait un pays
      sans pouvoir demander qui il etait.

      ⚠️ retrieveData() N'EST PAS RECOPIEE : elle est deleguee a
         LineChart.prototype, comme le fait la matrice. Mais ici la
         delegation doit etre TARDIVE — js/barchart.js est charge AVANT
         js/linechart.js, donc `LineChart` n'existe pas encore a la lecture
         de ce fichier. D'ou un appel a l'interieur de la methode plutot
         qu'une affectation de prototype : la resolution se fait au clic,
         quand tout est charge, et l'ordre des balises <script> n'a plus a
         etre tenu par personne.

   Le graphe se REDESSINE desormais (survol, selection) : tout ce que le
   constructeur peignait est passe dans draw().
   ===================================================================== */
function BarChart(config){

	this.w = config.width  || 900;
	this.h = config.height || 500;

	this.canvas = document.getElementById(config.canvasId);
	this.data = config.data;
	this.gridLineIncrement = config.gridLineIncrement;

	// l'edition affichee : elle voyage avec le clic vers retrieveData()
	this.year = config.year;

	// L'axe doit CONTENIR la plus haute barre : on prend le multiple
	// STRICTEMENT superieur, pour que la plus haute barre ne vienne pas
	// buter contre le haut du cadre. (Avant : `- (maxValue % increment)`,
	// soit l'arrondi INFERIEUR — la France de 2009, a 96, sortait du
	// graphe par le haut, coupee net.)
	this.minValue = config.minValue;
	this.maxValue = (Math.floor(config.maxValue / this.gridLineIncrement) + 1) * this.gridLineIncrement;
	if(this.maxValue <= this.minValue) this.maxValue = this.minValue + this.gridLineIncrement;

	this.colors = ["#3498db"]; //blue - peter river
	// les deux parts d'une barre, partagees avec le reste du site (js/variables.js)
	this.cWorks    = (typeof VIZ_WORKS    !== 'undefined') ? VIZ_WORKS    : "#2ecc71";
	this.cEntrants = (typeof VIZ_ENTRANTS !== 'undefined') ? VIZ_ENTRANTS : "#3498db";
	this.hilite    = (typeof VIZ_HILITE   !== 'undefined') ? VIZ_HILITE   : "#f1c40f";

	this.valueFont = "12pt Calibri";   // graduations de l'axe vertical
	this.font = "12pt Calibri";        // etiquettes des pays, ajustee plus bas
	this.keyFont = '11px "Helvetica Neue", Helvetica, Arial, sans-serif';
	this.axisColor = "#8fa3b0";
	this.gridColor = "rgba(255, 255, 255, 0.15)";
	this.padding = 10;

	this.hoverIdx = -1;
	this.selectedIdx = -1;
	this.sl_ctry = "";
	this._retired = false;

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

	this.draw();
}

/* Tout le rendu. Il etait dans le constructeur — il en sort parce que le
   graphe se redessine maintenant a chaque survol et a chaque selection. */
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
	this.drawKey();
};

/* Symetrique de LineChart.prototype.retire et de MatrixChart.prototype.retire :
   les trois graphes partagent un canvas, la page retire le courant avant d'en
   construire un autre (retireCurrentChart(), js/animated_data.js). */
/* ⚠️ RETIRER, C'EST AUSSI CESSER DE REPONDRE — meme note que dans
   linechart.js et matrixchart.js : un graphe qui ne peint plus mais accepte
   encore les clics laisse l'ecran fige pendant que l'etat change et que des
   requetes partent. */
BarChart.prototype.retire = function(){
	this._retired = true;
	this.hoverIdx = -1;
};

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

BarChart.prototype.barSpacing = function(){
	return this.width/Math.max(1, this.data.length);
};

BarChart.prototype.drawXLabels = function(){
	var ctx = this.context;
	ctx.save();
	var data = this.data;
	var barSpacing = this.barSpacing();

	ctx.font = this.font;
	ctx.textAlign = "right";
	ctx.textBaseline = "middle";

	for(var i=0; i<data.length; i++){
		var label = data[i].label;
		ctx.save();
		ctx.translate(this.x + ((i+1/2)*barSpacing), this.y + this.height + 10);
		ctx.rotate(-1*Math.PI/4);
		// le pays choisi et le pays survole sont NOMMES en jaune : la couleur
		// de la barre code deja les deux parts, elle ne peut pas coder en plus
		// la selection sans devenir illisible.
		ctx.fillStyle = (i===this.selectedIdx || i===this.hoverIdx) ? this.hilite : "#ecf0f1";
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

/* Les barres, en deux parts empilees : au pied, les candidats qui ONT une
   oeuvre au fonds (emeraude) ; au-dessus, ceux dont la base ne connait que la
   candidature (bleu). La hauteur TOTALE reste le nombre de candidats — c'est
   elle qu'il faut pouvoir comparer d'un pays a l'autre, et c'est elle que le
   line chart et la matrice comptent aussi.

   Un filet de 1 px a la couleur du fond separe les deux parts : sans lui,
   emeraude et bleu se touchent et la frontiere se lit comme un degrade. Il
   n'est pose que si les deux parts font au moins 2 px — sinon il mangerait
   celle qu'il est cense border. */
BarChart.prototype.drawBars = function(){
	var ctx = this.context;
	ctx.save();
	var data = this.data;
	var barSpacing = this.barSpacing();
	var unitHeight = this.height/this.range;
	var base = this.y + this.height;

	for(var i=0; i<data.length; i++) {

		var total = data[i].value - this.minValue;
		if(!(total>0)) continue;

		/* ⚠️ LA PART EMERAUDE EST UNE PROPORTION DE LA BARRE, pas une valeur
		   reprojetee sur l'axe. Elle etait calculee comme `withWorks -
		   minValue`, ce qui est faux des que le plancher de l'axe n'est pas
		   zero : avec minValue=10, value=30 et withWorks=20, la barre mesure
		   20 et la part 10 — soit la moitie, alors que deux tiers des
		   candidats ont une oeuvre. L'appelant passe toujours 0 aujourd'hui,
		   donc rien ne se voyait ; c'est exactement le genre de faute qui
		   attend qu'on change un reglage ailleurs. */
		var works = Math.max(0, Math.min(data[i].value, data[i].withWorks||0));
		var hTot  = total*unitHeight;
		var hWork = (data[i].value>0) ? (works/data[i].value)*hTot : 0;

		var cx = Math.round(this.x + ((i+1/2) * barSpacing));
		var x0 = cx - this.barWidth/2;

		// part « candidature seule », du haut de la part archivee au sommet
		ctx.fillStyle = this.cEntrants;
		ctx.fillRect(x0, base-hTot, this.barWidth, hTot-hWork);

		// part « oeuvre au fonds », au pied
		if(hWork>0){
			ctx.fillStyle = this.cWorks;
			ctx.fillRect(x0, base-hWork, this.barWidth, hWork);
		}

		// le filet de separation
		if(hWork>=2 && (hTot-hWork)>=2){
			ctx.fillStyle = "#2c3e50";
			ctx.fillRect(x0, base-hWork-1, this.barWidth, 1);
		}

		// contour du pays SELECTIONNE : la barre garde ses deux couleurs, on
		// l'entoure. Un aplat jaune effacerait justement ce qu'on vient de
		// rendre lisible.
		if(i===this.selectedIdx){
			ctx.strokeStyle = this.hilite;
			ctx.lineWidth = 2;
			ctx.strokeRect(x0-1.5, base-hTot-1.5, this.barWidth+3, hTot+3);
			ctx.lineWidth = 1;
		}
	}
	ctx.restore();
};

//colonne survolee : la cible du clic est toute la colonne, pas la seule barre
//(elle peut ne faire que deux pixels de large) — autant le montrer.
BarChart.prototype.drawHoverColumn = function(){
	if(this.hoverIdx<0) return;
	var s = this.barSpacing();
	this.context.fillStyle = "rgba(241,196,15,0.10)";
	// jusqu'au BAS DU CANVAS : la cible du clic descend jusque sous les
	// etiquettes, la teinte doit dire la meme chose qu'elle
	this.context.fillRect(this.x + this.hoverIdx*s, this.y, s, this.h - this.y);
};

/* La cle des deux parts. ⚠️ ELLE EST OBLIGATOIRE, pas decorative : deux
   couleurs empilees dans une barre ne disent rien d'elles-memes, et la
   distinction qu'elles portent — candidature contre oeuvre archivee — est
   precisement ce que cette base a de moins evident. */
BarChart.prototype.drawKey = function(){
	var ctx = this.context;
	ctx.save();
	ctx.font = this.keyFont;
	ctx.textBaseline = "middle";
	ctx.textAlign = "left";

	var items = [
		{c: this.cEntrants, t: "entrant only"},
		{c: this.cWorks,    t: "with a work in the collection"}
	];

	// calee sur le bord droit du graphe, au-dessus de la premiere graduation
	var w = 0, sw = 11, gap = 6, pad = 16;
	for (var i=0;i<items.length;i++) w += sw + gap + ctx.measureText(items[i].t).width + pad;
	var x = this.x + this.width - w + pad, y = this.padding;
	if(x < this.x) x = this.x;                 // graphe etroit : on ne sort pas a gauche

	for (var k=0;k<items.length;k++){
		ctx.fillStyle = items[k].c;
		ctx.fillRect(x, y-sw/2, sw, sw);
		x += sw + gap;
		ctx.fillStyle = "#b7c4cf";
		ctx.fillText(items[k].t, x, y);
		x += ctx.measureText(items[k].t).width + pad;
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

/* ================================================== interaction ============
   Meme surface que LineChart et MatrixChart : handleClick / handleHover /
   clearHover / retire. js/animated_data.js n'a donc pas a savoir lequel des
   trois graphes il tient — il demande a l'objet s'il sait repondre.
   ========================================================================= */

/* La cible est LA COLONNE ENTIERE, etiquette comprise, et non la seule barre :
   celle-ci peut ne faire que deux pixels de large a cinquante pays, et un nom
   de pays ecrit sous une barre a tout l'air d'une cible. */
BarChart.prototype.hitBar = function(mx, my){
	if(my < this.y || my > this.h) return -1;
	if(mx < this.x || mx > this.x + this.width) return -1;
	var i = Math.floor((mx - this.x)/this.barSpacing());
	return (i>=0 && i<this.data.length) ? i : -1;
};

BarChart.prototype.handleClick = function(mx, my){
	if(this._retired) return;              // retire : il ne repond plus

	var i = this.hitBar(mx, my);
	if(i<0) return;

	// recliquer le pays choisi le relache — meme geste que dans la matrice :
	// il faut pouvoir defaire sans avoir a viser le vide.
	if(i===this.selectedIdx){
		this.selectedIdx = -1;
		this.sl_ctry = "";
		this.draw();
		// plus rien de selectionne : la liste des compositeurs et le panneau
		// de droite ne designent plus rien qui soit a l'ecran
		if(typeof clearWorkPanel === 'function') clearWorkPanel();
		return;
	}

	/* ⚠️ ON NE SELECTIONNE PAS CE QU'ON NE SAURA PAS CHARGER. Sans
	   identifiant de pays lisible, le contour jaune et l'etiquette jaune se
	   posaient quand meme et l'infobulle promettait « click to list them » —
	   puis l'appel etait avale en silence. Une selection qui a l'air d'avoir
	   pris et qui n'a rien demande est pire que pas de selection du tout. */
	var cId = parseInt(this.data[i].cId, 10);
	if(isNaN(cId)) return;

	this.selectedIdx = i;
	this.sl_ctry = this.data[i].label;
	this.draw();

	this.retrieveData(cId, this.year, this.data[i].value);
};

BarChart.prototype.handleHover = function(mx, my){
	if(this._retired) return "";
	var i = this.hitBar(mx, my);
	if(i !== this.hoverIdx){ this.hoverIdx = i; this.draw(); }
	if(i<0) return "";

	var d = this.data[i], t = d.value, c = d.withWorks||0;
	return d.label + " · " + this.year + " · " + t + (t>1?" entrants":" entrant")
	     + " · " + c + " with a work in the collection"
	     + (this.selectedIdx===i ? " — click again to clear" : " — click to list them");
};

BarChart.prototype.clearHover = function(){
	if(this.hoverIdx !== -1){ this.hoverIdx = -1; this.draw(); }
};

/* ⚠️ DELEGATION TARDIVE, ET NON EMPRUNT DE PROTOTYPE. La matrice ecrit
   `MatrixChart.prototype.retrieveData = LineChart.prototype.retrieveData` a
   la lecture de son fichier, parce qu'elle est chargee APRES linechart.js.
   Ce fichier-ci est charge AVANT : `LineChart` n'existe pas encore ici, et
   l'emprunt echouerait sans bruit — le clic sur une barre ne chargerait
   simplement rien. La resolution se fait donc au moment du clic, ce qui
   rend l'ordre des balises <script> indifferent plutot que de le confier a
   la vigilance de qui les ecrit.

   La methode n'utilise que `this.sl_ctry` et les globales de la page : les
   trois vues chargent donc les compositeurs par LE MEME code, et ne peuvent
   pas diverger si le `case 0` evolue. */
BarChart.prototype.retrieveData = function(cId, year, value){
	if(typeof LineChart !== 'function') return;
	return LineChart.prototype.retrieveData.call(this, cId, year, value);
};
