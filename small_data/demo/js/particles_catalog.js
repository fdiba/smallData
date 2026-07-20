function Particle(config){

	this.canvasId=config.canvasId;
	this.canvas=document.getElementById(this.canvasId);
	this.context=this.canvas.getContext("2d");

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

	this.id = config.id;

	this.records = [{edition:this.edition, year:this.year, price:this.price,
					imeb_id:this.imeb_id, fn:this.fn, ln:this.ln, title:this.title,
					duration:this.duration, cat:this.cat, sub_cat:this.sub_cat,
					isni:this.isni, id:this.id}];

	//midnight blue, green emerald, yellow sun flower, blue peter river
	//#2C3E50 dark blue
	this.colors=["#bdc3c7", "#2ecc71", "#f1c40f", "#3498db", "#2C3E50"];

	this.alpha=.2;
	this.color1 = 'rgba(255, 165, 0,'+ this.alpha + ')'; //orange
	this.color2 = 'rgb(52, 152, 219,'+ this.alpha + ')'; //blue

	this.x=config.x;
	this.y=config.y;

	this.scale = config.scale;
	this.radVar = Math.random()*2;
	this.radius_to_add =  config.radius_to_add;
	this.radius = this.setSmallRadius();

	this.velocity={x:0, y:0};

	this.fillAlpha = .1;
	this.maxSpeed = 4.;

	this.open=false;
	this.childs=[];

	//SMA ----------
	// this.attrOfInterest = ['edition', 'year', 'price', 'ln', 'duration', 'cat', 'sub_cat', 'isni'];
	this.attrOfInterest = ['ln', 'duration', 'title'];
	this.targetedAttr="";
	this.on = false;

	this.opening=false;

	this.extra_rad=0.;
	this.max_extra_rad=20.*this.scale;

	this.lastNodeSelected=false;

}
Particle.prototype.setSmallRadius = function(){
	//croissance en racine carree (l'aire suit le nombre d'oeuvres) et plafond
	//lie a la taille du canvas : les gros regroupements laissent de la place aux autres
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
}
Particle.prototype.openOrCloseIt = function(){
	
	// console.log("open close: ", this.radius, this.extra_rad, this.max_extra_rad);
	if(!this.open){
		//rayon d'ouverture dimensionne pour loger tous les membres (cercles bleus),
		//dans la limite du canvas
		var needed = 6.*Math.sqrt(this.records.length)*this.scale;
		var maxOpen = Math.min(this.canvas.width, this.canvas.height)/4. - 20.;
		var base = this.setSmallRadius();
		this.max_extra_rad = Math.max(20.*this.scale, Math.min(Math.max(needed, base+20.*this.scale), maxOpen) - base);
		this.open_step = Math.max(.5, this.max_extra_rad/40.);

		this.opening=true;
		// console.log('open it');

	} else {

		this.childs=[];

		console.log('close it');	 

	 	this.extra_rad=0.;
	 	this.lastHit=-999;

	 	$("#cookies").empty();
	 	$("#selection").empty();
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
        ln: obj.ln,
        title: obj.title,
        duration: obj.duration,
        cat: obj.cat,
        sub_cat: obj.sub_cat,
        isni: obj.isni,
        
        id: obj.id,        

        x:this.x-radius+Math.random()*(radius*2),
        y:this.y-radius+Math.random()*(radius*2),
        scale : this.scale
    });
}
Particle.prototype.processChilds=function(mouseX, mouseY){

	var targeted=false;
	var childs=this.childs;
	// console.log("childs: " + childs.length);

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

	// console.log('hit');

	//could add id
	/*var propNames =  ["edition", "year", "price", "imeb_id", "title",
					"duration", "cat", "sub_cat", "fn", "ln", "isni"];*/

	var propNames =  ["imeb_id", "title", "duration", "fn", "ln"];
	
	$("#titles").empty();

	for (var i = 0; i < propNames.length; i++) {

		var value = target[propNames[i]];

		if(value!=="" && propNames[i].localeCompare(this.targetedAttr)!==0){

			if(propNames[i].localeCompare("isni")===0){
				value="<a target=\"_blank\" href=\"http://www.isni.org/isni/" + value + "\">"+ value +"</a>";
			} 
			
			$("#titles").append('<p>'+ propNames[i] + ': ' + value +'</p>');
		}
	}

	// $("#titles").append('<p>'+ target.id +'</p>');

}
Particle.prototype.update = function(i, particles){

	if(this.opening){

		// console.log("open close: ", this.radius, this.extra_radius, this.max_extra_radius);

		if(this.extra_rad<this.max_extra_rad){
			
			this.radius-=this.extra_rad;
			this.extra_rad+=this.open_step;
			this.radius+=this.extra_rad;
			
			// console.log(this.radius, " ", this.extra_radius);
		
		} else if(this.extra_radius==this.max_extra_radius){ //TODO BUG ERASE SUDDEN RADIUS BUMP!!!

			this.opening=false;


			var txt = this.records.length+' elements';
			$("#selection p").text(txt);

		 	for (var i = 0; i < this.records.length; i++) {
		 		this.childs.push(this.createNewChild(this.records[i]));
		 	}
		}

	} else if(this.open){

		if(this.childs.length < this.records.length){
			// console.log(this.childs.length, " ", this.records.length);
			this.childs.push(this.createNewChild(this.records[this.childs.length]));
		}

		var rad_max = this.setSmallRadius() + this.max_extra_rad;

		if(this.radius< rad_max)this.radius+=.1;
			
	} else if(!this.open){
		if(this.radius>this.setSmallRadius())this.radius=Math.max(this.setSmallRadius(), this.radius-3.);
	}

	for (var j=0; j<this.childs.length; j++) {
		this.childs[j].getAwayFrom(this.childs, this.radius, j);
		this.childs[j].getCloseTo(this.x, this.y, this.radius);
		this.childs[j].getAwayFromCenter(this.x, this.y, this.radius);
		this.childs[j].reduceVelocityAndUseIt(.3);
	}

	if(this.on)this.mergeNodesAndFindTarget(i, particles);

	this.checkEdgesV2();

	this.velocity.x /= this.records.length;
    this.velocity.y /= this.records.length;

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
Particle.prototype.mergeNodesAndFindTarget = function(index, particles){

	var maxDistance = 9999;
	var target_id = -1;

	var targetedAttrName = this.targetedAttr;
	var targetedAttrValue = this[this.targetedAttr];

	// console.log("targetedAttr: " + targetedAttrName + " " + targetedAttrValue);

	for (var i=0; i<particles.length; i++) {

		if(index!=i){

			if(targetedAttrValue.localeCompare(particles[i][particles[i].targetedAttr])===0 &&
				particles[i][particles[i].targetedAttr] !== ""){

				// console.log(this.targetedAttr, " ", this[targetedAttr], " ", particles[i].targetedAttr);

				var minDistance = Math.min(this.radius, particles[i].radius);
				var distance = dist(this.x, particles[i].x, this.y, particles[i].y);

				//if two nodes are sharing the same property and are colliding
				//and if the targeted particle has less child than this one --> eat it
				if(distance<minDistance && this.records.length >= particles[i].records.length){

					//TODO UPDATE IT ? radius to add
			    	var val=this.radius_to_add; //conserve pour reference

					for (var j=particles[i].records.length-1; j>=0; j--) {
						var newRecord = particles[i].records.pop();
						this.records.push(newRecord);
					}

					//rayon recalcule (racine carree + plafond), pas d'increment lineaire
					if(!this.open)this.radius = this.setSmallRadius();

		    		particles[i].alive=false;
		    		break;

		    	//if the particle has less child than the target --> follow the target
				} else if(this.records.length<=particles[i].records.length){

					if(distance<maxDistance){
						maxDistance=distance;
						target_id=i;
					}
				}
			}	
		}
	}

	if(target_id>=0){
		this.getCloserFrom(particles[target_id]);
	} else if(!this.open){
		//un regroupement ferme garde son evitement d'origine
		this.getAwayFrom(index, particles);
	} else {
		//ouvert : ignore les petits noeuds isoles, mais s'ecarte des autres
		//regroupements (verts ou jaunes) pour ne jamais les recouvrir
		this.getAwayFromGroups(index, particles);
	}
}
Particle.prototype.SearchCommonsAttrAndGetAwayFrom = function (arr, index){

	var ctx = this.context;
	var commonAttributes=[];

	for (var i = index+1; i < arr.length; i++) {

		if(index!=i){
			var minDistance = this.radius*2+arr[i].radius*2+2;
			var distance = dist(this.x, arr[i].x, this.y, arr[i].y);
			var atLeastOneAttrInCommonHasBeenFound = false;

			if(distance<50){

				//test all attributes of interest
				// for (var j = 0; j < 2; j++) {
				for (var j = 0; j < this.attrOfInterest.length; j++) {

					var attr = this.attrOfInterest[j];

					if(this[attr].localeCompare(arr[i][attr])===0 && this[attr]!= ""){
					
						// console.log(attr, " ", this[attr], " ", arr[i][attr]);

						if(commonAttributes.hasOwnProperty(attr)){
							commonAttributes[attr]+=1;
						} else {
							commonAttributes[attr]=1;
						}

						atLeastOneAttrInCommonHasBeenFound = true;	
					}
				}

				if(atLeastOneAttrInCommonHasBeenFound) this.drawLine(this.x, this.y, arr[i].x, arr[i].y, this.color2);
				else this.drawLine(this.x, this.y, arr[i].x, arr[i].y, this.color1);
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
				this.velocity.y*=.9

			}
		}
	}
	return commonAttributes;
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
			&& this[this.targetedAttr].localeCompare(particles[i][particles[i].targetedAttr])!==0){

			var minDistance = this.radius*2 + particles[i].radius*2 + 10;
			var distance = dist(this.x, particles[i].x, this.y, particles[i].y);

			if(distance<minDistance){

				//select target to go away
				if(target_numOfChilds<particles[i].records.length){
					target_numOfChilds = particles[i].records.length;
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


	}
}
Particle.prototype.display = function(){

	var ctx=this.context;

	if(this.fillAlpha<1) {
		this.fillAlpha+=.03;
	}

	//TODO do it somewhere else
	if(this.records.length===1) {
		
		if(this.fillAlpha<1) ctx.fillStyle='rgba(189,195,199,'+this.fillAlpha+')'; //grey;
		else ctx.fillStyle=this.colors[0];

		if(this.lastNodeSelected)ctx.fillStyle=this.colors[4];

		ctx.beginPath();
	    ctx.arc(this.x, this.y, this.radius*2*this.fillAlpha, 0, 2*Math.PI);
	    ctx.fill();
	    ctx.closePath();

	} else if(this.open){
	    
		ctx.fillStyle=this.colors[2];//yellow

		ctx.beginPath();
	    ctx.arc(this.x, this.y, this.radius*2*this.fillAlpha, 0, 2*Math.PI);
	    ctx.fill();
	    ctx.closePath();

	} else {
		ctx.fillStyle=this.colors[1];//green

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

	    ctx.fillText(label, this.x, this.y);

    }

}
Particle.prototype.updateBeforeMerging = function(){

	var maxSpeed = this.maxSpeed;

	this.velocity.x = Math.min(Math.max(this.velocity.x, -maxSpeed), maxSpeed);
	this.velocity.y = Math.min(Math.max(this.velocity.y, -maxSpeed), maxSpeed);

	this.x+=this.velocity.x;
	this.y+=this.velocity.y;

	this.velocity.x*=.9;
	this.velocity.y*=.9;

}
Particle.prototype.checkEdgesV2 = function(){

	if(this.records.length>1){

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
Particle.prototype.checkEdgesV1 = function(){
	
	if(this.x<0)this.x=this.canvas.width;
	else if(this.x>this.canvas.width)this.x=0;

	if(this.y<0)this.y=this.canvas.height;
	else if(this.y>this.canvas.height)this.y=0;
	
}
Particle.prototype.addNoiseField = function(coef){

	var x = noise.perlin2(this.x, this.y);
    var y = noise.perlin2(this.x+1000, this.y+1000);
    
    x*=coef/this.records.length;
    y*=coef/this.records.length;

	this.velocity.x+=x;
	this.velocity.y+=y;
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
//evitement reserve aux regroupements : pousse douce, proportionnelle au
//chevauchement ; premultipliee par records.length car update() divise la
//vitesse par la taille du groupe
Particle.prototype.getAwayFromGroups = function(index, particles){

	for (var i=0; i<particles.length; i++) {

		//les regroupements qui partagent la meme valeur de propriete sont des
		//candidats a la fusion : on ne les repousse pas, on les laisse approcher
		var sameValue = this.targetedAttr!=="" && this[this.targetedAttr]!=="" &&
			String(this[this.targetedAttr]).localeCompare(String(particles[i][particles[i].targetedAttr]))===0;

		if(index!==i && particles[i].records.length>1 && !sameValue){

			var minDistance = this.radius*2 + particles[i].radius*2 + 10;
			var distance = dist(this.x, particles[i].x, this.y, particles[i].y);

			if(distance<minDistance && distance>0){

				var x = (particles[i].x - this.x)/distance;
				var y = (particles[i].y - this.y)/distance;

				var push = (minDistance - distance)*.05*this.records.length;

				this.velocity.x -= x*push;
				this.velocity.y -= y*push;
			}
		}
	}
}
