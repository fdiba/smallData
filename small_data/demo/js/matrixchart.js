/* =========================================================================
   MATRICE PAYS x EDITIONS + BANDEAU DE FLUX CUMULE — 2026-08-08

   POURQUOI CETTE VUE EXISTE
   -------------------------
   Le line chart de cette page tracait une courbe par pays. Il en tracait
   trente, puis cinquante, puis — depuis le versement de la liste cc4160 —
   une soixantaine sur trente-sept editions. Passe une vingtaine de courbes,
   un graphe de lignes ne montre plus des trajectoires : il montre une
   texture. Ce qu'on croit lire dedans, on l'y met.

   La matrice ne recouvre rien. Soixante lignes sur trente-sept colonnes font
   deux mille deux cents cellules, et chacune est visible. Ce n'est pas une
   amelioration cosmetique : c'est la difference entre une figure ou toute
   valeur est lisible et une figure ou aucune ne l'est.

   L'ECHELLE RACINE CARREE N'EST PAS PERDUE, ELLE DEMENAGE
   ------------------------------------------------------
   Le line chart tenait les petits pays lisibles a cote des gros en dilatant
   le bas de son axe Y (LineChart.prototype.yPos). La matrice n'a pas d'axe Y
   de valeurs — l'axe Y porte les pays. Le meme √ passe donc de la POSITION a
   la COULEUR : la clarte d'une cellule est √(valeur / valeur maximale). Un
   pays a un participant garde un echelon visible a cote d'un pays a cent.
   C'est la meme decision, appliquee au meme endroit du probleme.

   POURQUOI LE BANDEAU EN HAUT, ET POURQUOI IL EST PARTIEL
   ------------------------------------------------------
   Ce que le line chart ne disait pas non plus, c'est le TOTAL par edition :
   l'oeil ne somme pas soixante courbes. Le bandeau le dit — c'est la forme
   du concours, montee jusqu'en 1994, creux de 1992 ouvert au seul degre
   Residence, edition tronquee de 2004, reprise apres 1996.

   Un vrai diagramme de flux cumule empilerait tous les pays dans ce bandeau.
   IL NE LE FAIT PAS, ET C'EST DELIBERE : soixante bandes demanderaient
   soixante couleurs distinguables, qui n'existent pas, et seule la bande du
   bas aurait une ligne de base plate — les autres heriteraient du bruit de
   celles d'en dessous. Le bandeau empile donc les SEULS pays que le lecteur
   a isoles (huit au plus, VIZ_CAT_MAX), le reste formant la masse grise
   « autres pays ». L'empilement se construit a la demande, sur les pays dont
   on veut la part. C'est un flux cumule qu'on choisit, plutot qu'un flux
   cumule qu'on subit.

   CE QUI EST REPRIS TEL QUEL DU LINE CHART
   ---------------------------------------
   - retrieveData() : PAS DE COPIE. La methode est empruntee a LineChart en
     bas de ce fichier. Une cellule est un couple (pays, edition), soit
     exactement le triplet (cId, year, value) que l'ancien clic sur un point
     envoyait deja. Le chargement des compositeurs ne peut donc pas diverger
     entre les deux vues : il n'y en a qu'un.
   - le saut de 1995 (pas de concours cette annee-la) ;
   - l'isolement par pays, le « reset all », le masquage des noms, la barre
     orange — tout ce qui vit hors du canvas est inchange.

   CE QUE LA MATRICE MONTRE ET QU'AUCUNE COURBE NE MONTRAIT
   -------------------------------------------------------
   L'ABSENCE. Une courbe a zero se confond avec l'axe et avec ses voisines ;
   une cellule vide est un trou dans une grille, et un trou se voit. On lit
   donc directement la date d'entree de chaque pays dans le concours, les
   pays d'une seule edition, le trou de 1995, la coupe de 2004 — c'est-a-dire
   l'histoire documentaire du fonds, et non seulement ses effectifs.

   Le liseré de provenance (constat d'huissier / depouillement / liste) est
   REPRIS AU-DESSUS DES COLONNES, aligne sur elles : dans le line chart il ne
   vivait que sur la bande de navigation, a un autre pas horizontal, donc on
   ne pouvait pas le rapporter a un point precis du graphe. Ici, la colonne et
   son autorite documentaire sont dans le meme axe.
   ========================================================================= */

function MatrixChart(config){

    this.canvas  = document.getElementById(config.canvasId);
    this.context = this.canvas.getContext("2d");

    this.minYear = config.minYear;
    this.maxYear = config.maxYear;
    this.data    = config.data || [];          // [{ctry, cId, arr}]
    this.nCols   = this.maxYear - this.minYear + 1;

    // palettes partagees avec le line chart (js/variables.js) : un pays isole
    // garde sa couleur quand on commute de vue.
    this.seq   = (typeof VIZ_SEQ   !== 'undefined') ? VIZ_SEQ   : ["#1a7d70","#22a692","#2bbfa8","#5ad4bf","#93e5d5","#ccf4ec"];
    this.cat   = (typeof VIZ_CAT   !== 'undefined') ? VIZ_CAT   : ["#1abc9c","#9b59b6","#2ecc71","#d35400","#16a085","#e74c3c","#3498db","#e67e22"];
    this.catMax= (typeof VIZ_CAT_MAX !== 'undefined') ? VIZ_CAT_MAX : 8;
    this.click = (typeof VIZ_CLICK !== 'undefined') ? VIZ_CLICK : this.cat;
    this.hilite= (typeof VIZ_HILITE!== 'undefined') ? VIZ_HILITE: "#f1c40f";
    this.surface=(typeof VIZ_SURFACE!=='undefined') ? VIZ_SURFACE:"#2c3e50";

    this.ink      = "#ecf0f1";     // texte principal
    this.inkMuted = "#8fa3b0";     // axes, graduations, texte secondaire
    this.band     = "#3f5872";     // masse « autres pays » du bandeau

    this.font     = '11px "Helvetica Neue", Helvetica, Arial, sans-serif';
    this.fontBold = '600 11px "Helvetica Neue", Helvetica, Arial, sans-serif';
    this.fontSmall= '10px "Helvetica Neue", Helvetica, Arial, sans-serif';

    this.sortMode = config.sortMode || 'total';   // total | first | az
    /* Le tri choisi doit SURVIVRE a la reconstruction du graphe (changer de
       periode en reconstruit un neuf). La matrice ne connait pas la page :
       elle previent, la page retient. */
    this.onSort   = config.onSort || null;

    this.solo_btns = [];                 // un par pays, {state}
    /* index du pays -> rang de palette qu'il GARDE tant qu'il est isole
       (vizTakeSlot, js/variables.js). Voir soloColor(). */
    this.soloSlot  = {};
    this.numSolos  = 0;
    this.selectedCells = [];             // [{ctryId, yearId}] — ordre = ordre des clics
    this.hoverRow = -1;
    this.hoverCol = -1;
    this.sl_ctry  = "";

    this.ctrlRects = {};                 // zones cliquables du bandeau de controle

    for (var i=0; i<this.data.length; i++) this.solo_btns.push({state:false});

    this.computeStats();
    this.computeBins();
    this.applySort();
    this.layout();
    this.draw();
}

/* ---------------------------------------------------------------- statistiques
   Calculees UNE FOIS, sur l'ensemble des donnees et non sur les seuls pays
   visibles : isoler des pays ne doit pas repeindre ceux qui restent. Une
   cellule qui change de couleur parce qu'un AUTRE pays a ete masque ferait
   mentir la rampe — la couleur cesserait de dire une quantite pour dire une
   quantite relative a une selection. */
MatrixChart.prototype.computeStats = function(){

    this.maxCell = 0;
    this.totals  = [];                 // total par edition, tous pays
    this.maxTotal= 0;
    this.rowTotal= [];                 // total par pays sur la periode
    this.rowFirst= [];                 // index de la premiere edition non vide
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

/* --------------------------------------------------------------------- tri
   Trois ordres, trois questions posees aux memes donnees :
     total — quelle est la forme du fonds ? (la longue traine se lit comme
             une traine, et non comme du bruit disperse dans l'alphabet)
     first — quand chaque pays est-il entre ? (l'internationalisation du
             concours apparait comme une diagonale)
     az    — ou est tel pays ? (l'ordre de l'ancienne legende, conserve)
   L'ordre par defaut est `total` : c'est le seul qui montre quelque chose a
   qui ne cherche rien de precis. */
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

/* --------------------------------------------------------------- geometrie
   La hauteur du canvas est CALCULEE, pas fixee : elle depend du nombre de
   pays a montrer, qui depend de la periode choisie. Une hauteur fixe
   obligerait soit a ecraser les lignes quand ils sont nombreux, soit a
   laisser du vide quand ils sont rares. La page defile, c'est son metier. */
MatrixChart.prototype.layout = function(){

    var W = this.canvas.width;

    this.padL = 12; this.padR = 16; this.padT = 10;
    this.ctrlH   = 26;               // bandeau de controle (reset, tri, cle)
    this.bandH   = 88;               // bandeau des totaux (flux cumule)
    this.gapBand = 12;
    this.stripH  = 4;                // liseré de provenance
    this.hdrH    = 15;               // etiquettes d'annees, en haut
    this.gutter  = 206;              // carre d'isolement + nom du pays + c/t
    this.totalsW = 128;              // colonne des totaux, a droite

    this.matX = this.padL + this.gutter;

    /* LARGEUR DE COLONNE PLAFONNEE — sinon une periode courte etale sept
       colonnes sur mille trois cents pixels, et les cellules cessent d'etre
       des cellules : ce sont des barres, qu'on lit comme des barres, alors
       qu'elles ne codent leur valeur que par la couleur. La grille reste une
       grille, et la place inutilisee reste vide plutot que d'etre remplie
       par de la geometrie qui ment. */
    // -10 : l'ecart entre la matrice et la colonne des totaux (this.totalsX
    // ci-dessous). L'oublier faisait deborder cette colonne de 10 px au-dela
    // de la marge droite — mesure : 1634 pour un bord a 1624.
    var avail = W - this.matX - this.totalsW - this.padR - 10;
    this.colW = Math.min(avail/this.nCols, 56);
    this.matW = this.colW * this.nCols;

    // la colonne des totaux suit la matrice au lieu d'etre collee au bord
    // droit : les deux se lisent ensemble, elles disent la meme ligne.
    this.totalsX = this.matX + this.matW + 10;

    this.bandY = this.padT + this.ctrlH;
    this.stripY= this.bandY + this.bandH + this.gapBand;
    this.rowsY = this.stripY + this.stripH + this.hdrH + 3;

    var n = this.visibleCount();
    if(n<1) n=1;

    /* Hauteur de ligne : 18 px quand les pays sont peu nombreux (une periode
       courte), 7 px au plus serre. En dessous de 7 la ligne n'est plus une
       ligne, c'est un trait — et le nom a cote devient illisible : on cesse
       alors d'ecrire un nom sur deux (voir draw()). */
    this.rowH = Math.max(7, Math.min(18, Math.floor(920/n)));

    this.matH = n * this.rowH;
    this.footH= 26;                   // etiquettes d'annees, en bas

    this.canvas.height = Math.ceil(this.rowsY + this.matH + this.footH + this.padT);

    // compatibilite avec l'ancien aiguillage de animated_data.js (`mouseX < w`)
    this.w = this.matX + this.matW;
};

MatrixChart.prototype.visibleCount = function(){ return this.data.length; };

/* ISOLER UN PAYS L'ECLAIRE, ÇA NE FAIT PAS DISPARAITRE LES AUTRES.

   LA PREMIERE VERSION LES MASQUAIT, comme le fait le line chart, et le
      geste s'y detruisait lui-meme. Dans le line chart, la legende est une
      colonne a part : masquer des courbes ne deplace pas les carres sur
      lesquels on clique, et on peut donc en cocher cinq d'affilee. Dans la
      matrice, LA LEGENDE EST LA MATRICE — la ligne qu'on clique est la ligne
      qu'on lit. Masquer les autres reflouait tout : le deuxieme clic, a la
      meme place, ne tombait plus sur un pays mais dans le vide, ce qui
      DESELECTIONNAIT. Isoler deux pays etait donc impossible autrement que
      par hasard. Constate au banc d'essai, pas devine : trois clics de suite
      sur trois lignes voisines donnaient un seul pays isole.

   Les lignes ne bougent donc jamais. Un pays isole prend sa couleur, son nom
   passe en clair, et sa part s'empile dans le bandeau ; les autres restent en
   place, attenues. On y gagne au passage la lecture qui manquait le plus :
   les pays choisis se lisent PARMI les autres, et non a leur place — ce qui
   est justement ce qu'on cherche quand on en compare quelques-uns.

   isVisible() est conservee : elle repond desormais toujours oui, mais elle
   est la surface commune avec LineChart, et animated_data.js n'a pas a savoir
   laquelle des deux vues il tient. */
MatrixChart.prototype.isVisible = function(i){ return true; };

/* Niveau d'attenuation d'une ligne : 1 = pleine, <1 = en retrait.

   UNE LIGNE DONT UNE CELLULE EST SELECTIONNEE N'EST JAMAIS ATTENUEE. La
      selection est un geste explicite ; l'effacer parce qu'un AUTRE pays est
      isole ferait se contredire les deux facons de designer un pays. Meme
      regle dans le diagramme en barres. */
MatrixChart.prototype.rowAlpha = function(i){
    if(this.numSolos<=0) return 1;
    if(this.solo_btns[i] && this.solo_btns[i].state) return 1;
    if(this.selectedIndexOf(i) >= 0) return 1;
    return 0.30;
};

//les pays dans l'ordre d'affichage. Toutes les lignes, toujours.
MatrixChart.prototype.visibleOrder = function(){ return this.order.slice(); };

/* Rang de palette d'un pays isole.

   IL EST ATTRIBUE UNE FOIS, A L'ISOLEMENT, ET NE BOUGE PLUS. Il a ete
      calcule deux fois de la mauvaise facon avant d'arriver ici, et les deux
      erreurs ont la meme forme — un rang deduit d'un ORDRE plutot que porte
      par le pays :

      1. compte sur l'ordre d'AFFICHAGE : changer de tri repeignait tout, alors
         qu'un tri ne change aucune donnee ;
      2. compte sur l'index de DONNEES (`for k<i`, comme le faisait le line
         chart) : isoler un pays situe plus haut dans le tableau decalait le
         rang de tous ceux d'apres et les repeignait — signale a l'usage.

   Le rang vient donc de `soloSlot`, pose par toggleSolo() et rendu au
   relachement. Le line chart a recu le meme mecanisme au meme moment : les
   deux vues attribuent donc les memes couleurs au meme jeu de pays, ce qui
   est la raison pour laquelle les palettes ont demenage dans
   js/variables.js. */
MatrixChart.prototype.soloRank = function(i){
    var slot = this.soloSlot[i];
    return (slot === undefined) ? 0 : slot;
};
/* Couleur d'un pays ISOLE : le carre, le nom, la barre de total et la bande du
   flux cumule portent la meme. Modulo la palette, comme le line chart — le
   plafond VIZ_CAT_MAX ne s'applique QU'A L'EMPILEMENT du bandeau, ou une
   neuvieme bande serait illisible ; une neuvieme LIGNE, elle, se lit tres bien
   (elle a son nom ecrit a cote). */
MatrixChart.prototype.soloColor = function(i){
    if(this.numSolos<=0 || !this.solo_btns[i] || !this.solo_btns[i].state) return null;
    return this.cat[this.soloRank(i) % this.cat.length];
};

MatrixChart.prototype.selectedIndexOf = function(ctryId){
    for (var k=0;k<this.selectedCells.length;k++){ if(this.selectedCells[k].ctryId===ctryId) return k; }
    return -1;
};

/* ------------------------------------------------------- rampe sequentielle
   CLASSES, ET NON UN DEGRADE CONTINU — et les classes sont EXACTEMENT les
   graduations de l'axe Y du line chart : 1, 2, 5, 10, 20, 50. Ce n'est pas un
   rappel decoratif. C'est ce qui fait que les deux vues disent la meme chose
   du meme chiffre : la hauteur d'un point dans l'une et la couleur d'une
   cellule dans l'autre tombent sur les memes seuils, donc on peut passer de
   l'une a l'autre sans reapprendre a lire.

   Un degrade continu aurait paru plus fin et aurait ete moins lisible : entre
   deux teintes voisines d'une rampe, personne ne lit « 7 » plutot que « 9 ».
   Ce qu'on lit d'une couleur, c'est une classe ; autant nommer les classes et
   les ecrire dans la cle. La valeur exacte, elle, est dans l'infobulle.

   Ces seuils sont geometriques (x2, x2.5, x2, x2, x2.5) : c'est le meme geste
   que la racine carree de l'axe Y — dilater le bas de l'echelle pour que les
   pays a faibles effectifs restent lisibles a cote des plus gros.

   Six classes au plus, parce que la rampe a six echelons valides et qu'un
   septieme les rapprocherait sous le seuil de discrimination. Au-dela de la
   sixieme, la classe est ouverte (« 50+ »).

   VALEUR NULLE : AUCUNE CELLULE N'EST PEINTE. Un pays qui ne s'est pas
   presente n'a pas depose zero oeuvre, il n'a rien depose — et la grille doit
   garder le trou, puisque c'est precisement ce que les courbes ne montraient
   pas. */
MatrixChart.prototype.BIN_BREAKS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

MatrixChart.prototype.computeBins = function(){
    var br=[];
    for (var i=0;i<this.BIN_BREAKS.length;i++){
        if(this.BIN_BREAKS[i] <= this.maxCell) br.push(this.BIN_BREAKS[i]);
    }
    if(br.length<1) br=[1];
    if(br.length > this.seq.length) br = br.slice(0, this.seq.length);
    this.bins = br;
    /* Le « + » dit que la derniere classe est OUVERTE, c'est-a-dire qu'elle
       contient des valeurs superieures a son seuil — et non qu'il a fallu
       tronquer la liste des seuils. Les deux ne coincident pas : avec un
       maximum de 99, la classe « 50 » contient 50 a 99 sans que rien n'ait
       ete tronque, et elle doit s'ecrire « 50+ ». */
    this.binOpen = (this.maxCell > br[br.length-1]);

    /* Les couleurs sont PRELEVEES sur les six echelons valides, etalees sur le
       nombre de classes reellement utilisees. Moins de classes -> ecarts de
       clarte plus grands, jamais plus petits : la validation tient encore. */
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

//« total » quand la periode est le fonds entier, « this period » sinon : la
//colonne de droite ne compte que ce qui est a l'ecran.
MatrixChart.prototype.isFullSpan = function(){
    return this.minYear<=1973 && this.maxYear>=2009;
};
MatrixChart.prototype.spanLabel = function(){
    return this.isFullSpan() ? "total" : "this period";
};

/* ============================================================== rendu ===== */

/* Symetrique de LineChart.prototype.retire : la page retire le graphe courant
   avant d'en construire un autre dans le meme canvas (retireCurrentChart(),
   js/animated_data.js). La matrice n'entretient aucune animation — elle ne
   peut donc pas peindre par-dessus son successeur —, mais elle recoit des
   rappels differes (le liseré de provenance quand le `case 12` repond tard) :
   le drapeau garantit qu'un rappel en retard ne reveille pas un graphe mort.
   Et la page n'a pas a savoir lequel des deux graphes elle tient. */
/* RETIRER, C'EST AUSSI CESSER DE REPONDRE. La premiere version n'engageait
   que draw() : le graphe retire n'ecrivait plus dans le canvas mais acceptait
   encore clics et survols. Constate au banc — on isolait un pays et on
   selectionnait une cellule, l'etat interne changeait, une requete partait, et
   l'image ne bougeait pas d'un pixel. Ni image juste, ni inaction. */
//`repaint` : le nom commun aux trois vues (cf. js/linechart.js)
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

/* ------------------------------------------------- bandeau de controle (haut) */
MatrixChart.prototype.drawControls = function(){
    var ctx=this.context, y=this.padT+11;
    this.ctrlRects={};

    ctx.textAlign="left";
    ctx.font=this.fontBold;

    // « reset all » : meme libelle et meme jaune que dans le line chart.
    ctx.fillStyle=this.hilite;
    ctx.fillText("reset all", this.padL, y);
    this.ctrlRects.reset={x:this.padL-4, y:y-9, w:ctx.measureText("reset all").width+8, h:18};

    // tri des lignes
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
        if(on){                       // souligne l'option active : l'etat ne tient
            ctx.fillRect(x, y+8, w, 1); // pas au seul contraste du texte
        }
        this.ctrlRects.sort.push({k:opts[i].k, x:x-4, y:y-9, w:w+8, h:18});
        x += w + 14;
    }

    // cle de la rampe sequentielle, a droite
    this.drawColorKey(y);
};

/* La cle de couleur. Elle porte des VALEURS, pas seulement un degrade : une
   rampe sans chiffres se lit « plus ou moins », ce qui n'est pas une lecture.
   Les bornes sont 1 et le maximum observe ; le pas est celui de la rampe. */
/* La cle. Elle porte les SEUILS, un par classe — pas seulement deux bornes de
   part et d'autre d'un degrade. Un degrade borne se lit « plus ou moins » ;
   une classe nommee se lit. Et ce sont les seuils de l'axe Y du line chart,
   de sorte que la meme valeur se lit pareil dans les deux vues. */
MatrixChart.prototype.drawColorKey = function(y){
    var ctx=this.context;
    var n=this.bins.length, sw=24, h=10;
    var kw=n*sw;
    /* Calee sur le bord droit du CONTENU (fin de la colonne des totaux) et non
       sur celui du canvas : une periode de deux editions ne remplit qu'un
       quart de la largeur, et la cle se retrouvait a onze cents pixels des
       cellules qu'elle explique. */
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

/* ---------------------------------------------------- bandeau de flux cumule
   Aire des totaux par edition, et, quand des pays sont isoles, leur part
   empilee au bas de cette aire. Echelle LINEAIRE : une aire empilee sur un
   axe en √ serait fausse, √a + √b n'est pas √(a+b) — la surface mentirait
   sur la somme qu'elle pretend montrer. Le √ de cette page est ailleurs,
   dans la couleur des cellules, ou il ne somme rien.

   1995 saute, comme dans le line chart : l'aire joint 1994 a 1996 sans
   redescendre a zero. Une chute a zero se lirait comme une edition vide, or
   il n'y a pas eu d'edition. */
MatrixChart.prototype.drawFlowBand = function(){
    var ctx=this.context;
    var y0=this.bandY, h=this.bandH, base=y0+h;
    var self=this;

    function yOf(v){ return base - (v/self.maxTotal)*h; }
    /* Abscisse d'une edition : le CENTRE de sa colonne, pour que le bandeau
       et la matrice parlent du meme endroit — sauf aux deux extremites, ou
       l'aire est etiree jusqu'au bord de la grille. Sans cela, une periode de
       sept editions laisse une demi-colonne vide de chaque cote et l'aire
       parait ne pas couvrir la periode qu'elle couvre. */
    function cx(j){
        if(j===0) return self.matX;
        if(j===self.nCols-1) return self.matX + self.matW;
        return self.colX(j) + self.colW/2;
    }

    // cadre discret + graduations
    ctx.strokeStyle="rgba(255,255,255,0.10)";
    ctx.lineWidth=1;
    var gr=[0.25,0.5,0.75,1];
    for (var g=0; g<gr.length; g++){
        var gy=Math.round(yOf(this.maxTotal*gr[g]))+0.5;
        ctx.beginPath(); ctx.moveTo(this.matX, gy); ctx.lineTo(this.matX+this.matW, gy); ctx.stroke();
    }

    // colonnes reellement portees par des donnees (1995 exclu)
    var cols=[];
    for (var j=0;j<this.nCols;j++) if(!this.isSkipped(j)) cols.push(j);
    if(!cols.length) return;

    /* Empilement : les pays isoles, dans l'ordre d'affichage, au plus
       VIZ_CAT_MAX. Le reste (y compris les isoles au-dela du plafond) forme
       la masse grise du dessus — elle est donc toujours « tout ce qui n'est
       pas nomme ici », et jamais un residu de calcul. */
    var stack=[];
    if(this.numSolos>0){
        var vis=this.visibleOrder();
        for (var s=0; s<vis.length; s++){
            var iv=vis[s];
            // le PLAFOND est ici et nulle part ailleurs : au-dela de huit
            // bandes, le reste rejoint la masse grise (cf. VIZ_CAT_MAX)
            if(this.solo_btns[iv] && this.solo_btns[iv].state && this.soloRank(iv) < this.catMax){
                stack.push({i:iv, color:this.soloColor(iv)});
            }
        }
    }

    // 1) l'aire TOTALE, en gris : ce qui est compte, tous pays confondus
    ctx.fillStyle=this.band;
    ctx.beginPath();
    ctx.moveTo(cx(cols[0]), base);
    for (var a=0;a<cols.length;a++) ctx.lineTo(cx(cols[a]), yOf(this.totals[cols[a]]));
    ctx.lineTo(cx(cols[cols.length-1]), base);
    ctx.closePath();
    ctx.fill();

    // 2) les parts empilees, du bas vers le haut
    var cum=[];
    for (var z=0;z<this.nCols;z++) cum[z]=0;

    for (var t=0;t<stack.length;t++){
        var arr=this.data[stack[t].i].arr;
        ctx.fillStyle=stack[t].color;
        ctx.beginPath();
        // bord superieur (cumul + ce pays), de gauche a droite
        for (var b=0;b<cols.length;b++){
            var jj=cols[b], top=cum[jj]+(arr[jj]||0);
            if(b===0) ctx.moveTo(cx(jj), yOf(top)); else ctx.lineTo(cx(jj), yOf(top));
        }
        // bord inferieur (cumul), de droite a gauche
        for (var d=cols.length-1; d>=0; d--){
            var kk=cols[d];
            ctx.lineTo(cx(kk), yOf(cum[kk]));
        }
        ctx.closePath();
        ctx.fill();
        for (var e=0;e<cols.length;e++){ var mm=cols[e]; cum[mm]+= (arr[mm]||0); }
    }

    // 3) le contour du total, 2 px : c'est LA ligne a lire du bandeau
    ctx.strokeStyle=this.ink;
    ctx.lineWidth=2;
    ctx.beginPath();
    for (var f=0;f<cols.length;f++){
        var jf=cols[f];
        if(f===0) ctx.moveTo(cx(jf), yOf(this.totals[jf])); else ctx.lineTo(cx(jf), yOf(this.totals[jf]));
    }
    ctx.stroke();
    ctx.lineWidth=1;

    // 4) etiquettes : le maximum, le zero, et le titre du bandeau
    ctx.font=this.fontSmall;
    ctx.textAlign="right";
    ctx.fillStyle=this.inkMuted;
    // le maximum, jamais plus haut que le bandeau : sinon il vient se poser
    // sur la ligne des controles, qui n'a rien a voir avec lui
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

    // etiquette directe des bandes assez epaisses pour en porter une
    ctx.textAlign="left";
    ctx.font=this.fontSmall;
    var cum2=[];
    for (var q=0;q<this.nCols;q++) cum2[q]=0;
    var last=cols[cols.length-1], lastY=null;
    for (var t2=0;t2<stack.length;t2++){
        var arr2=this.data[stack[t2].i].arr;
        var thick=Math.abs(yOf(cum2[last]) - yOf(cum2[last]+(arr2[last]||0)));
        var midY=(yOf(cum2[last]) + yOf(cum2[last]+(arr2[last]||0)))/2;
        /* Etiquetee seulement si la bande est assez epaisse pour en porter une
           ET assez loin de la precedente : deux noms superposes ne nomment
           plus rien, et l'un des deux devient un mensonge. Les autres bandes
           gardent leur couleur, que la ligne du pays rappelle. */
        if(thick>=9 && (lastY===null || Math.abs(midY-lastY)>=12)){
            ctx.fillStyle=this.ink;
            ctx.fillText(this.data[stack[t2].i].ctry, this.matX+this.matW+6, midY);
            lastY=midY;
        }
        for (var r=0;r<this.nCols;r++) cum2[r]+= (arr2[r]||0);
    }
};

/* ------------------------------------------------- liseré de provenance
   Meme codage que sur la bande de navigation (drawPvStrip dans
   js/animated_data.js) et LU A LA MEME SOURCE — pvState(), qui interroge la
   base et non un tableau recopie a la main. Il est ici ALIGNE SUR LES
   COLONNES : on peut enfin rapporter une colonne a l'autorite qui la fonde,
   ce que la bande de navigation, a son propre pas horizontal, ne permettait
   pas. Si la provenance n'a pas encore repondu, tout reste gris : la page
   ne pretend rien savoir. */
MatrixChart.prototype.drawProvenanceStrip = function(){
    var ctx=this.context;
    if(typeof pvKnown === 'function' && !pvKnown()) return;   // cf. pvKnown()
    for (var j=0;j<this.nCols;j++){
        if(this.isSkipped(j)) continue;                 // 1995 : pas d'edition
        var year=this.minYear+j;
        /* La table des couleurs vivait ICI et dans drawPvStrip() : deux copies
           d'un codage que la legende decrit une fois. Elle est desormais dans
           js/animated_data.js (pvColor), avec les libelles, et les trois vues
           y puisent. */
        ctx.fillStyle = (typeof pvColor==='function') ? pvColor(year) : '#7f8c8d';
        ctx.fillRect(this.colX(j)+1, this.stripY, Math.max(1,this.colW-2), this.stripH);
    }
    ctx.font=this.fontSmall;
    ctx.textAlign="right";
    ctx.fillStyle=this.inkMuted;
    ctx.fillText("on what authority", this.matX-6, this.stripY+this.stripH/2);
};

/* Les entetes de la colonne de gauche et de celle de droite. Une colonne de
   chiffres sans entete oblige a aller les chercher dans la legende, ou a les
   deviner : « 812/2511 » ne dit pas de lui-meme ce qu'il compte. */
MatrixChart.prototype.drawColumnHeads = function(y){
    var ctx=this.context;
    ctx.font=this.fontSmall;
    ctx.fillStyle=this.inkMuted;
    /* Pas d'entete « country » au-dessus des noms de pays : la colonne se
       nomme d'elle-meme, et l'etiquette venait buter contre celle des
       compteurs dans une gouttiere de deux cents pixels. On n'ecrit que ce
       qui ne se devine pas. */
    ctx.textAlign="right";
    /* LES DEUX COLONNES DE CHIFFRES NE COMPTENT PAS SUR LA MEME ETENDUE, et
       rien ne le disait : « 35/97 » a gauche vient de numCpByCountry, qui
       porte sur TOUT le fonds, tandis que « 8 » a droite est le total de la
       PERIODE affichee. Sur 1973-1974 les deux se lisaient cote a cote et se
       contredisaient. L'etendue est donc ecrite dans l'entete. */
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

/* ---------------------------------------------------------------- les lignes */
MatrixChart.prototype.drawRows = function(){
    var ctx=this.context;
    var vis=this.visibleOrder();
    var gapX = (this.colW>14) ? 1.5 : 0.5;      // respiration entre cellules
    var gapY = (this.rowH>9)  ? 1.5 : 0.5;
    var labelEvery = (this.rowH>=11) ? 1 : 2;   // trop serre : un nom sur deux

    for (var p=0;p<vis.length;p++){
        var i=vis[p], y=this.rowY(p);
        var arr=this.data[i].arr;
        var solo=this.soloColor(i);
        var hovered=(this.hoverRow===i);
        var alpha=this.rowAlpha(i);

        /* Une ligne non retenue s'efface sans quitter la grille : elle garde
           sa place, donc le clic suivant tombe la ou il vise. */
        ctx.globalAlpha = hovered ? 1 : alpha;

        // fond de ligne au survol : la lecture d'une matrice se perd d'une
        // ligne a l'autre, c'est le defaut principal de cette forme.
        if(hovered){
            ctx.fillStyle="rgba(241,196,15,0.10)";
            ctx.fillRect(this.padL-4, y, this.totalsX+this.totalsW-this.padL+4, this.rowH);
        }

        // carre d'isolement
        var sq=Math.min(10, this.rowH-2);
        if(sq>=4){
            ctx.strokeStyle="rgba(236,240,241,0.5)";
            ctx.strokeRect(this.padL+0.5, y+(this.rowH-sq)/2+0.5, sq, sq);
            ctx.fillStyle = solo ? solo : (this.solo_btns[i].state ? this.inkMuted : "rgba(236,240,241,0.12)");
            ctx.fillRect(this.padL+1, y+(this.rowH-sq)/2+1, sq-1, sq-1);
        }

        // nom du pays + compteurs c/t
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

        // les cellules
        for (var j=0;j<this.nCols;j++){
            if(this.isSkipped(j)) continue;
            var v=arr[j]||0;
            var c=this.cellColor(v);
            if(!c) continue;
            ctx.fillStyle=c;
            ctx.fillRect(this.colX(j)+gapX, y+gapY, Math.max(1,this.colW-2*gapX), Math.max(1,this.rowH-2*gapY));
        }

        // barre de total, a droite. √ comme les cellules : sans lui, la France
        // ecraserait tout le reste a un pixel.
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

    // colonne 1995 : le concours n'a pas eu lieu. Une colonne vide se lirait
    // comme une lacune du releve ; on la barre et on l'ecrit.
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

/* Cellules SELECTIONNEES au clic. Anneau de 2 px dans la couleur de clic du
   pays, double d'un liseré au fond : une cellule peut avoir n'importe quelle
   couleur de la rampe, l'anneau doit tenir sur toutes. */
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

//repere vertical au survol : sans lui, on ne sait pas de quelle annee releve
//une cellule au milieu de trente-sept colonnes.
MatrixChart.prototype.drawCrosshair = function(){
    if(this.hoverCol<0 || this.isSkipped(this.hoverCol)) return;
    var ctx=this.context;
    var x=this.colX(this.hoverCol);
    ctx.fillStyle="rgba(241,196,15,0.13)";
    ctx.fillRect(x, this.bandY, this.colW, this.bandH);
    ctx.fillRect(x, this.rowsY, this.colW, this.matH);
};

/* ---------------------------------------------------------------- utilitaires */
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

/* ================================================== interaction ============ */

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

/* Point d'entree unique du clic. animated_data.js appelle handleClick() quand
   le graphe en expose un — le line chart n'en a pas, il garde son aiguillage
   « a gauche de w = les donnees, a droite = la legende ». Ici la legende est A
   GAUCHE (c'est elle qui nomme les lignes), cette regle-la ne s'applique pas,
   et l'ancienne n'a pas eu a etre modifiee pour autant. */
MatrixChart.prototype.handleClick = function(mx,my){

    // retire : il ne peint plus, il ne repond plus (cf. retire())
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

        /* RECLIQUER LA MEME CELLULE LA DESELECTIONNE.

           IL FALLAIT UN GESTE POUR DEFAIRE, ET IL N'Y EN AVAIT PLUS. Le
              line chart deselectionne par un clic « dans le vide », entre deux
              courbes ; une matrice n'a pas de vide — chaque point de la grille
              est une cellule, y compris celles qui ne portent rien (une case
              vide n'est pas un blanc, c'est « ce pays n'a pas concouru cette
              annee-la », et on peut vouloir le demander). Une fois ce clic-la
              rendu inoffensif sur la colonne 1995 et hors de la grille, plus
              rien ne defaisait une selection sauf « reset all », qui defait
              TOUT, y compris l'isolement des pays.

           Le geste devient donc celui qui va de soi dans une grille : le meme
           clic, une seconde fois. Aucun appel reseau n'est refait — on ne
           demande rien en retirant. */
        if(k>=0 && this.selectedCells[k].yearId===c.j){
            this.selectedCells.splice(k,1);
            this.draw();
            /* Plus rien de selectionne : la liste des compositeurs et le
               panneau de droite ne designent plus rien qui soit a l'ecran, ils
               partent avec. Tant qu'il reste une cellule choisie, on les
               laisse — ils disent la derniere demande, qui tient toujours. */
            if(!this.selectedCells.length && typeof clearWorkPanel === 'function') clearWorkPanel();
            return;
        }

        if(k>=0) this.selectedCells[k].yearId=c.j;   // meme pays, autre annee
        else     this.selectedCells.push({ctryId:c.i, yearId:c.j});

        this.draw();
        // MEME chargement que le line chart : la methode est empruntee, pas copiee.
        this.retrieveData(cId, year, value);
        return;
    }

    /* Clic « dans le vide » : on deselectionne, comme le clic entre deux
       lignes du line chart.

       MAIS SEULEMENT DANS LA GRILLE. La premiere version deselectionnait
          au moindre clic hors cible : sur la cle de couleur, sur le bandeau
          des totaux, sur les etiquettes d'annees, sur le liseré de
          provenance, sur la colonne 1995 — laquelle est pourtant survolable
          et porte un libelle, donc a tout l'air d'une cible. Trois cellules
          choisies disparaissaient pour avoir clique sur une legende. Le vide
          qui deselectionne, c'est le vide ENTRE LES CELLULES, rien d'autre. */
    /* Reste : la colonne 1995, la cle de couleur, le bandeau, les etiquettes
       d'annees, le liseré, les entetes. IL NE S'Y PASSE RIEN.

       La premiere version deselectionnait tout au moindre clic hors cible.
          Trois cellules choisies disparaissaient pour avoir clique sur une
          legende — et la colonne 1995, barree, etiquetee et survolable, donc
          l'endroit de la grille qui se PRESENTE le plus comme une cible, etait
          de ceux-la. Le geste qui defait une selection est desormais le
          reclic sur la cellule elle-meme (ci-dessus), pas un clic n'importe ou
          ailleurs. */
    return;
};

/* Isoler / relacher un pays. PAS DE layout() : le nombre de lignes ne change
   pas, donc ni la hauteur du canvas ni la position d'aucune ligne. C'est ce
   qui rend le geste repetable — voir la note d'isVisible(). */
MatrixChart.prototype.toggleSolo = function(i){
    if(this._retired) return;
    this.solo_btns[i].state=!this.solo_btns[i].state;
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

MatrixChart.prototype.resetCountries = function(){
    for (var i=0;i<this.solo_btns.length;i++) this.solo_btns[i].state=false;
    this.soloSlot={};
    this.numSolos=0;
    this.selectedCells=[];
    this.hoverRow=-1; this.hoverCol=-1;
    this.draw();
};

/* Survol. Retourne le TEXTE de l'infobulle (ou une chaine vide), que
   animated_data.js se charge d'afficher : le graphe sait ce qu'il montre, la
   page sait ou le poser. */
MatrixChart.prototype.handleHover = function(mx,my){

    if(this._retired) return "";

    var row=-1, col=-1, label="";

    var c=this.hitCell(mx,my);
    if(c){
        row=c.i; col=c.j;
        var year=this.minYear+c.j;
        if(this.isSkipped(c.j)) label = "1995 — no competition was held";
        else {
            var v=this.data[c.i].arr[c.j]||0;
            label = this.data[c.i].ctry + " · " + year + " · " +
                    (v>0 ? (v + (v>1?" entrants":" entrant")) : "no entrant recorded") +
                    (this.selectedIndexOf(c.i)>=0 && this.selectedCells[this.selectedIndexOf(c.i)].yearId===c.j
                        ? " — click again to clear" : " — click to list them");
        }
    } else {
        var g=this.hitRowGutter(mx,my);
        if(g>=0){
            row=g;
            var cid=this.data[g].cId;
            var cc=(typeof numCpByCountry!=='undefined' && numCpByCountry[cid]) ? numCpByCountry[cid] : null;
            /* Deux etendues dans la meme phrase : on les nomme. Sans quoi
               « Belgium · 8 entrants · 35 of 97 with archived works » se lit
               comme une contradiction — et c'en serait une si les deux
               nombres portaient sur la meme periode. */
            var etendue = this.isFullSpan() ? "" : " in " + this.minYear + "–" + this.maxYear;
            label = this.data[g].ctry + " · " + this.rowTotal[g] + " entrants" + etendue
                  + (cc ? " · " + cc.c + " of " + cc.t + " with archived works, all editions" : "")
                  + " — click to isolate";
        } else if(my>=this.bandY && my<=this.bandY+this.bandH && mx>=this.matX && mx<=this.matX+this.matW){
            col=Math.floor((mx-this.matX)/this.colW);
            if(col>=0 && col<this.nCols){
                var yy=this.minYear+col;
                label = this.isSkipped(col) ? "1995 — no competition was held"
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

/* ============================================================================
   LE CHARGEMENT DES COMPOSITEURS N'EST PAS REECRIT.

   retrieveData() n'utilise que `this.sl_ctry` et les globales de la page. La
   matrice emprunte donc la methode du line chart plutot que d'en tenir une
   copie. Une copie aurait diverge a la premiere evolution du `case 0` de
   php/retrieve_data.php — et elle aurait diverge SILENCIEUSEMENT : le pas de
   lecture du flux est passe de 4 a 5 puis a 6 champs, et un pas faux ne
   produit pas d'erreur, il produit des noms qui sont des identifiants.
   ============================================================================ */
if(typeof LineChart === 'function'){
    MatrixChart.prototype.retrieveData = LineChart.prototype.retrieveData;
}
