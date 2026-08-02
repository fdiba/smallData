var init=false;
var allData;
var numComposersInCapsules;

var cookies=[];

var canvas, context;
var rectangles=[];
var titles=[];

var xRightOffset;

var nAId;
var avg_sat, max_sat, min_sat;
var avg_lum=50, max_lum=90, min_lum=20;

var tNoise;

//-------
var xPos, yPos;
var xDist, yDist;

var minHeight;

var rWidth, rHeight;

var xLeftOffset;
var pAId;

var h_colors=["#ecf0f1"];//grey clouds
var colors=[{h:203, s:4, l:77}]; //#bdc3c7 grey silver

///------
var isAnimated;
var animation2;

var maxWidth;

//---------- sma (moteur : voir js/overview_sma.js) -------------//
var count002=0;

//---------- query results -------------//
var composers=[];
var newResults=false;

window.onload = function() {

	//------------ navigation ------------//

	isAnimated = false;
	max_sat = 50;
	avg_sat = max_sat;
	min_sat = 0;
	tNoise = 0;    

    canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');

    //----------------------------------//

    //hide animation
    $('#anim').hide();
 
    //----------------------------------//

    // SMA de l'overview : agents = compositeurs consultes, regroupes par pays
    // (moteur auto-contenu dans js/overview_sma.js). Meme taille de canvas.
    OverviewSMA.init(document.getElementById('sma'));

    //----------------------------------//

    document.getElementById('get_all').addEventListener("click", getData);

    //----------------------------------//

    document.getElementById('searchBoxBtn').addEventListener("click", getSearchTerms);
    // valider par la touche Entree quand le champ "composer name" a le focus
    document.getElementById('searchTerms').addEventListener("keydown", function(e){
        if(e.key === "Enter" || e.keyCode === 13){ e.preventDefault(); getSearchTerms(); }
    });

    //----------------------------------//

    document.getElementById('filtersBtn').addEventListener("click", filterData);
    // valider par la touche Entree quand le champ "num of records >=" a le focus
    document.getElementById('numOfRecords').addEventListener("keydown", function(e){
        if(e.key === "Enter" || e.keyCode === 13){ e.preventDefault(); filterData(); }
    });

    //----------------------------------//

    pAId=-1;
    xLeftOffset = 0;
    xDist = 11, yDist = 11;
    rWidth = 10, rHeight = 10;

    //-------- print -------//
    /*xDist = 33, yDist = 33;
    rWidth = 30, rHeight = 30;*/

    resetPositions();

    maxWidth=$(document).width()-(500+25); //context left pad = 10;
    canvas.width = maxWidth;
    minHeight = 300;
    canvas.height = minHeight;


    context.fillStyle=h_colors[0];
    context.fillRect(0, 0, canvas.width, canvas.height);

    xRightOffset = 10;

    $("#titles").css({"clear": "both"});

    // la note "Coverage" n'apparait que lorsque num of records < 1 (defaut = 1)
    updateCoverageNote(parseInt($('#numOfRecords').val()));

    setTimeout(getData(), 5000);
    
    //getData();

}
function drawRect(x, y, c){
    context.fillStyle=c;
    context.fillRect(x, y, rWidth, rHeight); 
}
function animation1(evt){
	if(isAnimated){
		clearInterval(animation2);
		resetSaturation(avg_sat);
	} else animation2 = setInterval(noise_animation, 1000/10);

	isAnimated = !isAnimated;

    $("#anim").toggleClass('b_off b_on');

}
function resetSaturationForAllRects(){

    for(var i=0; i<rectangles.length; i++){
        drawRect(rectangles[i].x, rectangles[i].y, rectangles[i].color);
    } 

}
function resetSaturation(sat){

	for(var i=0; i<rectangles.length; i++){
		
		if(!rectangles[i].anchor && rectangles[i].id != nAId){

			var str = rectangles[i].color;

			var pos0 = str.indexOf(",")+1;
			var pos1 = str.indexOf("%");
			
			var c = str.substring(0, pos0);

            var lum;
            if(rectangles[i].count>0)lum=avg_lum;
            else lum=max_lum;

			c += sat+'%,'+lum+'%)';

			rectangles[i].color = c;

			drawRect(rectangles[i].x, rectangles[i].y, rectangles[i].color);
		}
	} 
}
//---------------------------------------//

function calculateMinHeightAndCreateRectangles(step, threshold){

    // On repart d'un etat propre a chaque (re)calcul : positions a zero et
    // hauteur remise a zero pour qu'elle puisse RETRECIR quand il y a moins
    // d'elements (filtre "num of records"), pas seulement grandir.
    resetPositions();
    minHeight = 0;

    for (var i=0; i<allData.length-5; i+=6) {

        //---------- get data ----------//
        var id = allData[i];
        var editions = allData[i+4].split(",");
        var ctry=allData[i+1];
        // var cId=allData[i+2];
        var count=allData[i+3]; //number of compositions avalaible

        //------- set color luminosity ---------//
        var lum;
        if(count>0) lum=colors[0].l;
        else lum=max_lum;

        var color='hsl('+colors[0].h+','+colors[0].s+'%,'+lum+'%)';

        //------- create rectangles ---------//

        if(step===0){
            createNewRectangle(id, color, count, true);
            createEditionsRectangles(id, count, editions);
        } else if(step===1){
            if(count>=threshold){
                createNewRectangle(id, color, count, true);
                createEditionsRectangles(id, count, editions);
            }
        }
    }
}
function createEditionsRectangles(id, count, editions){

    if(editions.length>0){
        for(var j=0; j<editions.length; j++){
            var coef = 310/(2009-1973);
            var numEdition = editions[j] - 1973;
            numEdition *= coef; //0=>255 not 360

            var lum;
            if(count>0) lum=avg_lum;
            else lum=max_lum;

            var c='hsl('+numEdition+','+avg_sat+'%,'+lum+'%)';
            createNewRectangle(id, c, count, false);
            
        }
    } else {
        console.log("error: no edition");
    }
} 
function createNewRectangle(aId, c, count, anchor){

    if( xPos>maxWidth-xRightOffset){

        // retour a la ligne sur la largeur de REFERENCE fixe (maxWidth, definie a
        // l'onload). On n'utilise pas canvas.width : celui-ci est ensuite retreci a
        // la largeur reelle de la grille et ne doit pas influencer le decoupage
        // (sinon la largeur deriverait a chaque recalcul).

        xPos = xLeftOffset;
        yPos += yDist;
    }

    if(yPos+yDist>minHeight) minHeight+=yDist;

    rectangles.push({id:aId, x: xPos, y:yPos, color:c, count:count, anchor:anchor});
    xPos += xDist;

}
function processAllRectWhithId(artist_id){

    var firstOne = false;

    for(var i=0; i<rectangles.length; i++){

        if(rectangles[i].id==artist_id){
            if(firstOne) {

                var str = rectangles[i].color;

                var pos0 = str.indexOf(",")+1;

                str = str.substring(0, pos0);
                str += "100%,50%)";

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
        if(x>=rectangles[i].x && x<=rectangles[i].x+rWidth &&
           y>=rectangles[i].y && y<=rectangles[i].y+rHeight) {

            if(pAId>=0){
                resetAllRectWhithId(pAId);
            }

            if(rectangles[i].id != pAId){

                nAId = rectangles[i].id;
                count002=rectangles[i].count;

                processAllRectWhithId(nAId);
                
                //-------- first query

                $.ajax({                                      
                    url: 'php/retrieve_data.php',       
                    type: "POST",
                    data: {aId: nAId, case:5} 
                }).done(function(str) {

                    var arr=str.split("%");
                    var ctry=arr[2];
                    // "edition" au singulier si une seule, "editions" au pluriel sinon
                    var nEd=(''+arr[3]).split(',').length;
                    var edLabel=(nEd===1 ? 'edition' : 'editions');
                    var txt='selected: '+arr[0]+' '+arr[1]+' ('+ctry+') | '+edLabel+': '+arr[3];

                    $("#selection p").text(txt);

                    //------- cookie stuff

                    var is_new=true;

                    if(cookies.length>0){

                        for (var i=0; i<cookies.length; i++) {
                            if(cookies[i].id===nAId){
                                // console.log('already in');
                                is_new=false;
                                break;
                            }
                        }
                    }

                    if(is_new){

                        cookies.push({id:nAId, count:count002});

                        var str="";

                        for (var i = 0; i < cookies.length; i++) {
                            if(i>0)str+='%';
                            str+=cookies[i].id+'%'+cookies[i].count;
                        }

                        $.cookie('ids', str);
                        
                        // un agent par compositeur consulte ; il apparait en gris
                        // puis fusionne avec les siens (meme pays) -> groupe vert.
                        // Le compteur "consulted so far" est gere par le module.
                        OverviewSMA.addComposer({country: ctry, fn: arr[0], ln: arr[1], id: nAId, count: count002});

                    }
                });

                
                //-------- second query
                $.ajax({                                      
                    url: 'php/retrieve_data.php',       
                    type: "POST",
                    data: { aId: nAId, case:1 } 
                }).done(function(str) {

                    var arr=str.split("%");
                    titles=[];

                    for (var i=0; i<arr.length-4; i+=5) {
                        titles.push({id:arr[i], t:arr[i+1], d:arr[i+2], m:arr[i+3], ed:arr[i+4]});
                    }

                    displayTitlesInfosGN(titles);

                });
            }

            pAId = nAId;

            break;
        }
    }
}
function resetCanvasSize(){
    // Le canvas epouse la hauteur reelle du contenu (peut grandir ou retrecir),
    // pour ne pas laisser de zone vide et laisser remonter la legende "How to".
    canvas.height = minHeight + yDist;

    // Largeur = bord droit REEL de la grille (derniere colonne remplie), afin de ne
    // laisser aucun espace apres le dernier carre des lignes pleines. Comme le
    // decoupage se fait sur maxWidth (fixe), cette valeur est stable d'un recalcul a
    // l'autre : pas de derive.
    var contentRight = 0;
    for(var i=0; i<rectangles.length; i++){
        var right = rectangles[i].x + rWidth;
        if(right>contentRight) contentRight = right;
    }
    canvas.width = contentRight>0 ? contentRight : maxWidth;

    // La legende "How to read" est calee sur cette meme largeur : les deux blocs
    // ont donc exactement la meme largeur visible.
    var lg = document.getElementById('legend');
    if(lg){
        lg.style.maxWidth = canvas.width + 'px';
        lg.style.width = canvas.width + 'px';
    }
}
function resetPositions(){
    xPos = xLeftOffset;
    yPos = 0;
}
function getInfo(evt) {

    var cv = canvas.getBoundingClientRect();

    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    if(newResults){
        $("#results").empty();
        resetSaturationForAllRects();
        newResults=false;
    }
    selectRect(mouseX, mouseY);

}
function getData(){

    init = true;
    
    document.getElementById('get_all').removeEventListener("click", getData);
    $("#get_all").toggleClass('b_off b_on');
    // $("#get_all").remove();
    $("#launcher").remove();

    $.ajax({                                      
        url: 'php/retrieve_data.php',       
        type: "POST",
        data: {case:10} 
    }).done(function(str) {

        // console.log(str);

        allData = str.split("%");
        numComposersInCapsules=0;

        //TO DEBUG AND CATCH ERROR
        // console.log(allData[0]);

        for (var i=0; i<allData.length-5; i+=6) {
            // var id = allData[i];
            var numTitles = allData[i+3];
            if(numTitles>0)numComposersInCapsules++;
        }

        var txt = "no selection — click a square to display a composer";
        $("#selection").empty().append('<p>');
        $("#selection p").append(txt);

        var num = allData.length / 6;
        var txt2 = numComposersInCapsules+ " / " + num + " composers with archived works";
        $("#info p:eq(0)").text(txt2);

        // construire l'index selon le champ "num of records >=" (defaut 1)
        var n = parseInt($('#numOfRecords').val());
        if(Number.isInteger(n) && n >= 1) processData002(n);
        else processData();
        updateCoverageNote(n);

    });
}
function processData002(numberMinOfParticipation){

    console.log("woot");

    canvas.removeEventListener("mousedown", getInfo, false);
    rectangles=[];

    calculateMinHeightAndCreateRectangles(1, numberMinOfParticipation);
    resetCanvasSize();   // reajuste la hauteur du canvas au contenu filtre
    drawRectanglesAndAddInteractivity();
}
function processData(){
    calculateMinHeightAndCreateRectangles(0, 0);
    resetCanvasSize();
    drawRectanglesAndAddInteractivity();
}
function drawRectanglesAndAddInteractivity(){
    context.fillStyle=COLORS[1];
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.stroke();

    resetPositions();

    for(var i=0; i<rectangles.length; i++){
        drawRect(rectangles[i].x, rectangles[i].y, rectangles[i].color);
    }

    resetPositions();

    // document.getElementById('anim').addEventListener("click", animation1) ;
    canvas.addEventListener("mousedown", getInfo, false);
}
//-----------------------------------//
//------------ animations -----------//
// (Le SMA — agents/compositeurs consultes regroupes par pays — vit desormais
//  dans js/overview_sma.js, moteur auto-contenu. Ne restent ici que la grille
//  de l'index et son animation de bruit.)
function noise_animation(){

    for(var i=0; i<rectangles.length; i++){

        if(!rectangles[i].anchor && rectangles[i].id != nAId){

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

            var lum=avg_lum;

            c += sat+'%,'+lum+'%)';

            rectangles[i].color = c;
            // console.log(c);

            drawRect(rectangles[i].x, rectangles[i].y, rectangles[i].color);
        } 
    }

    tNoise+=15;
}
//-----------------------------------//
//--------- interactivity -----------//

function filterData(){

    var year_01 = parseInt($('#year_01').val());
    var year_02 = parseInt($('#year_02').val());
    var numOfRecords = parseInt($('#numOfRecords').val());

    // console.log(year_01, year_02, numOfRecords);

    if(Number.isInteger(year_01) && Number.isInteger(year_02) && Number.isInteger(numOfRecords)){
        console.log("all three");
    } else if (Number.isInteger(year_01) && Number.isInteger(numOfRecords)){
        console.log("two of them");
    } else if (Number.isInteger(year_01)){
        console.log("year_01");
    } else if (Number.isInteger(numOfRecords)){
        if(numOfRecords>=0){ processData002(numOfRecords); updateCoverageNote(numOfRecords); }
    } else {
        processData002(0); updateCoverageNote(0);
    }

}

// La partie "this index is knowingly incomplete… participations are missing"
// ne concerne que la vue complete (tous les participants). On l'affiche seulement
// quand num of records == 0 ; au-dela (>0, on ne montre que les compositeurs ayant
// au moins une oeuvre), on la retire. Le reste du texte (1995) reste toujours la.
function updateCoverageNote(n){
    if(Number.isInteger(n) && n <= 0) $('#lg-incomplete').show();
    else $('#lg-incomplete').hide();
}

function getSearchTerms(){

    var terms = $('#searchTerms').val();

    // une recherche par nom repart d'un etat neutre : on reinitialise la fiche
    // du compositeur precedemment selectionne (boite orange + boite violette)
    $("#selection").empty().append('<p>no selection</p>');
    $("#titles").empty();

    if(terms==""){
        $("#results").empty();
        resetSaturation(avg_sat);
        newResults=false;
        return;
    }

    //-------- second query
    $.ajax({                                      
        url: 'php/retrieve_data.php',       
        type: "POST",
        data: { terms: terms, case:28 } 
    }).done(function(str) {

        $("#results").empty();

        if(str.indexOf("%")<0){

            $("#results").append('<p>');
            $("#results p").text("no result");

        } else{
    
            composers = str.split("%");

            var numOfElements = 3;

            if(composers.length<numOfElements+1){

                // console.log("one composer!");

                createComposersListing(numOfElements);

                showAndHighlightComposer(composers[0]);

            } else {

                createComposersListing(numOfElements);

                for (var j=0; j<rectangles.length; j++){
            
                    drawRect(rectangles[j].x, rectangles[j].y, rectangles[j].color);
                    
                }

            }         

        }
    });
}

//-------------//
function createComposersListing(num){

    var arr=[];

    for (var i = 0; i < composers.length; i+=num) {

        var count = -1;
        var id = composers[i];

        for (var j=0; j<allData.length-5; j+=6) {
            if(id===allData[j]){
                count=allData[j+3];
                break;
            }
        }

        var str ='<p>' + id + ' ' + composers[i+1] + ' ' + 
            composers[i+2] + ' ' + count + ' ' + '</p>';
        
        if(arr.length<1){
            arr.push([count, str]);
            // console.log(str);
        } else {

            for (var k=0; k<arr.length; k++) {

                if(parseInt(count)>=parseInt(arr[k][0])){
                    arr.splice(k, 0, [count, str]);
                    // arr.push([count, str]);
                    break;
                } else if(k===arr.length-1){
                    arr.push([count, str]);
                    break;
                }

            }

        }
        
    }

    for (var l=0; l<arr.length; l++) {
        $("#results").append(arr[l][1]);
    }

    $("#results p").click(function(evt) {
        var id = $(evt.target).text().split(' ')[0];
        showAndHighlightComposer(id);
    });

    // console.log(composers.length/num, arr.length);

}
// Surligne un compositeur issu de la recherche. S'il est absent de l'index
// actuellement dessine (ex. "faber 0" alors que num of records >= 1, donc filtre),
// on reconstruit l'index complet (num of records = 0) pour le rendre visible,
// puis on le surligne.
function showAndHighlightComposer(composerId){

    var present = false;
    for(var j=0; j<rectangles.length; j++){
        if(rectangles[j].id===composerId){ present = true; break; }
    }

    if(!present){
        $('#numOfRecords').val(0);
        processData002(0);
        updateCoverageNote(0);
    }

    editRectanglesColorBasedOnQueryWithComposerId(composerId);
}
function editRectanglesColorBasedOnQueryWithComposerId(composerId){

    for (var j=0; j<rectangles.length; j++){
        if(rectangles[j].id===composerId){
            drawRect(rectangles[j].x, rectangles[j].y, "yellow");
        } else {
            var c = rectangles[j].color;
            if(c.indexOf('50%,')>0)c=c.replace('50%,', '4%,');
            drawRect(rectangles[j].x, rectangles[j].y, c);
        }
    }

    newResults=true;
}