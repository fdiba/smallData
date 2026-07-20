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

        var table = document.getElementById('works_table');
        // Toutes les lignes doivent aller dans le meme tbody : une insertion
        // directe sur <table> cree un tbody par lot, et un rowspan ne peut
        // pas s'etendre d'un tbody a l'autre (colonnes decalees).
        var tbody = table.tBodies[0] || table;
        var i = 0;
        var prevArtist = null;
        var groupIndex = -1;

        // Affichage par lots : le tableau se remplit progressivement
        // et le navigateur reste reactif entre deux lots.
        function renderChunk(){

            var html = "";
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
                if(newGroup){ groupIndex++; prevArtist = w.id_artist; }

                html += (groupIndex % 2 === 0) ? '<tr class="odd">' : '<tr class="even">';

                if(newGroup){
                    html += '<td class="composer" rowspan="' + runLength[i] + '">'
                          + w.fn + ' ' + w.ln + '</td>';
                }

                html += '<td>' + w.title + '</td><td>' + w.duration + '</td><td>' + w.misam + '</td></tr>';
            }

            // Une seule insertion par lot au lieu de deux par ligne
            tbody.insertAdjacentHTML('beforeend', html);

            $("#loading").text(Math.min(i, total) + " / " + total);

            if(i < works.length){
                setTimeout(renderChunk, 0);
            } else {
                $("#loading").remove();
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
