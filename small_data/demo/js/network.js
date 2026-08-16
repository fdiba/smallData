var canvas, context;

var init=false;
var allData, cookies=[], composers, particles=[];

var animation01;
var counter001, pointer001;

var usingCookie=false;
var state=-999;
var running=false;
var smaPaused=false;
var SMA_MIN_TRACES = 20;
var CANVAS_H_ALL = 800;
var CANVAS_H_TRACES = 400;
var MOTION_EASE = .06;

var main_attributes=[];
var sl_attribute='';
var attr_treshold=250;


var numberOfNodesOnDisplayMax = 200;
var activationSpeed = 1;

var counter002 = 0;

var scale = 1;

var SMA_USE_GRID = true;
var SMA_GRID_CELL = 80;
var SMA_GRID_SLACK = 16;
var smaGrid = null;
var smaGridReady = false;
var smaMaxRadius = 1;
var _smaScratch = [];

var SMA_HOVER = true;
var HOVER_REACH = 26;
var HOVER_EASE_IN = .16;
var HOVER_EASE_OUT = .06;
var HOVER_GROW = .5;
var HOVER_DARK = .4;
var HOVER_DWELL = 5;

var smaHoverX = 0;
var smaHoverY = 0;
var smaHoverIn = false;
var smaHoverId = -1;
var smaHoverKey = null;
var smaHoverAge = 0;
function SpatialGrid(width, height, cellSize){
    this.cellSize = cellSize;
    this.cols = Math.max(1, Math.ceil(width/cellSize));
    this.rows = Math.max(1, Math.ceil(height/cellSize));
    this.cells = [];
}
SpatialGrid.prototype.build = function(items){
    this.cells = [];
    var cs = this.cellSize, cols = this.cols, rows = this.rows;
    for(var i=0; i<items.length; i++){
        var p = items[i];
        var cx = Math.floor(p.x/cs); if(cx<0)cx=0; else if(cx>=cols)cx=cols-1;
        var cy = Math.floor(p.y/cs); if(cy<0)cy=0; else if(cy>=rows)cy=rows-1;
        var k = cx + cy*cols;
        (this.cells[k] || (this.cells[k]=[])).push(i);
    }
};
SpatialGrid.prototype.queryRadius = function(x, y, radius, out){
    out.length = 0;
    var cs = this.cellSize, cols = this.cols, rows = this.rows;
    var minCx = Math.floor((x-radius)/cs); if(minCx<0)minCx=0;
    var maxCx = Math.floor((x+radius)/cs); if(maxCx>=cols)maxCx=cols-1;
    var minCy = Math.floor((y-radius)/cs); if(minCy<0)minCy=0;
    var maxCy = Math.floor((y+radius)/cs); if(maxCy>=rows)maxCy=rows-1;
    for(var cy=minCy; cy<=maxCy; cy++){
        var rowBase = cy*cols;
        for(var cx=minCx; cx<=maxCx; cx++){
            var cell = this.cells[cx + rowBase];
            if(cell)for(var i=0; i<cell.length; i++)out.push(cell[i]);
        }
    }
    if(out.length>1)out.sort(function(a,b){return a-b;});
    return out;
};
function buildSMAGrid(){
    if(!canvas)return;
    if(!smaGrid || smaGrid.cellSize!==SMA_GRID_CELL
        || smaGrid.cols!==Math.max(1,Math.ceil(canvas.width/SMA_GRID_CELL))
        || smaGrid.rows!==Math.max(1,Math.ceil(canvas.height/SMA_GRID_CELL))){
        smaGrid = new SpatialGrid(canvas.width, canvas.height, SMA_GRID_CELL);
    }
    smaGrid.build(particles);
    var mr = 1;
    for(var i=0; i<particles.length; i++)if(particles[i].radius>mr)mr=particles[i].radius;
    smaMaxRadius = mr;
    smaGridReady = true;
}

window.onload = function() {

	canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');

    canvas.width = 1200*scale;
    canvas.height = 800*scale;

    var lg_ = document.getElementById('legend');
    if(lg_){ lg_.style.boxSizing='border-box'; lg_.style.width=canvas.width+'px'; lg_.style.maxWidth=canvas.width+'px'; }

    getDataV2();

    $(document).on('keydown', function(e){

        if(e.which !== 32) return;

        var cible = e.target;
        var nom = (cible && cible.nodeName) ? cible.nodeName.toLowerCase() : '';

        if(nom === 'input' || nom === 'textarea' || nom === 'select') return;
        if(cible && cible.isContentEditable) return;

        e.preventDefault();

        if(state>=0) basculePause();
    });

    $("#sma_main_ctrl ul").append('<li>reset</li>');
    $("#sma_main_ctrl ul").append('<li>pause</li>');
    $("#sma_main_ctrl ul li:first").css("text-decoration", "underline").on("click", reinitialiser);
    $("#sma_main_ctrl ul li:last").css("text-decoration", "underline").on("click", pauseSMA);

    canvas.addEventListener("mousemove", suivrePointeur);
    canvas.addEventListener("mouseleave", quitterPointeur);

    majPause(false);
    majCommons();

    if(typeof enableIsniPanel === 'function'){
        enableIsniPanel({ into: 'isniColumn' });
    }

}
function reinitialiser(){

    if(state < 0) return;

    if(usingCookie) computeTraces();
    else computeAll();
}
function basculePause(){
    smaPaused = !smaPaused;
    smaHoverKey = null;
    smaHoverAge = 0;
    $("#sma_main_ctrl ul li:last").text(smaPaused ? "play" : "pause");
}

function suivrePointeur(evt){

    var cv = canvas.getBoundingClientRect();

    smaHoverX = evt.clientX - cv.left;
    smaHoverY = evt.clientY - cv.top;
    smaHoverIn = true;
}

function quitterPointeur(){
    smaHoverIn = false;
}

function survolActif(){
    return SMA_HOVER && smaHoverIn && smaPaused && sl_attribute.localeCompare("")===0;
}

function majSurvol(){

    var id = -1;

    if(survolActif()){

        var best = 1e9;

        for (var i=0; i<particles.length; i++) {

            var p = particles[i];
            var portee = p.radius*2 + HOVER_REACH;
            var d = dist(smaHoverX, p.x, smaHoverY, p.y);

            if(d<=portee && d<best){ best=d; id=i; }
        }
    }

    for (var j=0; j<particles.length; j++) {

        var q = particles[j];
        if(q.hoverAmp===undefined)q.hoverAmp=0;

        var cible = (j===id) ? 1 : 0;
        var pas = (cible>q.hoverAmp) ? HOVER_EASE_IN : HOVER_EASE_OUT;

        q.hoverAmp += (cible - q.hoverAmp)*pas;

        if(q.hoverAmp < .002)q.hoverAmp = 0;
        else if(q.hoverAmp > .998)q.hoverAmp = 1;
    }

    if(id!==smaHoverId)smaHoverAge = 0;
    else if(id>=0)smaHoverAge++;

    smaHoverId = id;

    if(canvas)canvas.style.cursor = (id>=0) ? 'pointer' : '';

    if(id<0 || smaHoverAge<HOVER_DWELL)return;

    var p = particles[id];
    var cle = (p.ids.length===1) ? 'r'+p.ids[0] : 'g'+id+'-'+p.ids.length;

    if(cle===smaHoverKey)return;
    smaHoverKey = cle;

    ecrireBoiteCommuns(id);

    removePreviousSelection();

    if(p.ids.length===1){
        p.getTitlesFrom(p.ids[0]);
    } else {
        setSelectionTextGN(p.ids.length+' composers');
        $("#titles").empty();
    }
}

function ecrireBoiteCommuns(id){

    if(typeof particles[id].attributsPartages !== 'function')return;

    var r = particles[id].attributsPartages(particles, id);

    var txt;

    if(r.liens===0){
        txt = 'no link yet';
    } else {

        txt = r.liens + (r.liens>1 ? ' links' : ' link');

        if(r.noms.length>0){
            var lisibles = [];
            for (var i=0; i<r.noms.length; i++) lisibles.push(nomAffiche(r.noms[i]));
            txt += ' | shares: ' + lisibles.join(', ');
        }
    }

    $("#cookies").empty().append('<p>');
    $("#cookies p").text(txt);
}
function pauseSMA(){
    basculePause();
}
function majMotion(){
    var cible = smaPaused ? 0 : 1;
    SMA_MOTION += (cible - SMA_MOTION) * MOTION_EASE;
    if(SMA_MOTION < .002) SMA_MOTION = 0;
    else if(SMA_MOTION > .998) SMA_MOTION = 1;
}
function majPause(visible){
    $("#sma_main_ctrl").css('display', visible ? '' : 'none');
}
function majNote(texte){
    if(texte){
        $("#myCanvas").hide();
        $("#infos").hide();
        $("#sma_note").text(texte).show();
    } else {
        $("#sma_note").hide().empty();
        $("#myCanvas").show();
        $("#infos").show();
    }
}
function majCommons(){
    var vide = $.trim($("#commons p").text()).length === 0;
    $("#commons").css('display', vide ? 'none' : '');
}
function hauteurCanevas(h){
    if(canvas.height === h*scale) return;
    canvas.height = h*scale;
    smaGridReady = false;
    smaGrid = null;
    resetSMACanvas();
}

function resetSimulation(){

    if(animation01)clearInterval(animation01);

    particles=[];
    composers=[];
    counter001=0;
    pointer001=0;
    counter002=0;

    sl_attribute='';
    main_attributes=[];
    running=false;
    smaPaused=false;
    SMA_MOTION=1;
    smaHoverId=-1;
    smaHoverKey=null;
    smaHoverAge=0;

    $("#commons p").removeAttr('data-html').css({"text-decoration":"none","cursor":"default"}).empty();
    $("#cookies").empty();
    $("#titles").empty();
    $("#sma_main_ctrl ul li:last").text("pause");
    majPause(false);
    majCommons();
    majNote('');

    resetSMACanvas();
}
function computeAll(){

    resetSimulation();

    hauteurCanevas(CANVAS_H_ALL);

    usingCookie=false;
    state=1;
    running=true;

    $("#cp_all").removeClass('b_off').addClass('b_on');
    $("#get_sl").removeClass('b_on').addClass('b_off');

    var ecartes = 0;
    for (var i=0; i<allData.length-5; i+=6){
        var n = parseInt(allData[i+3], 10);
        if(!SHOW_ALL_NAMES && !(n>0)){ ecartes++; continue; }
        composers.push({id:allData[i], count:allData[i+3]});
    }
    if(ecartes>0) console.log(ecartes + ' compositeurs sans oeuvre archivee ecartes du systeme ('
                              + composers.length + ' retenus)');

    if(composers.length>0){
        majPause(true);
        animation01=setInterval(sma_animation, 1000/30);
        document.getElementById('myCanvas').addEventListener("click", getParticleInfos);
        document.getElementById('myCanvas').addEventListener("dblclick", closeParticleOnDblClick);
    }

}
function computeTraces(){

    resetSimulation();

    hauteurCanevas(CANVAS_H_TRACES);

    usingCookie=true;
    state=0;
    running=true;

    $("#get_sl").removeClass('b_off').addClass('b_on');
    $("#cp_all").removeClass('b_on').addClass('b_off');

    var saved = $.cookie('ids');

    if(!saved){
        majNote('No navigation trace yet. Browse composers in Overview first, then come back.');
        $("#get_sl").removeClass('b_on').addClass('b_off');
        running=false;
        return;
    }

    cookies = saved.split('%');

    for (var i=0; i<cookies.length; i+=2)composers.push({id:cookies[i], count:cookies[i+1]});

    if(composers.length<SMA_MIN_TRACES){
        majNote('Only ' + composers.length + ' composer' + (composers.length>1 ? 's' : '')
                + ' in your navigation trace. The system needs at least ' + SMA_MIN_TRACES
                + ' to say anything. Browse a few more in Overview, then come back.');
        $("#get_sl").removeClass('b_on').addClass('b_off');
        running=false;
        return;
    }

    if(composers.length>0){
        majPause(true);
        animation01=setInterval(sma_animation, 1000/30);
        document.getElementById('myCanvas').addEventListener("click", getParticleInfos);
        document.getElementById('myCanvas').addEventListener("dblclick", closeParticleOnDblClick);
    }

}

function closeParticleOnDblClick(evt){

    var cv = canvas.getBoundingClientRect();

    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    for (var i=0; i<particles.length; i++) {

        if(particles[i].open && !particles[i].opening){

            var distance=dist(mouseX, particles[i].x, mouseY, particles[i].y);

            if(distance<=particles[i].radius*2){
                particles[i].openOrCloseIt();
                $("#cookies").empty().append('<p>'+ particles.length + ' nodes</p>');
                $("#titles").empty();
                removePreviousSelection();
                break;
            }
        }
    }
}
function getParticleInfos(evt){

    var cv = canvas.getBoundingClientRect();

    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    for (var i=0; i<particles.length; i++) {

        var distance=dist(mouseX, particles[i].x, mouseY, particles[i].y)
        if(distance<=particles[i].radius*2){

            if(sl_attribute.localeCompare("")===0){

                ecrireBoiteCommuns(i);

            } else {

                var txt=particles[i].label+' '+ particles[i].iso+' '+ particles[i].ids.length;

                $("#cookies").empty().append('<p>');
                $("#cookies p").text(txt);
            }

            if(particles[i].ids.length>1){

                var child_targeted=false;
                if(particles[i].open){
                    child_targeted = particles[i].processChilds(mouseX, mouseY);
                }

                if(!child_targeted && !particles[i].opening && !particles[i].open){
                    particles[i].openOrCloseIt();
                    $("#titles").empty();
                    removePreviousSelection();
                }

            } else if(particles[i].ids.length===1){
                particles[i].getTitlesFrom(particles[i].ids[0]);
                removePreviousSelection();
                particles[i].lastNodeSelected=true;
            }

            break;
        }
    }
}
function removePreviousSelection(){
    for (var i = 0; i < particles.length; i++) {
        particles[i].lastNodeSelected=false;
        for (var j = 0; j < particles[i].childs.length; j++) {
            particles[i].childs[j].lastNodeSelected=false;
        }
    }
}
function addParticleUsing(i){

    var index=0;
    while(composers[i].id!=allData[index])index+=6;

    if(usingCookie){
        particles.push(createNewParticle(composers[i].id, allData[index+1], allData[index+5], composers[i].count, 1));
    } else {
        particles.push(createNewParticle(composers[i].id, allData[index+1], allData[index+5], composers[i].count, .15));
    }

    pointer001++;

    var txt=particles.length+' nodes '+ parseInt(pointer001 / composers.length*100)+'%';
    $("#cookies").empty().append('<p>');
    $("#cookies p").text(txt);

}
function sma_animation(){

    majMotion();

    if(pointer001<composers.length && running && !smaPaused
        && particles.length<numberOfNodesOnDisplayMax){
        addParticleUsing(pointer001);
    }

    resetSMACanvas();

    majSurvol();

    if(sl_attribute.localeCompare("")==0){
        shareInformation();

    } else {

        if(!smaPaused){

            if(state===0){

                if(particles.length>0){
                    particles[counter002%particles.length].on = true;
                    counter002++;
                }

            } else if(state===1){

                if(counter001%activationSpeed===0 && particles.length>0){

                    particles[counter002%particles.length].on = true;
                    counter002++;
                }
            }
        }

        allowGrouping();
    }

    if(running && !smaPaused)counter001++;
}
function shareInformation(){

    smaGridReady=false;

    for (var i=0; i<particles.length; i++) {

        particles[i].addNoiseField(10.);

        var attributes = particles[i].SearchCommonsAndGetAwayFrom22(i, particles);

        if(attributes.length>0)checkAttributes(attributes);

        particles[i].degagerChevauchement(i, particles);

        particles[i].checkEdgesV1();

        particles[i].updateBeforeMerging();

        particles[i].display();

    }

}
function checkAttributes(attributes){

    if(main_attributes.length<1){

        for (var i=0; i<attributes.length; i++) {
            main_attributes.push(attributes[i]);
        }

    } else {

        for (var i=0; i<attributes.length; i++) {

            var hasBeenFound=false;

            for (var j=0; j<main_attributes.length; j++){

                if(attributes[i].name.localeCompare(main_attributes[j].name)==0){
                    main_attributes[j].count+=attributes[i].count;
                    hasBeenFound = true;
                    break;
                }
            }

            if(!hasBeenFound)main_attributes.push(attributes[i]);
        }
    }

    main_attributes.sort(function(a, b){ return b.count - a.count; });

    var commons_p = $("#commons p");
    var html = '', separateur = '';

    for (var k=0; k<main_attributes.length; k++) {

        var m = main_attributes[k];
        var compte = m.count>attr_treshold ? '' : ' (' + m.count + ')';

        html += separateur + '<u data-attr="' + m.name + '">' + nomAffiche(m.name) + '</u>' + compte;
        separateur = ' &middot; ';
    }

    if(commons_p.attr('data-html') !== html){
        commons_p.attr('data-html', html)
                 .html('Group by: ' + html)
                 .css("cursor", "pointer");
        commons_p.find('u').off("click").on("click", setCommonAttr);
    }

    majCommons();
}
function nomAffiche(n){
    if(n === 'label') return 'country';
    if(n === 'works') return 'archived works';
    return n;
}
function setCommonAttr(event){
    var choisi = $(event.target).attr('data-attr');
    if(!choisi) return;
    if(smaPaused) basculePause();
    sl_attribute = choisi;
    afficheGroupe();
}
function afficheGroupe(){

    var autre = '';
    for (var i=0; i<SMA_ATTRS.length; i++) {
        if(SMA_ATTRS[i] !== sl_attribute){ autre = SMA_ATTRS[i]; break; }
    }

    var html = 'Grouped by: ' + nomAffiche(sl_attribute);
    if(autre) html += ' &middot; <u data-attr="' + autre + '">regroup by ' + nomAffiche(autre) + '</u>';

    $("#commons p").removeAttr('data-html').css("cursor", "default").html(html);
    $("#commons p u").off("click").on("click", regrouperDepuisMenu);

    majCommons();
}
function regrouperDepuisMenu(event){

    var attr = $(event.target).attr('data-attr');
    if(!attr) return;

    reinitialiser();

    if(!running) return;

    sl_attribute = attr;
    afficheGroupe();
}
function allowGrouping(){

    buildSMAGrid();

    for (var i=0; i<particles.length; i++) {

        if(particles[i].ids.length<1)continue;

        if(!particles[i].open)particles[i].addNoiseField(5.);
        particles[i].update(i, particles);
        particles[i].display();

    }
    removeDeadParticles();
}
function removeDeadParticles(){
    for (var i=particles.length-1; i>=0; i--) {
        if(particles[i].ids.length<1){
            particles.splice(i, 1);

        }
    }
}
function resetSMACanvas(){

    context.fillStyle=COLORS[0];
    context.fillRect(0, 0, canvas.width, canvas.height);
}
function createNewParticle(id, ctry, iso, count, addRadiusVal){

    return new Particle({
        canvasId: "myCanvas",
        count: count,
        addRadiusVal: addRadiusVal*scale,
        id: id,
        label: ctry,
        works: count,
        iso: iso,
        x:Math.random()*canvas.width,
        y:Math.random()*canvas.height,
        scale: scale
    });

}
function getDataV2(){

	init = true;


    $.ajax({
        url: 'php/retrieve_data.php',
        type: "POST",
        data: {case:10}
    }).done(function(str) {

        allData = str.split("%");

        var txt = "";

        var numComposersInCapsules = 0;
        for (var i=0; i<allData.length-5; i+=6) {
            if(allData[i+3] > 0) numComposersInCapsules++;
        }

        var num = allData.length / 6;
        var txt2 = numComposersInCapsules + " / " + num + " composers with archived works";

        $("#selection").empty();
        $("#selection").append(txt);

        $("#info p:eq(0)").text(txt2);

        context.fillStyle=COLORS[0];
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.stroke();

        document.getElementById('get_sl').addEventListener("click", computeTraces);
        document.getElementById('cp_all').addEventListener("click", computeAll);

    });
}
