var xPos;
var yPos;

var minHeight;
var rectangles;

var xLeftOffset;

window.onload = function() {

    var canvas = document.getElementById('myCanvas');

    if(!canvas) {
        alert("Impossible de récupérer le canvas");
        return;
    }

    canvas.addEventListener("mousedown", animate, false);

    var context = canvas.getContext('2d');
    if(!context) {
        alert("Impossible de récupérer le context du canvas");
        return;
    }

    rectangles = new Array();
    xLeftOffset = 10;
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

    displayInformation(2);

    //-------- functions -----------//

    function resetCanvasSize(){

        if(canvas.height<minHeight)canvas.height=minHeight;
    }

    function createNewRectangle(c){

        if( xPos > canvas.width-xOffset){
            xPos = xLeftOffset;
            yPos += 20;
        }

        if(yPos+20>minHeight) minHeight+=20;

        rectangles.push({id:ids[i], x: xPos, y:yPos, color:c});
        xPos += 20;

    }

    function calculateMinHeight(){

        for(var i=0; i<ids.length; i++){

            //------- main rectangle ---------//
            createNewRectangle("pink");

            //------- editions ---------//
            if(editions[i].length>0){

                for(var j=0; j<editions[i].length; j++){
                    createNewRectangle("orange");
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
        context.fillRect(x, y, 10, 10); 
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

    //------

    //var myInterval = setInterval(animate, 1000/10);

    function animate() {

        if( xPos > canvas.width-xOffset){
            xPos = 0;
            yPos += 20;
        }

        drawRect(xPos, yPos, "black");
        xPos += 20;

    }
}