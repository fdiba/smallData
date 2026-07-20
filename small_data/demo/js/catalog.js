//---- SMA
var canvas, context;

var records = [];
var scale = 1;
var animation01;

var running=true;
var numberOfNodesOnDisplayMax = 400;
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

window.onload = function() {

	var cat = $.urlParam('id');

	if(cat==1 || cat==2)retrieveData(cat, 7);
	else retrieveData(-999, 7);

    if(cat==2){

        canvas = document.getElementById('myCanvas');
        context = canvas.getContext('2d');

        canvas.width = 1200*scale;
        canvas.height = 800*scale;

        context.fillStyle=COLORS[0];
        context.fillRect(0, 0, canvas.width, canvas.height); 
        context.stroke();

        $(document).keypress(function(e) {

            // console.log(e.which);

            if(e.which == 32) { //space bar
                // running=!running;
                // console.log('node creation:', running);
            } else if(e.which == 112){
                noiseField =!noiseField;
                console.log('noiseField:', noiseField);
            }
        });
        
        $("#sma_main_ctrl ul").append('<li>reset</li>');
        $("#sma_main_ctrl ul").append('<li>pause</li>');

        $("#sma_main_ctrl ul li:first").css("text-decoration", "underline").on("click", resetAll);
        $("#sma_main_ctrl ul li:last").css("text-decoration", "underline").on("click", pauseSMA);
        
    } else if(cat==1){
        $("#myCanvas").hide();
        $("#infos").hide();
        $("#sma_main_ctrl").hide();
        $("#sma_menu").hide();
    }    

};
function resetAll(){
    // console.log("woot");
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
    // console.log(event.target);
    if(noiseField) $(event.target).text("pause");
    else $(event.target).text("play");
}
function retrieveData(cat, numOfElements){

    var CHUNK = 200;   // nombre de lignes inserees par lot

    $("#info").append('<p id="loading">loading\u2026</p>');

    $.ajax({
        url: 'php/retrieve_cat.php',
        type: "POST",
        data: {cat: cat}

    }).done(function(str) {

        var arr = str.split("%");
        var total = Math.floor(arr.length / numOfElements);

        $("#listing").append('<ul></ul>');

        var table = document.getElementById('works_table');
        var i = 0;

        // Affichage par lots : le tableau se remplit progressivement
        // et le navigateur reste reactif entre deux lots.
        function renderChunk(){

            var html = "";
            var stop = Math.min(i + CHUNK * numOfElements, arr.length);

            for (; i < stop; i += numOfElements) {

                //--------- SMA (inchange)
                if(cat == 2){
                    records.push({imeb_id: arr[i], fn: arr[i+1], ln: arr[i+2],
                                  id: arr[i+6],
                                  title: arr[i+4], duration: arr[i+5]});
                }
                //---------

                html += (i / numOfElements % 2 === 0) ? '<tr class="odd">' : '<tr class="even">';

                for (var j = 0; j < numOfElements; j++) {
                    if(j != 3 && j != 6){   // 3 = artist_id, 6 = work_id
                        html += '<td>' + arr[i+j] + '</td>';
                    }
                }
                html += '</tr>';
            }

            // Une seule insertion par lot au lieu de deux par ligne
            table.insertAdjacentHTML('beforeend', html);

            $("#loading").text(Math.min(Math.floor(i / numOfElements), total)
                               + " / " + total);

            if(i < arr.length){
                setTimeout(renderChunk, 0);
            } else {
                $("#loading").remove();
                if(cat != null){
                    $("#info").append("<p>" + total + " (provisionnal count)</p>");
                } else {
                    $("#info").append("<p>" + total + "</p>");
                }
            }
        }

        renderChunk();

    }).fail(function(){
        $("#loading").text("loading failed");
    });

    //--------- SMA
    if(cat==2){
        animation01=setInterval(sma_animation, 1000/30);
        document.getElementById('myCanvas').addEventListener("click", getParticleInfos);
    }
    //---------

}


$.urlParam = function(name){
	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	// return results[1] || 0;
	if(results)return results[1];
}

//--------------------- SMA

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
            // console.log(txt);
            $("#cookies").empty().append('<p>' + txt + '</p>');

            var txt_2 = particles[i].records.length+' elements';

            $("#selection").empty().append('<p>');
            $("#selection p").text(txt_2);

            if(particles[i].records.length>1){

                var child_targeted=false;
                if(particles[i].open){
                    child_targeted = particles[i].processChilds(mouseX, mouseY);
                }

                if(!child_targeted && !particles[i].opening){
                    particles[i].openOrCloseIt();
                    if(!particles[i].open)$("#cookies").append('<p>'+ particles.length + ' nodes</p>');
                    $("#titles").empty();
                    removePreviousSelection();
                }
            
            } else if(particles[i].records.length===1){
                particles[i].getInfoFrom(particles[i].records[0]);
                removePreviousSelection();
                particles[i].lastNodeSelected=true; //xoxo
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
function shareInformation(){

    for (var i=0; i<particles.length; i++) {

        if(noiseField){
            particles[i].addNoiseField(strength_noise_field);

            var attributes = particles[i].SearchCommonsAttrAndGetAwayFrom(particles, i);

            var numOfCommonAttr = Object.keys(attributes).length;
            if(numOfCommonAttr>0)checkAttributes(attributes);
        }

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

            // console.log(attr_name, " ", value);

            if(attributes_count.length<1){
                attributes_count.push({name:attr_name, count:parseInt(value)});
                // console.log(attributes_count[0].name, " ", attributes_count[0].count);
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

    // console.log(attributes_count.length);

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
function breakConnections(){ //xoxo

    // console.log("count before break:", particles.length);

    var arrayLength = particles.length;

    for (var i = 0; i < arrayLength; i++) {

        if(particles[i].records.length>1){

            for (var j=particles[i].records.length-1; j>0; j--) {
                particles.push(createNewParticle(particles[i].records.pop()));                
            }
            
            particles[i].resetIt();
        }
    }

    // console.log("count after break:", particles.length);
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
            //console.log(particles.length, " ", counter002%particles.length);
            var id = counter002%particles.length;
            particles[id].targetedAttr=sl_attribute;
            // console.log("choice:", particles[id].targetedAttr);
            particles[id].on=true;
            counter002++;
        }

        allowGrouping();
    }

    // console.log(particles.length);

    if(running)counter001++;

}
function allowGrouping(){

    // if (strength_noise_field>6)strength_noise_field-=.1;

    for (var i=0; i<particles.length; i++) {
        if(noiseField)particles[i].addNoiseField(strength_noise_field);
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

    return new Particle({
        canvasId: "myCanvas",

        // edition: obj.edition,
        // year: obj.year,
        // price: obj.price,
        imeb_id: obj.imeb_id,
        fn: obj.fn,
        ln: obj.ln,
        title: obj.title,
        duration: obj.duration,
        // cat: obj.cat,
        // sub_cat: obj.sub_cat,
        // isni: obj.isni,
        id:obj.id,

        radius_to_add: 1.*scale,
        x:Math.random()*canvas.width,
        y:Math.random()*canvas.height,
        scale: scale
    });
}

function resetSMACanvas(){
    // context.fillStyle="white";
    context.fillStyle=COLORS[0];
    context.fillRect(0, 0, canvas.width, canvas.height);
}
