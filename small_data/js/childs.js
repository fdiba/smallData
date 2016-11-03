function Child(config){

	this.canvasId=config.canvasId;
	this.canvas=document.getElementById(this.canvasId);
	this.context=this.canvas.getContext("2d");

	//blue peter river
	this.colors=["#3498db"];

	this.x=config.x;
	this.y=config.y;
	
	this.id=config.id;

	this.label=config.label;
	this.radius=3;

	this.velocity={x:0, y:0};

	this.alpha=.5;
}
Child.prototype.getAwayFromCenter = function(t_x, t_y, t_radius){

	var minDistance = 30;

	var distance = dist(t_x, this.x, t_y, this.y);

	if(distance<minDistance){

		var x = t_x - this.x;
		var y = t_y - this.y;

		x *=-0.4;
		y *=-0.4;

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
Child.prototype.getAwayFrom = function(arr, radius){

	for (var i=0; i<arr.length; i++) {

		if(this.id!=arr[i].id){

			var minDistance = this.radius*2+arr[i].radius*2+2;
			var distance = dist(this.x, arr[i].x, this.y, arr[i].y);

			if(distance<minDistance){

				var x = arr[i].x - this.x;
				var y = arr[i].y - this.y;

				x *=-0.2;
				y *=-0.2;

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

	ctx.fillStyle=this.colors[0];//blue

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius*2, 0, 2*Math.PI);
    ctx.fill();
    ctx.closePath();


}