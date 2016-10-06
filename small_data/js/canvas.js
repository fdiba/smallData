var xPos;
var yPos;

var xDist;
var yDist;

var minHeight;
var rectangles;

var rWidth;
var rHeight;

var xLeftOffset;
var pAId;

window.onload = function() {

    var canvas = document.getElementById('myCanvas');

    if(!canvas) {
        alert("Impossible de récupérer le canvas");
        return;
    }

    canvas.addEventListener("mousedown", getInfo, false);

    var context = canvas.getContext('2d');
    if(!context) {
        alert("Impossible de récupérer le context du canvas");
        return;
    }

    rectangles = new Array();
    
    pAId=-1;
    xLeftOffset = 10;
    xDist = 11;
    yDist = 11;
    rWidth = 10;
    rHeight = 10;

    resetPositions();

    canvas.width = $(document).width()-20;
    minHeight = 300;
    canvas.height = minHeight;

    //-----------

    //canvas.width = 500;

    var xOffset = 20;

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

        if( xPos > canvas.width-xOffset){
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
            createNewRectangle(ids[i], "#bdc3c7"); //color grey silver

            //------- editions ---------//
            if(editions[i].length>0){

                for(var j=0; j<editions[i].length; j++){

                    
                    var coef = 310/(2009-1973);
                    var numEdition = editions[i][j] - 1973;
                    numEdition *= coef; //0=>255 not 360

                    var color1 = 'hsl('+ numEdition +', 80%, 50%)';

                    createNewRectangle(ids[i], color1);
                }

            } else {
                console.log("error: no edition");
            }

        }

    }

    function resetPositions(){
        xPos = xLeftOffset;
        yPos = 5;
    }

    function drawRect(x, y, c){
        context.fillStyle=c;
        context.fillRect(x, y, rWidth, rHeight); 
        context.stroke();
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
        for(var i=0; i<rectangles.length; i++){
            if(rectangles[i].id==artist_id)drawRect(rectangles[i].x, rectangles[i].y, "black");
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

                    processAllRectWhithId(rectangles[i].id);
        			
                    $.ajax({                                      
                        url: 'php/request.php',       
                        type: "POST",
                        data: { id: rectangles[i].id } 
                    }).done(function( msg ) {

                        $("#selection p").text(msg);

                        // console.log(msg);
                    });

                }

                pAId = rectangles[i].id;

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

        if( xPos > canvas.width-xOffset){
            xPos = xLeftOffset;
            yPos += yDist;
        }

        drawRect(xPos, yPos, "black");
        xPos += xDist;

    }
}