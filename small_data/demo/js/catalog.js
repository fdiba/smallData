//---- Catalogues (International / IMEB Sound Archives) — logique propre a la page.
//---- L'etat et les fonctions du SMA sont dans js/sma_core.js.

numberOfNodesOnDisplayMax = 400;

// Phono A : en dessous de ce nombre d'OEUVRES, une portion-pays n'affiche pas le
// SMA (trop peu d'agents pour un regroupement parlant) — seul le tableau filtre
// s'affiche. (C'est le nombre affiche entre parentheses dans le menu Country.)
var SMA_MIN_WORKS = 20;

// id de la phonotheque courante (1 = Phono A, 2 = Phono B), lu au chargement et
// reutilise par le menu Country (selectCountry / showFullTable).
var _catId = 0;

window.onload = function() {

	var cat = $.urlParam('id');
	_catId = parseInt(cat, 10) || 0;

    if(cat==1 || cat==2){
        // Les deux phonotheques ont le menu "Country" + le bouton "All works".
        // Difference de DEFAUT :
        //  - Phono A (id=1) : trop d'oeuvres (~4380) pour un seul SMA (SMA.md §11)
        //    -> "All works" = tableau complet SANS SMA ; le SMA n'apparait qu'en
        //    choisissant un pays (et si >= SMA_MIN_WORKS oeuvres).
        //  - Phono B (id=2) : petit fonds (~470) -> "All works" affiche le SMA sur
        //    TOUT par defaut ; un pays filtre. Le SMA n'est jamais masque.
        initSMA(1210, 800);   // largeur = 2 tableaux (600) + gap (10) -> bord droit aligne
        startSMA();               // boucle lancee UNE seule fois
        buildCountryMenu();       // remplit le menu "Country" (pays de la bonne phono)
        retrieveData(cat, 11, 0);  // etat initial = "All works" (retrieveData gere le canvas)

    } else {
        retrieveData(-999, 11);
    }

};

//incremente a chaque nouveau chargement (clic pays / tableau complet) : une
//reponse AJAX arrivee en retard est ignoree si un autre chargement a ete
//lance entre-temps (evite de melanger deux portions).
var _catLoadSeq = 0;

function retrieveData(cat, numOfElements, country){

    var doSMA  = (cat == 2) || (cat == 1 && (+country) > 0);
    var myLoad = ++_catLoadSeq;

    var CHUNK = 200;   // nombre de lignes inserees par lot

    $("#info").append('<p id="loading">loading…</p>');

    $.ajax({
        url: 'php/retrieve_cat.php',
        type: "POST",
        data: {cat: cat, country: country || 0}

    }).done(function(str) {

        if(myLoad !== _catLoadSeq) return;   // chargement perime : on abandonne

        var arr = str.split("%");

        $("#listing").append('<ul></ul>');

        // Les donnees arrivent triees par compositeur (nom, prenom) puis titre.
        // 11 champs par oeuvre depuis l'ajout, tous en FIN d'enregistrement,
        // du pays (arr[k+7]), de l'ISNI (arr[k+8]), des annees de programmation
        // (arr[k+9]) et de l'annee de concours (arr[k+10]) — voir
        // php/retrieve_cat.php, fonction retrieve_cat. numOfElements est passe
        // par les appelants et doit rester synchronise avec le PHP.
        var works = [];
        for (var k = 0; k + numOfElements - 1 < arr.length; k += numOfElements) {
            works.push({misam: arr[k], fn: arr[k+1], ln: arr[k+2],
                        id_artist: arr[k+3], title: arr[k+4],
                        duration: arr[k+5], id: arr[k+6], ctry: arr[k+7],
                        isni: arr[k+8], editions: arr[k+9], award: arr[k+10]});
        }
        var total = works.length;

        // Le pays s'affiche sous le nom du compositeur UNIQUEMENT en vue
        // "All works" (country == 0). Des qu'un pays est selectionne dans le
        // menu Country, il est deja rappele dans #cookies et serait identique
        // sur toutes les lignes : l'afficher n'apprendrait rien et alourdirait
        // la colonne.
        var showCtry = !((+country) > 0);

        // Visibilite du SMA + du canvas.
        var showSMA = doSMA;
        if(cat == 1 && (+country) === 0){
            // Phono A "All works" : trop d'oeuvres (~4380) pour un seul SMA
            // (SMA.md §11) -> jamais de SMA, tableau seul.
            showSMA = false;
            $("#myCanvas").hide();
            $("#infos").hide();
            $("#sma_note").hide();
        } else if(cat == 1 || cat == 2){
            // Portion (un pays, ou "tout" en Phono B) : SMA seulement si assez
            // d'oeuvres. MEME SEUIL SMA_MIN_WORKS pour les deux phonotheques.
            showSMA = (total >= SMA_MIN_WORKS);
            if(showSMA){
                $("#sma_note").hide();
                $("#myCanvas").show();
                $("#infos").show();
            } else {
                $("#myCanvas").hide();
                $("#infos").hide();
                $("#sma_note").text('Too few works (' + total + ') to build the visualization — showing the table only.').show();
            }
        }

        // Longueur de chaque serie contigue d'oeuvres d'un meme compositeur,
        // pour le rowspan de la cellule composer. Calculee sur les series
        // reellement contigues : si un artiste apparait en plusieurs blocs
        // (fiche en double, tri imparfait), chaque bloc a sa propre cellule
        // au lieu de casser la mise en page.
        var runLength = [];
        for (var k = works.length - 1; k >= 0; k--) {
            if(k < works.length - 1 && works[k].id_artist === works[k+1].id_artist){
                runLength[k] = runLength[k+1] + 1;
            } else {
                runLength[k] = 1;
            }
        }

        var table  = document.getElementById('works_table');
        var table2 = document.getElementById('works_table_2');
        // Toutes les lignes d'un meme tableau doivent aller dans le meme tbody :
        // une insertion directe sur <table> cree un tbody par lot, et un rowspan
        // ne peut pas s'etendre d'un tbody a l'autre (colonnes decalees).
        var tbodyA = table.tBodies[0] || table;
        var tbodyB = table2 ? (table2.tBodies[0] || table2) : null;

        // --- repartition sur deux colonnes cote a cote ---
        // On coupe la liste en deux a une FRONTIERE DE COMPOSITEUR (jamais au
        // milieu d'un groupe, sinon le rowspan de la cellule compositeur serait
        // casse). Le point de coupure est le premier debut de groupe atteint
        // apres la moitie des lignes, pour equilibrer la hauteur des colonnes.
        var splitIndex = works.length;   // defaut : tout dans la colonne de gauche
        if(table2 && works.length > 1){
            var half = works.length / 2;
            var best = -1, bestDist = Infinity;
            for (var s = 1; s < works.length; s++) {
                if(works[s].id_artist !== works[s-1].id_artist){
                    var d = Math.abs(s - half);
                    if(d < bestDist){ bestDist = d; best = s; }
                }
            }
            if(best !== -1) splitIndex = best;   // sinon (1 seul compositeur) tout a gauche
        }

        var i = 0;
        var prevArtist = null;
        var groupIndex = -1;
        var memberIndex = 0;

        // Affichage par lots : le tableau se remplit progressivement
        // et le navigateur reste reactif entre deux lots.
        function renderChunk(){

            if(myLoad !== _catLoadSeq) return;   // un autre chargement a demarre : stop

            var htmlA = "", htmlB = "";
            var stop = Math.min(i + CHUNK, works.length);

            for (; i < stop; i++) {

                var w = works[i];

                //--------- SMA : Phono B (tout) ou Phono A filtree par pays
                //           (seulement si assez de compositeurs, cf. showSMA)
                if(showSMA){
                    // ctry et isni alimentent la boite violette
                    // (Particle.prototype.getInfoFrom). ATTENTION : l'ajout
                    // d'une propriete au SMA se declare a QUATRE endroits —
                    // ici, puis dans js/particles_catalog.js (champ du
                    // constructeur, litteral this.records, et createNewChild)
                    // et dans js/childs_catalog.js.
                    records.push({imeb_id: w.misam, fn: w.fn, ln: w.ln,
                                  id: w.id,
                                  title: w.title, duration: w.duration,
                                  ctry: w.ctry, isni: w.isni,
                                  editions: w.editions});
                }
                //---------

                // Une seule cellule par compositeur, etendue sur toutes ses oeuvres.
                var newGroup = (w.id_artist !== prevArtist);
                if(newGroup){ groupIndex++; memberIndex = 0; prevArtist = w.id_artist; }
                else { memberIndex++; }

                // Meme code couleur que award-winning_works.php :
                //  - la cellule compositeur (fusionnee) prend une teinte alternee par groupe
                //  - chaque oeuvre d'un meme compositeur recoit une teinte alternee
                var grpParity = (groupIndex % 2 === 0) ? 'grp-cell-a' : 'grp-cell-b';
                var memParity = ((groupIndex + memberIndex) % 2 === 0) ? 'mem-a' : 'mem-b';

                var row = newGroup ? '<tr class="group-start">' : '<tr>';

                if(newGroup){
                    // Le pays vient en seconde ligne DANS la cellule compositeur
                    // (deja fusionnee sur toutes les oeuvres de l'artiste) : pas
                    // de colonne supplementaire, la largeur du tableau ne bouge
                    // pas. Un artiste sans pays rattache n'a tout simplement pas
                    // cette seconde ligne.
                    var composer = w.fn + ' ' + w.ln;
                    if(showCtry && w.ctry){
                        composer += '<span class="composer-ctry">' + w.ctry + '</span>';
                    }
                    row += '<td class="composer grp-cell ' + grpParity + '" rowspan="' + runLength[i] + '">'
                          + composer + '</td>';
                }

                // Marqueur des oeuvres primees : une etoile discrete APRES le
                // titre, pour ne pas gener la lecture alphabetique. Elle ne
                // cree pas de colonne (9 % de la Phono A, 4 % de la Phono B :
                // une colonne serait vide presque partout). Le detail du
                // palmares reste sur award-winning_works.php.
                var titleCell = w.title;
                if(w.award){
                    titleCell += ' <span class="work-award" title="awarded at the '
                              + w.award + ' competition">&#9733;</span>';
                }

                // Derniere colonne : les annees de programmation, a la place de
                // l'ancienne colonne "imeb id" (le MISAM reste transporte dans
                // works et dans le SMA, il n'est simplement plus affiche).
                // La virgule du stockage ("1980,1992") recoit une espace pour
                // rester lisible ; la cellule est vide quand la donnee manque.
                var editionsCell = w.editions ? w.editions.replace(/\s*,\s*/g, ', ') : '';

                row += '<td class="' + memParity + '">' + titleCell + '</td>'
                      + '<td class="' + memParity + '">' + w.duration + '</td>'
                      + '<td class="' + memParity + ' work-ed">' + editionsCell + '</td></tr>';

                // avant le point de coupure -> colonne de gauche, sinon droite
                if(i < splitIndex) htmlA += row; else htmlB += row;
            }

            // Une seule insertion par lot et par colonne
            if(htmlA) tbodyA.insertAdjacentHTML('beforeend', htmlA);
            if(htmlB && tbodyB) tbodyB.insertAdjacentHTML('beforeend', htmlB);

            $("#loading").text(Math.min(i, total) + " / " + total);

            if(i < works.length){
                setTimeout(renderChunk, 0);
            } else {
                $("#loading").remove();
                // si tout tient dans la colonne de gauche, on masque la seconde
                if(table2 && splitIndex >= works.length){ table2.classList.add('is-empty'); }
                if(cat != null){
                    $("#info").append("<p>" + total + " (provisionnal count)</p>");
                } else {
                    $("#info").append("<p>" + total + "</p>");
                }
            }
        }

        renderChunk();

    }).fail(function(){
        $("#loading").text("loading failed");
    });

}

/* =========================================================================
   Fiche ISNI — boite flottante ouverte au clic sur l'ISNI affiche dans la
   boite violette du SMA (Particle.prototype.getInfoFrom, js/particles_catalog.js).

   Code repris tel quel de js/euphonies.js (via js/aww.js) : meme proxy, meme
   rendu, memes styles (.isni-* dans css/catalog.css). Cette page n'a pas de
   colonne ISNI dans son tableau, l'unique point d'entree est donc la boite
   violette — et l'ISNI n'y apparait que pour les compositeurs alignes sur
   data.bnf.fr.

   Rappel : la boite violette n'existe que lorsque le SMA est affiche
   (Phono B, ou Phono A filtree par un pays d'au moins SMA_MIN_WORKS oeuvres).
   En vue "All works" de la Phono A il n'y a pas de SMA, donc pas de fiche.

   Elle est attachee a <body> en position absolue : elle est donc HORS FLUX
   et ne deplace rien (ni le tableau, ni le canvas). Elle se place sous l'ISNI
   clique, recalee si elle deborde de la fenetre.

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

//====================================================================
// Phono A (id=1) : navigation PAR PAYS
//--------------------------------------------------------------------
// Le fonds A (~4380 oeuvres) est trop grand pour un seul SMA (voir SMA.md
// §11). On affiche une PORTION a la fois : les oeuvres d'un pays. 63 pays
// sur 65 tiennent sous le plafond (<= 400 oeuvres) et se consolident
// entierement ; USA (614) et France (573) debordent et sont ecoules par le
// flux progressif existant. Changer de pays remet le SMA a zero.
//====================================================================

// Remet a zero le SMA pour charger une nouvelle portion (nouveau pays).
function resetSMAForPortion(){
    resetAll();                 // pointer001=0, particles=[], sl_attribute="", attributes_count=[], menu "Group by" vide...
    records = [];               // ...mais resetAll ne vide pas le pool : on le fait ici
    $("#calculations ul").empty();
    $("#cookies").empty();
    $("#titles").empty();
    $("#selection").empty();
    $("#sma_note").hide();      // masque une eventuelle note "trop peu de compositeurs"
}

// Vide la table d'oeuvres (garde les entetes) avant de la reconstruire.
//
// L'entete n'est PAS reecrite ici : on retire les lignes de donnees et on
// laisse en place la premiere ligne, celle que catalog.php a ecrite. Cette
// fonction reconstruisait auparavant le tableau entier a partir d'une chaine
// en dur, restee sur l'ancienne colonne "imeb id" : la colonne "edition(s)"
// qui l'a remplacee dans catalog.php reprenait donc son ancien nom des qu'on
// choisissait un pays ou revenait a "All works". Une seule source pour
// l'entete — le HTML — supprime la possibilite meme de cette derive.
function clearRowsBelowHeader(t){
    // deleteRow(1) plutot que innerHTML : l'entete conserve son identite et
    // ses eventuels attributs, et le tbody implicite du navigateur, dans
    // lequel renderChunk insere ensuite les lignes, n'est pas detruit.
    while(t.rows.length > 1) t.deleteRow(1);
}
function clearCatalogTable(){
    var t1 = document.getElementById('works_table');
    var t2 = document.getElementById('works_table_2');
    if(t1){ clearRowsBelowHeader(t1); t1.classList.remove('is-empty'); }
    if(t2){ clearRowsBelowHeader(t2); t2.classList.remove('is-empty'); }
    $("#listing").empty();
    $("#loading").remove();
    $("#info p").not(':first').remove();   // enleve les compteurs, garde le <p> d'origine
}

// Construit le menu "Country" a partir de php/retrieve_countries.php
// (pays de la phonotheque courante _catId).
function buildCountryMenu(){
    $.ajax({ url: 'php/retrieve_countries.php', type: "POST", data: { cat: _catId } })
     .done(function(str){
        var ul = $("#countries ul");
        ul.empty();

        // bouton : "All works" -> tableau complet (+ SMA sur tout en Phono B).
        // Actif par defaut (etat de depart de la page).
        var allLi = $('<li class="all-works">All works (full table)</li>')
                      .css("text-decoration", "underline")
                      .css("font-weight", "bold");
        allLi.on("click", showFullTable);
        ul.append(allLi);

        if(!str) return;
        var arr = str.split("%");
        for(var k = 0; k + 2 < arr.length; k += 3){
            var cid = arr[k], cname = arr[k+1], cnt = arr[k+2];
            var li = $('<li></li>')
                       .attr("data-cid", cid)
                       .text(cname + " (" + cnt + ")")
                       .css("text-decoration", "underline");
            (function(id, nm, el){
                el.on("click", function(){ selectCountry(id, nm, el); });
            })(cid, cname, li);
            ul.append(li);
        }
     })
     .fail(function(){
        $("#countries ul").empty().append('<li>countries: loading failed</li>');
     });
}

// Clic sur un pays : reset SMA + table, puis chargement de la portion.
// La visibilite du canvas est decidee dans retrieveData (seuil SMA_MIN_WORKS en
// Phono A ; toujours affiche en Phono B).
function selectCountry(cid, name, liEl){
    resetSMAForPortion();
    clearCatalogTable();
    $("#countries ul li").css("font-weight", "normal");
    if(liEl) liEl.css("font-weight", "bold");
    $("#cookies").empty().append('<p>country: ' + name + '</p>');
    retrieveData(_catId, 11, cid); // filtre la table + (selon la phono) alimente le SMA
}

// Bouton "All works" : tableau complet. Phono A -> canvas masque (retrieveData) ;
// Phono B -> SMA sur tout (retrieveData montre le canvas).
function showFullTable(){
    resetSMAForPortion();
    clearCatalogTable();
    $("#countries ul li").css("font-weight", "normal");
    $("#countries ul li.all-works").css("font-weight", "bold");
    retrieveData(_catId, 11, 0);  // country=0 -> Phono A: pas de SMA ; Phono B: SMA sur tout
}
