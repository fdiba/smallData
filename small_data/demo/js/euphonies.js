//---- SMA
var canvas, context;

var records = [];
var scale = 1;
var animation01;

var running=true;
var numberOfNodesOnDisplayMax = 200;
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

    canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');

    canvas.width = 800*scale;
    canvas.height = 600*scale;

    context.fillStyle=COLORS[0];
    context.fillRect(0, 0, canvas.width, canvas.height); 
    context.stroke();
    
    retrieveEuphonies(3, 12);

    $(document).keypress(function(e) {

            // console.log(e.which);

        if(e.which == 32) { //space bar
            // running=!running;
            // console.log('node creation:', running);
        } else if(e.which == 112){ //'p'
            noiseField =!noiseField;
            console.log('noiseField:', noiseField);
        }
    });
    
    $("#sma_main_ctrl ul").append('<li>reset</li>');
    $("#sma_main_ctrl ul").append('<li>pause</li>');

    $("#sma_main_ctrl ul li:first").css("text-decoration", "underline").on("click", resetAll);
    $("#sma_main_ctrl ul li:last").css("text-decoration", "underline").on("click", pauseSMA);

};
function retrieveEuphonies(cat, numOfElements){

    $.ajax({                                      
        url: 'php/retrieve_cat.php',       
        type: "POST",
        data: {cat: cat}

    }).done(function(str) {

        var arr=str.split("|");

        for (var i = 0; i < arr.length; i+=numOfElements) {

            var tr_class = "even";
            if(i/numOfElements%2==0) tr_class = "odd";

            //--------- SMA
            var obj = {edition: arr[i], year:arr[i+1], price:arr[i+2], imeb_id:arr[i+3],
                        fn:arr[i+4], ln:arr[i+5], title:arr[i+6], duration:arr[i+7],
                        id:arr[i+8], 
                        cat:arr[i+9], sub_cat:arr[i+10], isni:arr[i+11]}; 

            records.push(obj);
            //---------

            //--------- TABLE
            $('#euphonies_table').append('<tr></tr>');
            var tr = $('#euphonies_table tr:last');
            tr.attr('class', tr_class);
            //---------

            for (var j = 0; j < numOfElements; j++) {

                var value = arr[i+j];
                if(j==numOfElements-1)value="<a target=\"_blank\" href=\"http://www.isni.org/isni/" + value + "\">"+ value +"</a>";

                if(j!=8){ //8 = temp id
                    tr.append('<td>'+ value + '</td>');
                }
            }

            //--------- data.bnf.fr : clicking a row retrieves the matching records
            var isni=arr[i+numOfElements-1];

            var ark = "https://data.bnf.fr/sparql?default-graph-uri=&query=PREFIX+foaf%3A+%3Chttp%3A%2F%2Fxmlns.com%2Ffoaf%2F0.1%2F%3E%0D%0APREFIX+rdarelationships%3A+%3Chttp%3A%2F%2Frdvocab.info%2FRDARelationshipsWEMI%2F%3E%0D%0APREFIX+owl%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%0D%0APREFIX+dcterms%3A+%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Fterms%2F%3E%0D%0APREFIX+bnf-onto%3A+%3Chttp%3A%2F%2Fdata.bnf.fr%2Fontology%2Fbnf-onto%2F%3E%0D%0APREFIX+isni%3A+%3Chttp%3A%2F%2Fisni.org%2Fontology%23%3E%0D%0ASELECT+DISTINCT+%3Fwork+%3FtitreOeuvre+%3FanneeOeuvre+%3Fedition+%3FtitreEdition+%3FdateEdition%0D%0AWHERE%0D%0A%7B%0D%0A++%0D%0A%3Fconcept+isni%3AidentifierValid+%22"
            + isni +
            "%22%3B%0D%0Afoaf%3Afocus+%3Fauteur.%0D%0A%3Fwork+dcterms%3Acreator+%3Fauteur+%3B%0D%0A++++dcterms%3Atitle+%3FtitreOeuvre+%3B++++%0D%0A++++bnf-onto%3AfirstYear+%3FanneeOeuvre+.%0D%0A%3Fedition+rdarelationships%3AworkManifested+%3Fwork+.%0D%0A%3Fedition+dcterms%3Atitle+%3FtitreEdition+%3B%0D%0A++++bnf-onto%3AfirstYear+%3FdateEdition+.%0D%0A%7D%0D%0A&format=text%2Fhtml&timeout=0&should-sponge=&debug=on";

            tr.css("cursor", "pointer").data("foo", ark).click(function(){

                var url = $(this).data("foo");

                $.post(url, function( data ) {

                  $('#bnfData').empty();
                  $('#bnfData').append(data);

                });
            });
        }

        $("#info").append("<p>" + arr.length/numOfElements + "</p>");

    });

    //--------- SMA
    animation01=setInterval(sma_animation, 1000/30);
    document.getElementById('myCanvas').addEventListener("click", getParticleInfos);
    //---------

}

$.urlParam = function(name){
	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	// return results[1] || 0;
	if(results)return results[1];
}


//--------------------- SMA

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

        edition: obj.edition,
        year: obj.year,
        price: obj.price,
        imeb_id: obj.imeb_id,
        fn: obj.fn,
        ln: obj.ln,
        title: obj.title,
        duration: obj.duration,
        cat: obj.cat,
        sub_cat: obj.sub_cat,
        isni: obj.isni,
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
