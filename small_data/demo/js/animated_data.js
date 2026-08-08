var init=false;
var allData;
var canvas, context;
var cv_nav, ctx_nav;
//1995 volontairement absent : le concours n'a pas eu lieu cette annee-la
//(36 editions de 1973 a 2009). Il ne peut donc pas etre selectionne dans le menu.
var years=[1, 1973, 1974, 1975, 1976, 1977, 1978, 1979,
1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989,
1990, 1991, 1992, 1993, 1994, 1996, 1997, 1998, 1999,
2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009];
var sl_years=[];
var inBtwYears=[];
var btnIdToEdit=-1;
var menu;
var colors=["#ecf0f1", "#2c3e50", "#e74c3c", "#f1c40f", "#bdc3c7", "#3498db", "#ffcccc"];
//clouds grey, midnight blue - dark grey, red alizarin, yellow - sun flower, grey silver, blue - peter river, pretty please - pink
var bw=15, bh=15;
var btn01; //red btn

/* LE GRAPHE COURANT — et non « le line chart ».

   La variable garde son nom (une trentaine d'usages, aucun changement de
   comportement a la clef) mais elle porte desormais SOIT un LineChart SOIT un
   MatrixChart, selon `chartView`. Les deux objets exposent la meme surface :
   requestData/handleClick, hover/handleHover, clearHover, isVisible,
   resetCountries — et la matrice EMPRUNTE retrieveData() au line chart, elle
   n'en tient pas de copie (voir le pied de js/matrixchart.js). */
var myLineChart;

/* ------------------------------------------------------------------------
   DEUX VUES POUR LES MEMES DONNEES — 2026-08-08

   Le line chart tracait une courbe par pays. Depuis le versement de la liste
   cc4160, une edition en compte jusqu'a une cinquantaine, et la periode
   complete une soixantaine sur trente-sept editions : passe une vingtaine de
   courbes, la figure ne montre plus des trajectoires mais une texture.

   La MATRICE (js/matrixchart.js) ne recouvre rien : une cellule par pays et
   par edition, l'echelle racine carree passant de l'axe Y a la couleur. Elle
   devient la vue par defaut. Un bandeau de flux cumule, au-dessus, porte le
   total par edition — ce que soixante courbes n'ont jamais permis de lire.

   LE LINE CHART N'EST PAS SUPPRIME, et ce n'est pas de la prudence : c'est la
   seule facon d'affirmer qu'aucune fonction n'a ete perdue. Tant que les deux
   vues repondent au meme clic sur les memes donnees, la comparaison est
   faisable par n'importe qui, a tout moment, et une regression eventuelle se
   constate au lieu de se discuter. js/linechart.js n'a recu, lui, que le
   renvoi de ses deux palettes vers js/variables.js.

   Le mode DIAGRAMME EN BARRES (une seule edition selectionnee) ne depend pas
   de ce commutateur : une edition unique n'a ni courbe ni matrice a montrer.
   Le bloc #view est alors grise — voir setViewSwitchEnabled().
   ------------------------------------------------------------------------ */
var chartView = 'matrix';        // 'matrix' | 'line'
var matrixSort = 'total';        // survit aux reconstructions de la matrice

/* LES PAYS ISOLES SURVIVENT A LA COMMUTATION — 2026-08-08.

   ⚠️ Sans cela, le commutateur de vue ne tenait pas la promesse qui justifie
      son existence : « voir les memes pays autrement ». Isoler cinq pays dans
      la matrice puis passer au line chart rendait un graphe NEUF, sans
      selection — il fallait recocher les cinq, dans une legende rangee
      autrement. On ne comparait donc jamais deux vues de la meme chose ; on
      comparait une vue de quelque chose a une vue de tout.

   On transporte des IDENTIFIANTS DE PAYS (`cId`) et non des index : les deux
   graphes recoivent le meme tableau, filtre de la meme facon (`sum > 0`) et
   dans le meme ordre, donc les index coincident AUJOURD'HUI — raison
   insuffisante pour s'y fier. Un identifiant, lui, designe le meme pays quoi
   qu'il arrive au tri.

   Le relais ne vit que le temps d'une commutation : il est rempli par
   choose(), consomme par la construction qui suit immediatement, puis vide. */
var pendingSolo = [];

/* JETON DE GENERATION — 2026-08-08, second lot.

   Il est incremente a chaque reconstruction (updateSlData). Les rappels
   asynchrones qui ecrivent dans la colonne d'information le capturent au
   depart et refusent d'ecrire si la selection a change entre-temps.

   ⚠️ Sans lui, une reponse en vol repeuplait une selection qu'on venait de
      quitter : cliquer une cellule puis changer d'edition cent millisecondes
      plus tard reinstallait cent vingt compositeurs et reecrivait la barre
      orange de l'ancienne edition PAR-DESSUS la nouvelle vue ; cliquer un
      compositeur puis changer de periode faisait reapparaitre ses oeuvres
      sous une boite de nom vide — des oeuvres attribuees a personne.

   On n'annule pas la requete : elle est deja partie, et la nommer pour
   l'abandonner demanderait de tenir un XHR par appel. On refuse son
   RESULTAT, ce qui suffit, coute une comparaison, et ne peut pas fuir. */
var dataGen = 0;

function captureIsolatedCountries(chart){
    var out=[];
    if(!chart || !chart.data || !chart.solo_btns) return out;
    for (var i=0; i<chart.data.length; i++){
        if(chart.solo_btns[i] && chart.solo_btns[i].state && chart.data[i]){
            /* Le RANG DE PALETTE voyage avec le pays, pas seulement son
               identifiant : sans lui, commuter de vue redistribuerait les
               couleurs dans l'ordre du nouveau tableau, et un pays changerait
               de couleur en changeant de vue — precisement ce que le rang
               stable vient d'empecher a l'interieur d'une vue. */
            out.push({
                cId : String(chart.data[i].cId),
                slot: (chart.soloSlot && chart.soloSlot[i] !== undefined) ? chart.soloSlot[i] : i
            });
        }
    }
    return out;
}
/* Repose la selection sur un graphe neuf. Rend `true` si elle a mordu — c'est
   a l'appelant de redessiner, les deux graphes ne se redessinant pas de la
   meme facon. */
function applyIsolatedCountries(chart, sel){
    if(!chart || !chart.data || !chart.solo_btns || !sel || !sel.length) return false;
    var n=0;
    if(chart.soloSlot) chart.soloSlot = {};
    for (var i=0; i<chart.data.length; i++){
        var cid = String(chart.data[i].cId), trouve = null;
        for (var k=0; k<sel.length; k++){ if(sel[k].cId === cid){ trouve = sel[k]; break; } }
        if(chart.solo_btns[i]) chart.solo_btns[i].state = !!trouve;
        if(trouve){
            n++;
            if(chart.soloSlot) chart.soloSlot[i] = trouve.slot;
        }
    }
    chart.numSolos = n;
    return n>0;
}

var composers=[], titles=[];
// nom, ISNI et pays du compositeur affiche dans le panneau de droite
var lastComposerIsni='';
var yearSelection=false;
var lastComposerSelected="";
var lastComposerCtry='';
var lastComposerOrigin='';

var numTitlesByArtist=[];
var maxChartWidth;

var c_on=COLORS[2];
var c_off=COLORS[0];
var c_sl=COLORS[3];

var numComposersInCapsules;
var infos;
var cp_infos;
var numCpByCountry=[];

var takeCountIntoAccount;

/* ------------------------------------------------------------------------
   NOMS EN CLAIR OU NOMS MASQUES

   Par defaut, un compositeur SANS oeuvre archivee n'est ni nomme ni
   cliquable : la liste n'affiche que ses initiales, les autres lettres
   remplacees par des etoiles (« F****** D****** »). Les compositeurs qui
   ONT une oeuvre dans les capsules restent nommes et cliquables : leur nom
   est deja publie avec l'oeuvre, ailleurs sur le site.

   `SHOW_ALL_NAMES` et `maskName()` sont dans **js/functions.js** : la meme
   regle vaut pour la recherche de l'Overview, et une regle de discretion
   ecrite deux fois se separe a la premiere correction faite d'un seul
   cote. L'en-tete de la fonction, la-bas, dit ce que `?v=all` leve et ce
   qu'il ne leve pas. */

/* Ordre alphabetique de la liste des compositeurs — 2026-08-07.

   ⚠️ LE TRI PORTE SUR LE NOM DE FAMILLE, alors que la ligne affiche
      « Prenom Nom ». C'est l'ordre d'un catalogue, pas celui de la chaine
      affichee : trier sur ce qui est ecrit rangerait le corpus par prenoms.
      Le prenom departage les homonymes.

   localeCompare et non `<` : sans lui, « Ålander » et « Zorn » se rangent
   par code de caractere, et tous les noms accentues partent apres le Z. */
function compareComposers(a, b){
    var na = String(a && a.n  != null ? a.n  : ''),
        nb = String(b && b.n  != null ? b.n  : ''),
        fa = String(a && a.fn != null ? a.fn : ''),
        fb = String(b && b.fn != null ? b.fn : '');
    var c = na.localeCompare(nb);
    return c !== 0 ? c : fa.localeCompare(fb);
}

window.onload = function() {

    //TODO CONTROL USING GUI
    takeCountIntoAccount=false;

	//------------ canvas ------------//
    canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');
    //----------------------------------//

    maxChartWidth=1640;

    cv_nav = document.getElementById('cv_nav');
    ctx_nav = cv_nav.getContext('2d');
    cv_nav.width=maxChartWidth-440;
    cv_nav.height = 40;

    ctx_nav.fillStyle=COLORS[1];
    ctx_nav.fillRect(0, 0, cv_nav.width, cv_nav.height);

    menu = createMenu();
    
    //red btn
    var lr = menu[menu.length-1];
    btn01 = {x:lr.x+23, y:lr.y, state:true};

    drawMenu(menu);
    loadPvProvenance();   // repeint le liseré des qu'elle repond

    document.getElementById('cv_nav').addEventListener("click", selectData);
    document.getElementById('myCanvas').addEventListener("click", editData);
    // survol : met en avant la ligne la plus proche du curseur (line chart)
    document.getElementById('myCanvas').addEventListener("mousemove", hoverData);
    document.getElementById('myCanvas').addEventListener("mouseleave", clearHoverData);
	document.getElementById('get_all').addEventListener("click", getData);
	document.getElementById('selection').addEventListener("click", toggleYearSl);
	// le panneau de droite suit la legende quand la fenetre change de largeur
	window.addEventListener("resize", positionWorkPanel);
	/* ... et quand la legende se replie. Depuis que le panneau se cale sur la
	   BARRE ORANGE et non plus sur le haut de la legende, sa hauteur de depart
	   depend de celle de la legende : replier le "How to read" fait remonter la
	   barre de plusieurs centaines de pixels, et le panneau doit remonter avec
	   elle. On observe la taille du bloc plutot que le clic sur son titre : la
	   mesure ne depend alors ni de l'ordre d'enregistrement des ecouteurs (le
	   repli est pose par js/legend_toggle.js, charge separement) ni de la seule
	   cause connue — l'arrivee de la police change aussi la hauteur. */
	if(typeof ResizeObserver === 'function'){
		var lgBox = document.getElementById('legend');
		if(lgBox) new ResizeObserver(positionWorkPanel).observe(lgBox);
	}else{
		var lgBtn = document.getElementById('lg_toggle');
		if(lgBtn) lgBtn.addEventListener('click', positionWorkPanel);
	}

	// canvas.width = $(document).width()-25; //context left pad = 10;
    setCanvasWidthAndHeight();

    bindViewSwitch();

    // les boites d'info (orange #selection + liste #composers) prennent EXACTEMENT
    // la largeur de la legende "How to read".
    syncInfoBoxWidths();

    /* Fiche ISNI du compositeur selectionne (js/isni_box.js, partage avec
       Overview, Network, euphonies, catalog et award-winning_works).

       En FLUX, dans #isniColumn : au milieu du panneau de droite, elle se
       deplie ENTRE la boite du nom et la liste des oeuvres, et pousse cette
       derniere au lieu de la recouvrir.

       NI `clickable` NI `watch` DEPUIS LE 2026-08-05, comme sur Overview.
       `clickable` designait le nom souligne de pointilles — il fallait deviner
       ce que le pointille cachait ; la fiche s'affiche maintenant d'elle-meme,
       repliee sur son identifiant, et c'est lui qui se deplie. `watch` posait
       un observateur de mutations pour refermer la fiche quand la selection
       changeait : il n'a plus d'objet, puisque displayComposerBox()
       ecrit la fiche EN MEME TEMPS que la boite d'identite et qu'elles ne
       peuvent donc plus se desynchroniser. L'appel reste pour le seul `into`,
       qui declare le conteneur et bascule la fiche en mode flux. */
    if(typeof enableIsniPanel === 'function'){
        enableIsniPanel({ into: 'isniColumn' });
    }

    getData();
};
//----------------- functions -----------------//
function syncInfoBoxWidths(){
    var lg = document.getElementById('legend');
    if(!lg) return;
    var w = Math.round(lg.getBoundingClientRect().width);
    var ids = ['selection', 'composers'];
    for(var i=0; i<ids.length; i++){
        var e = document.getElementById(ids[i]);
        if(e){ e.style.boxSizing = 'border-box'; e.style.width = w + 'px'; e.style.maxWidth = w + 'px'; }
    }
}
/* `width` n'est lu que par le diagramme en barres (une seule edition), qui
   demande la largeur dont il a besoin pour ses pays — voir generateBarChart().
   Absent, on retombe sur les 900 px d'origine. Le line chart, lui, occupe
   toujours toute la largeur. */
function setCanvasWidthAndHeight(displaySeveralYears, width){
    if(displaySeveralYears){
        canvas.width=maxChartWidth;
        canvas.height = 600;
    }
    else{
        canvas.width= width || 900;
        canvas.height = 500;
    }

    context.fillStyle="#2c3e50"; //fond identique a la page
    context.fillRect(0, 0, canvas.width, canvas.height);
}
function toggleYearSl(){
	if(composers.length>0){
		yearSelection=!yearSelection;
		editTitleInfo(infos.c, infos.y, infos.nc, infos.tnc, yearSelection);
		displayCpInfos();
	}
}
function editTitleInfo(sl_ctry, sl_year, numOfComposers, totalNumOfComposers, sl){

    infos={c:sl_ctry, y:sl_year, nc:numOfComposers, tnc:totalNumOfComposers, sl:sl};

    var mode = infos.sl ? 'showing this edition only | click to show all composers'
                        : 'showing all composers | click to keep this edition only';

    // Le texte tient sur DEUX lignes : la 1re resume la selection, la 2e commence
    // par "showing ..." (mode courant + action au clic).
    var line1 = infos.c + ', edition ' + infos.y +
            ' · this edition: ' + cp_infos.num + '/' + infos.nc + ' composers with archived works' +
            ' · all editions: ' + cp_infos.all + '/' + infos.tnc +
            ' · records: ' + cp_infos.titles + '/' + cp_infos.all_titles;

	$("#selection").empty();
    $("#selection").append($('<p>').text(line1));
    $("#selection").append($('<p>').text(mode));
}
function getNumComposersInCapsulesAndTitles(cId, year, composers){

    cp_infos={num:0, all:0, titles:0, all_titles:0};

    for (var i=0; i<composers.length; i++) {

        var count=parseInt(numTitlesByArtist[composers[i].id]);

        if(count>0&&composers[i].y>0){
            cp_infos.num++;
            cp_infos.titles+=parseInt(numTitlesByArtist[composers[i].id]);
        }

        if(count>0){
            cp_infos.all++;
            cp_infos.all_titles+=parseInt(numTitlesByArtist[composers[i].id]);
        }
    }

}
function retrieveAllTitleFrom(aId){

    var gen = dataGen;     // cf. l'en-tete de `dataGen` : une reponse en vol
                           // ne doit pas repeindre une selection abandonnee

    $.ajax({                                      
        url: 'php/retrieve_data.php',       
        type: "POST",
        data: { aId: aId, case:1 } 
    }).done(function(str) {

        if(gen !== dataGen) return;

        var arr=str.split("%");
        titles=[];

        for (var i=0; i<arr.length-4; i+=5) {
            titles.push({id:arr[i], t:arr[i+1], d:arr[i+2], m:arr[i+3], ed:arr[i+4]});
        }

        displayTitlesInfos();

    });

}
/* Le panneau de droite, en trois etages : le NOM du compositeur, la fiche
   ISNI qu'il ouvre, puis ses oeuvres.

   Le nom etait jusqu'ici l'en-tete de la boite violette (un <span> en tete de
   liste). Il en sort pour devenir une boite a lui : c'est lui qui porte le
   lien vers la notice d'identite internationale, et la fiche doit pouvoir se
   deplier ENTRE le nom et les oeuvres — donc entre deux boites, pas dans
   l'une d'elles. La boite violette reprend alors l'en-tete des deux autres
   pages : « N archived works », depliable.

   Le rendu des oeuvres n'est plus ecrit ici : displayTitlesInfosGN()
   (js/functions.js) le fait deja pour Overview et Network, a l'identique — la
   version locale n'en differait que par cet en-tete, qui vient de demenager.
   Une troisieme copie n'aurait pas survecu a la premiere correction faite
   ailleurs. */
function displayTitlesInfos(){

    displayComposerBox();
    displayTitlesInfosGN(titles);

    positionWorkPanel();
    matchComposersHeight();
}
/* La boite du nom. LE NOM N'EST PLUS CLIQUABLE depuis le 2026-08-05 : il
   portait un souligne pointille qui ouvrait la notice ISNI, et il fallait
   avoir remarque le pointille pour le savoir. La fiche s'affiche desormais
   d'elle-meme des qu'un ISNI existe, repliee sur son identifiant, et c'est
   l'identifiant qui se deplie. */
function displayComposerBox(){

    var box = $('#composerBox');
    if(!box.length) return;

    var who  = $.trim(lastComposerSelected || '');
    var isni = $.trim(lastComposerIsni || '');

    /* Plus de compositeur choisi : la boite du nom ET la fiche s'en vont
       ensemble. Les separer laisserait une notice d'identite sous un panneau
       qui ne nomme plus personne. */
    if(!who){
        box.empty();
        if(typeof hideIsniBox === 'function') hideIsniBox();
        return;
    }

    box.html('<p>'+(typeof esc === 'function' ? esc(who) : who)+'</p>');

    /* La ligne de pays, en couple quand la fiche porte une origine. Construite
       par js/functions.js — meme fonction que la boite orange de Network, donc
       meme rendu et un seul endroit a corriger. */
    if(typeof countryLineHtml === 'function'){
        box.append(countryLineHtml(lastComposerOrigin, lastComposerCtry));
    }

    /* Et la fiche, ecrite ici pour la meme raison que sur les deux autres
       pages : les deux boites disent la MEME selection, elles sont donc
       ecrites au meme endroit. Rien n'est demande au reseau avant le
       depliage. syncIsniBoxGN() est dans js/functions.js — trois pages, une
       seule copie. */
    syncIsniBoxGN(isni);
}
/* Le panneau de droite (#workPanel : nom, fiche ISNI, oeuvres) se place a
   droite de la legende, dans l'espace qu'elle laisse vide, et A HAUTEUR DE LA
   BARRE ORANGE (#selection) — jamais plus haut, et jamais dessous. Position
   absolue (hors flux) -> la colonne de gauche (barre orange + compositeurs) ne
   bouge pas, meme quand la liste des oeuvres est longue. Une fenetre etroite
   ne le fait plus revenir dans le flux : elle fait defiler la page (voir le
   dernier paragraphe de la fonction).

   Le repere vertical est #selection et non plus #legend (« How to read »)
   depuis le 2026-08-05 : la petite boite orange (le NOM du compositeur) et la
   grande (la barre de selection) disent la meme chose — l'une nomme ce que
   l'autre compte — et se lisaient mal quand la premiere flottait une legende
   plus haut que la seconde. Elles partent donc de la meme ligne, et la fiche
   ISNI puis la boite violette, qui sont dans le flux du panneau, descendent
   sous elles. Se caler sur la legende avait un autre defaut : sa hauteur
   change quand on la replie, donc le panneau sautait avec elle.

   C'est le PANNEAU qui est place, et non plus la seule boite violette : les
   trois etages doivent rester solidaires, sans quoi la fiche ISNI resterait
   dans le flux pendant que les oeuvres remontent a droite.

   Le test de visibilite porte, lui, toujours sur #titles : le panneau, qui
   contient des elements enfants, n'est jamais :empty au sens CSS, alors que la
   boite violette dit exactement ce qu'on veut savoir — a-t-on quelque chose a
   montrer ? */
function positionWorkPanel(){
    var pan=document.getElementById('workPanel'),
        tit=document.getElementById('titles'),
        lg=document.getElementById('legend'),
        sel=document.getElementById('selection'),
        content=document.getElementById('content');
    if(!pan || !tit || !lg || !content) return;
    if(getComputedStyle(tit).display==='none') return;   // rien a montrer
    var gap=14;

    /* Le bord droit de la colonne de gauche. La legende, la barre orange et la
       liste des compositeurs ont EXACTEMENT la meme largeur (syncInfoBoxWidths)
       et se terminent donc au meme pixel ; on prend le plus a droite des deux
       reperes disponibles, ce qui reste juste si l'un d'eux vient a manquer ou
       si la synchronisation n'a pas encore eu lieu au premier rendu. */
    var edge = lg.offsetLeft + lg.offsetWidth;
    if(sel) edge = Math.max(edge, sel.offsetLeft + sel.offsetWidth);
    var left  = edge + gap;
    var avail = content.clientWidth - left - 5;           // -5 : petite marge droite

    /* Le haut de la barre orange, et a defaut le bas de la legende : sans
       #selection dans la page, il reste au moins une ligne sous laquelle se
       ranger plutot que de recouvrir le "How to read". */
    var top = sel ? sel.offsetTop : (lg.offsetTop + lg.offsetHeight + gap);

    pan.style.position='absolute';
    pan.style.top  = top + 'px';
    pan.style.left = left + 'px';

    /* LE PANNEAU NE REPASSE PLUS SOUS LA COLONNE — 2026-08-05.

       Sous une certaine largeur de fenetre, il revenait dans le flux normal,
       c'est-a-dire SOUS la liste des compositeurs : la petite boite orange se
       retrouvait au-dessous de la grande, et la fiche ISNI avec elle. Un repli
       qui se declenche a une largeur qu'on n'a pas choisie, et qui defait
       precisement la lecture qu'on venait d'installer — les deux boites
       oranges sur la meme ligne, l'une nommant ce que l'autre compte.

       Le panneau reste donc TOUJOURS a droite de la grande boite orange. Quand
       la place manque, c'est la page qui defile horizontalement : meme choix
       que sur Network (voir css/network.css), et pour la meme raison — mieux
       vaut chercher la colonne a droite en faisant defiler que la trouver en
       bas apres avoir cru qu'elle avait disparu.

       La largeur suit ce qui reste, entre les 220 px de #workPanel (sa
       min-width, en dessous de laquelle une notice ISNI n'est plus lisible) et
       440 px. Le plancher est ce qui produit le defilement : sans lui, une
       fenetre etroite ecraserait le panneau au lieu de pousser la page. */
    pan.style.maxWidth = Math.max(220, Math.min(avail, 440)) + 'px';
}
// Depuis que la boite violette remonte a droite de la legende, elle n'est plus
// cote a cote avec les compositeurs : on garde ces derniers a leur hauteur
// naturelle (plus d'extension pour s'aligner sur les oeuvres).
function matchComposersHeight(){
    var comp=document.getElementById('composers');
    if(comp) comp.style.minHeight='';
}
/* UNE SEULE LIGNE DE LA LISTE — 2026-08-07.

   ⚠️ CETTE FONCTION N'EXISTAIT PAS : displayCpInfos() portait DEUX FOIS le
      meme bloc, une fois pour les compositeurs de l'edition selectionnee,
      une fois pour les autres, a la classe CSS pres. Les deux copies
      etaient deja divergentes d'un caractere (« ' ' » contre « " " » entre
      prenom et nom). Ajouter le masque a l'une et pas a l'autre aurait
      donne exactement le defaut le plus difficile a voir : la page qui
      protege un nom dans un cas et l'affiche dans l'autre, sans erreur ni
      compte anormal. Les deux branches appellent donc le meme code, et il
      n'y a plus qu'un endroit ou se tromper. */
function appendComposerLi(obj, count, inSelectedEdition){

    /* MASQUE : aucune oeuvre archivee, et l'adresse ne porte pas `?v=all`.
       Le nom d'un compositeur qui a une oeuvre est deja publie avec elle. */
    var masked = !SHOW_ALL_NAMES && !(count>0);

    var nom = $.trim((obj.fn || '') + ' ' + (obj.n || ''));
    var libelle = masked ? maskName(nom) : nom;
    if(count>0) libelle += ' (' + count + ')';

    var cls = [];
    if(count>0)            cls.push('active');
    if(inSelectedEdition)  cls.push('selected');
    if(masked)             cls.push('masked');

    var li = $('<li>').text(libelle);
    if(cls.length) li.attr('class', cls.join(' '));

    var tip = '';
    if(inSelectedEdition) tip += 'took part in the selected edition';
    if(count>0)           tip += (tip ? ' · ' : '') + count + ' archived work(s) — click to list them';
    if(!tip)              tip  = 'no archived work';
    if(masked)            tip += ' — name withheld';
    li.attr('title', tip);

    /* ⚠️ NI IDENTIFIANT NI ISNI SUR UNE LIGNE MASQUEE. Masquer le libelle
       et laisser `data-id` ou `data-isni` dans le document reviendrait a
       ecrire le nom en clair juste a cote, une inspection plus loin —
       l'identifiant est precisement ce qui permet de le redemander. Le
       pays reste : il est celui de la courbe cliquee, il ne designe
       personne. */
    if(!masked){
        li.attr('data-id', obj.id);
        // attr et non data : un ISNI tout en chiffres serait converti en
        // nombre par jQuery, et ses zeros de tete disparaitraient.
        if(obj.isni)   li.attr('data-isni', obj.isni);
        // Pays et pays d'origine voyagent avec la ligne : la boite du nom
        // les affiche en couple (« Argentina / France »), cf. #composerBox.
        if(obj.ctry)   li.attr('data-ctry', obj.ctry);
        if(obj.origin) li.attr('data-origin', obj.origin);

        li.click(function(event) {
            var el = $(event.target);
            retrieveAllTitleFrom(el.data("id"));
            /* Le libelle de la liste porte le compte entre parentheses
               (« Dhomont (12) ») : il est retire ici, la boite violette
               l'annonce maintenant elle-meme. */
            lastComposerSelected = $.trim(el.text().replace(/\s*\(\d+\)\s*$/, ''));
            lastComposerIsni = el.attr('data-isni') || '';
            lastComposerCtry = el.attr('data-ctry') || '';
            lastComposerOrigin = el.attr('data-origin') || '';
        });
    }
    /* Pas de `click` du tout sur une ligne masquee — et non un gestionnaire
       qui refuserait d'agir : ce qui n'ecoute pas ne peut pas fuir. Le
       curseur cesse de se transformer en main (css/animated_data.css,
       `#composers li.masked`), donc la ligne ne se PRESENTE pas comme
       cliquable. */

    $("#composers").append(li);
}
function displayCpInfos(){

	$("#composers").empty();

    /* Ordre alphabetique — sur une COPIE. `composers` est aussi lu par
       getNumComposersInCapsulesAndTitles(), et la barre orange dit « this
       edition / all editions » : des comptes, insensibles a l'ordre. Trier
       en place n'aurait donc rien casse AUJOURD'HUI, ce qui est une raison
       insuffisante de le faire — le tableau vient du flux, il garde l'ordre
       du flux. */
    var liste = composers.slice().sort(compareComposers);

    for (var j=0; j<liste.length; j++) {

        var obj=liste[j];
        var count=numTitlesByArtist[obj.id];

        if(obj.y>0)             appendComposerLi(obj, count, true);   //selected year
        else if(!yearSelection) appendComposerLi(obj, count, false);
    }
    matchComposersHeight();
}
//---------------------------------------------//
/* ⚠️ RETIRER LE GRAPHE COURANT AVANT D'EN CONSTRUIRE UN AUTRE — 2026-08-08.

   Les trois graphes de cette page partagent UN SEUL canvas. Le line chart
   entretient une boucle requestAnimationFrame pour le fondu de survol, qui met
   ~350 ms a s'eteindre : construire le graphe suivant pendant ce fondu laissait
   l'ancien peindre PAR-DESSUS le nouveau. Le line chart n'efface que
   1200 x 600 px, si bien que le diagramme en barres (900 x 500) etait
   integralement recouvert et que la matrice transparaissait autour de la zone
   effacee. Defaut ANCIEN — il ne demandait que d'aller vite : survoler une
   ligne, puis cliquer aussitot une annee. Une seconde d'attente suffisait a ne
   rien voir, d'ou une panne qui ne se reproduit pas quand on la cherche.

   Le retrait est pose ICI, au seul endroit par ou passent les trois
   constructions, plutot que devant chacune : c'est ce qui garantit qu'un
   quatrieme graphe, un jour, ne l'oubliera pas. */
function retireCurrentChart(){
    if(myLineChart && typeof myLineChart.retire === 'function') myLineChart.retire();
}
/* ⚠️ LE PANNEAU DE DROITE SUIT LA SELECTION, IL NE LUI SURVIT PAS — 2026-08-08.

   Signale a l'usage : commuter du line chart vers la matrice laissait en place
   la petite boite orange (le NOM du compositeur), sa fiche ISNI et la boite
   violette (ses oeuvres). La liste des compositeurs, elle, etait bien videe.
   Le panneau nommait donc quelqu'un que plus rien a l'ecran ne selectionnait —
   exactement la desynchronisation corrigee partout ailleurs le 2026-08-05
   (§13.4, §14.2) : une notice d'identite sous une selection qui ne la designe
   plus, et qu'on lit comme si elle la designait encore.

   Le meme oubli valait pour TOUT changement de selection d'annees, pas
   seulement pour la commutation de vue : choisir une autre periode, ou passer
   au diagramme en barres, laissait le panneau tel quel. C'est pourquoi le
   nettoyage est pose ICI, dans le seul chemin par ou passent les trois
   constructions, et non dans chacune des trois — et a cote de
   retireCurrentChart(), qui repond au meme besoin pour le canvas.

   Les quatre variables partent avec les boites : `lastComposerSelected` et ses
   trois compagnes sont ce que displayComposerBox() relit. Les laisser
   remplies sous des boites vides remettrait le nom en place au premier
   redessin, sans qu'on ait rien selectionne. */
function clearWorkPanel(){
    lastComposerSelected = '';
    lastComposerIsni     = '';
    lastComposerCtry     = '';
    lastComposerOrigin   = '';
    titles = [];

    /* ⚠️ ET LA LISTE DES COMPOSITEURS AVEC. Le vidage de `#composers` vivait
       dans generateLineGraph() et generateBarChart() ; quand aucune des deux
       ne s'execute — une seule annee choisie et « span » allume —, il ne se
       produisait pas, et la liste survivait a la selection qui l'avait
       produite. C'est exactement la desynchronisation que cette fonction est
       censee supprimer, laissee a moitie. */
    $('#composers').empty();

    $('#titles').empty();
    /* Sans nom, displayComposerBox() vide la boite ET retire la fiche ISNI —
       les deux ensemble, ce qui est tout l'objet de cette fonction. Les regles
       `#composerBox:empty` et `#titles:empty` (css/animated_data.css) font
       alors disparaitre les boites au lieu d'en laisser deux barres vides. */
    displayComposerBox();
}
function updateSlData(){

	var tmpY = sl_years.concat(inBtwYears);

    retireCurrentChart();
    clearWorkPanel();
    dataGen++;                      // toute reponse en vol devient perimee

    /* Le commutateur ne vaut que pour les vues MULTI-EDITIONS. Il etait grise
       sur le seul diagramme en barres — donc encore actif dans l'etat « une
       annee choisie, span allume », ou aucun graphe n'est construit : cliquer
       « line chart » y basculait `chartView` pour de bon, sous une matrice
       restee peinte a l'ecran. Un commutateur qui annonce une vue qui n'est
       pas la est pire qu'un commutateur inerte. */
    setViewSwitchEnabled(sl_years.length===2 || sl_years.length<1);

    if(sl_years.length==1 && !btn01.state){ //bar chart --> display only one year

        var f_data=[];

        for (var i=0; i<allData.length-5; i+=6) {

            var arr = allData[i+4].split(",");
            var count = allData[i+3];

            for (var j=0; j<arr.length; j++) {
                if(tmpY.includes(parseInt(arr[j]))){

                    /* `works` — CE CANDIDAT A-T-IL UNE OEUVRE AU FONDS ?
                       C'est le 4e champ du `case 10`, celui-la meme qui ecrit
                       « 1259 / 2550 » en tete de page et le `c/t` de la
                       legende. Il ne coute rien a transporter ici, et c'est
                       lui qui permet a une barre de dire deux choses au lieu
                       d'une (voir generateBarChart et js/barchart.js). */
                    var auFonds = parseInt(count, 10) > 0;

                    if(takeCountIntoAccount){
                        if(count>0)f_data.push({id: allData[i], ctry: allData[i+1], cId: allData[i+2], edition: allData[i+4], works: auFonds});
                    } else {
                        f_data.push({id: allData[i], ctry: allData[i+1], cId: allData[i+2], edition: allData[i+4], works: auFonds});
                    }

                    break;
                }
            }
        }

        var inf1 = "composers: " + f_data.length;
        $("#info p:eq(1)").text(inf1);

    	generateBarChart(f_data);

    } else if(sl_years.length==2 || sl_years.length<1){ //line chart

        var f_data=[];
        var minY, maxY;

        if(sl_years.length<1) {
            minY=1973;
            maxY=2009;
        } else {
            minY=Math.min(sl_years[0], sl_years[1]);
            maxY=Math.max(sl_years[0], sl_years[1]);
        }

        for (var i=0; i<allData.length-5; i+=6) {

            var count = allData[i+3];
            //not well enough written : when count > 0 all editions are ++
            //takeCountIntoAccount must be false to not take count into account to draw lines

            if(i===0){
                console.log('id:', allData[i], 'ctry:',allData[i+1], 'ctry_id:', allData[i+2],
                'artist appearance in capsules:', count, 'editions:', allData[i+4]);
            }

            if(f_data.length<1){
                
                f_data.push({ctry: allData[i+1], cId: allData[i+2], arr: []});

                //init editions array
                for (var j=0; j<=maxY-minY; j++)f_data[f_data.length-1].arr[j]=0;

                //-------------
                var t_years = getEditionsAsArrOfInts(allData[i+4]);
                var year=minY;

                while(year<maxY+1){
                    
                    if(takeCountIntoAccount){
                        if(t_years.includes(year) && count>0)f_data[0].arr[year-minY]+=1;
                    } else {
                        if(t_years.includes(year))f_data[0].arr[year-minY]+=1;
                    }

                    year++;
                }
                //------------                
            } else {

                var found = false;

                for (var k=0; k<f_data.length; k++){

                    if(f_data[k].cId === allData[i+2]){ //same country id

                        //------------- double
                        var t_years = getEditionsAsArrOfInts(allData[i+4]);
                        var year=minY;

                        while(year<maxY+1){  //f_data[k]

                            if(takeCountIntoAccount){
                                if(t_years.includes(year) && count>0)f_data[k].arr[year-minY]+=1;
                            } else {
                                if(t_years.includes(year))f_data[k].arr[year-minY]+=1;
                            }

                            year++;
                        }
                        //---------------------

                        found = true;
                        break;
                    }
                }

                if(!found){
                    //------------- same as one
                    f_data.push({ctry: allData[i+1], cId: allData[i+2], arr: []});
                    for (var j=0; j<=maxY-minY; j++)f_data[f_data.length-1].arr[j]=0;

                    //-------------
                    var t_years = getEditionsAsArrOfInts(allData[i+4]);
                    var year=minY;

                    while(year<maxY+1){  //f_data[f_data.length-1]


                        if(takeCountIntoAccount){
                            if(t_years.includes(year)  && count>0)f_data[f_data.length-1].arr[year-minY]+=1;
                        } else {
                            if(t_years.includes(year))f_data[f_data.length-1].arr[year-minY]+=1;
                        }

                        year++;
                    }
                    //------------
                }
            }
        }

        /* Rien a dire ici en mode line chart : le chiffre qui a un sens
           (« composers: N ») est celui d'UNE edition, et on en affiche
           plusieurs. La ligne est donc laissee VIDE au lieu de porter « no
           info » — un texte qui prend la place d'une information pour
           annoncer qu'il n'y en a pas. Vide, elle disparait (css
           `#ctrl_bar #info p:empty`) et la ligne suivante remonte. */
        $("#info p:eq(1)").text('');

        //pays par ordre alphabetique (courbes et legende)
        f_data.sort(function(a, b){
            return String(a.ctry).localeCompare(String(b.ctry));
        });

        generateLineGraph(f_data, minY, maxY);

    } else {

        /* UNE SEULE ANNEE CHOISIE, « SPAN » ALLUME : on attend la seconde.

           ⚠️ CET ETAT NE CONSTRUISAIT RIEN, ET NE DISAIT RIEN. Le graphe
              precedent restait donc PEINT a l'ecran — fige, puisqu'il venait
              d'etre retire, mais toujours a l'ecran. Depuis que la matrice
              repond au clic sans passer par le garde « multi-editions », elle
              y repondait encore : on isolait un pays, on selectionnait une
              cellule, une requete partait, la barre orange se reecrivait, et
              l'image ne bougeait pas d'un pixel. Ni image juste, ni inaction —
              et un seul clic depuis l'etat par defaut suffisait a y entrer.

           On efface donc, et on dit ce qu'on attend. Une toile vide avec une
           phrase vaut mieux qu'un dessin qui n'est plus vrai. */
        myLineChart = null;

        setCanvasWidthAndHeight(true);
        drawAwaitingSecondYear();

        $("#info p:eq(1)").text('');
        updateDataQualityInfo();

        $("#selection").empty();
        $("#selection").append($('<p>').text(
            sl_years[0] + " selected — pick a second year to chart the period between them"));
        $("#selection").append($('<p>').text(
            "or turn the span toggle off to get a bar chart of that single edition"));
    }
}
/* La toile d'attente. Ecrite au centre du canvas, dans le gris des axes : ce
   n'est pas une donnee, ça ne doit pas en avoir l'air. */
function drawAwaitingSecondYear(){
    if(!context) return;
    context.save();
    context.font = '13px "Helvetica Neue", Helvetica, Arial, sans-serif';
    context.fillStyle = "#8fa3b0";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("pick a second year on the strip above to chart the period between them",
                     canvas.width/2, canvas.height/2);
    context.restore();
}
function getEditionsAsArrOfInts(str){
    return str.split(",").map(Number);
}
function generateLineGraph(data, minYear, maxYear){ //display several years TODO

    $("#composers").empty();

    /* L'AIGUILLAGE EST ICI, ET NON CHEZ L'APPELANT. updateSlData() a deja
       fait le travail couteux — regrouper 2 500 compositeurs par pays et par
       edition — et les deux vues consomment EXACTEMENT le meme tableau. Faire
       brancher l'appelant aurait duplique ce calcul ou, pire, laisse deux
       chemins de preparation des donnees derriver l'un de l'autre : les deux
       vues cesseraient alors de montrer la meme chose, ce qui est precisement
       ce qu'on veut pouvoir affirmer. */
    if(chartView === 'matrix' && typeof MatrixChart === 'function'){
        generateMatrixChart(data, minYear, maxYear);
        return;
    }

    setCanvasWidthAndHeight(true);

	var maxValue=0;

	for (var j = 0; j < data.length; j++) {
		var arr = data[j].arr;
		for (var k = 0; k < arr.length; k++) {
			if(arr[k]>maxValue)maxValue=arr[k];
		}
	}

    myLineChart = new LineChart({
        canvasId: "myCanvas",
        minY: 0, //not used
        maxX: (maxYear-minYear)*5,
        maxY: maxValue,
        unitsPerTickX: 5,
        unitsPerTickY: 10,
        minYear: minYear,
        maxYear: maxYear
    });

    for (var i = 0; i < data.length; i++) {
        var sum = data[i].arr.reduce(add, 0);
        if(sum>0)myLineChart.drawLine(data[i], colors[5], 1, true);
    }

    updateDataQualityInfo();

    myLineChart.drawLegend();

    /* Les pays isoles dans l'autre vue, reposes ici. APRES drawLegend() :
       c'est elle qui cree `solo_btns`, un par pays — avant, il n'y a rien a
       cocher. */
    if(applyIsolatedCountries(myLineChart, pendingSolo)){
        myLineChart.refreshLegendButtons();
        myLineChart.redrawLineChart();
    }
    pendingSolo = [];

    var txt='<p>'+myLineChart.data.length.toString()+ " countries</p>";
    $("#selection").empty();
    $("#selection").append(txt);

}
function add(a, b) {
    return a + b;
}
/* La ligne « 1973-2009 : incomplete data » sous le titre. Elle etait ecrite
   DANS generateLineGraph() ; elle en sort parce que la matrice la porte
   aussi, et qu'une phrase sur la qualite des donnees ecrite a deux endroits
   se separe a la premiere correction faite d'un seul cote — c'est exactement
   ce qui est arrive au liseré de provenance, qui etait code en dur et avait
   cesse de dire vrai (voir l'en-tete de drawPvStrip). */
function updateDataQualityInfo(){
    var inf2="";
    var maxY=Math.max(sl_years[0], sl_years[1]);
    var minY=Math.min(sl_years[0], sl_years[1]);
    if(maxY<1996)inf2 = minY.toString() + "-" + maxY.toString() + ": complete data";
    else if(sl_years.length===2)inf2 = minY.toString() + "-" + maxY.toString() + ": incomplete data";
    else inf2 = "1973-2009: incomplete data";
    $("#info p:eq(2)").text(inf2);
}
/* LA MATRICE — vue par defaut des periodes de plusieurs editions.
   Elle recoit le MEME tableau que le line chart : meme regroupement, meme
   ordre de champs, meme comptage. Ce qui change est le rendu, rien d'autre. */
function generateMatrixChart(data, minYear, maxYear){

    /* On ecarte les pays sans aucune participation dans la periode — meme
       regle que le line chart, qui ne trace une ligne que si sa somme est non
       nulle (`if(sum>0)`). Une ligne entierement vide ne dit rien et coute une
       ligne de matrice a tous les autres. */
    var rows=[];
    for (var i=0; i<data.length; i++) {
        if(data[i].arr.reduce(add, 0) > 0) rows.push(data[i]);
    }

    /* Largeur pleine, comme le line chart. La HAUTEUR, elle, est fixee par la
       matrice elle-meme : elle depend du nombre de pays a montrer, qui depend
       de la periode choisie et des pays isoles. Une hauteur figee obligerait
       a ecraser les lignes quand ils sont nombreux ou a laisser du vide quand
       ils sont rares. */
    setCanvasWidthAndHeight(true);

    myLineChart = new MatrixChart({
        canvasId: "myCanvas",
        data: rows,
        minYear: minYear,
        maxYear: maxYear,
        sortMode: matrixSort,
        /* L'ordre des lignes SURVIT aux reconstructions : changer de periode
           ne doit pas defaire le tri qu'on venait de choisir. La matrice ne
           connait pas la page, elle previent ; c'est la page qui retient. */
        onSort: function(mode){ matrixSort = mode; }
    });
    matrixSort = myLineChart.sortMode;

    // les pays isoles dans l'autre vue, reposes ici (la matrice cree ses
    // `solo_btns` dans son constructeur, il n'y a donc rien a attendre)
    if(applyIsolatedCountries(myLineChart, pendingSolo)) myLineChart.draw();
    pendingSolo = [];

    updateDataQualityInfo();

    $("#selection").empty();
    $("#selection").append('<p>' + rows.length +
        " countries · click a cell to list the composers of that country</p>");
}
/* Le commutateur de vue (#view dans animated_data.php). Meme tournure que sur
   categories.php — memes boutons b_on / b_off de la barre de controle, meme
   gestion du clavier : il n'y a rien de neuf a apprendre pour s'en servir.
   Rien ne se produit si le bloc est absent : la page s'affiche alors dans sa
   vue par defaut. */
function bindViewSwitch(){

    var box = document.getElementById('view');
    if(!box) return;

    var items = box.getElementsByTagName('li');

    function paint(){
        for (var p=0; p<items.length; p++) {
            var on = items[p].getAttribute('data-view') === chartView;
            items[p].className = on ? 'b_on' : 'b_off';
            items[p].setAttribute('aria-pressed', on ? 'true' : 'false');
        }
    }

    function choose(el){
        /* ⚠️ LE TEST D'ETAT EST ICI, ET NON DANS LA CSS SEULE.
           `pointer-events: none` ne barre que la SOURIS : le bloc grise
           restait atteignable a la tabulation, et Entree y commutait la vue
           pour de bon — les boutons basculaient sous une opacite de 0,45, la
           liste des compositeurs se vidait, et la periode suivante s'affichait
           dans une vue qu'on n'avait pas voulue. Un etat qui n'existe que dans
           la feuille de style n'existe que pour qui se sert d'une souris. */
        if(box.hasAttribute('data-disabled')) return;

        var m = el.getAttribute('data-view');
        if(!m || m === chartView) return;

        // ce qui est isole doit se retrouver dans l'autre vue (cf. pendingSolo)
        pendingSolo = init ? captureIsolatedCountries(myLineChart) : [];

        chartView = m;
        paint();
        hideLineTooltip();
        /* On repasse par updateSlData() et non par un simple redessin : la
           selection d'annees, le mode « span » et le filtrage des donnees
           sont les memes pour les deux vues, et c'est la seule facon d'etre
           sur que l'on commute la VUE sans commuter aussi, par inadvertance,
           ce qui est montre. */
        if(init) updateSlData();
    }

    for (var i=0; i<items.length; i++) {
        (function(el){
            el.onclick = function(){ choose(el); };
            el.onkeydown = function(evt){
                var k = evt.keyCode || evt.which;
                if(k === 13 || k === 32){          // entree, espace
                    if(evt.preventDefault) evt.preventDefault();
                    choose(el);
                }
            };
        })(items[i]);
    }

    paint();
}
/* Une seule edition selectionnee : ni courbe ni matrice n'ont de sens, c'est
   un diagramme en barres qui s'affiche. Le commutateur ne commute alors rien.
   On le grise plutot que de le cacher : un bloc qui disparait et reapparait
   fait sauter la barre de controle, et laisse croire que la vue choisie a ete
   perdue alors qu'elle est seulement en attente. */
function setViewSwitchEnabled(on){
    var box = document.getElementById('view');
    if(!box) return;
    if(on) box.removeAttribute('data-disabled');
    else   box.setAttribute('data-disabled', '1');
}
function generateBarChart(data){ //display only one year TODO

    $("#composers").empty();

	/* AGREGATION PAR IDENTIFIANT DE PAYS, ET NON PAR LIBELLE — 2026-08-08.
	   Elle se faisait en comparant les NOMS, ce qui marchait, mais qui
	   n'emportait pas le `cId` : la barre ne savait donc pas de quel pays
	   elle parlait, et c'est ce qui l'empechait d'etre cliquable. On garde
	   l'identifiant, qui est ce que php/retrieve_data.php attend au clic.

	   Chaque pays compte desormais DEUX choses : ses candidats (la hauteur
	   de la barre, la meme grandeur que le point du line chart et la couleur
	   de la cellule de la matrice) et, parmi eux, ceux qui ont une oeuvre au
	   fonds. L'ecart entre les deux est le sujet de cette base ; il etait
	   ecrit en tete de page et dans la legende, jamais dans le diagramme. */
	/* `Object.create(null)` et non `{}` : la cle vient d'un flux, et un objet
	   ordinaire porte deja `constructor`, `toString`, `__proto__`… Un `cId`
	   qui vaudrait l'un de ces noms rendrait `parCId[k]` vrai d'entree — le
	   pays n'entrerait jamais dans `arr` — et l'increment ecrirait sur
	   Object.prototype, donc sur tous les objets de la page. Les identifiants
	   du `case 10` sont numeriques, c'est donc un durcissement et non un
	   correctif ; mais il coute un mot. */
	var arr=[], parCId=Object.create(null), totEntrants=data.length, totWorks=0;

	for (var i=0; i<data.length; i++) {
		var k = String(data[i].cId);
		if(!parCId[k]){
			parCId[k] = {label: data[i].ctry, cId: data[i].cId, value: 0, withWorks: 0};
			arr.push(parCId[k]);
		}
		parCId[k].value += 1;
		if(data[i].works){ parCId[k].withWorks += 1; totWorks++; }
	}

	//pays par ordre alphabetique (barres et recapitulatif)
	arr.sort(function(a, b){
		return String(a.label).localeCompare(String(b.label));
	});

	var inf2="";
	if(sl_years[0]<1996)inf2 = sl_years[0] + ": complete data";
    else inf2 = sl_years[0] + ": incomplete data";
	$("#info p:eq(2)").text(inf2);

	var max=0;
	for (var k=0; k<arr.length; k++) max = Math.max(max, arr[k].value);

	/* ⚠️ LA BARRE ORANGE N'ENUMERE PLUS LES PAYS. Elle ecrivait
	   « 23 countries: Argentina 3 - Australia 1 - … », ce qui etait la seule
	   facon de lire les chiffres quand le diagramme ne se survolait pas et ne
	   se cliquait pas. A cinquante pays c'etait un paragraphe, et il disait
	   exactement ce que le dessin dit — en moins bien, puisqu'il ne se
	   compare pas. Le survol donne maintenant le compte exact d'un pays, et
	   le clic donne ses compositeurs. Reste ici ce que le dessin NE dit pas :
	   l'ecart global entre candidats et compositeurs au fonds, et ce qu'on
	   peut faire de la souris. */
    $("#selection").empty();
    $("#selection").append($('<p>').text(
        arr.length + " countries · " + totWorks + " / " + totEntrants +
        " composers with archived works"));
    $("#selection").append($('<p>').text(
        "click a bar to list the composers of that country"));
    

    var increment = Math.round(max/10);
    // if(increment%2)console.log(increment-=1);
    if(max<20)increment=2; //1995
    if(increment<1)increment=1;

    /* LARGEUR DU DIAGRAMME — 2026-08-08.
       Elle etait figee a 900 px, pour une trentaine de pays. Depuis le
       versement de la liste cc4160 une edition en compte jusqu'a une
       CINQUANTAINE (2005 : 49, 2009 : 47) : les noms de pays se
       chevauchaient et les barres, dont la largeur venait d'un
       map(30 pays -> 20 px, 10 pays -> 40 px), tombaient a 1 px — et
       seraient passees sous zero au-dela de 50 pays.

       On demande donc la place necessaire : environ 26 px par pays, ce
       qu'il faut pour que deux etiquettes inclinees a 45° ne se touchent
       pas, plus la gouttiere de l'axe. Jamais moins que les 900 px
       d'origine (les petites editions gardent leur allure), jamais plus
       que la largeur du line chart. Au-dela, barchart.js retrecit la
       police plutot que de superposer les noms. */
    var chartWidth = Math.max(900, Math.min(maxChartWidth, 70 + arr.length * 26));

    setCanvasWidthAndHeight(false, chartWidth);

	/* AFFECTE A `myLineChart`, comme les deux autres vues. La variable porte
	   le graphe COURANT quel qu'il soit ; c'est ce qui permet a editData() et
	   hoverData() de lui demander s'il sait traiter un clic, sans avoir a
	   deduire de l'etat des menus lequel des trois est a l'ecran. */
	myLineChart = new BarChart({canvasId: "myCanvas", data: arr, width: chartWidth, height: 500,
	              minValue: 0, maxValue: max, gridLineIncrement: increment,
	              year: sl_years[0]});
}
//---------------------------------------//
function editData(evt){

    /* ⚠️ LE GARDE MANQUAIT ICI ALORS QU'IL EXISTAIT DANS hoverData(). Tant que
       l'aiguillage vivait sous le test `sl_years.length===2 || menu[0].state`,
       il protegeait par ricochet — au chargement, avant la premiere reponse du
       serveur, aucune des deux conditions n'est vraie. En le sortant de ce
       test pour rendre le diagramme en barres cliquable, on a retire cette
       protection sans la remplacer : un clic sur le canvas pendant le
       chargement levait « Cannot read properties of undefined ». */
    if(!myLineChart) return;

    var cv = canvas.getBoundingClientRect();
    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    /* AIGUILLAGE CAPACITAIRE, ET HORS DU GARDE « multi-editions ».

       La matrice et le diagramme en barres exposent UN SEUL point d'entree :
       leur legende n'est pas a droite du graphe (elle est a gauche pour la
       premiere, sous les barres pour le second), donc la regle du line chart
       — « a gauche de `w` les donnees, a droite la legende » — n'y a pas de
       sens. On demande a l'objet s'il sait traiter un clic plutot que de
       deduire de l'etat des menus lequel des trois graphes est a l'ecran :
       ⚠️ c'est ce garde-la qui interdisait tout clic sur le diagramme en
       barres, puisqu'il ne s'ouvrait qu'aux vues multi-editions. */
    if(typeof myLineChart.handleClick === 'function'){
        myLineChart.handleClick(mouseX, mouseY);
        return;
    }

    //le line chart, seul a ne pas en avoir, garde son aiguillage d'origine
    if(sl_years.length===2 || menu[0].state){
        if(mouseX<myLineChart.w)myLineChart.requestData(mouseX, mouseY);
        else myLineChart.editData(mouseX, mouseY);
    }

}
//survol du line chart : surligne la ligne la plus proche, attenue les autres,
//et affiche le nom du pays survole a cote du curseur
function hoverData(evt){
    if(!myLineChart){ hideLineTooltip(); return; }
    var cv = canvas.getBoundingClientRect();
    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    /* La matrice et le diagramme en barres savent ce qu'il y a sous le
       curseur — pays, edition, effectif, part archivee — et rendent le texte
       a afficher. Le line chart ne peut dire que le nom du pays : c'est tout
       ce qu'une ligne designe. Le graphe compose donc l'infobulle, la page la
       pose. (Le test d'etat des menus est descendu sous ce bloc : il ne vaut
       que pour le line chart, et il empechait le survol des barres.) */
    if(typeof myLineChart.handleHover === 'function'){
        var lbl = myLineChart.handleHover(mouseX, mouseY);
        if(lbl) showLineTooltip(lbl, evt.clientX, evt.clientY);
        else    hideLineTooltip();
        return;
    }

    if(!(sl_years.length===2 || menu[0].state)){ hideLineTooltip(); return; }   //uniquement en mode line chart

    if(mouseX < myLineChart.w){
        myLineChart.hover(mouseX, mouseY);
        if(myLineChart.hoverIdx>=0 && myLineChart.data[myLineChart.hoverIdx]){
            showLineTooltip(myLineChart.data[myLineChart.hoverIdx].ctry, evt.clientX, evt.clientY);
        } else {
            hideLineTooltip();
        }
    } else {
        myLineChart.clearHover();     //curseur sur la legende : pas de survol de ligne
        hideLineTooltip();
    }
}
function clearHoverData(){
    if(myLineChart) myLineChart.clearHover();
    hideLineTooltip();
}
//----- infobulle "nom du pays" qui suit la souris -----
function getLineTooltip(){
    var t = document.getElementById('lineTooltip');
    if(!t){
        t = document.createElement('div');
        t.id = 'lineTooltip';
        /* ⚠️ `white-space: nowrap` A SAUTE — 2026-08-08. Les infobulles se
           sont allongees (pays + edition + effectif + part archivee + ce que
           fait le clic) : sur une seule ligne, elles sortaient de la fenetre
           par la droite et se retrouvaient tronquees, c'est-a-dire illisibles
           la ou elles disent le plus. Elles se replient donc, avec une
           largeur de lecture bornee. Le placement, lui, est ramene dans la
           fenetre par showLineTooltip(). */
        t.style.cssText = 'position:fixed;pointer-events:none;z-index:1000;display:none;'
            + 'background:rgba(44,62,80,.97);color:#f1c40f;font-weight:600;'
            + 'font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;font-size:12px;'
            + 'padding:4px 8px;border-radius:3px;border:1px solid #f1c40f;'
            + 'white-space:normal;max-width:320px;line-height:1.35;';
        document.body.appendChild(t);
    }
    return t;
}
/* L'infobulle suit la souris MAIS RESTE DANS LA FENETRE. Posee en aveugle a
   `curseur + 14`, elle passait sous le bord droit ou sous le bord bas des que
   le curseur en approchait — et une infobulle a moitie dehors ne se lit pas
   mieux qu'une infobulle absente. On la mesure une fois affichee (elle se
   replie maintenant sur plusieurs lignes, sa hauteur n'est plus previsible),
   puis on la bascule de l'autre cote du curseur si la place manque. */
function showLineTooltip(txt, clientX, clientY){
    var t = getLineTooltip();
    t.textContent = txt;
    t.style.display = 'block';
    t.style.left = '0px';
    t.style.top  = '0px';

    var r = t.getBoundingClientRect();
    var marge = 8, dx = 14;
    var x = clientX + dx, y = clientY + dx;

    // d'abord on bascule de l'autre cote du curseur : mieux vaut passer a
    // gauche ou au-dessus que recouvrir ce qu'on est en train de designer
    if(x + r.width  > window.innerWidth  - marge) x = clientX - r.width  - dx;
    if(y + r.height > window.innerHeight - marge) y = clientY - r.height - dx;

    /* ⚠️ PUIS ON BORNE POUR DE BON. La bascule ne suffit pas : elle suppose
       que le curseur, lui, est dans la fenetre. Le canvas de la matrice fait
       un millier de pixels de haut et debordait de la fenetre a la
       verticale — pres du bas, la bascule renvoyait l'infobulle a une
       position encore hors champ. Les deux bornes dures ferment le cas. */
    var maxX = window.innerWidth  - r.width  - marge;
    var maxY = window.innerHeight - r.height - marge;
    if(x > maxX) x = maxX;
    if(y > maxY) y = maxY;
    if(x < marge) x = marge;
    if(y < marge) y = marge;

    t.style.left = Math.round(x) + 'px';
    t.style.top  = Math.round(y) + 'px';
}
function hideLineTooltip(){
    var t = document.getElementById('lineTooltip');
    if(t) t.style.display = 'none';
}
function selectData(evt){

    var cv = cv_nav.getBoundingClientRect();
    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    for (var i=0; i<menu.length; i++) {

        if(mouseX>=menu[i].x && mouseX<=menu[i].x+bw && mouseY>=menu[i].y && mouseY<=menu[i].y+bh){

            if(!init)getData();
            
            if(i==0 && !menu[0].state){ //first btn

                if(sl_years.length>0){
                    resetMenu();
                    sl_years=[];
                    inBtwYears=[];
                }

	            activateBtn(i);

                resetInBetweenBtn(colors[3]);
                updateSlData();

            } else if(!menu[i].state){ //not already activated

            	menu[0].state = false; //reset first btn

                if(btn01.state){ //red btn

                    if(sl_years.length==2) {

                        editSlYearsArray();
                    
                    } else if(sl_years.length<2){ //reset first btn + in between
                        menu[0].state=false;
                        resetInBetweenBtn(colors[0]);
                    }
                    sl_years.push(menu[i].id);
                
                } else {

	                resetMenu();
	                sl_years=[];
	                sl_years.push(menu[i].id);
                
            	}
                       
	            activateBtn(i);

	            if(sl_years.length==2)checkInBetweenBtn();
    			else inBtwYears=[];

	            updateSlData();

	            break;

	        } else if(menu[i].state && sl_years.length==2){
	        	ctx_nav.fillStyle=c_sl;
           		ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
           		btnIdToEdit = i;
	        }
        }
    }

    // red btn
    if(mouseX>=btn01.x && mouseX<=btn01.x+bw && mouseY>=btn01.y && mouseY<=btn01.y+bh){

        btn01.state = !btn01.state;

        if(btn01.state){
            ctx_nav.fillStyle=colors[2];//red
            ctx_nav.fillRect(btn01.x, btn01.y, bw, bh);
        } else {
            ctx_nav.fillStyle=colors[6];//pink
            ctx_nav.fillRect(btn01.x, btn01.y, bw, bh);
            while(sl_years.length>1)editSlYearsArray();
            resetInBetweenBtn(colors[0]);

            inBtwYears=[];
            updateSlData();

        }

    }
}
function activateBtn(id){
	menu[id].state = true;
    ctx_nav.fillStyle=c_on;
    ctx_nav.fillRect(menu[id].x, menu[id].y, bw, bh);
}
function editSlYearsArray(){

	if(btnIdToEdit>-1){

		if(menu[btnIdToEdit].id===sl_years[1]) sl_years.pop();
		else sl_years.shift();

		menu[btnIdToEdit].state=false;
    	ctx_nav.fillStyle=colors[0];
    	ctx_nav.fillRect(menu[btnIdToEdit].x, menu[btnIdToEdit].y, bw, bh);
	    
	    btnIdToEdit=-1;
    
    } else { //first behavior when year to edit has not been previously selected
    	var y = sl_years.shift();
		var id = years.indexOf(y);

		menu[id].state=false;
    	ctx_nav.fillStyle=colors[0];
    	ctx_nav.fillRect(menu[id].x, menu[id].y, bw, bh);
    }
}
function checkInBetweenBtn(){

    ctx_nav.fillStyle=colors[2];
    ctx_nav.fillRect(btn01.x, btn01.y, bw, bh);

    var pt1, pt2;
    if(sl_years[0]<sl_years[1]){
        pt1 = sl_years[0];
        pt2 = sl_years[1];
    } else {
        pt1 = sl_years[1];
        pt2 = sl_years[0];
    }

    for (var i = 1; i < years.length; i++) {
        if((years[i]<pt1 || years[i]>pt2) && !menu[i].state){ //reset btn outside actual range
            ctx_nav.fillStyle=colors[0];
            ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
        }
    }

    var id1, id2;
    id1 = years.indexOf(pt1);
    id2 = years.indexOf(pt2);

    inBtwYears=[];

    while(id1<id2-1){ //set in between btns
        id1++;
        ctx_nav.fillStyle=colors[3];
        ctx_nav.fillRect(menu[id1].x, menu[id1].y, bw, bh);

        inBtwYears.push(menu[id1].id);
    }

    // }
}
function resetInBetweenBtn(c){
    for (var i=0; i<menu.length; i++) {
        if(!menu[i].state){
            ctx_nav.fillStyle=c;
            ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
        }
    }
}
function resetMenu(){
    for (var i=0; i<menu.length; i++) {
        menu[i].state=false;
        ctx_nav.fillStyle=c_off;
        ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
    }
}
function createMenu(){
    var arr=[];
    var xPos=10, yPos=13;
    for (var i=0; i<years.length; i++) {
        arr.push({x:xPos, y:yPos, id:years[i], state:false});
        xPos += 23;
    }
     return arr;
}
/* --- Etat documentaire de chaque edition ---------------------------------
   Ecrit le 2026-08-04, REFAIT LE 2026-08-07.

   Une courbe qui s'effondre apres 1995 se lit spontanement comme un concours
   qui decline. C'est faux : les editions de 1996 a 2008 comptent 500 a 633
   candidats au proces-verbal.

   ⚠️ CE LISERE ETAIT CODE EN DUR, ET IL EST DEVENU FAUX. Ses deux tableaux
      d'annees etaient releves a la main dans le fichier de suivi du
      depouillement. Ils decrivaient l'etat du DEPOUILLEMENT — un travail
      mene hors de la base — et non l'etat de la BASE. Le jour ou les
      constats d'huissier ont commence a etre verses, edition par edition,
      ils ont cesse de dire la verite : ils peignaient 1973-1994 en vert
      alors que seules 1973-1987 sont attestees.

      Et ils auraient menti a nouveau a chaque versement. La provenance est
      donc LUE DANS LA BASE (`case 12` de retrieve_data.php), et le liseré
      se corrige tout seul.

   TROIS ETATS, ET PAS QUATRE. On en attendait quatre — le quatrieme aurait
   ete « le compte ne repose que sur les oeuvres archivees ». Le versement
   de la liste des candidats l'a VIDE : plus aucune edition n'est dans ce
   cas. Un etat qu'aucune donnee ne porte n'a pas a figurer dans une
   legende.

     - CONSTAT (emeraude) : un constat d'huissier est en base et a ete lu en
       entier. Le compte est atteste ligne a ligne. Quinze editions,
       1973-1987, et le nombre monte a chaque versement.
     - DEPOUILLEMENT (carotte) : pas de constat, mais un releve de
       proces-verbal a ete saisi. Sept editions, 1988-1994.
     - LISTE (bleu) : le compte repose sur la liste des candidats et sur les
       oeuvres archivees. Quatorze editions, 1996-2009. Six de leurs PV ont
       ete depouilles sans jamais etre importes — 1996, 1999, 2005, 2006,
       2007, 2008 — et les huit autres n'ont pas ete depouilles du tout.
       Cette distinction-la n'est pas dans le liseré : elle dit ce qui
       RESTE A FAIRE, pas ce que le compte VAUT, et melanger les deux sur
       un meme canal de couleur les rendrait illisibles tous les deux. Elle
       est dans le texte de la legende.

   Le liseré est porte AU-DESSUS du carre de l'edition, et non par le carre
   lui-meme : celui-ci encode deja la selection et est repeint par une
   dizaine de fonctions. Le liseré vit en dehors de son rectangle, donc il
   survit a tous ces repeints. Au-dessus et non en dessous : sous les carres
   (y=13, hauteur 15) courent les etiquettes d'annee, dont le texte de 9 px
   remonte jusqu'a y=30 — un liseré la se serait pose sur les chiffres. La
   bande y=8..11 est libre.

   Detail et chiffres : claude/Provenance_des_participations_1973_2009.md et
   PV/phase2_liste_cc4160.md. */

var pvByYear = {};        // annee -> {constat, inconnu, liste, inexplique}
var pvLoaded = false;

/* Le seuil. `inexplique` vaut 10 a 62 de 1988 a 1994, et ZERO partout
   ailleurs — sauf UNE ligne en 2005, Philippe Auclair (fiche 1426), deja
   nommee au §3 de Provenance_des_participations. Entre 1 et 10 il y a un
   ordre de grandeur : n'importe quelle valeur de 2 a 9 donne le meme
   decoupage. On prend 5, au milieu, et on ecrit pourquoi. */
var PV_SEUIL_DEPOUILLEMENT = 5;

function pvState(year){
    var d = pvByYear[year];
    if(!d) return 'inconnu';                              // pas encore charge
    if(d.constat > 0)                        return 'constat';
    if(d.inexplique >= PV_SEUIL_DEPOUILLEMENT) return 'depouillement';
    return 'liste';
}
function drawPvStrip(menu){
    for (var i = 1; i < menu.length; i++) {          // i=0 : le bouton "all"
        var st = pvState(menu[i].id);
        ctx_nav.fillStyle = (st === 'constat')       ? '#2ecc71'   // emeraude
                          : (st === 'depouillement') ? '#e67e22'   // carotte
                          : (st === 'liste')         ? '#5dade2'   // bleu clair
                          :                            '#7f8c8d';  // asbeste
        ctx_nav.fillRect(menu[i].x, menu[i].y - 5, bw, 3);
    }
}
/* Charge la provenance et REPEINT LE SEUL LISERE. Pas drawMenu() : celui-ci
   redessine les carres, et il est appele avant que l'utilisateur ait pu
   selectionner quoi que ce soit — mais la reponse, elle, arrive apres. Le
   liseré vivant hors des rectangles, le repeindre seul ne touche a aucun
   etat de selection. Si l'appel echoue, tout reste gris : la page marche,
   et elle ne pretend rien savoir. */
function loadPvProvenance(){
    $.ajax({
        url: 'php/retrieve_data.php',
        type: "POST",
        data: {case:12}
    }).done(function(str){
        if(!str) return;
        var f = str.split("%");
        for (var i = 0; i + 4 < f.length; i += 5) {
            pvByYear[parseInt(f[i], 10)] = {
                constat:    parseInt(f[i+1], 10),
                inconnu:    parseInt(f[i+2], 10),
                liste:      parseInt(f[i+3], 10),
                inexplique: parseInt(f[i+4], 10)
            };
        }
        pvLoaded = true;
        drawPvStrip(menu);

        /* ⚠️ ET LE GRAPHE, S'IL PORTE LUI AUSSI UN LISERE. Les deux requetes
           partent ensemble au chargement ; rien ne garantit laquelle repond la
           premiere. Quand le `case 12` arrivait APRES le `case 10`, la matrice
           etait deja dessinee et son liseré restait entierement gris —
           « provenance inconnue » — pendant que la bande de navigation, elle,
           affichait la bonne. Deux liserés cote a cote qui se contredisent, et
           un gris qui ne figure meme pas dans la legende. Le defaut
           s'effacait au premier survol (qui redessine), donc il disparaissait
           des qu'on allait le verifier.

           Seule la matrice est concernee — le line chart ne porte pas de
           liseré —, d'ou le test sur la methode plutot que sur la vue : la
           page n'a pas a savoir quel graphe elle tient. */
        if(myLineChart && typeof myLineChart.drawProvenanceStrip === 'function'
                       && typeof myLineChart.draw === 'function'){
            myLineChart.draw();
        }
    });
}
function drawMenu(menu){

    for (var i = 0; i < menu.length; i++) {
        ctx_nav.lineWidth="0.75";
        ctx_nav.strokeStyle=COLORS[0];
        ctx_nav.strokeRect(menu[i].x, menu[i].y, bw, bh);
        ctx_nav.fillStyle=colors[0];
        ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
    }

    drawPvStrip(menu);

    ctx_nav.lineWidth="0.75";
    ctx_nav.strokeStyle=colors[2];
    ctx_nav.strokeRect(btn01.x, btn01.y, bw, bh);

    if(btn01.state)ctx_nav.fillStyle=colors[2];//red
    else ctx_nav.fillStyle=colors[6];//pink

    ctx_nav.fillRect(btn01.x, btn01.y, bw, bh);

    //labels sous les carres : "all", '73..'09, "span"
    ctx_nav.font="9px 'Helvetica Neue', Helvetica, Arial, sans-serif";
    ctx_nav.fillStyle="#ecf0f1";
    ctx_nav.textAlign="center";

    for (var i = 0; i < menu.length; i++) {
        var label = (i===0) ? "all" : "'" + menu[i].id.toString().substring(2, 4);
        ctx_nav.fillText(label, menu[i].x + bw/2, 38);
    }
    ctx_nav.fillText("span", btn01.x + bw/2, 38);

    ctx_nav.textAlign="start";

}
//---------------------------------------//
function getData(){

    init = true;
	
    document.getElementById('get_all').removeEventListener("click", getData);

	$("#get_all").toggleClass('b_off b_on');
    $("#launcher").hide();

	$.ajax({                                      
        url: 'php/retrieve_data.php',       
        type: "POST",
        data: {case:10} 
    }).done(function(str) {

        numComposersInCapsules=0;
    	allData = str.split("%");

        /*var id=allData[i];
        var ctry=allData[i+1];
        var ctry_id=allData[i+2];
        var counter=allData[i+3];
        var editions=allData[i+4];
        var iso=allData[i+5];*/

        for (var i=0; i<allData.length-5; i+=6) {
            var id = allData[i];
            var numTitles = allData[i+3];
            numTitlesByArtist[id]=numTitles;

            var ctry_id=allData[i+2];
            
            if(numCpByCountry[ctry_id])numCpByCountry[ctry_id].t++;
            else numCpByCountry[ctry_id]={t:1, c:0};

            if(numTitles>0){
                numCpByCountry[ctry_id].c++;
                numComposersInCapsules++;
            }

        }

    	var txt = "no selection — click the chart to list the composers of a country";
        $("#selection").empty().append('<p>');
        $("#selection p").append(txt);

        /* « 1259 / 2550 » ne disait pas ce qu'il comptait : deux nombres
           sous un titre, a charge pour le lecteur de deviner lequel est le
           tout. Les DEUX VARIABLES SONT INCHANGEES — numComposersInCapsules
           est compte juste au-dessus, num se deduit de la longueur du flux
           (six champs par compositeur) — seule la legende s'ajoute. */
        var num = allData.length / 6;
        var txt2 = numComposersInCapsules+ " / " + num + " composers with archived works";
        $("#info p:eq(0)").text(txt2);

        //TODO REMOVE 
        activateBtn(0);
        resetInBetweenBtn(colors[3]);
        updateSlData();

    });
}