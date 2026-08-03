//---- Euphonies d'Or — logique propre a la page.
//---- L'etat et les fonctions du SMA sont dans js/sma_core.js.

window.onload = function() {

    initSMA(800, 600);

    // 13 champs depuis l'ajout du pays en fin d'enregistrement (retrieve_cat.php)
    retrieveEuphonies(3, 13);

};
function retrieveEuphonies(cat, numOfElements){

    $.ajax({
        url: 'php/retrieve_cat.php',
        type: "POST",
        data: {cat: cat}

    }).done(function(str) {

        var arr=str.split("|");

        for (var i = 0; i < arr.length; i+=numOfElements) {

            // Le zebra du tableau est porte par des CLASSES, pas par
            // :nth-child : on insere des lignes-notices (tr.bnf-row) entre les
            // lignes de donnees, ce qui decalerait la parite CSS.
            var tr_class = (i / numOfElements % 2 === 0) ? "even" : "odd";

            //--------- SMA
            var obj = {edition: arr[i], year:arr[i+1], price:arr[i+2], imeb_id:arr[i+3],
                        fn:arr[i+4], ln:arr[i+5], title:arr[i+6], duration:arr[i+7],
                        id:arr[i+8],
                        cat:arr[i+9], sub_cat:arr[i+10], isni:arr[i+11]};

            records.push(obj);
            //---------

            //--------- TABLE
            $('#euphonies_table').append('<tr></tr>');
            var tr = $('#euphonies_table tr:last');
            tr.attr('class', tr_class);
            //---------

            // ordre des colonnes : edition, year, category, sub category, price,
            // first name, last name, country, title, duration, isni
            // (le champ 8 = temp id n'est pas affiche ; le champ 3 = imeb id,
            // c-a-d le MISAM, n'est plus affiche non plus mais reste transporte
            // et sert toujours de propriete imeb_id aux agents du SMA)
            var colOrder = [0, 1, 9, 10, 2, 4, 5, 12, 6, 7, 11];
            for (var j = 0; j < colOrder.length; j++) {

                var idx = colOrder[j];
                var value = arr[i+idx];

                // L'ISNI n'est plus un simple lien sortant : le clic ouvre une
                // fiche recapitulative (voir openIsniBox). Le lien reste un vrai
                // <a href> pour que ctrl+clic / clic milieu ouvrent isni.org.
                if(idx==11){
                    var isniVal = $.trim(value || '');
                    if(/^[0-9]{15}[0-9Xx]$/.test(isniVal.replace(/\s+/g, ''))){
                        value = '<a class="isni-link" title="voir la fiche ISNI" '
                              + 'href="https://isni.org/isni/' + isniVal + '" '
                              + 'data-isni="' + isniVal + '">' + isniVal + '</a>';
                    } else {
                        value = isniVal;
                    }
                }

                tr.append('<td>'+ value + '</td>');
            }

            // Le clic sur l'ISNI ouvre la fiche et ne doit PAS declencher la
            // requete data.bnf.fr de la ligne : on l'attache directement au lien
            // (phase cible) et on stoppe la propagation vers le <tr>.
            tr.find('a.isni-link').on('click', function(evt){
                if(evt.ctrlKey || evt.metaKey || evt.shiftKey || evt.which === 2) return;
                evt.preventDefault();
                evt.stopPropagation();
                openIsniBox($(this));
            });

            //--------- data.bnf.fr : le clic sur une ligne deplie la notice du
            //--------- compositeur JUSTE SOUS cette ligne (voir toggleBnfRow).
            //--------- Les donnees utiles au depliage sont portees par le <tr>.
            var isniRaw = $.trim(arr[i+11] || '').replace(/\s+/g, '');

            tr.data('isni',  /^[0-9]{15}[0-9Xx]$/.test(isniRaw) ? isniRaw : '')
              .data('who',   $.trim(arr[i+4] + ' ' + arr[i+5]))
              .data('title', $.trim(arr[i+6]));

            tr.css("cursor", "pointer").on('click', function(){ toggleBnfRow($(this)); });
        }

        $("#info").append("<p>" + arr.length/numOfElements + "</p>");

    });

    //--------- SMA
    startSMA();
    //---------

}

/* =========================================================================
   Fiche ISNI — boite flottante ouverte au clic sur un ISNI du tableau.

   Elle est attachee a <body> en position absolue : elle est donc HORS FLUX
   et ne deplace rien (ni le tableau, ni le canvas). Elle se
   place sous l'ISNI clique, recalee si elle deborde de la fenetre.

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

/* =========================================================================
   Notices data.bnf.fr : accordeon dans le tableau
   -------------------------------------------------------------------------
   Le clic sur une ligne du tableau interroge le point SPARQL de la BnF a
   partir de l'ISNI du compositeur et deplie le resultat dans une ligne
   inseree juste sous la ligne cliquee (plus rien en bas de page).

   data.bnf.fr autorise les requetes cross-origin : pas besoin de proxy PHP,
   contrairement a ISNI (cf. php/retrieve_isni.php).

   Le format demande est application/sparql-results+json et non plus la page
   HTML du formulaire Virtuoso : on maitrise ainsi le rendu et on peut
   dedoublonner. Les jointures d'edition sont OPTIONAL, sinon les oeuvres
   sans manifestation disparaissaient silencieusement du resultat.
   ========================================================================= */

var bnfCache = {};   // memoire de session : un compositeur n'est interroge qu'une fois

/* comparaison de titres insensible a la casse, aux accents et a la ponctuation */
function bnfNorm(s){
    s = String(s == null ? '' : s).toLowerCase();
    if(s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.replace(/[^a-z0-9]+/g, '');
}

/* l'URI SPARQL (http, suffixe #about) vers l'URL de la page publique */
function bnfArk(uri){
    return String(uri || '').replace(/^http:\/\//, 'https://').replace(/#about$/, '');
}

function bnfQueryUrl(isni){

    var q = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\n'
      + 'PREFIX rdarelationships: <http://rdvocab.info/RDARelationshipsWEMI/>\n'
      + 'PREFIX dcterms: <http://purl.org/dc/terms/>\n'
      + 'PREFIX bnf-onto: <http://data.bnf.fr/ontology/bnf-onto/>\n'
      + 'PREFIX isni: <http://isni.org/ontology#>\n'
      + 'SELECT DISTINCT ?auteur ?work ?titreOeuvre ?anneeOeuvre ?edition ?titreEdition ?dateEdition WHERE {\n'
      + '  ?concept isni:identifierValid "' + isni + '" ; foaf:focus ?auteur .\n'
      + '  ?work dcterms:creator ?auteur ; dcterms:title ?titreOeuvre .\n'
      + '  OPTIONAL { ?work bnf-onto:firstYear ?anneeOeuvre }\n'
      + '  OPTIONAL { ?edition rdarelationships:workManifested ?work ; dcterms:title ?titreEdition .\n'
      + '             OPTIONAL { ?edition bnf-onto:firstYear ?dateEdition } }\n'
      + '} ORDER BY ?titreOeuvre ?dateEdition LIMIT 400';

    return 'https://data.bnf.fr/sparql?default-graph-uri=&format=application%2Fsparql-results%2Bjson'
         + '&timeout=0&query=' + encodeURIComponent(q);
}

/* Le SPARQL renvoie un produit cartesien oeuvres x editions : chaque edition
   repete le titre et l'annee de son oeuvre. On regroupe par URI d'oeuvre puis
   on separe les editions qui ne font que redire le titre de l'oeuvre (elles
   n'apportent que leur date) de celles qui portent un titre propre. */
function bnfParse(json){

    var out = {author: null, works: []}, byWork = {};
    var b = (json && json.results && json.results.bindings) ? json.results.bindings : [];

    for (var i = 0; i < b.length; i++) {

        var x = b[i];
        if(!out.author && x.auteur) out.author = bnfArk(x.auteur.value);
        if(!x.work || !x.titreOeuvre) continue;

        var k = x.work.value, w = byWork[k];
        if(!w){
            w = byWork[k] = {uri: bnfArk(k), title: $.trim(x.titreOeuvre.value),
                             year: x.anneeOeuvre ? x.anneeOeuvre.value : '', eds: {}, edList: []};
            out.works.push(w);
        }

        if(x.edition){
            var ek = x.edition.value;
            if(!w.eds[ek]){
                w.eds[ek] = 1;
                w.edList.push({uri: bnfArk(ek), title: x.titreEdition ? $.trim(x.titreEdition.value) : '',
                               year: x.dateEdition ? x.dateEdition.value : ''});
            }
        }
    }

    for (var j = 0; j < out.works.length; j++) {

        var wk = out.works[j], plain = [], named = [];

        for (var e = 0; e < wk.edList.length; e++) {
            var ed = wk.edList[e];
            // "Titre : sous-titre" compte aussi comme une redite du titre
            var same = bnfNorm(ed.title) === bnfNorm(wk.title)
                    || bnfNorm(ed.title.split(/\s+:\s+/)[0]) === bnfNorm(wk.title);
            if(same || !ed.title) plain.push(ed); else named.push(ed);
        }

        wk.plain = plain; wk.named = named;
    }

    out.works.sort(function(a, c){
        var ya = parseInt(a.year, 10) || 0, yc = parseInt(c.year, 10) || 0;
        if(ya !== yc) return yc - ya;
        return a.title.localeCompare(c.title);
    });

    return out;
}

function bnfRender(d, who, rowTitle){

    var h = [], n = d.works.length;

    h.push('<div class="bnf-panel"><div class="bnf-hd">'
         + '<span class="bnf-hd-t">Notices data.bnf.fr — <span class="bnf-hd-n">' + esc(who) + '</span></span>');
    if(d.author) h.push('<a href="' + esc(d.author) + '" target="_blank" rel="noopener">fiche d\'autorité</a>');
    h.push('<span class="bnf-count">' + n + (n > 1 ? ' œuvres référencées' : ' œuvre référencée') + '</span>');
    h.push('<span class="bnf-close" title="fermer">&times;</span></div>');

    if(!n){
        h.push('<p class="bnf-warn">Aucune œuvre référencée dans data.bnf.fr pour ce compositeur.</p></div>');
        return h.join('');
    }

    h.push('<div class="bnf-bd"><ul class="bnf-works">');

    var rt = bnfNorm(rowTitle);   // l'Euphonie d'Or de la ligne cliquee : mise en avant

    for (var i = 0; i < n; i++) {

        var w = d.works[i];
        var match = rt && bnfNorm(w.title) === rt;

        h.push('<li class="bnf-work' + (match ? ' is-match' : '') + '">'
             + '<span class="bnf-y">' + esc(w.year || '—') + '</span>'
             + '<a class="bnf-t" href="' + esc(w.uri) + '" target="_blank" rel="noopener">' + esc(w.title) + '</a>');

        // editions sans titre propre : on ne garde que leurs annees, dedoublonnees
        var years = [];
        for (var p = 0; p < w.plain.length; p++) if(w.plain[p].year) years.push(w.plain[p].year);
        years = years.filter(function(y, k2, a2){ return a2.indexOf(y) === k2 && y !== w.year; });

        if(years.length || w.named.length){

            h.push('<ul class="bnf-eds">');

            if(years.length) h.push('<li><span class="bnf-y2">' + esc(years.join(', ')) + '</span>'
                                  + (years.length > 1 ? 'éditions' : 'édition') + '</li>');

            for (var q = 0; q < w.named.length; q++) {
                h.push('<li><span class="bnf-y2">' + esc(w.named[q].year || '—') + '</span>'
                     + '<a href="' + esc(w.named[q].uri) + '" target="_blank" rel="noopener">'
                     + esc(w.named[q].title) + '</a></li>');
            }

            h.push('</ul>');
        }

        h.push('</li>');
    }

    h.push('</ul></div></div>');
    return h.join('');
}

function closeBnfRow(){
    $('#euphonies_table tr.bnf-row').remove();
    $('#euphonies_table tr.bnf-open').removeClass('bnf-open');
}

/* Une seule notice ouverte a la fois : un second clic referme. */
function toggleBnfRow(tr){

    var isni  = String(tr.data('isni')  || '');
    var who   = String(tr.data('who')   || '');
    var title = String(tr.data('title') || '');

    var wasOpen = tr.hasClass('bnf-open');
    closeBnfRow();
    if(wasOpen) return;

    tr.addClass('bnf-open');

    var cols = tr.children('td').length;
    var row  = $('<tr class="bnf-row"><td colspan="' + cols + '"></td></tr>').insertAfter(tr);
    var cell = row.children('td');

    cell.on('click', '.bnf-close', function(){ closeBnfRow(); });

    if(!isni){
        cell.html('<div class="bnf-panel"><p class="bnf-warn">Pas d\'ISNI pour ce compositeur&nbsp;: data.bnf.fr ne peut pas être interrogé.</p></div>');
        return;
    }

    if(bnfCache[isni]){ cell.html(bnfRender(bnfCache[isni], who, title)); return; }

    cell.html('<div class="bnf-panel"><p class="bnf-wait">Interrogation de data.bnf.fr&hellip;</p></div>');

    $.ajax({url: bnfQueryUrl(isni), dataType: 'json'})

        .done(function(json){
            var d = bnfParse(json);
            bnfCache[isni] = d;
            // la ligne a pu etre refermee entre-temps
            if(row.parent().length) cell.html(bnfRender(d, who, title));
        })

        .fail(function(){
            if(row.parent().length) cell.html('<div class="bnf-panel"><p class="bnf-warn">data.bnf.fr n\'a pas répondu.</p></div>');
        });
}

// Echap referme aussi la notice depliee (comme la fiche ISNI).
$(document).on('keydown.bnf', function(evt){ if(evt.key === 'Escape') closeBnfRow(); });
