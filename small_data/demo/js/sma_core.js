//------------------------------------------------------------------
// sma_core.js — noyau partage du systeme multi-agents (SMA)
// Charge par euphonies.php, catalog.php et award-winning_works.php,
// avant childs_*.js, particles_*.js et le script propre a la page.
//------------------------------------------------------------------

//---- etat partage
var canvas, context;

var records = [];
var scale = 1;
var animation01;

var running=true;
var numberOfNodesOnDisplayMax = 200; //les pages peuvent surcharger cette valeur
var pointer001=0;
var particles=[];
var sl_attribute='';
var counter001=0;
var noiseField=true;
var attributes_count=[];
var attr_treshold=150;
var activationSpeed=1;
var counter002 = 0;
var strength_noise_field=10;
//-----------

//====================================================================
// GRILLE SPATIALE (hachage spatial) — accelere les passes de voisinage
//--------------------------------------------------------------------
// Objectif : remplacer les boucles O(n^2) (chaque agent teste TOUS les
// autres) par des requetes locales O(n). La grille decoupe le canvas en
// cellules carrees ; on n'inspecte que les cellules couvrant le rayon
// d'interaction, donc quelques voisins au lieu des ~400 agents.
//
// ISO-COMPORTEMENT : la grille ne fait que PRE-SELECTIONNER des candidats.
// Chaque passe applique ensuite EXACTEMENT la meme condition de distance
// qu'avant. Le rayon de requete est un majorant conservateur (rayon max
// courant + marge SMA_GRID_SLACK pour le deplacement d'un agent depuis la
// construction de la grille) -> l'ensemble des candidats est un SUR-ensemble
// des vrais voisins, et le filtrage exact redonne un resultat identique.
//--------------------------------------------------------------------
var SMA_USE_GRID = true;  //false = ancien parcours O(n^2) (pour comparaison/debug ; comportement identique)
var SMA_GRID_CELL = 80;   //taille d'une cellule (px). Reglage perf, sans effet sur le comportement.
var SMA_GRID_SLACK = 16;  //marge (px) de securite du rayon de requete. Couvre le deplacement
                          //intra-image d'un voisin deja mis a jour (<= maxSpeed*sqrt2 ~ 5.7px)
                          //avec une marge large -> l'ensemble des candidats reste un sur-ensemble
                          //strict des vrais voisins, resultat identique au parcours O(n^2).
var smaGrid = null;       //instance courante de SpatialGrid
var smaGridReady = false; //true uniquement en PHASE 2 (regroupement), quand la grille est fiable
var smaMaxRadius = 1;     //plus grand rayon parmi les agents (borne le rayon de requete)
var _smaScratch = [];     //tampon reutilise pour les resultats de requete (evite le GC)

function SpatialGrid(width, height, cellSize){
    this.cellSize = cellSize;
    this.cols = Math.max(1, Math.ceil(width/cellSize));
    this.rows = Math.max(1, Math.ceil(height/cellSize));
    this.cells = [];   //cells[cx + cy*cols] = tableau d'indices dans `particles`
}
SpatialGrid.prototype.build = function(items){
    this.cells = [];
    var cs = this.cellSize, cols = this.cols, rows = this.rows;
    for(var i=0; i<items.length; i++){
        var p = items[i];
        var cx = Math.floor(p.x/cs); if(cx<0)cx=0; else if(cx>=cols)cx=cols-1;
        var cy = Math.floor(p.y/cs); if(cy<0)cy=0; else if(cy>=rows)cy=rows-1;
        var k = cx + cy*cols;
        (this.cells[k] || (this.cells[k]=[])).push(i);
    }
};
//remplit `out` avec les indices des agents dont la cellule chevauche le
//disque (x,y,radius). `out` est vide au retour puis rempli ; renvoie `out`.
SpatialGrid.prototype.queryRadius = function(x, y, radius, out){
    out.length = 0;
    var cs = this.cellSize, cols = this.cols, rows = this.rows;
    var minCx = Math.floor((x-radius)/cs); if(minCx<0)minCx=0;
    var maxCx = Math.floor((x+radius)/cs); if(maxCx>=cols)maxCx=cols-1;
    var minCy = Math.floor((y-radius)/cs); if(minCy<0)minCy=0;
    var maxCy = Math.floor((y+radius)/cs); if(maxCy>=rows)maxCy=rows-1;
    for(var cy=minCy; cy<=maxCy; cy++){
        var rowBase = cy*cols;
        for(var cx=minCx; cx<=maxCx; cx++){
            var cell = this.cells[cx + rowBase];
            if(cell)for(var i=0; i<cell.length; i++)out.push(cell[i]);
        }
    }
    //ordre croissant : reproduit l'ordre de l'ancien parcours 0..n-1, donc
    //l'accumulation des forces (addition flottante, non associative) est
    //IDENTIQUE au bit pres. Bonus : simulation deterministe et reproductible.
    if(out.length>1)out.sort(function(a,b){return a-b;});
    return out;
};
//(re)construit la grille a partir de `particles` et met a jour smaMaxRadius.
//Appele une fois par image, au debut de chaque phase (positions = debut d'image).
function buildSMAGrid(){
    if(!canvas)return;
    if(!smaGrid || smaGrid.cellSize!==SMA_GRID_CELL
        || smaGrid.cols!==Math.max(1,Math.ceil(canvas.width/SMA_GRID_CELL))
        || smaGrid.rows!==Math.max(1,Math.ceil(canvas.height/SMA_GRID_CELL))){
        smaGrid = new SpatialGrid(canvas.width, canvas.height, SMA_GRID_CELL);
    }
    smaGrid.build(particles);
    var mr = 1;
    for(var i=0; i<particles.length; i++)if(particles[i].radius>mr)mr=particles[i].radius;
    smaMaxRadius = mr;
    smaGridReady = true;   //fiable a partir de maintenant (phase 2)
}
//====================================================================

//prepare le canvas et les controles communs (menu reset/pause, touche 'p')
function initSMA(w, h){

    canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');

    canvas.width = w*scale;
    canvas.height = h*scale;

    context.fillStyle=COLORS[0];
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.stroke();

    $(document).keypress(function(e) {

        if(e.which == 32) { //space bar
            // running=!running;
        } else if(e.which == 112){ //'p'
            noiseField =!noiseField;
            console.log('noiseField:', noiseField);
        }
    });

    $("#sma_main_ctrl ul").append('<li>reset</li>');
    $("#sma_main_ctrl ul").append('<li>pause</li>');

    $("#sma_main_ctrl ul li:first").css("text-decoration", "underline").on("click", resetAll);
    $("#sma_main_ctrl ul li:last").css("text-decoration", "underline").on("click", pauseSMA);

}

//lance la boucle d'animation et l'interaction au clic sur le canvas
function startSMA(){
    animation01=setInterval(sma_animation, 1000/30);
    document.getElementById('myCanvas').addEventListener("click", getParticleInfos);
    document.getElementById('myCanvas').addEventListener("dblclick", closeParticleOnDblClick);
}

//fermeture au double-clic : referme le cercle ouvert vise
function closeParticleOnDblClick(evt){

    var cv = canvas.getBoundingClientRect();

    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    for (var i=0; i<particles.length; i++) {

        if(particles[i].open && !particles[i].opening){

            var distance=dist(mouseX, particles[i].x, mouseY, particles[i].y);

            if(distance<=particles[i].radius*2){
                particles[i].openOrCloseIt();
                $("#cookies").empty().append('<p>'+ particles.length + ' nodes</p>');
                $("#titles").empty();
                removePreviousSelection();
                break;
            }
        }
    }
}

$.urlParam = function(name){
	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	if(results)return results[1];
}

function resetAll(){
    pointer001=0;
    particles=[];
    sl_attribute = "";
    attributes_count=[];
    $("#commons ul").empty();
    noiseField=true;
    $("#sma_main_ctrl ul li:last").text("pause");
    $("#selection").empty();
    $("#titles").empty();
}
function pauseSMA(event){
    noiseField =!noiseField;
    if(noiseField) $(event.target).text("pause");
    else $(event.target).text("play");
}

function getParticleInfos(evt){

    var cv = canvas.getBoundingClientRect();

    var mouseX = evt.clientX - cv.left;
    var mouseY = evt.clientY - cv.top;

    for (var i=0; i<particles.length; i++) {

        var distance=dist(mouseX, particles[i].x, mouseY, particles[i].y)
        if(distance<=particles[i].radius*2){

            var attrName = particles[i].targetedAttr;

            if(attrName.localeCompare("")===0)attrName="property";

            var txt= attrName + ": " + particles[i][particles[i].targetedAttr];
            $("#cookies").empty().append('<p>' + txt + '</p>');

            var txt_2 = particles[i].records.length+' elements';

            $("#selection").empty().append('<p>');
            $("#selection p").text(txt_2);

            if(particles[i].records.length>1){

                var child_targeted=false;
                if(particles[i].open){
                    child_targeted = particles[i].processChilds(mouseX, mouseY);
                }

                //le simple clic ouvre ; la fermeture se fait au double-clic
                if(!child_targeted && !particles[i].opening && !particles[i].open){
                    particles[i].openOrCloseIt();
                    $("#titles").empty();
                    removePreviousSelection();
                }

            } else if(particles[i].records.length===1){
                particles[i].getInfoFrom(particles[i].records[0]);
                removePreviousSelection();
                particles[i].lastNodeSelected=true;
            }

            break;
        }
    }
}
function removePreviousSelection(){
    for (var i = 0; i < particles.length; i++) {
        particles[i].lastNodeSelected=false;
        for (var j = 0; j < particles[i].childs.length; j++) {
            particles[i].childs[j].lastNodeSelected=false;
        }
    }
}
function shareInformation(){

    //PHASE 1 : pas de grille. Les agents bougent DEUX fois par image (deplacement
    //en ligne dans SearchCommons... puis updateBeforeMerging) et se "wrappent"
    //(checkEdgesV1) en cours d'image -> une grille figee en debut d'image
    //deviendrait incoherente. Le cout O(n^2) reste faible ici : les agents sont
    //ajoutes un par image, donc n est petit tant qu'on est en phase 1.
    smaGridReady = false;

    for (var i=0; i<particles.length; i++) {

        if(noiseField){
            particles[i].addNoiseField(strength_noise_field);

            var attributes = particles[i].SearchCommonsAttrAndGetAwayFrom(particles, i);

            var numOfCommonAttr = Object.keys(attributes).length;
            if(numOfCommonAttr>0)checkAttributes(attributes);

        }

        //les gris se separent aussi en PHASE 1 (meme logique qu'en phase 2),
        //sinon ils restent agglutines tant qu'aucun groupement n'est choisi.
        if(particles[i].records.length===1)particles[i].separateFromLoners(i, particles);

        particles[i].checkEdgesV1();

        particles[i].updateBeforeMerging();

        particles[i].display();

    }

}
function checkAttributes(attributes){

    for (var i = 0; i < Object.getOwnPropertyNames(attributes).length; i++) {

        var attr_name = Object.getOwnPropertyNames(attributes)[i];
        var value = attributes[Object.getOwnPropertyNames(attributes)[i]];

        if(value>0){

            if(attributes_count.length<1){
                attributes_count.push({name:attr_name, count:parseInt(value)});
            } else {

                var hasBeenFound = false;

                for (var j = 0; j < attributes_count.length; j++) {

                    var obj = attributes_count[j];

                    if(attr_name.localeCompare(obj.name)===0){

                        obj.count += value;
                        hasBeenFound = true;
                        break;
                    }
                }

                if(!hasBeenFound){
                    attributes_count.push({name:attr_name, count:parseInt(value)});
                }
            }
        }
    }

    var str = "";
    $("#calculations ul").empty();

    for (var i = 0; i < attributes_count.length; i++) {
        var obj = attributes_count[i];

        if(obj.count>attr_treshold && obj.onMenu!==true){
            $("#commons ul").append("<li>" + obj.name + "</li>");
            $("#commons ul li:last").on("click", setCommonAttr).css("text-decoration", "underline");
            attributes_count[i].onMenu = true;
        } else if (obj.onMenu!==true){
            $("#calculations ul").append("<li>" + obj.name + " ("+ obj.count + ")</li>");
        }

    }

}
function setCommonAttr(event){

    var attr = event.target.innerText;

    $("#cookies").empty().append('<p>property: '+ attr + '</p>');
    $("#selection").empty();
    $("#titles").empty();

    if(sl_attribute.localeCompare("")==0){ //first choice
        $(event.target).css("font-weight", "bold");
        sl_attribute = attr;
    } else {
        $("#commons ul li").css("font-weight", "normal");
        $(event.target).css("font-weight", "bold");
        sl_attribute="";
        breakConnections();
        sl_attribute = attr;
    }

}
function breakConnections(){

    var arrayLength = particles.length;

    for (var i = 0; i < arrayLength; i++) {

        if(particles[i].records.length>1){

            for (var j=particles[i].records.length-1; j>0; j--) {
                particles.push(createNewParticle(particles[i].records.pop()));
            }

            particles[i].resetIt();
        }
    }

}
function sma_animation(){

    //add progressively particles
    if(pointer001<records.length && running
        && particles.length<numberOfNodesOnDisplayMax && noiseField){
        addParticleUsing(pointer001);
    }

    resetSMACanvas();

    //first state --> nodes are sharing information
    if(sl_attribute.localeCompare("")==0){
        shareInformation();
    //second state --> nodes are regrouping
    } else {

        //activate progressively particles
        if(counter001%activationSpeed===0 && particles.length>0){
            var id = counter002%particles.length;
            particles[id].targetedAttr=sl_attribute;
            particles[id].on=true;
            counter002++;
        }

        allowGrouping();
    }

    if(running)counter001++;

}
function allowGrouping(){

    buildSMAGrid();   //grille reconstruite en debut de phase (positions = debut d'image)

    for (var i=0; i<particles.length; i++) {
        //une particule ouverte (jaune) n'est plus agitee par le champ de bruit :
        //elle se stabilise pour qu'on puisse cliquer sur ses membres.
        //en phase de regroupement, l'agitation est reduite de moitie : les gris
        //sans partenaire derivent au lieu de s'agiter
        if(noiseField && !particles[i].open)particles[i].addNoiseField(strength_noise_field*.5);
        particles[i].update(i, particles);
        particles[i].display();
    }
    removeDeadParticles();
}
function removeDeadParticles(){
    for (var i=particles.length-1; i>=0; i--) {
        if(particles[i].records.length<1){
            particles.splice(i, 1);
        }
    }
}
function addParticleUsing(i){

    particles.push(createNewParticle(records[i]));

    pointer001++;

    var txt=particles.length+' nodes '+ parseInt(pointer001 / records.length*100)+'%';
    $("#cookies").empty().append('<p>');
    $("#cookies p").text(txt);

}

//cree une particule a partir d'un enregistrement :
//toutes les proprietes de l'enregistrement sont copiees telles quelles
function createNewParticle(obj){

    var params = {
        canvasId: "myCanvas",
        radius_to_add: 1.*scale,
        x:Math.random()*canvas.width,
        y:Math.random()*canvas.height,
        scale: scale
    };

    for (var key in obj) {
        if (obj.hasOwnProperty(key)) params[key] = obj[key];
    }

    return new Particle(params);
}

function resetSMACanvas(){
    context.fillStyle=COLORS[0];
    context.fillRect(0, 0, canvas.width, canvas.height);
}
