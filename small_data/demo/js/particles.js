function Particle(config){

	this.canvasId=config.canvasId;
	this.canvas=document.getElementById(this.canvasId);
	this.context=this.canvas.getContext("2d");

	//midnight blue, green emerald, yellow sun flower, blue peter river
	//#2C3E50 dark blue
	this.colors=["#bdc3c7", "#2ecc71", "#f1c40f", "#3498db", "#2C3E50"];

	this.x=config.x;
	this.y=config.y;

	this.counts=[];
	this.counts.push(config.count);
	
	this.ids=[];
	this.ids.push(config.id);

	this.scale = config.scale;

	this.label=config.label;
	this.radius=Math.random()*2+1.*this.scale;

	this.on = false;
	this.maxSpeed = 4.;

	this.velocity={x:0, y:0};

	this.alpha=.2;
	this.fillAlpha = .1;

	this.color1 = 'rgba(255, 165, 0,'+ this.alpha + ')'; //orange
	this.color2 = 'rgb(52, 152, 219,'+ this.alpha + ')'; //blue
	this.color3 = 'rgba(255, 0, 0, 1)'; //red

	this.font = 10*this.scale + "pt Calibri";

	this.iso=getISO3(this.label);

	this.radius_to_add=config.addRadiusVal;

	this.open=false;
	this.max_extra_radius=20.*this.scale;
	this.extra_radius=0.;
	this.opening=false;

	this.childs=[];

	this.lastHit=-999;
	this.titles=[];

	this.lastNodeSelected=false;
}
Particle.prototype.openOrCloseIt = function(){

	this.open=!this.open;

	if(this.open){

		this.opening=true;

	} else {

		this.childs=[];

		// console.log('close it');	 	
	 	this.extra_radius=0.;
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
        y:this.y-radius+Math.random()*(radius*2),
        scale : this.scale
    });
}

Particle.prototype.addNoiseField = function(coef){

	var x = noise.perlin2(this.x, this.y);
    var y = noise.perlin2(this.x+1000, this.y+1000);
    
    x*=coef/this.ids.length;
    y*=coef/this.ids.length;

	this.velocity.x+=x;
	this.velocity.y+=y;

}
Particle.prototype.SearchCommonsAndGetAwayFrom22 = function (index, arr){

	var ctx = this.context;
	var commonAttributes=[];

	for (var i=index+1; i<arr.length; i++) {

		if(index!=i){

			var minDistance = this.radius*2+arr[i].radius*2+2;
			var distance = dist(this.x, arr[i].x, this.y, arr[i].y);

			if(distance<50){ //TODO PARAM

				//TODO auto search for other attr than label
				if(this.label.localeCompare(arr[i].label)===0){
					//console.log("match");
					if(commonAttributes.length<1){
						commonAttributes.push({name:'label', count:1});
					} else {
						commonAttributes[0].count+=1;
					}
					this.drawLine(this.x, this.y, arr[i].x, arr[i].y, this.color2);
				} else {
					this.drawLine(this.x, this.y, arr[i].x, arr[i].y, this.color1);
				}
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

			    //this.drawLine(this.x, this.y, arr[i].x, arr[i].y, this.color3);

			}
		}
	}
	return commonAttributes;
}
Particle.prototype.drawLine = function(x1, y1, x2, y2, color){
	var ctx = this.context;
	ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}
Particle.prototype.update = function(index, particles){


	if(this.opening){
		if(this.extra_radius<this.max_extra_radius){
			this.radius-=this.extra_radius;
			this.extra_radius+=.5;
			this.radius+=this.extra_radius;
			// console.log(this.radius, " ", this.extra_radius);
		} else if(this.extra_radius==this.max_extra_radius){
			this.opening=false;

			// var txt = this.ids.toString();
			var txt = this.ids.length+' composers';
			$("#selection p").text(txt);

		 	for (var i = 0; i < this.ids.length; i++) {
		 		this.childs.push(this.createNewChild(this.ids[i], this.counts[i]));
		 	}
		}
	} else if(this.open){

		if(this.childs.length < this.ids.length){
			this.childs.push(this.createNewChild(this.ids[this.childs.length], this.counts[this.childs.length]));
		}

		var rad_max = 2.+1.*this.scale + this.radius_to_add*(this.ids.length-1) + this.max_extra_radius;

		if(this.radius< rad_max)this.radius+=.1;

	} else if(!this.open){
		if(this.radius>2.+1.*this.scale + this.radius_to_add*(this.ids.length-1)){
			this.radius-=1.;
		}
	}

	for (var i = 0; i < this.childs.length; i++) {
		this.childs[i].getAwayFrom(this.childs, this.radius, i);
		this.childs[i].getCloseTo(this.x, this.y, this.radius);
		this.childs[i].getAwayFromCenter(this.x, this.y, this.radius);
		this.childs[i].reduceVelocityAndUseIt(.3);
	}

	if(this.on)this.mergeNodesAndFindTarget(index, particles);
	// if(this.on)particles[index].mergeNodesAndFindTarget(index, particles);
	
    this.checkEdgesV2();
    // particles[index].checkEdgesV2();

    this.velocity.x /= this.ids.length;
    this.velocity.y /= this.ids.length;

    var maxSpeed = this.maxSpeed;

	this.velocity.x = Math.min(Math.max(this.velocity.x, -maxSpeed), maxSpeed);
	this.velocity.y = Math.min(Math.max(this.velocity.y, -maxSpeed), maxSpeed);

	this.x+=this.velocity.x;
	this.y+=this.velocity.y;

	//les enfants (cercles bleus) suivent le deplacement de leur parent ouvert
	for (var k=0; k<this.childs.length; k++) {
		this.childs[k].x += this.velocity.x;
		this.childs[k].y += this.velocity.y;
	}

	this.velocity.x*=.9;
	this.velocity.y*=.9;
	
}
Particle.prototype.updateBeforeMerging = function(){

	var maxSpeed = this.maxSpeed;

	//this.velocity.x += (Math.random()*2.-1.)*.1;
	//this.velocity.y += (Math.random()*2.-1.)*.1;

	//this.velocity.x *= (2. - this.ids.length/600);
	//this.velocity.y *= (2. - this.ids.length/600);

	this.velocity.x = Math.min(Math.max(this.velocity.x, -maxSpeed), maxSpeed);
	this.velocity.y = Math.min(Math.max(this.velocity.y, -maxSpeed), maxSpeed);

	this.x+=this.velocity.x;
	this.y+=this.velocity.y;

	this.velocity.x*=.9;
	this.velocity.y*=.9;


}
Particle.prototype.getCloserFrom = function(target){

	var x = target.x - this.x;
	var y = target.y - this.y;

	x *= 0.3;
	y *= 0.3;

	this.velocity.x += x;
	this.velocity.y += y;

}
Particle.prototype.getAwayFrom = function(index, particles){

	var target_id = -1;
	var target_numOfChilds = -1;

	for (var i=0; i<particles.length; i++) {

		if(index!==i
			&& this.label.localeCompare(particles[i].label)!==0
			//&& this.ids.length>1
			//&& this.ids.length>3 
			){

			var minDistance = this.radius*2 + particles[i].radius*2 + 10;
			var distance = dist(this.x, particles[i].x, this.y, particles[i].y);

			if(distance<minDistance){

				//select target to go away
				if(target_numOfChilds<particles[i].ids.length){
					target_numOfChilds = particles[i].ids.length;
					target_id = i;
				}
			}
		}
	}

	if(target_id>=0){

		var x = particles[target_id].x - this.x;
		var y = particles[target_id].y - this.y;

		x *= .3;
		y *= .3;

		this.velocity.x -=x;
		this.velocity.y -=y;

		//console.log("labels:", this.label, particles[target_id].label);

	}
}
Particle.prototype.mergeNodesAndFindTarget = function(index, particles){

	var maxDistance = 9999;
	var target_id = -1;

	for (var i=0; i<particles.length; i++) {

		//if(index!=i && this.ids.length>0 && particles[i].ids.length>0){
		if(index!=i){

			if(this.label.localeCompare(particles[i].label)===0){

				var minDistance = Math.min(this.radius, particles[i].radius);
				var distance = dist(this.x, particles[i].x, this.y, particles[i].y);

				//if two nodes are sharing the same property and are colliding
				//and if the targeted particle has less child than this one --> eat it
				if(distance<minDistance && this.ids.length >= particles[i].ids.length){

					//TODO UPDATE IT ? radius to add
			    	var val=this.radius_to_add;
			    		
		    		for (var j=particles[i].ids.length-1; j>=0; j--) {
    					this.ids.push(particles[i].ids.pop());
    					this.counts.push(particles[i].counts.pop());
    					this.radius+=val;
    				}

		    		particles[i].alive=false;
		    		break;

		    	//if the particle has less child than the target --> follow the target
				//} else if(this.ids.length<=particles[i].ids.length){
				} else if(this.ids.length<=particles[i].ids.length){

					if(distance<maxDistance){
						maxDistance=distance;
						target_id=i;
					}

				}
			}	
		}
	}

	if(target_id>=0)this.getCloserFrom(particles[target_id]);
	//un regroupement ouvert ignore les petits noeuds isoles
	//mais s'ecarte des autres regroupements pour ne pas les recouvrir
	else if(!this.open)this.getAwayFrom(index, particles);
	else this.getAwayFromGroups(index, particles);
	
}
Particle.prototype.display = function(){
	
	var ctx=this.context;

	if(this.fillAlpha<1) {
		this.fillAlpha+=.03;
	}

	//TODO do it somewhere else
	if(this.ids.length===1) {
		
		if(this.fillAlpha<1) ctx.fillStyle='rgba(189,195,199,'+this.fillAlpha+')'; //grey;
		else ctx.fillStyle=this.colors[0];

		if(this.lastNodeSelected)ctx.fillStyle=this.colors[4];

		ctx.beginPath();
	    ctx.arc(this.x, this.y, this.radius*2*this.fillAlpha, 0, 2*Math.PI);
	    ctx.fill();
	    ctx.closePath();


	} else if(this.open){

		/*ctx.fillStyle="#999";

		ctx.beginPath();
	    ctx.arc(this.x, this.y, this.radius*2*this.fillAlpha+2, 0, 2*Math.PI);
	    ctx.fill();
	    ctx.closePath();*/
	    
		ctx.fillStyle=this.colors[2];//yellow

		ctx.beginPath();
	    ctx.arc(this.x, this.y, this.radius*2*this.fillAlpha, 0, 2*Math.PI);
	    ctx.fill();
	    ctx.closePath();

	} else {
		ctx.fillStyle=this.colors[1];//green

		/*ctx.fillStyle="#999";

		ctx.beginPath();
	    ctx.arc(this.x, this.y, this.radius*2*this.fillAlpha+2, 0, 2*Math.PI);
	    ctx.fill();
	    ctx.closePath();

		ctx.fillStyle="#FFF";*/

		ctx.beginPath();
	    ctx.arc(this.x, this.y, this.radius*2*this.fillAlpha, 0, 2*Math.PI);
	    ctx.fill();
	    ctx.closePath();
	}


    

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
Particle.prototype.checkEdgesV1 = function(){
	

	if(this.x<0)this.x=this.canvas.width;
	else if(this.x>this.canvas.width)this.x=0;

	if(this.y<0)this.y=this.canvas.height;
	else if(this.y>this.canvas.height)this.y=0;

	
	
}
Particle.prototype.checkEdgesV2 = function(){

	if(this.ids.length>1){

		var border = this.radius*2+25;

		if(this.x<border || this.x>this.canvas.width-border ||
			this.y<border || this.y>this.canvas.height-border){

			var x = this.canvas.width/2 - this.x;
			var y = this.canvas.height/2 - this.y;
			
			x *=1.;
			y *=1.;

			this.velocity.x+=x;
			this.velocity.y+=y;

		}

	} else {

		if(this.x<0)this.x=this.canvas.width;
		else if(this.x>this.canvas.width)this.x=0;

		if(this.y<0)this.y=this.canvas.height;
		else if(this.y>this.canvas.height)this.y=0;

	}
	
}
//evitement reserve aux regroupements : pousse douce, proportionnelle au
//chevauchement ; premultipliee par ids.length car update() divise la
//vitesse par la taille du groupe
Particle.prototype.getAwayFromGroups = function(index, particles){

	for (var i=0; i<particles.length; i++) {

		//les regroupements qui partagent la meme valeur de propriete sont des
		//candidats a la fusion : on ne les repousse pas, on les laisse approcher
		var sameValue = this.targetedAttr!=="" && this[this.targetedAttr]!=="" &&
			String(this[this.targetedAttr]).localeCompare(String(particles[i][particles[i].targetedAttr]))===0;

		if(index!==i && particles[i].ids.length>1 && !sameValue){

			var minDistance = this.radius*2 + particles[i].radius*2 + 10;
			var distance = dist(this.x, particles[i].x, this.y, particles[i].y);

			if(distance<minDistance && distance>0){

				var x = (particles[i].x - this.x)/distance;
				var y = (particles[i].y - this.y)/distance;

				var push = (minDistance - distance)*.05*this.ids.length;

				this.velocity.x -= x*push;
				this.velocity.y -= y*push;
			}
		}
	}
}
