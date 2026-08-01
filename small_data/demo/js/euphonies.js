//---- Euphonies d'Or — logique propre a la page.
//---- L'etat et les fonctions du SMA sont dans js/sma_core.js.

window.onload = function() {

    initSMA(800, 600);

    retrieveEuphonies(3, 12);

};
function retrieveEuphonies(cat, numOfElements){

    $.ajax({
        url: 'php/retrieve_cat.php',
        type: "POST",
        data: {cat: cat}

    }).done(function(str) {

        var arr=str.split("|");

        for (var i = 0; i < arr.length; i+=numOfElements) {

            var tr_class = "even";
            if(i/numOfElements%2==0) tr_class = "odd";

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
            // first name, last name, title, duration, imeb id, isni
            // (le champ 8 = temp id n'est pas affiche)
            var colOrder = [0, 1, 9, 10, 2, 4, 5, 6, 7, 3, 11];
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

            //--------- data.bnf.fr : clicking a row retrieves the matching records
            var isni=arr[i+numOfElements-1];

            var ark = "https://data.bnf.fr/sparql?default-graph-uri=&query=PREFIX+foaf%3A+%3Chttp%3A%2F%2Fxmlns.com%2Ffoaf%2F0.1%2F%3E%0D%0APREFIX+rdarelationships%3A+%3Chttp%3A%2F%2Frdvocab.info%2FRDARelationshipsWEMI%2F%3E%0D%0APREFIX+owl%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%0D%0APREFIX+dcterms%3A+%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Fterms%2F%3E%0D%0APREFIX+bnf-onto%3A+%3Chttp%3A%2F%2Fdata.bnf.fr%2Fontology%2Fbnf-onto%2F%3E%0D%0APREFIX+isni%3A+%3Chttp%3A%2F%2Fisni.org%2Fontology%23%3E%0D%0ASELECT+DISTINCT+%3Fwork+%3FtitreOeuvre+%3FanneeOeuvre+%3Fedition+%3FtitreEdition+%3FdateEdition%0D%0AWHERE%0D%0A%7B%0D%0A++%0D%0A%3Fconcept+isni%3AidentifierValid+%22"
            + isni +
            "%22%3B%0D%0Afoaf%3Afocus+%3Fauteur.%0D%0A%3Fwork+dcterms%3Acreator+%3Fauteur+%3B%0D%0A++++dcterms%3Atitle+%3FtitreOeuvre+%3B++++%0D%0A++++bnf-onto%3AfirstYear+%3FanneeOeuvre+.%0D%0A%3Fedition+rdarelationships%3AworkManifested+%3Fwork+.%0D%0A%3Fedition+dcterms%3Atitle+%3FtitreEdition+%3B%0D%0A++++bnf-onto%3AfirstYear+%3FdateEdition+.%0D%0A%7D%0D%0A&format=text%2Fhtml&timeout=0&should-sponge=&debug=on";

            tr.css("cursor", "pointer").data("foo", ark).click(function(){

                var url = $(this).data("foo");

                $.post(url, function( data ) {

                    // La reponse est une page HTML complete : on n'en garde que
                    // le tableau de resultats, sinon elle casse la mise en page.
                    // parseHTML avec keepScripts=false neutralise ses scripts.
                    var nodes = $($.parseHTML(data, document, false));
                    var results = nodes.filter('table').first();
                    if(!results.length) results = nodes.find('table').first();

                    $('#bnfData').empty();

                    if(results.length){

                        // Les URI arrivent parfois en texte brut : on les rend cliquables.
                        results.find('td').each(function(){
                            var cell = $(this);
                            if(cell.find('a').length===0){
                                var txt = $.trim(cell.text());
                                if(/^https?:\/\//.test(txt)){
                                    cell.empty().append($('<a>').attr('href', txt).text(txt));
                                }
                            }
                        });

                        // Liens relatifs resolus contre data.bnf.fr, https force,
                        // ouverture dans un nouvel onglet.
                        results.find('a').each(function(){
                            var a = $(this);
                            var href = a.attr('href') || '';
                            if(href.charAt(0)==='/') href = 'https://data.bnf.fr' + href;
                            href = href.replace(/^http:\/\//, 'https://');
                            a.attr({href: href, target: '_blank', rel: 'noopener'});
                        });

                        $('#bnfData').append('<h2>Notices data.bnf.fr</h2>').append(results);
                    } else {
                        $('#bnfData').append('<p>Aucune notice data.bnf.fr pour cette œuvre.</p>');
                    }

                });
            });
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
   et ne deplace rien (ni le tableau, ni le canvas, ni #bnfData). Elle se
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
