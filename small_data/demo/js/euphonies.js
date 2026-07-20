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

            for (var j = 0; j < numOfElements; j++) {

                var value = arr[i+j];
                if(j==numOfElements-1)value="<a target=\"_blank\" href=\"https://isni.org/isni/" + value + "\">"+ value +"</a>";

                if(j!=8){ //8 = temp id
                    tr.append('<td>'+ value + '</td>');
                }
            }

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
