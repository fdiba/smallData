function LineChart(config){

    this.w = 1200;
    this.h = 600;

    this.canvas = document.getElementById(config.canvasId);
    this.context = this.canvas.getContext("2d");

    this.minY = config.minY;
    this.maxX = config.maxX;
    this.maxY = config.maxY;
    this.unitsPerTickX = config.unitsPerTickX;
    this.unitsPerTickY = config.unitsPerTickY;

    this.cleared=true;

    this.data=[];

    this.minYear = config.minYear;
    this.maxYear = config.maxYear;

    this.lg_btns=[];
    this.solo_btns=[];
    this.numSolos=0;
    this.bWidth=10;

    this.lines=[];

    this.colors=["#bdc3c7", "#4aa3df", "#2ecc71", "#16a085"];
    //grey: silver, blue: peter river, emerald: green, green sea: dark green

    //couleurs attribuees aux pays surlignes (une par pays)
    //pas de bleu ici : les lignes de base non surlignees sont deja bleues (this.colors[1])
    this.soloColors=["#e74c3c", "#2aa42a", "#dc6791", "#c98500",
                     "#1aa876", "#e06a36", "#9085e9", "#f5b041"];

    this.padding = 10;
    this.tickSize = 10;
    this.axisColor = "#8fa3b0";
    this.pointRadius = 2;
    this.font = "12pt Calibri";

    this.fontHeight = 12;

    this.rangeX = this.maxX - this.minY;
    this.rangeY = this.maxY - this.minY;
    this.numXTicks = Math.round(this.rangeX / this.unitsPerTickX);
    this.numYTicks = Math.round(this.rangeY / this.unitsPerTickY);
    this.x = this.getLongestValueWidth() + this.padding * 2;
    this.y = this.padding * 2;
    this.width = this.w - this.x - this.padding * 2;
    this.height = this.h - this.y - this.padding - this.fontHeight;
    this.scaleX = this.width / this.rangeX;
    this.scaleY = this.height / this.rangeY;

    this.sl_ctry="";

    this.hoverIdx=-1;   //index de la ligne actuellement survolee (-1 = aucune)
    this.hl=[];         //surbrillance ANIMEE par ligne (0 = bleu/arriere-plan, 1 = jaune/avant)
    this._hoverAnimating=false;
    //lignes selectionnees au clic : chacune {ctryId, yearId}. L'ordre = ordre des
    //clics -> couleur attribuee (clickColor). Clic dans le vide = on vide ce tableau.
    this.selectedLines=[];

    this.resetCanvas();
    this.drawXAxis();
    this.drawYAxis();

}
//position verticale d'une valeur, en echelle racine carree :
//dilate le bas de l'axe pour que les pays a faibles effectifs restent lisibles
LineChart.prototype.yPos = function(value){
    if(this.maxY<=0)return this.y + this.height;
    var f = Math.sqrt(value / this.maxY);
    return this.y + this.height - f * this.height;
};
LineChart.prototype.resetCanvas = function(){
    this.context.fillStyle = "#2c3e50";
    this.context.fillRect(0, 0, this.w, this.h);
}
LineChart.prototype.requestData = function(mouseX, mouseY){

    // Ligne ciblee = celle actuellement survolee (en jaune) si elle est visible,
    // sinon la plus proche du curseur.
    var i = (this.hoverIdx>=0 && this.isVisible(this.hoverIdx))
            ? this.hoverIdx : this.findNearestLine(mouseX, mouseY);

    // On ne considere le clic "SUR une ligne" que s'il est assez proche d'elle
    // (survolee, ou a <=20px). Sinon c'est un clic dans l'espace VIDE entre lignes.
    var onLine = (i>=0) && (this.hoverIdx===i || this.distanceToLine(i, mouseX, mouseY) <= 20);

    if(onLine){

        // annee (point non saute) la plus proche SUR cette ligne
        var arr=this.data[i].arr, bj=-1, bd=1e9;
        for (var j=0; j<arr.length; j++){
            if(this.minYear + j === 1995) continue;
            var px=j*5*this.scaleX + this.x, py=this.yPos(arr[j]);
            var d=dist(px, mouseX, py, mouseY);
            if(d<bd){ bd=d; bj=j; }
        }

        if(bj>=0){
            this.sl_ctry = this.data[i].ctry;
            var year  = parseInt(bj) + this.minYear;
            var value = parseInt(this.data[i].arr[bj]);
            var cId   = parseInt(this.data[i].cId);

            // deja coloree -> on deplace seulement son point ; sinon on l'AJOUTE
            // (elle prend la prochaine couleur de la palette de clic).
            var k=this.selectedIndexOf(i);
            if(k>=0) this.selectedLines[k].yearId=bj;
            else     this.selectedLines.push({ctryId:i, yearId:bj});

            this.cleared=false;
            this.redrawLineChart();                    // redessine tout + les points colores
            this.retrieveData(cId, year, value);
            return;
        }
    }

    // clic dans le vide (entre les lignes) -> on DECOLORE toutes les lignes
    if(this.selectedLines.length){
        this.selectedLines=[];
        this.cleared=true;
        this.redrawLineChart();
    }
}
LineChart.prototype.retrieveData = function(cId, year, value){

    var sl_ctry=this.sl_ctry;
    
    $.ajax({                                      
        url: 'php/retrieve_data.php',       
        type: "POST",
        data: { cId: cId, year:year, value:value, case:0 } 
    }).done(function(str) {

        var arr=str.split("%");
        composers=[];

        for (var i=0; i<arr.length-3; i+=4) {
            composers.push({id:arr[i], fn:arr[i+1], n:arr[i+2], y:arr[i+3]});
        }

        getNumComposersInCapsulesAndTitles(cId, year, composers);

        editTitleInfo(sl_ctry, year, value, composers.length, yearSelection);
        displayCpInfos();

    });
}
LineChart.prototype.editData = function(mouseX, mouseY){

    var bWidth=this.bWidth;
    var solos=this.solo_btns;

    // option "reset" en tete de la liste : remet tous les pays a l'etat par defaut
    if(this.resetBtn && mouseX>=this.resetBtn.x && mouseX<=this.resetBtn.x+this.resetBtn.w
        && mouseY>=this.resetBtn.y && mouseY<=this.resetBtn.y+this.resetBtn.h){
        this.resetCountries();
        return;
    }

    // UN SEUL bouton par pays : l'activer n'affiche QUE les pays actives (les autres
    // deviennent invisibles) ; le desactiver revient a tout afficher si plus aucun
    // n'est actif. Les lignes restent toujours bleues (pas de couleur specifique).
    for (var i=0; i<solos.length; i++) {
        if(mouseX>=solos[i].x && mouseX<=solos[i].x+bWidth && mouseY>=solos[i].y && mouseY<=solos[i].y+bWidth){
            solos[i].state = !solos[i].state;
            this.numSolos += solos[i].state ? 1 : -1;
            // le rang (donc la couleur) des pays actifs suivants change : on
            // redessine tous les carres du menu pour garder carre <-> ligne coherents
            this.refreshLegendButtons();
            this.redrawLineChart();
            break;
        }
    }
}
//un pays est VISIBLE s'il est actif, ou si aucun pays n'est actif (etat par defaut = tout affiche)
LineChart.prototype.isVisible = function(i){
    return this.numSolos>0 ? !!(this.solo_btns[i] && this.solo_btns[i].state) : true;
};
// palette categorielle "flat-UI" accordee a l'application (turquoise, bleu,
// amethyste, carotte, alizarine, emeraude, vert-mer, citrouille, wisteria,
// bleu-belize, grenade, nephritis). Le JAUNE (#f1c40f) est reserve au survol /
// point selectionne : on ne le met pas dans la palette pour eviter la confusion.
LineChart.prototype.soloPalette = ["#1abc9c","#3498db","#9b59b6","#e67e22","#e74c3c",
                                   "#2ecc71","#16a085","#d35400","#8e44ad","#2980b9",
                                   "#c0392b","#27ae60"];
// couleur attribuee a un pays ACTIVE via le menu (isolement) : couleur stable,
// selon son rang parmi les pays actifs (ordre des donnees). null hors mode solo.
LineChart.prototype.soloColor = function(i){
    if(this.numSolos<=0 || !this.solo_btns[i] || !this.solo_btns[i].state) return null;
    var rank=0;
    for (var k=0;k<i;k++){ if(this.solo_btns[k] && this.solo_btns[k].state) rank++; }
    return this.soloPalette[rank % this.soloPalette.length];
};
// redessine les carres du menu avec la couleur attribuee a chaque pays actif
// (gris si inactif) -> le carre du menu et sa ligne partagent la meme couleur.
LineChart.prototype.refreshLegendButtons = function(){
    var ctx=this.context, bWidth=this.bWidth;
    for (var i=0;i<this.solo_btns.length;i++){
        var col=this.soloColor(i) || this.colors[1];
        this.drawRectangle(ctx, this.solo_btns[i], bWidth, col);
    }
};
// palette des lignes SELECTIONNEES AU CLIC. Meme famille que la palette du menu
// mais SANS bleu (les lignes non selectionnees sont deja bleues, this.colors[1]) :
// une ligne cliquee doit se distinguer du bleu par defaut.
LineChart.prototype.clickPalette = ["#1abc9c","#9b59b6","#e67e22","#e74c3c","#2ecc71",
                                    "#16a085","#d35400","#8e44ad","#c0392b","#27ae60"];
LineChart.prototype.clickColor = function(k){ return this.clickPalette[k % this.clickPalette.length]; };
// rang d'un pays dans les lignes cliquees (ordre des clics), ou -1 si non selectionne
LineChart.prototype.selectedIndexOf = function(ctryId){
    for (var k=0;k<this.selectedLines.length;k++){ if(this.selectedLines[k].ctryId===ctryId) return k; }
    return -1;
};
// couleur de base d'une ligne. PRIORITE au menu : une ligne affichee via le menu
// d'isolement garde SA couleur de legende (le carre du menu et la ligne doivent
// rester coherents). La couleur de CLIC ne s'applique donc qu'aux lignes NON
// isolees par le menu ; sinon bleu par defaut.
LineChart.prototype.baseColor = function(idx){
    var menu=this.soloColor(idx);
    if(menu) return menu;                       // ligne du menu -> code couleur de la legende
    var k=this.selectedIndexOf(idx);
    if(k>=0) return this.clickColor(k);         // ligne coloree au clic (hors menu)
    return this.colors[1];                       // bleu par defaut
};
LineChart.prototype.redrawLineChart = function(){
    
    this.resetCanvas();
    this.drawXAxis();
    this.drawYAxis();


    var data=this.data;
    var hl=this.hl || (this.hl=[]);
    var YELLOW="#f1c40f", BLUE=this.colors[1];

    // niveau de surbrillance global (0 = aucun survol) : sert a attenuer les autres
    var anyHl=0;
    for (var i=0;i<data.length;i++){ var v=hl[i]||0; if(v>anyHl)anyHl=v; }

    // Ordre de dessin (du fond vers le dessus) : lignes bleues par defaut EN DESSOUS,
    // puis les lignes COLOREES (clic ou menu) par-dessus, puis la ligne SURVOLEE tout
    // en haut. Cle continue = (coloree?1:0) + 2*hl : le survol (hl->1) domine, et a
    // survol egal une ligne coloree passe devant une bleue.
    var self=this;
    function zKey(i){
        var colored = (self.soloColor(i) || self.selectedIndexOf(i)>=0) ? 1 : 0;
        return colored + 2*(hl[i]||0);
    }
    var order=[];
    for (var i=0;i<data.length;i++){ if(this.isVisible(i))order.push(i); }
    order.sort(function(a,b){ return zKey(a)-zKey(b); });

    for (var o=0;o<order.length;o++){
        var idx=order[o];
        var h=hl[idx]||0;                          // 0..1 (surbrillance animee)
        // couleur de base : couleur de clic si la ligne est selectionnee, sinon
        // couleur d'isolement du menu, sinon bleu. Vire au jaune au survol (fondu).
        var base=this.baseColor(idx);
        var color=lerpHexColor(base, YELLOW, h);
        var alpha=1 - 0.7*(anyHl - h);             // les autres lignes visibles s'attenuent au survol
        if(alpha<0)alpha=0; else if(alpha>1)alpha=1;
        this.context.globalAlpha=alpha;
        // les lignes SELECTIONNEES au clic sont legerement plus epaisses
        var lw=(this.selectedIndexOf(idx)>=0) ? 2 : 1;
        this.drawLine(data[idx], color, lw, false);
    }
    this.context.globalAlpha=1;

    // un cercle par ligne SELECTIONNEE au clic : couleur de clic de la ligne
    // (jaune au survol, en fondu), cercle blanc, redessine a chaque frame -> persiste.
    for (var s=0; s<this.selectedLines.length; s++){
        var sel=this.selectedLines[s], sd=data[sel.ctryId];
        if(!sd || !this.isVisible(sel.ctryId)) continue;
        var sx=sel.yearId*5*this.scaleX + this.x;
        var sy=this.yPos(sd.arr[sel.yearId]);
        var shl=hl[sel.ctryId]||0;
        var sbase=this.baseColor(sel.ctryId);      // meme couleur que sa ligne (clic OU menu)
        var ctx=this.context;
        ctx.lineWidth=2;
        ctx.strokeStyle="#ecf0f1";
        ctx.fillStyle=lerpHexColor(sbase, YELLOW, shl);
        ctx.beginPath();
        ctx.arc(sx, sy, this.pointRadius*2, 0, 2*Math.PI);
        ctx.stroke();
        ctx.fill();
        ctx.closePath();
    }
}
LineChart.prototype.getLongestValueWidth = function(){

    this.context.font = this.font;
    var longestValueWidth = 0;
    for (var n = 0; n <= this.numYTicks; n++) {
        var value = this.maxY - (n * this.unitsPerTickY);
        longestValueWidth = Math.max(longestValueWidth, this.
        context.measureText(value).width);
    }
    return longestValueWidth;
};

LineChart.prototype.drawXAxis = function(){

    // console.log(this.x);

    var ctx = this.context;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.height);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.strokeStyle = this.axisColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // draw tick marks
    for (var n = 0; n < this.numXTicks; n++) {
        ctx.beginPath();
        ctx.moveTo((n + 1) * this.width / this.numXTicks + this.x, this.y + this.height);
        ctx.lineTo((n + 1) * this.width / this.numXTicks + this.x, this.y + this.height - this.tickSize);
        ctx.stroke();
    }

    // draw labels
    ctx.font = this.font;
    ctx.fillStyle = "#ecf0f1";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    var yOffset=3;

    for (var i=0; i<=this.numXTicks; i++) {
        var label = i + this.minYear;
        var str = label.toString().substring(2, 4);
        ctx.save();
        ctx.translate(i*this.width / this.numXTicks + this.x, this.y + this.height + this.padding);
        ctx.fillText(str, 0, yOffset);
        ctx.restore();
    }
    ctx.restore();

};

LineChart.prototype.drawYAxis = function(){

    var ctx = this.context;
    ctx.save();
    context.save();
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x, this.y + this.height);
    ctx.strokeStyle = this.axisColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    //graduations rondes, placees selon l'echelle racine carree
    var niceValues = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    var ticks = [];
    for (var i = 0; i < niceValues.length; i++) {
        if(niceValues[i] < this.maxY)ticks.push(niceValues[i]);
    }
    ticks.push(this.maxY);

    ctx.font = this.font;

    for (var n = 0; n < ticks.length; n++) {

        var y = this.yPos(ticks[n]);

        //ligne de grille discrete sur toute la largeur
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.beginPath();
        ctx.moveTo(this.x, y);
        ctx.lineTo(this.x + this.width, y);
        ctx.stroke();

        //graduation
        ctx.strokeStyle = "#8fa3b0";
        ctx.beginPath();
        ctx.moveTo(this.x, y);
        ctx.lineTo(this.x + this.tickSize, y);
        ctx.stroke();

        //valeur
        ctx.fillStyle = "#ecf0f1";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(ticks[n], this.x - this.padding, y);
    }
    ctx.restore();

};
LineChart.prototype.drawRectangle = function(ctx, btn, bWidth, color){
    if(!btn.state)color=this.colors[0];
    ctx.strokeStyle = "rgba(236, 240, 241, 0.6)";
    ctx.strokeRect(btn.x, btn.y, bWidth, bWidth)
    ctx.fillStyle = color;
    ctx.fillRect(btn.x, btn.y, bWidth, bWidth);
}
//remet tous les pays a l'etat par defaut : tous affiches, aucun surligne (solo)
LineChart.prototype.resetCountries = function(){
    var ctx=this.context, bWidth=this.bWidth;
    for (var i=0; i<this.solo_btns.length; i++){
        this.solo_btns[i].state=false;
        this.drawRectangle(ctx, this.solo_btns[i], bWidth, this.colors[1]); //inactif -> gris
    }
    this.numSolos=0;
    this.hoverIdx=-1;
    if(this.hl)for (var i=0; i<this.hl.length; i++)this.hl[i]=0;
    this.redrawLineChart();
};
LineChart.prototype.drawLegend = function(){

    var arr = this.data;
    var ctx = this.context;
    var xPos = 1255, yPos = 42;   // decale pour laisser la place a l'option "reset" en haut

    ctx.font = this.font;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    // option cliquable "reset" en tete de la liste des pays
    ctx.fillStyle = "#f1c40f";
    ctx.fillText("reset all", xPos-38, 18);
    this.resetBtn = {x: xPos-38, y: 6, w: 120, h: 22};

    ctx.fillStyle = "#ecf0f1";

    var bWidth=this.bWidth;

    for (var i=0; i<arr.length; i++) {

        // un seul carre par pays : le bouton d'isolement (toujours bleu)
        this.solo_btns.push({x:xPos-22, y:yPos-6, state:false});
        var solo = this.solo_btns[this.solo_btns.length-1];
        this.drawRectangle(ctx, solo, bWidth, this.colors[1]);

        ctx.fillStyle = "#ecf0f1";

        var ctry_id=arr[i].cId;
        var counts=' '+numCpByCountry[ctry_id].c+'/'+numCpByCountry[ctry_id].t;
        var str=arr[i].ctry+counts;

        //tronque les noms trop longs (Bosnia Herzegovina...) pour ne pas
        //deborder sur la colonne suivante ; les compteurs restent visibles
        var maxTextWidth = 158;
        if(ctx.measureText(str).width > maxTextWidth){
            var name=arr[i].ctry;
            while(name.length>1 && ctx.measureText(name+'\u2026'+counts).width > maxTextWidth){
                name=name.slice(0, -1);
            }
            str=name+'\u2026'+counts;
        }

        ctx.fillText(str, xPos, yPos);
        
        yPos+=15;
        if(yPos>this.h-15){
            yPos = 20;
            xPos += 205;
        }
    }
}
LineChart.prototype.drawLine = function(obj, color, strokeWidth, init){

    if(init)this.data.push(obj);

    var arr = obj.arr;

    var points=[];

    var ctx = this.context;

    var xOffset = this.x;
    var yOffset = this.y + this.height;

    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.beginPath();

    var xPos, yPos;
    xPos=0;
    
    for (var i=0; i<arr.length; i++) {

        yPos = arr[i];

        var x=xPos*this.scaleX+xOffset;
        var y=this.yPos(yPos);

        //1995 : le concours n'a pas eu lieu cette annee-la.
        //On garde la graduation "95" sur l'axe (dessinee par drawXAxis)
        //mais la ligne saute ce point et relie directement 1994 a 1996
        //(pas de chute a zero). Le point reste dans le tableau, marque
        //"skip", pour ne pas decaler la correspondance index <-> annee.
        if(this.minYear + i === 1995){
            points.push({x: x, y:y, skip:true});
            xPos += 5;
            continue;
        }

        if(i===0){
            ctx.beginPath();
            ctx.moveTo(x, y);
        }

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.closePath();

        points.push({x: x, y:y});

        ctx.beginPath();
        ctx.arc(x, y, this.pointRadius, 0, 2*Math.PI);
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(x, y);

        xPos += 5;

    }
    // (this.lines n'est plus utilise : la detection au clic/survol recalcule
    //  la geometrie a partir des donnees, ce qui evite une fuite memoire)
};

//interpolation de couleur (hex -> hex) pour le fondu progressif du survol
function hexToRgb(h){
    h=(''+h).replace('#','');
    if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    return {r:parseInt(h.substr(0,2),16), g:parseInt(h.substr(2,2),16), b:parseInt(h.substr(4,2),16)};
}
function lerpHexColor(a, b, t){
    var ca=hexToRgb(a), cb=hexToRgb(b);
    return 'rgb(' + Math.round(ca.r+(cb.r-ca.r)*t) + ',' +
                    Math.round(ca.g+(cb.g-ca.g)*t) + ',' +
                    Math.round(ca.b+(cb.b-ca.b)*t) + ')';
}
//distance d'un point (px,py) au segment [a,b] — pour detecter la ligne survolee
function distToSegment(px, py, ax, ay, bx, by){
    var dx=bx-ax, dy=by-ay;
    var len2=dx*dx + dy*dy;
    var t = len2 ? ((px-ax)*dx + (py-ay)*dy)/len2 : 0;
    if(t<0)t=0; else if(t>1)t=1;
    var cx=ax + t*dx, cy=ay + t*dy;
    var ex=px-cx, ey=py-cy;
    return Math.sqrt(ex*ex + ey*ey);
}
//trouve la ligne (pays) la plus proche du curseur, -1 si aucune assez proche
LineChart.prototype.findNearestLine = function(mouseX, mouseY){
    var data=this.data;
    var best=-1, bestDist=14;   //seuil de proximite (px)
    for (var i=0; i<data.length; i++){
        if(!this.isVisible(i)) continue;   //on ne survole que les lignes affichees
        var arr=data[i].arr, pts=[];
        for (var j=0; j<arr.length; j++){
            if(this.minYear + j === 1995) continue; //segment 1994->1996 direct
            pts.push({x: j*5*this.scaleX + this.x, y: this.yPos(arr[j])});
        }
        if(pts.length===1){
            var d0=dist(pts[0].x, mouseX, pts[0].y, mouseY);
            if(d0<bestDist){ bestDist=d0; best=i; }
        }
        for (var k=0; k<pts.length-1; k++){
            var d=distToSegment(mouseX, mouseY, pts[k].x, pts[k].y, pts[k+1].x, pts[k+1].y);
            if(d<bestDist){ bestDist=d; best=i; }
        }
    }
    return best;
};
//distance minimale du curseur a la ligne (pays) i
LineChart.prototype.distanceToLine = function(i, mouseX, mouseY){
    var arr=this.data[i].arr, pts=[];
    for (var j=0; j<arr.length; j++){
        if(this.minYear + j === 1995) continue;
        pts.push({x: j*5*this.scaleX + this.x, y: this.yPos(arr[j])});
    }
    if(pts.length===1) return dist(pts[0].x, mouseX, pts[0].y, mouseY);
    var best=1e9;
    for (var k=0; k<pts.length-1; k++){
        var d=distToSegment(mouseX, mouseY, pts[k].x, pts[k].y, pts[k+1].x, pts[k+1].y);
        if(d<best)best=d;
    }
    return best;
};
//survol : met en avant la ligne la plus proche et attenue les autres.
//HYSTERESIS : tant que le curseur reste assez proche de la ligne deja survolee
//(seuil de relachement > seuil d'accroche), on la garde. Sans ca, dans les zones
//denses (nombreuses lignes plates en bas), la ligne survolee sauterait d'une a
//l'autre a chaque pixel et l'ensemble clignoterait.
LineChart.prototype.hover = function(mouseX, mouseY){
    if(this.hoverIdx>=0 && this.isVisible(this.hoverIdx)){
        if(this.distanceToLine(this.hoverIdx, mouseX, mouseY) <= 24) return; //on garde la ligne courante
    }
    var idx=this.findNearestLine(mouseX, mouseY);
    if(idx !== this.hoverIdx){
        this.hoverIdx=idx;
        this.startHoverAnim();   //transition progressive (couleur + opacite)
    }
};
LineChart.prototype.clearHover = function(){
    if(this.hoverIdx !== -1){
        this.hoverIdx=-1;
        this.startHoverAnim();   //retour progressif au bleu / premier plan
    }
};
//fondu progressif de la surbrillance, image par image : chaque ligne fait evoluer
//sa valeur hl (0..1) vers sa cible (1 si survolee, 0 sinon). hl pilote a la fois
//la COULEUR (bleu<->jaune) et l'OPACITE (avant-plan<->arriere-plan) dans redraw.
LineChart.prototype.startHoverAnim = function(){
    if(this._hoverAnimating) return;
    this._hoverAnimating=true;
    var self=this;
    function step(){
        var settled=self.stepHoverAnim();
        self.redrawLineChart();
        if(settled) self._hoverAnimating=false;
        else requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
};
LineChart.prototype.stepHoverAnim = function(){
    if(!this.hl)this.hl=[];
    var settled=true;
    for (var i=0; i<this.data.length; i++){
        var target=(i===this.hoverIdx) ? 1 : 0;
        var cur=this.hl[i]||0;
        var diff=target-cur;
        if(Math.abs(diff)>0.01){ this.hl[i]=cur + diff*0.2; settled=false; }
        else this.hl[i]=target;
    }
    return settled;
};