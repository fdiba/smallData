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
// Parsing (10 champs par oeuvre) + libelles rank / sous-categorie
//------------------------------------------------------------------
function parseWorks(str){

    var arr = str.split("%");
    var numOfElements = 10;
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

        var cat2 = arr[i+9];
        if(cat2==1)cat2="Dispositif et instru.";
        else if(cat2==2)cat2="Esthétique formelle";
        else if(cat2==3)cat2="Esthétique program.";
        else if(cat2==4)cat2="Danse ou théâtre";
        else if(cat2==5)cat2="Installation ou environ.";
        else if(cat2==6)cat2="Multimédia";
        else if(cat2==7)cat2="Art sonore électroa.";
        else if(cat2==8)cat2="Avec instruments";
        else if(cat2==9)cat2="Sans instruments";
        else if(cat2==10)cat2="tendance netart";
        else if(cat2==11)cat2="tendance création";
        else if(cat2==12)cat2="tendance performance";

        objects.push({ year:arr[i], rank:rank, rank_code:arr[i+1], misam:arr[i+2],
                       fn:arr[i+3], name:arr[i+4], title:arr[i+5], cat:arr[i+8], cat2:cat2,
                       cat2_code:arr[i+9], duration:arr[i+6], id:arr[i+7] });
    }
    return objects;
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
            records.push({ edition:o.year, cat:o.cat, sub_cat:o.cat2, price:o.rank,
                           imeb_id:o.misam, fn:o.fn, ln:o.name, title:o.title,
                           duration:o.duration, id:o.id });
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

        html += '<td class="'+memParity+'">'+ objects[j].fn + '</td>'
              + '<td class="'+memParity+'">'+ objects[j].name + '</td>'
              + '<td class="'+memParity+'">'+ objects[j].title + '</td>'
              + '<td class="'+memParity+'">'+ objects[j].misam + '</td></tr>';
    }

    var table = document.getElementById('works_table');
    var tbody = table.tBodies[0] || table;
    tbody.insertAdjacentHTML('beforeend', html);
}
