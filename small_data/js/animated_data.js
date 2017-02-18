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

var composers=[], titles=[];
var yearSelection=false;
var lastComposerSelected="";

var numTitlesByArtist=[];
var maxChartWidth;

var c_on=COLORS[2];
var c_off=COLORS[0];
var c_sl=COLORS[3];

var numComposersInCapsules;
var infos;
var cp_infos;
var numCpByCountry=[];

var takeCountIntoAccount;

window.onload = function() {

    //TODO CONTROL USING GUI
    takeCountIntoAccount=false;

	//------------ canvas ------------//
    canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');
    //----------------------------------//

    maxChartWidth=1640;

    cv_nav = document.getElementById('cv_nav');
    ctx_nav = cv_nav.getContext('2d');
    cv_nav.width=maxChartWidth-440;
    cv_nav.height = 40;

    ctx_nav.fillStyle=COLORS[1];
    ctx_nav.fillRect(0, 0, cv_nav.width, cv_nav.height);

    menu = createMenu();
    
    var lr = menu[menu.length-1];
    btn01 = {x:lr.x+23, y:lr.y, state:false};

    drawMenu(menu);

    document.getElementById('cv_nav').addEventListener("click", selectData);
    document.getElementById('myCanvas').addEventListener("click", editData);
	document.getElementById('get_all').addEventListener("click", getData);
	document.getElementById('selection').addEventListener("click", toggleYearSl);

	// canvas.width = $(document).width()-25; //context left pad = 10;
	canvas.width = maxChartWidth;
    canvas.height = 600;
    // canvas.height = 300;

    resetContext();

    getData();
};
//----------------- functions -----------------//
function toggleYearSl(){
	if(composers.length>0){
		yearSelection=!yearSelection;
		editTitleInfo(infos.c, infos.y, infos.nc, infos.tnc, yearSelection);
		displayCpInfos();
	}
}
function editTitleInfo(sl_ctry, sl_year, numOfComposers, totalNumOfComposers, sl){

    infos={c:sl_ctry, y:sl_year, nc:numOfComposers, tnc:totalNumOfComposers, sl:sl};

    var txt=infos.c+' '+infos.y+' '+
            '| '+ cp_infos.num+'/'+infos.nc+ ' '+
            '| '+ cp_infos.all+'/'+infos.tnc+' '+
            '| '+ cp_infos.titles+'/'+cp_infos.all_titles+' records '+
            '| display only selection: '+infos.sl;

	$("#selection").empty().append('<p>');
    $("#selection p").text(txt);
}
function getNumComposersInCapsulesAndTitles(cId, year, composers){

    cp_infos={num:0, all:0, titles:0, all_titles:0};

    for (var i=0; i<composers.length; i++) {

        var count=parseInt(numTitlesByArtist[composers[i].id]);

        if(count>0&&composers[i].y>0){
            cp_infos.num++;
            cp_infos.titles+=parseInt(numTitlesByArtist[composers[i].id]);
        }

        if(count>0){
            cp_infos.all++;
            cp_infos.all_titles+=parseInt(numTitlesByArtist[composers[i].id]);
        }
    }

}
function retrieveAllTitleFrom(aId){

    $.ajax({                                      
        url: 'php/retrieve_data.php',       
        type: "POST",
        data: { aId: aId, case:1 } 
    }).done(function(str) {

        var arr=str.split("%");
        titles=[];

        for (var i=0; i<arr.length-4; i+=5) {
            titles.push({id:arr[i], t:arr[i+1], d:arr[i+2], m:arr[i+3], ed:arr[i+4]});
        }

        displayTitlesInfos();

    });

}
function displayTitlesInfos(){
    var str = '<em>'+lastComposerSelected+'</em>';
    $("#titles").empty().append(str);
    if(titles.length>0){
        for (var i=0; i<titles.length; i++) {
            var obj=titles[i];
            var div='<li>'+obj.t+" "+obj.d+" "+obj.m+" "+obj.ed+'</li>';
            $("#titles").append(div);
        }
    } else {
        var div='<li>no title</li>';
        $("#titles").append(div);
    }

}
function displayCpInfos(){

	$("#composers").empty();

    for (var j=0; j<composers.length; j++) {

        var obj=composers[j];

        // console.log(numTitlesByArtist[aId]);

        var count=numTitlesByArtist[obj.id];

        if(obj.y>0){ //selected year
            var div='<li';
            

            if(count>0)div+= ' class="active selected">'+obj.fn+' '+obj.n+' ('+count+')</li>';
            else div +=' class="selected">'+obj.fn+" "+obj.n+'</li>';

            $("#composers").append(div);

            $("#composers li:last-child").attr("data-id", obj.id);

            $("#composers li:last-child").click(function(event) {
                retrieveAllTitleFrom($(event.target).data("id"));
                lastComposerSelected=$(event.target).text();
            });
        } else if(!yearSelection){

            var div='<li';

            if(count>0)div+= ' class="active">'+obj.fn+" "+obj.n+' ('+count+')</li>';
            else div +='>'+obj.fn+" "+obj.n+'</li>';

            $("#composers").append(div);

            $("#composers li:last-child").attr("data-id", obj.id);

            $("#composers li:last-child").click(function(event) {
                retrieveAllTitleFrom($(event.target).data("id"));
                lastComposerSelected=$(event.target).text();
            });

        }
    }
}
//---------------------------------------------//
function resetContext(){
    context.fillStyle=colors[4]; //4 || 0
    context.fillRect(0, 0, canvas.width, canvas.height);
}
function updateSlData(){

	var tmpY = sl_years.concat(inBtwYears);

    if(sl_years.length==1 && !btn01.state){ //bar chart --> display only one year

        var f_data=[];

        for (var i=0; i<allData.length-4; i+=5) {

            var arr = allData[i+4].split(",");
            var count = allData[i+3];

            for (var j=0; j<arr.length; j++) {
                if(tmpY.includes(parseInt(arr[j]))){

                    if(takeCountIntoAccount){
                        if(count>0)f_data.push({id: allData[i], ctry: allData[i+1], cId: allData[i+2], edition: allData[i+4]});
                    } else {
                        f_data.push({id: allData[i], ctry: allData[i+1], cId: allData[i+2], edition: allData[i+4]});
                    }

                    break;
                }
            }
        }

        var inf1 = "composers: " + f_data.length;
        $("#info p:eq(1)").text(inf1);

        resetContext();
    	generateBarChart(f_data);

    } else if(sl_years.length==2 || sl_years.length<1){ //line chart

        var f_data=[];
        var minY, maxY;

        if(sl_years.length<1) {
            minY=1973;
            maxY=2009;
        } else {
            minY=Math.min(sl_years[0], sl_years[1]);
            maxY=Math.max(sl_years[0], sl_years[1]);
        }

        for (var i=0; i<allData.length-4; i+=5) {

            var count = allData[i+3];
            //not well enough written : when count > 0 all editions are ++
            //takeCountIntoAccount must be false to not take count into account to draw lines

            if(i===0){
                console.log('id:', allData[i], 'ctry:',allData[i+1], 'ctry_id:', allData[i+2],
                'artist appearance in capsules:', count, 'editions:', allData[i+4]);
            }

            if(f_data.length<1){
                
                f_data.push({ctry: allData[i+1], cId: allData[i+2], arr: []});

                //init editions array
                for (var j=0; j<=maxY-minY; j++)f_data[f_data.length-1].arr[j]=0;

                //-------------
                var t_years = getEditionsAsArrOfInts(allData[i+4]);
                var year=minY;

                while(year<maxY+1){
                    
                    if(takeCountIntoAccount){
                        if(t_years.includes(year) && count>0)f_data[0].arr[year-minY]+=1;
                    } else {
                        if(t_years.includes(year))f_data[0].arr[year-minY]+=1;
                    }

                    year++;
                }
                //------------                
            } else {

                var found = false;

                for (var k=0; k<f_data.length; k++){

                    if(f_data[k].cId === allData[i+2]){ //same country id

                        //------------- double
                        var t_years = getEditionsAsArrOfInts(allData[i+4]);
                        var year=minY;

                        while(year<maxY+1){  //f_data[k]

                            if(takeCountIntoAccount){
                                if(t_years.includes(year) && count>0)f_data[k].arr[year-minY]+=1;
                            } else {
                                if(t_years.includes(year))f_data[k].arr[year-minY]+=1;
                            }

                            year++;
                        }
                        //---------------------

                        found = true;
                        break;
                    }
                }

                if(!found){
                    //------------- same as one
                    f_data.push({ctry: allData[i+1], cId: allData[i+2], arr: []});
                    for (var j=0; j<=maxY-minY; j++)f_data[f_data.length-1].arr[j]=0;

                    //-------------
                    var t_years = getEditionsAsArrOfInts(allData[i+4]);
                    var year=minY;

                    while(year<maxY+1){  //f_data[f_data.length-1]


                        if(takeCountIntoAccount){
                            if(t_years.includes(year)  && count>0)f_data[f_data.length-1].arr[year-minY]+=1;
                        } else {
                            if(t_years.includes(year))f_data[f_data.length-1].arr[year-minY]+=1;
                        }

                        year++;
                    }
                    //------------
                }
            }
        }

        var inf1="no info";
        $("#info p:eq(1)").text(inf1);

        resetContext();
        generateLineGraph(f_data, minY, maxY);
    }
}
function getEditionsAsArrOfInts(str){
    return str.split(",").map(Number);
}
function generateLineGraph(data, minYear, maxYear){

	var maxValue=0;

	for (var j = 0; j < data.length; j++) {
		var arr = data[j].arr;
		for (var k = 0; k < arr.length; k++) {
			if(arr[k]>maxValue)maxValue=arr[k];
		}
	}

    myLineChart = new LineChart({
        canvasId: "myCanvas",
        minY: 0, //not used
        maxX: (maxYear-minYear)*5,
        maxY: maxValue,
        unitsPerTickX: 5,
        unitsPerTickY: 10,
        minYear: minYear,
        maxYear: maxYear
    });

    for (var i = 0; i < data.length; i++) {
        var sum = data[i].arr.reduce(add, 0);
        if(sum>0)myLineChart.drawLine(data[i], colors[5], 1, true);
    }

    var inf2="";
    var maxY=Math.max(sl_years[0], sl_years[1]);
    var minY=Math.min(sl_years[0], sl_years[1]);
    if(maxY<1996)inf2 = minY.toString() + "-" + maxY.toString() + ": complete data";
    else if(sl_years.length===2)inf2 = minY.toString() + "-" + maxY.toString() + ": incomplete data";
    else inf2 = "1973-2009: incomplete data";
    $("#info p:eq(2)").text(inf2);

    myLineChart.drawLegend();

    var txt='<p>'+myLineChart.data.length.toString()+ " countries</p>";
    $("#selection").empty();
    $("#selection").append(txt);

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
    $("#selection").empty();
    $("#selection").append('<p>');
    $("#selection p").append(arr.length+ " countries: ");
	for (var k=0; k<arr.length; k++) {
		max = Math.max(max, arr[k].value);
        var txt=arr[k].label+" "+arr[k].value;
        if(k<arr.length-1)txt+=' - ';
        $("#selection p").append(txt);
	}
    

    var increment = Math.round(max/10);
    // if(increment%2)console.log(increment-=1);
    if(max<20)increment=2; //1995

    var bWidth = map(arr.length, 30, 10, 20, 40)

	new BarChart({canvasId: "myCanvas", data: arr, barWidth: bWidth, minValue: 0, maxValue: max+1, gridLineIncrement: increment});
}
//---------------------------------------//
function editData(evt){

    var cv = canvas.getBoundingClientRect();
    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    //linechart
    if(sl_years.length===2 || menu[0].state){
        if(mouseX<myLineChart.w)myLineChart.requestData(mouseX, mouseY);
        else myLineChart.editData(mouseX, mouseY);
    }

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
	        	ctx_nav.fillStyle=c_sl;
           		ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
           		btnIdToEdit = i;
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
            while(sl_years.length>1)editSlYearsArray();
            resetInBetweenBtn(colors[0]);

            inBtwYears=[];
            updateSlData();

        }

    }
}
function activateBtn(id){
	menu[id].state = true;
    ctx_nav.fillStyle=c_on;
    ctx_nav.fillRect(menu[id].x, menu[id].y, bw, bh);
}
function editSlYearsArray(){

	if(btnIdToEdit>-1){

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
        ctx_nav.fillStyle=c_off;
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
        ctx_nav.strokeStyle=COLORS[0];
        ctx_nav.strokeRect(menu[i].x, menu[i].y, bw, bh);
        ctx_nav.fillStyle=colors[0];
        ctx_nav.fillRect(menu[i].x, menu[i].y, bw, bh);
    }

    ctx_nav.lineWidth="0.75";
    ctx_nav.strokeStyle=colors[2];
    ctx_nav.strokeRect(btn01.x, btn01.y, bw, bh);
    ctx_nav.fillStyle=c_off;
    ctx_nav.fillRect(btn01.x, btn01.y, bw, bh);

}
//---------------------------------------//
function getData(){

    init = true;
	
    document.getElementById('get_all').removeEventListener("click", getData);

	$("#get_all").toggleClass('b_off b_on');

	$.ajax({                                      
        url: 'php/retrieve_data.php',       
        type: "POST",
        data: {case:10} 
    }).done(function(str) {

        numComposersInCapsules=0;
    	allData = str.split("%");

        /*var id=allData[i];
        var ctry=allData[i+1];
        var ctry_id=allData[i+2];
        var counter=allData[i+3];
        var editions=allData[i+4];*/

        for (var i=0; i<allData.length-4; i+=5) {
            var id = allData[i];
            if(ENGLISH)allData[i+1]=checkCountry(allData[i+1]);
            var numTitles = allData[i+3];
            numTitlesByArtist[id]=numTitles;

            var ctry_id=allData[i+2];
            
            if(numCpByCountry[ctry_id])numCpByCountry[ctry_id].t++;
            else numCpByCountry[ctry_id]={t:1, c:0};

            if(numTitles>0){
                numCpByCountry[ctry_id].c++;
                numComposersInCapsules++;
            }

        }

    	var txt = "no selection";
        $("#selection").empty().append('<p>');
        $("#selection p").append(txt);

        var num = allData.length / 5;
        var txt2 = numComposersInCapsules+ " / " + num;
        $("#info p:eq(0)").text(txt2);

        //TODO REMOVE 
        activateBtn(0);
        resetInBetweenBtn(colors[3]);
        updateSlData();

    });
}