//---- Award-winning Works — logique propre a la page.
//---- L'etat et les fonctions du SMA sont dans js/sma_core.js.
//
//---- Menu "Year" (calque sur le menu Country de catalog) : "All works" par
//---- defaut (SMA sur tout, comme catalog.php?id=2) ; un clic sur une annee
//---- (edition) filtre le tableau ET le SMA. Le SMA ne s'affiche/ne se lance
//---- que si la selection compte au moins SMA_MIN_WORKS oeuvres (sinon tableau
//---- seul + note), comme sur catalog.

var SMA_MIN_WORKS = 20;
var allWorks = [];          // toutes les oeuvres primees chargees (objets)

window.onload = function() {

    initSMA(1064, 800);
    startSMA();             // boucle SMA lancee UNE seule fois

    $("#info p:eq(0)").text('loading…');

    $.ajax({ url: 'php/retrieve_works.php', type: "POST" }).done(function(str) {
        allWorks = parseWorks(str);
        buildYearMenu();
        showAllWorks();     // etat initial : tout (comme catalog id=2)
    });
};

//------------------------------------------------------------------
// Parsing (12 champs par oeuvre) + libelles rank / sous-categorie
//------------------------------------------------------------------
function parseWorks(str){

    var arr = str.split("%");
    // 12 depuis l'ajout du pays (arr[i+10]) puis de l'ISNI (arr[i+11]) en fin
    // d'enregistrement (php/retrieve_works.php)
    var numOfElements = 12;
    var objects = [];

    for (var i = 0; i < arr.length-(numOfElements-1); i+=numOfElements) {

        var rank = arr[i+1];
        if(rank==100)rank="Mention";
        else if(rank==101)rank="Mention 1";
        else if(rank==102)rank="Mention 2";
        else if(rank==103)rank="Mention 3";
        else if(rank==197)rank="Nominé";
        else if(rank==198)rank="Finaliste";
        else if(rank==199)rank="Prix";
        else if(rank==200)rank="Prix CNM";
        else if(rank==201)rank="Grand Prix";
        else if(rank==296)rank="Pierre d'Or";
        else if(rank==297)rank="Pierre d'Argent";
        else if(rank==298)rank="Prix Bregman";
        else if(rank==299)rank="Prix FNME";
        else if(rank==300)rank="Prix CIME";
        else if(rank==302)rank="1 et Prix CIME";
        else if(rank==303)rank="Prix CIME et Mention";
        else if(rank==304)rank="Prix CIME et Mention 1";
        else if(rank==500)rank="Magistère";
        else if(rank==600)rank="Résidence";

        // Libelles des sous-categories (imeb_music.award_cat_2, code entier
        // 1-12), en toutes lettres. Table identique a set_sub_cat() dans
        // php/retrieve_cat.php, qui sert la page euphonies : ici le code
        // arrive brut (retrieve_works.php ligne 28) et est traduit cote
        // client. Les deux tables doivent rester synchronisees.
        var cat2 = arr[i+9];
        if(cat2==1)cat2="Avec dispositifs et/ou instruments";
        else if(cat2==2)cat2="Esthétique formelle";
        else if(cat2==3)cat2="Esthétique à programme";
        else if(cat2==4)cat2="Danse ou théâtre";
        else if(cat2==5)cat2="Installation ou environnement sonore et musical";
        else if(cat2==6)cat2="Multimédia";
        else if(cat2==7)cat2="Art sonore électroacoustique";
        else if(cat2==8)cat2="Avec instruments";
        else if(cat2==9)cat2="Sans instruments";
        else if(cat2==10)cat2="tendance netart";
        else if(cat2==11)cat2="tendance création";
        else if(cat2==12)cat2="tendance performance";

        objects.push({ year:arr[i], rank:rank, rank_code:arr[i+1], misam:arr[i+2],
                       fn:arr[i+3], name:arr[i+4], title:arr[i+5], cat:arr[i+8], cat2:cat2,
                       cat2_code:arr[i+9], duration:arr[i+6], id:arr[i+7],
                       ctry:arr[i+10], isni:arr[i+11] });
    }
    return objects;
}

/* =========================================================================
   Fiche ISNI — boite flottante ouverte au clic sur l'ISNI affiche dans la
   boite violette du SMA (Particle.prototype.getInfoFrom, js/particles_award.js).

   Code repris tel quel de js/euphonies.js, ou la fiche s'ouvre depuis la
   colonne ISNI du tableau : meme proxy, meme rendu, memes styles (.isni-*
   dans css/aww.css). Sur cette page il n'y a pas de colonne ISNI, l'unique
   point d'entree est donc la boite violette — et l'ISNI n'y apparait que
   pour les compositeurs alignes sur data.bnf.fr.

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

//------------------------------------------------------------------
// Menu des annees (editions) : "All works" + une entree par annee
//------------------------------------------------------------------
function buildYearMenu(){

    var seen = {};
    for(var i=0; i<allWorks.length; i++) seen[allWorks[i].year] = true;
    // annees recentes d'abord (comme le tri du tableau)
    var years = Object.keys(seen).sort(function(a,b){ return parseInt(b,10) - parseInt(a,10); });

    var ul = $("#years ul");
    ul.empty();

    ul.append('<li class="all-works">All works</li>');
    ul.find('li.all-works').on("click", showAllWorks);

    for(var j=0; j<years.length; j++){
        var li = $('<li>').text(years[j]).attr('data-year', years[j]);
        li.on("click", (function(y){ return function(){ selectYear(y); }; })(years[j]));
        ul.append(li);
    }
}

function highlightYearMenu(sel){
    $("#years ul li").css("font-weight", "normal");
    if(sel) sel.css("font-weight", "bold");
}

function showAllWorks(){
    highlightYearMenu($("#years ul li.all-works"));
    renderSelection(allWorks);
}

function selectYear(year){
    highlightYearMenu($("#years ul li").filter(function(){ return $(this).attr('data-year') === String(year); }));
    var subset = allWorks.filter(function(w){ return String(w.year) === String(year); });
    renderSelection(subset);
}

//------------------------------------------------------------------
// Construit tableau + SMA pour une selection (tout / une annee)
//------------------------------------------------------------------
function renderSelection(works){

    // reinitialise le SMA (particules, menus Group by, selection, titres)
    resetAll();
    records = [];

    // copie triee : edition (recente d'abord) > category > sub category > price > last name
    var objects = works.slice();
    objects.sort(function(a, b){
        return cmpValues(b.year, a.year)
            || cmpValues(a.cat, b.cat)
            || cmpValues(a.cat2_code, b.cat2_code)
            || cmpValues(a.rank_code, b.rank_code)
            || cmpValues(a.name, b.name);
    });

    buildTableRows(objects);

    $("#info p:eq(0)").text(objects.length + " works");

    // SMA seulement si assez d'oeuvres (seuil commun a catalog : SMA_MIN_WORKS)
    if(objects.length >= SMA_MIN_WORKS){
        for (var i=0; i<objects.length; i++) {
            var o = objects[i];
            // ctry et isni alimentent la boite violette
            // (Particle.prototype.getInfoFrom). ATTENTION : l'ajout d'une
            // propriete au SMA se declare a QUATRE endroits — ici, puis dans
            // js/particles_award.js (champ du constructeur, litteral
            // this.records, et createNewChild) et dans js/childs_award.js.
            records.push({ edition:o.year, cat:o.cat, sub_cat:o.cat2, price:o.rank,
                           imeb_id:o.misam, fn:o.fn, ln:o.name, title:o.title,
                           duration:o.duration, ctry:o.ctry, isni:o.isni, id:o.id });
        }
        $("#myCanvas").show();
        $("#infos").show();      // boites verte (#cookies) / orange (#selection) / violette (#titles)
        $("#sma_note").hide().empty();
    } else {
        $("#myCanvas").hide();
        $("#infos").hide();      // pas de SMA -> on masque aussi ses boites d'info
        $("#sma_note").text('Too few works (' + objects.length + ') for the visualization — table only (needs at least ' + SMA_MIN_WORKS + ').').show();
    }
}

function cmpValues(a, b){
    if(a===undefined || a===null || a==='') a='';
    if(b===undefined || b===null || b==='') b='';
    var na = parseFloat(a), nb = parseFloat(b);
    if(!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b), 'fr', {sensitivity: 'base'});
}

function buildTableRows(objects){

    // on vide les lignes existantes SAUF l'en-tete (1re ligne)
    $('#works_table tr:gt(0)').remove();

    function groupKey(o){ return o.year + '|' + o.cat + '|' + o.cat2 + '|' + o.rank; }

    var html = '';
    var groupIndex = -1;
    var memberIndex = 0;

    for (var j = 0; j < objects.length; j++) {

        var isNewGroup = (j===0) || groupKey(objects[j-1]) !== groupKey(objects[j]);
        if(isNewGroup){ groupIndex++; memberIndex = 0; } else memberIndex++;

        var grpParity = (groupIndex % 2 === 0) ? 'grp-cell-a' : 'grp-cell-b';
        var memParity = ((groupIndex + memberIndex) % 2 === 0) ? 'mem-a' : 'mem-b';

        html += isNewGroup ? '<tr class="group-start">' : '<tr>';

        if(isNewGroup){
            // taille du groupe (edition/category/sub category/price) -> rowspan
            var span = 1;
            for(var k=j+1; k<objects.length && groupKey(objects[k])===groupKey(objects[j]); k++) span++;
            html += '<td class="grp-cell '+grpParity+'" rowspan="'+span+'">'+ objects[j].year + '</td>'
                  + '<td class="grp-cell '+grpParity+'" rowspan="'+span+'">'+ objects[j].cat + '</td>'
                  + '<td class="grp-cell '+grpParity+'" rowspan="'+span+'">'+ objects[j].cat2 + '</td>'
                  + '<td class="grp-cell '+grpParity+'" rowspan="'+span+'">'+ objects[j].rank + '</td>';
        }

        // "country" prend la place de l'ancienne colonne "imeb id" (le MISAM,
        // numero de gestion interne) et vient juste apres "last name".
        // Le MISAM reste transporte dans l'objet (objects[j].misam) et sert
        // toujours de propriete imeb_id aux agents du SMA.
        html += '<td class="'+memParity+'">'+ objects[j].fn + '</td>'
              + '<td class="'+memParity+'">'+ objects[j].name + '</td>'
              + '<td class="'+memParity+'">'+ objects[j].ctry + '</td>'
              + '<td class="'+memParity+'">'+ objects[j].title + '</td></tr>';
    }

    var table = document.getElementById('works_table');
    var tbody = table.tBodies[0] || table;
    tbody.insertAdjacentHTML('beforeend', html);
}
