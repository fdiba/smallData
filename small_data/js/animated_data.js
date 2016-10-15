var init=false;
var allData;
var canvas, context;
var cv_nav, ctx_nav;
var years=[1, 1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980];
var sl_years=[];
var menu;
var colors=["#ecf0f1", "#2c3e50", "#e74c3c", "#f1c40f"];
//clouds grey, midnight blue - dark grey, red alizarin, yellow - sun flower
var bw=15, bh=15;
var btn01;

window.onload = function() {

	//------------ canvas ------------//
    canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');
    //----------------------------------//

    cv_nav = document.getElementById('cv_nav');
    ctx_nav = cv_nav.getContext('2d');
    cv_nav.width = $(document).width()-25;
    cv_nav.height = 40;

    ctx_nav.fillStyle=colors[0];
    ctx_nav.fillRect(0, 0, cv_nav.width, cv_nav.height);

    menu = createMenu();
    
    var lr = menu[menu.length-1];
    btn01 = {x:lr.x+23, y:lr.y, state:false};

    drawMenu(menu);

    document.getElementById('cv_nav').addEventListener("click", slData);
    //----------------------------------//

	document.getElementById('get_all').addEventListener("click", getData);


	canvas.width = $(document).width()-25; //context left pad = 10;
    canvas.height = 600;

    context.fillStyle=colors[0];
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
                resetInBetweenBtn(colors[3]);
            } else if(btn01.state){

                if(!menu[i].state){ //not already activated
                    if(sl_years.length==2) {
                        removeFirstElement();
                    } else if(sl_years.length<2){ //reset first btn + in between
                        menu[0].state=false;
                        resetInBetweenBtn(colors[0]);
                    }

                    sl_years.push(i);
                }

            } else {

                resetMenu();
                sl_years=[];
                sl_years.push(i);
                
            }

                       
            menu[i].state = true;
            ctx_nav.fillStyle=colors[1];
            ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);

            console.log(sl_years);
            break;
        }
    }

    if(mouseX>=btn01.x && mouseX<=btn01.x+bw && mouseY>=btn01.y && mouseY<=btn01.y+bh){
        btn01.state = !btn01.state;

        if(btn01.state){
            ctx_nav.fillStyle=colors[2];
            ctx_nav.fillRect(btn01.x, btn01.y, bw, bh);
        } else {
            ctx_nav.fillStyle=colors[0];
            ctx_nav.fillRect(btn01.x, btn01.y, bw, bh);
            while(sl_years.length>1)removeFirstElement();
            resetInBetweenBtn(colors[0]);
        }

    }

    if(sl_years.length==2)checkInBetweenBtn();
    
}
function removeFirstElement(){
    var id = sl_years.shift();
    menu[id].state=false;
    ctx_nav.fillStyle=colors[0];
    ctx_nav.fillRect(menu[id].x, menu[id].y, bw, bh);
}
function checkInBetweenBtn(){

    console.log(sl_years);

    if(btn01.state){

        ctx_nav.fillStyle=colors[2];
        ctx_nav.fillRect(btn01.x, btn01.y, bw, bh);

        var pt1, pt2;
        if(sl_years[0]<sl_years[1]){
            pt1 = sl_years[0];
            pt2 = sl_years[1];
        } else {
            pt1 = sl_years[1];
            pt2 = sl_years[0];
        }

        for (var i = 1; i < years.length; i++) {
            if((years[i]<pt1 || years[i]>pt2) && !menu[i].state){ //reset btn outside actual range
                ctx_nav.fillStyle=colors[0];
                ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
            }
        }

        while(pt1<pt2-1){ //set in between btns
            pt1++;
            ctx_nav.fillStyle=colors[3];
            ctx_nav.fillRect(menu[pt1].x, menu[pt1].y, bw, bh);
        }

    }
}
function resetInBetweenBtn(c){
    for (var i=0; i<menu.length; i++) {
        if(!menu[i].state){
            ctx_nav.fillStyle=c;
            ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
        }
    }
}
function resetMenu(){
    for (var i=0; i<menu.length; i++) {
        menu[i].state=false;
        ctx_nav.fillStyle=colors[0];
        ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
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
        ctx_nav.strokeStyle=colors[1];
        ctx_nav.strokeRect(menu[i].x, menu[i].y, bw, bh);
        ctx_nav.fillStyle=colors[0];
        ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
    }

    ctx_nav.lineWidth="0.75";
    ctx_nav.strokeStyle=colors[2];
    ctx_nav.strokeRect(btn01.x, btn01.y, bw, bh);
    ctx_nav.fillStyle=colors[0];
    ctx_nav.fillRect(btn01.x, btn01.y, bw, bh);

}
//---------------------------------------//
function getData(){

    init = true;
	
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