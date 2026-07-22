//------------------------------------------------------------------
// sma_core.js — noyau partage du systeme multi-agents (SMA)
// Charge par euphonies.php, catalog.php et award-winning_works.php,
// avant childs_*.js, particles_*.js et le script propre a la page.
//------------------------------------------------------------------

//---- etat partage
var canvas, context;

var records = [];
var scale = 1;
var animation01;

var running=true;
var numberOfNodesOnDisplayMax = 200; //les pages peuvent surcharger cette valeur
var pointer001=0;
var particles=[];
var sl_attribute='';
var counter001=0;
var noiseField=true;
var attributes_count=[];
var attr_treshold=150;
var activationSpeed=1;
var counter002 = 0;
var strength_noise_field=10;
//-----------

//prepare le canvas et les controles communs (menu reset/pause, touche 'p')
function initSMA(w, h){

    canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');

    canvas.width = w*scale;
    canvas.height = h*scale;

    context.fillStyle=COLORS[0];
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.stroke();

    $(document).keypress(function(e) {

        if(e.which == 32) { //space bar
            // running=!running;
        } else if(e.which == 112){ //'p'
            noiseField =!noiseField;
            console.log('noiseField:', noiseField);
        }
    });

    $("#sma_main_ctrl ul").append('<li>reset</li>');
    $("#sma_main_ctrl ul").append('<li>pause</li>');

    $("#sma_main_ctrl ul li:first").css("text-decoration", "underline").on("click", resetAll);
    $("#sma_main_ctrl ul li:last").css("text-decoration", "underline").on("click", pauseSMA);

}

//lance la boucle d'animation et l'interaction au clic sur le canvas
function startSMA(){
    animation01=setInterval(sma_animation, 1000/30);
    document.getElementById('myCanvas').addEventListener("click", getParticleInfos);
    document.getElementById('myCanvas').addEventListener("dblclick", closeParticleOnDblClick);
}

//fermeture au double-clic : referme le cercle ouvert vise
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
    noiseField=true;
    $("#sma_main_ctrl ul li:last").text("pause");
    $("#selection").empty();
    $("#titles").empty();
}
function pauseSMA(event){
    noiseField =!noiseField;
    if(noiseField) $(event.target).text("pause");
    else $(event.target).text("play");
}

function getParticleInfos(evt){

    var cv = canvas.getBoundingClientRect();

    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    for (var i=0; i<particles.length; i++) {

        var distance=dist(mouseX, particles[i].x, mouseY, particles[i].y)
        if(distance<=particles[i].radius*2){

            var attrName = particles[i].targetedAttr;

            if(attrName.localeCompare("")===0)attrName="property";

            var txt= attrName + ": " + particles[i][particles[i].targetedAttr];
            $("#cookies").empty().append('<p>' + txt + '</p>');

            var txt_2 = particles[i].records.length+' elements';

            $("#selection").empty().append('<p>');
            $("#selection p").text(txt_2);

            if(particles[i].records.length>1){

                var child_targeted=false;
                if(particles[i].open){
                    child_targeted = particles[i].processChilds(mouseX, mouseY);
                }

                //le simple clic ouvre ; la fermeture se fait au double-clic
                if(!child_targeted && !particles[i].opening && !particles[i].open){
                    particles[i].openOrCloseIt();
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
        }
    }
}
function shareInformation(){

    for (var i=0; i<particles.length; i++) {

        if(noiseField){
            particles[i].addNoiseField(strength_noise_field);

            var attributes = particles[i].SearchCommonsAttrAndGetAwayFrom(particles, i);

            var numOfCommonAttr = Object.keys(attributes).length;
            if(numOfCommonAttr>0)checkAttributes(attributes);

        }

        //les gris se separent aussi en PHASE 1 (meme logique qu'en phase 2),
        //sinon ils restent agglutines tant qu'aucun groupement n'est choisi.
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

}
function setCommonAttr(event){

    var attr = event.target.innerText;

    $("#cookies").empty().append('<p>property: '+ attr + '</p>');
    $("#selection").empty();
    $("#titles").empty();

    if(sl_attribute.localeCompare("")==0){ //first choice
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

    //add progressively particles
    if(pointer001<records.length && running
        && particles.length<numberOfNodesOnDisplayMax && noiseField){
        addParticleUsing(pointer001);
    }

    resetSMACanvas();

    //first state --> nodes are sharing information
    if(sl_attribute.localeCompare("")==0){
        shareInformation();
    //second state --> nodes are regrouping
    } else {

        //activate progressively particles
        if(counter001%activationSpeed===0 && particles.length>0){
            var id = counter002%particles.length;
            particles[id].targetedAttr=sl_attribute;
            particles[id].on=true;
            counter002++;
        }

        allowGrouping();
    }

    if(running)counter001++;

}
function allowGrouping(){

    for (var i=0; i<particles.length; i++) {
        //une particule ouverte (jaune) n'est plus agitee par le champ de bruit :
        //elle se stabilise pour qu'on puisse cliquer sur ses membres.
        //en phase de regroupement, l'agitation est reduite de moitie : les gris
        //sans partenaire derivent au lieu de s'agiter
        if(noiseField && !particles[i].open)particles[i].addNoiseField(strength_noise_field*.5);
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

//cree une particule a partir d'un enregistrement :
//toutes les proprietes de l'enregistrement sont copiees telles quelles
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
