var LINE_DIST = 50;
var SMA_MOTION = 1;

var GREY_NOISE = .35;

var COLL_GAIN  = .4;
var COLL_DECAY = .94;
var COLL_MAX   = 6;
var COLL_MARGIN= 10;

var GREY_REPULSION = .1;

var AVOID_STRENGTH = 1.4;

var BORDER_PUSH = .03;

var WRAP_MARGIN = 30;

var MERGE_NEIGHBORHOOD = 260;

var MERGE_MASS_EXP = 0;

var GROUP_REPULSION = .2;
var GROUP_MARGIN = 28;

var MERGE_CREEP = .4;

var MASS_PRIORITY = 1;

function Particle(config){

	this.canvasId=config.canvasId;
	this.canvas=document.getElementById(this.canvasId);
	this.context=this.canvas.getContext("2d");

	this.edition = config.edition;
	this.year = config.year;
	this.price = config.price;
	this.imeb_id = config.imeb_id;
	this.fn = config.fn;

	this.name = config.name;
	this.title = config.title;
	this.duration = config.duration;

	this.minutes = config.minutes;

	this.degree = config.degree;
	this.category = config.category;
	this.isni = config.isni;
	this.ctry = config.ctry;

	this.id = config.id;

	this.records = [{edition:this.edition, year:this.year, price:this.price,
					imeb_id:this.imeb_id, fn:this.fn, name:this.name, title:this.title,
					duration:this.duration, minutes:this.minutes, degree:this.degree, category:this.category,
					isni:this.isni, ctry:this.ctry, id:this.id}];

	this.colors=["#bdc3c7", "#2ecc71", "#f1c40f", "#3498db", "#2C3E50"];

	this.alpha=.2;
	this.color1 = 'rgba(255, 165, 0,'+ this.alpha + ')';
	this.color2 = 'rgb(52, 152, 219,'+ this.alpha + ')';

	this.x=config.x;
	this.y=config.y;

	this.scale = config.scale;
	this.radVar = Math.random()*2;
	this.radius_to_add =  config.radius_to_add;
	this.radius = this.setSmallRadius();

	this.velocity={x:0, y:0};
	this.collMass=0;

	this.fillAlpha = .1;
	this.maxSpeed = 4.;

	this.open=false;
	this.childs=[];

	this.attrOfInterest = ['edition', 'price', 'name', 'minutes', 'degree', 'category'];
	this.targetedAttr="";
	this.on = false;

	this.opening=false;

	this.extra_rad=0.;
	this.max_extra_rad=20.*this.scale;

	this.lastNodeSelected=false;

}
Particle.prototype.setSmallRadius = function(){

	var r = this.radVar+1.*this.scale + this.radius_to_add*2.*Math.sqrt(this.records.length-1);
	var maxR = Math.min(this.canvas.width, this.canvas.height)/10.;
	return Math.min(r, maxR);
}
Particle.prototype.resetIt = function(){
	this.open=false;
	this.childs=[];
	this.on=false;
	this.targetedAttr="";
	this.radius = this.setSmallRadius();
	this.fillAlpha = .1;
	this.velocity={x:0, y:0};
	this.collMass=0;
}
Particle.prototype.openOrCloseIt = function(){

	if(!this.open){

		var sq = Math.sqrt(this.records.length);
		var needed = 9.*sq/(1.+sq/28.)*this.scale;
		var maxOpen = Math.min(this.canvas.width, this.canvas.height)/4. - 20.;
		var base = this.setSmallRadius();
		this.max_extra_rad = Math.max(20.*this.scale, Math.min(Math.max(needed, base+20.*this.scale), maxOpen) - base);
		this.open_step = Math.max(.25, this.max_extra_rad/90.);

		this.opening=true;

	} else {

		this.childs=[];

		console.log('close it');

	 	this.extra_rad=0.;
	 	this.lastHit=-999;

	 	$("#cookies").empty();

	 	clearIdentityBoxGN();
	 	$("#titles").empty();

	}

	this.open=!this.open;

}
Particle.prototype.createNewChild=function(obj){

    var radius=this.radius;

    return new Child({
        canvasId: this.canvasId,

        edition: obj.edition,
        year: obj.year,
        price: obj.price,
        imeb_id: obj.imeb_id,
        fn: obj.fn,
        name: obj.name,
        title: obj.title,
        duration: obj.duration,
        minutes: obj.minutes,
        degree: obj.degree,
        category: obj.category,
        isni: obj.isni,
        ctry: obj.ctry,

        id: obj.id,

        x:this.x-radius+Math.random()*(radius*2),
        y:this.y-radius+Math.random()*(radius*2),
        scale : this.scale
    });
}
Particle.prototype.processChilds=function(mouseX, mouseY){

	var targeted=false;
	var childs=this.childs;

	for (var i=0; i<childs.length; i++) {

		var distance=dist(mouseX, childs[i].x, mouseY, childs[i].y)
        if(distance<=childs[i].radius*2){

        	if(childs[i].id !== this.lastHit){
        		this.getInfoFrom(childs[i]);
        		removePreviousSelection();
        		childs[i].lastNodeSelected=true;
        		this.lastHit=childs[i].id;
        	}

        	targeted=true;
        	break;
        }

	}
	return targeted;
}
Particle.prototype.getInfoFrom=function(target){

	var val = function(v){ return $.trim(v == null ? '' : String(v)); };

	$("#titles").empty();

	var blocks = [];

	var work = val(target.title);
	var duration = val(target.duration);
	if(duration) work = work ? work + ' (' + duration + ')' : '(' + duration + ')';
	blocks.push([work]);

	var misam = val(target.imeb_id);
	var infoMisam = (misam && misam !== '0')
	              ? ' title="MISAM ' + misam.replace(/"/g, '&quot;') + '"' : '';

	blocks.push([val(target.price), val(target.degree) ?
	             'Degré ' + val(target.degree) : '', val(target.category)]);

	var ed = val(target.edition);
	blocks.push([/^[0-9]{4}$/.test(ed) ? 'Concours ' + ed : '']);

	for (var b = 0; b < blocks.length; b++) {

		var lines = [];
		for (var l = 0; l < blocks[b].length; l++){
			if(blocks[b][l] !== '') lines.push(blocks[b][l]);
		}
		if(lines.length === 0) continue;

		var spaced = ($("#titles").children().length > 0);

		for (var k = 0; k < lines.length; k++) {
			var cls = (k === 0 && spaced) ? ' class="sma-blk"' : '';
			var tip = (b === 0 && k === 0) ? infoMisam : '';
			$("#titles").append('<p'+ cls + tip +'>'+ lines[k] +'</p>');
		}
	}

	if(typeof displaySmaIdentityGN === 'function'){
		displaySmaIdentityGN(target);
	}

}
Particle.prototype.update = function(i, particles){

	this.mHas=false; this.yieldW=0;

	if(this.driftT===undefined){ this.driftT=Math.random()*1000; this.driftP=Math.random()*100; }
	this.driftT+=.008;
	if(this.records.length>1){

		var driftAmp = (this.open ? .5 : .3)*this.records.length/(1+this.collMass)*SMA_MOTION;
		this.velocity.x += noise.perlin2(this.driftT, this.driftP)*driftAmp;
		this.velocity.y += noise.perlin2(this.driftT, this.driftP+50)*driftAmp;
	}

	if(this.records.length===1)this.separateFromLoners(i, particles);

	this.avoidGroupsAhead(i, particles);

	this.updateMass(i, particles);

	if(this.records.length>1)this.getAwayFromGroups(i, particles);

	if(this.opening){

		var toAdd = Math.max(1, Math.ceil(this.records.length/120));
		while(toAdd-- > 0 && this.tryAddChild());

		if(this.extra_rad<this.max_extra_rad){

			this.radius-=this.extra_rad;
			this.extra_rad+=this.open_step;
			this.radius+=this.extra_rad;

		} else {

			this.opening=false;

			var memberSelected = false;
			for (var c=0; c<this.childs.length; c++) {
				if(this.childs[c].lastNodeSelected){ memberSelected = true; break; }
			}

			if(!memberSelected) setSelectionTextGN(this.records.length+' elements');

		}

	} else if(this.open){

		var toAdd = Math.max(1, Math.ceil(this.records.length/120));
		while(toAdd-- > 0 && this.tryAddChild());

		var sq = Math.sqrt(this.records.length);
		var needed = 9.*sq/(1.+sq/28.)*this.scale;
		var maxOpen = Math.min(this.canvas.width, this.canvas.height)/4. - 20.;
		var base = this.setSmallRadius();
		this.max_extra_rad = Math.max(20.*this.scale, Math.min(Math.max(needed, base+20.*this.scale), maxOpen) - base);

		var rad_max = base + this.max_extra_rad;

		if(this.radius< rad_max)this.radius+=.25;

	} else if(!this.open){
		var target = this.setSmallRadius();
		if(this.radius>target)this.radius=Math.max(target, this.radius-3.);
		else if(this.radius<target)this.radius=Math.min(target, this.radius+.25);
	}

	for (var j=0; j<this.childs.length; j++) {
		this.childs[j].getAwayFrom(this.childs, this.radius, j);
		this.childs[j].getCloseTo(this.x, this.y, this.radius);
		this.childs[j].getAwayFromCenter(this.x, this.y, this.radius);
		this.childs[j].reduceVelocityAndUseIt(.6);
	}

	if(this.on)this.mergeNodesAndFindTarget(i, particles);

	this.checkEdgesV2();

	this.velocity.x /= this.records.length;
    this.velocity.y /= this.records.length;

	if(this.mHas){
		var mdx=this.mTX-this.x, mdy=this.mTY-this.y, mdl=Math.sqrt(mdx*mdx+mdy*mdy);
		if(mdl>1){
			var mux=mdx/mdl, muy=mdy/mdl, vin=this.velocity.x*mux+this.velocity.y*muy;
			var yw=this.yieldW; if(yw>1)yw=1; else if(yw<0)yw=0; var creepEff=MERGE_CREEP*(1-yw); if(vin<creepEff){ var madd=creepEff-vin; this.velocity.x+=mux*madd; this.velocity.y+=muy*madd; }
		}
	}

    var maxSpeed = this.maxSpeed;

	this.velocity.x = Math.min(Math.max(this.velocity.x, -maxSpeed), maxSpeed);
	this.velocity.y = Math.min(Math.max(this.velocity.y, -maxSpeed), maxSpeed);

	this.x+=this.velocity.x*SMA_MOTION;
	this.y+=this.velocity.y*SMA_MOTION;

	for (var k=0; k<this.childs.length; k++) {
		this.childs[k].x += this.velocity.x*SMA_MOTION;
		this.childs[k].y += this.velocity.y*SMA_MOTION;
	}

	this.velocity.x*=.9;
	this.velocity.y*=.9;

}
Particle.prototype.mergeNodesAndFindTarget = function(index, particles){

	var targetedAttrValue = this[this.targetedAttr];

	var qr = Math.max(MERGE_NEIGHBORHOOD, this.radius*2 + 2*smaMaxRadius) + SMA_GRID_SLACK;
	var cand = (SMA_USE_GRID && smaGridReady && smaGrid) ? smaGrid.queryRadius(this.x, this.y, qr, _smaScratch) : null;

	var t = this.seekMergeTarget(index, particles, cand, targetedAttrValue);
	if(t===-2) return;
	if(t<0 && cand){
		t = this.seekMergeTarget(index, particles, null, targetedAttrValue);
		if(t===-2) return;
	}

	if(t>=0){
		this.getCloserFrom(particles[t]);
		this.mTX=particles[t].x; this.mTY=particles[t].y; this.mHas=true;
	} else if(this.records.length===1){
		this.getAwayFrom(index, particles);
	}
}
Particle.prototype.seekMergeTarget = function(index, particles, cand, targetedAttrValue){

	var maxDistance = 9999;
	var target_id = -1;
	var N = cand ? cand.length : particles.length;

	for (var c=0; c<N; c++) {

		var i = cand ? cand[c] : c;
		if(index===i)continue;

		var p = particles[i];

		if(targetedAttrValue.localeCompare(p[p.targetedAttr])!==0 || p[p.targetedAttr]==="")continue;

		var minDistance = Math.min(this.radius, p.radius);
		var distance = dist(this.x, p.x, this.y, p.y);

		var engulfed = !p.open && distance + p.radius*2 <= this.radius*2;

		if((distance<minDistance && this.records.length >= p.records.length) || engulfed){
			for (var j=p.records.length-1; j>=0; j--) this.records.push(p.records.pop());
			p.alive=false;
			return -2;
		} else {
			if(distance<maxDistance){ maxDistance=distance; target_id=i; }
		}
	}
	return target_id;
}
Particle.prototype.SearchCommonsAttrAndGetAwayFrom = function (arr, index){

	var ctx = this.context;
	var commonAttributes=[];

	for (var i = index+1; i < arr.length; i++) {

		if(index!=i){
			var minDistance = this.radius*2+arr[i].radius*2+2;
			var distance = dist(this.x, arr[i].x, this.y, arr[i].y);
			var atLeastOneAttrInCommonHasBeenFound = false;
			var apparition = 1 - distance/LINE_DIST;

			if(distance<LINE_DIST){

				for (var j = 0; j < this.attrOfInterest.length; j++) {

					var attr = this.attrOfInterest[j];

					if(this[attr].localeCompare(arr[i][attr])===0 && this[attr]!= ""){

						if(commonAttributes.hasOwnProperty(attr)){
							commonAttributes[attr]+=1;
						} else {
							commonAttributes[attr]=1;
						}

						atLeastOneAttrInCommonHasBeenFound = true;
					}
				}

				this.drawLine(this.x, this.y, arr[i].x, arr[i].y,
				              atLeastOneAttrInCommonHasBeenFound ? this.color2 : this.color1,
				              apparition);
			}

			if(distance<minDistance){

				var x = arr[i].x - this.x;
				var y = arr[i].y - this.y;

				x *=-0.1;
				y *=-0.1;

				this.velocity.x+=x;
				this.velocity.y+=y;

				this.x+=this.velocity.x*SMA_MOTION;
				this.y+=this.velocity.y*SMA_MOTION;

				this.velocity.x*=.9;
				this.velocity.y*=.9

			}
		}
	}
	return commonAttributes;
}
Particle.prototype.getCloserFrom = function(target){

	var x = target.x - this.x;
	var y = target.y - this.y;

	var m = Math.pow(this.records.length, MERGE_MASS_EXP);
	x *= 0.3 * m;
	y *= 0.3 * m;

	this.velocity.x += x;
	this.velocity.y += y;

}
Particle.prototype.getAwayFrom = function(index, particles){

	var target_id = -1;
	var target_numOfChilds = -1;

	var qr = this.radius*2 + 2*smaMaxRadius + 10 + SMA_GRID_SLACK;
	var cand = (SMA_USE_GRID && smaGridReady && smaGrid) ? smaGrid.queryRadius(this.x, this.y, qr, _smaScratch) : null;
	var N = cand ? cand.length : particles.length;

	for (var c=0; c<N; c++) {

		var i = cand ? cand[c] : c;

		if(index!==i
			&& this[this.targetedAttr].localeCompare(particles[i][particles[i].targetedAttr])!==0){

			var minDistance = this.radius*2 + particles[i].radius*2 + 10;
			var distance = dist(this.x, particles[i].x, this.y, particles[i].y);

			if(distance<minDistance){

				if(target_numOfChilds<particles[i].records.length){
					target_numOfChilds = particles[i].records.length;
					target_id = i;
				}
			}
		}
	}

	if(target_id>=0){

		var dx = particles[target_id].x - this.x;
		var dy = particles[target_id].y - this.y;
		var d = Math.sqrt(dx*dx + dy*dy);

		if(d>0){
			var minD = this.radius*2 + particles[target_id].radius*2 + 10;
			var overlap = minD - d;
			var push = overlap*GREY_REPULSION;
			this.velocity.x -= (dx/d)*push;
			this.velocity.y -= (dy/d)*push;
		}
	}
}
Particle.prototype.display = function(){

	var ctx=this.context;

	if(this.fillAlpha<1) {
		this.fillAlpha+=.03;
	}

	if(this.records.length===1) {

		if(this.fillAlpha<1) ctx.fillStyle='rgba(189,195,199,'+this.fillAlpha+')';
		else ctx.fillStyle=this.colors[0];

		if(this.lastNodeSelected)ctx.fillStyle=this.colors[4];

		ctx.beginPath();
	    ctx.arc(this.x, this.y, this.radius*2*this.fillAlpha, 0, 2*Math.PI);
	    ctx.fill();
	    ctx.closePath();

	} else if(this.open){

		ctx.fillStyle=this.colors[2];

		ctx.beginPath();
	    ctx.arc(this.x, this.y, this.radius*2*this.fillAlpha, 0, 2*Math.PI);
	    ctx.fill();
	    ctx.closePath();

	} else {
		ctx.fillStyle=this.colors[1];

		ctx.beginPath();
	    ctx.arc(this.x, this.y, this.radius*2*this.fillAlpha, 0, 2*Math.PI);
	    ctx.fill();
	    ctx.closePath();
	}

    for (var i = 0; i < this.childs.length; i++) {
		this.childs[i].display();
	}

    if(this.records.length>2 || this.open){

    	ctx.font = this.font;
	    ctx.fillStyle = "black";
	    ctx.textAlign = "center";
	    ctx.textBaseline = "middle";

	    var label = this[this.targetedAttr].replace("&#xC9;", "É");
	    label = label.replace("&#xE9;", "é");
	    label = label.replace("&#xE8;", "è");

	    ctx.fillText(label, this.x, this.y);

    }

}
Particle.prototype.updateBeforeMerging = function(){

	var maxSpeed = this.maxSpeed;

	this.velocity.x = Math.min(Math.max(this.velocity.x, -maxSpeed), maxSpeed);
	this.velocity.y = Math.min(Math.max(this.velocity.y, -maxSpeed), maxSpeed);

	this.x+=this.velocity.x*SMA_MOTION;
	this.y+=this.velocity.y*SMA_MOTION;

	if(this.records.length>1){
		var W=this.canvas.width, H=this.canvas.height;
		if(this.x<0)this.x=0; else if(this.x>W)this.x=W;
		if(this.y<0)this.y=0; else if(this.y>H)this.y=H;
	}

	this.velocity.x*=.9;
	this.velocity.y*=.9;

}
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

		var W = this.canvas.width, H = this.canvas.height, m = WRAP_MARGIN;
		if(this.x < -m || this.x > W + m || this.y < -m || this.y > H + m){

			var nx, ny, placed = false;
			for(var a=0; a<25 && !placed; a++){
				nx = 40 + Math.random()*(W-80);
				ny = 40 + Math.random()*(H-80);
				placed = true;
				for(var b=0; b<particles.length; b++){
					var o = particles[b];
					if(o===this)continue;
					if(dist(nx, o.x, ny, o.y) < this.radius*2 + o.radius*2 + 20){ placed=false; break; }
				}
			}
			this.x = nx; this.y = ny;
			this.velocity.x = 0; this.velocity.y = 0;
			this.fillAlpha = 0;
		}

	}

}
Particle.prototype.checkEdgesV1 = function(){

	if(this.x<0)this.x=this.canvas.width;
	else if(this.x>this.canvas.width)this.x=0;

	if(this.y<0)this.y=this.canvas.height;
	else if(this.y>this.canvas.height)this.y=0;

}
Particle.prototype.addNoiseField = function(coef){

	var t = Date.now()*.00006;

	var x = noise.perlin3(this.x/150, this.y/150, t);
    var y = noise.perlin3(this.x/150+7.31, this.y/150+3.17, t);

    var sizeFactor = this.radius/(2.*this.scale);
    if(sizeFactor<1)sizeFactor=1;
    x*=coef*SMA_MOTION/sizeFactor;
    y*=coef*SMA_MOTION/sizeFactor;

	if(this.records.length===1){ x*=GREY_NOISE; y*=GREY_NOISE; }

	if(this.collMass){ var cd = 1/(1+this.collMass); x*=cd; y*=cd; }

	this.velocity.x+=x;
	this.velocity.y+=y;
}
Particle.prototype.drawLine = function(x1, y1, x2, y2, color, opacite){
	var ctx = this.context;
	var op = (opacite === undefined) ? 1 : opacite;
	if(op <= 0) return;
	if(op > 1) op = 1;
	var memoire = ctx.globalAlpha;
	ctx.globalAlpha = memoire * op;
	ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = memoire;
}

Particle.prototype.getAwayFromGroups = function(index, particles){

	var qr = this.radius*2 + 2*smaMaxRadius + GROUP_MARGIN + SMA_GRID_SLACK;
	var cand = (SMA_USE_GRID && smaGridReady && smaGrid) ? smaGrid.queryRadius(this.x, this.y, qr, _smaScratch) : null;
	var N = cand ? cand.length : particles.length;

	for (var c=0; c<N; c++) {

		var i = cand ? cand[c] : c;

		var sameValue = this.targetedAttr!=="" && this[this.targetedAttr]!=="" &&
			String(this[this.targetedAttr]).localeCompare(String(particles[i][particles[i].targetedAttr]))===0;

		if(index!==i && particles[i].records.length>1 && !sameValue){

			var minDistance = this.radius*2 + particles[i].radius*2 + GROUP_MARGIN;
			var distance = dist(this.x, particles[i].x, this.y, particles[i].y);

			if(distance<minDistance && distance>0){

				var x = (particles[i].x - this.x)/distance;
				var y = (particles[i].y - this.y)/distance;

				var mThis=this.records.length, mO=particles[i].records.length;
				var yieldF = (1-MASS_PRIORITY) + MASS_PRIORITY*(2*mO/(mThis+mO)); var wg = MASS_PRIORITY*((2*mO/(mThis+mO))-1); if(wg>this.yieldW)this.yieldW=wg;
				var push = (minDistance - distance)*GROUP_REPULSION*this.records.length*yieldF;

				this.velocity.x -= x*push;
				this.velocity.y -= y*push;
			}
		}
	}
}

Particle.prototype.separateFromLoners = function(index, particles){

	var qr = this.radius*2 + 2*smaMaxRadius + 12 + SMA_GRID_SLACK;
	var cand = (SMA_USE_GRID && smaGridReady && smaGrid) ? smaGrid.queryRadius(this.x, this.y, qr, _smaScratch) : null;
	var N = cand ? cand.length : particles.length;

	for (var c=0; c<N; c++) {

		var i = cand ? cand[c] : c;

		if(index!==i && particles[i].records.length===1){

			if(this.targetedAttr!=="" &&
				String(this[this.targetedAttr]).localeCompare(String(particles[i][particles[i].targetedAttr]))===0) continue;

			var minDistance = this.radius*2 + particles[i].radius*2 + 12;
			var distance = dist(this.x, particles[i].x, this.y, particles[i].y);

			if(distance<minDistance && distance>0){

				var x = (particles[i].x - this.x)/distance;
				var y = (particles[i].y - this.y)/distance;

				var push = (minDistance - distance)*.08;

				this.velocity.x -= x*push;
				this.velocity.y -= y*push;
			}
		}
	}
}

Particle.prototype.updateMass = function(index, particles){

	this.collMass *= COLL_DECAY;

	var qr = this.radius*2 + 2*smaMaxRadius + COLL_MARGIN + SMA_GRID_SLACK;
	var cand = (SMA_USE_GRID && smaGridReady && smaGrid) ? smaGrid.queryRadius(this.x, this.y, qr, _smaScratch) : null;
	var N = cand ? cand.length : particles.length;

	var contacts = 0;
	for (var c=0; c<N; c++) {
		var i = cand ? cand[c] : c;
		if(index===i)continue;
		var minTouch = this.radius*2 + particles[i].radius*2 + COLL_MARGIN;
		var d = dist(this.x, particles[i].x, this.y, particles[i].y);
		if(d>0 && d<minTouch)contacts++;
	}

	if(contacts>0)this.collMass += contacts*COLL_GAIN;
	if(this.collMass>COLL_MAX)this.collMass=COLL_MAX;
}

Particle.prototype.avoidGroupsAhead = function(index, particles){

	var speed = Math.sqrt(this.velocity.x*this.velocity.x + this.velocity.y*this.velocity.y);
	if(speed < .01)return;

	var vx = this.velocity.x/speed, vy = this.velocity.y/speed;
	var ahead = 85*this.scale;

	var qr = ahead + 2*smaMaxRadius + this.radius*2 + SMA_GRID_SLACK;
	var cand = (SMA_USE_GRID && smaGridReady && smaGrid) ? smaGrid.queryRadius(this.x, this.y, qr, _smaScratch) : null;
	var N = cand ? cand.length : particles.length;

	for (var c=0; c<N; c++) {

		var i = cand ? cand[c] : c;

		if(index===i)continue;

		var o = particles[i];
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
		var mThisA=this.records.length, mOA=o.records.length;
		var yieldFA = (1-MASS_PRIORITY) + MASS_PRIORITY*(2*mOA/(mThisA+mOA)); var wa = MASS_PRIORITY*((2*mOA/(mThisA+mOA))-1); if(wa>this.yieldW)this.yieldW=wa;
		var push = proximity*align*AVOID_STRENGTH*this.scale*this.records.length*yieldFA;

		var ux = dx/distance, uy = dy/distance;
		var tx = -uy, ty = ux;
		if(vx*tx + vy*ty < 0){ tx = -tx; ty = -ty; }
		this.velocity.x += (-ux*.7 + tx)*push;
		this.velocity.y += (-uy*.7 + ty)*push;
	}
}

Particle.prototype.tryAddChild = function(){

	if(this.childs.length >= this.records.length)return false;

	var usable = this.radius*2*.7;

	var slot = 320.*this.scale*this.scale;
	var capacity = Math.max(1, Math.floor((Math.PI*usable*usable)/slot));
	if(this.childs.length >= capacity)return false;

	for (var t=0; t<12; t++) {

		var a = Math.random()*2*Math.PI;
		var r = Math.sqrt(Math.random())*Math.max(1, usable-8);
		var px = this.x + Math.cos(a)*r;
		var py = this.y + Math.sin(a)*r;

		var free = true;
		for (var j=0; j<this.childs.length; j++) {
			var d = dist(px, this.childs[j].x, py, this.childs[j].y);
			if(d < this.childs[j].radius*2 + 9){ free=false; break; }
		}

		if(free){
			var c = this.createNewChild(this.records[this.childs.length]);
			c.x = px; c.y = py;
			this.childs.push(c);
			return true;
		}
	}

	return false;
};
