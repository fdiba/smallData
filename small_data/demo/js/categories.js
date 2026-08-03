var graph = {};
var nodes = [];
var links = [];
var colors;
var svgWidth;

/* Index des noeuds : cle -> position dans nodes[].
   Voir addNode() pour la raison d'etre de cet index. */
var nodeIndex = {};

// Donnees generees depuis la base (php/retrieve_categories.php) au lieu
// du fichier data/smallData.csv. Reponse : sept champs repetes,
// annee%categorie%nom%prenom%isni%id_artist%editions.
d3.text("php/retrieve_categories.php", function(error, text){

  if(error || !text){ console.log('categories: aucune donnee'); return; }

  var raw = text.split("%");
  var data = [];
  // 7 = longueur d'enregistrement, ecrite en dur des deux cotes : si un champ
  // est ajoute a php/retrieve_categories.php, ce pas doit bouger avec lui.
  // editions = annees de participation au festival, separees par des virgules
  // (a ne pas confondre avec year, l'annee du prix) ; vide pour 237 des 728
  // oeuvres primees.
  for(var i=0; i+6 < raw.length; i+=7){
    data.push({ year: raw[i], category: raw[i+1], name: raw[i+2],
                firstName: raw[i+3], isni: raw[i+4], artistId: raw[i+5],
                editions: raw[i+6] });
  }

  data.reverse();

  for(key in data) {
    setSankeyNodes(data, key);
  }

  createData();
  sankeyStuff();

  d3.select("svg")
  //.style('background', '#FDF6E3')
  .attr('width', svgWidth+150+'px');

  var max = links.length;

  colors = d3.scale.linear()
    .domain([0, max*.25, max*.5, max*.75, max])
    .range(['#5dbf8c', '#8ecb84', '#bad97a', '#dab470', '#f08f67']);

  d3.selectAll('.link').style('stroke', function(d, i){
    return colors(i);
  });
});

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
     - a droite, categorie -> compositeur :
       "Robert Normandeau — 2 awards in Programme (awarded 1988, 1993 · festival 1988, 1993)"
     - a gauche, annee -> categorie :
       "Programme, 1988 — 3 awards"
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

/* Libelle du noeud. Le rectangle portait un <title> SVG qui rendait la chaine
   litterale "d.name" — une coquille d'origine, des guillemets de trop dans le
   return. La corriger n'aurait servi a rien : le libellé est deja ecrit en
   clair a cote du rectangle, l'infobulle n'aurait fait que le repeter. Elle
   dit donc ce que le diagramme ne montre pas, les effectifs :

     annee        1988 — 30 awards in 6 categories
     categorie    Programme — 78 awards to 67 composers, across 20 editions
     compositeur  Robert Normandeau — 5 awards in 3 categories

   Rien n'est calcule ici : d3.sankey pose value (le maximum des flux entrants
   et sortants, soit le nombre de prix dans les trois cas, une categorie
   redistribuant vers les compositeurs exactement ce qu'elle recoit des
   annees) et les tableaux sourceLinks / targetLinks, dont la LONGUEUR donne
   les effectifs distincts — un flux par voisin, quel que soit son epaisseur.
   Le texte passe par la meme bulle que les flux, et non par un <title> : la
   bulle native s'efface d'elle-meme au bout de quelques secondes. */
function nodeTitle(d){

  var out  = (d.type === 'composer' ? d.fullName : d.name) + " — " +
             plural(d.value || 0, "award");
  var from = d.targetLinks ? d.targetLinks.length : 0;   // voisins de gauche
  var to   = d.sourceLinks ? d.sourceLinks.length : 0;   // voisins de droite

  if(d.type === 'year'){
    out += " in " + plural(to, "category");
  } else if(d.type === 'category'){
    out += " to " + plural(to, "composer") +
           ", across " + plural(from, "edition");
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

  //--------- add years ------------//
  var yearId = addNode('y' + d.year, {name: d.year, type: 'year'});

  //---- add categories --------//
  var category = d.category;
  if(category=='')category='None';
  var catId = addNode('c' + category, {name: category, type: 'category'});

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

  //------- setup link between year and category -----------//
  createLinkBetween(yearId, catId);

  createLinkBetween(catId, compId, d);



}
function createData(){
  graph = {'nodes': nodes, 'links': links};
}
function sankeyStuff(){

  var max = graph.nodes.length;

  colors = d3.scale.linear()
    .domain([0, max*.25, max*.5, max*.75, max])
    .range(['#5dbf8c', '#8ecb84', '#bad97a', '#dab470', '#f08f67']);

  // Some setup stuff edit it to make a bigger image !!
  var margin = {top: 20, right: 1, bottom: 20, left: 41};
  svgWidth = 960 - margin.left - margin.right + 760;
  var color = d3.scale.category20();

  /* Hauteur du diagramme : deduite de l'ecart voulu entre deux noms, et non
     plus posee en dur. d3.sankey (lib/erase_old_sankey.js, initializeNodeDepth)
     calcule
         ky = min sur les colonnes de (hauteur - (n-1) * nodePadding) / somme des valeurs
     puis pose node.dy = node.value * ky. Le libelle etant centre sur son noeud
     (y = d.dy / 2), deux compositeurs voisins n'ayant qu'un prix chacun sont
     distants de ky + nodePadding : c'est le pas d'affichage des noms.
     C'est la colonne des compositeurs qui contraint ky — 508 noeuds pour 728
     prix, contre 36 noeuds (annees) et 23 (categories) pour le meme total. On
     inverse donc la formule sur cette colonne pour obtenir la hauteur qui donne
     le pas voulu. Auparavant la hauteur valait 6460 en dur, soit un pas de
     10,7 px pour une police de 12 px : les noms se touchaient. */
  var NODE_PADDING = 12;   // blanc entre deux noeuds d'une meme colonne, en px
  var LABEL_PITCH  = 18;   // ecart voulu entre deux noms voisins, en px

  var composerCount = 0, awardFlow = 0;
  for(var ni = 0; ni < graph.nodes.length; ni++){
    if(graph.nodes[ni].type === 'composer') composerCount++;
  }
  // layout() n'a pas encore tourne : les liens portent encore des index entiers
  for(var li = 0; li < graph.links.length; li++){
    if(graph.nodes[graph.links[li].target].type === 'composer'){
      awardFlow += graph.links[li].value;
    }
  }
  var height = composerCount
    ? awardFlow * (LABEL_PITCH - NODE_PADDING) + (composerCount - 1) * NODE_PADDING
    : 1500 - margin.top - margin.bottom + 5000;

  // SVG (group) to draw in.
  var svg = d3.select("#chart").append("svg")
    .attr({
      width: svgWidth + margin.left + margin.right,
      height: height + margin.top + margin.bottom
    })
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Set up Sankey object.
  var sankey = d3.sankey()
    .nodeWidth(20)
    .nodePadding(NODE_PADDING)
    .size([svgWidth-150, height]) //-50 to display composers name fully on x axis
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
      return d.name;
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
   La bande de titre reste visible une fois la legende fermee : elle se rouvre
   sans avoir a remonter en haut d'un diagramme de plus de 10 000 px. La page
   arrive repliee — la classe is-collapsed est posee dans categories.php, pas
   ici : rien ne doit se refermer sous les yeux au chargement. Ecrit sans
   jQuery — c'est un clic sur un bouton — et sans effet si la page ne porte pas
   de legende. */
(function(){
  if(typeof document === 'undefined' || !document.getElementById) return;
  var box = document.getElementById('legend');
  var btn = document.getElementById('lg_toggle');
  if(!box || !btn) return;

  /* Repliee, la bande de titre s'arrete au bord droit de "The Project"
     (#help, dernier bloc de la barre) au lieu de barrer toute la fenetre pour
     trois mots : elle se cale ainsi sur la fin du menu, juste au-dessus.
     Ouverte, elle reprend toute la largeur — ses deux colonnes en ont besoin.
     La largeur est MESUREE a chaque repli plutot qu'ecrite en dur : elle
     depend des libelles du menu et de la police effectivement chargee, et
     change si la barre se reorganise dans une fenetre etroite. Elle est
     transmise a la feuille de style par une propriete personnalisee, dont la
     valeur de repli (auto) redonne la pleine largeur si la mesure echoue. */
  function fitCollapsedWidth(){
    var help = document.getElementById('help');
    if(!help) return;
    var w = Math.round(help.getBoundingClientRect().right -
                       box.getBoundingClientRect().left);
    if(w > 0) box.style.setProperty('--lg-collapsed-w', w + 'px');
  }

  btn.addEventListener('click', function(){
    var collapsed = box.classList.toggle('is-collapsed');
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    if(collapsed) fitCollapsedWidth();
  });

  // La page arrive repliee : la largeur doit etre calee sans attendre un clic.
  fitCollapsedWidth();

  if(typeof window !== 'undefined' && window.addEventListener){
    window.addEventListener('resize', function(){
      if(box.classList.contains('is-collapsed')) fitCollapsedWidth();
    });
    // Les libelles du menu sont composes en Exo 2, chargee depuis le reseau :
    // la mesure faite avant l'arrivee de la police porterait sur la police de
    // substitution et serait fausse de quelques pixels. On la refait donc
    // quand la page est complete, et quand les polices sont pretes la ou le
    // navigateur sait le dire.
    window.addEventListener('load', function(){
      if(box.classList.contains('is-collapsed')) fitCollapsedWidth();
    });
    if(document.fonts && document.fonts.ready && document.fonts.ready.then){
      document.fonts.ready.then(function(){
        if(box.classList.contains('is-collapsed')) fitCollapsedWidth();
      });
    }
  }
})();
