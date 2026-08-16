var canvas, context;

var records = [];
var scale = 1;
var animation01;

var running=true;
var smaPaused=false;
var MOTION_EASE = .06;
var numberOfNodesOnDisplayMax = 200;
var pointer001=0;
var particles=[];
var sl_attribute='';
var counter001=0;
var attributes_count=[];
var attr_treshold=150;
var activationSpeed=1;
var counter002 = 0;
var strength_noise_field=10;

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
var smaHoverCle = null;
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

function initSMA(w, h){

    canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');

    canvas.width = w*scale;
    canvas.height = h*scale;

    context.fillStyle=COLORS[0];
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.stroke();

    $(document).on('keydown', function(e){

        if(e.which !== 32) return;

        var cible = e.target;
        var nom = (cible && cible.nodeName) ? cible.nodeName.toLowerCase() : '';

        if(nom === 'input' || nom === 'textarea' || nom === 'select') return;
        if(cible && cible.isContentEditable) return;

        e.preventDefault();
        basculePause();
    });

    $("#sma_main_ctrl ul").append('<li>reset</li>');
    $("#sma_main_ctrl ul").append('<li>pause</li>');

    $("#sma_main_ctrl ul li:first").css("text-decoration", "underline").on("click", resetAll);
    $("#sma_main_ctrl ul li:last").css("text-decoration", "underline").on("click", pauseSMA);

    majBoites();

}

function startSMA(){
    animation01=setInterval(sma_animation, 1000/30);
    document.getElementById('myCanvas').addEventListener("click", getParticleInfos);
    document.getElementById('myCanvas').addEventListener("dblclick", closeParticleOnDblClick);
    document.getElementById('myCanvas').addEventListener("mousemove", suivrePointeur);
    document.getElementById('myCanvas').addEventListener("mouseleave", quitterPointeur);
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
    return SMA_HOVER && smaHoverIn && smaPaused;
}

function easerSurvol(o, cible){

    if(o.hoverAmp===undefined)o.hoverAmp=0;

    var pas = (cible>o.hoverAmp) ? HOVER_EASE_IN : HOVER_EASE_OUT;

    o.hoverAmp += (cible - o.hoverAmp)*pas;

    if(o.hoverAmp < .002)o.hoverAmp = 0;
    else if(o.hoverAmp > .998)o.hoverAmp = 1;
}

function cibleSurvol(){

    var res = {id:-1, enfant:null, parent:-1};

    if(!survolActif())return res;

    var phase2 = sl_attribute.localeCompare("")!==0;
    var best = 1e9;

    for (var i=0; i<particles.length; i++) {

        var p = particles[i];

        if(phase2 && p.open){

            for (var c=0; c<p.childs.length; c++) {

                var e = p.childs[c];
                var de = dist(smaHoverX, e.x, smaHoverY, e.y);

                if(de<=e.radius*2 + HOVER_REACH && de<best){
                    best=de; res.id=-1; res.enfant=e; res.parent=i;
                }
            }

            continue;
        }

        if(phase2 && p.records.length>1)continue;

        var d = dist(smaHoverX, p.x, smaHoverY, p.y);

        if(d<=p.radius*2 + HOVER_REACH && d<best){
            best=d; res.id=i; res.enfant=null; res.parent=-1;
        }
    }

    return res;
}

function majSurvol(){

    var cible = cibleSurvol();

    for (var j=0; j<particles.length; j++) {

        var q = particles[j];

        easerSurvol(q, (j===cible.id) ? 1 : 0);

        for (var k=0; k<q.childs.length; k++) {
            easerSurvol(q.childs[k], (q.childs[k]===cible.enfant) ? 1 : 0);
        }
    }

    smaHoverId = cible.id;

    var cle = null;

    if(cible.enfant){
        cle = 'c'+cible.enfant.id;
    } else if(cible.id>=0){
        var t = particles[cible.id];
        cle = (t.records.length===1) ? 'r'+t.records[0].id : 'g'+cible.id+'-'+t.records.length;
    }

    if(cle!==smaHoverCle)smaHoverAge = 0;
    else if(cle!==null)smaHoverAge++;

    smaHoverCle = cle;

    majCurseur();

    if(cle===null || smaHoverAge<HOVER_DWELL || cle===smaHoverKey)return;

    smaHoverKey = cle;

    if(cible.enfant){

        ecrireBoiteGroupe(cible.parent);
        removePreviousSelection();
        particles[cible.parent].getInfoFrom(cible.enfant);
        cible.enfant.lastNodeHovered = true;

        return;
    }

    var p = particles[cible.id];

    if(sl_attribute.localeCompare("")===0)ecrireBoiteCommuns(cible.id);
    else ecrireBoiteGroupe(cible.id);

    removePreviousSelection();

    if(p.records.length===1){
        p.getInfoFrom(p.records[0]);
    } else {
        setSelectionTextGN(p.records.length+' elements');
        $("#titles").empty();
    }
}

function majCurseur(){

    if(!canvas)return;

    var main = false;

    if(smaHoverIn){

        for (var m=0; m<particles.length; m++) {

            var g = particles[m];

            if(g.records.length<2)continue;

            if(dist(smaHoverX, g.x, smaHoverY, g.y) <= g.radius*2){ main = true; break; }
        }
    }

    canvas.style.cursor = main ? 'pointer' : '';
}

function ecrireBoiteGroupe(i){

    var attr = particles[i].targetedAttr;

    if(attr.localeCompare("")===0)attr = sl_attribute;
    if(attr.localeCompare("")===0)return;

    $("#cookies").empty().append('<p>');
    $("#cookies p").text(attr + ": " + particles[i][attr]);
}

function ecrireBoiteCommuns(id){

    if(typeof particles[id].attributsPartages !== 'function')return;

    var r = particles[id].attributsPartages(particles, id);

    var txt;

    if(r.liens===0){
        txt = 'no link yet';
    } else {
        txt = r.liens + (r.liens>1 ? ' links' : ' link');
        if(r.noms.length>0)txt += ' | shares: ' + r.noms.join(', ');
    }

    $("#cookies").empty().append('<p>');
    $("#cookies p").text(txt);
}

function closeParticleOnDblClick(evt){

    var cv = canvas.getBoundingClientRect();

    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    for (var i=0; i<particles.length; i++) {

        if(particles[i].open){

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

$.urlParam = function(name){
	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	if(results)return results[1];
}

function resetAll(){
    pointer001=0;
    particles=[];
    sl_attribute = "";
    attributes_count=[];
    $("#commons ul").empty();
    smaPaused=false;
    SMA_MOTION=1;
    smaHoverId=-1;
    smaHoverKey=null;
    smaHoverCle=null;
    smaHoverAge=0;
    $("#sma_main_ctrl ul li:last").text("pause");
    majBoites();

    clearIdentityBoxGN();
    $("#titles").empty();
}
function basculePause(){
    smaPaused = !smaPaused;
    smaHoverKey = null;
    smaHoverCle = null;
    smaHoverAge = 0;
    $("#sma_main_ctrl ul li:last").text(smaPaused ? "play" : "pause");
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
function majBoites(){
    $("#commons").css('display', $("#commons ul li").length === 0 ? 'none' : '');
    $("#calculations").css('display', $("#calculations ul li").length === 0 ? 'none' : '');
}

function getParticleInfos(evt){

    var cv = canvas.getBoundingClientRect();

    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    for (var i=0; i<particles.length; i++) {

        var distance=dist(mouseX, particles[i].x, mouseY, particles[i].y)
        if(distance<=particles[i].radius*2){

            if(sl_attribute.localeCompare("")===0)ecrireBoiteCommuns(i);
            else ecrireBoiteGroupe(i);

            var txt_2 = particles[i].records.length+' elements';

            if(particles[i].records.length>1){

                var child_targeted=false;
                if(particles[i].open){
                    child_targeted = particles[i].processChilds(mouseX, mouseY);
                }

                if(!child_targeted && !particles[i].opening && !particles[i].open){
                    particles[i].openOrCloseIt();
                    setSelectionTextGN(txt_2);
                    $("#titles").empty();
                    removePreviousSelection();
                }

            } else if(particles[i].records.length===1){

                particles[i].getInfoFrom(particles[i].records[0]);
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
            particles[i].childs[j].lastNodeHovered=false;
        }
    }
}
function shareInformation(){

    smaGridReady = false;

    for (var i=0; i<particles.length; i++) {

        particles[i].addNoiseField(strength_noise_field);

        var attributes = particles[i].SearchCommonsAttrAndGetAwayFrom(particles, i);

        var numOfCommonAttr = Object.keys(attributes).length;
        if(numOfCommonAttr>0)checkAttributes(attributes);

        if(particles[i].records.length===1)particles[i].separateFromLoners(i, particles);

        particles[i].checkEdgesV1();

        particles[i].updateBeforeMerging();

        particles[i].display();

    }

}
function checkAttributes(attributes){

    for (var i = 0; i < Object.getOwnPropertyNames(attributes).length; i++) {

        var attr_name = Object.getOwnPropertyNames(attributes)[i];
        var value = attributes[Object.getOwnPropertyNames(attributes)[i]];

        if(value>0){

            if(attributes_count.length<1){
                attributes_count.push({name:attr_name, count:parseInt(value)});
            } else {

                var hasBeenFound = false;

                for (var j = 0; j < attributes_count.length; j++) {

                    var obj = attributes_count[j];

                    if(attr_name.localeCompare(obj.name)===0){

                        obj.count += value;
                        hasBeenFound = true;
                        break;
                    }
                }

                if(!hasBeenFound){
                    attributes_count.push({name:attr_name, count:parseInt(value)});
                }
            }
        }
    }

    var str = "";
    $("#calculations ul").empty();

    for (var i = 0; i < attributes_count.length; i++) {
        var obj = attributes_count[i];

        if(obj.count>attr_treshold && obj.onMenu!==true){
            $("#commons ul").append("<li>" + obj.name + "</li>");
            $("#commons ul li:last").on("click", setCommonAttr).css("text-decoration", "underline");
            attributes_count[i].onMenu = true;
        } else if (obj.onMenu!==true){
            $("#calculations ul").append("<li>" + obj.name + " ("+ obj.count + ")</li>");
        }

    }

    majBoites();
}
function setCommonAttr(event){

    if(smaPaused) basculePause();

    var attr = event.target.innerText;

    $("#cookies").empty().append('<p>property: '+ attr + '</p>');

    clearIdentityBoxGN();
    $("#titles").empty();

    if(sl_attribute.localeCompare("")==0){
        $(event.target).css("font-weight", "bold");
        sl_attribute = attr;
    } else {
        $("#commons ul li").css("font-weight", "normal");
        $(event.target).css("font-weight", "bold");
        sl_attribute="";
        breakConnections();
        sl_attribute = attr;
    }

}
function breakConnections(){

    var arrayLength = particles.length;

    for (var i = 0; i < arrayLength; i++) {

        if(particles[i].records.length>1){

            for (var j=particles[i].records.length-1; j>0; j--) {
                particles.push(createNewParticle(particles[i].records.pop()));
            }

            particles[i].resetIt();
        }
    }

}
function sma_animation(){

    majMotion();

    if(pointer001<records.length && running && !smaPaused
        && particles.length<numberOfNodesOnDisplayMax){
        addParticleUsing(pointer001);
    }

    resetSMACanvas();

    majSurvol();

    if(sl_attribute.localeCompare("")==0){
        shareInformation();

    } else {

        if(!smaPaused && counter001%activationSpeed===0 && particles.length>0){
            var id = counter002%particles.length;
            particles[id].targetedAttr=sl_attribute;
            particles[id].on=true;
            counter002++;
        }

        allowGrouping();
    }

    if(running && !smaPaused)counter001++;

}
function allowGrouping(){

    buildSMAGrid();

    for (var i=0; i<particles.length; i++) {

        if(particles[i].records.length<1)continue;

        if(!particles[i].open)particles[i].addNoiseField(strength_noise_field*.5);
        particles[i].update(i, particles);
        particles[i].display();
    }
    removeDeadParticles();
}
function removeDeadParticles(){
    for (var i=particles.length-1; i>=0; i--) {
        if(particles[i].records.length<1){
            particles.splice(i, 1);
        }
    }
}
function addParticleUsing(i){

    particles.push(createNewParticle(records[i]));

    pointer001++;

    var txt=particles.length+' nodes '+ parseInt(pointer001 / records.length*100)+'%';
    $("#cookies").empty().append('<p>');
    $("#cookies p").text(txt);

}

function createNewParticle(obj){

    var params = {
        canvasId: "myCanvas",
        radius_to_add: 1.*scale,
        x:Math.random()*canvas.width,
        y:Math.random()*canvas.height,
        scale: scale
    };

    for (var key in obj) {
        if (obj.hasOwnProperty(key)) params[key] = obj[key];
    }

    return new Particle(params);
}

function resetSMACanvas(){
    context.fillStyle=COLORS[0];
    context.fillRect(0, 0, canvas.width, canvas.height);
}
