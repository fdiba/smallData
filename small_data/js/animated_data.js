var init=false;
var allData;
var canvas, context;
var cv_nav, ctx_nav;
var years=[1, 1973, 1974, 1975];
var sl_years=[];
var menu;
var color1="#ecf0f1"; //clouds grey
var color2="#2c3e50"; //midnight blue - dark grey
var bw=15, bh=15;

window.onload = function() {

	//------------ canvas ------------//
    canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');
    //----------------------------------//

    cv_nav = document.getElementById('cv_nav');
    ctx_nav = cv_nav.getContext('2d');
    cv_nav.width = $(document).width()-25;
    cv_nav.height = 40;

    ctx_nav.fillStyle=color1;
    ctx_nav.fillRect(0, 0, cv_nav.width, cv_nav.height);

    menu = createMenu();
    drawMenu(menu);
    document.getElementById('cv_nav').addEventListener("click", slData);
    //----------------------------------//

	document.getElementById('get_all').addEventListener("click", getData);


	canvas.width = $(document).width()-25; //context left pad = 10;
    canvas.height = 600;

    context.fillStyle=color1;
    context.fillRect(0, 0, canvas.width, canvas.height); 

//----------------- functions -----------------//
}

//---------------------------------------//
function slData(evt){

    var cv = cv_nav.getBoundingClientRect();
    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    for (var i=0; i<menu.length; i++) {
        if(mouseX>=menu[i].x && mouseX<=menu[i].x+bw && mouseY>=menu[i].y && mouseY<=menu[i].y+bh){

            if(!init)getData();
            
            if(i==0){
                if(sl_years.length>0){
                    resetMenu();
                    sl_years=[];
                }
            } else {

                if(!menu[i].state){
                    if(sl_years.length==2) {
                        var id = sl_years.shift();
                        menu[id].state=false;
                        ctx_nav.fillStyle=color1;
                        ctx_nav.fillRect(menu[id].x, menu[id].y, bw, bh);
                    } else if(sl_years.length<1){
                        ctx_nav.fillStyle=color1;
                        ctx_nav.fillRect(menu[0].x, menu[0].y, bw, bh);
                    }
                    sl_years.push(i);
                }
            }

                       
            menu[i].state = true;
            ctx_nav.fillStyle=color2;
            ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);

            console.log(sl_years);
            break;
        }
    }
    
}
function resetMenu(){
    for (var i=0; i<sl_years.length; i++) {
        var id = sl_years[i];
        menu[id].state=false;
        ctx_nav.fillStyle=color1;
        ctx_nav.fillRect(menu[id].x, menu[id].y, bw, bh);
    }
}
function createMenu(){
    var arr=[];
    var xPos=10, yPos=13;
    for (var i=0; i<years.length; i++) {
        arr.push({x:xPos, y:yPos, id:years[i], state:false});
        xPos += 23;
    }
    return arr;
}
function drawMenu(menu){
    for (var i = 0; i < menu.length; i++) {
        ctx_nav.lineWidth="0.75";
        ctx_nav.strokeStyle=color2;
        ctx_nav.strokeRect(menu[i].x, menu[i].y, bw, bh);
        ctx_nav.fillStyle=color1;
        ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
    }
}
//---------------------------------------//
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

    init = true;

}