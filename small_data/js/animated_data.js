var init=false;
var allData;
var canvas, context;
var cv_nav, ctx_nav;
var years=[1, 1973, 1974, 1975, 1976, 1977, 1978, 1979,
1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989,
1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999,
2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009];
var sl_years=[];
var inBtwYears=[];
var btnIdToEdit=-1;
var menu;
var colors=["#ecf0f1", "#2c3e50", "#e74c3c", "#f1c40f", "#bdc3c7", "#3498db"];
//clouds grey, midnight blue - dark grey, red alizarin, yellow - sun flower, grey silver, blue - peter river
var bw=15, bh=15;
var btn01;

var myLineChart;

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

    document.getElementById('cv_nav').addEventListener("click", selectData);
    document.getElementById('myCanvas').addEventListener("click", editData);
	document.getElementById('get_all').addEventListener("click", getData);

	// canvas.width = $(document).width()-25; //context left pad = 10;
	canvas.width = 1640;
    canvas.height = 600;
    // canvas.height = 300;

    resetContext();

    getData();
};
//----------------- functions -----------------//
function resetContext(){
    context.fillStyle=colors[4]; //4 || 0
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function updateSlData(){

	var tmpY = sl_years.concat(inBtwYears);

    if(sl_years.length==1 && !btn01.state){

        var f_data = [];

        for (var i=0; i<allData.length-2; i+=3) {
        
            var arr = allData[i+2].split(",");

            for (var j=0; j<arr.length; j++) {
                if(tmpY.includes(parseInt(arr[j]))){
                    f_data.push({id: allData[i], ctry: allData[i+1], edition: allData[i+2]});
                    break;
                }
            }
        }

        var inf0= "allData/3: " + allData.length/3;
        $("#info p:eq(0)").text(inf0);
        var inf1 = "slData: " + f_data.length;
        $("#info p:eq(1)").text(inf1);

    	// console.log("new bar chart");
        resetContext();
    	generateBarChart(f_data);

    } else if(sl_years.length==2 || sl_years.length<1){

        var f_data = [];
        var minY, maxY;

        if(sl_years.length<1) {
            minY=1973;
            maxY=2009;
        } else {
            minY=Math.min(sl_years[0], sl_years[1]);
            maxY=Math.max(sl_years[0], sl_years[1]);
        }

        for (var i=0; i<allData.length-2; i+=3) {

            if(f_data.length<1){
                
                f_data.push({ctry: allData[i+1], arr: []});
                for (var j=0; j<=maxY-minY; j++)f_data[f_data.length-1].arr[j]=0;

                //-------------
                var t_years = allData[i+2].split(",").map(Number);
                var year=minY;

                while(year<maxY+1){
                    if(t_years.includes(year))f_data[0].arr[year-minY]+=1;
                    year++;
                }
                //------------

                
            } else {

                var found = false;

                for (var k=0; k<f_data.length; k++){

                    if(f_data[k].ctry == allData[i+1]){ //same ctry

                        //------------- double
                        var t_years = allData[i+2].split(",").map(Number);
                        var year=minY;

                        while(year<maxY+1){  //f_data[k]
                            if(t_years.includes(year))f_data[k].arr[year-minY]+=1;
                            year++;
                        }
                        //---------------------

                        found = true;
                        break;
                    }


                }

                if(!found){
                    //------------- same as one
                    f_data.push({ctry: allData[i+1], arr: []});
                    for (var j=0; j<=maxY-minY; j++)f_data[f_data.length-1].arr[j]=0;

                    //-------------
                    var t_years = allData[i+2].split(",").map(Number);
                    var year=minY;

                    while(year<maxY+1){  //f_data[f_data.length-1]
                        if(t_years.includes(year))f_data[f_data.length-1].arr[year-minY]+=1;
                        year++;
                    }
                    //------------

                }


            }

        }
        resetContext();
        generateLineGraph(f_data, minY, maxY);
    }

}
function generateLineGraph(data, minYear, maxYear){

    myLineChart = new LineChart({
        canvasId: "myCanvas",
        minX: 0,
        minY: 0,
        maxX: (maxYear-minYear)*5,
        maxY: 100,
        unitsPerTickX: 5,
        unitsPerTickY: 10,
        minYear: minYear,
        maxYear: maxYear
    });

    for (var i = 0; i < data.length; i++) {

        var sum = data[i].arr.reduce(add, 0);
        if(sum>0){
            /*if(txt!="")txt+=" ";
            txt += data[i].ctry + ' ' + data[i].arr;*/
            myLineChart.drawLine(data[i], colors[5], 1);
        }
        
    }

    var inf2="";
    var maxY=Math.max(sl_years[0], sl_years[1]);
    var minY=Math.min(sl_years[0], sl_years[1]);
    if(maxY<1996)inf2 = minY.toString() + "-" + maxY.toString() + ": complete data";
    else if(sl_years.length===2)inf2 = minY.toString() + "-" + maxY.toString() + ": incomplete data";
    else inf2 = "1973-2009: incomplete data";
    $("#info p:eq(2)").text(inf2);

    myLineChart.drawLegend();

    var txt=myLineChart.data.length.toString()+ " countries";
    $("#selection p").text(txt);

}
function add(a, b) {
    return a + b;
}
function generateBarChart(data){

	var arr=[];

	for (var i=0; i<data.length; i++) {

		var ctry = data[i].ctry;

		if(arr.length<1) {
			arr.push({label: ctry, value: 1});
		} else {

			for (var j=0; j<arr.length; j++) {

				var added=false;

				if(ctry == arr[j].label){
					arr[j].value += 1;
					added=true;
					break; 
				}
			}

			if(!added)arr.push({label: ctry, value: 1});

		}
	}

	var inf2="";
	if(sl_years[0]<1996)inf2 = sl_years[0] + ": complete data";
    else inf2 = sl_years[0] + ": incomplete data";
	$("#info p:eq(2)").text(inf2);

	var max=0;
    var txt="";
	for (var k=0; k<arr.length; k++) {
		max = Math.max(max, arr[k].value);
        txt += arr[k].label + " " + arr[k].value + " | ";
	}

    $("#selection p").text(txt);

    var increment = Math.round(max/10);
    if(increment%2)console.log(increment-=1);
    if(max<20)increment=2; //1995

    var bWidth = map(arr.length, 30, 10, 20, 40)

	new BarChart({canvasId: "myCanvas", data: arr, barWidth: bWidth, minValue: 0, maxValue: max+1, gridLineIncrement: increment
	});
}
function map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}
//---------------------------------------//
function editData(evt){

    var cv = canvas.getBoundingClientRect();
    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    if(sl_years.length===2 || menu[0].state)myLineChart.editData(mouseX, mouseY);

}
function selectData(evt){

    var cv = cv_nav.getBoundingClientRect();
    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    for (var i=0; i<menu.length; i++) {

        if(mouseX>=menu[i].x && mouseX<=menu[i].x+bw && mouseY>=menu[i].y && mouseY<=menu[i].y+bh){

            if(!init)getData();
            
            if(i==0 && !menu[0].state){ //first btn

                if(sl_years.length>0){
                    resetMenu();
                    sl_years=[];
                    inBtwYears=[];
                }

	            activateBtn(i);

                resetInBetweenBtn(colors[3]);
                updateSlData();

            } else if(!menu[i].state){ //not already activated

            	menu[0].state = false; //reset first btn

                if(btn01.state){ //red btn

                    if(sl_years.length==2) {

                        editSlYearsArray();
                    
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

	        } else if(menu[i].state && sl_years.length==2){
	        	// console.log("already activated!");
	        	ctx_nav.fillStyle=colors[4];
           		ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
           		btnIdToEdit = i;
	        	// console.log(menu[i].id);
	        }
        }
    }

    // red btn
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
}
function activateBtn(id){
	menu[id].state = true;
    ctx_nav.fillStyle=colors[1];
    ctx_nav.fillRect(menu[id].x, menu[id].y, bw, bh);
}
function editSlYearsArray(){

	if(btnIdToEdit>-1){

		// console.log(menu[btnIdToEdit].id, sl_years[0]);
		if(menu[btnIdToEdit].id===sl_years[1]) sl_years.pop();
		else sl_years.shift();

		menu[btnIdToEdit].state=false;
    	ctx_nav.fillStyle=colors[0];
    	ctx_nav.fillRect(menu[btnIdToEdit].x, menu[btnIdToEdit].y, bw, bh);
	    
	    btnIdToEdit=-1;
    
    } else { //first behavior when year to edit has not been previously selected
    	var y = sl_years.shift();
		var id = years.indexOf(y);

		menu[id].state=false;
    	ctx_nav.fillStyle=colors[0];
    	ctx_nav.fillRect(menu[id].x, menu[id].y, bw, bh);
    }
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

    	var txt = "no selection";

    	var num = allData.length / 3;
    	var txt2 = "allData: " + num;

        $("#selection p").text(txt);
        $("#info p:eq(0)").text(txt2);
        // $("#selection p").text(allData[0]);
        // console.log(msg);

        //TODO REMOVE 
        activateBtn(0);
        resetInBetweenBtn(colors[3]);
        updateSlData();

    });
}