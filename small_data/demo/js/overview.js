var init=false;
var allData;
var numComposersInCapsules;

var cookies=[];

var canvas, context;
var rectangles=[];
var titles=[];

var xRightOffset;

var nAId;
var avg_sat, max_sat, min_sat;
var avg_lum=50, max_lum=90, min_lum=20;

var tNoise;

//-------
var xPos, yPos;
var xDist, yDist;

var minHeight;

var rWidth, rHeight;

var xLeftOffset;
var pAId;

var h_colors=["#ecf0f1"];//grey clouds
var colors=[{h:203, s:4, l:77}]; //#bdc3c7 grey silver

///------
var isAnimated;
var animation2;

var maxWidth;

//---------- sma (moteur : voir js/overview_sma.js) -------------//
var count002=0;

//---------- query results -------------//
var composers=[];
var newResults=false;

/* =======================================================================
   LE PLANCHER DU FILTRE, ET LE FILTRE DE LA RECHERCHE (2026-08-07)

   Hors vue de travail (`?v=all` — voir SHOW_ALL_NAMES dans
   js/functions.js), cette page ne montre plus les compositeurs dont la
   base ne connait qu'une CANDIDATURE : « num of records » ne descend plus
   sous 1, et la recherche par nom ne rend que les fiches ayant au moins
   une oeuvre archivee.

   ⚠️ CE QUE CE FILTRE CACHE, ET CE QU'IL NE DOIT PAS CACHER. La liste de
      resultats porte trois etats, et ils ne se valent pas :

        `12` — dans l'index, douze oeuvres archivees   -> montre
        ` 0` — dans l'index, AUCUNE oeuvre archivee    -> NON LISTE
        `-1` — pas dans l'index du tout                -> montre

      Le `-1` n'est pas un compte, c'est une absence de ligne de
      participation : ces fiches sont entrees par les CATALOGUES, elles ont
      donc des oeuvres — le §3 de claude/Overview_le_-1_de_la_recherche.md
      les compte, et la mesure refaite sur la base le 2026-08-07 donne
      **706 fiches hors index, 706 avec au moins une oeuvre, zero sans**.
      Les retenir aurait repondu « no result » a qui cherche Jean-Luc
      d'Aleo — un laureat du concours, dont l'oeuvre est affichee deux
      pages plus loin. C'est exactement l'enonce faux que le §6 du meme
      document avait refuse le 2026-08-03.

   ⚠️ ET CETTE EXACTITUDE EST MESUREE, PAS GARANTIE. Rien dans le schema
      n'interdit une fiche sans participation ET sans oeuvre : elle
      s'afficherait alors comme « not in this index » alors qu'elle n'a
      rien d'archive. Le flux de la recherche (case 28) ne porte que
      l'identifiant et le nom — il faudrait lui ajouter le compte d'oeuvres
      pour trancher au client, et cette longueur d'enregistrement est
      codee en dur des DEUX cotes (`numOfElements` ici, l'ordre des
      `array_push` la-bas). Le controle a refaire tient en une requete :
        SELECT COUNT(*) FROM imeb_artist a
         WHERE NOT EXISTS (SELECT 1 FROM imeb_participation p WHERE p.id_artist=a.id)
           AND NOT EXISTS (SELECT 1 FROM imeb_music        m WHERE m.id_artist=a.id);
      Tant qu'elle rend 0, la regle ci-dessous est exacte. */
var NUM_RECORDS_MIN = SHOW_ALL_NAMES ? 0 : 1;

/* Le plancher, applique en UN SEUL endroit — toute lecture du champ passe
   par ici. Les quatre chemins qui posaient une valeur (le chargement, le
   bouton du filtre, la touche Entree, et la reconstruction declenchee par
   un resultat de recherche) l'auraient sinon fait chacun a sa facon, et le
   dernier — `$('#numOfRecords').val(0)` dans showAndHighlightComposer() —
   remettait le champ a 0 SANS QUE PERSONNE NE LE DEMANDE : un filtre qui
   se defait tout seul est precisement ce qui rendrait la regle inutile.
   Une valeur illisible (champ vide, texte) retombe sur le plancher, jamais
   sur 0. */
function clampNumOfRecords(n){
    var v = parseInt(n, 10);
    if(!isFinite(v)) v = NUM_RECORDS_MIN;
    return Math.max(NUM_RECORDS_MIN, v);
}
/* Lit le champ, le corrige s'il le faut — le champ AFFICHE alors ce qui est
   reellement applique. Ecrire 0 et voir 1 revenir est le seul retour dont
   l'utilisateur dispose ; laisser 0 dans la case en filtrant a 1 aurait
   menti sur ce que la grille montre. */
function readNumOfRecords(){
    var v = clampNumOfRecords($('#numOfRecords').val());
    if(String($('#numOfRecords').val()) !== String(v)) $('#numOfRecords').val(v);
    return v;
}
/* Une ligne de resultat est-elle affichee ? Voir le tableau des trois etats
   ci-dessus. NaN est traite comme 0 : un compte illisible ne doit pas faire
   apparaitre un nom par accident. */
function resultIsListed(count){
    if(SHOW_ALL_NAMES) return true;
    var c = parseInt(count, 10);
    if(!isFinite(c)) c = 0;
    return c !== 0;
}

window.onload = function() {

	//------------ navigation ------------//

	isAnimated = false;
	max_sat = 50;
	avg_sat = max_sat;
	min_sat = 0;
	tNoise = 0;    

    canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');

    //----------------------------------//

    //hide animation
    $('#anim').hide();
 
    //----------------------------------//

    // SMA de l'overview : agents = compositeurs consultes, regroupes par pays
    // (moteur auto-contenu dans js/overview_sma.js). Meme taille de canvas.
    OverviewSMA.init(document.getElementById('sma'));

    //----------------------------------//

    document.getElementById('get_all').addEventListener("click", getData);

    //----------------------------------//

    document.getElementById('searchBoxBtn').addEventListener("click", getSearchTerms);
    // valider par la touche Entree quand le champ "composer name" a le focus
    document.getElementById('searchTerms').addEventListener("keydown", function(e){
        if(e.key === "Enter" || e.keyCode === 13){ e.preventDefault(); getSearchTerms(); }
    });

    //----------------------------------//

    document.getElementById('filtersBtn').addEventListener("click", filterData);
    // valider par la touche Entree quand le champ "num of records >=" a le focus
    document.getElementById('numOfRecords').addEventListener("keydown", function(e){
        if(e.key === "Enter" || e.keyCode === 13){ e.preventDefault(); filterData(); }
    });
    /* Le champ se corrige aussi quand on le QUITTE sans valider : sans cela,
       une case affichant 0 resterait sous les yeux a cote d'une grille
       filtree a 1, et c'est la case qu'on croit. */
    document.getElementById('numOfRecords').addEventListener("blur", function(){
        readNumOfRecords();
    });

    //----------------------------------//

    pAId=-1;
    xLeftOffset = 0;
    xDist = 11, yDist = 11;
    rWidth = 10, rHeight = 10;

    //-------- print -------//
    /*xDist = 33, yDist = 33;
    rWidth = 30, rHeight = 30;*/

    resetPositions();

    maxWidth = gridWidthAvailable();
    canvas.width = maxWidth;
    minHeight = 300;
    canvas.height = minHeight;


    context.fillStyle=h_colors[0];
    context.fillRect(0, 0, canvas.width, canvas.height);

    xRightOffset = 10;

    $("#titles").css({"clear": "both"});

    // la note "Coverage" n'apparait que lorsque num of records < 1 (defaut = 1)
    updateCoverageNote(readNumOfRecords());

    /* La puce « a result marked not in this index… » et celle du filtre
       restent vraies dans les deux vues ; celle-ci ne vaut que pour la vue
       publique — en vue de travail, la recherche liste aussi les candidats
       sans oeuvre, et la puce serait fausse. */
    if(SHOW_ALL_NAMES) $('#lg-archived-only').hide();

    /* Fiche ISNI du compositeur selectionne (js/isni_box.js, partage avec
       euphonies, catalog et award-winning_works).

       En FLUX, dans #isniColumn : Overview n'a pas de gouttiere libre — la
       grille occupe toute la largeur moins la colonne d'information — et une
       fiche flottante recouvrirait la boite violette. Elle se pose donc sous
       la boite orange, et pousse la suite au lieu de la masquer.

       NI `clickable` NI `watch` DEPUIS LE 2026-08-05, et c'est le meme
       changement vu de deux cotes.

       `clickable` designait le nom du compositeur, souligne de pointilles :
       il fallait deviner que le pointille cachait quelque chose, et le
       decouvrir en cliquant. La fiche s'affiche maintenant d'elle-meme des
       qu'un ISNI existe, repliee sur son identifiant — c'est l'ISNI, en titre
       de sa propre boite, qui est desormais le bouton. Rien a deviner.

       `watch` posait un observateur de mutations sur #selection pour refermer
       la fiche quand la selection changeait. Il n'a plus d'objet : la fiche
       n'est plus ouverte par un geste independant, elle est ecrite par
       renderSelection() en meme temps que la boite orange, donc elle ne peut
       plus se desynchroniser d'elle. Un observateur en plus n'aurait fait que
       refermer, une micro-tache plus tard, la fiche qu'on venait d'ouvrir.

       L'appel reste, pour le seul `into` : c'est lui qui declare le
       conteneur et bascule la fiche en mode flux. */
    if(typeof enableIsniPanel === 'function'){
        enableIsniPanel({ into: 'isniColumn' });
    }

    bindGridReflow();

    setTimeout(getData(), 5000);

    //getData();

}

/* =======================================================================
   LA LARGEUR DISPONIBLE POUR LA GRILLE, ET POURQUOI ELLE SE MESURE

   `$(document).width()` etait lu ici jusqu'au 2026-08-05. C'est la largeur
   du DOCUMENT, pas celle de la fenetre : des que le contenu deborde, elle
   vaut le debordement. Tant que la mesure n'etait faite qu'une fois, au
   chargement, la difference ne se voyait pas. Elle devient une BOUCLE des
   qu'on remesure : une grille trop large elargit le document, le document
   elargi donne une largeur disponible plus grande, la grille s'elargit
   encore. `clientWidth` de l'element racine est la bonne mesure — la zone
   d'affichage, barre de defilement deduite.

   Le 525 retire n'est plus un nombre en dur : c'est la largeur REELLE de la
   colonne de droite, mesuree, plus la gouttiere de 5px que lui donne la CSS.
   Elle valait 500+25 par estimation ; elle vaut aujourd'hui 350 + marges, et
   elle changera encore si la colonne change. Un nombre en dur aurait laisse
   la grille mordre sur la colonne ou lui abandonner de la place sans que
   rien ne le signale.

   Plancher a 120px : en dessous, la grille n'est plus une grille mais une
   colonne de onze carres, et la page devient illisible avant d'etre
   inutilisable. Le debordement horizontal reprend alors le relais — c'est le
   seul cas ou on l'accepte.

   PLAFOND A 1500px, et il ne s'agit pas de la meme chose. Le plancher evite
   une degenerescence ; le plafond evite une largeur qui reste techniquement
   correcte mais cesse d'etre LISIBLE. Passe 135 carres par rangee, l'oeil
   perd la ligne en revenant a gauche — c'est la raison pour laquelle un
   journal met des colonnes plutot qu'une seule mesure sur toute la page, et
   elle vaut ici : chaque rangee est une liste qu'on parcourt.

   1500 n'est pas rond par hasard : 1500 + 10 d'ecart + 355 de colonne = 1865,
   soit la bande entiere sur un ecran de 1920. Au-dela, l'espace gagne va a la
   marge droite plutot qu'a la grille. Les deux colonnes restent calees a
   GAUCHE : centrer la bande deplacerait la grille sur les ecrans larges, et
   une dataviz qui bouge quand on agrandit la fenetre est plus deroutante
   qu'une marge inegale.
   ======================================================================= */
var GRID_MAX_WIDTH = 1500;

function gridWidthAvailable(){

    /* On mesure #board et NON la fenetre. #board est un bloc : sa largeur est
       celle de son conteneur, elle ne depend pas de ce qu'il contient — donc
       pas de boucle si la grille deborde. Et elle a deja deduit le padding de
       #content (10px a gauche, 5px a droite), qu'une mesure de la fenetre
       aurait oublies : la grille mordait alors de quinze pixels sur la marge
       droite. */
    var board = document.getElementById('board');
    var dispo = board ? board.clientWidth : 0;
    if(!dispo) dispo = document.documentElement.clientWidth || $(window).width();

    var col = document.getElementById('right_col');
    var w   = col ? col.offsetWidth : 0;
    if(!w) w = 350;                       // colonne pas encore mesurable

    // 5px de gouttiere (#right_col margin-left) + 5px de marge droite du
    // canvas (#myCanvas margin) : les deux ecarts que la CSS pose entre les
    // deux colonnes et qu'il faut donc retrancher.
    dispo -= w + 10;

    return Math.max(120, Math.min(GRID_MAX_WIDTH, Math.round(dispo)));
}

/* Le recalcul au redimensionnement. La grille se re-repartit sur la nouvelle
   largeur : elle change de forme, mais la colonne de droite reste a droite,
   ce qui etait le defaut a corriger — avec des flottants et une largeur figee
   au chargement, elle passait sous la grille des que la fenetre retrecissait.

   TEMPORISE (150 ms). Un redimensionnement a la souris emet des dizaines
   d'evenements par seconde et chaque recalcul reconstruit les ~5 700
   rectangles de l'index : sans temporisation la fenetre devient poisseuse
   pendant qu'on la tire.

   LA SELECTION EST RETABLIE APRES COUP. Les rectangles sont recrees, donc
   redessines a leur couleur de base : le compositeur selectionne perdrait
   son marquage blanc. On le repose. Le surlignage JAUNE d'une recherche par
   nom, lui, n'est PAS retabli — il tient a une liste de resultats et non a
   l'etat de la page, et le reconstruire demanderait de rejouer la requete.
   C'est une limite assumee, ecrite ici pour ne pas etre redecouverte comme
   un bug. */
var gridReflowTimer = null;
var gridReflowBound = false;

function bindGridReflow(){
    if(gridReflowBound) return;
    gridReflowBound = true;
    $(window).on('resize.overviewgrid', function(){
        if(gridReflowTimer) clearTimeout(gridReflowTimer);
        gridReflowTimer = setTimeout(reflowGrid, 150);
    });
}

function reflowGrid(){

    gridReflowTimer = null;

    // rien a re-repartir tant que les donnees ne sont pas arrivees
    if(!allData || !rectangles.length) return;

    var w = gridWidthAvailable();
    if(w === maxWidth) return;            // largeur inchangee : ne rien refaire

    maxWidth = w;

    /* ⚠️ readNumOfRecords() ET NON parseInt() : ce chemin-ci est declenche
       par un REDIMENSIONNEMENT de la fenetre. Lu brut, un champ vide ou a 0
       aurait reconstruit la grille entiere — filtre leve — sans qu'aucun
       geste ne l'ait demande. Le plancher doit tenir surtout la ou personne
       ne regarde. */
    var n = readNumOfRecords();
    if(n >= 1) processData002(n);
    else       processData();

    // le compositeur selectionne garde son marquage
    if(pAId >= 0) processAllRectWhithId(pAId);
}

function drawRect(x, y, c){
    context.fillStyle=c;
    context.fillRect(x, y, rWidth, rHeight);
}
/* Le repli de la boite violette (« N archived works », liste depliable) a
   d'abord ete ecrit ici, puis DEPLACE dans js/functions.js : Network porte la
   meme boite, construite par la meme fonction partagee, et une seconde copie
   n'aurait pas survecu a la premiere correction faite d'un seul cote. Voir
   l'en-tete de displayTitlesInfosGN() — et css/main.css pour les styles. */

/* Le contenu de la boite orange, a partir de la reponse de retrieve_data.php
   (case 5), decoupee sur '%' :

     arr[0] prenom   arr[1] nom   arr[2] code pays   arr[3] editions
     arr[4] ISNI — champ AJOUTE EN FIN, vide quand la fiche n'en a pas
            (les quatre premiers sont lus par position : ajouter au milieu
            aurait casse l'affichage en silence)

   REPLIEE PAR DEFAUT depuis le 2026-08-05. L'en-tete porte ce qui identifie
   la personne et rien de plus — « Prenom Nom ISO3 | n editions » —, la liste
   des annees passe sous le pli. Motif : neuf annees (Mazurek, Rampazzi)
   faisaient une boite de trois lignes qui repoussait la fiche ISNI et la
   liste des oeuvres vers le bas a chaque clic sur la grille, et le compte
   — la seule information qu'on lit vraiment d'un coup d'oeil — se perdait
   dans l'enumeration.

   LE NOM N'EST PLUS CLIQUABLE. Il l'etait, souligne de pointilles, et il
   ouvrait la notice ISNI : il fallait deviner. La fiche s'affiche desormais
   d'elle-meme des qu'un ISNI existe (voir renderSelection), et c'est
   l'identifiant, en titre de sa propre boite, qui se deplie.

   Fonction a part, et non inline dans le rappel AJAX, pour etre testable
   hors navigateur (test_selection.js) — c'est le seul endroit de la page qui
   construit du HTML a partir de la base, donc le seul ou un echappement
   oublie se verrait. Tout passe par esc() : .text() le faisait pour nous,
   .html() ne le fait plus.

   Le code pays est celui servi par le PHP : iso3, a defaut iso2 (l'Ecosse
   n'a pas d'iso3 et affiche GB), a defaut le nom du pays. */
function selectionHtml(arr){

    var who = $.trim((arr[0] || '') + ' ' + (arr[1] || ''));
    var eds = arr[3] || '';

    /* Le pays, et devant lui le pays d'origine quand la base en porte un —
       « ARG / FRA », dans l'ordre de la BnF (origine d'abord, les deux a
       egalite). Codes ISO3 des deux cotes : cette boite parle deja en codes,
       on ne melange pas les vocabulaires. Voir countryLineHtml() dans
       js/functions.js pour la version en noms complets des deux autres pages,
       et le meme commentaire sur ce que la colonne garantit (une origine, pas
       une naissance). */
    var ctry   = esc(arr[2] || '');
    var origin = esc($.trim(arr[5] || ''));
    var where  = (origin && ctry) ? (origin + ' / ' + ctry) : (origin || ctry);

    /* Le COMPTE d'editions, et non la liste : c'est lui qui tient sur la
       ligne d'en-tete, quel que soit le compositeur. Il se lit sur la liste
       affichee et non sur un champ separe — les deux se tromperaient
       separement, c'est la lecon de editionYears() dans js/functions.js, ou
       une annee repetee faisait compter deux fois une oeuvre programmee une
       seule fois. */
    var ans = [];
    var brut = ('' + eds).split(',');
    for(var i = 0; i < brut.length; i++){
        var a = $.trim(brut[i]);
        if(a) ans.push(a);
    }
    var n       = ans.length;
    var edLabel = n + ' edition' + (n === 1 ? '' : 's');

    /* Point median et non barre verticale : la barre est un separateur de
       CHAMPS, elle decoupe la ligne en cases de formulaire. Le point median
       separe des mentions d'une meme identite — c'est la ponctuation des
       notices d'autorite, et cette ligne en est une. */
    var head = $.trim(esc(who) + ' ' + where) + ' \u00b7 ' + edLabel;

    /* Repliee, la boite ne montre que cette ligne. La liste des annees, qui
       pouvait atteindre neuf entrees (Mazurek, Rampazzi) et passer a la ligne,
       descend sous le pli. Meme patron que la boite violette « N archived
       works » : en-tete-bouton, chevron, corps masque par .is-folded. */
    return '<p class="s-hd"><button type="button" class="s-toggle" aria-expanded="false">'
         + head + '<span class="s-caret" aria-hidden="true"></span></button></p>'
         + '<p class="s-bd">' + editionsHtml(eds, arr[6]) + '</p>';
}

/* Le pli de la boite orange. Delegue sur #selection : l'en-tete est
   reconstruit a chaque selection, un gestionnaire pose dessus serait a
   reposer a chaque fois. Meme raisonnement, et meme drapeau, que
   bindTitlesFold() dans js/functions.js.

   ICI et non dans functions.js : la boite violette est portee par deux pages
   (Overview et Network) et sa fonction de rendu est partagee ; la boite
   orange repliable n'existe que sur Overview. Le jour ou Network en veut une,
   c'est ce bloc qui migrera — pas une copie. */
var selectionFoldBound = false;

function bindSelectionFold(){
    if(selectionFoldBound) return;
    selectionFoldBound = true;
    $(document).on('click', '#selection .s-toggle', function(){
        var box    = $('#selection');
        var folded = box.hasClass('is-folded');
        box.toggleClass('is-folded', !folded);
        $(this).attr('aria-expanded', folded ? 'true' : 'false');
    });
}

/* Ecrit la boite orange pour un compositeur, et accorde la fiche ISNI a ce
   qu'elle dit.

   LES DEUX VONT ENSEMBLE, et c'est pourquoi ils sont dans la meme fonction.
   Auparavant la fiche s'ouvrait sur un clic dans la boite orange et se
   fermait sur un observateur de mutations pose sur #selection : deux
   mecanismes independants pour un seul fait — « la selection a change ».
   L'observateur a ete retire (voir l'appel a enableIsniPanel plus haut) ;
   c'est desormais cette fonction, et elle seule, qui tient les deux boites
   d'accord. Un compositeur sans ISNI retire la fiche du precedent au lieu de
   la laisser sous une boite orange qui parle de quelqu'un d'autre. */
function renderSelection(arr){

    bindSelectionFold();

    var who  = $.trim((arr[0] || '') + ' ' + (arr[1] || ''));
    var isni = $.trim(arr[4] || '');

    $('#selection').addClass('is-folded').html(selectionHtml(arr));

    /* La fiche ne REPETE PAS le nom : il est deja en toutes lettres dans la
       boite orange, juste au-dessus, et les deux boites se lisent comme un
       seul bloc. Son en-tete ne porte donc que l'identifiant — ce qu'elle
       apporte, et rien de ce qu'on sait deja. `showIsniBox` accepte un
       libelle en second argument, utile a une page ou la fiche serait loin de
       ce qu'elle nomme ; ici elle en est voisine.

       syncIsniBoxGN() est dans js/functions.js : Network et Line Charts font
       le meme geste, et trois copies de quatre lignes en auraient fait trois
       a corriger. */
    syncIsniBoxGN(isni);
}

/* Retour a l'etat neutre : plus de selection, donc plus de fiche. */
function clearSelection(txt){
    $('#selection').removeClass('is-folded').empty().append('<p>' + esc(txt) + '</p>');
    syncIsniBoxGN('');
}
/* Les annees de participation, celles qui ne reposent QUE sur une programmation
   au festival etant marquees d'un degre (°).

   POURQUOI. imeb_edition melange trois faits sous un seul mot : une candidature
   attestee par un prix, un nom releve dans un proces-verbal, et une oeuvre
   programmee au festival Synthese dont on a deduit que son auteur etait la.
   Le troisieme cas n'atteste PAS une candidature — le PV de 1973 montre que 7
   de ces cas sur 9 avaient bien candidate, et 2 non. La page ne peut donc ni
   les compter comme des candidatures, ni les retirer : elle les signale.

   Le marqueur porte sur l'ANNEE et non sur la fiche, parce que la meme personne
   peut avoir candidate une annee et n'avoir ete que programmee une autre.

   Le 7e champ du flux (php/retrieve_data.php, case 5) est un SOUS-ENSEMBLE du
   4e : on ne peut donc pas marquer une annee absente de la liste affichee. */
function editionsHtml(eds, festivalSeul){

    var marquees = {};
    var brut = $.trim(festivalSeul || '');
    if(brut){
        var l = brut.split(',');
        for(var k=0; k<l.length; k++) marquees[$.trim(l[k])] = true;
    }

    var out = [];
    var ans = ('' + (eds || '')).split(',');
    for(var i=0; i<ans.length; i++){
        var a = $.trim(ans[i]);
        if(!a) continue;
        out.push(marquees[a]
            ? '<span class="ed-fest" title="present at the Synthese festival that year'
              + ' — no entry to the competition is attested">' + esc(a) + '°</span>'
            : esc(a));
    }
    return out.join(', ');
}
function animation1(evt){
	if(isAnimated){
		clearInterval(animation2);
		resetSaturation(avg_sat);
	} else animation2 = setInterval(noise_animation, 1000/10);

	isAnimated = !isAnimated;

    $("#anim").toggleClass('b_off b_on');

}
function resetSaturationForAllRects(){

    for(var i=0; i<rectangles.length; i++){
        drawRect(rectangles[i].x, rectangles[i].y, rectangles[i].color);
    } 

}
function resetSaturation(sat){

	for(var i=0; i<rectangles.length; i++){
		
		if(!rectangles[i].anchor && rectangles[i].id != nAId){

			var str = rectangles[i].color;

			var pos0 = str.indexOf(",")+1;
			var pos1 = str.indexOf("%");
			
			var c = str.substring(0, pos0);

            var lum;
            if(rectangles[i].count>0)lum=avg_lum;
            else lum=max_lum;

			c += sat+'%,'+lum+'%)';

			rectangles[i].color = c;

			drawRect(rectangles[i].x, rectangles[i].y, rectangles[i].color);
		}
	} 
}
//---------------------------------------//

function calculateMinHeightAndCreateRectangles(step, threshold){

    // On repart d'un etat propre a chaque (re)calcul : positions a zero et
    // hauteur remise a zero pour qu'elle puisse RETRECIR quand il y a moins
    // d'elements (filtre "num of records"), pas seulement grandir.
    resetPositions();
    minHeight = 0;

    for (var i=0; i<allData.length-5; i+=6) {

        //---------- get data ----------//
        var id = allData[i];
        var editions = allData[i+4].split(",");
        var ctry=allData[i+1];
        // var cId=allData[i+2];
        var count=allData[i+3]; //number of compositions avalaible

        //------- set color luminosity ---------//
        var lum;
        if(count>0) lum=colors[0].l;
        else lum=max_lum;

        var color='hsl('+colors[0].h+','+colors[0].s+'%,'+lum+'%)';

        //------- create rectangles ---------//

        if(step===0){
            createNewRectangle(id, color, count, true);
            createEditionsRectangles(id, count, editions);
        } else if(step===1){
            if(count>=threshold){
                createNewRectangle(id, color, count, true);
                createEditionsRectangles(id, count, editions);
            }
        }
    }
}
function createEditionsRectangles(id, count, editions){

    if(editions.length>0){
        for(var j=0; j<editions.length; j++){
            var coef = 310/(2009-1973);
            var numEdition = editions[j] - 1973;
            numEdition *= coef; //0=>255 not 360

            var lum;
            if(count>0) lum=avg_lum;
            else lum=max_lum;

            var c='hsl('+numEdition+','+avg_sat+'%,'+lum+'%)';
            createNewRectangle(id, c, count, false);
            
        }
    } else {
        console.log("error: no edition");
    }
} 
function createNewRectangle(aId, c, count, anchor){

    if( xPos>maxWidth-xRightOffset){

        // retour a la ligne sur la largeur de REFERENCE fixe (maxWidth, definie a
        // l'onload). On n'utilise pas canvas.width : celui-ci est ensuite retreci a
        // la largeur reelle de la grille et ne doit pas influencer le decoupage
        // (sinon la largeur deriverait a chaque recalcul).

        xPos = xLeftOffset;
        yPos += yDist;
    }

    if(yPos+yDist>minHeight) minHeight+=yDist;

    rectangles.push({id:aId, x: xPos, y:yPos, color:c, count:count, anchor:anchor});
    xPos += xDist;

}
function processAllRectWhithId(artist_id){

    var firstOne = false;

    for(var i=0; i<rectangles.length; i++){

        if(rectangles[i].id==artist_id){
            if(firstOne) {

                var str = rectangles[i].color;

                var pos0 = str.indexOf(",")+1;

                str = str.substring(0, pos0);
                str += "100%,50%)";

                // console.log(rectangles[i].color, str);

                drawRect(rectangles[i].x, rectangles[i].y, str);
                
            } else {

                drawRect(rectangles[i].x, rectangles[i].y, "white");
                firstOne = true;
                
            }
        }
    }
}
function resetAllRectWhithId(artist_id){
    for(var i=0; i<rectangles.length; i++){
        if(rectangles[i].id==artist_id)drawRect(rectangles[i].x, rectangles[i].y, rectangles[i].color);
    }
}
function selectRect(x, y){

    for(var i=0; i<rectangles.length; i++){
        
        //TODO use var
        if(x>=rectangles[i].x && x<=rectangles[i].x+rWidth &&
           y>=rectangles[i].y && y<=rectangles[i].y+rHeight) {

            if(pAId>=0){
                resetAllRectWhithId(pAId);
            }

            if(rectangles[i].id != pAId){

                nAId = rectangles[i].id;
                count002=rectangles[i].count;

                processAllRectWhithId(nAId);
                
                //-------- first query

                $.ajax({                                      
                    url: 'php/retrieve_data.php',       
                    type: "POST",
                    data: {aId: nAId, case:5} 
                }).done(function(str) {

                    /* arr et ctry servent DEUX FOIS dans ce rappel : ici pour
                       la boite orange, et plus bas pour creer l'agent du SMA
                       (OverviewSMA.addComposer). Ne pas les supprimer en
                       refondant l'affichage — c'est exactement ce qui est
                       arrive une fois : plus aucun agent n'etait cree, le
                       rappel mourant sur un « arr is not defined » avant
                       d'atteindre cette ligne. Le decoupage reste donc ici,
                       au plus pres de la reponse, et selectionHtml() recoit
                       le tableau deja decoupe. */
                    var arr  = str.split("%");
                    var ctry = arr[2];

                    // renderSelection() ecrit la boite orange ET accorde la
                    // fiche ISNI : les deux disent la meme selection, elles
                    // sont donc ecrites au meme endroit.
                    renderSelection(arr);

                    //------- cookie stuff

                    var is_new=true;

                    if(cookies.length>0){

                        for (var i=0; i<cookies.length; i++) {
                            if(cookies[i].id===nAId){
                                // console.log('already in');
                                is_new=false;
                                break;
                            }
                        }
                    }

                    if(is_new){

                        cookies.push({id:nAId, count:count002});

                        var str="";

                        for (var i = 0; i < cookies.length; i++) {
                            if(i>0)str+='%';
                            str+=cookies[i].id+'%'+cookies[i].count;
                        }

                        $.cookie('ids', str);
                        
                        // un agent par compositeur consulte ; il apparait en gris
                        // puis fusionne avec les siens (meme pays) -> groupe vert.
                        // Le compteur "consulted so far" est gere par le module.
                        OverviewSMA.addComposer({country: ctry, fn: arr[0], ln: arr[1], id: nAId, count: count002});

                    }
                });

                
                //-------- second query
                $.ajax({                                      
                    url: 'php/retrieve_data.php',       
                    type: "POST",
                    data: { aId: nAId, case:1 } 
                }).done(function(str) {

                    var arr=str.split("%");
                    titles=[];

                    for (var i=0; i<arr.length-4; i+=5) {
                        titles.push({id:arr[i], t:arr[i+1], d:arr[i+2], m:arr[i+3], ed:arr[i+4]});
                    }

                    displayTitlesInfosGN(titles);

                });
            }

            pAId = nAId;

            break;
        }
    }
}
function resetCanvasSize(){
    // Le canvas epouse la hauteur reelle du contenu (peut grandir ou retrecir),
    // pour ne pas laisser de zone vide et laisser remonter la legende "How to".
    canvas.height = minHeight + yDist;

    // Largeur = bord droit REEL de la grille (derniere colonne remplie), afin de ne
    // laisser aucun espace apres le dernier carre des lignes pleines. Comme le
    // decoupage se fait sur maxWidth (fixe), cette valeur est stable d'un recalcul a
    // l'autre : pas de derive.
    var contentRight = 0;
    for(var i=0; i<rectangles.length; i++){
        var right = rectangles[i].x + rWidth;
        if(right>contentRight) contentRight = right;
    }
    canvas.width = contentRight>0 ? contentRight : maxWidth;

    // La legende "How to read" est calee sur cette meme largeur : les deux blocs
    // ont donc exactement la meme largeur visible.
    var lg = document.getElementById('legend');
    if(lg){
        lg.style.maxWidth = canvas.width + 'px';
        lg.style.width = canvas.width + 'px';
    }
}
function resetPositions(){
    xPos = xLeftOffset;
    yPos = 0;
}
function getInfo(evt) {

    var cv = canvas.getBoundingClientRect();

    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    if(newResults){
        $("#results").empty();
        resetSaturationForAllRects();
        newResults=false;
    }
    selectRect(mouseX, mouseY);

}
function getData(){

    init = true;
    
    document.getElementById('get_all').removeEventListener("click", getData);
    $("#get_all").toggleClass('b_off b_on');
    // $("#get_all").remove();
    $("#launcher").remove();

    $.ajax({                                      
        url: 'php/retrieve_data.php',       
        type: "POST",
        data: {case:10} 
    }).done(function(str) {

        // console.log(str);

        allData = str.split("%");
        numComposersInCapsules=0;

        //TO DEBUG AND CATCH ERROR
        // console.log(allData[0]);

        for (var i=0; i<allData.length-5; i+=6) {
            // var id = allData[i];
            var numTitles = allData[i+3];
            if(numTitles>0)numComposersInCapsules++;
        }

        clearSelection("no selection — click a square to display a composer");

        var num = allData.length / 6;
        var txt2 = numComposersInCapsules+ " / " + num + " composers with archived works";
        $("#info p:eq(0)").text(txt2);

        /* Construire l'index selon le champ "num of records >=" (defaut 1).
           processData(), qui batissait la grille SANS seuil, n'est plus
           atteignable que par la vue de travail : hors d'elle, le plancher
           vaut 1 et la branche filtree est la seule. */
        var n = readNumOfRecords();
        if(n >= 1) processData002(n);
        else processData();
        updateCoverageNote(n);

    });
}
function processData002(numberMinOfParticipation){

    console.log("woot");

    canvas.removeEventListener("mousedown", getInfo, false);
    rectangles=[];

    calculateMinHeightAndCreateRectangles(1, numberMinOfParticipation);
    resetCanvasSize();   // reajuste la hauteur du canvas au contenu filtre
    drawRectanglesAndAddInteractivity();
}
function processData(){
    calculateMinHeightAndCreateRectangles(0, 0);
    resetCanvasSize();
    drawRectanglesAndAddInteractivity();
}
function drawRectanglesAndAddInteractivity(){
    context.fillStyle=COLORS[1];
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.stroke();

    resetPositions();

    for(var i=0; i<rectangles.length; i++){
        drawRect(rectangles[i].x, rectangles[i].y, rectangles[i].color);
    }

    resetPositions();

    // document.getElementById('anim').addEventListener("click", animation1) ;
    canvas.addEventListener("mousedown", getInfo, false);
}
//-----------------------------------//
//------------ animations -----------//
// (Le SMA — agents/compositeurs consultes regroupes par pays — vit desormais
//  dans js/overview_sma.js, moteur auto-contenu. Ne restent ici que la grille
//  de l'index et son animation de bruit.)
function noise_animation(){

    for(var i=0; i<rectangles.length; i++){

        if(!rectangles[i].anchor && rectangles[i].id != nAId){

            var value = Math.abs(noise.perlin2((rectangles[i].x+tNoise) / 1000, (rectangles[i].y+tNoise) / 1000));
            value *= 100;
            value -= 50;
            // value *= 80;
            value = Math.round(value);

            var str = rectangles[i].color;

            var pos0 = str.indexOf(",")+1;
            var pos1 = str.indexOf("%");

            var sat = (avg_sat + value)%101;
            
            var c = str.substring(0, pos0);

            var lum=avg_lum;

            c += sat+'%,'+lum+'%)';

            rectangles[i].color = c;
            // console.log(c);

            drawRect(rectangles[i].x, rectangles[i].y, rectangles[i].color);
        } 
    }

    tNoise+=15;
}
//-----------------------------------//
//--------- interactivity -----------//

function filterData(){

    var year_01 = parseInt($('#year_01').val());
    var year_02 = parseInt($('#year_02').val());

    /* readNumOfRecords() lit ET corrige : un 0 saisi redevient 1 dans la
       case avant que la grille ne soit redessinee. La derniere branche —
       champ vide ou illisible — reconstruisait l'index a 0, c'est-a-dire
       tout le monde ; elle retombe maintenant sur le plancher, sans quoi
       il aurait suffi d'effacer le champ pour passer dessous. */
    var numOfRecords = readNumOfRecords();

    if(Number.isInteger(year_01) && Number.isInteger(year_02)){
        console.log("all three");
    } else if (Number.isInteger(year_01)){
        console.log("year_01");
    } else {
        processData002(numOfRecords);
        updateCoverageNote(numOfRecords);
    }

}

// La partie "this index is knowingly incomplete… participations are missing"
// ne concerne que la vue complete (tous les participants). On l'affiche seulement
// quand num of records == 0 ; au-dela (>0, on ne montre que les compositeurs ayant
// au moins une oeuvre), on la retire. Le reste du texte (1995) reste toujours la.
function updateCoverageNote(n){
    if(Number.isInteger(n) && n <= 0) $('#lg-incomplete').show();
    else $('#lg-incomplete').hide();
}

function getSearchTerms(){

    var terms = $('#searchTerms').val();

    // une recherche par nom repart d'un etat neutre : on reinitialise la fiche
    // du compositeur precedemment selectionne (boite orange, boite violette,
    // et la fiche ISNI que clearSelection() retire avec la boite orange)
    clearSelection('no selection');
    $("#titles").empty();

    if(terms==""){
        $("#results").empty();
        resetSaturation(avg_sat);
        newResults=false;
        return;
    }

    //-------- second query
    $.ajax({                                      
        url: 'php/retrieve_data.php',       
        type: "POST",
        data: { terms: terms, case:28 } 
    }).done(function(str) {

        $("#results").empty();

        if(str.indexOf("%")<0){

            $("#results").append('<p>');
            $("#results p").text("no result");

        } else{
    
            composers = str.split("%");

            var numOfElements = 3;

            if(composers.length<numOfElements+1){

                // console.log("one composer!");

                createComposersListing(numOfElements);

                /* Resultat unique : on le surligne d'office, MAIS seulement
                   s'il existe dans l'index — sinon showAndHighlightComposer
                   rouvrirait l'index et redessinerait toute la grille pour
                   ne surligner personne (le compositeur n'y est a aucun
                   seuil). Et seulement s'il est AFFICHE : surligner un carre
                   sous une liste ou le nom n'apparait pas designerait
                   precisement la personne qu'on ne nomme pas. */
                var c0 = indexCountFor(composers[0]);
                if(c0>=0 && resultIsListed(c0)) showAndHighlightComposer(composers[0]);

            } else {

                createComposersListing(numOfElements);

                for (var j=0; j<rectangles.length; j++){
            
                    drawRect(rectangles[j].x, rectangles[j].y, rectangles[j].color);
                    
                }

            }         

        }
    });
}

//-------------//
// Nombre d'oeuvres archivees d'un compositeur TEL QUE L'INDEX LE CONNAIT, ou -1
// s'il n'y figure pas du tout. Les deux populations ne coincident pas : l'index
// (case 10) est bati sur imeb_edition, la table des participations issue du
// depouillement des proces-verbaux, alors que la recherche (case 28) interroge
// imeb_artist par le nom. Un compositeur entre en base par les catalogues, sans
// ligne de participation, est donc trouvable par la recherche sans avoir aucun
// carre dans la grille : c'est ce cas que le -1 signale.
function indexCountFor(id){

    for (var j=0; j<allData.length-5; j+=6) {
        if(id===allData[j]) return allData[j+3];
    }

    return -1;
}
function createComposersListing(num){

    var arr=[];
    var nonListes=0;        // reponses trouvees, mais non affichables

    for (var i = 0; i < composers.length; i+=num) {

        var id = composers[i];
        var count = indexCountFor(id);

        /* Vue publique : la fiche n'a AUCUNE oeuvre archivee, la base ne
           connait d'elle qu'une candidature relevee au proces-verbal. Le
           nom n'est pas ecrit — pas meme masque : une liste d'initiales
           repondrait a une recherche par nom, donc confirmerait le nom
           cherche, ce qui est le contraire de ce qu'on veut ici. C'est la
           difference avec Line Charts, ou la liste n'est pas une reponse a
           une question mais l'inventaire d'un pays. */
        if(!resultIsListed(count)){ nonListes++; continue; }

        // -1 n'est pas un compte : c'est une absence. On l'ecrit en toutes
        // lettres plutot que de le laisser passer pour un nombre d'oeuvres, et
        // la ligne est grisee et non cliquable (rien a surligner). Elle reste
        // affichee : c'est le seul endroit de cette page ou ces fiches
        // apparaissent. count vaut toujours -1 pour le tri : elles descendent
        // donc naturellement en fin de liste.
        // L'identifiant de fiche (imeb_artist.id) n'est ni affiche ni survolable :
        // c'est une cle de gestion, sans interet pour qui lit une liste de noms.
        // Il reste PORTE par la ligne, dans data-id, parce que c'est lui — et non
        // le nom — qui retrouve les carres du compositeur (les homonymes ne sont
        // separables que par la).
        var str = (count<0)
            ? '<p class="no-index" data-id="' + id + '">' +
                composers[i+1] + ' ' + composers[i+2] + ' &mdash; not in this index</p>'
            : '<p data-id="' + id + '">' +
                composers[i+1] + ' ' + composers[i+2] + ' ' + count + '</p>';

        if(arr.length<1){
            arr.push([count, str]);
            // console.log(str);
        } else {

            for (var k=0; k<arr.length; k++) {

                if(parseInt(count)>=parseInt(arr[k][0])){
                    arr.splice(k, 0, [count, str]);
                    // arr.push([count, str]);
                    break;
                } else if(k===arr.length-1){
                    arr.push([count, str]);
                    break;
                }

            }

        }
        
    }

    for (var l=0; l<arr.length; l++) {
        $("#results").append(arr[l][1]);
    }

    /* ⚠️ AUCUNE DES REPONSES N'EST AFFICHABLE — la recherche a trouve,
       mais tout ce qu'elle a trouve est un candidat sans oeuvre archivee. Ecrire « no result » serait faux — la recherche a trouvee
       — et laisser la liste vide serait pire, puisque rien ne
       distinguerait alors ce cas d'une panne. On dit donc COMBIEN sans
       dire QUI : le nombre ne designe personne, et il est la seule chose
       qui permette a un lecteur de comprendre que la base contient bien ce
       qu'il cherche. C'est la ligne editoriale du chantier — rendre
       explicite plutot que taire — appliquee sous la contrainte nouvelle. */
    if(arr.length<1 && nonListes>0){
        $("#results").append('<p class="no-index">' + nonListes +
            ' entrant' + (nonListes>1 ? 's' : '') +
            ' &mdash; no archived work, name not listed</p>');
    }

    // Seules les lignes presentes dans l'index sont cliquables. L'identifiant
    // est relu dans data-id avec attr() et NON avec data() : data() convertirait
    // "2373" en nombre, alors que showAndHighlightComposer le compare a
    // rectangles[j].id — une chaine — avec l'egalite stricte.
    $("#results p").not(".no-index").click(function() {
        showAndHighlightComposer($(this).attr('data-id'));
    });

    // console.log(composers.length/num, arr.length);

}
// Surligne un compositeur issu de la recherche. S'il est absent de l'index
// actuellement dessine (ex. "faber 0" alors que num of records >= 1, donc filtre),
// on reconstruit l'index complet (num of records = 0) pour le rendre visible,
// puis on le surligne.
function showAndHighlightComposer(composerId){

    var present = false;
    for(var j=0; j<rectangles.length; j++){
        if(rectangles[j].id===composerId){ present = true; break; }
    }

    /* Absent de la grille DESSINEE — par exemple deux oeuvres alors que le
       filtre est a cinq. On rouvre l'index jusqu'au PLANCHER, et non plus
       jusqu'a 0 : hors vue de travail, descendre a 0 ferait rentrer par la
       fenetre les 1 287 fiches sans oeuvre que le filtre tient dehors, et
       personne ne l'aurait demande — c'est un clic sur un resultat de
       recherche qui declenche ce chemin. */
    if(!present){
        var plancher = NUM_RECORDS_MIN;
        $('#numOfRecords').val(plancher);
        processData002(plancher);
        updateCoverageNote(plancher);
    }

    editRectanglesColorBasedOnQueryWithComposerId(composerId);
}
function editRectanglesColorBasedOnQueryWithComposerId(composerId){

    for (var j=0; j<rectangles.length; j++){
        if(rectangles[j].id===composerId){
            drawRect(rectangles[j].x, rectangles[j].y, "yellow");
        } else {
            var c = rectangles[j].color;
            if(c.indexOf('50%,')>0)c=c.replace('50%,', '4%,');
            drawRect(rectangles[j].x, rectangles[j].y, c);
        }
    }

    newResults=true;
}