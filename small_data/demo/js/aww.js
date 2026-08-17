var SMA_MIN_WORKS = 20;
var allWorks = [];

var SMA_H_FULL = 800;
var SMA_H_YEAR = SMA_H_FULL / 2;

function setCanvasHeight(h){
    var cv = document.getElementById('myCanvas');
    if(!cv) return;
    var px = h * scale;
    if(cv.height === px) return;
    cv.height = px;
    context.fillStyle = COLORS[0];
    context.fillRect(0, 0, cv.width, cv.height);
    context.stroke();
}

window.onload = function() {

    initSMA(1064, SMA_H_FULL);
    startSMA();

    $("#info p:eq(0)").text('loading…');

    $.ajax({ url: 'php/retrieve_works.php', type: "POST" }).done(function(str) {
        allWorks = parseWorks(str);
        buildYearMenu();

        appliquerAnneeDeLUrl();
    });
};

function parseWorks(str){

    var arr = str.split("%");

    var numOfElements = 22;
    var objects = [];

    for (var i = 0; i < arr.length-(numOfElements-1); i+=numOfElements) {

        var label = $.trim(arr[i+12] || '');
        var rg    = $.trim(arr[i+13] || '');
        var lab2  = $.trim(arr[i+14] || '');

        var ord = $.trim(arr[i+16] || '');
        var num = rg || ord;

        var rank;
        if(label){
            rank = num ? (label + ' ' + num) : label;
            if(lab2) rank += ' et ' + lab2;
        } else {
            rank = arr[i+1];
        }

        var cat2 = arr[i+9];

        var catRang = CAT_HORS_AXE[parseInt(arr[i+1], 10)] || 0;

        if(arr[i+17] === 'puy') catRang = 2;

        objects.push({ year:arr[i], rank:rank, rank_code:arr[i+1], rank_num:num,
                       misam:arr[i+2], cat_rang:catRang,
                       fn:arr[i+3], name:arr[i+4], title:arr[i+5], cat2:cat2,
                       degre:arr[i+18], duration:arr[i+6], id:arr[i+7],
                       ctry:arr[i+10], isni:arr[i+11],
                       composed:arr[i+19], annees:arr[i+20], prov:arr[i+21],
                       coauth:parseCoauteurs(arr[i+15]) });
    }
    return objects;
}

function parseCoauteurs(champ){
    var out = [];
    var brut = $.trim(champ || '');
    if(!brut) return out;
    var parts = brut.split(';');
    for(var k = 0; k < parts.length; k++){
        if(!$.trim(parts[k])) continue;
        var t = parts[k].split('|');
        out.push({ nom: $.trim(t[0]), isni: $.trim(t[1] || '') });
    }
    return out;
}

function nomCliquable(txt, isni, label){
    if(!isni) return esc(txt);
    return '<span class="composer-isni" role="button" tabindex="0" data-isni="'
         + esc(isni) + '" data-label="' + esc(label || txt) + '">' + esc(txt)
         + '</span>';
}

$(function(){
    if(typeof enableIsniPanel !== 'function') return;
    enableIsniPanel({
        anchors:   ['works_table', 'legend'],
        clickable: '#main_table .composer-isni',
        watch:     'infos'
    });

    if(typeof enableIsniInflowFiche === 'function'){
        enableIsniInflowFiche({ into: 'isniColumn' });
    }
});

function buildYearMenu(){

    var seen = {};
    for(var i=0; i<allWorks.length; i++) seen[allWorks[i].year] = true;

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
    setCanvasHeight(SMA_H_FULL);
    renderSelection(allWorks);
    ecrireAnneeDansLUrl(null);
}

function selectYear(year){
    highlightYearMenu($("#years ul li").filter(function(){ return $(this).attr('data-year') === String(year); }));
    setCanvasHeight(SMA_H_YEAR);
    var subset = allWorks.filter(function(w){ return String(w.year) === String(year); });
    renderSelection(subset);
    ecrireAnneeDansLUrl(year);
}

function anneesDuFonds(){
    var out = {};
    for(var i=0; i<allWorks.length; i++) out[String(allWorks[i].year)] = true;
    return out;
}
function anneeDemandee(){
    var m = /[?&]y=([^&#]*)/.exec(window.location.search || '');
    if(!m) return null;
    var brut;
    try{ brut = decodeURIComponent(m[1]); }catch(e){ return null; }
    if(!/^\d{4}$/.test(brut)) return null;
    if(!anneesDuFonds()[brut]) return null;
    return brut;
}
function ecrireAnneeDansLUrl(year){
    if(!window.history || !window.history.replaceState) return;
    var base = window.location.pathname;
    var url  = year ? (base + '?y=' + encodeURIComponent(String(year))) : base;
    if(url === window.location.pathname + window.location.search) return;
    try{ window.history.replaceState({y: year || null}, '', url); }catch(e){}
}
function appliquerAnneeDeLUrl(){
    var y = anneeDemandee();
    if(y) selectYear(y);
    else  showAllWorks();
}

window.onpopstate = function(){ if(allWorks.length) appliquerAnneeDeLUrl(); };

function renderSelection(works){

    resetAll();
    records = [];

    var objects = works.slice();
    objects.sort(function(a, b){
        return cmpValues(b.year, a.year)
            || cmpValues(a.cat_rang || 0, b.cat_rang || 0)
            || cmpValues(a.cat2, b.cat2)
            || cmpValues(ordreDistinction(a.rank_code), ordreDistinction(b.rank_code))
            || cmpValues(numeroDeTri(a.rank_num), numeroDeTri(b.rank_num))

            || cmpValues(a.rank_code, b.rank_code)
            || cmpValues(a.name, b.name);
    });

    buildTableRows(objects);

    $("#info p:eq(0)").text(objects.length + " works");

    if(objects.length >= SMA_MIN_WORKS){
        for (var i=0; i<objects.length; i++) {
            var o = objects[i];

            records.push({ edition:o.year, degree:o.degre, category:o.cat2,
                           price:o.rank,
                           imeb_id:o.misam, fn:o.fn, name:o.name, title:o.title,
                           duration:o.duration, minutes:minutesGN(o.duration),
                           composed:o.composed, annees:o.annees, prov:o.prov,
                           ctry:o.ctry, isni:o.isni, id:o.id });
        }
        $("#myCanvas").show();
        $("#infos").show();
        $("#sma_note").hide().empty();
        majPause(true);
    } else {
        $("#myCanvas").hide();
        $("#infos").hide();
        majPause(false);
        $("#sma_note").text('Too few works (' + objects.length + ') for the visualization. Table only, it needs at least ' + SMA_MIN_WORKS + '.').show();
    }
}

var HORS_CATEGORIE = {200:1, 201:1, 296:1, 297:1, 298:1, 299:1,
                      300:1, 302:1, 303:1, 304:1};
var PRIX_SANS_RANG = 199;

var MENTIONS = {100:1, 101:1, 102:1, 103:1};

var CAT_HORS_AXE = {500: -1, 600: 1};

function ordreDistinction(code){
    var n = parseInt(code, 10);
    if(HORS_CATEGORIE[n])      return -1;
    if(n === PRIX_SANS_RANG)   return 99;
    if(MENTIONS[n])            return 100;

    if(n === 500)              return -2;
    if(n === 600)              return 101;
    return code;
}

function numeroDeTri(v){
    return (v === undefined || v === null || v === '') ? 99 : parseFloat(v);
}

function cmpValues(a, b){
    if(a===undefined || a===null || a==='') a='';
    if(b===undefined || b===null || b==='') b='';
    var na = parseFloat(a), nb = parseFloat(b);
    if(!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b), 'fr', {sensitivity: 'base'});
}

var COLONNES = [
    {cls: 'c-year',  lire: function(o){ return o.year; }},

    {cls: 'c-cat',   lire: function(o){ return o.cat2; }},
    {cls: 'c-price', lire: function(o){ return o.rank; }},

    {cls: 'c-composer', lire: function(o){
        return ((o.fn || '') + ' ' + (o.name || '')).trim(); }},

    {cls: 'c-coauth', lire: function(o){
        return o.coauth.map(function(c){ return c.nom; }).join(', '); }},
    {cls: 'c-ctry',  lire: function(o){ return o.ctry; }},
    {cls: 'c-title', lire: function(o){ return o.title; }},
    {cls: 'c-dur',   lire: function(o){ return o.duration; }}
];

function masquerColonnesVides(objects){

    var table = document.getElementById('works_table');
    if(!table) return;

    var ths = table.getElementsByTagName('th');
    if(ths.length !== COLONNES.length){
        console.log('aww : ' + ths.length + ' en-tetes pour ' +
                    COLONNES.length + ' colonnes decrites : les deux doivent '
                    + 'bouger ensemble (COLONNES ici, <th> dans le PHP)');
    }

    for(var c = 0; c < COLONNES.length; c++){

        var vide = objects.length > 0;

        for(var j = 0; j < objects.length; j++){
            var v = COLONNES[c].lire(objects[j]);
            if(v !== undefined && v !== null && String(v).trim() !== ''){
                vide = false;
                break;
            }
        }

        $('#works_table .' + COLONNES[c].cls).toggleClass('col-vide', vide);
    }
}

function buildTableRows(objects){

    $('#works_table tr:gt(0)').remove();

    function groupKey(o){ return o.year + '|' + o.cat2 + '|' + o.rank; }

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

            var span = 1;
            for(var k=j+1; k<objects.length && groupKey(objects[k])===groupKey(objects[j]); k++) span++;

            for(var g = 0; g < 3; g++){
                html += '<td class="grp-cell '+grpParity+' '+COLONNES[g].cls
                      + '" rowspan="'+span+'">'
                      + COLONNES[g].lire(objects[j]) + '</td>';
            }
        }

        var fullName = ((objects[j].fn || '') + ' ' + (objects[j].name || '')).trim();

        var coauth = objects[j].coauth.map(function(c){
            return nomCliquable(c.nom, c.isni);
        }).join(', ');

        var misam = objects[j].misam;
        var infoMisam = (misam && String(misam) !== '0')
                      ? ' title="MISAM ' + esc(String(misam)) + '"' : '';

        html += '<td class="'+memParity+' c-composer"'+ infoMisam +'>'
              + nomCliquable(fullName, objects[j].isni, fullName) + '</td>'
              + '<td class="'+memParity+' c-coauth">'+ coauth + '</td>'
              + '<td class="'+memParity+' c-ctry">'+ objects[j].ctry + '</td>'
              + '<td class="'+memParity+' c-title">'+ objects[j].title + '</td>'
              + '<td class="'+memParity+' c-dur dur">'+ esc(objects[j].duration) + '</td></tr>';
    }

    var table = document.getElementById('works_table');
    var tbody = table.tBodies[0] || table;
    tbody.insertAdjacentHTML('beforeend', html);

    masquerColonnesVides(objects);
}
