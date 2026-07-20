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

    canvas.width = 1064*scale;
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

    $.ajax({                                      
        url: 'php/retrieve_works.php',       
        type: "POST"
        //,
        //data: {cat: $cat}

    }).done(function(str) {

        var arr=str.split("%");

        $("#listing").append('<ul></ul>');

        var objects=[];
        var numOfElements = 10;

        for (var i = 0; i < arr.length-(numOfElements-1); i+=numOfElements) {

            var year = arr[i];
            var rank = arr[i+1];
            var cat = arr[i+8];
            var cat2 = arr[i+9];

            if(rank==100)rank="Mention";
            else if(rank==101)rank="Mention 1";
            else if(rank==102)rank="Mention 2";
            else if(rank==103)rank="Mention 3";
            else if(rank==197)rank="Nominé";
            else if(rank==198)rank="Finaliste";
            else if(rank==199)rank="Prix";
            else if(rank==200)rank="Prix CNM";
            else if(rank==201)rank="Grand Prix";
            
            else if(rank==296)rank="Pierre d'Or";
            else if(rank==297)rank="Pierre d'Argent";


            else if(rank==298)rank="Prix Bregman";
            else if(rank==299)rank="Prix FNME";
            else if(rank==300)rank="Prix CIME";
            // else if(rank==301)rank="1, Prix CIME et Euphonies";
            else if(rank==302)rank="1 et Prix CIME";
            else if(rank==303)rank="Prix CIME et Mention";
            else if(rank==304)rank="Prix CIME et Mention 1";
            else if(rank==500)rank="Magistère";
            else if(rank==600)rank="Résidence";


            if(cat2==1)cat2="Dispositif et instru.";
            else if(cat2==2)cat2="Esthétique formelle";
            else if(cat2==3)cat2="Esthétique program.";
            else if(cat2==4)cat2="Danse ou théâtre";
            else if(cat2==5)cat2="Installation ou environ.";
            else if(cat2==6)cat2="Multimédia";

            else if(cat2==7)cat2="Art sonore électroa.";
            else if(cat2==8)cat2="Avec instruments";
            else if(cat2==9)cat2="Sans instruments";

            else if(cat2==10)cat2="tendance netart";
            else if(cat2==11)cat2="tendance création";
            else if(cat2==12)cat2="tendance performance";
            
            
            // console.log(arr[i+7]);
            
            var obj = {year:year, rank:rank, rank_code:arr[i+1], misam:arr[i+2],
                        fn: arr[i+3], name: arr[i+4], title:arr[i+5], cat:cat, cat2:cat2,
                        cat2_code:arr[i+9],
                        duration:arr[i+6], 
                        id:arr[i+7]};

            objects.push(obj);

        }

        // Tri : edition (recente d'abord) > category > sub category > price > last name
        function cmpValues(a, b){
            if(a===undefined || a===null || a==='') a='';
            if(b===undefined || b===null || b==='') b='';
            var na = parseFloat(a), nb = parseFloat(b);
            if(!isNaN(na) && !isNaN(nb)) return na - nb;
            return String(a).localeCompare(String(b), 'fr', {sensitivity: 'base'});
        }

        objects.sort(function(a, b){
            return cmpValues(b.year, a.year)
                || cmpValues(a.cat, b.cat)
                || cmpValues(a.cat2_code, b.cat2_code)
                || cmpValues(a.rank_code, b.rank_code)
                || cmpValues(a.name, b.name);
        });

        for (var j = 0; j < objects.length; j++) {

            //--------- SMA
            var obj = {edition: objects[j].year, cat:objects[j].cat, sub_cat:objects[j].cat2,
                        price:objects[j].rank,
                        imeb_id:objects[j].misam, fn:objects[j].fn, ln:objects[j].name,
                        title:objects[j].title,
                        duration:objects[j].duration,
                        id:objects[j].id}; 

            records.push(obj);
            //---------

            //--------- TABLE
            $('#works_table').append('<tr></tr>');
            var tr = $('#works_table tr:last');
            var tds = '<td>'+ objects[j].year + '</td>' + '<td>'+ objects[j].cat + '</td>'
            + '<td>'+ objects[j].cat2 + '</td>' + '<td>'+ objects[j].rank + '</td>'
            + '<td>'+ objects[j].misam + '</td>' + '<td>'+ objects[j].fn + '</td>'
            + '<td>'+ objects[j].name + '</td>' + '<td>'+ objects[j].title + '</td>';
            tr.append(tds);
            //---------

            /*var li_class = "class=\"even\"";
            if(j%2==0) li_class = "class=\"odd\"";

            var new_element = "<li " + li_class + " >" + objects[j].year
            + " " + objects[j].cat + " " + objects[j].cat2
            + " " + objects[j].rank + " " + objects[j].misam
            + " " + objects[j].fn + " " + objects[j].name + " " + objects[j].title + "</li>";

            $("#listing ul").append(new_element);*/
        }

        $("#info").append("<p>" + arr.length/numOfElements + "</p>");

    });

    //--------- SMA
    animation01=setInterval(sma_animation, 1000/30);
    document.getElementById('myCanvas').addEventListener("click", getParticleInfos);
    //---------

	
};

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

function createNewParticle(obj){ //SMA

    return new Particle({
        canvasId: "myCanvas",

        edition: obj.edition,
        // year: obj.year,
        price: obj.price,
        imeb_id: obj.imeb_id,
        fn: obj.fn,
        ln: obj.ln,
        title: obj.title,
        duration: obj.duration,
        cat: obj.cat,
        sub_cat: obj.sub_cat,
        // isni: obj.isni,
        id:obj.id,

        radius_to_add: .4*scale,
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
