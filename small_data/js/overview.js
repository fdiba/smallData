var init=false;
var allData;
var numComposersInCapsules;

var cookies=[];

var canvas, context;
var rectangles=[];
var titles=[];

var xRightOffset;

var nAId;
var avg_sat, max_sat, min_sat;
var avg_lum=50, max_lum=90, min_lum=20;

var tNoise;

//-------
var xPos, yPos;
var xDist, yDist;

var minHeight;

var rWidth, rHeight;

var xLeftOffset;
var pAId;

var h_colors=["#ecf0f1"];//grey clouds
var colors=[{h:203, s:4, l:77}]; //#bdc3c7 grey silver

///------
var isAnimated;
var animation2;

var maxWidth;

//---------- sma -------------//
var cv_sma, ctx_sma;
var particles=[];
var animation01;

var count002=0;

//---------- query results -------------//
var composers=[];
var newResults=false;

window.onload = function() {

	//------------ navigation ------------//

	isAnimated = false;
	max_sat = 50;
	avg_sat = max_sat;
	min_sat = 0;
	tNoise = 0;    

    canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');

    //----------------------------------//

    //hide animation
    $('#anim').hide();
 
    //----------------------------------//

    cv_sma = document.getElementById('sma');
    cv_sma.width=350;
    ctx_sma = cv_sma.getContext('2d');
    resetSMACanvas();

    //----------------------------------//

    document.getElementById('get_all').addEventListener("click", getData);

    //----------------------------------//

    document.getElementById('searchBoxBtn').addEventListener("click", getSearchTerms);

    //----------------------------------//

    document.getElementById('filtersBtn').addEventListener("click", filterData);

    //----------------------------------//

    pAId=-1;
    xLeftOffset = 0;
    xDist = 11, yDist = 11;
    rWidth = 10, rHeight = 10;

    //-------- print -------//
    /*xDist = 33, yDist = 33;
    rWidth = 30, rHeight = 30;*/

    resetPositions();

    maxWidth=$(document).width()-(500+25); //context left pad = 10;
    canvas.width = maxWidth;
    minHeight = 300;
    canvas.height = minHeight;


    context.fillStyle=h_colors[0];
    context.fillRect(0, 0, canvas.width, canvas.height);

    xRightOffset = 10;

    $("#titles").css({"clear": "both"});

    setTimeout(getData(), 5000);
    
    //getData();

}
function drawRect(x, y, c){
    context.fillStyle=c;
    context.fillRect(x, y, rWidth, rHeight); 
}
function animation1(evt){
	if(isAnimated){
		clearInterval(animation2);
		resetSaturation(avg_sat);
	} else animation2 = setInterval(noise_animation, 1000/10);

	isAnimated = !isAnimated;

    $("#anim").toggleClass('b_off b_on');

}
function resetSaturationForAllRects(){

    for(var i=0; i<rectangles.length; i++){
        drawRect(rectangles[i].x, rectangles[i].y, rectangles[i].color);
    } 

}
function resetSaturation(sat){

	for(var i=0; i<rectangles.length; i++){
		
		if(!rectangles[i].anchor && rectangles[i].id != nAId){

			var str = rectangles[i].color;

			var pos0 = str.indexOf(",")+1;
			var pos1 = str.indexOf("%");
			
			var c = str.substring(0, pos0);

            var lum;
            if(rectangles[i].count>0)lum=avg_lum;
            else lum=max_lum;

			c += sat+'%,'+lum+'%)';

			rectangles[i].color = c;

			drawRect(rectangles[i].x, rectangles[i].y, rectangles[i].color);
		}
	} 
}
//---------------------------------------//

function calculateMinHeightAndCreateRectangles(step, threshold){

    for (var i=0; i<allData.length-4; i+=5) {

        //---------- get data ----------//
        var id = allData[i];
        var editions = allData[i+4].split(",");
        var ctry=allData[i+1];
        // var cId=allData[i+2];
        var count=allData[i+3]; //number of compositions avalaible

        //------- set color luminosity ---------//
        var lum;
        if(count>0) lum=colors[0].l;
        else lum=max_lum;

        var color='hsl('+colors[0].h+','+colors[0].s+'%,'+lum+'%)';

        //------- create rectangles ---------//

        if(step===0){
            createNewRectangle(id, color, count, true);
            createEditionsRectangles(id, count, editions);
        } else if(step===1){
            if(count>=threshold){
                createNewRectangle(id, color, count, true);
                createEditionsRectangles(id, count, editions);
            }
        }
    }
}
function createEditionsRectangles(id, count, editions){

    if(editions.length>0){
        for(var j=0; j<editions.length; j++){
            var coef = 310/(2009-1973);
            var numEdition = editions[j] - 1973;
            numEdition *= coef; //0=>255 not 360

            var lum;
            if(count>0) lum=avg_lum;
            else lum=max_lum;

            var c='hsl('+numEdition+','+avg_sat+'%,'+lum+'%)';
            createNewRectangle(id, c, count, false);
            
        }
    } else {
        console.log("error: no edition");
    }
} 
function createNewRectangle(aId, c, count, anchor){

    if( xPos>canvas.width-xRightOffset){

        //use to resize canvas width
        maxWidth = canvas.width-xRightOffset+1;

        xPos = xLeftOffset;
        yPos += yDist;
    }

    if(yPos+yDist>minHeight) minHeight+=yDist;

    rectangles.push({id:aId, x: xPos, y:yPos, color:c, count:count, anchor:anchor});
    xPos += xDist;

}
function processAllRectWhithId(artist_id){

    var firstOne = false;

    for(var i=0; i<rectangles.length; i++){

        if(rectangles[i].id==artist_id){
            if(firstOne) {

                var str = rectangles[i].color;

                var pos0 = str.indexOf(",")+1;

                str = str.substring(0, pos0);
                str += "100%,50%)";

                // console.log(rectangles[i].color, str);

                drawRect(rectangles[i].x, rectangles[i].y, str);
                
            } else {

                drawRect(rectangles[i].x, rectangles[i].y, "white");
                firstOne = true;
                
            }
        }
    }
}
function resetAllRectWhithId(artist_id){
    for(var i=0; i<rectangles.length; i++){
        if(rectangles[i].id==artist_id)drawRect(rectangles[i].x, rectangles[i].y, rectangles[i].color);
    }
}
function selectRect(x, y){

    for(var i=0; i<rectangles.length; i++){
        
        //TODO use var
        if(x>=rectangles[i].x && x<=rectangles[i].x+rWidth &&
           y>=rectangles[i].y && y<=rectangles[i].y+rHeight) {

            if(pAId>=0){
                resetAllRectWhithId(pAId);
            }

            if(rectangles[i].id != pAId){

                nAId = rectangles[i].id;
                count002=rectangles[i].count;

                processAllRectWhithId(nAId);
                
                //-------- first query

                $.ajax({                                      
                    url: 'php/retrieve_data.php',       
                    type: "POST",
                    data: {aId: nAId, case:5} 
                }).done(function(str) {

                    var arr=str.split("%");
                    var ctry=checkCountry(arr[2]);
                    var txt=arr[0]+' '+arr[1]+' '+ctry+' '+arr[3];

                    $("#selection p").text(txt);

                    //------- cookie stuff

                    var is_new=true;

                    if(cookies.length>0){

                        for (var i=0; i<cookies.length; i++) {
                            if(cookies[i].id===nAId){
                                // console.log('already in');
                                is_new=false;
                                break;
                            }
                        }
                    }

                    if(is_new){

                        cookies.push({id:nAId, count:count002});

                        var str="";

                        for (var i = 0; i < cookies.length; i++) {
                            if(i>0)str+='%';
                            str+=cookies[i].id+'%'+cookies[i].count;
                        }

                        $.cookie('ids', str);
                        
                        particles.push(createNewParticle(nAId, ctry, count002));

                        if(particles.length===1){
                            animation01=setInterval(sma_animation, 1000/30);
                            document.getElementById('sma').addEventListener("click", getParticleInfos);
                        }

                        //read cookies
                        // var txt=$.cookie('ids');
                        // console.log(txt);

                        var txt = particles.length+' countries and '+cookies.length+' composers';
                        $("#cookies").empty().append('<p>');
                        $("#cookies p").text(txt);

                    }
                });

                
                //-------- second query
                $.ajax({                                      
                    url: 'php/retrieve_data.php',       
                    type: "POST",
                    data: { aId: nAId, case:1 } 
                }).done(function(str) {

                    var arr=str.split("%");
                    titles=[];

                    for (var i=0; i<arr.length-4; i+=5) {
                        titles.push({id:arr[i], t:arr[i+1], d:arr[i+2], m:arr[i+3], ed:arr[i+4]});
                    }

                    displayTitlesInfosGN(titles);

                });
            }

            pAId = nAId;

            break;
        }
    }
}
function resetCanvasSize(){
    if(canvas.height<minHeight)canvas.height=minHeight;
    if(canvas.width>maxWidth)canvas.width=maxWidth+5; //+5 DEBUG
}
function resetPositions(){
    xPos = xLeftOffset;
    yPos = 0;
}
function getInfo(evt) {

    var cv = canvas.getBoundingClientRect();

    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    if(newResults){
        $("#results").empty();
        resetSaturationForAllRects();
        newResults=false;
    }
    selectRect(mouseX, mouseY);

}
function getData(){

    init = true;
    
    document.getElementById('get_all').removeEventListener("click", getData);
    $("#get_all").toggleClass('b_off b_on');
    // $("#get_all").remove();
    $("#launcher").remove();

    $.ajax({                                      
        url: 'php/retrieve_data.php',       
        type: "POST",
        data: {case:10} 
    }).done(function(str) {

        // console.log(str);

        allData = str.split("%");
        numComposersInCapsules=0;

        //TO DEBUG AND CATCH ERROR
        // console.log(allData[0]);

        for (var i=0; i<allData.length-4; i+=5) {
            // var id = allData[i];
            var numTitles = allData[i+3];
            if(numTitles>0)numComposersInCapsules++;
        }

        var txt = "no selection";
        $("#selection").empty().append('<p>');
        $("#selection p").append(txt);

        var num = allData.length / 5;
        var txt2 = numComposersInCapsules+ " / " + num;
        $("#info p:eq(0)").text(txt2);

        processData();

    });
}
function processData002(numberMinOfParticipation){

    console.log("woot");

    canvas.removeEventListener("mousedown", getInfo, false);
    rectangles=[];

    calculateMinHeightAndCreateRectangles(1, numberMinOfParticipation);
    // resetCanvasSize();
    drawRectanglesAndAddInteractivity();
}
function processData(){
    calculateMinHeightAndCreateRectangles(0, 0);
    resetCanvasSize();
    drawRectanglesAndAddInteractivity();
}
function drawRectanglesAndAddInteractivity(){
    context.fillStyle=COLORS[1];
    context.fillRect(0, 0, canvas.width, canvas.height); 
    context.stroke();

    resetPositions();

    for(var i=0; i<rectangles.length; i++){
        drawRect(rectangles[i].x, rectangles[i].y, rectangles[i].color);
    }

    resetPositions();

    // document.getElementById('anim').addEventListener("click", animation1) ;
    canvas.addEventListener("mousedown", getInfo, false);
}
//-----------------------------------//
//--------- sma function ------------//
function resetSMACanvas(){
    ctx_sma.fillStyle=h_colors[0];
    ctx_sma.fillRect(0, 0, cv_sma.width, cv_sma.height);
}
function getParticleInfos(evt){
    
    var cv = cv_sma.getBoundingClientRect();

    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    for (var i=0; i<particles.length; i++) {

        var distance=dist(mouseX, particles[i].x, mouseY, particles[i].y)
        if(distance<=particles[i].radius*2){
            var txt=particles[i].label+' '+ particles[i].iso+' '+ particles[i].ids.length;
            // console.log(txt);
            $("#cookies").empty().append('<p>');
            $("#cookies p").text(txt);
            break;
        }
    }
}
function createNewParticle(id, ctry, count){
    // console.log(ctry);
    return new Particle({
        canvasId: "sma",
        count:count,
        addRadiusVal: 1,
        id: id,
        label: ctry,
        x:Math.random()*(cv_sma.width-8*2)+8, //8=particule radius*2
        y:Math.random()*(cv_sma.height-8*2)+8
    });
}
//-----------------------------------//
//------------ animations -----------//
function sma_animation(){

    resetSMACanvas();

    for (var i=0; i<particles.length; i++) {
        particles[i].update();
        //if(particles[i].ids.length<2)particles[i].addNoiseField(2.);
        particles[i].addNoiseField(2);
        particles[i].checkEdges();
        
        particles[i].display();

        particles[i].getAwayOrCloserFrom(i, particles);
    }

    removeDeadParticles();

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
function noise_animation(){

    for(var i=0; i<rectangles.length; i++){

        if(!rectangles[i].anchor && rectangles[i].id != nAId){

            var value = Math.abs(noise.perlin2((rectangles[i].x+tNoise) / 1000, (rectangles[i].y+tNoise) / 1000));
            value *= 100;
            value -= 50;
            // value *= 80;
            value = Math.round(value);

            var str = rectangles[i].color;

            var pos0 = str.indexOf(",")+1;
            var pos1 = str.indexOf("%");

            var sat = (avg_sat + value)%101;
            
            var c = str.substring(0, pos0);

            var lum=avg_lum;

            c += sat+'%,'+lum+'%)';

            rectangles[i].color = c;
            // console.log(c);

            drawRect(rectangles[i].x, rectangles[i].y, rectangles[i].color);
        } 
    }

    tNoise+=15;
}
//-----------------------------------//
//--------- interactivity -----------//

function filterData(){

    var year_01 = parseInt($('#year_01').val());
    var year_02 = parseInt($('#year_02').val());
    var numOfRecords = parseInt($('#numOfRecords').val());

    // console.log(year_01, year_02, numOfRecords);

    if(Number.isInteger(year_01) && Number.isInteger(year_02) && Number.isInteger(numOfRecords)){
        console.log("all three");
    } else if (Number.isInteger(year_01) && Number.isInteger(numOfRecords)){
        console.log("two of them");
    } else if (Number.isInteger(year_01)){
        console.log("year_01");
    } else if (Number.isInteger(numOfRecords)){
        console.log("numOfRecords");
        if(numOfRecords>=0)processData002(numOfRecords);
    } else {
        console.log(year_01, year_02, numOfRecords);
        processData002(0);
    }

}

function getSearchTerms(){

    var terms = $('#searchTerms').val();

    if(terms==""){
        $("#results").empty();
        resetSaturation(avg_sat);
        newResults=false;
        return;
    }

    //-------- second query
    $.ajax({                                      
        url: 'php/retrieve_data.php',       
        type: "POST",
        data: { terms: terms, case:28 } 
    }).done(function(str) {

        $("#results").empty();

        if(str.indexOf("%")<0){

            $("#results").append('<p>');
            $("#results p").text("no result");

        } else{
    
            composers = str.split("%");

            var numOfElements = 3;

            if(composers.length<numOfElements+1){

                // console.log("one composer!");

                createComposersListing(numOfElements);

                editRectanglesColorBasedOnQueryWithComposerId(composers[0]);

            } else {

                createComposersListing(numOfElements);

                for (var j=0; j<rectangles.length; j++){
            
                    drawRect(rectangles[j].x, rectangles[j].y, rectangles[j].color);
                    
                }

            }         

        }
    });
}

//-------------//
function createComposersListing(num){

    var arr=[];

    for (var i = 0; i < composers.length; i+=num) {

        var count = -1;
        var id = composers[i];

        for (var j=0; j<allData.length-4; j+=5) {
            if(id===allData[j]){
                count=allData[j+3];
                break;
            }
        }

        var str ='<p>' + id + ' ' + composers[i+1] + ' ' + 
            composers[i+2] + ' ' + count + ' ' + '</p>';
        
        if(arr.length<1){
            arr.push([count, str]);
            // console.log(str);
        } else {

            for (var k=0; k<arr.length; k++) {

                if(parseInt(count)>=parseInt(arr[k][0])){
                    arr.splice(k, 0, [count, str]);
                    // arr.push([count, str]);
                    break;
                } else if(k===arr.length-1){
                    arr.push([count, str]);
                    break;
                }

            }

        }
        
    }

    for (var l=0; l<arr.length; l++) {
        $("#results").append(arr[l][1]);
    }

    $("#results p").click(function(evt) {
        var id = $(evt.target).text().split(' ')[0];
        editRectanglesColorBasedOnQueryWithComposerId(id);
    });

    // console.log(composers.length/num, arr.length);

}
function editRectanglesColorBasedOnQueryWithComposerId(composerId){

    for (var j=0; j<rectangles.length; j++){
        if(rectangles[j].id===composerId){
            drawRect(rectangles[j].x, rectangles[j].y, "yellow");
        } else {
            var c = rectangles[j].color;
            if(c.indexOf('50%,')>0)c=c.replace('50%,', '4%,');
            drawRect(rectangles[j].x, rectangles[j].y, c);
        }
    }

    newResults=true;
}