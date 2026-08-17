function Child(config){

	this.canvasId=config.canvasId;
	this.canvas=document.getElementById(this.canvasId);
	this.context=this.canvas.getContext("2d");

	this.scale = config.scale;

	this.colors=["#3498db", "#800000", "#2C3E50"];

	this.x=config.x;
	this.y=config.y;

	this.imeb_id = config.imeb_id;
	this.fn = config.fn;

	this.name = config.name;
	this.ctry = config.ctry;
	this.title = config.title;
	this.duration = config.duration;

	this.minutes = config.minutes;
	this.editions = config.editions;

	this.isni = config.isni;

	this.composed = config.composed;
	this.annees = config.annees;
	this.prov = config.prov;

	this.id=config.id;

	this.radius=3.5*this.scale+Math.random()*1.5;

	this.velocity={x:0, y:0};

	this.alpha=.5;

	this.lastNodeSelected=false;
	this.lastNodeHovered=false;

	this.hoverAmp=0;
}
Child.prototype.getAwayFromCenter = function(t_x, t_y, t_radius){

	var minDistance = 12*this.scale;

	var distance = dist(t_x, this.x, t_y, this.y);

	if(distance<minDistance && distance>0){

		var x = (t_x - this.x)/distance;
		var y = (t_y - this.y)/distance;

		var push = (minDistance - distance)*.06;

		this.velocity.x -= x*push;
		this.velocity.y -= y*push;
	}
}
Child.prototype.getCloseTo = function(t_x, t_y, t_radius){

	var maxDistance = t_radius*2*.7 - this.radius*2;
	if(maxDistance<10)maxDistance = 10;
	var distance = dist(t_x, this.x, t_y, this.y);

	if(distance>maxDistance && distance>0){

		var x = (t_x - this.x)/distance;
		var y = (t_y - this.y)/distance;

		var pull = (distance - maxDistance)*.06;

		this.velocity.x += x*pull;
		this.velocity.y += y*pull;
	}
}
Child.prototype.getAwayFrom = function(arr, radius, index){

	for (var i=0; i<arr.length; i++) {

		if(index!==i){

			var minDistance = this.radius*2+arr[i].radius*2+2;
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
}
Child.prototype.reduceVelocityAndUseIt = function(coeff){

	if(this.driftT===undefined){ this.driftT=Math.random()*1000; this.driftP=Math.random()*100; }
	this.driftT+=.02;
	this.velocity.x += noise.perlin2(this.driftT, this.driftP)*.4;
	this.velocity.y += noise.perlin2(this.driftT, this.driftP+50)*.4;

	this.velocity.x*=coeff;
	this.velocity.y*=coeff;

	this.x+=this.velocity.x;
	this.y+=this.velocity.y;
}
Child.prototype.display = function(){

	var ctx=this.context;

	if(this.appearAlpha===undefined)this.appearAlpha=0;
	if(this.appearAlpha<1)this.appearAlpha=Math.min(1, this.appearAlpha+.05);
	ctx.globalAlpha=this.appearAlpha;

	var h = this.hoverAmp || 0;

	if(this.lastNodeSelected)ctx.fillStyle=this.colors[1];
	else if(h && typeof lerpHexColor === 'function')
		ctx.fillStyle=lerpHexColor(this.colors[0], this.colors[2], HOVER_DARK*h);
	else ctx.fillStyle=this.colors[0];

	if(this.breathT===undefined){ this.breathT=Math.random()*6.28; this.breathS=.02+Math.random()*.02; }
	this.breathT+=this.breathS;
	var s = Math.sin(this.breathT);
	var breath = (s>.6) ? 1-((s-.6)/.4)*.3 : 1;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius*2*breath*(1 + HOVER_GROW*h), 0, 2*Math.PI);
    ctx.fill();
    ctx.closePath();

	ctx.globalAlpha=1;
}
