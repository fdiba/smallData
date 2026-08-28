var init=false;
var allData;
var numComposersInCapsules;

var cookies=[];

var canvas, context;
var rectangles=[];
var titles=[];

var xRightOffset;

var nAId;


var xPos, yPos;
var xDist, yDist;

var minHeight;

var rWidth, rHeight;

var xLeftOffset;
var pAId;

var h_colors=["#ecf0f1"];
var colors=[{h:203, s:4, l:77}];

var OV_SURFACE = (typeof VIZ_SURFACE !== 'undefined') ? VIZ_SURFACE : '#2c3e50';
var OV_HILITE  = (typeof VIZ_HILITE  !== 'undefined') ? VIZ_HILITE  : '#f1c40f';
var OV_YEAR_MIN = 1973, OV_YEAR_MAX = 2009;

function ovYearColor(year){
    var ramp = (typeof VIZ_YEAR !== 'undefined') ? VIZ_YEAR
             : ["#227fbe","#5f8cd9","#959adf","#baace2","#d9bfe7","#efd7f2"];
    var y = parseInt(year, 10);
    if(!y) return ramp[0];
    var t = (y - OV_YEAR_MIN) / (OV_YEAR_MAX - OV_YEAR_MIN);
    if(t<0) t=0; else if(t>1) t=1;
    var n = ramp.length-1, p = t*n, i = Math.floor(p);
    if(i>=n) return ramp[n];
    return (typeof lerpHexColor === 'function') ? lerpHexColor(ramp[i], ramp[i+1], p-i) : ramp[i];
}

function ovRectColor(r, etat, fade){
    var c;
    if(etat === 'hit')      c = OV_HILITE;
    else if(etat === 'sel') c = OV_HILITE;
    else if(r.anchor){
        var AVEC = (typeof VIZ_OV_WORKS   !== 'undefined') ? VIZ_OV_WORKS   : '#2ecc71';
        var SANS = (typeof VIZ_OV_NOWORKS !== 'undefined') ? VIZ_OV_NOWORKS : '#7f8c8d';

        c = ovAnchorMeans ? (r.count>0 ? AVEC : SANS) : SANS;
    }
    else                    c = ovYearColor(r.year);

    if(fade>0 && typeof lerpHexColor === 'function') c = lerpHexColor(c, OV_SURFACE, fade);
    return c;
}

var ovSort = 'first';

var ovAnchorMeans = false;
var ovCtrl = [];
var OV_HDR = 22;

function ovRecordOrder(){
    var idx=[];
    for (var i=0; i<allData.length-5; i+=6) idx.push(i);
    if(ovSort === 'az') return idx;

    var cle = {};
    for (var k=0; k<idx.length; k++){
        var i = idx[k], eds = (allData[i+4]||'').split(",");
        var premiere = 9999;
        for (var j=0; j<eds.length; j++){
            var y = parseInt(eds[j], 10);
            if(y && y < premiere) premiere = y;
        }
        cle[i] = { premiere: premiere, count: parseInt(allData[i+3], 10) || 0, rang: k };
    }
    idx.sort(function(a, b){
        if(ovSort === 'works'){
            if(cle[b].count !== cle[a].count) return cle[b].count - cle[a].count;
        } else {
            if(cle[a].premiere !== cle[b].premiere) return cle[a].premiere - cle[b].premiere;
        }

        return cle[a].rang - cle[b].rang;
    });
    return idx;
}


var maxWidth;

var count002=0;

var composers=[];
var newResults=false;

var NUM_RECORDS_MIN = SHOW_ALL_NAMES ? 0 : 1;

function clampNumOfRecords(n){
    var v = parseInt(n, 10);
    if(!isFinite(v)) v = NUM_RECORDS_MIN;
    return Math.max(NUM_RECORDS_MIN, v);
}

function readNumOfRecords(){
    var v = clampNumOfRecords($('#numOfRecords').val());
    if(String($('#numOfRecords').val()) !== String(v)) $('#numOfRecords').val(v);
    return v;
}

function resultIsListed(count){
    if(SHOW_ALL_NAMES) return true;
    var c = parseInt(count, 10);
    if(!isFinite(c)) c = 0;
    return c !== 0;
}

window.onload = function() {


    canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');

    OverviewSMA.init(document.getElementById('sma'));


    document.getElementById('searchBoxBtn').addEventListener("click", getSearchTerms);

    document.getElementById('searchTerms').addEventListener("keydown", function(e){
        if(e.key === "Enter" || e.keyCode === 13){ e.preventDefault(); getSearchTerms(); }
    });

    document.getElementById('filtersBtn').addEventListener("click", filterData);

    document.getElementById('numOfRecords').addEventListener("keydown", function(e){
        if(e.key === "Enter" || e.keyCode === 13){ e.preventDefault(); filterData(); }
    });

    document.getElementById('numOfRecords').addEventListener("blur", function(){
        readNumOfRecords();
    });

    pAId=-1;
    xLeftOffset = 0;
    xDist = 11, yDist = 11;
    rWidth = 10, rHeight = 10;

    resetPositions();

    maxWidth = gridWidthAvailable();
    canvas.width = maxWidth;
    minHeight = 300;
    canvas.height = minHeight;

    context.fillStyle=h_colors[0];
    context.fillRect(0, 0, canvas.width, canvas.height);

    xRightOffset = 10;

    $("#titles").css({"clear": "both"});

    updateCoverageNote(readNumOfRecords());

    if(SHOW_ALL_NAMES) $('#lg-archived-only').hide();

    if(typeof enableIsniPanel === 'function'){
        enableIsniPanel({ into: 'isniColumn' });
    }

    bindGridReflow();

    getData();

}

var GRID_MAX_WIDTH = 1500;

function gridWidthAvailable(){

    var board = document.getElementById('board');
    var dispo = board ? board.clientWidth : 0;
    if(!dispo) dispo = document.documentElement.clientWidth || $(window).width();

    var col = document.getElementById('right_col');
    var w   = col ? col.offsetWidth : 0;
    if(!w) w = 350;

    dispo -= w + 10;

    return Math.max(120, Math.min(GRID_MAX_WIDTH, Math.round(dispo)));
}

var gridReflowTimer = null;
var gridReflowBound = false;

function bindGridReflow(){
    if(gridReflowBound) return;
    gridReflowBound = true;
    $(window).on('resize.overviewgrid', function(){
        if(gridReflowTimer) clearTimeout(gridReflowTimer);
        gridReflowTimer = setTimeout(reflowGrid, 150);
    });
}

function reflowGrid(){

    gridReflowTimer = null;

    if(!allData || !rectangles.length) return;

    var w = gridWidthAvailable();
    if(w === maxWidth) return;

    maxWidth = w;

    var n = readNumOfRecords();
    if(n >= 1) processData002(n);
    else       processData();

    if(pAId >= 0) processAllRectWhithId(pAId);
}

function drawRect(x, y, c){
    context.fillStyle=c;
    context.fillRect(x, y, rWidth, rHeight);
}

function paintRect(r, etat, fade){

    drawRect(r.x, r.y, ovRectColor(r, etat, fade || 0));
}

function selectionHtml(arr){

    var who = $.trim((arr[0] || '') + ' ' + (arr[1] || ''));
    var eds = arr[3] || '';

    var ctry   = esc(arr[2] || '');
    var origin = esc($.trim(arr[5] || ''));
    var where  = (origin && ctry) ? (origin + ' / ' + ctry) : (origin || ctry);

    var cls = {};
    var brutProv = $.trim(arr[6] || '');
    if(brutProv){
        var lp = brutProv.split(',');
        for(var kp = 0; kp < lp.length; kp++){
            var pp = lp[kp].split('=');
            if(pp.length === 2) cls[$.trim(pp[0])] = $.trim(pp[1]);
        }
    }

    var ans = [];
    var brut = ('' + eds).split(',');
    for(var i = 0; i < brut.length; i++){
        var a = $.trim(brut[i]);
        if(a) ans.push(a);
    }

    var nComp = 0, nFest = 0;
    for(var ic = 0; ic < ans.length; ic++){
        var code = cls[ans[ic]] || '1l';
        var etat = code.charAt(0);
        if(etat !== '3' && etat !== '5') nComp++;
        if(etat === '2' || etat === '3' || etat === '5') nFest++;
    }

    var parts = [];
    if(nFest > 0) parts.push(nFest + ' festival' + (nFest === 1 ? '' : 's'));
    if(nComp > 0) parts.push(nComp + ' competition' + (nComp === 1 ? '' : 's'));

    var ne = $.trim(arr[7] || ''), mo = $.trim(arr[8] || '');
    var vie = (ne && mo) ? (ne + '-' + mo)
            : (ne ? ('b. ' + ne) : (mo ? ('d. ' + mo) : ''));

    var head = $.trim(esc(who) + ' ' + where);
    if(vie) head += ' \u00b7 ' + esc(vie);
    if(parts.length) head += ' \u00b7 ' + parts.join(' \u00b7 ');

    return '<p class="s-hd"><button type="button" class="s-toggle" aria-expanded="false">'
         + head + '<span class="s-caret" aria-hidden="true"></span></button></p>'
         + '<p class="s-bd">' + editionsHtml(eds, arr[6]) + '</p>';
}

var selectionFoldBound = false;

function bindSelectionFold(){
    if(selectionFoldBound) return;
    selectionFoldBound = true;
    $(document).on('click', '#selection .s-toggle', function(){
        var box    = $('#selection');
        var folded = box.hasClass('is-folded');
        box.toggleClass('is-folded', !folded);
        $(this).attr('aria-expanded', folded ? 'true' : 'false');
    });
}

function renderSelection(arr){

    bindSelectionFold();

    var who  = $.trim((arr[0] || '') + ' ' + (arr[1] || ''));
    var isni = $.trim(arr[4] || '');

    $('#selection').addClass('is-folded').html(selectionHtml(arr));

    syncIsniBoxGN(isni);
}

function clearSelection(txt){
    $('#selection').removeClass('is-folded').empty().append('<p>' + esc(txt) + '</p>');
    syncIsniBoxGN('');
}

function editionsHtml(eds, provenance){

    var cls = {};
    var brut = $.trim(provenance || '');
    if(brut){
        var l = brut.split(',');
        for(var k=0; k<l.length; k++){
            var p = l[k].split('=');
            if(p.length===2) cls[$.trim(p[0])] = $.trim(p[1]);
        }
    }

    var MARQUE = {'1':'', '2':'+', '3':'°', '4':'*', '5':''};
    var CLASSE = {'1':'ed-comp', '2':'ed-both', '3':'ed-fest', '4':'ed-loose', '5':'ed-post'};

    var AVANT = {'5':'†'};

    var PIECE = {
        'c': "bailiff's record",
        'a': 'prize awarded',
        'l': 'IMEB list of entrants',
        'o': 'festival programme',
        't': 'transcription only'
    };
    var ETAT = {
        '1': 'competition',
        '2': 'competition + festival',
        '3': 'festival only',
        '4': 'competition, no document',
        '5': 'festival only · posthumous'
    };

    var out = [];
    var ans = ('' + (eds || '')).split(',');
    for(var i=0; i<ans.length; i++){
        var a = $.trim(ans[i]);
        if(!a) continue;

        var code = cls[a] || '1l';
        var c = code.charAt(0), p = code.charAt(1) || 'l';
        if(!MARQUE.hasOwnProperty(c)) c = '1';

        var redite = (c === '3' && p === 'o') || (c === '4' && p === 't')
                  || (c === '5' && p === 'o');
        var titre = ETAT[c] + ((PIECE[p] && !redite) ? ' · ' + PIECE[p] : '');

        out.push('<span class="' + CLASSE[c] + '" title="' + esc(titre) + '">'
                 + (AVANT[c] || '') + esc(a) + MARQUE[c] + '</span>');
    }
    return out.join(', ');
}
function repaintAllRects(){
    for(var i=0; i<rectangles.length; i++) paintRect(rectangles[i], 'normal', 0);

    if(pAId >= 0) processAllRectWhithId(pAId);
}

function calculateMinHeightAndCreateRectangles(step, threshold){

    resetPositions();

    minHeight = OV_HDR;

    var ordre = ovRecordOrder();

    var nAvec = 0, nSans = 0;

    for (var o=0; o<ordre.length; o++) {

        var i = ordre[o];

        var id = allData[i];
        var editions = allData[i+4].split(",");
        var ctry=allData[i+1];

        var count=allData[i+3];

        if(step===0 || (step===1 && count>=threshold)){
            if(count>0) nAvec++; else nSans++;
            createNewRectangle(id, count, true, 0);
            createEditionsRectangles(id, count, editions);
        }
    }

    ovAnchorMeans = (nAvec>0 && nSans>0);
}
function createEditionsRectangles(id, count, editions){

    if(editions.length>0){
        for(var j=0; j<editions.length; j++){

            createNewRectangle(id, count, false, parseInt(editions[j], 10));
        }
    } else {
    }
}
function createNewRectangle(aId, count, anchor, year){

    if( xPos>maxWidth-xRightOffset){

        xPos = xLeftOffset;
        yPos += yDist;
    }

    if(yPos+yDist>minHeight) minHeight+=yDist;

    rectangles.push({id:aId, x: xPos, y:yPos, count:count, anchor:anchor, year:year});
    xPos += xDist;

}

function processAllRectWhithId(artist_id){
    for(var i=0; i<rectangles.length; i++){
        if(rectangles[i].id==artist_id) paintRect(rectangles[i], 'sel', 0);
    }
}
function resetAllRectWhithId(artist_id){
    for(var i=0; i<rectangles.length; i++){
        if(rectangles[i].id==artist_id) paintRect(rectangles[i], 'normal', 0);
    }
}
function selectRect(x, y){

    for(var i=0; i<rectangles.length; i++){

        if(x>=rectangles[i].x && x<=rectangles[i].x+rWidth &&
           y>=rectangles[i].y && y<=rectangles[i].y+rHeight) {

            if(pAId>=0) resetAllRectWhithId(pAId);

            selectComposerById(rectangles[i].id, rectangles[i].count, true);

            break;
        }
    }
}

function selectComposerById(artistId, count, clearResults){

    if(artistId != pAId){

        if(clearResults) $("#results").empty();

        nAId = artistId;
        count002 = count;

        $.ajax({
            url: 'php/retrieve_data.php',
            type: "POST",
            data: {aId: nAId, case:5}
        }).done(function(str) {

            var arr  = str.split("%");
            var ctry = arr[2];

            renderSelection(arr);

            var is_new=true;

            if(cookies.length>0){

                for (var i=0; i<cookies.length; i++) {
                    if(cookies[i].id===nAId){

                        is_new=false;
                        break;
                    }
                }
            }

            if(is_new){

                cookies.push({id:nAId, count:count002});

                var str="";

                for (var i = 0; i < cookies.length; i++) {
                    if(i>0)str+='%';
                    str+=cookies[i].id+'%'+cookies[i].count;
                }

                $.cookie('ids', str);

                OverviewSMA.addComposer({country: ctry, fn: arr[0], ln: arr[1], id: nAId, count: count002});

            }
        });

        $.ajax({
            url: 'php/retrieve_data.php',
            type: "POST",
            data: { aId: nAId, case:1 }
        }).done(function(str) {

            var arr=str.split("%");
            titles=[];

            for (var i=0; i<arr.length-6; i+=7) {
                titles.push({id:arr[i], t:arr[i+1], d:arr[i+2], m:arr[i+3],
                             y:arr[i+4], ed:arr[i+5], pv:arr[i+6]});
            }

            displayTitlesInfosGN(titles);

        });
    }

    processAllRectWhithId(artistId);

    pAId = nAId;
}

function drawGridHeader(){

    var ctx = context, y = 11;
    ovCtrl = { sort: [] };

    ctx.save();
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    var x = xLeftOffset;
    ctx.font = '10px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillStyle = "#8fa3b0";
    ctx.fillText("squares:", x, y);
    x += 48;

    var opts = [{k:'first', l:'first entry'}, {k:'works', l:'archived works'}, {k:'az', l:'A–Z'}];
    for (var i=0; i<opts.length; i++){
        var on = (ovSort === opts[i].k);
        ctx.font = on ? '600 11px "Helvetica Neue", Helvetica, Arial, sans-serif'
                      : '10px "Helvetica Neue", Helvetica, Arial, sans-serif';
        ctx.fillStyle = on ? "#ecf0f1" : "#8fa3b0";
        var w = ctx.measureText(opts[i].l).width;
        ctx.fillText(opts[i].l, x, y);
        if(on) ctx.fillRect(x, y+8, w, 1);
        ovCtrl.sort.push({k:opts[i].k, x:x-4, y:y-9, w:w+8, h:18});
        x += w + 14;
    }

    var kw = 132, sw = 10;
    var x0 = canvas.width - kw - 6;
    if(x0 > x + 40){
        ctx.textAlign = "right";
        ctx.font = '10px "Helvetica Neue", Helvetica, Arial, sans-serif';
        ctx.fillStyle = "#8fa3b0";
        ctx.fillText("1973", x0 - 6, y);
        for (var s2=0; s2<kw-34; s2+=2){
            ctx.fillStyle = ovYearColor(OV_YEAR_MIN + (s2/(kw-36))*(OV_YEAR_MAX-OV_YEAR_MIN));
            ctx.fillRect(x0 + s2, y - sw/2, 2, sw);
        }
        ctx.textAlign = "left";
        ctx.fillStyle = "#8fa3b0";
        ctx.fillText("2009", x0 + kw - 30, y);
    }
    ctx.restore();
}
function hitGridHeader(mx, my){
    if(my > OV_HDR || !ovCtrl.sort) return false;
    for (var i=0; i<ovCtrl.sort.length; i++){
        var r = ovCtrl.sort[i];
        if(mx>=r.x && mx<=r.x+r.w && my>=r.y && my<=r.y+r.h){
            if(ovSort !== r.k){
                ovSort = r.k;

                processData002(readNumOfRecords());
            }
            return true;
        }
    }
    return false;
}
function resetCanvasSize(){

    canvas.height = minHeight + yDist;

    var contentRight = 0;
    for(var i=0; i<rectangles.length; i++){
        var right = rectangles[i].x + rWidth;
        if(right>contentRight) contentRight = right;
    }

    canvas.width = Math.max(contentRight>0 ? contentRight : maxWidth, 420);

    var lg = document.getElementById('legend');
    if(lg){
        lg.style.maxWidth = canvas.width + 'px';
        lg.style.width = canvas.width + 'px';
    }
}
function resetPositions(){
    xPos = xLeftOffset;
    yPos = OV_HDR;
}
function getInfo(evt) {

    var cv = canvas.getBoundingClientRect();

    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    if(newResults){
        $("#results").empty();
        repaintAllRects();
        newResults=false;
    }

    if(hitGridHeader(mouseX, mouseY)) return;

    selectRect(mouseX, mouseY);

}
function getData(){

    init = true;


    $.ajax({
        url: 'php/retrieve_data.php',
        type: "POST",
        data: {case:10}
    }).done(function(str) {

        allData = str.split("%");
        numComposersInCapsules=0;

        for (var i=0; i<allData.length-5; i+=6) {

            var numTitles = allData[i+3];
            if(numTitles>0)numComposersInCapsules++;
        }

        clearSelection("no selection · click a square to display a composer");

        var num = allData.length / 6;
        var txt2 = numComposersInCapsules+ " / " + num + " composers with archived works";
        $("#info p:eq(0)").text(txt2);

        var n = readNumOfRecords();
        if(n >= 1) processData002(n);
        else processData();
        updateCoverageNote(n);

    });
}
function processData002(numberMinOfParticipation){

    canvas.removeEventListener("mousedown", getInfo, false);
    rectangles=[];

    calculateMinHeightAndCreateRectangles(1, numberMinOfParticipation);
    resetCanvasSize();
    drawRectanglesAndAddInteractivity();
}
function processData(){
    calculateMinHeightAndCreateRectangles(0, 0);
    resetCanvasSize();
    drawRectanglesAndAddInteractivity();
}
function drawRectanglesAndAddInteractivity(){
    context.fillStyle=COLORS[1];
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.stroke();

    resetPositions();

    drawGridHeader();

    for(var i=0; i<rectangles.length; i++) paintRect(rectangles[i], 'normal', 0);

    resetPositions();

    canvas.addEventListener("mousedown", getInfo, false);
}


function filterData(){

    var year_01 = parseInt($('#year_01').val());
    var year_02 = parseInt($('#year_02').val());

    var numOfRecords = readNumOfRecords();

    if(!Number.isInteger(year_01) && !Number.isInteger(year_02)){
        processData002(numOfRecords);
        updateCoverageNote(numOfRecords);
    }

}

function updateCoverageNote(n){
    if(Number.isInteger(n) && n <= 0) $('#lg-incomplete').show();
    else $('#lg-incomplete').hide();
}

function getSearchTerms(){

    var terms = $('#searchTerms').val();

    pAId = -1;
    newResults = false;
    clearSelection('no selection');
    $("#titles").empty();
    repaintAllRects();

    if(terms==""){
        $("#results").empty();
        return;
    }

    $.ajax({
        url: 'php/retrieve_data.php',
        type: "POST",
        data: { terms: terms, case:28 }
    }).done(function(str) {

        $("#results").empty();

        if(str.indexOf("%")<0){

            $("#results").append('<p>');
            $("#results p").text("no result");

        } else{

            composers = str.split("%");

            var numOfElements = 4;

            if(composers.length<numOfElements+1){

                createComposersListing(numOfElements);

                var c0 = indexCountFor(composers[0]);
                if(c0>=0 && resultIsListed(c0)) showAndHighlightComposer(composers[0]);

            } else {

                createComposersListing(numOfElements);

                for (var j=0; j<rectangles.length; j++) paintRect(rectangles[j], 'normal', 0);

            }

        }
    });
}

function indexCountFor(id){

    for (var j=0; j<allData.length-5; j+=6) {
        if(id===allData[j]) return allData[j+3];
    }

    return -1;
}
function createComposersListing(num){

    var arr=[];
    var nonListes=0;

    for (var i = 0; i < composers.length; i+=num) {

        var id = composers[i];
        var count = indexCountFor(id);

        if(!resultIsListed(count)){ nonListes++; continue; }

        var festOnly = (composers[i+3] === '1' || composers[i+3] === 1);

        var str;
        if(count<0 && festOnly){
            str = '<p class="fest-only" data-id="' + id + '">' +
                composers[i+1] + ' ' + composers[i+2] +
                ' played at the festival, never entered the competition.</p>';
        } else if(count<0){
            str = '<p class="no-index" data-id="' + id + '">' +
                composers[i+1] + ' ' + composers[i+2] + ' is not in this index.</p>';
        } else {
            str = '<p data-id="' + id + '">' +
                composers[i+1] + ' ' + composers[i+2] + ' ' + count + '</p>';
        }

        if(arr.length<1){
            arr.push([count, str]);

        } else {

            for (var k=0; k<arr.length; k++) {

                if(parseInt(count)>=parseInt(arr[k][0])){
                    arr.splice(k, 0, [count, str]);

                    break;
                } else if(k===arr.length-1){
                    arr.push([count, str]);
                    break;
                }

            }

        }

    }

    for (var l=0; l<arr.length; l++) {
        $("#results").append(arr[l][1]);
    }

    if(arr.length<1 && nonListes>0){
        $("#results").append('<p class="no-index">' + nonListes +
            ' entrant' + (nonListes>1 ? 's' : '') +
            ' with no archived work, names not listed.</p>');
    }

    $("#results p").not(".no-index").not(".fest-only").click(function() {
        showAndHighlightComposer($(this).attr('data-id'));
    });

    $("#results p.fest-only").click(function() {
        showFestivalComposer($(this).attr('data-id'));
    });

}

function showFestivalComposer(composerId){

    pAId = -1;
    repaintAllRects();

    $.ajax({
        url: 'php/retrieve_data.php',
        type: "POST",
        data: { aId: composerId, case:5 }
    }).done(function(str) {

        renderSelection(str.split("%"));

    });

    $.ajax({
        url: 'php/retrieve_data.php',
        type: "POST",
        data: { aId: composerId, case:1 }
    }).done(function(str) {

        var arr=str.split("%");
        titles=[];

        for (var i=0; i<arr.length-6; i+=7) {
            titles.push({id:arr[i], t:arr[i+1], d:arr[i+2], m:arr[i+3],
                         y:arr[i+4], ed:arr[i+5], pv:arr[i+6]});
        }

        displayTitlesInfosGN(titles);

    });

}

function showAndHighlightComposer(composerId){

    var present = false, count = -1;
    for(var j=0; j<rectangles.length; j++){
        if(rectangles[j].id===composerId){ present = true; count = rectangles[j].count; break; }
    }

    if(!present){
        var plancher = NUM_RECORDS_MIN;
        $('#numOfRecords').val(plancher);
        processData002(plancher);
        updateCoverageNote(plancher);

        for(var k=0; k<rectangles.length; k++){
            if(rectangles[k].id===composerId){ count = rectangles[k].count; break; }
        }
    }

    editRectanglesColorBasedOnQueryWithComposerId(composerId);

    selectComposerById(composerId, count, false);
}

function editRectanglesColorBasedOnQueryWithComposerId(composerId){

    for (var j=0; j<rectangles.length; j++){
        if(rectangles[j].id===composerId) paintRect(rectangles[j], 'hit', 0);
        else                              paintRect(rectangles[j], 'normal', 0.72);
    }

    newResults=true;
}
