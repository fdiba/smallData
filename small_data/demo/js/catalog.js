numberOfNodesOnDisplayMax = 400;

var SMA_MIN_WORKS = 20;

var SMA_H_FULL = 800;
var SMA_H_PETIT = SMA_H_FULL / 2;
var SMA_SEUIL_HAUTEUR = 400;

function setCanvasHeight(h){
    var cv = document.getElementById('myCanvas');
    if(!cv) return;
    var px = h * scale;
    if(cv.height === px) return;
    cv.height = px;
    smaGridReady = false;
    smaGrid = null;
    context.fillStyle = COLORS[0];
    context.fillRect(0, 0, cv.width, cv.height);
    context.stroke();
}

function coauthHtml(champ){
    var brut = $.trim(champ || '');
    if(!brut) return '';
    var parts = brut.split(';');
    var noms = [];
    for(var k = 0; k < parts.length; k++){
        if(!$.trim(parts[k])) continue;
        var t = parts[k].split('|');
        var nom = $.trim(t[0]);
        var isni = $.trim(t[1] || '');
        noms.push(isni
            ? '<span class="composer-isni" role="button" tabindex="0" data-isni="'
              + esc(isni) + '" data-label="' + esc(nom) + '">' + nom + '</span>'
            : nom);
    }
    if(!noms.length) return '';
    return ' <span class="work-coauth">with ' + noms.join(', ') + '</span>';
}

var _catId = 0;

window.onload = function() {

	var cat = $.urlParam('id');
	_catId = parseInt(cat, 10) || 0;

    if(cat==1 || cat==2){

        initSMA(1210, SMA_H_FULL);
        startSMA();
        buildCountryMenu();
        retrieveData(cat, 20, '');

    } else {
        retrieveData(-999, 20);
    }

};

var _catLoadSeq = 0;

function retrieveData(cat, numOfElements, country){

    var doSMA  = (cat == 1 || cat == 2);
    var myLoad = ++_catLoadSeq;

    var CHUNK = 200;

    $("#info").append('<p id="loading">loading…</p>');

    $.ajax({
        url: 'php/retrieve_cat.php',
        type: "POST",
        data: {cat: cat, country: (country === undefined || country === null) ? '' : country}

    }).done(function(str) {

        if(myLoad !== _catLoadSeq) return;

        var arr = str.split("%");

        $("#listing").append('<ul></ul>');

        var works = [];
        for (var k = 0; k + numOfElements - 1 < arr.length; k += numOfElements) {
            works.push({misam: arr[k], fn: arr[k+1], name: arr[k+2],
                        id_artist: arr[k+3], title: arr[k+4],
                        duration: arr[k+5], id: arr[k+6], ctry: arr[k+7],
                        isni: arr[k+8], editions: arr[k+9], award: arr[k+10],
                        festival: arr[k+11], composed: arr[k+12],
                        publisher: arr[k+13],
                        annees: arr[k+14], prov: arr[k+15],
                        concours: arr[k+16],
                        ne: arr[k+17], mo: arr[k+18],
                        coauth: arr[k+19]});
        }
        var total = works.length;

        var showCtry = (country === '' || country === undefined || country === null);

        var showSMA = doSMA;

        if(cat == 1 || cat == 2){

            showSMA = (total >= SMA_MIN_WORKS);
            if(showSMA){
                setCanvasHeight(total < SMA_SEUIL_HAUTEUR ? SMA_H_PETIT : SMA_H_FULL);
                $("#sma_note").hide();
                $("#myCanvas").show();
                $("#infos").show();
                majPause(true);
            } else {
                $("#myCanvas").hide();
                $("#infos").hide();
                majPause(false);
                $("#sma_note").text('Too few works (' + total + ') to build the visualization. Showing the table only.').show();
            }
        }

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

        var tbodyA = table.tBodies[0] || table;
        var tbodyB = table2 ? (table2.tBodies[0] || table2) : null;

        var splitIndex = works.length;
        if(table2 && works.length > 1){
            var half = works.length / 2;
            var best = -1, bestDist = Infinity;
            for (var s = 1; s < works.length; s++) {
                if(works[s].id_artist !== works[s-1].id_artist){
                    var d = Math.abs(s - half);
                    if(d < bestDist){ bestDist = d; best = s; }
                }
            }
            if(best !== -1) splitIndex = best;
        }

        var i = 0;
        var prevArtist = null;
        var groupIndex = -1;
        var memberIndex = 0;

        function renderChunk(){

            if(myLoad !== _catLoadSeq) return;

            var htmlA = "", htmlB = "";
            var stop = Math.min(i + CHUNK, works.length);

            for (; i < stop; i++) {

                var w = works[i];

                if(showSMA){

                    records.push({imeb_id: w.misam, fn: w.fn, name: w.name,
                                  id: w.id,
                                  title: w.title, duration: w.duration,
                                  minutes: minutesGN(w.duration),
                                  ctry: w.ctry, isni: w.isni,
                                  ne: w.ne, mo: w.mo,
                                  editions: w.editions,
                                  composed: w.composed,
                                  annees: w.annees, prov: w.prov});
                }

                var newGroup = (w.id_artist !== prevArtist);
                if(newGroup){ groupIndex++; memberIndex = 0; prevArtist = w.id_artist; }
                else { memberIndex++; }

                var grpParity = (groupIndex % 2 === 0) ? 'grp-cell-a' : 'grp-cell-b';
                var memParity = ((groupIndex + memberIndex) % 2 === 0) ? 'mem-a' : 'mem-b';

                var row = newGroup ? '<tr class="group-start">' : '<tr>';

                if(newGroup){

                    var fullName = w.fn + ' ' + w.name;
                    var composer = w.isni
                        ? '<span class="composer-isni" role="button" tabindex="0" data-isni="'
                          + esc(w.isni) + '" data-label="' + esc(fullName) + '">'
                          + fullName + '</span>'
                        : fullName;
                    if(showCtry && w.ctry){
                        composer += '<span class="composer-ctry">' + w.ctry + '</span>';
                    }
                    var infoMisam = (w.misam && String(w.misam) !== '0')
                                  ? ' title="MISAM ' + esc(String(w.misam)) + '"' : '';

                    row += '<td class="composer grp-cell ' + grpParity + '" rowspan="' + runLength[i] + '"'
                          + infoMisam + '>' + composer + '</td>';
                }

                var titleCell = w.title;
                if(w.award){
                    titleCell += ' <span class="work-award" title="awarded at the '
                              + w.award + ' competition">&#9733;</span>';
                }
                titleCell += coauthHtml(w.coauth);

                var compCell = (_catId === 1 || _catId === 2)
                             ? (w.concours ? w.concours.replace(/\s*,\s*/g, ', ') : '')
                             : (w.editions ? w.editions.replace(/\s*,\s*/g, ', ') : '');

                row += '<td class="' + memParity + '">' + titleCell + '</td>';

                if(_catId === 1 || _catId === 2){
                    row += '<td class="' + memParity + ' work-comp">'
                         + (w.composed || '') + '</td>';
                }

                row += '<td class="' + memParity + ' work-dur">' + w.duration + '</td>'
                      + '<td class="' + memParity + ' work-ed">' + compCell + '</td>';

                if(_catId === 1 || _catId === 2){
                    var festCell = w.festival ? w.festival.replace(/\s*,\s*/g, ', ') : '';
                    row += '<td class="' + memParity + ' work-fest">' + festCell + '</td>';
                }

                if(_catId === 2){
                    row += '<td class="' + memParity + ' work-pub">'
                         + (w.publisher || '') + '</td>';
                }

                row += '</tr>';

                if(i < splitIndex) htmlA += row; else htmlB += row;
            }

            if(htmlA) tbodyA.insertAdjacentHTML('beforeend', htmlA);
            if(htmlB && tbodyB) tbodyB.insertAdjacentHTML('beforeend', htmlB);

            $("#loading").text(Math.min(i, total) + " / " + total);

            if(i < works.length){
                setTimeout(renderChunk, 0);
            } else {
                $("#loading").remove();

                if(table2 && splitIndex >= works.length){ table2.classList.add('is-empty'); }

                $("#info").append("<p>" + total + " works</p>");
            }
        }

        renderChunk();

    }).fail(function(){
        $("#loading").text("loading failed");
    });

}

$(function(){
    if(typeof enableIsniPanel !== 'function') return;
    enableIsniPanel({
        anchors:   ['works_table', 'works_table_2', 'legend'],
        clickable: '#main_table .composer-isni',
        watch:     'infos'
    });

    if(typeof enableIsniInflowFiche === 'function'){
        enableIsniInflowFiche({ into: 'isniColumn' });
    }
});

function resetSMAForPortion(){
    resetAll();
    records = [];
    $("#calculations ul").empty();
    $("#cookies").empty();
    $("#titles").empty();
    $("#selection").empty();
    $("#sma_note").hide();
}

function clearRowsBelowHeader(t){

    while(t.rows.length > 1) t.deleteRow(1);
}
function clearCatalogTable(){
    var t1 = document.getElementById('works_table');
    var t2 = document.getElementById('works_table_2');
    if(t1){ clearRowsBelowHeader(t1); t1.classList.remove('is-empty'); }
    if(t2){ clearRowsBelowHeader(t2); t2.classList.remove('is-empty'); }
    $("#listing").empty();
    $("#loading").remove();
    $("#info p").not(':first').remove();
}

function buildCountryMenu(){
    $.ajax({ url: 'php/retrieve_countries.php', type: "POST", data: { cat: _catId } })
     .done(function(str){
        var ul = $("#countries ul");
        ul.empty();

        var allLi = $('<li class="all-works">All works (full table)</li>')
                      .css("text-decoration", "underline")
                      .css("font-weight", "bold");
        allLi.on("click", showFullTable);
        ul.append(allLi);

        if(!str) return;

        var arr = str.split("%");
        for(var k = 0; k + 3 < arr.length; k += 4){
            var cid = arr[k], cname = arr[k+1], cnt = arr[k+2], ciso = arr[k+3];
            var li = $('<li></li>')
                       .attr("data-cid", cid)
                       .attr("data-iso", (ciso || '').toUpperCase())
                       .text(cname + " (" + cnt + ")")
                       .css("text-decoration", "underline");
            (function(id, nm, el){
                el.on("click", function(){ selectCountry(id, nm, el); });
            })(cid, cname, li);
            ul.append(li);
        }

        appliquerPaysDeLUrl();
     })
     .fail(function(){
        $("#countries ul").empty().append('<li>countries: loading failed</li>');
     });
}

function selectCountry(cid, name, liEl){
    resetSMAForPortion();
    clearCatalogTable();
    $("#countries ul li").css("font-weight", "normal");
    if(liEl) liEl.css("font-weight", "bold");
    $("#cookies").empty().append('<p>country: ' + name + '</p>');
    retrieveData(_catId, 20, cid);
    ecrirePaysDansLUrl(liEl ? liEl.attr('data-iso') : isoDuCid(cid));
}

function isoDuCid(cid){
    var el = $("#countries ul li[data-cid='" + String(cid).replace(/'/g, "") + "']");
    return el.length ? el.attr('data-iso') : '';
}
function paysDemande(){
    var m = /[?&]ctry=([^&#]*)/.exec(window.location.search || '');
    if(!m) return null;
    var brut;
    try{ brut = decodeURIComponent(m[1]); }catch(e){ return null; }
    if(!/^[A-Za-z]{3}$/.test(brut)) return null;
    var iso = brut.toUpperCase(), trouve = null;
    $("#countries ul li[data-iso]").each(function(){
        if(!trouve && $(this).attr('data-iso') === iso) trouve = $(this);
    });
    return trouve;
}
function ecrirePaysDansLUrl(iso){
    if(!window.history || !window.history.replaceState) return;
    var q = [];
    var mid = /[?&]id=(\d+)/.exec(window.location.search || '');
    if(mid) q.push('id=' + mid[1]);
    if(iso) q.push('ctry=' + encodeURIComponent(String(iso).toUpperCase()));
    var url = window.location.pathname + (q.length ? '?' + q.join('&') : '');
    if(url === window.location.pathname + window.location.search) return;
    try{ window.history.replaceState({ctry: iso || null}, '', url); }catch(e){}
}
function appliquerPaysDeLUrl(){
    var li = paysDemande();
    if(!li) return;
    selectCountry(li.attr('data-cid'), li.text().replace(/\s*\(\d+\)\s*$/, ''), li);
}
window.onpopstate = function(){
    if($("#countries ul li[data-iso]").length){
        var li = paysDemande();
        if(li) appliquerPaysDeLUrl(); else showFullTable();
    }
};

function showFullTable(){
    resetSMAForPortion();
    clearCatalogTable();
    $("#countries ul li").css("font-weight", "normal");
    $("#countries ul li.all-works").css("font-weight", "bold");
    retrieveData(_catId, 20, '');
    ecrirePaysDansLUrl(null);
}
