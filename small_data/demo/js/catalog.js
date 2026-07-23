//---- Catalogues (International / IMEB Sound Archives) — logique propre a la page.
//---- L'etat et les fonctions du SMA sont dans js/sma_core.js.

numberOfNodesOnDisplayMax = 400;

// Phono A : en dessous de ce nombre d'OEUVRES, une portion-pays n'affiche pas le
// SMA (trop peu d'agents pour un regroupement parlant) — seul le tableau filtre
// s'affiche. (C'est le nombre affiche entre parentheses dans le menu Country.)
var SMA_MIN_WORKS = 20;

window.onload = function() {

	var cat = $.urlParam('id');

    if(cat==2){
        // Phono B : SMA sur toute la collection (petit fonds, ~470 oeuvres).
        initSMA(1200, 800);
        startSMA();
        retrieveData(2, 7);

    } else if(cat==1){
        // Phono A : trop d'oeuvres (~4380) pour un seul SMA (voir SMA.md §11)
        // -> navigation PAR PAYS. On choisit un pays dans le menu "Country" pour
        // construire le SMA (et filtrer la table). "All works" revient au tableau
        // complet. Le canvas n'est visible QUE lorsqu'un pays est selectionne.
        initSMA(1200, 800);
        startSMA();               // boucle lancee UNE seule fois (records vide au depart)
        buildCountryMenu();       // remplit le menu "Country"
        retrieveData(1, 7, 0);    // tableau complet au depart, sans SMA
        $("#myCanvas").hide();    // etat initial = tableau complet -> pas de viz
        $("#infos").hide();

    } else {
        retrieveData(-999, 7);
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
        var works = [];
        for (var k = 0; k + numOfElements - 1 < arr.length; k += numOfElements) {
            works.push({misam: arr[k], fn: arr[k+1], ln: arr[k+2],
                        id_artist: arr[k+3], title: arr[k+4],
                        duration: arr[k+5], id: arr[k+6]});
        }
        var total = works.length;

        // Combien d'oeuvres dans cette portion ? En dessous du seuil, on
        // n'affiche pas le SMA (canvas masque + note) : le tableau filtre suffit.
        // Ne concerne que la navigation par pays (Phono A).
        var showSMA = doSMA;
        if(cat == 1 && (+country) > 0){
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
                    records.push({imeb_id: w.misam, fn: w.fn, ln: w.ln,
                                  id: w.id,
                                  title: w.title, duration: w.duration});
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
                    row += '<td class="composer grp-cell ' + grpParity + '" rowspan="' + runLength[i] + '">'
                          + w.fn + ' ' + w.ln + '</td>';
                }

                row += '<td class="' + memParity + '">' + w.title + '</td>'
                      + '<td class="' + memParity + '">' + w.duration + '</td>'
                      + '<td class="' + memParity + '">' + w.misam + '</td></tr>';

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
function clearCatalogTable(){
    var hdr = '<tr><th>composer</th><th>title</th><th>duration</th><th>imeb id</th></tr>';
    var t1 = document.getElementById('works_table');
    var t2 = document.getElementById('works_table_2');
    if(t1){ t1.innerHTML = hdr; t1.classList.remove('is-empty'); }
    if(t2){ t2.innerHTML = hdr; t2.classList.remove('is-empty'); }
    $("#listing").empty();
    $("#loading").remove();
    $("#info p").not(':first').remove();   // enleve les compteurs, garde le <p> d'origine
}

// Construit le menu "Country" a partir de php/retrieve_countries.php.
function buildCountryMenu(){
    $.ajax({ url: 'php/retrieve_countries.php', type: "POST" })
     .done(function(str){
        var ul = $("#countries ul");
        ul.empty();

        // bouton : revenir au tableau complet (sans SMA)
        var allLi = $('<li class="all-works">All works (full table)</li>')
                      .css("text-decoration", "underline");
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
// La visibilite du canvas est decidee dans retrieveData selon le nombre de
// compositeurs (seuil SMA_MIN_ARTISTS).
function selectCountry(cid, name, liEl){
    resetSMAForPortion();
    clearCatalogTable();
    $("#countries ul li").css("font-weight", "normal");
    if(liEl) liEl.css("font-weight", "bold");
    $("#cookies").empty().append('<p>country: ' + name + '</p>');
    retrieveData(1, 7, cid);     // filtre la table + (si assez de compositeurs) alimente le SMA
}

// Bouton "All works" : tableau complet, canvas masque (pas de viz).
function showFullTable(){
    resetSMAForPortion();
    clearCatalogTable();
    $("#myCanvas").hide();       // tableau complet -> on masque la viz
    $("#infos").hide();
    $("#countries ul li").css("font-weight", "normal");
    $("#countries ul li.all-works").css("font-weight", "bold");
    retrieveData(1, 7, 0);       // country=0 -> pas de push SMA
}
