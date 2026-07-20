function Child(config){

	this.canvasId=config.canvasId;
	this.canvas=document.getElementById(this.canvasId);
	this.context=this.canvas.getContext("2d");

	this.scale = config.scale;

	//blue peter river, maroon
	this.colors=["#3498db", "#800000"];

	this.x=config.x;
	this.y=config.y;

	this.edition = config.edition;
	this.year = config.year;
	this.price = config.price;
	this.imeb_id = config.imeb_id;
	this.fn = config.fn;
	this.ln = config.ln;
	this.title = config.title;
	this.duration = config.duration;
	this.cat = config.cat;
	this.sub_cat = config.sub_cat;
	this.isni = config.isni;
	
	this.id=config.id;

	this.radius=2.*this.scale+Math.random()*2.;

	this.velocity={x:0, y:0};

	this.alpha=.5;

	this.lastNodeSelected=false;
}
Child.prototype.getAwayFromCenter = function(t_x, t_y, t_radius){

	var minDistance = 12*this.scale;

	var distance = dist(t_x, this.x, t_y, this.y);

	if(distance<minDistance){

		var x = t_x - this.x;
		var y = t_y - this.y;

		x *=-0.15;
		y *=-0.15;

		this.velocity.x+=x;
		this.velocity.y+=y;
	}
}
Child.prototype.getCloseTo = function(t_x, t_y, t_radius){

	var maxDistance = t_radius*2-8;
	var distance = dist(t_x, this.x, t_y, this.y);

	if(distance>maxDistance){

		var x = t_x - this.x;
		var y = t_y - this.y;

		x *=0.1;
		y *=0.1;

		this.velocity.x+=x;
		this.velocity.y+=y;
	}
}
Child.prototype.getAwayFrom = function(arr, radius, index){

	for (var i=0; i<arr.length; i++) {

		if(index!==i){

			var minDistance = this.radius*2+arr[i].radius*2+2;
			var distance = dist(this.x, arr[i].x, this.y, arr[i].y);

			if(distance<minDistance){

				var x = arr[i].x - this.x;
				var y = arr[i].y - this.y;

				x *=-0.5;
				y *=-0.5;

				this.velocity.x+=x;
				this.velocity.y+=y;
			}
		}
	}
}
Child.prototype.reduceVelocityAndUseIt = function(coeff){
	this.velocity.x*=coeff;
	this.velocity.y*=coeff;

	this.x+=this.velocity.x;
	this.y+=this.velocity.y;
}
Child.prototype.display = function(){

	var ctx=this.context;

	if(this.lastNodeSelected)ctx.fillStyle=this.colors[1];
	else ctx.fillStyle=this.colors[0];//blue

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius*2, 0, 2*Math.PI);
    ctx.fill();
    ctx.closePath();
}