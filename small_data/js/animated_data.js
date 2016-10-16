var init=false;
var allData, slData;
var canvas, context;
var cv_nav, ctx_nav;
var years=[1, 1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980];
var sl_years=[];
var inBtwYears=[];
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

    getData();

//----------------- functions -----------------//
}
function updateSlData(){

	slData = [];

	var tmpY = sl_years.concat(inBtwYears);

	console.log(sl_years, inBtwYears, tmpY);
	console.log(sl_years.length, inBtwYears.length, tmpY.length);

	for (var i=0; i<allData.length-2; i+=3) {

		if(tmpY.includes(parseInt(allData[i+2])) || sl_years.length<1){
			slData.push({id: allData[i], ctry: allData[i+1], edition: allData[i+2]});
		}
	}

	var info = "allData/3: " + allData.length/3;
    $("#info p:eq(0)").text(info);
    var inf1 = "slData: " + slData.length;
    $("#info p:eq(1)").text(inf1);

}
//---------------------------------------//
function slData(evt){

    var cv = cv_nav.getBoundingClientRect();
    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    for (var i=0; i<menu.length; i++) {

        if(mouseX>=menu[i].x && mouseX<=menu[i].x+bw && mouseY>=menu[i].y && mouseY<=menu[i].y+bh){

            if(!init)getData();
            
            if(i==0 && !menu[i].state){

                if(sl_years.length>0){
                    resetMenu();
                    sl_years=[];
                    inBtwYears=[];
                }

	            activateBtn(i);

                resetInBetweenBtn(colors[3]);
                updateSlData();

            } else if(!menu[i].state){ //not already activated

            	menu[0].state = false;

                if(btn01.state){

                    if(sl_years.length==2) {
                        removeFirstElement();
                    } else if(sl_years.length<2){ //reset first btn + in between
                        menu[0].state=false;
                        resetInBetweenBtn(colors[0]);
                    }
                    sl_years.push(menu[i].id);
                
                } else {

	                resetMenu();
	                sl_years=[];
	                sl_years.push(menu[i].id);
                
            	}
                       
	            activateBtn(i);

	            if(sl_years.length==2)checkInBetweenBtn();
    			else inBtwYears=[];

	            updateSlData();

	            break;

	        }
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

            // console.log("test");
            inBtwYears=[];
            updateSlData();

        }

    }

    /*if(sl_years.length==2)checkInBetweenBtn();
    else inBtwYears=[];*/

}
function activateBtn(id){
	menu[id].state = true;
    ctx_nav.fillStyle=colors[1];
    ctx_nav.fillRect(menu[id].x, menu[id].y, bw, bh);
}
function removeFirstElement(){
    var y = sl_years.shift();
    var id = years.indexOf(y);
    menu[id].state=false;
    ctx_nav.fillStyle=colors[0];
    ctx_nav.fillRect(menu[id].x, menu[id].y, bw, bh);
}
function checkInBetweenBtn(){

    // console.log(sl_years);

    // if(btn01.state){

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

    var id1, id2;
    id1 = years.indexOf(pt1);
    id2 = years.indexOf(pt2);
    // console.log(id1, id2);

    inBtwYears=[];

    while(id1<id2-1){ //set in between btns
        id1++;
        ctx_nav.fillStyle=colors[3];
        ctx_nav.fillRect(menu[id1].x, menu[id1].y, bw, bh);

        inBtwYears.push(menu[id1].id);
    }

    // }
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
    	var txt2 = "allData: " + num;

        $("#selection p").text(txt);
        $("#info p:eq(0)").text(txt2);
        // $("#selection p").text(allData[0]);
        // console.log(msg);

    });
}