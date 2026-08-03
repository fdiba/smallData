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
                        cat:arr[i+9], sub_cat:arr[i+10], isni:arr[i+11],
                        ctry:arr[i+12]};

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
                        value = '<a class="isni-link" title="ISNI record" '
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

        // Les en-tetes deviennent triables une fois les lignes en place (voir
        // js/table_sort.js). Trois precisions propres a cette page :
        //   - ignore : les lignes-notices data.bnf.fr ne sont pas des donnees,
        //     elles ne doivent pas etre triees avec le reste ;
        //   - before : et comme elles sont posees SOUS une ligne precise, on
        //     referme la notice ouverte avant de rebattre les lignes, faute de
        //     quoi elle se retrouverait sous une autre ;
        //   - zebra  : la parite est portee par des classes, elle est donc a
        //     reposer apres chaque tri.
        if(window.initTableSort){
            initTableSort('#euphonies_table', {
                ignore: 'bnf-row',
                zebra:  ['even', 'odd'],
                before: closeBnfRow
            });
        }

        $("#info").append("<p>" + arr.length/numOfElements + "</p>");

    });

    //--------- SMA
    startSMA();
    //---------

}

/* =========================================================================
   Fiche ISNI — le code de la boite est desormais dans js/isni_box.js, seule
   copie pour les quatre pages qui l'affichent (award-winning_works.php,
   catalog.php, categories.php, euphonies.php). Il figurait ici a l'identique,
   octet pour octet, comme dans les trois autres.

   Ne restent que les points d'entree, propres a cette page, et ils sont deux :
   la colonne ISNI du tableau (ci-dessus, dans la construction des lignes) et
   l'ISNI de la boite violette du SMA (js/particles_euphonies.js). Tous deux
   appellent openIsniBox($(lien)), le lien portant un attribut data-isni.
   ========================================================================= */

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
         + '<span class="bnf-hd-t">data.bnf.fr records — <span class="bnf-hd-n">' + esc(who) + '</span></span>');
    if(d.author) h.push('<a href="' + esc(d.author) + '" target="_blank" rel="noopener">authority record</a>');
    h.push('<span class="bnf-count">' + n + (n > 1 ? ' works listed' : ' work listed') + '</span>');
    h.push('<span class="bnf-close" title="close">&times;</span></div>');

    if(!n){
        h.push('<p class="bnf-warn">No work listed in data.bnf.fr for this composer.</p></div>');
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
                                  + (years.length > 1 ? 'editions' : 'edition') + '</li>');

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
        cell.html('<div class="bnf-panel"><p class="bnf-warn">No ISNI for this composer: data.bnf.fr cannot be queried.</p></div>');
        return;
    }

    if(bnfCache[isni]){ cell.html(bnfRender(bnfCache[isni], who, title)); return; }

    cell.html('<div class="bnf-panel"><p class="bnf-wait">Querying data.bnf.fr&hellip;</p></div>');

    $.ajax({url: bnfQueryUrl(isni), dataType: 'json'})

        .done(function(json){
            var d = bnfParse(json);
            bnfCache[isni] = d;
            // la ligne a pu etre refermee entre-temps
            if(row.parent().length) cell.html(bnfRender(d, who, title));
        })

        .fail(function(){
            if(row.parent().length) cell.html('<div class="bnf-panel"><p class="bnf-warn">data.bnf.fr did not respond.</p></div>');
        });
}

// Echap referme aussi la notice depliee (comme la fiche ISNI).
$(document).on('keydown.bnf', function(evt){ if(evt.key === 'Escape') closeBnfRow(); });
