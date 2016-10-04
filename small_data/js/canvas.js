var xPos;
var yPos;

var minHeight;

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

    resetPositions();

    canvas.width = $(document).width()-20;
    minHeight = 300;
    canvas.height = minHeight;

    context.fillStyle="green";
    context.fillRect(0, 0, canvas.width, canvas.height); 
    context.stroke();

    //-----------

    //canvas.width = 500;

    var xOffset = 20;

    calculateMinHeight();

    resetCanvasSize();

    context.fillStyle="white";
    context.fillRect(0, 0, canvas.width, canvas.height); 
    context.stroke();

    resetPositions();

    for(var i=0; i<num; i++){

        if( xPos > canvas.width-xOffset){
            xPos = 0;
            yPos += 20;
        }

        drawRect("pink");
        xPos += 20;
    }

    resetPositions();

    function resetCanvasSize(){

        if(canvas.height<minHeight)canvas.height=minHeight;
    }

    function calculateMinHeight(){

        for(var i=0; i<num; i++){

            if( xPos > canvas.width-xOffset){
                xPos = 0;
                yPos += 20;
            }

            if(yPos+20>minHeight) {
                minHeight+=20;

            }

            //drawRect();
            xPos += 20;
        }

    }

    function resetPositions(){
        xPos = 0;
        yPos = 5;
    }

    function drawRect(c){

        context.fillStyle=c;
        context.fillRect(xPos, yPos, 10, 10); 
        context.stroke();

    }

    //context.lineWidth = 2;
    context.font = "40pt Calibri";
    context.fillStyle="grey";
    //context.strokeStyle = "yellow";
    
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(num, canvas.width / 2, 120);
    //context.strokeText(num, canvas.width / 2, 120);

    //------

    //var myInterval = setInterval(animate, 1000/10);

    function animate() {

        //for(var i=0; i<num; i++){

            if( xPos > canvas.width-xOffset){
                xPos = 0;
                yPos += 20;
            }

            drawRect("black");
            xPos += 20;
        //}

    }
}