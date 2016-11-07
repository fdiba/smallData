var canvas, context;

var init=false;
var allData, cookies=[], composers, particles=[];

var animation01;
var counter001, pointer001;

var usingCookie=false;
var state=-999;
var running=false;

window.onload = function() {

	canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');

    document.getElementById('get_all').addEventListener("click", getDataV2);

    canvas.width = Math.max(800, $(document).width()-600);
    canvas.height = Math.max(600, $(document).height()-600);

    getDataV2();

    $(document).keypress(function(e) {

	    if(e.which == 32 && state>=0) { //space bar

	    	console.log('pause:', running);

	        /*if(running) clearInterval(animation01);
		    else animation01=setInterval(sma_animation, 1000/30);
		    */

		    running=!running;

	    }
	  
	    // console.log(e.which);

	});

}
function computeAll(){

	usingCookie=false;
	state=1;
	running=true;

	document.getElementById('get_sl').removeEventListener("click", computeTraces);
    document.getElementById('cp_all').removeEventListener("click", computeAll);

    $("#cp_all").toggleClass('b_off b_on');

    counter001=0;
    pointer001=0;
    composers=[];

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

	usingCookie=true;
	state=0;
	running=true;

    document.getElementById('get_sl').removeEventListener("click", computeTraces);
    document.getElementById('cp_all').removeEventListener("click", computeAll);

    $("#get_sl").toggleClass('b_off b_on');

    /*var txt=$.cookie('ids');
    $("#selection").empty().append('<p>');
    $("#selection p").text(txt);*/

    cookies = $.cookie('ids').split('%');

    counter001=0;
    pointer001=0;
    composers=[];

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

                if(!child_targeted)particles[i].openOrCloseIt();
            
            } else if(particles[i].ids.length===1){
                particles[i].getTitlesFrom(particles[i].ids[0]);
            }
            
            break;
        }
    }
}
function addParticleUsing(i){

    var index=0;
    while(composers[i].id!=allData[index])index+=5;

    //use artist_id, country name and counter as arguments
    if(usingCookie)particles.push(createNewParticle(composers[i].id, allData[index+1], composers[i].count, 1));
    else particles.push(createNewParticle(composers[i].id, allData[index+1], composers[i].count, .2));

    pointer001++;

    var txt=particles.length+' countries '+pointer001+'/'+composers.length+' composers';
    $("#cookies").empty().append('<p>');
    $("#cookies p").text(txt);

}
function sma_animation(){

    if(counter001%10===0 && pointer001<composers.length && running)addParticleUsing(pointer001);

    resetSMACanvas();
    
    for (var i=0; i<particles.length; i++) {
        particles[i].update();
        particles[i].checkEdges();
        
        particles[i].display();

        particles[i].getAwayOrCloserFrom(i, particles);
    }

    removeDeadParticles();

    if(running)counter001++;

}
function removeDeadParticles(){
    
    for (var i=particles.length-1; i>=0; i--) {
        if(particles[i].ids.length<1){
            // console.log("particles.length: ", particles.length);
            particles.splice(i, 1);
            // console.log("particles.length: ", particles.length);
        }
    }
}
function resetSMACanvas(){
    context.fillStyle=COLORS[0];
    context.fillRect(0, 0, canvas.width, canvas.height);
}
function createNewParticle(id, ctry, count, addRadiusVal){

    //800 600
    var radius=150;

    return new Particle({
        canvasId: "myCanvas",
        count: count,
        addRadiusVal: addRadiusVal,
        id: id,
        label: ctry,
        x:canvas.width/2-radius+Math.random()*(radius*2),
        y:canvas.height/2-radius+Math.random()*(radius*2)
    });
}
function getDataV2(){

	init = true;
    
    document.getElementById('get_all').removeEventListener("click", getDataV2);
    $("#get_all").toggleClass('b_off b_on');

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

        var txt = "<p>no selection</p>";

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