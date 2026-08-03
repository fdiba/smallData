var graph = {};
var nodes = [];
var links = [];
var colors;
var svgWidth;

/* Index des noeuds : cle -> position dans nodes[].
   Voir addNode() pour la raison d'etre de cet index. */
var nodeIndex = {};

// Donnees generees depuis la base (php/retrieve_categories.php) au lieu
// du fichier data/smallData.csv. Reponse : six champs repetes,
// annee%categorie%nom%prenom%isni%id_artist.
d3.text("php/retrieve_categories.php", function(error, text){

  if(error || !text){ console.log('categories: aucune donnee'); return; }

  var raw = text.split("%");
  var data = [];
  // 6 = longueur d'enregistrement, ecrite en dur des deux cotes : si un champ
  // est ajoute a php/retrieve_categories.php, ce pas doit bouger avec lui.
  for(var i=0; i+5 < raw.length; i+=6){
    data.push({ year: raw[i], category: raw[i+1], name: raw[i+2],
                firstName: raw[i+3], isni: raw[i+4], artistId: raw[i+5] });
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
/* Les deux positions sont maintenant connues de l'appelant : il ne reste qu'a
   incrementer le flux existant, ou a creer le lien. */
function createLinkBetween(sourceId, targetId){

  for (var m=0; m<links.length; m++){

    if(links[m].source == sourceId && links[m].target == targetId){
      links[m].value++;
      return;
    }

  }

  links.push({source: sourceId, target: targetId, value: 1});

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
  var compId = addNode('a' + d.artistId,
                       {name: label, type: 'composer', isni: d.isni});

  //------- setup link between year and category -----------//
  createLinkBetween(yearId, catId);

  createLinkBetween(catId, compId);



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
  var height = 1500 - margin.top - margin.bottom + 5000;
  var color = d3.scale.category20();

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
    .nodePadding(6)
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

  links.append("title")
    .text(function (d, i) {
      return d.value + " "+ d.target.name + " en " + d.source.name;
    });

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
    .append("title")
    .text(function (d) {
      return "d.name";
    });

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
   Fiche ISNI — boite flottante ouverte au clic sur le nom d'un compositeur
   dans le diagramme de flux.

   Code repris tel quel de js/catalog.js (lui-meme issu de js/aww.js et de
   js/euphonies.js) : meme proxy, meme rendu, memes styles — desormais
   partages dans css/isni.css et non plus recopies dans chaque feuille.
   L'indentation d'origine (4 espaces) est conservee pour que la comparaison
   d'un fichier a l'autre reste immediate.

   Seul le point d'entree change : ici ce n'est ni une colonne de tableau ni
   la boite violette du SMA, mais le <text> SVG du noeud compositeur, porteur
   d'un attribut data-isni (voir la fin de sankeyStuff ci-dessus).

   La boite est attachee a <body> en position absolue : elle est donc HORS
   FLUX et ne deplace rien. Elle se place sous le nom clique, recalee si elle
   deborde de la fenetre — utile ici, le diagramme faisant plus de 6000 px de
   haut.

   Les donnees viennent de php/retrieve_isni.php (proxy serveur : ISNI SRU,
   la notice JSON-LD d'isni.org et Wikidata ; voir ce fichier). Le proxy est
   indispensable, un appel direct au navigateur serait bloque par CORS.
   ========================================================================= */

var isniCache = {};        // memoire de session : une notice n'est chargee qu'une fois
var isniAnchor = null;     // lien actuellement ouvert

function esc(s){
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function ensureIsniBox(){

    var box = $('#isniBox');
    if(box.length) return box;

    box = $('<div id="isniBox" class="isni-box" role="dialog" aria-label="Fiche ISNI">'
          + '<div class="isni-hd"><span class="isni-hd-t"></span>'
          + '<span class="isni-close" title="fermer">&times;</span></div>'
          + '<div class="isni-bd"></div></div>').appendTo('body');

    box.on('click', '.isni-close', function(){ closeIsniBox(); });
    // un clic dans la boite ne doit pas la refermer
    box.on('click', function(evt){ evt.stopPropagation(); });

    $(document).on('keydown.isni', function(evt){ if(evt.key === 'Escape') closeIsniBox(); });
    $(document).on('click.isni', function(){ closeIsniBox(); });
    $(window).on('resize.isni scroll.isni', function(){ if(isniAnchor) placeIsniBox(isniAnchor); });

    return box;
}

function closeIsniBox(){
    $('#isniBox').removeClass('open');
    isniAnchor = null;
}

/* Positionnement : sous le lien, cale dans la fenetre. La boite est deja
   visible (classe open) quand on appelle ceci, sinon sa largeur vaut 0. */
function placeIsniBox(anchor){

    var box = $('#isniBox');
    if(!box.length || !anchor || !anchor.length) return;

    var r  = anchor[0].getBoundingClientRect();
    var bw = box.outerWidth();
    var bh = box.outerHeight();
    var vw = $(window).width();
    var vh = $(window).height();
    var m  = 8;
    // la barre de controle est fixe : on ne passe jamais dessous
    var barH = ($('#ctrl_bar').outerHeight() || 0) + m;

    var left = r.left;
    if(left + bw > vw - m) left = vw - bw - m;
    if(left < m) left = m;

    // sous le lien ; au-dessus s'il n'y a pas la place en bas ; et si la boite
    // ne tient nulle part, on la remonte juste ce qu'il faut pour qu'elle
    // reste entierement visible sous la barre de controle.
    var top = r.bottom + 6;
    if(top + bh > vh - m){
        var above = r.top - bh - 6;
        if(above >= barH) top = above;
        else              top = Math.max(barH, vh - m - bh);
    }
    if(top < barH) top = barH;

    box.css({left: Math.round(left + window.pageXOffset) + 'px',
             top:  Math.round(top  + window.pageYOffset) + 'px'});
}

function openIsniBox(anchor){

    var isni = String(anchor.data('isni') || '').replace(/\s+/g, '');
    if(!isni) return;

    var box = ensureIsniBox();
    isniAnchor = anchor;

    box.find('.isni-hd-t').text('ISNI ' + isni.replace(/(.{4})(?=.)/g, '$1 '));
    box.addClass('open');

    if(isniCache[isni]){
        renderIsniBox(isniCache[isni]);
        placeIsniBox(anchor);
        return;
    }

    box.find('.isni-bd').html('<p class="isni-wait">Interrogation d\'ISNI&hellip;</p>');
    placeIsniBox(anchor);

    $.ajax({url: 'php/retrieve_isni.php', type: 'POST', dataType: 'json', data: {isni: isni}})

        .done(function(data){
            isniCache[isni] = data;
            renderIsniBox(data);
            placeIsniBox(anchor);
        })

        .fail(function(){
            // meme en cas d'echec la boite reste utile : les deux liens canoniques
            // se construisent sans le serveur.
            renderIsniBox({status: 'error', isni: isni, links: {
                isni_org:  'https://isni.org/isni/' + isni,
                isni_oclc: 'https://isni.oclc.org/cbs/DB=1.2//CMD?ACT=SRCH&IKT=8006&TRM=ISN%3A'
                           + isni + '&TERMS_OF_USE_AGREED=Y&terms_of_use_agree=send'
            }});
            placeIsniBox(anchor);
        });
}

function renderIsniBox(d){

    var h = [];
    var lnk = function(url, label){
        return '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(label) + '</a>';
    };

    //--- identite
    var who = [];
    if(d.names && d.names.length){
        for (var i = 0; i < d.names.length && i < 4; i++) {
            var n = d.names[i];
            var s = $.trim((n.forename || '') + ' ' + (n.surname || ''));
            if(n.dates) s += ' (' + n.dates + ')';
            if(s) who.push(esc(s));
        }
    }
    if(who.length) h.push('<p class="isni-name">' + who.join('<br>') + '</p>');
    if(d.wikidata && d.wikidata.description){
        h.push('<p class="isni-desc">' + esc(d.wikidata.description) + '</p>');
    }

    //--- les deux acces canoniques a la notice
    if(d.links){
        h.push('<p class="isni-sec">Notice</p><ul class="isni-list">');
        if(d.links.isni_org)  h.push('<li>' + lnk(d.links.isni_org, 'isni.org — notice publique') + '</li>');
        if(d.links.isni_oclc) h.push('<li>' + lnk(d.links.isni_oclc, 'isni.oclc.org — toutes les données') + '</li>');
        h.push('</ul>');
    }

    //--- liens externes (Discogs, MusicBrainz, VIAF, Wikipedia...)
    if(d.external && d.external.length){
        h.push('<p class="isni-sec">Liens externes</p><ul class="isni-list">');
        for (var k = 0; k < d.external.length && k < 20; k++) {
            h.push('<li>' + lnk(d.external[k].url, d.external[k].label) + '</li>');
        }
        if(d.external.length > 20) h.push('<li class="isni-more">et ' + (d.external.length - 20) + ' autres</li>');
        h.push('</ul>');
    }

    //--- notes de la notice ISNI
    if(d.notes && d.notes.length){
        h.push('<p class="isni-sec">Notes</p><ul class="isni-list isni-notes">');
        for (var m = 0; m < d.notes.length && m < 8; m++) h.push('<li>' + esc(d.notes[m]) + '</li>');
        h.push('</ul>');
    }

    //--- oeuvres relevees par ISNI
    if(d.titles && d.titles.length){
        h.push('<p class="isni-sec">Œuvres relevées</p><ul class="isni-list isni-titles">');
        for (var t = 0; t < d.titles.length; t++) h.push('<li>' + esc(d.titles[t]) + '</li>');
        if(d.titlesMore) h.push('<li class="isni-more">et ' + d.titlesMore + ' autres</li>');
        h.push('</ul>');
    }

    //--- bases contributrices
    if(d.sources && d.sources.length){
        var codes = [];
        for (var s = 0; s < d.sources.length; s++) {
            if(d.sources[s].code && codes.indexOf(d.sources[s].code) === -1) codes.push(d.sources[s].code);
        }
        if(codes.length) h.push('<p class="isni-sec">Bases contributrices</p>'
                              + '<p class="isni-codes">' + esc(codes.join(', ')) + '</p>');
    }

    //--- etats degradés
    if(d.status === 'empty'){
        h.push('<p class="isni-warn">Aucune donnée détaillée récupérée&nbsp;: la notice reste consultable par les liens ci-dessus.</p>');
    } else if(d.status === 'error'){
        h.push('<p class="isni-warn">Le serveur n\'a pas pu interroger ISNI&nbsp;: les liens ci-dessus restent valides.</p>');
    } else if(d.status === 'invalid'){
        h.push('<p class="isni-warn">ISNI invalide.</p>');
    }

    $('#isniBox .isni-bd').html(h.join(''));
}
