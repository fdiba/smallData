var canvas, context;

var init=false;
var allData, cookies=[], composers, particles=[];

var animation01;
var counter001, pointer001;

var usingCookie=false;
var state=-999;
var running=false;

var main_attributes=[];
var sl_attribute='';
var attr_treshold=250;

var noiseField=true;

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

    document.getElementById('get_all').addEventListener("click", getDataV2);

    canvas.width = 1200*scale;
    canvas.height = 800*scale;

    var lg_ = document.getElementById('legend');
    if(lg_){ lg_.style.boxSizing='border-box'; lg_.style.width=canvas.width+'px'; lg_.style.maxWidth=canvas.width+'px'; }

    getDataV2();

    $(document).keypress(function(e) {

        console.log(e.which);

        if(state>=0){

            if(e.which == 32) {
                console.log('pause:', running);
                running=!running;
            }
        }

        if (e.which == 112) {
            console.log('noiseField:', noiseField);
            noiseField=!noiseField;
        }

	});

    $("#sma_main_ctrl ul").append('<li>pause</li>');
    $("#sma_main_ctrl ul li:last").css("text-decoration", "underline").on("click", pauseSMA);

    if(typeof enableIsniPanel === 'function'){
        enableIsniPanel({ into: 'isniColumn' });
    }

}
function pauseSMA(event){
    noiseField =!noiseField;

    if(noiseField) $(event.target).text("pause");
    else $(event.target).text("play");
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
    noiseField=true;
    running=false;

    $("#commons p").off("click").css("text-decoration", "none").empty();
    $("#cookies").empty();
    $("#titles").empty();
    $("#sma_main_ctrl ul li:last").text("pause");

    resetSMACanvas();
}
function computeAll(){

    resetSimulation();

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
        animation01=setInterval(sma_animation, 1000/30);
        document.getElementById('myCanvas').addEventListener("click", getParticleInfos);
        document.getElementById('myCanvas').addEventListener("dblclick", closeParticleOnDblClick);
    }

}
function computeTraces(){

    resetSimulation();

    usingCookie=true;
    state=0;
    running=true;

    $("#get_sl").removeClass('b_off').addClass('b_on');
    $("#cp_all").removeClass('b_on').addClass('b_off');

    var saved = $.cookie('ids');

    if(!saved){
        $("#cookies").empty().append('<p>no navigation trace yet — browse composers in Overview first</p>');
        $("#get_sl").removeClass('b_on').addClass('b_off');
        running=false;
        return;
    }

    cookies = saved.split('%');

    for (var i=0; i<cookies.length; i+=2)composers.push({id:cookies[i], count:cookies[i+1]});

    if(composers.length>0){
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
            var txt=particles[i].label+' '+ particles[i].iso+' '+ particles[i].ids.length;

            $("#cookies").empty().append('<p>');
            $("#cookies p").text(txt);

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
            console.log(particles[i].childs[j].lastNodeSelected);
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

    if(pointer001<composers.length && running
        && particles.length<numberOfNodesOnDisplayMax && noiseField){
        addParticleUsing(pointer001);
    }

    resetSMACanvas();

    if(sl_attribute.localeCompare("")==0){
        shareInformation();

    } else {

        if(state===0){

            particles[counter002%particles.length].on = true;
            counter002++;

        } else if(state===1){

            if(counter001%activationSpeed===0 && particles.length>0){

                particles[counter002%particles.length].on = true;
                counter002++;
            }
        }

        allowGrouping();
    }

    if(running)counter001++;
}
function shareInformation(){

    smaGridReady=false;

    for (var i=0; i<particles.length; i++) {

        if(noiseField){
            particles[i].addNoiseField(10.);

            var attributes = particles[i].SearchCommonsAndGetAwayFrom22(i, particles);

            if(attributes.length>0)checkAttributes(attributes);
        }

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

    var commons_p = $("#commons p");

    if(commons_p.find('u').text() !== main_attributes[0].name){
        commons_p.html('Group by: <u>' + main_attributes[0].name + '</u> <span class="gb-count"></span>')
                 .off("click").on("click", setCommonAttr).css("cursor", "pointer");
    }

    if(main_attributes[0].count>attr_treshold){
        commons_p.find('.gb-count').text('');
    } else {
        commons_p.find('.gb-count').text('(' + main_attributes[0].count + ')');
    }
}
function setCommonAttr(){
    sl_attribute = main_attributes[0].name;
    $("#commons p" ).off("click").css("cursor", "default");
    $("#commons p u").contents().unwrap();
}
function allowGrouping(){

    buildSMAGrid();

    for (var i=0; i<particles.length; i++) {

        if(noiseField && !particles[i].open)particles[i].addNoiseField(5.);
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
        iso: iso,
        x:Math.random()*canvas.width,
        y:Math.random()*canvas.height,
        scale: scale
    });

}
function getDataV2(){

	init = true;

    document.getElementById('get_all').removeEventListener("click", getDataV2);
    $("#get_all").toggleClass('b_off b_on');
    $("#get_all").hide();

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
