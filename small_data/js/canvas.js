var context;
var rectangles;

var nAId;
var avg_sat, max_sat, min_sat;

var tNoise;

//-------
var xPos, yPos;
var xDist, yDist;

var minHeight;

var rWidth, rHeight;

var xLeftOffset;
var pAId;


var color1; //color grey silver

///------
var isAnimated;
var animation2;

window.onload = function() {


	//------------ navigation ------------//

	isAnimated = false;
	color1 = "#bdc3c7";
	max_sat = 50;
	avg_sat = max_sat;
	min_sat = 0;
	tNoise = 0;

	//------------ canvas ------------//
    var canvas = document.getElementById('myCanvas');

    if(!canvas) {
        alert("Impossible de récupérer le canvas");
        return;
    }
    context = canvas.getContext('2d');
    if(!context) {
        alert("Impossible de récupérer le context du canvas");
        return;
    }
    //----------------------------------//

    document.getElementById('anim').addEventListener("click", animation1) ;

    canvas.addEventListener("mousedown", getInfo, false);

    rectangles = new Array();
    
    pAId=-1;
    xLeftOffset = 0;
    xDist = 11, yDist = 11;
    rWidth = 10, rHeight = 10;

    resetPositions();

    canvas.width = $(document).width()-10; //context left pad = 10;
    minHeight = 300;
    canvas.height = minHeight;

    //-----------

    //canvas.width = 500;

    var xRightOffset = 10;

    calculateMinHeight();

    resetCanvasSize();

    context.fillStyle="white";
    context.fillRect(0, 0, canvas.width, canvas.height); 
    context.stroke();

    resetPositions();

    for(var i=0; i<rectangles.length; i++){
        drawRect(rectangles[i].x, rectangles[i].y, rectangles[i].color);
    }

    resetPositions();

    //displayInformation(2);

    //-------- functions -----------//

    function resetCanvasSize(){

        if(canvas.height<minHeight)canvas.height=minHeight;
    }

    function createNewRectangle(r_id, c){

        if( xPos > canvas.width-xRightOffset){
            xPos = xLeftOffset;
            yPos += yDist;
        }

        if(yPos+yDist>minHeight) minHeight+=yDist;

        rectangles.push({id:r_id, x: xPos, y:yPos, color:c});
        xPos += xDist;

    }

    function calculateMinHeight(){

        for(var i=0; i<ids.length; i++){

            //------- main rectangle ---------//
            createNewRectangle(ids[i], color1);

            //------- editions ---------//
            if(editions[i].length>0){

                for(var j=0; j<editions[i].length; j++){

                    
                    var coef = 310/(2009-1973);
                    var numEdition = editions[i][j] - 1973;
                    numEdition *= coef; //0=>255 not 360

                    var c = 'hsl('+ numEdition +', ' + avg_sat + '%, 50%)';

                    createNewRectangle(ids[i], c);
                }

            } else {
                console.log("error: no edition");
            }

        }

    }

    function resetPositions(){
        xPos = xLeftOffset;
        yPos = 0;
    }

    

    function displayInformation(id){

        context.lineWidth = 2;
        context.font = "20pt Calibri";
        context.fillStyle="grey";
        context.strokeStyle = "white";
        
        context.textAlign = "center";
        context.textBaseline = "middle";

        var yTxtPos = 120;

        context.strokeText(ids[2], canvas.width/2, yTxtPos);
        context.fillText(ids[2], canvas.width/2, yTxtPos);
        yTxtPos += 40;

        context.strokeText(fNames[2], canvas.width/2, yTxtPos);
        context.fillText(fNames[2], canvas.width/2, yTxtPos);
        yTxtPos += 40;

        context.strokeText(names[2], canvas.width/2, yTxtPos);
        context.fillText(names[2], canvas.width/2, yTxtPos);
        yTxtPos += 40;

        context.strokeText(countries[2], canvas.width/2, yTxtPos);
        context.fillText(countries[2], canvas.width/2, yTxtPos);
        yTxtPos += 40;

        context.strokeText(editions[2], canvas.width/2, yTxtPos);
        context.fillText(editions[2], canvas.width/2, yTxtPos);
        yTxtPos += 40;

    }
    function processAllRectWhithId(artist_id){

    	var firstOne = false;

        for(var i=0; i<rectangles.length; i++){

        	if(rectangles[i].id==artist_id){
        		if(firstOne) {

        			var str = rectangles[i].color;

        			var pos0 = str.indexOf(",")+1;

        			str = str.substring(0, pos0);
        			str += " 100%, 50%)";

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
    		if(x>rectangles[i].x && x<rectangles[i].x+rWidth &&
    		   y>rectangles[i].y && y<rectangles[i].y+rHeight) {

                if(pAId>=0){
                    // drawRect(rectangles[pAId].x, rectangles[pAId].y, rectangles[pAId].color);
                    resetAllRectWhithId(pAId);
                }

                if(rectangles[i].id != pAId){

                	nAId = rectangles[i].id;

                    processAllRectWhithId(nAId);
        			
                    $.ajax({                                      
                        url: 'php/request.php',       
                        type: "POST",
                        data: { id: nAId } 
                    }).done(function( msg ) {

                        $("#selection p").text(msg);

                        // console.log(msg);
                    });

                }

                pAId = nAId;

                break;

    		}

		}

    }

    //------

    function getInfo(evt) {

    	var cv = canvas.getBoundingClientRect();

    	var mouseX = evt.clientX - cv.left;
    	var mouseY = evt.clientY - cv.top;

    	// console.log(mouseX, mouseY);

    	selectRect(mouseX, mouseY);

    }

    //------

    //var myInterval = setInterval(animate, 1000/10);

    function animate() {

        if( xPos > canvas.width-xRightOffset){
            xPos = xLeftOffset;
            yPos += yDist;
        }

        drawRect(xPos, yPos, "black");
        xPos += xDist;

    }
}

function drawRect(x, y, c){
    context.fillStyle=c;
    context.fillRect(x, y, rWidth, rHeight); 
    context.stroke();
}
function wooot2(){
	console.log('test');
	for(var i=0; i<rectangles.length; i++){

		var value = Math.abs(noise.perlin2((rectangles[i].x+tNoise) / 500, (rectangles[i].y+tNoise) / 500));
    	value *= 256;
    	value = Math.round(value);

    	if(i > 20 && i < 100) console.log(value);
    	//var v1 = noise.perlin(rectangles[i].x

		// var c = "rgb("+value+","+value+","+value+")";;
		var c = "rgb(" + value + ", 0, 0)";;
		rectangles[i].color = c;

		drawRect(rectangles[i].x, rectangles[i].y, rectangles[i].color);
	}
	tNoise+=100;
}
function animation1(evt){
	if(isAnimated){
		clearInterval(animation2);
		resetSaturation(avg_sat);
	} else animation2 = setInterval(noiseAnimation, 1000/10);

	isAnimated = !isAnimated;

    $("#anim").toggleClass('b_off b_on');

}
function resetSaturation(sat){

	for(var i=0; i<rectangles.length; i++){
		
		if(rectangles[i].color != color1 && rectangles[i].id != nAId){

			var str = rectangles[i].color;

			var pos0 = str.indexOf(",")+1;
			var pos1 = str.indexOf("%");
			
			var c = str.substring(0, pos0);
			c += " " + sat + "%, 50%)";

			rectangles[i].color = c;
			// console.log(c);

			drawRect(rectangles[i].x, rectangles[i].y, rectangles[i].color);
		}
	} 
}
function noiseAnimation(){

	for(var i=0; i<rectangles.length; i++){

		if(rectangles[i].color != color1 && rectangles[i].id != nAId){

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
			c += " " + sat + "%, 50%)";

			rectangles[i].color = c;
			// console.log(c);

			drawRect(rectangles[i].x, rectangles[i].y, rectangles[i].color);
		} 
    }

    tNoise+=15;
}