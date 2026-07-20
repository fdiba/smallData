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
        var total = Math.floor(arr.length / numOfElements);

        $("#listing").append('<ul></ul>');

        var table = document.getElementById('works_table');
        var i = 0;

        // Affichage par lots : le tableau se remplit progressivement
        // et le navigateur reste reactif entre deux lots.
        function renderChunk(){

            var html = "";
            var stop = Math.min(i + CHUNK * numOfElements, arr.length);

            for (; i < stop; i += numOfElements) {

                //--------- SMA (inchange)
                if(cat == 2){
                    records.push({imeb_id: arr[i], fn: arr[i+1], ln: arr[i+2],
                                  id: arr[i+6],
                                  title: arr[i+4], duration: arr[i+5]});
                }
                //---------

                html += (i / numOfElements % 2 === 0) ? '<tr class="odd">' : '<tr class="even">';

                for (var j = 0; j < numOfElements; j++) {
                    if(j != 3 && j != 6){   // 3 = artist_id, 6 = work_id
                        html += '<td>' + arr[i+j] + '</td>';
                    }
                }
                html += '</tr>';
            }

            // Une seule insertion par lot au lieu de deux par ligne
            table.insertAdjacentHTML('beforeend', html);

            $("#loading").text(Math.min(Math.floor(i / numOfElements), total)
                               + " / " + total);

            if(i < arr.length){
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
