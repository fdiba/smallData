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

var myLineChart;

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
   NOMS EN CLAIR OU NOMS MASQUES — 2026-08-07

   Par defaut, un compositeur SANS oeuvre archivee n'est ni nomme ni
   cliquable : la liste n'affiche que ses initiales, les autres lettres
   remplacees par des etoiles (« F****** D****** »). Les compositeurs qui
   ONT une oeuvre dans les capsules restent nommes et cliquables : leur nom
   est deja publie avec l'oeuvre, ailleurs sur le site.

   Le masque tombe quand l'adresse porte `?v=all` — c'est la vue de
   travail, celle qui sert a relire le depouillement des proces-verbaux.

   ⚠️ C'EST UN AFFICHAGE, PAS UNE PROTECTION. Le flux qui alimente la page
      (php/retrieve_data.php, case 0) continue de livrer les noms complets,
      et il suffit de le lire pour les voir. Ce qui est fait ici, c'est
      qu'un nom releve dans un proces-verbal — une candidature, pas une
      oeuvre — ne se lise plus par-dessus l'epaule de qui regarde le
      graphique. Si l'exigence devient de ne PAS transmettre ces noms, elle
      se tient du cote de PHP, pas ici.

   Une expression reguliere plutot que URLSearchParams : le reste de la
   page est ecrit en ES5 et charge jQuery 3.1, on ne change pas le socle
   pour lire un parametre. */
var SHOW_ALL_NAMES = /(^|[?&])v=all([&#]|$)/.test(window.location.search || '');

/* Initiales + etoiles. TOUT ce qui suit la premiere lettre d'un mot devient
   une etoile, y compris les traits d'union et les apostrophes :
   « Jean-Pierre Dupont » -> « J********** D***** ». Les garder dessinerait
   la forme du nom (« J***-P***** D***** »), ce qui, sur un corpus ou les
   noms composes sont rares, en designe deja quelques-uns. */
function maskName(txt){
    return String(txt == null ? '' : txt)
        .split(/\s+/)
        .filter(function(mot){ return mot.length > 0; })
        .map(function(mot){
            return mot.charAt(0) + new Array(mot.length).join('*');
        })
        .join(' ');
}

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
function setCanvasWidthAndHeight(displaySeveralYears){
    if(displaySeveralYears){
        canvas.width=maxChartWidth;
        canvas.height = 600;
    }
    else{
        canvas.width=900;
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

    $.ajax({                                      
        url: 'php/retrieve_data.php',       
        type: "POST",
        data: { aId: aId, case:1 } 
    }).done(function(str) {

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
function updateSlData(){

	var tmpY = sl_years.concat(inBtwYears);

    if(sl_years.length==1 && !btn01.state){ //bar chart --> display only one year

        var f_data=[];

        for (var i=0; i<allData.length-5; i+=6) {

            var arr = allData[i+4].split(",");
            var count = allData[i+3];

            for (var j=0; j<arr.length; j++) {
                if(tmpY.includes(parseInt(arr[j]))){

                    if(takeCountIntoAccount){
                        if(count>0)f_data.push({id: allData[i], ctry: allData[i+1], cId: allData[i+2], edition: allData[i+4]});
                    } else {
                        f_data.push({id: allData[i], ctry: allData[i+1], cId: allData[i+2], edition: allData[i+4]});
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
    }
}
function getEditionsAsArrOfInts(str){
    return str.split(",").map(Number);
}
function generateLineGraph(data, minYear, maxYear){ //display several years TODO

    $("#composers").empty();

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

    var inf2="";
    var maxY=Math.max(sl_years[0], sl_years[1]);
    var minY=Math.min(sl_years[0], sl_years[1]);
    if(maxY<1996)inf2 = minY.toString() + "-" + maxY.toString() + ": complete data";
    else if(sl_years.length===2)inf2 = minY.toString() + "-" + maxY.toString() + ": incomplete data";
    else inf2 = "1973-2009: incomplete data";
    $("#info p:eq(2)").text(inf2);

    myLineChart.drawLegend();

    var txt='<p>'+myLineChart.data.length.toString()+ " countries</p>";
    $("#selection").empty();
    $("#selection").append(txt);

}
function add(a, b) {
    return a + b;
}
function generateBarChart(data){ //display only one year TODO

    $("#composers").empty();

    setCanvasWidthAndHeight(false);

	var arr=[];

	for (var i=0; i<data.length; i++) {

		var ctry = data[i].ctry;

		if(arr.length<1) {
			arr.push({label: ctry, value: 1});
		} else {

			for (var j=0; j<arr.length; j++) {

				var added=false;

				if(ctry == arr[j].label){
					arr[j].value += 1;
					added=true;
					break; 
				}
			}
			if(!added)arr.push({label: ctry, value: 1});
		}
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
    $("#selection").empty();
    $("#selection").append('<p>');
    $("#selection p").append(arr.length+ " countries: ");
	for (var k=0; k<arr.length; k++) {
		max = Math.max(max, arr[k].value);
        var txt=arr[k].label+" "+arr[k].value;
        if(k<arr.length-1)txt+=' - ';
        $("#selection p").append(txt);
	}
    

    var increment = Math.round(max/10);
    // if(increment%2)console.log(increment-=1);
    if(max<20)increment=2; //1995

    var bWidth = map(arr.length, 30, 10, 20, 40)

	new BarChart({canvasId: "myCanvas", data: arr, barWidth: bWidth, minValue: 0, maxValue: max+1, gridLineIncrement: increment});
}
//---------------------------------------//
function editData(evt){

    var cv = canvas.getBoundingClientRect();
    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    //linechart
    if(sl_years.length===2 || menu[0].state){
        if(mouseX<myLineChart.w)myLineChart.requestData(mouseX, mouseY);
        else myLineChart.editData(mouseX, mouseY);
    }

}
//survol du line chart : surligne la ligne la plus proche, attenue les autres,
//et affiche le nom du pays survole a cote du curseur
function hoverData(evt){
    if(!myLineChart){ hideLineTooltip(); return; }
    if(!(sl_years.length===2 || menu[0].state)){ hideLineTooltip(); return; }   //uniquement en mode line chart
    var cv = canvas.getBoundingClientRect();
    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;
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
        t.style.cssText = 'position:fixed;pointer-events:none;z-index:1000;display:none;'
            + 'background:rgba(44,62,80,.95);color:#f1c40f;font-weight:600;'
            + 'font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;font-size:12px;'
            + 'padding:3px 7px;border-radius:3px;border:1px solid #f1c40f;white-space:nowrap;';
        document.body.appendChild(t);
    }
    return t;
}
function showLineTooltip(txt, clientX, clientY){
    var t = getLineTooltip();
    t.textContent = txt;
    t.style.left = (clientX + 14) + 'px';
    t.style.top  = (clientY + 14) + 'px';
    t.style.display = 'block';
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
/* --- Etat documentaire de chaque edition (2026-08-04) ---------------------
   Une courbe qui s'effondre apres 1995 se lit spontanement comme un concours
   qui decline. C'est faux : les editions de 1996 a 2008 comptent 500 a 633
   candidats au proces-verbal. Ce qui manque, ce sont les SAISIES.

   Trois etats, releves dans sources/attribution des proces verbaux.xlsx :

     - VERSE      : PV depouille et entre en base — le compte est fiable ;
     - NON VERSE  : PV depouille mais jamais importe (6 editions) — la courbe
                    ne montre alors que les auteurs d'oeuvres programmees ;
     - ABSENT     : aucun PV depouille (8 editions, dont 2002 signale
                    defectueux dans le fichier).

   L'information est portee par un liseré AU-DESSUS du carre de l'edition, et
   non par le carre lui-meme : celui-ci encode deja la selection et est repeint
   par une dizaine de fonctions. Le liseré vit en dehors de son rectangle, donc
   il survit a tous ces repeints. Au-dessus et non en dessous : sous les carres
   (y=13, hauteur 15) courent les etiquettes d'annee, dont le texte de 9 px
   remonte jusqu'a y=30 — un liseré la se serait pose sur les chiffres. La
   bande y=8..11 est libre. Aucune ligne ni couleur n'est prise sur les pays —
   c'est la contrainte posee : le chart en porte deja soixante-dix.

   Detail et chiffres : claude/Provenance_des_participations_1973_2009.md. */
var PV_NON_VERSE = [1996, 1999, 2005, 2006, 2007, 2008];
var PV_ABSENT    = [1997, 1998, 2000, 2001, 2002, 2003, 2004, 2009];

function pvState(year){
    if(PV_ABSENT.indexOf(year) >= 0)    return 'absent';
    if(PV_NON_VERSE.indexOf(year) >= 0) return 'nonverse';
    return 'verse';
}
function drawPvStrip(menu){
    for (var i = 1; i < menu.length; i++) {          // i=0 : le bouton "all"
        var st = pvState(menu[i].id);
        ctx_nav.fillStyle = (st === 'verse')    ? '#2ecc71'    // emeraude
                          : (st === 'nonverse') ? '#e67e22'    // carotte
                          :                       '#7f8c8d';   // asbeste
        ctx_nav.fillRect(menu[i].x, menu[i].y - 5, bw, 3);
    }
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

    	var txt = "no selection — click a point on a line to list the composers of a country";
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