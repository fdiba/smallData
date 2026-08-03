//------------------------------------------------------------------
// overview_sma.js — SMA de la page Overview (index.php)
//
// Moteur inspire de catalog (particles_catalog.js / sma_core.js) : chaque
// agent GRIS erre dans un champ de bruit ; les agents d'un MEME PAYS se
// rejoignent et FUSIONNENT en un groupe VERT portant le nom du pays.
//
// Differences volontaires avec le SMA de catalog :
//   - alimente par les COMPOSITEURS CONSULTES (un agent par clic sur un
//     carre de l'index), et non par un jeu de donnees pre-charge ;
//   - regroupement FIXE par pays (targetedAttr = "country") : PAS de phase 1
//     (« partage d'information »), les agents se regroupent directement ;
//   - PAS d'ouverture des groupes verts (pas d'etat jaune, pas de membres
//     bleus) : on ne peut pas cliquer un vert pour l'ouvrir ;
//   - petit canvas (#sma), vitesses/bruit adaptes.
//
// Auto-contenu (IIFE) : n'expose que window.OverviewSMA et n'entre donc pas
// en collision avec overview.js, qui utilise deja les globals canvas /
// context / particles / animation01 / Particle, etc.
//------------------------------------------------------------------
(function(global){
    "use strict";

    //==================================================================
    // Reglages (repris de particles_catalog.js, adaptes au petit canvas).
    //==================================================================
    var GREY_NOISE      = .35;   //agitation des gris (1 = comme les autres)
    var COLL_GAIN       = .4;    //masse ajoutee par voisin en contact / image
    var COLL_DECAY      = .94;   //resorption de la masse de collision / image
    var COLL_MAX        = 6;     //plafond de masse (anti-gel)
    var COLL_MARGIN     = 10;    //portee de detection d'un contact
    var GREY_REPULSION  = .1;    //repulsion douce gris <-> groupe non compatible
    var AVOID_STRENGTH  = 1.4;   //force d'evitement anticipe des groupes
    var GROUP_REPULSION = .2;    //separation entre groupes non compatibles
    var GROUP_MARGIN    = 18;    //respiration entre groupes (petit canvas : reduit)
    var MERGE_CREEP     = .4;    //vitesse min garantie vers le partenaire de fusion
    var MASS_PRIORITY   = 1;     //le lourd va tout droit, le leger contourne
    var BORDER_PUSH     = .03;   //coussin de bord pour les groupes
    var WRAP_MARGIN     = 30;    //distance hors-champ avant reapparition d'un gris
    var MERGE_MASS_EXP  = 0;     //compensation de masse de l'attraction (0 = organique)

    var STRENGTH_NOISE  = 10;    //force du champ de bruit (comme catalog ; *.5 en boucle)
    var MAX_SPEED       = 2.5;   //vitesse max d'un agent (catalog = 4 sur grand canvas)
    var CANVAS_W        = 350;   //largeur imposee (identique a l'ancien SMA de trace)
    var BG              = "#ecf0f1";  //fond clair du petit canvas

    //--- tailles : un GRIS n'est JAMAIS plus gros qu'un VERT ---
    var GREY_MAX_R      = 5;     //rayon max d'un gris (isole)
    var GREY_WORK_SCALE = 8;     //echelle de saturation du terme "nombre d'oeuvres" des gris
    var GREEN_BASE      = 5.5;   //rayon de base d'un vert (groupe de 2 ~7.5 > GREY_MAX_R)

    //==================================================================
    // Etat du module
    //==================================================================
    var cv = null, ctx = null;
    var particles = [];
    var records = [];        //file d'attente des compositeurs a faire apparaitre
    var pointer = 0;
    var scale = 1;
    var noiseField = true;
    var running = true;
    var anim = null;

    var seenIds = {};        //dedup : un meme compositeur n'est ajoute qu'une fois
    var countryCount = {};   //pays distincts consultes (pour le compteur)
    var consulted = 0;

    function dist(x1, x2, y1, y2){ var a = x1 - x2, b = y1 - y2; return Math.sqrt(a*a + b*b); }

    //==================================================================
    // Particle — un agent (compositeur consulte) ; fusionne par pays.
    //==================================================================
    function Particle(config){

        this.canvas = cv;
        this.context = ctx;

        this.country = config.country;   //valeur ciblee ET etiquette (nom de pays)
        this.fn = config.fn;
        this.ln = config.ln;
        this.id = config.id;
        this.count = config.count;

        this.records = [{country: this.country, fn: this.fn, ln: this.ln,
                         id: this.id, count: this.count}];

        //gris, vert emeraude, (jaune/bleu inutilises ici), bleu nuit (selection)
        this.colors = ["#bdc3c7", "#2ecc71", "#f1c40f", "#3498db", "#2C3E50"];

        this.x = config.x;
        this.y = config.y;

        this.scale = scale;
        this.radVar = Math.random()*2;
        this.radius_to_add = 1.*scale;
        this.radius = this.setSmallRadius();

        this.velocity = {x:0, y:0};
        this.collMass = 0;

        this.fillAlpha = .1;
        this.maxSpeed = MAX_SPEED;

        //regroupement FIXE par pays, actif des l'apparition (pas de phase 1)
        this.targetedAttr = "country";
        this.on = true;

        this.alive = true;
        this.lastNodeSelected = false;
    }

    //nombre total d'oeuvres portees par l'agent (somme des "count" des compositeurs)
    Particle.prototype.totalWorks = function(){
        var s = 0;
        for(var i=0; i<this.records.length; i++){ var c = parseInt(this.records[i].count); if(c>0)s += c; }
        return s;
    };
    Particle.prototype.setSmallRadius = function(){
        var maxR = Math.min(this.canvas.width, this.canvas.height)/10.;
        var n = this.records.length;

        if(n <= 1){
            //GRIS (compositeur isole) : petite taille, VARIABLE selon le nombre
            //d'oeuvres du compositeur (terme saturant + radVar), mais toujours
            //BORNEE a GREY_MAX_R -> un gris n'est jamais plus gros qu'un vert.
            var w = this.totalWorks();
            var worksTerm = (GREY_MAX_R - 1.*this.scale) * (w/(w + GREY_WORK_SCALE)); //0..(GREY_MAX_R-1)
            var rg = 1.*this.scale + this.radVar*.4 + worksTerm;
            return Math.min(rg, GREY_MAX_R*this.scale);
        }

        //VERT (groupe pays) : la taille croit avec le NOMBRE DE COMPOSITEURS
        //regroupes (racine carree). Le plus petit vert (2 compositeurs) reste plus
        //gros que le plus gros gris. Plafonnee par la taille du canvas.
        var r = GREEN_BASE*this.scale + this.radius_to_add*2.*Math.sqrt(n-1);
        return Math.min(r, maxR);
    };

    Particle.prototype.update = function(index, arr){

        this.mHas = false;   //remis a vrai par mergeNodesAndFindTarget s'il a une cible
        this.yieldW = 0;     //0..1 : a quel point cet agent CEDE a un non-compatible plus lourd

        //derive lente et continue des groupes (jamais totalement immobiles)
        if(this.driftT === undefined){ this.driftT = Math.random()*1000; this.driftP = Math.random()*100; }
        this.driftT += .008;
        if(this.records.length>1){
            var driftAmp = .3*this.records.length/(1+this.collMass);
            this.velocity.x += noise.perlin2(this.driftT, this.driftP)*driftAmp;
            this.velocity.y += noise.perlin2(this.driftT, this.driftP+50)*driftAmp;
        }

        //les gris isoles s'ecartent doucement des autres gris non compatibles
        if(this.records.length===1)this.separateFromLoners(index, arr);

        //un gris/groupe qui fonce vers un groupe non compatible l'esquive avant contact
        this.avoidGroupsAhead(index, arr);

        //masse de collision : ralentissement cumulatif et temporaire
        this.updateMass(index, arr);

        //separation entre groupes non compatibles (toujours active)
        if(this.records.length>1)this.getAwayFromGroups(index, arr);

        //pas d'ouverture ici : simple ajustement du rayon vers la cible
        var target = this.setSmallRadius();
        if(this.radius>target)this.radius = Math.max(target, this.radius-3.);
        else if(this.radius<target)this.radius = Math.min(target, this.radius+.25);

        if(this.on)this.mergeNodesAndFindTarget(index, arr);

        this.checkEdgesV2();

        //les gros groupes bougent moins (division par la masse). La masse de
        //collision ne freine QUE la propulsion (voir addNoiseField), pas la
        //separation -> un agent coince peut toujours se degager.
        this.velocity.x /= this.records.length;
        this.velocity.y /= this.records.length;

        //approche inexorable vers la cible de fusion (creep) : ne recule jamais
        if(this.mHas){
            var mdx = this.mTX-this.x, mdy = this.mTY-this.y, mdl = Math.sqrt(mdx*mdx+mdy*mdy);
            if(mdl>1){
                var mux = mdx/mdl, muy = mdy/mdl;
                var vin = this.velocity.x*mux + this.velocity.y*muy;
                var yw = this.yieldW; if(yw>1)yw=1; else if(yw<0)yw=0;
                var creepEff = MERGE_CREEP*(1-yw);
                if(vin<creepEff){ var add = creepEff-vin; this.velocity.x += mux*add; this.velocity.y += muy*add; }
            }
        }

        var ms = this.maxSpeed;
        this.velocity.x = Math.min(Math.max(this.velocity.x, -ms), ms);
        this.velocity.y = Math.min(Math.max(this.velocity.y, -ms), ms);

        this.x += this.velocity.x;
        this.y += this.velocity.y;

        //garde-fou dur : un groupe ne sort jamais du cadre
        if(this.records.length>1){
            var W = this.canvas.width, H = this.canvas.height;
            if(this.x<0)this.x=0; else if(this.x>W)this.x=W;
            if(this.y<0)this.y=0; else if(this.y>H)this.y=H;
        }

        this.velocity.x *= .9;
        this.velocity.y *= .9;
    };

    Particle.prototype.mergeNodesAndFindTarget = function(index, arr){

        var val = this[this.targetedAttr];

        var t = this.seekMergeTarget(index, arr, val);   //peu d'agents : recherche globale directe
        if(t === -2) return;                             //fusion faite

        if(t >= 0){
            this.getCloserFrom(arr[t]);
            this.mTX = arr[t].x; this.mTY = arr[t].y; this.mHas = true;
        } else if(this.records.length===1){
            this.getAwayFrom(index, arr);
        }
    };

    //cherche un partenaire compatible (meme pays). MANGE un compatible
    //recouvert/plus petit -> renvoie -2 ; sinon renvoie l'index du plus proche.
    Particle.prototype.seekMergeTarget = function(index, arr, val){

        var maxDistance = 9999;
        var target_id = -1;

        for (var i=0; i<arr.length; i++) {

            if(index === i)continue;
            var p = arr[i];

            if(val.localeCompare(p[p.targetedAttr]) !== 0 || p[p.targetedAttr] === "")continue;

            var minDistance = Math.min(this.radius, p.radius);
            var distance = dist(this.x, p.x, this.y, p.y);

            //fusion au recouvrement total ou au contact quand ce disque est le plus gros
            var engulfed = distance + p.radius*2 <= this.radius*2;

            if((distance<minDistance && this.records.length >= p.records.length) || engulfed){

                for (var j=p.records.length-1; j>=0; j--) this.records.push(p.records.pop());
                p.alive = false;
                return -2;

            } else {
                if(distance<maxDistance){ maxDistance = distance; target_id = i; }
            }
        }
        return target_id;
    };

    Particle.prototype.getCloserFrom = function(target){
        var x = target.x - this.x;
        var y = target.y - this.y;
        var m = Math.pow(this.records.length, MERGE_MASS_EXP);
        x *= 0.3 * m;
        y *= 0.3 * m;
        this.velocity.x += x;
        this.velocity.y += y;
    };

    Particle.prototype.getAwayFrom = function(index, arr){

        var target_id = -1;
        var target_numOfChilds = -1;

        for (var i=0; i<arr.length; i++) {

            if(index!==i
                && this[this.targetedAttr].localeCompare(arr[i][arr[i].targetedAttr])!==0){

                var minDistance = this.radius*2 + arr[i].radius*2 + 10;
                var distance = dist(this.x, arr[i].x, this.y, arr[i].y);

                if(distance<minDistance){
                    if(target_numOfChilds<arr[i].records.length){
                        target_numOfChilds = arr[i].records.length;
                        target_id = i;
                    }
                }
            }
        }

        if(target_id>=0){
            var dx = arr[target_id].x - this.x;
            var dy = arr[target_id].y - this.y;
            var d = Math.sqrt(dx*dx + dy*dy);
            if(d>0){
                var minD = this.radius*2 + arr[target_id].radius*2 + 10;
                var overlap = minD - d;
                var push = overlap*GREY_REPULSION;
                this.velocity.x -= (dx/d)*push;
                this.velocity.y -= (dy/d)*push;
            }
        }
    };

    Particle.prototype.getAwayFromGroups = function(index, arr){

        for (var i=0; i<arr.length; i++) {

            var sameValue = this.targetedAttr!=="" && this[this.targetedAttr]!=="" &&
                String(this[this.targetedAttr]).localeCompare(String(arr[i][arr[i].targetedAttr]))===0;

            if(index!==i && arr[i].records.length>1 && !sameValue){

                var minDistance = this.radius*2 + arr[i].radius*2 + GROUP_MARGIN;
                var distance = dist(this.x, arr[i].x, this.y, arr[i].y);

                if(distance<minDistance && distance>0){

                    var x = (arr[i].x - this.x)/distance;
                    var y = (arr[i].y - this.y)/distance;

                    var mThis = this.records.length, mO = arr[i].records.length;
                    var yieldF = (1-MASS_PRIORITY) + MASS_PRIORITY*(2*mO/(mThis+mO));

                    var w = MASS_PRIORITY*((2*mO/(mThis+mO)) - 1);
                    if(w>this.yieldW)this.yieldW = w;

                    var push = (minDistance - distance)*GROUP_REPULSION*this.records.length*yieldF;

                    this.velocity.x -= x*push;
                    this.velocity.y -= y*push;
                }
            }
        }
    };

    Particle.prototype.separateFromLoners = function(index, arr){

        for (var i=0; i<arr.length; i++) {

            if(index!==i && arr[i].records.length===1){

                if(this.targetedAttr!=="" &&
                    String(this[this.targetedAttr]).localeCompare(String(arr[i][arr[i].targetedAttr]))===0) continue;

                var minDistance = this.radius*2 + arr[i].radius*2 + 12;
                var distance = dist(this.x, arr[i].x, this.y, arr[i].y);

                if(distance<minDistance && distance>0){
                    var x = (arr[i].x - this.x)/distance;
                    var y = (arr[i].y - this.y)/distance;
                    var push = (minDistance - distance)*.08;
                    this.velocity.x -= x*push;
                    this.velocity.y -= y*push;
                }
            }
        }
    };

    Particle.prototype.updateMass = function(index, arr){

        this.collMass *= COLL_DECAY;

        var contacts = 0;
        for (var i=0; i<arr.length; i++) {
            if(index===i)continue;
            var minTouch = this.radius*2 + arr[i].radius*2 + COLL_MARGIN;
            var d = dist(this.x, arr[i].x, this.y, arr[i].y);
            if(d>0 && d<minTouch)contacts++;
        }

        if(contacts>0)this.collMass += contacts*COLL_GAIN;
        if(this.collMass>COLL_MAX)this.collMass = COLL_MAX;
    };

    Particle.prototype.avoidGroupsAhead = function(index, arr){

        var speed = Math.sqrt(this.velocity.x*this.velocity.x + this.velocity.y*this.velocity.y);
        if(speed < .01)return;

        var vx = this.velocity.x/speed, vy = this.velocity.y/speed;
        var ahead = 85*this.scale;

        for (var i=0; i<arr.length; i++) {

            if(index===i)continue;
            var o = arr[i];
            if(o.records.length<=1)continue;   //on n'esquive que les GROUPES

            var sameValue = this.targetedAttr!=="" && this[this.targetedAttr]!=="" &&
                String(this[this.targetedAttr]).localeCompare(String(o[o.targetedAttr]))===0;
            if(sameValue)continue;

            var dx = o.x - this.x, dy = o.y - this.y;
            var distance = Math.sqrt(dx*dx + dy*dy);
            var reach = ahead + o.radius*2 + this.radius*2;
            if(distance<=0 || distance>reach)continue;

            var align = (dx*vx + dy*vy)/distance;
            if(align<=0)continue;

            var proximity = 1 - distance/reach;
            var mThis = this.records.length, mO = o.records.length;
            var yieldF = (1-MASS_PRIORITY) + MASS_PRIORITY*(2*mO/(mThis+mO));
            var wa = MASS_PRIORITY*((2*mO/(mThis+mO)) - 1);
            if(wa>this.yieldW)this.yieldW = wa;
            var push = proximity*align*AVOID_STRENGTH*this.scale*this.records.length*yieldF;

            var ux = dx/distance, uy = dy/distance;
            var tx = -uy, ty = ux;
            if(vx*tx + vy*ty < 0){ tx = -tx; ty = -ty; }
            this.velocity.x += (-ux*.7 + tx)*push;
            this.velocity.y += (-uy*.7 + ty)*push;
        }
    };

    Particle.prototype.checkEdgesV2 = function(){

        if(this.records.length>1){

            //coussin doux : ressort perpendiculaire au(x) mur(s) le(s) plus proche(s)
            var border = this.radius*2+25;
            var W = this.canvas.width, H = this.canvas.height;
            var fx = 0, fy = 0;

            if(this.x < border)            fx += (border - this.x);
            else if(this.x > W - border)   fx -= (this.x - (W - border));

            if(this.y < border)            fy += (border - this.y);
            else if(this.y > H - border)   fy -= (this.y - (H - border));

            if(fx !== 0 || fy !== 0){
                var k = BORDER_PUSH * this.records.length;
                this.velocity.x += fx * k;
                this.velocity.y += fy * k;
            }

        } else {

            //gris sorti du cadre : reapparait a un endroit libre au hasard, en fondu
            var W2 = this.canvas.width, H2 = this.canvas.height, m = WRAP_MARGIN;
            if(this.x < -m || this.x > W2 + m || this.y < -m || this.y > H2 + m){

                var nx, ny, placed = false;
                for(var a=0; a<25 && !placed; a++){
                    nx = 40 + Math.random()*(W2-80);
                    ny = 40 + Math.random()*(H2-80);
                    placed = true;
                    for(var b=0; b<particles.length; b++){
                        var o = particles[b];
                        if(o===this)continue;
                        if(dist(nx, o.x, ny, o.y) < this.radius*2 + o.radius*2 + 20){ placed=false; break; }
                    }
                }
                if(!placed){ nx = W2/2; ny = H2/2; }
                this.x = nx; this.y = ny;
                this.velocity.x = 0; this.velocity.y = 0;
                this.fillAlpha = 0;
            }
        }
    };

    Particle.prototype.addNoiseField = function(coef){

        var t = Date.now()*.00006;

        var x = noise.perlin3(this.x/150, this.y/150, t);
        var y = noise.perlin3(this.x/150+7.31, this.y/150+3.17, t);

        var sizeFactor = this.radius/(2.*this.scale);
        if(sizeFactor<1)sizeFactor=1;
        x *= coef/sizeFactor;
        y *= coef/sizeFactor;

        if(this.records.length===1){ x*=GREY_NOISE; y*=GREY_NOISE; }

        if(this.collMass){ var cd = 1/(1+this.collMass); x*=cd; y*=cd; }

        this.velocity.x += x;
        this.velocity.y += y;
    };

    Particle.prototype.display = function(){

        var c = this.context;

        if(this.fillAlpha<1)this.fillAlpha += .03;

        if(this.records.length===1){

            if(this.fillAlpha<1)c.fillStyle = 'rgba(189,195,199,'+this.fillAlpha+')';
            else c.fillStyle = this.colors[0];
            if(this.lastNodeSelected)c.fillStyle = this.colors[4];

            c.beginPath();
            c.arc(this.x, this.y, this.radius*2*this.fillAlpha, 0, 2*Math.PI);
            c.fill();
            c.closePath();

        } else {

            //groupe pays : vert (jamais ouvert -> pas de jaune)
            c.fillStyle = this.colors[1];
            c.beginPath();
            c.arc(this.x, this.y, this.radius*2*this.fillAlpha, 0, 2*Math.PI);
            c.fill();
            c.closePath();
        }

        //etiquette : nom du pays sur les groupes
        if(this.records.length>1){
            c.font = '10px "Helvetica Neue", Helvetica, Arial, sans-serif';
            c.fillStyle = "black";
            c.textAlign = "center";
            c.textBaseline = "middle";
            var label = (''+this[this.targetedAttr]).replace("&#xC9;", "É");
            c.fillText(label, this.x, this.y);
        }
    };

    //==================================================================
    // Boucle d'animation (phase 2 uniquement : regroupement par pays)
    //==================================================================
    function loop(){

        //apparition progressive : un agent par image tant que la file n'est pas vide
        if(pointer<records.length && running && noiseField){
            particles.push(createParticle(records[pointer]));
            pointer++;
        }

        resetCanvas();

        for (var i=0; i<particles.length; i++) {
            if(noiseField)particles[i].addNoiseField(STRENGTH_NOISE*.5);
            particles[i].update(i, particles);
            particles[i].display();
        }

        removeDead();
    }

    function removeDead(){
        for (var i=particles.length-1; i>=0; i--) {
            if(particles[i].records.length<1)particles.splice(i, 1);
        }
    }

    function createParticle(obj){
        return new Particle({
            country: obj.country,
            fn: obj.fn, ln: obj.ln, id: obj.id, count: obj.count,
            x: Math.random()*cv.width,
            y: Math.random()*cv.height
        });
    }

    function resetCanvas(){
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, cv.width, cv.height);
    }

    function removePrevSelection(){
        for (var i=0; i<particles.length; i++) particles[i].lastNodeSelected = false;
    }

    //clic sur le canvas : affiche le pays + le nombre de compositeurs de l'agent
    //vise (PAS d'ouverture des groupes verts, contrairement aux autres SMA).
    function onCanvasClick(evt){
        var r = cv.getBoundingClientRect();
        //le canvas peut etre AFFICHE a une taille CSS differente de son buffer
        //(350x250) : on ramene les coordonnees souris dans le repere du buffer,
        //sinon les clics tombent a cote des agents et rien ne s'affiche.
        var sx = r.width ? cv.width / r.width : 1;
        var sy = r.height ? cv.height / r.height : 1;
        var mx = (evt.clientX - r.left) * sx;
        var my = (evt.clientY - r.top) * sy;
        for (var i=0; i<particles.length; i++) {
            if(dist(mx, particles[i].x, my, particles[i].y) <= particles[i].radius*2 + 3){
                removePrevSelection();
                particles[i].lastNodeSelected = true;
                // Au clic : on affiche UNIQUEMENT le pays + le nombre de compositeurs
                // consultes de ce pays (le bilan global "consulted so far..." disparait).
                // Le bilan global reste affiche, lui, a chaque nouvelle consultation.
                var p = particles[i];
                var cW = (p.records.length===1) ? 'composer' : 'composers';
                var txt = p.country + ': ' + p.records.length + ' ' + cW;
                $("#cookies").empty().append('<p>');
                $("#cookies p").text(txt);
                break;
            }
        }
    }

    function updateConsultedNote(){
        var nCountries = 0;
        for(var k in countryCount){ if(countryCount.hasOwnProperty(k))nCountries++; }
        var w = (consulted===1) ? 'composer' : 'composers';
        var txt = 'consulted so far: ' + consulted + ' ' + w + ' from ' +
                  nCountries + ' countr' + (nCountries>1 ? 'ies' : 'y');
        $("#cookies").empty().append('<p>');
        $("#cookies p").text(txt);
    }

    //==================================================================
    // API publique
    //==================================================================
    global.OverviewSMA = {

        //prepare le canvas #sma et lance la boucle
        init: function(canvasEl){
            cv = canvasEl;
            ctx = cv.getContext('2d');
            cv.width = CANVAS_W;              //taille identique a l'ancien SMA (hauteur = HTML)
            resetCanvas();
            cv.addEventListener("click", onCanvasClick);

            //pause / reprise du champ de bruit avec la touche 'p' (hors champs de saisie)
            $(document).on('keypress', function(e){
                if(e.which === 112 && !$(e.target).is('input,textarea')) noiseField = !noiseField;
            });

            if(!anim)anim = setInterval(loop, 1000/30);
        },

        //ajoute un compositeur consulte : {country, fn, ln, id, count}
        //il apparait comme agent gris puis fusionne avec les siens (meme pays)
        addComposer: function(obj){
            if(obj && obj.id != null){
                if(seenIds[obj.id])return;   //deja consulte : pas de doublon
                seenIds[obj.id] = true;
            }
            records.push(obj);
            consulted++;
            if(obj && obj.country){
                if(!countryCount[obj.country])countryCount[obj.country] = 0;
                countryCount[obj.country]++;
            }
            updateConsultedNote();
        },

        //remet le SMA a zero
        reset: function(){
            particles = [];
            records = [];
            pointer = 0;
            seenIds = {};
            countryCount = {};
            consulted = 0;
            if(ctx)resetCanvas();
            $("#cookies").empty();
        }
    };

})(window);
