function Particle(config){

	this.canvas = document.getElementById(config.canvasId);
	this.context = this.canvas.getContext("2d");

	this.colors=["#bdc3c7", "#2ecc71"];//midnight blue, green emerald

	this.x=config.x;
	this.y=config.y;
	
	this.ids=[];
	this.ids.push(config.id);

	this.label=config.label;
	this.radius=4;

	this.velocity={x:0, y:0};

	this.alpha=.5;

}
Particle.prototype.update = function(){
	// this.y++;
}
Particle.prototype.getAwayFrom = function(index, arr){

	var ctx = this.context;

	for (var i=0; i<arr.length; i++) {

		if(index!=i && this.ids.length>0 && arr[i].ids.length>0){
		// if(index!=i && this.alive && arr[i].alive){

			if(this.label!=arr[i].label){ //different country --> separate them

				var minDistance = this.radius*2+arr[i].radius*2+2;
				var distance = dist(this.x, arr[i].x, this.y, arr[i].y);

				if(distance<minDistance){ //10

					var x = arr[i].x - this.x;
					var y = arr[i].y - this.y;

					x *=-0.05;
					y *=-0.05;

					this.velocity.x+=x;
					this.velocity.y+=y;

					this.x+=this.velocity.x;
					this.y+=this.velocity.y;

					this.velocity.x*=.9;
					this.velocity.y*=.9;

					ctx.beginPath();
				    ctx.moveTo(this.x, this.y);
				    ctx.lineTo(arr[i].x, arr[i].y);
				    ctx.strokeStyle = 'rgba(0, 0, 0,'+this.alpha+')';
				    ctx.lineWidth = 2;
				    ctx.stroke();

				}

			} else { //same country --> fuse them

				var x = arr[i].x - this.x;
				var y = arr[i].y - this.y;

				x *=0.05;
				y *=0.05;

				this.velocity.x+=x;
				this.velocity.y+=y;

				this.x+=this.velocity.x;
				this.y+=this.velocity.y;

				this.velocity.x*=.2;
				this.velocity.y*=.2;

				ctx.beginPath();
			    ctx.moveTo(this.x, this.y);
			    ctx.lineTo(arr[i].x, arr[i].y);
			    ctx.strokeStyle = 'rgba(0, 0, 0,'+this.alpha+')';
			    ctx.lineWidth = 1;
			    ctx.stroke();


			    var minDistance = this.radius*2+arr[i].radius*2+2;
				var distance = dist(this.x, arr[i].x, this.y, arr[i].y);

			    if(distance<2){

			    	if(this.ids.length===1 && arr[i].ids.length===1){
			    		console.log("case 1");
			    		this.ids.push(arr[i].ids.pop());
			    		arr[i].alive=false;
			    	} else if(this.ids.length===2 && arr[i].ids.length===1){
			    		console.log("case 2");
		    			this.ids.push(arr[i].ids.pop());
		    			this.radius+=1;
		    			arr[i].alive=false;
			    	
			    		
			    	} else if(this.ids.length>=2 && arr[i].ids.length>=2){
			    		console.log("case 3");
			    		
			    		//var value=arr[i].ids.length-1;

		    			/*for (var j=value; j>=0; j--) {
		    				this.ids.push(arr[j].ids.pop());
		    				this.radius+=1;
		    			}
		    			console.log("next: ", arr[i].ids.length);*/

			    		
			    	} else {
			    		console.log("case 4");
			    		console.log(this.ids.length, arr[i].ids.length);

			    		if(this.ids.length>arr[i].ids.length){

			    			var value=arr[i].ids.length-1;

			    			for (var j=value; j>=0; j--) {
		    					this.ids.push(arr[i].ids.pop());
		    					this.radius+=.4;
		    				}

			    		}
			    	}
				}
			}		
		}
	}
}
Particle.prototype.display = function(){
	
	var ctx=this.context;

	if(this.ids.length===1)ctx.fillStyle=this.colors[0];
	else ctx.fillStyle=this.colors[1];
    // else ctx.fillStyle='rgba(46, 204, 113,'+this.alpha+')';

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius*2, 0, 2*Math.PI);
    ctx.fill();
    ctx.closePath();

}
Particle.prototype.checkEdges = function(){
	/*if(this.x<-this.radius*2)this.x=this.canvas.width+this.radius*2;
	else if(this.x>this.canvas.width+this.radius*2)this.x=-this.radius*2;

	if(this.y<-this.radius*2)this.y=this.canvas.height+this.radius*2;
	else if(this.y>this.canvas.height+this.radius*2)this.y=-this.radius*2;*/

	if(this.x<0)this.x=this.canvas.width;
	else if(this.x>this.canvas.width)this.x=0;

	if(this.y<0)this.y=this.canvas.height;
	else if(this.y>this.canvas.height)this.y=0;
}