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
 
window.onload = function() {

	canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');

    document.getElementById('get_all').addEventListener("click", getDataV2);

    canvas.width = 1200*scale;
    canvas.height = 800*scale;

    getDataV2();

    $(document).keypress(function(e) {

        console.log(e.which);

        if(state>=0){

            if(e.which == 32) { //space bar
                console.log('pause:', running);
                running=!running;
            }
        }

        if (e.which == 112) { //p
            console.log('noiseField:', noiseField);
            noiseField=!noiseField;
        }

	});

    $("#sma_main_ctrl ul").append('<li>pause</li>');
    $("#sma_main_ctrl ul li:last").css("text-decoration", "underline").on("click", pauseSMA);

}
function pauseSMA(event){
    noiseField =!noiseField;
    // console.log(event.target);
    if(noiseField) $(event.target).text("pause");
    else $(event.target).text("play");
}
//remet la simulation a zero : appele a chaque clic sur compute all
//ou compute traces, pour pouvoir relancer l'un apres l'autre a volonte
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

    /*var id=allData[i];
    var ctry=allData[i+1];
    var ctry_id=allData[i+2];
    var counter=allData[i+3];
    var editions=allData[i+4];*/

    for (var i=0; i<allData.length-4; i+=5)composers.push({id:allData[i], count:allData[i+3]});

    if(composers.length>0){
        animation01=setInterval(sma_animation, 1000/30);
        document.getElementById('myCanvas').addEventListener("click", getParticleInfos);
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
            // console.log(txt);
            $("#cookies").empty().append('<p>');
            $("#cookies p").text(txt);

            if(particles[i].ids.length>1){

                var child_targeted=false;
                if(particles[i].open){
                    child_targeted = particles[i].processChilds(mouseX, mouseY);
                }

                if(!child_targeted && !particles[i].opening){
                    particles[i].openOrCloseIt();
                    if(!particles[i].open)$("#cookies").empty().append('<p>'+ particles.length + ' nodes</p>');
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
    while(composers[i].id!=allData[index])index+=5;

    //use artist_id, country name, counter, radius to add as arguments
    if(usingCookie){
        particles.push(createNewParticle(composers[i].id, allData[index+1], composers[i].count, 1));
    } else {
        particles.push(createNewParticle(composers[i].id, allData[index+1], composers[i].count, .15));
    }

    pointer001++;

    var txt=particles.length+' nodes '+ parseInt(pointer001 / composers.length*100)+'%';
    $("#cookies").empty().append('<p>');
    $("#cookies p").text(txt);

}
function sma_animation(){

    //add progressively particles
    if(pointer001<composers.length && running
        && particles.length<numberOfNodesOnDisplayMax && noiseField){
        addParticleUsing(pointer001);
    }

    resetSMACanvas();

    //first state --> nodes are sharing information
    if(sl_attribute.localeCompare("")==0){
        shareInformation();
    //second state --> nodes are regrouping
    } else {

        if(state===0){ //traces

            particles[counter002%particles.length].on = true;
            counter002++;
 
        } else if(state===1){ //compute all

            //activate progressively particles
            if(counter001%activationSpeed===0 && particles.length>0){
                //console.log(particles.length, " ",counter002%particles.length);
                particles[counter002%particles.length].on = true;
                counter002++;
            }
        }

        allowGrouping();
    }

    if(running)counter001++;
}
function shareInformation(){

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

    //console.log("check it");

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

    var str = "";
    if(main_attributes[0].count>attr_treshold){
        str = main_attributes[0].name;
        $("#commons p").html('Group by: <u>' + str + '</u>').on("click", setCommonAttr).css("cursor", "pointer"); 
    } else {
        str = main_attributes[0].name + ' ' + main_attributes[0].count;
        $("#commons p").html('Group by: ' + str);
    }
}
function setCommonAttr(){
    sl_attribute = main_attributes[0].name;
    $("#commons p" ).off("click").css("cursor", "default");
    $("#commons p u").contents().unwrap();  
}
function allowGrouping(){

    for (var i=0; i<particles.length; i++) {

        //une particule ouverte (jaune) n'est plus agitee par le champ de bruit
        if(noiseField && !particles[i].open)particles[i].addNoiseField(2.);
        particles[i].update(i, particles);
        particles[i].display();

    }
    removeDeadParticles();
}
function removeDeadParticles(){    
    for (var i=particles.length-1; i>=0; i--) {
        if(particles[i].ids.length<1){
            particles.splice(i, 1);
            // console.log("particles.length: ", particles.length);
        }
    }
}
function resetSMACanvas(){
	// context.fillStyle="white";
    context.fillStyle=COLORS[0];
    context.fillRect(0, 0, canvas.width, canvas.height);
}
function createNewParticle(id, ctry, count, addRadiusVal){

    //800 600
    
    return new Particle({
        canvasId: "myCanvas",
        count: count,
        addRadiusVal: addRadiusVal*scale,
        id: id,
        label: ctry,
        x:Math.random()*canvas.width,
        y:Math.random()*canvas.height,
        scale: scale
    });

    /*x:canvas.width/2-radius+Math.random()*(radius*2),
    y:canvas.height/2-radius+Math.random()*(radius*2),*/
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

        // console.log(str);

        allData = str.split("%");

        //TO DEBUG AND CATCH ERROR
        // console.log(allData[0]);

        /*var id=allData[i];
        var ctry=allData[i+1];
        var ctry_id=allData[i+2];
        var counter=allData[i+3];
        var editions=allData[i+4];*/

        for (var i=0; i<allData.length-4; i+=5) {
            if(ENGLISH)allData[i+1]=checkCountry(allData[i+1]);
        }

        var txt = "";

        var num = allData.length / 5;
        var txt2 = "allData: " + num;

        $("#selection").empty();
        $("#selection").append(txt);
        
        $("#info p:eq(0)").text(txt2);

        context.fillStyle=COLORS[0];
        context.fillRect(0, 0, canvas.width, canvas.height); 
        context.stroke();

        /*document.getElementById('anim').addEventListener("click", animation1) ;
        canvas.addEventListener("mousedown", getInfo, false);*/

        document.getElementById('get_sl').addEventListener("click", computeTraces);
        document.getElementById('cp_all').addEventListener("click", computeAll);
        //computeTraces();

    });
}