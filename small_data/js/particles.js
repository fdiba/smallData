function Particle(config){

	this.canvas = document.getElementById(config.canvasId);
	this.context = this.canvas.getContext("2d");


	this.color="#e74c3c";//red alizarin

	this.x=config.x;
	this.y=config.y;
	this.label=config.label;
	this.radius=4;
}
Particle.prototype.update = function(){
	// this.y++;
}
Particle.prototype.display = function(){
	
	var ctx=this.context;

	ctx.fillStyle=this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius*2, 0, 2*Math.PI);
    ctx.fill();
    ctx.closePath();

}
Particle.prototype.checkEdges = function(){
	if(this.x<-this.radius*2)this.x=this.canvas.width+this.radius*2;
	else if(this.x>this.canvas.width+this.radius*2)this.x=-this.radius*2;

	if(this.y<-this.radius*2)this.y=this.canvas.height+this.radius*2;
	else if(this.y>this.canvas.height+this.radius*2)this.y=-this.radius*2;
}