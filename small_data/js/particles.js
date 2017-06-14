function Particle(config){

	this.canvasId=config.canvasId;
	this.canvas=document.getElementById(this.canvasId);
	this.context=this.canvas.getContext("2d");

	//midnight blue, green emerald, yellow sun flower, blue peter river
	this.colors=["#bdc3c7", "#2ecc71", "#f1c40f", "#3498db"];

	this.x=config.x;
	this.y=config.y;

	this.counts=[];
	this.counts.push(config.count);
	
	this.ids=[];
	this.ids.push(config.id);

	this.label=config.label;
	this.radius=4;

	//particles.push(createNewParticle(composers[i].id, allData[index+1], composers[i].count, 1));
	//particles.push(createNewParticle(100, "France", 3, 1));

	/*canvasId: "myCanvas",
    count: count,
    addRadiusVal: addRadiusVal,
    id: id,
    label: ctry,
    x:canvas.width/2-radius+Math.random()*(radius*2),
    y:canvas.height/2-radius+Math.random()*(radius*2)*/

	this.velocity={x:0, y:0};

	this.alpha=.2;

	this.font = "10pt Calibri";

	this.iso=getISO3(this.label);

	this.addValue=config.addRadiusVal; //radius

	this.open=false;
	this.r_addon=16;

	this.childs=[];

	this.lastHit=-999;
	this.titles=[];

}
Particle.prototype.openOrCloseIt = function(){

	this.open=!this.open;

	if(this.open){

		// var txt = this.ids.toString();
		var txt = this.ids.length+' composers';
		$("#selection p").text(txt);

		// console.log('open it');
	 	this.radius+=this.r_addon;

	 	for (var i = 0; i < this.ids.length; i++) {
	 		this.childs.push(this.createNewChild(this.ids[i], this.counts[i]));
	 	}

	} else {

		this.childs=[];

		// console.log('close it');
	 	this.radius-=this.r_addon;
	 	this.lastHit=-999;

	 	$("#selection").empty();
	 	$("#titles").empty();

	}

	// console.log(this.radius);
 	
}
Particle.prototype.processChilds=function(mouseX, mouseY){

	var targeted=false;
	var childs=this.childs;

	for (var i=0; i<childs.length; i++) {

		var distance=dist(mouseX, childs[i].x, mouseY, childs[i].y)
        if(distance<=childs[i].radius*2){

        	if(childs[i].id !== this.lastHit){
        		console.log('id:', childs[i].id, 'count:', childs[i].count);
        		this.getTitlesFrom(childs[i].id);
        		this.lastHit=childs[i].id;

        	}

        	targeted=true;
        	break;
        }

	}
	return targeted;
}
Particle.prototype.getTitlesFrom=function(artist_id){

    $.ajax({                                      
        url: 'php/retrieve_data.php',       
        type: "POST",
        data: { aId: artist_id, case:11 } 
    }).done(function(str) {

        var arr=str.split("%");
        this.titles=[];

        for (var i=0; i<arr.length-6; i+=7) {

        	if(i===0)displayFirstnameAndNameGN({fn:arr[i+5], n:arr[i+6]});
            this.titles.push({id:arr[i], t:arr[i+1], d:arr[i+2], m:arr[i+3], ed:arr[i+4]});
        }

        if(this.titles.length<1)$("#selection").empty();
        displayTitlesInfosGN(this.titles);

    });


}
Particle.prototype.createNewChild=function(id, count){

    var radius=this.radius;

    return new Child({
        canvasId: this.canvasId,
        id: id,
        count: count,
        label: this.label,
        x:this.x-radius+Math.random()*(radius*2),
        y:this.y-radius+Math.random()*(radius*2)
    });
}

Particle.prototype.addNoiseField = function(coef){

	var x = noise.perlin2(this.x, this.y);
    var y = noise.perlin2(this.x+1000, this.y+1000);
    
    x*=coef/this.ids.length;
    y*=coef/this.ids.length;

	this.velocity.x+=x;
	this.velocity.y+=y;

	this.x+=this.velocity.x;
	this.y+=this.velocity.y;

	this.velocity.x*=.9;
	this.velocity.y*=.9;

	//for (var i = 0; i < this.childs.length; i++) {
		//this.getAwayFrom22(index, arr);
		//this.childs[i].getCloseTo(this.x, this.y, this.radius);
		//this.childs[i].getAwayFromCenter(this.x, this.y, this.radius);
		//this.childs[i].reduceVelocityAndUseIt(.3);
	//}

}
Particle.prototype.SearchCommonsAndGetAwayFrom22 = function (index, arr){

	var ctx = this.context;
	var commonAttributes=[];
	var alpha = .4;
	var color = 'rgba(255,165,0,'+alpha+')'; //orange

	for (var i=0; i<arr.length; i++) {

		if(index!=i){

			var minDistance = this.radius*2+arr[i].radius*2+2;
			var distance = dist(this.x, arr[i].x, this.y, arr[i].y);

			if(distance<50){ //TODO PARAM

				//TODO auto search for other attr than label
				if(this.label.localeCompare(arr[i].label)==0){
					//console.log("match");
					if(commonAttributes.length<1){
						commonAttributes.push({name:'label', count:1});
					} else {
						commonAttributes[0].count+=1;
					}
					color = 'rgb(52,152,219,'+alpha+')';
				}

				ctx.beginPath();
			    ctx.moveTo(this.x, this.y);
			    ctx.lineTo(arr[i].x, arr[i].y);
			    ctx.strokeStyle = color;
			    ctx.lineWidth = 2;
			    ctx.stroke();

			}

			//get away from each other if
			if(distance<minDistance){

				var x = arr[i].x - this.x;
				var y = arr[i].y - this.y;

				x *=-0.1;
				y *=-0.1;

				this.velocity.x+=x;
				this.velocity.y+=y;

				this.x+=this.velocity.x;
				this.y+=this.velocity.y;

				this.velocity.x*=.9;
				this.velocity.y*=.9;

				ctx.beginPath();
			    ctx.moveTo(this.x, this.y);
			    ctx.lineTo(arr[i].x, arr[i].y);
			    ctx.strokeStyle = 'rgba(0, 0, 0,'+alpha+')';
			    ctx.lineWidth = 2;
			    ctx.stroke();

			}
		}
	}

	return commonAttributes;
}
Particle.prototype.update = function(){

	for (var i = 0; i < this.childs.length; i++) {
		this.childs[i].getAwayFrom(this.childs, this.radius);
		this.childs[i].getCloseTo(this.x, this.y, this.radius);
		this.childs[i].getAwayFromCenter(this.x, this.y, this.radius);
		this.childs[i].reduceVelocityAndUseIt(.3);
	}
	
}
Particle.prototype.getAwayOrCloserFrom = function(index, arr){

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

					x /= this.ids.length;
					y /= this.ids.length;

					this.velocity.x+=x;
					this.velocity.y+=y;

					this.x+=this.velocity.x;
					this.y+=this.velocity.y;

					this.velocity.x*=.9;
					this.velocity.y*=.9;

					ctx.beginPath();
				    ctx.moveTo(this.x, this.y);
				    ctx.lineTo(arr[i].x, arr[i].y);
				    ctx.strokeStyle = 'rgba(255, 0, 0,'+this.alpha+')';
				    ctx.lineWidth = 1;
				    ctx.stroke();

				}

			} else { //same country --> fuse them

				var x = arr[i].x - this.x;
				var y = arr[i].y - this.y;

				x *=0.05;
				y *=0.05;

				x /= this.ids.length;
				y /= this.ids.length;

				this.velocity.x+=x;
				this.velocity.y+=y;

				this.velocity.x = Math.min(Math.max(this.velocity.x, -2), 2)
				this.velocity.y = Math.min(Math.max(this.velocity.y, -2), 2);

				this.x+=this.velocity.x;
				this.y+=this.velocity.y;
				

				this.velocity.x*=.2;
				this.velocity.y*=.2;

				ctx.beginPath();
			    ctx.moveTo(this.x, this.y);
			    ctx.lineTo(arr[i].x, arr[i].y);
			    ctx.strokeStyle = 'rgb(52,152,219,'+this.alpha+')'; //blue
			    ctx.lineWidth = 1;
			    ctx.stroke();


			    var minDistance = this.radius*2+arr[i].radius*2+2;
				var distance = dist(this.x, arr[i].x, this.y, arr[i].y);

			    if(distance<minDistance){

			    	//TODO UPDATE IT
			    	var val=this.addValue;
			    	// if(this.composers.length%2===0 && this.composers.length>10)val=0;

			    	if(arr[i].ids.length===1){
			    		
			    		// console.log("case 1");
			    		this.ids.push(arr[i].ids.pop());
			    		this.counts.push(arr[i].counts.pop());

			    		this.radius+=val;
			    		arr[i].alive=false;

			    		//TRYOUTS DELAY
			    		break;

			    	} else {
			    		/*console.log("case 2");
			    		console.log(this.ids.length, arr[i].ids.length);*/
			    		if(this.ids.length>=arr[i].ids.length){
			    			for (var j=arr[i].ids.length-1; j>=0; j--) {
		    					
		    					this.ids.push(arr[i].ids.pop());
		    					this.counts.push(arr[i].counts.pop());

		    					this.radius+=val;
		    				}
		    				arr[i].alive=false;

		    				//TRYOUTS DELAY
		    				break;
			    		}
			    	}
				}
			}		
		}
	}
}
Particle.prototype.display = function(){
	
	var ctx=this.context;

	//TODO do it somewhere else
	if(this.ids.length===1)ctx.fillStyle=this.colors[0];//grey
	else if(this.open)ctx.fillStyle=this.colors[2];//yellow
	else ctx.fillStyle=this.colors[1];//green

    //DEBUG
    //ctx.fillStyle='rgba(0, 0, 0, .2)';

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius*2, 0, 2*Math.PI);
    ctx.fill();
    ctx.closePath();

    for (var i = 0; i < this.childs.length; i++) {
		this.childs[i].display();
	}

    if(this.ids.length>3 || this.open){

    	ctx.font = this.font;
	    ctx.fillStyle = "black";
	    ctx.textAlign = "center";
	    ctx.textBaseline = "middle";

	    ctx.fillText(this.iso, this.x, this.y);

    }

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