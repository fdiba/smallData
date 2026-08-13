var graph = {};
var nodes = [];
var links = [];
var colors;
var svgWidth;

/* Index des noeuds : cle -> position dans nodes[].
   Voir addNode() pour la raison d'etre de cet index. */
var nodeIndex = {};

/* =========================================================================
   DEUX VUES SUR LA MEME DONNEE.

   La page ne dessinait qu'une chose : annee -> categorie -> compositeur, soit
   566 noeuds sur plus de dix mille pixels de haut. C'est la vue de detail, et
   elle reste. Mais le diagramme a deux colonnes — annee -> categorie —
   existait deja ailleurs sur le site, dans imeb/sankey/ : un prototype de
   2016 qui refaisait la meme requete avec son propre d3, son propre en-tete
   et son propre algorithme d'identite des noeuds — celui-la meme, par
   recherche de sous-chaine, qui a du etre corrige ici (voir la note
   d'addNode). Plutot que d'entretenir deux pages pour une seule donnee, la
   vue allegee devient un ETAT de celle-ci, et l'ancien dossier redirige.

   La vue allegee est l'etat d'ARRIVEE : elle tient a peu pres dans une
   fenetre (environ 1 045 px, cf. chartHeight) et se lit d'un coup d'oeil ; la
   vue complete se demande. C'est l'ordre habituel — l'ensemble d'abord, le
   detail a la demande.

   Consequence sur la structure du fichier : nodes, links, nodeIndex et graph
   ne peuvent plus etre remplis une fois pour toutes dans le callback de
   d3.text, puisqu'ils changent avec la vue. Le flux de donnees, lui, n'est
   demande qu'UNE fois : la reponse analysee est conservee dans records, et
   build() reconstruit le graphe a partir d'elle. Changer de vue ne rappelle
   donc pas le serveur.
   ========================================================================= */
var VIEW_FULL  = 'full';
var VIEW_LIGHT = 'light';
var mode    = VIEW_LIGHT;   // etat d'arrivee ; voir #view dans categories.php
var records = null;         // reponse analysee, gardee pour les reconstructions

/* Nombre de compositeurs distincts par categorie, compte sur les
   enregistrements et non sur le graphe : la vue allegee n'a pas de colonne
   compositeur, mais l'effectif reste vrai et l'infobulle du noeud le dit dans
   les deux vues. En vue complete il coincide exactement avec le nombre de
   flux sortants de la categorie. */
var catComposers = {};

/* Periode couverte par chaque categorie : { libelle: "1977-1998" }, ou
   "1985" quand les deux bornes sont egales. Elle vient de imeb_categorie —
   annee_debut et annee_fin, servies en fin d'enregistrement par
   php/retrieve_categories.php — et NON du minimum et du maximum des oeuvres
   presentes.

   LA DIFFERENCE EST UNE QUESTION DE NATURE, pas de precision. Les bornes
      declarent CE QUE LA CATEGORIE EST : « Art Visuel, 1982-1984 » reste vrai
      meme si aucune oeuvre de 1983 n'etait au fonds. Un minimum-maximum
      calcule sur les oeuvres decrirait le contenu de la page, qui change a
      chaque versement d'edition, et l'etiquette bougerait sous les yeux du
      lecteur sans que rien n'ait ete decide.

      Les deux coincident aujourd'hui sur les vingt-trois categories, verifie
      le 2026-08-06 — ce qui est un resultat et non une raison de confondre
      les deux. */
var catPeriode = {};

/* IL N'Y A PLUS DE SOUS-CATEGORIE, ET IL N'Y EN A JAMAIS EU — 2026-08-13.
   `subComposers` et `subPeriode` ont ete retires ici. Ils comptaient les
   compositeurs et relevaient la periode d'un niveau qui n'existe pas : le
   concours a des DEGRES et des CATEGORIES, et le constat de 1990 l'ecrit —
   une LETTRE pour le degre, un CHIFFRE pour la categorie. Ce que la page
   appelait « sous-categorie » etait la categorie elle-meme, servie par un
   second champ parce que `imeb_music.award_cat` changeait de sens en 2000.

   LA PERIODE DE CES DOUZE LIBELLES N'EST DONC PLUS OBSERVEE MAIS DECLAREE :
      ils ont maintenant une ligne dans `imeb_categorie`, avec `annee_debut`
      et `annee_fin`, et `catPeriode` les sert comme les autres. */

/* « MAGISTERE » ET « RESIDENCE » NE SONT PAS DES CATEGORIES — 2026-08-08
   Releve par Florent sur cette page apres le versement de 1988, et c'est le
   MEME defaut que js/aww.js a corrige le meme jour (§24.15) : le Repertoire
   general inscrit deux DISTINCTIONS dans la colonne de categorie.

     - le MAGISTERE (code 500) couronne l'edition entiere. Le constat de 1988
       le dit en toutes lettres : « 1er MAGISTERIUM DU 16eme CONCOURS », trois
       bandes, aucune categorie, aucun rang (§24.8) ;
     - la RESIDENCE (code 600) est un SEJOUR offert, pas une recompense de
       rang. Le constat de 1988 la place avant le palmares, en « DEGRE 1 ».

   146 oeuvres sur 727, de 1988 a 2009, et `imeb_categorie` leur donne meme
   une ligne — 8 et 9, bornes 1988-2008 et 1988-2009. La donnee n'est pas
   fausse : elle transcrit fidelement ce que le catalogue imprime. C'est
   L'AXE DU DIAGRAMME qui l'est, en les alignant sur Live, Mixte ou
   Programme, qui sont des categories musicales.

   ON NE LES RETIRE PAS. Les masquer perdrait 146 prix, soit un cinquieme
      du palmares ; le diagramme dirait alors moins que le document. On les
      MARQUE : le noeud porte `distinction: true`, son libelle est suivi d'un
      ✦, et son infobulle commence par ce qu'il est.

   ET LE TEST PORTE SUR LE CODE, JAMAIS SUR LE LIBELLE — meme regle qu'en
      §24.15. `award_cat` est une chaine que quelqu'un corrigera un jour ; le
      code, lui, est stable. Et le marquage n'a lieu QUE si le libelle repete
      la distinction : une oeuvre de 2005 porte un Magistere avec
      `award_cat = 'Trivium A'`, une VRAIE categorie, et elle la garde.

   LE TYPE DU NOEUD RESTE 'category', ET C'EST DELIBERE. columnStats()
      groupe par `type` pour deduire la hauteur du diagramme : un type de plus
      creerait une colonne de plus dans ce calcul, pour un noeud qui reste
      dans la meme colonne a l'ecran. Le marquage est un DRAPEAU, pas un
      type. */
var DISTINCTIONS_HORS_AXE = {500: 'Magistère', 600: 'Résidence'};

// Donnees generees depuis la base (php/retrieve_categories.php) au lieu
// du fichier data/smallData.csv. Reponse : onze champs repetes, annee%
// categorie%nom%prenom%isni%id_artist%editions%cat_debut%cat_fin%sous_cat%
// award_price.
d3.text("php/retrieve_categories.php", function(error, text){

  if(error || !text){ console.log('categories: aucune donnee'); return; }

  var raw = text.split("%");
  var data = [];
  // 11 = longueur d'enregistrement, ecrite en dur des deux cotes : si un
  // champ est ajoute a php/retrieve_categories.php, ce pas doit bouger avec
  // lui. 7 -> 9 le 2026-08-06 (cat_debut, cat_fin), 9 -> 10 le soir meme
  // (sous_categorie), 10 -> 11 le 2026-08-08 (award_price).
  // editions = annees de participation au festival, separees par des virgules
  // (a ne pas confondre avec year, l'annee du prix) ; vide pour 236 des 727
  // oeuvres primees.
  // catDebut / catFin = les bornes de la categorie, vides pour les oeuvres
  // qui n'en ont pas.
  // subCat = LA CATEGORIE, lue sur `imeb_categorie` par `id_categorie` —
  // 2026-08-13. Le nom du champ garde la trace de ce qu'il portait avant, une
  // « sous-categorie » traduite d'un code entier par php/sous_categories.php,
  // fichier supprime le meme jour. C'EST LUI QUI FAIT LE NŒUD DU MILIEU dans
  // les deux vues ; `category`, qui porte le degre, n'est plus dessine.
  // Vide pour les 146 Residence et Magistere, qui n'ont pas de categorie.
  for(var i=0; i+10 < raw.length; i+=11){
    data.push({ year: raw[i], category: raw[i+1], name: raw[i+2],
                firstName: raw[i+3], isni: raw[i+4], artistId: raw[i+5],
                editions: raw[i+6], catDebut: raw[i+7], catFin: raw[i+8],
                subCat: raw[i+9], awardPrice: raw[i+10] });
  }

  data.reverse();

  records = data;
  countComposersByCategory();
  collectCategoryPeriods();
  bindViewSwitch();
  build();
});

/* Construction — ou reconstruction — du diagramme dans la vue courante.
   Les quatre accumulateurs sont remis a neuf et #chart vide : sankeyStuff()
   AJOUTE un <svg> a #chart, sans quoi les deux vues s'empileraient. */
function build(){

  nodes = [];
  links = [];
  nodeIndex = {};
  graph = {};

  var host = document.getElementById('chart');
  if(host) host.innerHTML = '';

  for(var k = 0; k < records.length; k++){
    setSankeyNodes(records, k);
  }

  createData();
  sankeyStuff();

  d3.select("#chart svg")
  //.style('background', '#FDF6E3')
  .attr('width', svgWidth+150+'px');

  var max = links.length;

  colors = d3.scale.linear()
    .domain([0, max*.25, max*.5, max*.75, max])
    .range(['#5dbf8c', '#8ecb84', '#bad97a', '#dab470', '#f08f67']);

  d3.selectAll('.link').style('stroke', function(d, i){
    return colors(i);
  });
}

/* LE LIBELLE DU NŒUD DU MILIEU, ET IL N'EST ECRIT QU'ICI — 2026-08-13.

   Trois endroits en ont besoin : setSankeyNodes(), qui cree le nœud,
   countComposersByCategory(), qui compte ses compositeurs, et
   collectCategoryPeriods(), qui lui donne sa periode. Les deux derniers
   retrouvent le nœud PAR SON NOM dans l'infobulle : si l'un des trois
   calculait le libelle autrement, le compte et la periode tomberaient a cote
   et l'infobulle afficherait un repli sans que rien ne signale l'erreur.
   *Une cle qui sert a se retrouver ne se calcule qu'a un seul endroit.*

   LA CATEGORIE D'ABORD, ET C'EST LE CAS GENERAL : `subCat` porte le libelle
      de la ligne de `imeb_categorie` pointee par `id_categorie`.

   A DEFAUT, LE DEGRE PRIVE DE SON PREFIXE — « Residence », « Magistere ».
      Ces 146 œuvres n'ont pas de categorie : elles SONT un degre, et le
      catalogue les inscrit pourtant dans la colonne de categorie. Retirer
      « Degre I - » n'est pas traduire une valeur, c'est retirer un prefixe.

   « None » EN DERNIER RECOURS : les 38 œuvres d'avant 1977, quand le
      concours n'avait qu'un seul classement. */
function libelleCategorie(d){

  if(d.subCat) return d.subCat;

  if(d.category){
    var m = /^Degré [IVX]+ - (.+)$/.exec(d.category);
    if(m) return m[1];
  }

  return 'None';
}

/* Compte des compositeurs distincts par categorie. Une paire
   categorie + id_artist n'est comptee qu'une fois : un compositeur prime deux
   fois dans la meme categorie reste un compositeur. */
function countComposersByCategory(){

  var seen = {}, k, d, cat, pair;

  catComposers = {};

  for(k = 0; k < records.length; k++){
    d = records[k];
    cat = libelleCategorie(d);
    pair = cat + '' + d.artistId;
    if(seen[pair]) continue;
    seen[pair] = true;
    catComposers[cat] = (catComposers[cat] || 0) + 1;
  }
}

/* Periode de chaque categorie, relevee sur les enregistrements. Elle y est
   repetee a l'identique pour toutes les oeuvres d'une meme categorie : on
   prend la premiere rencontree et on n'y revient pas.

   La forme est « 1977-1998 », ou « 1985 » quand la categorie n'a dure qu'une
   annee — c'est le cas d'Appliquee, creee et refermee en 1985. Une borne
   manquante laisse la periode vide, et l'infobulle n'en dit alors rien. */
function collectCategoryPeriods(){

  var k, d, cat;

  catPeriode = {};

  for(k = 0; k < records.length; k++){
    d = records[k];
    //  LA PERIODE EST CELLE DE LA CATEGORIE — 2026-08-13. Elle etait relevee
    //  sur d.category, qui porte maintenant le DEGRE ; les bornes servies par
    //  le serveur sont celles de la ligne de imeb_categorie pointee par
    //  id_categorie, c'est-a-dire de la CATEGORIE. La cle suit.
    //  LE DEGRE N'A PAS DE PERIODE DECLAREE et n'en affiche donc pas : le nom
    //  du degre 2 change d'une edition a l'autre — PRIX, QUADRIVIUM,
    //  QUINTIVIUM, TRIVIUM/QUADRIVIUM — et c'est la table imeb_section qui le
    //  portera.
    cat = libelleCategorie(d);
    if(catPeriode.hasOwnProperty(cat)) continue;
    if(!d.catDebut || !d.catFin) continue;
    catPeriode[cat] = (d.catDebut === d.catFin) ? d.catDebut
                                                : d.catDebut + '-' + d.catFin;
  }
}

/* Le commutateur de vue (#view dans categories.php) reprend deux tournures
   deja presentes dans la barre de controle : le libelle de #searchBox
   (index.php) et les boutons b_on / b_off de #launcher. Il n'y a donc rien de
   neuf a apprendre pour s'en servir. Rien ne se produit non plus si le bloc
   est absent : le diagramme s'affiche alors dans sa vue par defaut. */
function bindViewSwitch(){

  var box = document.getElementById('view');
  if(!box) return;

  var items = box.getElementsByTagName('li');

  function paint(){
    for(var p = 0; p < items.length; p++){
      var on = items[p].getAttribute('data-view') === mode;
      items[p].className = on ? 'b_on' : 'b_off';
      items[p].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function choose(el){
    var m = el.getAttribute('data-view');
    if(!m || m === mode) return;
    mode = m;
    paint();
    hideFlowTip();
    build();
    /* La page passe d'environ mille pixels a plus de dix mille, ou l'inverse.
       Sans ce retour en haut, on resterait a une position de defilement qui
       n'a plus de sens dans la nouvelle vue — et, en revenant a la vue
       allegee, hors du diagramme, qui deborde bien moins lateralement. */
    if(typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0);
  }

  for(var i = 0; i < items.length; i++){
    (function(el){
      el.onclick = function(){ choose(el); };
      el.onkeydown = function(evt){
        var k = evt.keyCode || evt.which;
        if(k === 13 || k === 32){        // entree, espace
          if(evt.preventDefault) evt.preventDefault();
          choose(el);
        }
      };
    })(items[i]);
  }

  paint();
}

/* Identite des noeuds : par CLE, et non plus par comparaison de chaines.
   -------------------------------------------------------------------------
   L'ancienne version cherchait le noeud avec String.prototype.search(), qui
   compile son argument en EXPRESSION REGULIERE et repond des qu'il trouve la
   sous-chaine N'IMPORTE OU. Deux consequences, mesurees sur la base :

     - un patronyme contenu dans un autre etait absorbe : le diagramme
       comptait 493 noeuds compositeurs pour 508 compositeurs primes, Brant
       disparaissant dans Brantigan, Klein dans Kleinsasser, Lo dans Lovett,
       et de meme Carl, Girol, Harris, Jones, Torre ;
     - inversement, deux compositeurs differents portant le meme patronyme
       (Berger, Freedman, Kokoras, Lee, Schubert, Thompson, Tremblay) se
       retrouvaient confondus dans un seul noeud.

   Le nom devenant cliquable, cette approximation n'etait plus tenable : elle
   aurait ouvert la fiche ISNI du mauvais compositeur. S'y ajoute que les
   prenoms, maintenant affiches, contiennent des points ("Frederick W.",
   "Panayiotis A."), qui sont des metacaracteres pour une expression
   reguliere.

   Les noeuds sont donc identifies par une cle explicite — 'y' + annee,
   'c' + categorie, 'a' + id_artist — et retrouves par consultation directe
   de nodeIndex, en temps constant. La categorie garde son libelle pour cle
   parce qu'elle n'a pas d'identifiant dans la base ; le compositeur, lui,
   est identifie par son id, seul moyen de separer les homonymes.

   L'objet noeud porte au passage ce dont le rendu a besoin : son type (pour
   placer le texte sans deviner d'apres le libelle) et son ISNI. */
function addNode(key, node){
    if(nodeIndex.hasOwnProperty(key)) return nodeIndex[key];
    nodeIndex[key] = nodes.length;
    nodes.push(node);
    return nodeIndex[key];
}
/* Ensemble de chaines rendu trie. On reste en ES5 (pas de Set) pour ne pas
   depayser le reste du fichier ; l'objet sert d'ensemble, ses cles sont les
   valeurs. Le tri est numerique : ce sont des annees. */
function addToSet(set, value){
  value = String(value === undefined || value === null ? '' : value)
            .replace(/^\s+|\s+$/g, '');
  if(value) set[value] = true;
}
function sortedKeys(set){
  var out = [];
  for(var k in set){ if(set.hasOwnProperty(k)) out.push(k); }
  out.sort(function(a, b){ return a - b; });
  return out;
}

/* =========================================================================
   Bulle de survol des flux.

   Le libelle etait porte par un <title> SVG, c'est-a-dire par l'infobulle
   native du navigateur. Celle-ci s'efface d'elle-meme au bout de quelques
   secondes, souris immobile ou non : c'est un comportement du systeme, sur
   lequel la page n'a aucune prise. Le texte d'un flux de droite pouvant
   enumerer une dizaine d'annees, on n'avait pas le temps de le lire.

   La bulle est donc dessinee ici : elle apparait a l'entree dans le flux,
   suit la souris, et ne disparait qu'a la sortie. Un seul element est cree,
   a la premiere utilisation, et reutilise ensuite.

   Elle est posee en position absolue dans le DOCUMENT (coordonnees fenetre
   + defilement) et non en position fixe : le diagramme deborde de la fenetre
   et defile dans les deux sens. pointer-events: none, dans la feuille de
   style, l'empeche de voler le survol au flux qui l'a fait apparaitre.
   ========================================================================= */
var flowTip = null;

function ensureFlowTip(){
  if(flowTip) return flowTip;
  flowTip = document.createElement('div');
  flowTip.id = 'flow_tip';
  document.body.appendChild(flowTip);
  return flowTip;
}

/* Placement : en bas a droite du pointeur, bascule de l'autre cote quand la
   bulle deborderait de la fenetre. On mesure apres avoir pose le texte, la
   largeur dependant du contenu. */
function moveFlowTip(evt){

  if(!flowTip || !evt) return;

  var m  = 14;
  var w  = flowTip.offsetWidth;
  var h  = flowTip.offsetHeight;
  var vw = document.documentElement.clientWidth;
  var vh = document.documentElement.clientHeight;

  var x = evt.clientX + m;
  var y = evt.clientY + m;
  if(x + w > vw - 8) x = evt.clientX - w - m;
  if(y + h > vh - 8) y = evt.clientY - h - m;
  if(x < 8) x = 8;
  if(y < 8) y = 8;

  flowTip.style.left = Math.round(x + window.pageXOffset) + 'px';
  flowTip.style.top  = Math.round(y + window.pageYOffset) + 'px';
}

function showFlowTip(text, evt){
  var t = ensureFlowTip();
  t.textContent = text;
  t.className = 'open';
  moveFlowTip(evt);
}

function hideFlowTip(){
  if(flowTip) flowTip.className = '';
}

/* Accord en nombre. Les libelles enoncent des effectifs, qui valent 1 assez
   souvent pour que "1 awards" se remarque : 267 des 656 flux de droite ne
   portent qu'un seul prix. Le pluriel anglais est ici regulier a une exception
   pres, category -> categories, traitee par la regle -y precedee d'une
   consonne. */
function plural(n, word){
  if(n === 1) return n + " " + word;
  if(/[^aeiou]y$/.test(word)) return n + " " + word.slice(0, -1) + "ies";
  return n + " " + word + "s";
}

/* Libelle du flux, en anglais comme le reste de la page — titre, menu,
   legende et en-tetes le sont, la bulle etait restee en francais.
   La forme nomme d'abord la chose survolee, puis l'effectif : le nombre nu
   en tete ne disait pas de quoi il etait le nombre.
     - vers un compositeur, depuis une categorie OU une sous-categorie :
       "Robert Normandeau — 2 awards in Programme (awarded 1988, 1993 · festival 1988, 1993)"
     - annee -> categorie :
       "Programme, 1988 — 3 awards"
     - categorie -> sous-categorie, depuis le 2026-08-06 :
       "Multimédia, Quadrivium — 5 awards"
   Les deux dernieres passent par la meme branche : elle nomme les deux
   extremites du flux, et c'est exactement ce qu'il faut dans les deux cas.
   Le nom de la source apparait donc DANS la phrase, ce qui n'est pas une
   repetition — un flux relie deux choses, et sa bulle doit dire lesquelles.
   La parenthese distingue deux choses que la base distingue :
     - "awarded" : imeb_music.award_year, l'annee du prix ;
     - "festival" : imeb_music.editions, les annees de participation.
   Les deux ne coincident pas necessairement, et editions est vide pour 237
   des 728 oeuvres primees : la mention correspondante est alors omise, et la
   parenthese entiere disparait si les deux listes sont vides. Rien n'est
   deduit de l'autre liste — une oeuvre peut etre primee sans avoir ete
   programmee, et l'absence de donnee n'est pas une absence de fait. */
function linkTitle(d){

  if(d.target.type !== 'composer'){
    return d.target.name + ", " + d.source.name + " — " + plural(d.value, "award");
  }

  var txt = d.target.fullName + " — " + plural(d.value, "award") +
            " in " + d.source.name;

  var parts = [];
  var yrs = sortedKeys(d.years || {});
  var eds = sortedKeys(d.editions || {});
  if(yrs.length) parts.push("awarded " + yrs.join(", "));
  if(eds.length) parts.push("festival " + eds.join(", "));
  if(parts.length) txt += " (" + parts.join(" · ") + ")";

  return txt;
}

/* Libelle du noeud. LA BULLE NE REPETE PAS LE NOM — le libelle est deja ecrit
   en clair a cote du rectangle, et le lire deux fois ne dit rien de plus. Le
   principe etait deja pose ici le jour ou le <title> SVG a ete remplace ;
   le code, lui, remettait le nom en tete de la phrase. Corrige le 2026-08-06.

   La bulle dit donc ce que le diagramme NE MONTRE PAS :

     annee            30 awards in 6 categories
     categorie        1977-1998 — 79 awards to 66 composers, across 20 editions
     sous-categorie   2000-2009 — 27 awards to 26 composers, in 2 categories :
                      Quadrivium, Trivium B
     compositeur      5 awards in 3 categories

   LA PERIODE N'EST PAS L'EFFECTIF D'EDITIONS, et les deux se lisent
      ensemble. « 1977-1998 » est la periode que la categorie COUVRE, telle
      que imeb_categorie la declare — vingt-deux annees ; « across 20
      editions » compte les annees ou elle a EFFECTIVEMENT distingue quelque
      chose. L'ecart entre les deux est une information, et c'est pourquoi
      aucun des deux nombres ne remplace l'autre.

      Elle ne parait que sur la categorie. Une annee est sa propre periode, et
      celle d'un compositeur — ses annees de prix — est deja dans l'infobulle
      des flux qui partent de lui.

   Rien d'autre n'est calcule ici : d3.sankey pose value (le maximum des flux
   entrants et sortants, soit le nombre de prix dans les trois cas, une
   categorie redistribuant vers les compositeurs exactement ce qu'elle recoit
   des annees) et les tableaux sourceLinks / targetLinks, dont la LONGUEUR
   donne les effectifs distincts — un flux par voisin, quelle que soit son
   epaisseur. Le texte passe par la meme bulle que les flux, et non par un
   <title> : la bulle native s'efface d'elle-meme au bout de quelques
   secondes. */
function nodeTitle(d){

  var out  = plural(d.value || 0, "award");
  var from = d.targetLinks ? d.targetLinks.length : 0;   // voisins de gauche
  var to   = d.sourceLinks ? d.sourceLinks.length : 0;   // voisins de droite

  if(d.type === 'year'){
    out += " in " + plural(to, "category");
  } else if(d.type === 'category' && d.distinction){
    /* CE NOEUD N'EST PAS UNE CATEGORIE, et l'infobulle le dit AVANT de
       compter. Les nombres eux-memes sont justes et se lisent comme ceux
       d'une categorie — c'est leur PLACE sur l'axe qui est un artefact du
       catalogue, pas leur valeur. La periode vient de imeb_categorie, qui
       porte une ligne pour chacune des deux (8 et 9). */
    var dcomp = catComposers.hasOwnProperty(d.name) ? catComposers[d.name] : to;
    out = "✦ a DISTINCTION, not a category — awarded across categories · "
        + out + " to " + plural(dcomp, "composer")
        + ", across " + plural(from, "edition");
    if(catPeriode[d.name]){ out = catPeriode[d.name] + " — " + out; }
  } else if(d.type === 'category'){
    /* Le nombre de compositeurs est lu dans catComposers et non dans
       sourceLinks.length : la vue allegee n'a pas de colonne compositeur, et
       la categorie n'y a donc aucun flux sortant. Les deux comptes donnent le
       meme nombre en vue complete — un flux sortant par compositeur.
       LES DEUX VUES PASSENT PAR ICI : corriger cette fonction les corrige
       toutes les deux, et la periode vient de la donnee et non du graphe,
       donc elle survit au retrait de la colonne de droite. */
    var comp = catComposers.hasOwnProperty(d.name) ? catComposers[d.name] : to;
    out += " to " + plural(comp, "composer") +
           ", across " + plural(from, "edition");
    if(catPeriode[d.name]){ out = catPeriode[d.name] + " — " + out; }
  } else {
    out += " in " + plural(from, "category");
  }

  return out;
}

/* Les deux positions sont maintenant connues de l'appelant : il ne reste qu'a
   incrementer le flux existant, ou a creer le lien.
   Le troisieme argument, facultatif, n'est passe que pour les liens
   categorie -> compositeur : le lien accumule alors les annees de prix et les
   annees de festival des oeuvres qu'il agrege, pour son infobulle. Les deux
   listes sont des ensembles — un compositeur prime deux fois la meme annee ne
   doit pas la voir apparaitre deux fois, et imeb_music.editions contient
   lui-meme des doublons (on lit par exemple "1984,1984"). */
function createLinkBetween(sourceId, targetId, rec){

  var link = null;

  for (var m=0; m<links.length; m++){

    if(links[m].source == sourceId && links[m].target == targetId){
      links[m].value++;
      link = links[m];
      break;
    }

  }

  if(!link){
    link = {source: sourceId, target: targetId, value: 1};
    links.push(link);
  }

  if(rec){
    if(!link.years){ link.years = {}; link.editions = {}; }
    addToSet(link.years, rec.year);
    if(rec.editions){
      var eds = rec.editions.split(',');
      for(var e=0; e<eds.length; e++){ addToSet(link.editions, eds[e]); }
    }
  }

}
function setSankeyNodes(data, key){

  var d = data[key];

  /* ============ LE DEGRE EST RETIRE DU DIAGRAMME — 2026-08-13 ============

     LE CHAMP 1 PORTE LE DEGRE, LE CHAMP 9 LA CATEGORIE. Ils portaient avant
     « la categorie ou le degre selon l'annee » et « la sous-categorie », parce
     que `imeb_music.award_cat` changeait de sens en 2000. Il n'y a pas de
     sous-categorie dans le concours : il y a des DEGRES et des CATEGORIES, et
     le constat de 1990 l'ecrit — une LETTRE pour le degre, un CHIFFRE pour la
     categorie.

     LE DEGRE A ETE ESSAYE COMME COLONNE DU MILIEU LE 2026-08-13, ET RETIRE LE
     JOUR MEME. Il n'a que TROIS valeurs — Degre I, Degre II, Degre III — et
     337 des 729 œuvres tombent dans la seule deuxieme : toutes les annees
     entraient dans trois nœuds et en ressortaient vers vingt-six, et le
     diagramme n'etait plus lisible. *Un niveau qui n'a que trois valeurs
     n'est pas un niveau de flux : c'est une legende.*

     LES DEUX VUES PORTENT DONC LA CATEGORIE AU MILIEU :
        vue allegee  : annee -> CATEGORIE
        vue complete : annee -> CATEGORIE -> compositeur

     ET LA TROISIEME COLONNE DE LA VUE ALLEGEE DISPARAIT AVEC LE DEGRE. Elle
     portait la « sous-categorie », qui EST la categorie : la garder ferait un
     nœud sous lui-meme. *Le niveau qu'elle montrait n'a jamais existe ; c'est
     la donnee qui etait mal etagee, pas le diagramme qui manquait d'une
     colonne.*

     LES DEUX « Multimedia » NE FONT PLUS QU'UN. Celui de 1999 arrivait par le
     champ 1 et celui de 2000-2009 par le champ 9 : deux nœuds pour une seule
     categorie, que la base a fusionnee le 2026-08-13.

     LES 146 RESIDENCE ET MAGISTERE n'ont pas de categorie — ils SONT un degre.
     Ils gardent le libelle que le catalogue leur donne et leur ✦, qui dit
     precisement cela. */
  //--------- add years ------------//
  var yearId = addNode('y' + d.year, {name: d.year, type: 'year'});

  //---- la colonne du milieu : LA CATEGORIE, dans les deux vues -----------
  var category = libelleCategorie(d);
  /* LE MARQUAGE N'A LIEU QUE SI LE LIBELLE REPETE LA DISTINCTION — voir la
     note en tete de fichier. Une oeuvre de 2005 porte un Magistere avec
     `award_cat = 'Trivium A'` : elle garde sa categorie, et le noeud
     « Trivium A » n'est pas marque.
     `addNode` rend l'index existant sans rien ecraser : le drapeau est donc
     pose par la PREMIERE oeuvre qui cree le noeud. C'est sans consequence,
     puisqu'un libelle marque ne peut venir que du code qui le porte. */
  //  LE ✦ RESTE, DANS LES DEUX VUES : il dit que « Magistere » et
  //  « Residence » ne sont pas des categories mais des distinctions, et ils
  //  tiennent la colonne des categories faute d'en avoir une.
  var estDistinction = (DISTINCTIONS_HORS_AXE[+d.awardPrice] === category);
  var catId = addNode('c' + category,
                      {name: category, type: 'category',
                       distinction: estDistinction});

  //------- setup link between year and category -----------//
  // Les deux vues ont les memes deux premieres colonnes : une categorie
  // redistribue exactement ce qu'elle recoit des annees, donc retirer la
  // colonne de droite ne change rien a celle de gauche.
  createLinkBetween(yearId, catId);

  /* ---- LA TROISIEME COLONNE DE LA VUE ALLEGEE A ETE RETIREE — 2026-08-13.
     Elle portait la « sous-categorie » depuis le 2026-08-06. Ce niveau n'a
     jamais existe : ce qu'elle montrait EST la categorie, et la garder ferait
     un nœud sous lui-meme. *C'etait la donnee qui etait mal etagee, pas le
     diagramme qui manquait d'une colonne.*
     La vue allegee est donc annee -> categorie, deux colonnes ; la vue
     complete, annee -> categorie -> compositeur. */
  if(mode !== VIEW_FULL) return;

  //---- add names --------//
  // "Nom, Prenom" : le patronyme reste en tete de colonne, comme avant, et le
  // prenom vient le completer. Les 508 compositeurs primes donnent 508
  // libelles distincts, sans homonymie parfaite.
  var label = d.firstName ? (d.name + ', ' + d.firstName) : d.name;
  // fullName : le meme nom dans l'ordre de lecture, "Prenom Nom". Le libelle
  // de la colonne reste en "Nom, Prenom" — il sert au reperage alphabetique —
  // mais l'infobulle du lien est une phrase, et s'y lit mieux a l'endroit.
  var fullName = d.firstName ? (d.firstName + ' ' + d.name) : d.name;
  var compId = addNode('a' + d.artistId,
                       {name: label, fullName: fullName,
                        type: 'composer', isni: d.isni});

  createLinkBetween(catId, compId, d);

}
function createData(){
  graph = {'nodes': nodes, 'links': links};
}

/* Effectif, flux total et deux plus petites valeurs de chaque colonne.
   Les valeurs sont recalculees ici plutot que lues dans les noeuds : layout()
   n'a pas encore tourne, node.value n'existe pas et les liens portent encore
   des index entiers. La regle est celle de d3.sankey — la valeur d'un noeud
   est le plus grand de ce qui entre et de ce qui sort. */
function columnStats(){

  var i, vin = [], vout = [], cols = {};

  for(i = 0; i < graph.nodes.length; i++){ vin[i] = 0; vout[i] = 0; }

  for(i = 0; i < graph.links.length; i++){
    vout[graph.links[i].source] += graph.links[i].value;
    vin[graph.links[i].target]  += graph.links[i].value;
  }

  for(i = 0; i < graph.nodes.length; i++){
    var t = graph.nodes[i].type;
    var v = Math.max(vin[i], vout[i]);
    if(!cols[t]) cols[t] = {count: 0, flow: 0, v1: Infinity, v2: Infinity};
    var c = cols[t];
    c.count++;
    c.flow += v;
    if(v < c.v1){ c.v2 = c.v1; c.v1 = v; }
    else if(v < c.v2){ c.v2 = v; }
  }

  return cols;
}

/* HAUTEUR DU DIAGRAMME — deduite de l'ecart voulu entre deux libelles
   voisins, et non posee en dur.
   d3.sankey (lib/erase_old_sankey.js, initializeNodeDepth) calcule
       ky = min sur les colonnes de (hauteur - (n-1) * nodePadding) / somme des valeurs
   puis pose node.dy = node.value * ky. Le libelle etant centre sur son noeud
   (y = d.dy / 2), deux noeuds voisins de valeurs v1 et v2 ont leurs libelles
   distants de (v1 + v2) / 2 * ky + nodePadding : c'est le pas d'affichage des
   noms. On inverse deux fois. Le pas voulu impose un ky minimal, que fixe la
   colonne dont les deux plus petits noeuds sont les plus petits ; ce ky
   impose a son tour une hauteur, que fixe la colonne la plus chargee.
   Le calcul etait auparavant ecrit pour la seule colonne des compositeurs,
   avec sa plus petite valeur — un prix — sous-entendue. Il est generalise ici
   parce que la vue allegee n'a pas cette colonne, et il rend exactement la
   meme hauteur qu'avant en vue complete : 10 452 px, la colonne des
   compositeurs restant partout la contrainte, 508 noeuds pour 728 prix.
   En vue allegee la contrainte devient la plus petite categorie (Multimedia,
   2 prix) et la hauteur tombe vers 1 045 px, soit a peu pres une fenetre.
   Auparavant elle valait 6460 en dur, pour un pas de 10,7 px sous une police
   de 12 : les noms se touchaient. */
function chartHeight(pad, pitch){

  var cols = columnStats(), t, c, ky = 0, h = 0;

  for(t in cols){
    if(!cols.hasOwnProperty(t)) continue;
    c = cols[t];
    if(c.count < 2) continue;          // colonne d'un seul noeud : pas de voisin
    var mean = (c.v1 + (isFinite(c.v2) ? c.v2 : c.v1)) / 2;
    if(mean > 0) ky = Math.max(ky, (pitch - pad) / mean);
  }

  if(ky <= 0) return 1500;             // graphe vide ou sans lien

  for(t in cols){
    if(!cols.hasOwnProperty(t)) continue;
    c = cols[t];
    h = Math.max(h, ky * c.flow + (c.count - 1) * pad);
  }

  return Math.round(h);
}

function sankeyStuff(){

  var max = graph.nodes.length;

  colors = d3.scale.linear()
    .domain([0, max*.25, max*.5, max*.75, max])
    .range(['#5dbf8c', '#8ecb84', '#bad97a', '#dab470', '#f08f67']);

  // Some setup stuff edit it to make a bigger image !!
  var margin = {top: 20, right: 1, bottom: 20, left: 41};
  /* Les 760 px supplementaires ne servent qu'a loger la colonne des
     compositeurs et ses patronymes. La vue allegee s'arrete aux CATEGORIES,
     dont les libelles sont longs depuis que les douze de 2000-2009 en sont —
     « Installation ou environnement sonore et musical » fait 47 caracteres —,
     d'ou 280 px de plus qu'avant pour elle.
     240 px ne suffisaient pas : ce libelle-la depassait le bord droit du
        SVG de 9 px, mesure dans le navigateur. Le nombre est cale sur LE
        PLUS LONG, et il est a reverifier si un plus long entre — la liste
        est maintenant la table `imeb_categorie`, et non plus un fichier.
     LA COLONNE EST LA MEME DEPUIS LE 2026-08-13 : la vue allegee s'arretait
        aux « sous-categories », qui SONT les categories. Elle s'arrete donc
        au meme endroit, avec une colonne de moins. */
  svgWidth = 960 - margin.left - margin.right
           + (mode === VIEW_FULL ? 760 : 280);
  var color = d3.scale.category20();

  /* Blanc entre deux noeuds d'une meme colonne, et ecart voulu entre deux
     libelles voisins ; la hauteur s'en deduit — voir chartHeight().
     L'ecart passe de 12 a 16 px en vue allegee : avec 58 noeuds au lieu de
     566 la place ne manque pas, et cette respiration supplementaire raccourcit
     le diagramme d'environ 800 px a pas de libelle egal. */
  var NODE_PADDING = (mode === VIEW_FULL) ? 12 : 16;
  var LABEL_PITCH  = 18;
  var height = chartHeight(NODE_PADDING, LABEL_PITCH);

  // SVG (group) to draw in.
  var svg = d3.select("#chart").append("svg")
    .attr({
      width: svgWidth + margin.left + margin.right,
      height: height + margin.top + margin.bottom
    })
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Set up Sankey object.
  /* sinksRight : LA DERNIERE COLONNE EST CELLE OU LE CLASSEMENT S'ARRETE.

     d3.sankey pousse a la derniere colonne tout noeud sans flux sortant.
     En VUE COMPLETE c'est evident : les compositeurs sont les seuls puits
     et s'alignent tous a droite, y compris ceux atteints directement depuis
     une categorie.

     EN VUE ALLEGEE — la seule qui porte les sous-categories —, la question
     s'est posee. La troisieme colonne y est celle des sous-categories, et
     les dix-huit categories qui n'en ont pas sont des puits. Premier essai
     le 2026-08-06 : sinksRight(false), pour qu'elles restent en colonne 2 —
     chaque noeud a la profondeur que le parcours lui donne, et
     « Programme » ne va pas s'asseoir a cote de « Multimédia ».

     ET CE N'ETAIT PAS LISIBLE. Dix-huit rectangles s'arretaient au
        milieu de la toile, leurs libelles flottant dans le vide, avec un
        bord droit en dents de scie : le diagramme paraissait inacheve
        plutot que differencie. Corrige le jour meme, sur retour d'usage.

     La derniere colonne se lit donc : LE CLASSEMENT LE PLUS FIN DONT
     L'OEUVRE DISPOSE — sa sous-categorie quand elle en a une, sa categorie
     sinon. C'est une lecture, et elle se tient : ce que la colonne aligne,
     ce n'est pas une nature commune, c'est un point d'arrivee commun. La
     bulle de survol continue de les distinguer sans ambiguite — une
     categorie donne sa periode et compte des editions, une sous-categorie
     compte des categories. */
  var sankey = d3.sankey()
    .nodeWidth(20)
    .sinksRight(true)
    .nodePadding(NODE_PADDING)
    /* La reserve a droite loge le LIBELLE de la derniere colonne, qui est
       pose a droite du rectangle. 150 px suffisaient pour des patronymes ;
       ils ne suffisent pas pour « Installation ou environnement sonore et
       musical », le plus long des douze libelles de sous-categorie, qui
       depassait le bord du SVG de 9 px — mesure dans le navigateur.
       ELARGIR LE SVG NE SUFFIT PAS : d3.sankey etale ses colonnes sur
          toute la largeur qu'on lui donne, donc la derniere suit le bord et
          le libelle deborde toujours d'autant. C'est LA RESERVE qu'il faut
          augmenter, pas la toile. */
    .size([svgWidth - (mode === VIEW_FULL ? 150 : 330), height])
    .nodes(graph.nodes)
    .links(graph.links)
    .layout(32);

  // Path data generator.
  var path = sankey.link();

  // Draw the links.
  var links = svg.append("g").selectAll(".link")
    .data(graph.links)
    .enter()
    .append("path")
      .attr({
        "class": "link",
        d: path
      })
      .style("stroke-width", function (d) {
        return Math.max(1, d.dy);
      })

  /* Survol du flux : le libelle est calcule par linkTitle() et affiche dans
     la bulle de la page, plus par un <title> SVG — voir la note qui ouvre le
     bloc "Bulle de survol des flux" plus haut pour la raison. */
  links
    .on('mouseover', function (d) { showFlowTip(linkTitle(d), d3.event); })
    .on('mousemove', function ()  { moveFlowTip(d3.event); })
    .on('mouseout',  function ()  { hideFlowTip(); });

  // Draw the nodes.
  var nodes = svg.append("g").selectAll(".node")
    .data(graph.nodes)
    .enter()
    .append("g")
    .attr({
      "class": "node",
      transform: function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      }
    });



  nodes.append("rect")
    .attr({
      height: function (d) {
        return d.dy;
      },
      width: function(d){
        return sankey.nodeWidth();
      }
    })
    .style({
      fill: function (d, i) {
        //return d.color = color(d.name.replace(/ .*/, ""));

        return d.color = colors(i);

      }
    })
    /* Survol du noeud : ses effectifs, dans la meme bulle que les flux — voir
       nodeTitle() et le bloc "Bulle de survol" plus haut. Le <title> SVG qui
       occupait cette place rendait la chaine litterale "d.name". */
    .on('mouseover', function (d) { showFlowTip(nodeTitle(d), d3.event); })
    .on('mousemove', function ()  { moveFlowTip(d3.event); })
    .on('mouseout',  function ()  { hideFlowTip(); });

  // Le libelle : les annees sont posees a gauche de leur colonne et centrees,
  // categories et compositeurs a droite. Le type du noeud est desormais lu
  // dans la donnee (d.type) et non plus devine en cherchant '19' ou '20' en
  // tete du libelle.
  var labels = nodes.append("text")
    .attr({
      x: sankey.nodeWidth() / 2,
      y: function (d) {
        return d.dy / 2;
      },
      dx: function(d){

        if(d.type === 'year'){
          return '-3em';
        } else {
          return '2em'; //text offset
        }
      },
      dy: ".35em",
      "text-anchor": function (d){

        if(d.type === 'year'){
          return 'middle';
        } else {
          return 'left';
        }

      },
      transform: null
    })
    .text(function (d) {
      /* ✦ : le noeud est une DISTINCTION posee sur l'axe des categories par
         le catalogue — Magistere, Residence. Le signe est le seul endroit ou
         cela se voit sans survoler, et il ne coute pas une colonne. */
      return d.distinction ? (d.name + ' ✦') : d.name;
    });

  /* Nom cliquable — seulement pour les compositeurs porteurs d'un ISNI, soit
     236 des 508 (la colonne imeb_artist.isni n'est renseignee que pour ceux
     alignes sur data.bnf.fr). Les autres restent du texte simple : rien
     n'invite a cliquer la ou il n'y a rien a ouvrir.
     stopPropagation() est indispensable : ensureIsniBox() ecoute le clic sur
     le document pour refermer la fiche, et sans cela elle se refermerait
     aussitot ouverte. */
  labels.filter(function(d){ return d.type === 'composer' && d.isni; })
    .attr('class', 'isni-node')
    .attr('data-isni', function(d){ return d.isni; })
    .on('click', function(){
      d3.event.stopPropagation();
      openIsniBox($(this));
    });
}

/* =========================================================================
   Fiche ISNI — le code de la boite est desormais dans js/isni_box.js, seule
   copie pour les quatre pages qui l'affichent (award-winning_works.php,
   catalog.php, categories.php, euphonies.php). Il figurait ici a l'identique,
   octet pour octet, comme dans les trois autres.

   Ne reste que le point d'entree, propre a cette page : le <text> SVG du
   noeud compositeur, porteur d'un attribut data-isni, appelle
   openIsniBox($(this)) au clic — voir la fin de sankeyStuff ci-dessus. C'est
   le seul acces ici : ni colonne de tableau, ni boite violette du SMA.
   ========================================================================= */

/* --- repli de la legende "How to read" -------------------------------------
   Le comportement a ete EXTRAIT dans js/legend_toggle.js, fichier partage par
   les sept pages qui portent une legende : il n'y a plus rien a faire ici. La
   page reste seule a arriver repliee, et cet etat est ecrit dans son HTML
   (classe is-collapsed sur #legend dans categories.php), non dans le script.
   Voir l'en-tete de js/legend_toggle.js pour le contrat complet. */
