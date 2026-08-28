var init=false;
var allData;
var canvas, context;
var cv_nav, ctx_nav;

var years=[1, 1973, 1974, 1975, 1976, 1977, 1978, 1979,
1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989,
1990, 1991, 1992, 1993, 1994, 1996, 1997, 1998, 1999,
2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009];
var sl_years=[];
var inBtwYears=[];
var btnIdToEdit=-1;
var menu;
var colors=["#ecf0f1", "#2c3e50", "#e74c3c", "#f1c40f", "#bdc3c7", "#3498db", "#ffcccc"];

var bw=15, bh=15;
var btn01;

var myLineChart;

var chartView = 'matrix';
var matrixSort = 'total';
var barSort    = 'value';

var pendingSolo = [];

var dataGen = 0;

function captureIsolatedCountries(chart){
    var out=[];
    if(!chart || !chart.data || !chart.solo_btns) return out;
    for (var i=0; i<chart.data.length; i++){
        if(chart.solo_btns[i] && chart.solo_btns[i].state && chart.data[i]){

            out.push({
                cId : String(chart.data[i].cId),
                slot: (chart.soloSlot && chart.soloSlot[i] !== undefined) ? chart.soloSlot[i] : i
            });
        }
    }
    return out;
}

function applyIsolatedCountries(chart, sel){
    if(!chart || !chart.data || !chart.solo_btns || !sel || !sel.length) return false;
    var n=0;
    if(chart.soloSlot) chart.soloSlot = {};
    for (var i=0; i<chart.data.length; i++){
        var cid = String(chart.data[i].cId), trouve = null;
        for (var k=0; k<sel.length; k++){ if(sel[k].cId === cid){ trouve = sel[k]; break; } }
        if(chart.solo_btns[i]) chart.solo_btns[i].state = !!trouve;
        if(trouve){
            n++;
            if(chart.soloSlot) chart.soloSlot[i] = trouve.slot;
        }
    }
    chart.numSolos = n;
    return n>0;
}

var composers=[], titles=[];

var lastComposerIsni='';
var yearSelection=false;
var lastComposerSelected="";
var lastComposerCtry='';
var lastComposerOrigin='';
var lastComposerNe='';
var lastComposerMo='';

var numTitlesByArtist=[];
var maxChartWidth;

var c_on=COLORS[2];
var c_off=COLORS[0];
var c_sl=COLORS[3];

var numComposersInCapsules;
var infos;
var cp_infos;
var numCpByCountry=[];

var takeCountIntoAccount;

function compareComposers(a, b){
    var na = String(a && a.n  != null ? a.n  : ''),
        nb = String(b && b.n  != null ? b.n  : ''),
        fa = String(a && a.fn != null ? a.fn : ''),
        fb = String(b && b.fn != null ? b.fn : '');
    var c = na.localeCompare(nb);
    return c !== 0 ? c : fa.localeCompare(fb);
}

function lireDefaut(idBoite, attribut){
    var box = document.getElementById(idBoite);
    return box ? box.getAttribute(attribut) : null;
}

// L'adresse porte deux commutateurs : ?chart=1|2 et ?count=0|1.
// v=all, qui sert ailleurs, est conserve tel quel.
function ecrireVuesDansLUrl(){
    if(!window.history || !window.history.replaceState) return;
    var q = [];
    if(/(^|[?&])v=all([&#]|$)/.test(window.location.search || '')) q.push('v=all');
    q.push('chart=' + (chartView === 'line' ? '2' : '1'));
    q.push('count=' + (takeCountIntoAccount ? '1' : '0'));
    var url = window.location.pathname + '?' + q.join('&');
    if(url === window.location.pathname + window.location.search) return;
    try{ window.history.replaceState(null, '', url); }catch(e){}
}

window.onload = function() {

    takeCountIntoAccount = (lireDefaut('count', 'data-count-default') === 'works');

    var vueDefaut = lireDefaut('view', 'data-view-default');
    if(vueDefaut === 'matrix' || vueDefaut === 'line') chartView = vueDefaut;

    canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');

    maxChartWidth=1640;

    cv_nav = document.getElementById('cv_nav');
    ctx_nav = cv_nav.getContext('2d');
    cv_nav.width=maxChartWidth-440;
    cv_nav.height = 40;

    ctx_nav.fillStyle=COLORS[1];
    ctx_nav.fillRect(0, 0, cv_nav.width, cv_nav.height);

    menu = createMenu();

    var lr = menu[menu.length-1];
    btn01 = {x:lr.x+23, y:lr.y, state:true};

    drawMenu(menu);
    loadPvProvenance();

    document.getElementById('cv_nav').addEventListener("click", selectData);
    document.getElementById('myCanvas').addEventListener("click", editData);

    document.getElementById('myCanvas').addEventListener("mousemove", hoverData);
    document.getElementById('myCanvas').addEventListener("mouseleave", clearHoverData);
	document.getElementById('selection').addEventListener("click", toggleYearSl);

	window.addEventListener("resize", positionWorkPanel);

	if(typeof ResizeObserver === 'function'){
		var lgBox = document.getElementById('legend');
		if(lgBox) new ResizeObserver(positionWorkPanel).observe(lgBox);
	}else{
		var lgBtn = document.getElementById('lg_toggle');
		if(lgBtn) lgBtn.addEventListener('click', positionWorkPanel);
	}

    setCanvasWidthAndHeight();

    bindViewSwitch();
    bindCountSwitch();

    syncInfoBoxWidths();

    if(typeof enableIsniPanel === 'function'){
        enableIsniPanel({ into: 'isniColumn' });
    }

    getData();
};

function syncInfoBoxWidths(){
    var lg = document.getElementById('legend');
    if(!lg) return;
    var w = Math.round(lg.getBoundingClientRect().width);
    var ids = ['selection', 'composers'];
    for(var i=0; i<ids.length; i++){
        var e = document.getElementById(ids[i]);
        if(e){ e.style.boxSizing = 'border-box'; e.style.width = w + 'px'; e.style.maxWidth = w + 'px'; }
    }
}

function setCanvasWidthAndHeight(displaySeveralYears, width){
    if(displaySeveralYears){
        canvas.width=maxChartWidth;
        canvas.height = 600;
    }
    else{
        canvas.width= width || 900;
        canvas.height = 500;
    }

    context.fillStyle="#2c3e50";
    context.fillRect(0, 0, canvas.width, canvas.height);
}
function toggleYearSl(){
	if(composers.length>0){
		yearSelection=!yearSelection;
		editTitleInfo(infos.c, infos.y, infos.nc, infos.tnc, yearSelection);
		displayCpInfos();
	}
}
function editTitleInfo(sl_ctry, sl_year, numOfComposers, totalNumOfComposers, sl){

    infos={c:sl_ctry, y:sl_year, nc:numOfComposers, tnc:totalNumOfComposers, sl:sl};

    var mode = infos.sl ? 'showing this edition only | click to show all composers'
                        : 'showing all composers | click to keep this edition only';

    var line1 = infos.c + ', edition ' + infos.y +
            ' · this edition: ' + cp_infos.num + '/' + infos.nc + ' composers with archived works' +
            ' · all editions: ' + cp_infos.all + '/' + infos.tnc +
            ' · records: ' + cp_infos.titles + '/' + cp_infos.all_titles;

	$("#selection").empty();
    $("#selection").append($('<p>').text(line1));
    $("#selection").append($('<p>').text(mode));
}
function getNumComposersInCapsulesAndTitles(cId, year, composers){

    cp_infos={num:0, all:0, titles:0, all_titles:0};

    for (var i=0; i<composers.length; i++) {

        var count=parseInt(numTitlesByArtist[composers[i].id]);

        if(count>0&&composers[i].y>0){
            cp_infos.num++;
            cp_infos.titles+=parseInt(numTitlesByArtist[composers[i].id]);
        }

        if(count>0){
            cp_infos.all++;
            cp_infos.all_titles+=parseInt(numTitlesByArtist[composers[i].id]);
        }
    }

}
function retrieveAllTitleFrom(aId){

    var gen = dataGen;

    $.ajax({
        url: 'php/retrieve_data.php',
        type: "POST",
        data: { aId: aId, case:1 }
    }).done(function(str) {

        if(gen !== dataGen) return;

        var arr=str.split("%");
        titles=[];

        for (var i=0; i<arr.length-6; i+=7) {
            titles.push({id:arr[i], t:arr[i+1], d:arr[i+2], m:arr[i+3],
                         y:arr[i+4], ed:arr[i+5], pv:arr[i+6]});
        }

        displayTitlesInfos();

    });

}

function displayTitlesInfos(){

    displayComposerBox();
    displayTitlesInfosGN(titles);

    positionWorkPanel();
    matchComposersHeight();
}

function displayComposerBox(){

    var box = $('#composerBox');
    if(!box.length) return;

    var who  = $.trim(lastComposerSelected || '');
    var isni = $.trim(lastComposerIsni || '');

    if(!who){
        box.empty();
        if(typeof hideIsniBox === 'function') hideIsniBox();
        return;
    }

    var vie = (typeof datesDeVieGN === 'function')
              ? datesDeVieGN(lastComposerNe, lastComposerMo) : '';
    var tete = who + (vie ? ' \u00b7 ' + vie : '');

    box.html('<p>'+(typeof esc === 'function' ? esc(tete) : tete)+'</p>');

    if(typeof countryLineHtml === 'function'){
        box.append(countryLineHtml(lastComposerOrigin, lastComposerCtry));
    }

    syncIsniBoxGN(isni);
}

function positionWorkPanel(){
    var pan=document.getElementById('workPanel'),
        tit=document.getElementById('titles'),
        lg=document.getElementById('legend'),
        sel=document.getElementById('selection'),
        content=document.getElementById('content');
    if(!pan || !tit || !lg || !content) return;
    if(getComputedStyle(tit).display==='none') return;
    var gap=14;

    var edge = lg.offsetLeft + lg.offsetWidth;
    if(sel) edge = Math.max(edge, sel.offsetLeft + sel.offsetWidth);
    var left  = edge + gap;
    var avail = content.clientWidth - left - 5;

    var top = sel ? sel.offsetTop : (lg.offsetTop + lg.offsetHeight + gap);

    pan.style.position='absolute';
    pan.style.top  = top + 'px';
    pan.style.left = left + 'px';

    pan.style.maxWidth = Math.max(220, Math.min(avail, 440)) + 'px';
}

function matchComposersHeight(){
    var comp=document.getElementById('composers');
    if(comp) comp.style.minHeight='';
}

function appendComposerLi(obj, count, inSelectedEdition){

    var masked = !SHOW_ALL_NAMES && !(count>0);

    var nom = $.trim((obj.fn || '') + ' ' + (obj.n || ''));
    var libelle = masked ? maskName(nom) : nom;
    if(count>0) libelle += ' (' + count + ')';

    var cls = [];
    if(count>0)            cls.push('active');
    if(inSelectedEdition)  cls.push('selected');
    if(masked)             cls.push('masked');

    var li = $('<li>').text(libelle);
    if(cls.length) li.attr('class', cls.join(' '));

    var tip = '';
    if(inSelectedEdition) tip += 'took part in the selected edition';
    if(count>0)           tip += (tip ? ' · ' : '') + count + ' archived work(s) · click to list them';
    if(!tip)              tip  = 'no archived work';
    if(masked)            tip += ' · name withheld';
    li.attr('title', tip);

    if(!masked){
        li.attr('data-id', obj.id);

        if(obj.isni)   li.attr('data-isni', obj.isni);

        if(obj.ctry)   li.attr('data-ctry', obj.ctry);
        if(obj.origin) li.attr('data-origin', obj.origin);
        if(obj.ne)     li.attr('data-ne', obj.ne);
        if(obj.mo)     li.attr('data-mo', obj.mo);

        li.click(function(event) {
            var el = $(event.target);
            retrieveAllTitleFrom(el.data("id"));

            lastComposerSelected = $.trim(el.text().replace(/\s*\(\d+\)\s*$/, ''));
            lastComposerIsni = el.attr('data-isni') || '';
            lastComposerCtry = el.attr('data-ctry') || '';
            lastComposerOrigin = el.attr('data-origin') || '';
            lastComposerNe = el.attr('data-ne') || '';
            lastComposerMo = el.attr('data-mo') || '';
        });
    }

    $("#composers").append(li);
}
function displayCpInfos(){

	$("#composers").empty();

    var liste = composers.slice().sort(compareComposers);

    for (var j=0; j<liste.length; j++) {

        var obj=liste[j];
        var count=numTitlesByArtist[obj.id];

        if(takeCountIntoAccount && !(count>0)) continue;

        if(obj.y>0)             appendComposerLi(obj, count, true);
        else if(!yearSelection) appendComposerLi(obj, count, false);
    }
    matchComposersHeight();
}

function retireCurrentChart(){

    if(myLineChart){
        pendingSolo = captureIsolatedCountries(myLineChart);
        if(typeof myLineChart.retire === 'function') myLineChart.retire();
    }
}

function clearWorkPanel(){
    lastComposerSelected = '';
    lastComposerIsni     = '';
    lastComposerCtry     = '';
    lastComposerOrigin   = '';
    lastComposerNe       = '';
    lastComposerMo       = '';
    titles = [];

    $('#composers').empty();

    $('#titles').empty();

    displayComposerBox();
}
function updateSlData(){

	var tmpY = sl_years.concat(inBtwYears);

    retireCurrentChart();
    clearWorkPanel();
    dataGen++;

    setViewSwitchEnabled(sl_years.length===2 || sl_years.length<1);

    if(sl_years.length==1 && !btn01.state){

        var f_data=[];

        for (var i=0; i<allData.length-5; i+=6) {

            var arr = allData[i+4].split(",");
            var count = allData[i+3];

            for (var j=0; j<arr.length; j++) {
                if(tmpY.includes(parseInt(arr[j]))){

                    var auFonds = parseInt(count, 10) > 0;

                    if(takeCountIntoAccount){
                        if(count>0)f_data.push({id: allData[i], ctry: allData[i+1], cId: allData[i+2], edition: allData[i+4], works: auFonds});
                    } else {
                        f_data.push({id: allData[i], ctry: allData[i+1], cId: allData[i+2], edition: allData[i+4], works: auFonds});
                    }

                    break;
                }
            }
        }

        var inf1 = "composers: " + f_data.length;
        $("#info p:eq(1)").text(inf1);

    	generateBarChart(f_data);

    } else if(sl_years.length==2 || sl_years.length<1){

        var f_data=[];
        var minY, maxY;

        if(sl_years.length<1) {
            minY=1973;
            maxY=2009;
        } else {
            minY=Math.min(sl_years[0], sl_years[1]);
            maxY=Math.max(sl_years[0], sl_years[1]);
        }

        for (var i=0; i<allData.length-5; i+=6) {

            var count = allData[i+3];

            if(f_data.length<1){

                f_data.push({ctry: allData[i+1], cId: allData[i+2], arr: []});

                for (var j=0; j<=maxY-minY; j++)f_data[f_data.length-1].arr[j]=0;

                var t_years = getEditionsAsArrOfInts(allData[i+4]);
                var year=minY;

                while(year<maxY+1){

                    if(takeCountIntoAccount){
                        if(t_years.includes(year) && count>0)f_data[0].arr[year-minY]+=1;
                    } else {
                        if(t_years.includes(year))f_data[0].arr[year-minY]+=1;
                    }

                    year++;
                }

            } else {

                var found = false;

                for (var k=0; k<f_data.length; k++){

                    if(f_data[k].cId === allData[i+2]){

                        var t_years = getEditionsAsArrOfInts(allData[i+4]);
                        var year=minY;

                        while(year<maxY+1){

                            if(takeCountIntoAccount){
                                if(t_years.includes(year) && count>0)f_data[k].arr[year-minY]+=1;
                            } else {
                                if(t_years.includes(year))f_data[k].arr[year-minY]+=1;
                            }

                            year++;
                        }

                        found = true;
                        break;
                    }
                }

                if(!found){

                    f_data.push({ctry: allData[i+1], cId: allData[i+2], arr: []});
                    for (var j=0; j<=maxY-minY; j++)f_data[f_data.length-1].arr[j]=0;

                    var t_years = getEditionsAsArrOfInts(allData[i+4]);
                    var year=minY;

                    while(year<maxY+1){

                        if(takeCountIntoAccount){
                            if(t_years.includes(year)  && count>0)f_data[f_data.length-1].arr[year-minY]+=1;
                        } else {
                            if(t_years.includes(year))f_data[f_data.length-1].arr[year-minY]+=1;
                        }

                        year++;
                    }

                }
            }
        }

        $("#info p:eq(1)").text('');

        f_data.sort(function(a, b){
            return String(a.ctry).localeCompare(String(b.ctry));
        });

        generateLineGraph(f_data, minY, maxY);

    } else {

        myLineChart = null;

        setCanvasWidthAndHeight(true);
        drawAwaitingSecondYear();

        $("#info p:eq(1)").text('');
        updateDataQualityInfo();

        $("#selection").empty();
        $("#selection").append($('<p>').text(
            sl_years[0] + " selected · pick a second year to chart the period between them"));
        $("#selection").append($('<p>').text(
            "or turn the span toggle off to get a bar chart of that single edition"));
    }
}

function drawAwaitingSecondYear(){
    if(!context) return;
    context.save();
    context.font = '13px "Helvetica Neue", Helvetica, Arial, sans-serif';
    context.fillStyle = "#8fa3b0";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("pick a second year on the strip above to chart the period between them",
                     canvas.width/2, canvas.height/2);
    context.restore();
}
function getEditionsAsArrOfInts(str){
    return str.split(",").map(Number);
}
function generateLineGraph(data, minYear, maxYear){

    $("#composers").empty();

    if(chartView === 'matrix' && typeof MatrixChart === 'function'){
        generateMatrixChart(data, minYear, maxYear);
        return;
    }

    setCanvasWidthAndHeight(true);

	var maxValue=0;

	for (var j = 0; j < data.length; j++) {
		var arr = data[j].arr;
		for (var k = 0; k < arr.length; k++) {
			if(arr[k]>maxValue)maxValue=arr[k];
		}
	}

    myLineChart = new LineChart({
        canvasId: "myCanvas",
        minY: 0,
        maxX: (maxYear-minYear)*5,
        maxY: maxValue,
        unitsPerTickX: 5,
        unitsPerTickY: 10,
        minYear: minYear,
        maxYear: maxYear
    });

    for (var i = 0; i < data.length; i++) {
        var sum = data[i].arr.reduce(add, 0);
        if(sum>0)myLineChart.drawLine(data[i], colors[5], 1, true);
    }

    updateDataQualityInfo();

    myLineChart.drawLegend();

    if(applyIsolatedCountries(myLineChart, pendingSolo)){
        myLineChart.refreshLegendButtons();
        myLineChart.redrawLineChart();
    }
    pendingSolo = [];

    var txt='<p>'+myLineChart.data.length.toString()+
            " countries · click a point on a line to list the composers of that country</p>";
    $("#selection").empty();
    $("#selection").append(txt);

}
function add(a, b) {
    return a + b;
}

function editionsSansConstat(minY, maxY){

    var manquantes = [];

    for (var a in pvByYear) {
        var y = parseInt(a, 10);
        if(isNaN(y) || y < minY || y > maxY) continue;
        if(pvState(y) !== 'constat') manquantes.push(y);
    }

    manquantes.sort(function(p, q){ return p - q; });
    return manquantes;
}

function texteQualiteDonnees(minY, maxY){

    if(!pvKnown()) return "";

    var etendue = (minY === maxY) ? String(minY) : (minY + "-" + maxY);
    var m = editionsSansConstat(minY, maxY);

    if(m.length === 0) return etendue + ": complete data";
    if(minY === maxY)  return etendue + ": incomplete data";
    if(m.length === 1) return etendue + ": incomplete data, " + m[0];

    return etendue + ": incomplete data, " + m.length + " editions";
}

function updateDataQualityInfo(){

    var minY, maxY;

    if(sl_years.length === 2){
        minY = Math.min(sl_years[0], sl_years[1]);
        maxY = Math.max(sl_years[0], sl_years[1]);
    } else if(sl_years.length === 1){
        minY = maxY = sl_years[0];
    } else {
        minY = 1973;
        maxY = 2009;
    }

    $("#info p:eq(2)").text(texteQualiteDonnees(minY, maxY));
}

function generateMatrixChart(data, minYear, maxYear){

    var rows=[];
    for (var i=0; i<data.length; i++) {
        if(data[i].arr.reduce(add, 0) > 0) rows.push(data[i]);
    }

    setCanvasWidthAndHeight(true);

    myLineChart = new MatrixChart({
        canvasId: "myCanvas",
        data: rows,
        minYear: minYear,
        maxYear: maxYear,
        sortMode: matrixSort,

        onSort: function(mode){ matrixSort = mode; }
    });
    matrixSort = myLineChart.sortMode;

    if(applyIsolatedCountries(myLineChart, pendingSolo)) myLineChart.draw();
    pendingSolo = [];

    updateDataQualityInfo();

    $("#selection").empty();
    $("#selection").append('<p>' + rows.length +
        " countries · click a cell to list the composers of that country</p>");
}

function bindViewSwitch(){

    var box = document.getElementById('view');
    if(!box) return;

    var items = box.getElementsByTagName('li');

    function paint(){
        for (var p=0; p<items.length; p++) {
            var on = items[p].getAttribute('data-view') === chartView;
            items[p].className = on ? 'b_on' : 'b_off';
            items[p].setAttribute('aria-pressed', on ? 'true' : 'false');
        }
    }

    function choose(el){

        if(box.hasAttribute('data-disabled')) return;

        var m = el.getAttribute('data-view');
        if(!m || m === chartView) return;

        chartView = m;
        paint();
        ecrireVuesDansLUrl();
        hideLineTooltip();

        if(init) updateSlData();
    }

    for (var i=0; i<items.length; i++) {
        (function(el){
            el.onclick = function(){ choose(el); };
            el.onkeydown = function(evt){
                var k = evt.keyCode || evt.which;
                if(k === 13 || k === 32){
                    if(evt.preventDefault) evt.preventDefault();
                    choose(el);
                }
            };
        })(items[i]);
    }

    paint();
}

function bindCountSwitch(){

    var box = document.getElementById('count');
    if(!box) return;

    var items = box.getElementsByTagName('li');

    function paint(){
        for (var p=0; p<items.length; p++) {
            var on = (items[p].getAttribute('data-count') === 'works') === !!takeCountIntoAccount;
            items[p].className = on ? 'b_on' : 'b_off';
            items[p].setAttribute('aria-pressed', on ? 'true' : 'false');
        }
    }

    function choose(el){
        var m = el.getAttribute('data-count');
        if(!m) return;
        var v = (m === 'works');
        if(v === !!takeCountIntoAccount) return;
        takeCountIntoAccount = v;
        paint();
        ecrireVuesDansLUrl();
        hideLineTooltip();
        if(init){

            var etaitOuverte = $('#composers').children().length > 0;
            var q = window.lastComposerQuery;
            updateSlData();
            if(etaitOuverte && q && myLineChart &&
               typeof myLineChart.retrieveData === 'function'){
                myLineChart.sl_ctry = q.ctry;
                myLineChart.retrieveData(q.cId, q.year, q.value);
            }
        }
    }

    for (var i=0; i<items.length; i++) {
        (function(el){
            el.onclick = function(){ choose(el); };
            el.onkeydown = function(evt){
                var k = evt.keyCode || evt.which;
                if(k === 13 || k === 32){
                    if(evt.preventDefault) evt.preventDefault();
                    choose(el);
                }
            };
        })(items[i]);
    }

    paint();
}

function setViewSwitchEnabled(on){
    var box = document.getElementById('view');
    if(!box) return;
    if(on) box.removeAttribute('data-disabled');
    else   box.setAttribute('data-disabled', '1');
}
function generateBarChart(data){

    $("#composers").empty();

	var arr=[], parCId=Object.create(null), totEntrants=data.length, totWorks=0;

	for (var i=0; i<data.length; i++) {
		var k = String(data[i].cId);
		if(!parCId[k]){
			parCId[k] = {label: data[i].ctry, cId: data[i].cId, value: 0, withWorks: 0};
			arr.push(parCId[k]);
		}
		parCId[k].value += 1;
		if(data[i].works){ parCId[k].withWorks += 1; totWorks++; }
	}

	arr.sort(function(a, b){
		return String(a.label).localeCompare(String(b.label));
	});

	$("#info p:eq(2)").text(texteQualiteDonnees(sl_years[0], sl_years[0]));

	var max=0;
	for (var k=0; k<arr.length; k++) max = Math.max(max, arr[k].value);

    $("#selection").empty();
    $("#selection").append($('<p>').text(
        arr.length + " countries · " + totWorks + " / " + totEntrants +
        " composers with archived works"));
    $("#selection").append($('<p>').text(
        "click a bar to list the composers of that country"));

    var increment = Math.round(max/10);

    if(max<20)increment=2;
    if(increment<1)increment=1;

    var chartWidth = Math.max(900, Math.min(maxChartWidth, 70 + arr.length * 26));

    setCanvasWidthAndHeight(false, chartWidth);

	myLineChart = new BarChart({canvasId: "myCanvas", data: arr, width: chartWidth, height: 500,
	              minValue: 0, maxValue: max, gridLineIncrement: increment,
	              year: sl_years[0],
	              sortMode: barSort,

	              onSort: function(mode){ barSort = mode; }});
	barSort = myLineChart.sortMode;

	if(applyIsolatedCountries(myLineChart, pendingSolo)) myLineChart.draw();
	pendingSolo = [];
}

function editData(evt){

    if(!myLineChart) return;

    var cv = canvas.getBoundingClientRect();
    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    if(typeof myLineChart.handleClick === 'function'){
        myLineChart.handleClick(mouseX, mouseY);
        return;
    }

    if(sl_years.length===2 || menu[0].state){
        if(mouseX<myLineChart.w)myLineChart.requestData(mouseX, mouseY);
        else myLineChart.editData(mouseX, mouseY);
    }

}

function hoverData(evt){
    if(!myLineChart){ hideLineTooltip(); return; }
    var cv = canvas.getBoundingClientRect();
    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    if(typeof myLineChart.handleHover !== 'function'){ hideLineTooltip(); return; }

    var lbl = myLineChart.handleHover(mouseX, mouseY);
    if(lbl) showLineTooltip(lbl, evt.clientX, evt.clientY);
    else    hideLineTooltip();
}
function clearHoverData(){
    if(myLineChart) myLineChart.clearHover();
    hideLineTooltip();
}

function getLineTooltip(){
    var t = document.getElementById('lineTooltip');
    if(!t){
        t = document.createElement('div');
        t.id = 'lineTooltip';

        t.style.cssText = 'position:fixed;pointer-events:none;z-index:1000;display:none;'
            + 'background:rgba(44,62,80,.97);color:#f1c40f;font-weight:600;'
            + 'font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;font-size:12px;'
            + 'padding:4px 8px;border-radius:3px;border:1px solid #f1c40f;'
            + 'white-space:normal;max-width:320px;line-height:1.35;';
        document.body.appendChild(t);
    }
    return t;
}

function showLineTooltip(txt, clientX, clientY){
    var t = getLineTooltip();
    t.textContent = txt;
    t.style.display = 'block';
    t.style.left = '0px';
    t.style.top  = '0px';

    var r = t.getBoundingClientRect();
    var marge = 8, dx = 14;
    var x = clientX + dx, y = clientY + dx;

    if(x + r.width  > window.innerWidth  - marge) x = clientX - r.width  - dx;
    if(y + r.height > window.innerHeight - marge) y = clientY - r.height - dx;

    var maxX = window.innerWidth  - r.width  - marge;
    var maxY = window.innerHeight - r.height - marge;
    if(x > maxX) x = maxX;
    if(y > maxY) y = maxY;
    if(x < marge) x = marge;
    if(y < marge) y = marge;

    t.style.left = Math.round(x) + 'px';
    t.style.top  = Math.round(y) + 'px';
}
function hideLineTooltip(){
    var t = document.getElementById('lineTooltip');
    if(t) t.style.display = 'none';
}
function selectData(evt){

    var cv = cv_nav.getBoundingClientRect();
    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    for (var i=0; i<menu.length; i++) {

        if(mouseX>=menu[i].x && mouseX<=menu[i].x+bw && mouseY>=menu[i].y && mouseY<=menu[i].y+bh){

            if(!init)getData();

            if(i==0 && !menu[0].state){

                if(sl_years.length>0){
                    resetMenu();
                    sl_years=[];
                    inBtwYears=[];
                }

	            activateBtn(i);

                resetInBetweenBtn(colors[3]);
                updateSlData();

            } else if(!menu[i].state){

            	menu[0].state = false;

                if(btn01.state){

                    if(sl_years.length==2) {

                        editSlYearsArray();

                    } else if(sl_years.length<2){
                        menu[0].state=false;
                        resetInBetweenBtn(colors[0]);
                    }
                    sl_years.push(menu[i].id);

                } else {

	                resetMenu();
	                sl_years=[];
	                sl_years.push(menu[i].id);

            	}

	            activateBtn(i);

	            if(sl_years.length==2)checkInBetweenBtn();
    			else inBtwYears=[];

	            updateSlData();

	            break;

	        } else if(menu[i].state && sl_years.length==2){
	        	ctx_nav.fillStyle=c_sl;
           		ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
           		btnIdToEdit = i;
	        }
        }
    }

    if(mouseX>=btn01.x && mouseX<=btn01.x+bw && mouseY>=btn01.y && mouseY<=btn01.y+bh){

        btn01.state = !btn01.state;

        if(btn01.state){
            ctx_nav.fillStyle=colors[2];
            ctx_nav.fillRect(btn01.x, btn01.y, bw, bh);
        } else {
            ctx_nav.fillStyle=colors[6];
            ctx_nav.fillRect(btn01.x, btn01.y, bw, bh);
            while(sl_years.length>1)editSlYearsArray();
            resetInBetweenBtn(colors[0]);

            inBtwYears=[];
            updateSlData();

        }

    }
}
function activateBtn(id){
	menu[id].state = true;
    ctx_nav.fillStyle=c_on;
    ctx_nav.fillRect(menu[id].x, menu[id].y, bw, bh);
}
function editSlYearsArray(){

	if(btnIdToEdit>-1){

		if(menu[btnIdToEdit].id===sl_years[1]) sl_years.pop();
		else sl_years.shift();

		menu[btnIdToEdit].state=false;
    	ctx_nav.fillStyle=colors[0];
    	ctx_nav.fillRect(menu[btnIdToEdit].x, menu[btnIdToEdit].y, bw, bh);

	    btnIdToEdit=-1;

    } else {
    	var y = sl_years.shift();
		var id = years.indexOf(y);

		menu[id].state=false;
    	ctx_nav.fillStyle=colors[0];
    	ctx_nav.fillRect(menu[id].x, menu[id].y, bw, bh);
    }
}
function checkInBetweenBtn(){

    ctx_nav.fillStyle=colors[2];
    ctx_nav.fillRect(btn01.x, btn01.y, bw, bh);

    var pt1, pt2;
    if(sl_years[0]<sl_years[1]){
        pt1 = sl_years[0];
        pt2 = sl_years[1];
    } else {
        pt1 = sl_years[1];
        pt2 = sl_years[0];
    }

    for (var i = 1; i < years.length; i++) {
        if((years[i]<pt1 || years[i]>pt2) && !menu[i].state){
            ctx_nav.fillStyle=colors[0];
            ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
        }
    }

    var id1, id2;
    id1 = years.indexOf(pt1);
    id2 = years.indexOf(pt2);

    inBtwYears=[];

    while(id1<id2-1){
        id1++;
        ctx_nav.fillStyle=colors[3];
        ctx_nav.fillRect(menu[id1].x, menu[id1].y, bw, bh);

        inBtwYears.push(menu[id1].id);
    }

}
function resetInBetweenBtn(c){
    for (var i=0; i<menu.length; i++) {
        if(!menu[i].state){
            ctx_nav.fillStyle=c;
            ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
        }
    }
}
function resetMenu(){
    for (var i=0; i<menu.length; i++) {
        menu[i].state=false;
        ctx_nav.fillStyle=c_off;
        ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
    }
}
function createMenu(){
    var arr=[];
    var xPos=10, yPos=13;
    for (var i=0; i<years.length; i++) {
        arr.push({x:xPos, y:yPos, id:years[i], state:false});
        xPos += 23;
    }
     return arr;
}

var pvByYear = {};
var pvLoaded = false;

var PV_COLORS = {constat:'#2ecc71', depouillement:'#e67e22', liste:'#5dade2', inconnu:'#7f8c8d'};
var PV_LABELS = {
    constat:       "transcribed in full from the bailiff's record · every entry attested",
    depouillement: "minutes transcribed, but not attested by a bailiff's record",
    liste:         "counted from the entrants list and from archived works · second-hand",
    inconnu:       "provenance not loaded"
};

function pvKnown(){ return !!pvLoaded; }
function pvColor(year){
    var st = (typeof pvState==='function') ? pvState(year) : 'inconnu';
    return PV_COLORS[st] || PV_COLORS.inconnu;
}
function pvLabel(year){
    var st = (typeof pvState==='function') ? pvState(year) : 'inconnu';
    return PV_LABELS[st] || PV_LABELS.inconnu;
}

var PV_SEUIL_DEPOUILLEMENT = 5;

var PV_PART_CONSTAT_MINI = 0.40;

function pvState(year){
    var d = pvByYear[year];
    if(!d) return 'inconnu';
    var tot = d.constat + d.inconnu + d.liste;
    if(tot > 0 && d.constat / tot >= PV_PART_CONSTAT_MINI) return 'constat';
    if(d.inexplique >= PV_SEUIL_DEPOUILLEMENT) return 'depouillement';
    return 'liste';
}
function drawPvStrip(menu){
    if(!pvKnown()) return;
    for (var i = 1; i < menu.length; i++) {
        ctx_nav.fillStyle = pvColor(menu[i].id);
        ctx_nav.fillRect(menu[i].x, menu[i].y - 5, bw, 3);
    }
}

function loadPvProvenance(){
    $.ajax({
        url: 'php/retrieve_data.php',
        type: "POST",
        data: {case:12}
    }).done(function(str){
        if(!str) return;
        var f = str.split("%");
        for (var i = 0; i + 4 < f.length; i += 5) {
            pvByYear[parseInt(f[i], 10)] = {
                constat:    parseInt(f[i+1], 10),
                inconnu:    parseInt(f[i+2], 10),
                liste:      parseInt(f[i+3], 10),
                inexplique: parseInt(f[i+4], 10)
            };
        }
        pvLoaded = true;
        drawPvStrip(menu);
        updateDataQualityInfo();

        if(myLineChart && typeof myLineChart.repaint === 'function') myLineChart.repaint();
    });
}
function drawMenu(menu){

    for (var i = 0; i < menu.length; i++) {
        ctx_nav.lineWidth="0.75";
        ctx_nav.strokeStyle=COLORS[0];
        ctx_nav.strokeRect(menu[i].x, menu[i].y, bw, bh);
        ctx_nav.fillStyle=colors[0];
        ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
    }

    drawPvStrip(menu);

    ctx_nav.lineWidth="0.75";
    ctx_nav.strokeStyle=colors[2];
    ctx_nav.strokeRect(btn01.x, btn01.y, bw, bh);

    if(btn01.state)ctx_nav.fillStyle=colors[2];
    else ctx_nav.fillStyle=colors[6];

    ctx_nav.fillRect(btn01.x, btn01.y, bw, bh);

    ctx_nav.font="9px 'Helvetica Neue', Helvetica, Arial, sans-serif";
    ctx_nav.fillStyle="#ecf0f1";
    ctx_nav.textAlign="center";

    for (var i = 0; i < menu.length; i++) {
        var label = (i===0) ? "all" : "'" + menu[i].id.toString().substring(2, 4);
        ctx_nav.fillText(label, menu[i].x + bw/2, 38);
    }
    ctx_nav.fillText("span", btn01.x + bw/2, 38);

    ctx_nav.textAlign="start";

}

function getData(){

    init = true;



	$.ajax({
        url: 'php/retrieve_data.php',
        type: "POST",
        data: {case:10}
    }).done(function(str) {

        numComposersInCapsules=0;
    	allData = str.split("%");

        for (var i=0; i<allData.length-5; i+=6) {
            var id = allData[i];
            var numTitles = allData[i+3];
            numTitlesByArtist[id]=numTitles;

            var ctry_id=allData[i+2];

            if(numCpByCountry[ctry_id])numCpByCountry[ctry_id].t++;
            else numCpByCountry[ctry_id]={t:1, c:0};

            if(numTitles>0){
                numCpByCountry[ctry_id].c++;
                numComposersInCapsules++;
            }

        }

    	var txt = "no selection · click the chart to list the composers of a country";
        $("#selection").empty().append('<p>');
        $("#selection p").append(txt);

        var num = allData.length / 6;
        var txt2 = numComposersInCapsules+ " / " + num + " composers with archived works";
        $("#info p:eq(0)").text(txt2);

        activateBtn(0);
        resetInBetweenBtn(colors[3]);
        updateSlData();

    });
}
