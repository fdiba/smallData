function Child(config){

	this.canvasId=config.canvasId;
	this.canvas=document.getElementById(this.canvasId);
	this.context=this.canvas.getContext("2d");

	this.scale = config.scale;

	//blue peter river, maroon
	this.colors=["#3498db", "#800000"];

	this.x=config.x;
	this.y=config.y;

	// this.edition = config.edition;
	// this.year = config.year;
	// this.price = config.price;
	this.imeb_id = config.imeb_id;
	this.fn = config.fn;
	this.ln = config.ln;
	this.title = config.title;
	this.duration = config.duration;
	// this.cat = config.cat;
	// this.sub_cat = config.sub_cat;
	// this.isni = config.isni;
	
	this.id=config.id;

	this.radius=3.5*this.scale+Math.random()*1.5;

	this.velocity={x:0, y:0};

	this.alpha=.5;

	this.lastNodeSelected=false;
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

	var maxDistance = t_radius*2-8;
	var distance = dist(t_x, this.x, t_y, this.y);

	if(distance>maxDistance && distance>0){

		//rappel proportionnel au depassement, pas a la distance brute
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

				//ressort doux, proportionnel au chevauchement : glisse au lieu de sauter
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
	//derive lente et continue, pour ne jamais etre parfaitement immobile
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

	if(this.lastNodeSelected)ctx.fillStyle=this.colors[1];
	else ctx.fillStyle=this.colors[0];//blue

	//respiration : le diametre se contracte brievement, par intermittence
	if(this.breathT===undefined){ this.breathT=Math.random()*6.28; this.breathS=.02+Math.random()*.02; }
	this.breathT+=this.breathS;
	var s = Math.sin(this.breathT);
	var breath = (s>.6) ? 1-((s-.6)/.4)*.3 : 1;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius*2*breath, 0, 2*Math.PI);
    ctx.fill();
    ctx.closePath();
}