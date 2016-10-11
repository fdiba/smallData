var allData;

window.onload = function() {

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

	document.getElementById('get_all').addEventListener("click", getData);


	canvas.width = $(document).width()-10; //context left pad = 10;
    canvas.height = 600;

    context.fillStyle="#34495e";
    context.fillRect(0, 0, canvas.width, canvas.height); 
    context.stroke();

//----------------- functions -----------------//
}
function getData(){

	document.getElementById('get_all').removeEventListener("click", getData);

	$("#get_all").toggleClass('b_off b_on');

	$.ajax({                                      
        url: 'php/animated_data.php',       
        type: "POST"
    }).done(function(str) {

    	allData = str.split("%");
    	// allData = str.split("%");

    	var txt = allData[0] + " " + allData[1] + " " + allData[2];

    	var num = allData.length / 3;
    	var txt2 = "array length: " + num;

        $("#selection p").text(txt);
        $("#info p").text(txt2);
        // $("#selection p").text(allData[0]);
        // console.log(msg);
    });

}