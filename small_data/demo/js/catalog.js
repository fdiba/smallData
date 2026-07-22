//---- Catalogues (International / IMEB Sound Archives) — logique propre a la page.
//---- L'etat et les fonctions du SMA sont dans js/sma_core.js.

numberOfNodesOnDisplayMax = 400;

window.onload = function() {

	var cat = $.urlParam('id');

	if(cat==1 || cat==2)retrieveData(cat, 7);
	else retrieveData(-999, 7);

    if(cat==2){

        initSMA(1200, 800);

    } else if(cat==1){
        $("#myCanvas").hide();
        $("#infos").hide();
        $("#sma_main_ctrl").hide();
        $("#sma_menu").hide();
    }

};
function retrieveData(cat, numOfElements){

    var CHUNK = 200;   // nombre de lignes inserees par lot

    $("#info").append('<p id="loading">loading…</p>');

    $.ajax({
        url: 'php/retrieve_cat.php',
        type: "POST",
        data: {cat: cat}

    }).done(function(str) {

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

            var htmlA = "", htmlB = "";
            var stop = Math.min(i + CHUNK, works.length);

            for (; i < stop; i++) {

                var w = works[i];

                //--------- SMA (inchange)
                if(cat == 2){
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

    //--------- SMA
    if(cat==2){
        startSMA();
    }
    //---------

}
