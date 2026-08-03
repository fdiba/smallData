/* =========================================================================
   Fiche ISNI — boite flottante partagee par les quatre pages qui affichent
   un identifiant ISNI : award-winning_works.php, catalog.php, categories.php
   et euphonies.php.

   Ce fichier est la SEULE copie du code. Il etait auparavant recopie a
   l'identique dans js/aww.js, js/catalog.js, js/categories.js et
   js/euphonies.js — quatre exemplaires strictement egaux octet pour octet,
   verifies fonction par fonction avant l'extraction. C'est exactement le
   mecanisme qui avait laisse survivre l'en-tete « imeb id » sur une page
   apres sa correction sur les autres : une seule copie, une seule
   correction.

   Le point d'entree, lui, reste propre a chaque page, et n'est donc pas ici :
     - award-winning_works.php et catalog.php : l'ISNI affiche dans la boite
       violette du SMA (Particle.prototype.getInfoFrom) ;
     - euphonies.php : la colonne ISNI du tableau ;
     - categories.php : le <text> SVG du noeud compositeur.
   Chacun se contente d'appeler openIsniBox($(element)), ou l'element porte
   un attribut data-isni. C'est le seul contrat entre les pages et ce fichier.

   La boite est attachee a <body> en position absolue : elle est donc HORS
   FLUX et ne deplace rien (ni tableau, ni canvas, ni diagramme). Elle se
   place sous l'element clique, recalee si elle deborde de la fenetre — utile
   sur categories.php, dont le diagramme fait plus de 6000 px de haut.

   Les styles (.isni-*) sont dans css/isni.css, feuille elle aussi partagee
   par les quatre pages. Les donnees viennent de php/retrieve_isni.php (proxy
   serveur : ISNI SRU, la notice JSON-LD d'isni.org et Wikidata ; voir ce
   fichier). Le proxy est indispensable, un appel direct depuis le navigateur
   serait bloque par CORS.

   Les libelles affiches sont en anglais, comme le reste du site. Ils
   n'existent plus qu'une fois : c'etait la seconde raison de l'extraction.

   Depend de jQuery (charge avant ce fichier dans les quatre pages).
   L'indentation d'origine (4 espaces) est conservee.
   ========================================================================= */

var isniCache = {};        // memoire de session : une notice n'est chargee qu'une fois
var isniAnchor = null;     // lien actuellement ouvert

/* ---------------------------------------------------------------------------
   Mode PANNEAU (dock). Par defaut la fiche est une boite flottante posee sous
   l'element clique. Une page peut demander qu'elle soit rendue dans un
   conteneur a elle — catalog.php l'ancre a droite de ses deux tableaux, ou il
   y a de la place libre, et le panneau y suit le defilement.

   Ce que le mode change, et rien d'autre :
     - la boite est appendue au conteneur au lieu de <body> ;
     - placeIsniBox() ne fait plus rien : c'est la CSS de la page qui place le
       conteneur (position fixe), pas le JS ;
     - le clic hors de la boite ne la referme plus. Une boite flottante posee
       sous un lien doit s'effacer des qu'on regarde ailleurs ; un panneau
       lateral, non — on veut pouvoir parcourir le tableau en le gardant sous
       les yeux. La croix et Echap restent, et un autre nom le remplace.

   A appeler AVANT la premiere ouverture (la boite n'est construite qu'une
   fois). Les trois autres pages ne l'appellent pas et gardent la boite
   flottante, inchangee.
   --------------------------------------------------------------------------- */
var isniDock = null;

function setIsniDock(el){
    isniDock = el || null;
}

function esc(s){
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function ensureIsniBox(){

    var box = $('#isniBox');
    if(box.length) return box;

    box = $('<div id="isniBox" class="isni-box" role="dialog" aria-label="ISNI record">'
          + '<div class="isni-hd"><span class="isni-hd-t"></span>'
          + '<span class="isni-close" title="close">&times;</span></div>'
          + '<div class="isni-bd"></div></div>').appendTo(isniDock || 'body');

    if(isniDock) box.addClass('isni-docked');

    box.on('click', '.isni-close', function(){ closeIsniBox(); });
    // un clic dans la boite ne doit pas la refermer
    box.on('click', function(evt){ evt.stopPropagation(); });

    $(document).on('keydown.isni', function(evt){ if(evt.key === 'Escape') closeIsniBox(); });
    if(!isniDock) $(document).on('click.isni', function(){ closeIsniBox(); });
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

    if(isniDock) return;   // mode panneau : la place est fixee par la CSS de la page

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

    // En-tete : l'identifiant, precede du nom quand l'element clique en porte
    // un (data-label). Utile surtout en mode panneau, ou la fiche n'est plus
    // posee a cote de ce qu'on vient de cliquer et ou « ISNI 0000 0000 … »
    // seul ne dit pas de qui il s'agit. Sans data-label, rien ne change.
    var label = String(anchor.attr('data-label') || '').trim();
    var head  = 'ISNI ' + isni.replace(/(.{4})(?=.)/g, '$1 ');
    box.find('.isni-hd-t').text(label ? label + ' — ' + head : head);
    box.addClass('open');

    if(isniCache[isni]){
        renderIsniBox(isniCache[isni]);
        placeIsniBox(anchor);
        return;
    }

    box.find('.isni-bd').html('<p class="isni-wait">Querying ISNI&hellip;</p>');
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
        h.push('<p class="isni-sec">Record</p><ul class="isni-list">');
        if(d.links.isni_org)  h.push('<li>' + lnk(d.links.isni_org, 'isni.org — public record') + '</li>');
        if(d.links.isni_oclc) h.push('<li>' + lnk(d.links.isni_oclc, 'isni.oclc.org — full data') + '</li>');
        h.push('</ul>');
    }

    //--- liens externes (Discogs, MusicBrainz, VIAF, Wikipedia...)
    if(d.external && d.external.length){
        h.push('<p class="isni-sec">External links</p><ul class="isni-list">');
        for (var k = 0; k < d.external.length && k < 20; k++) {
            h.push('<li>' + lnk(d.external[k].url, d.external[k].label) + '</li>');
        }
        if(d.external.length > 20) h.push('<li class="isni-more">and ' + (d.external.length - 20) + ' more</li>');
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
        h.push('<p class="isni-sec">Works listed</p><ul class="isni-list isni-titles">');
        for (var t = 0; t < d.titles.length; t++) h.push('<li>' + esc(d.titles[t]) + '</li>');
        if(d.titlesMore) h.push('<li class="isni-more">and ' + d.titlesMore + ' more</li>');
        h.push('</ul>');
    }

    //--- bases contributrices
    if(d.sources && d.sources.length){
        var codes = [];
        for (var s = 0; s < d.sources.length; s++) {
            if(d.sources[s].code && codes.indexOf(d.sources[s].code) === -1) codes.push(d.sources[s].code);
        }
        if(codes.length) h.push('<p class="isni-sec">Contributing databases</p>'
                              + '<p class="isni-codes">' + esc(codes.join(', ')) + '</p>');
    }

    //--- etats degradés
    if(d.status === 'empty'){
        h.push('<p class="isni-warn">No detailed data retrieved: the record is still available through the links above.</p>');
    } else if(d.status === 'error'){
        h.push('<p class="isni-warn">The server could not query ISNI: the links above remain valid.</p>');
    } else if(d.status === 'invalid'){
        h.push('<p class="isni-warn">Invalid ISNI.</p>');
    }

    $('#isniBox .isni-bd').html(h.join(''));
}
