(function(global){
    "use strict";

    var GREY_NOISE      = .35;
    var COLL_GAIN       = .4;
    var COLL_DECAY      = .94;
    var COLL_MAX        = 6;
    var COLL_MARGIN     = 10;
    var GREY_REPULSION  = .1;
    var AVOID_STRENGTH  = 1.4;
    var GROUP_REPULSION = .2;
    var GROUP_MARGIN    = 18;
    var MERGE_CREEP     = .4;
    var MASS_PRIORITY   = 1;
    var BORDER_PUSH     = .03;
    var WRAP_MARGIN     = 30;
    var MERGE_MASS_EXP  = 0;

    var STRENGTH_NOISE  = 10;
    var MAX_SPEED       = 2.5;
    var CANVAS_W        = 350;
    var BG              = "#ecf0f1";

    var GREY_MAX_R      = 5;
    var GREY_WORK_SCALE = 8;
    var GREEN_BASE      = 5.5;

    var cv = null, ctx = null;
    var particles = [];
    var records = [];
    var pointer = 0;
    var scale = 1;
    var noiseField = true;
    var running = true;
    var anim = null;

    var seenIds = {};
    var countryCount = {};
    var consulted = 0;

    function dist(x1, x2, y1, y2){ var a = x1 - x2, b = y1 - y2; return Math.sqrt(a*a + b*b); }

    function Particle(config){

        this.canvas = cv;
        this.context = ctx;

        this.country = config.country;
        this.fn = config.fn;
        this.ln = config.ln;
        this.id = config.id;
        this.count = config.count;

        this.records = [{country: this.country, fn: this.fn, ln: this.ln,
                         id: this.id, count: this.count}];

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

        this.targetedAttr = "country";
        this.on = true;

        this.alive = true;
        this.lastNodeSelected = false;
    }

    Particle.prototype.totalWorks = function(){
        var s = 0;
        for(var i=0; i<this.records.length; i++){ var c = parseInt(this.records[i].count); if(c>0)s += c; }
        return s;
    };
    Particle.prototype.setSmallRadius = function(){
        var maxR = Math.min(this.canvas.width, this.canvas.height)/10.;
        var n = this.records.length;

        if(n <= 1){

            var w = this.totalWorks();
            var worksTerm = (GREY_MAX_R - 1.*this.scale) * (w/(w + GREY_WORK_SCALE));
            var rg = 1.*this.scale + this.radVar*.4 + worksTerm;
            return Math.min(rg, GREY_MAX_R*this.scale);
        }

        var r = GREEN_BASE*this.scale + this.radius_to_add*2.*Math.sqrt(n-1);
        return Math.min(r, maxR);
    };

    Particle.prototype.update = function(index, arr){

        this.mHas = false;
        this.yieldW = 0;

        if(this.driftT === undefined){ this.driftT = Math.random()*1000; this.driftP = Math.random()*100; }
        this.driftT += .008;
        if(this.records.length>1){
            var driftAmp = .3*this.records.length/(1+this.collMass);
            this.velocity.x += noise.perlin2(this.driftT, this.driftP)*driftAmp;
            this.velocity.y += noise.perlin2(this.driftT, this.driftP+50)*driftAmp;
        }

        if(this.records.length===1)this.separateFromLoners(index, arr);

        this.avoidGroupsAhead(index, arr);

        this.updateMass(index, arr);

        if(this.records.length>1)this.getAwayFromGroups(index, arr);

        var target = this.setSmallRadius();
        if(this.radius>target)this.radius = Math.max(target, this.radius-3.);
        else if(this.radius<target)this.radius = Math.min(target, this.radius+.25);

        if(this.on)this.mergeNodesAndFindTarget(index, arr);

        this.checkEdgesV2();

        this.velocity.x /= this.records.length;
        this.velocity.y /= this.records.length;

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

        var t = this.seekMergeTarget(index, arr, val);
        if(t === -2) return;

        if(t >= 0){
            this.getCloserFrom(arr[t]);
            this.mTX = arr[t].x; this.mTY = arr[t].y; this.mHas = true;
        } else if(this.records.length===1){
            this.getAwayFrom(index, arr);
        }
    };

    Particle.prototype.seekMergeTarget = function(index, arr, val){

        var maxDistance = 9999;
        var target_id = -1;

        for (var i=0; i<arr.length; i++) {

            if(index === i)continue;
            var p = arr[i];

            if(val.localeCompare(p[p.targetedAttr]) !== 0 || p[p.targetedAttr] === "")continue;

            var minDistance = Math.min(this.radius, p.radius);
            var distance = dist(this.x, p.x, this.y, p.y);

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
            if(o.records.length<=1)continue;

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

            c.fillStyle = this.colors[1];
            c.beginPath();
            c.arc(this.x, this.y, this.radius*2*this.fillAlpha, 0, 2*Math.PI);
            c.fill();
            c.closePath();
        }

        if(this.records.length>1){
            c.font = '10px "Helvetica Neue", Helvetica, Arial, sans-serif';
            c.fillStyle = "black";
            c.textAlign = "center";
            c.textBaseline = "middle";
            var label = (''+this[this.targetedAttr]).replace("&#xC9;", "É");
            c.fillText(label, this.x, this.y);
        }
    };

    function loop(){

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

    function onCanvasClick(evt){
        var r = cv.getBoundingClientRect();

        var sx = r.width ? cv.width / r.width : 1;
        var sy = r.height ? cv.height / r.height : 1;
        var mx = (evt.clientX - r.left) * sx;
        var my = (evt.clientY - r.top) * sy;
        for (var i=0; i<particles.length; i++) {
            if(dist(mx, particles[i].x, my, particles[i].y) <= particles[i].radius*2 + 3){
                removePrevSelection();
                particles[i].lastNodeSelected = true;

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

    global.OverviewSMA = {

        init: function(canvasEl){
            cv = canvasEl;
            ctx = cv.getContext('2d');
            cv.width = CANVAS_W;
            resetCanvas();
            cv.addEventListener("click", onCanvasClick);

            $(document).on('keypress', function(e){
                if(e.which === 112 && !$(e.target).is('input,textarea')) noiseField = !noiseField;
            });

            if(!anim)anim = setInterval(loop, 1000/30);
        },

        addComposer: function(obj){
            if(obj && obj.id != null){
                if(seenIds[obj.id])return;
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
