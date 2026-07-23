//--- Reglages du comportement des agents (portes depuis particles_catalog.js) ---
//Agitation des gris (meme valeur que catalog).
var GREY_NOISE = .35;
//Ralentissement cumulatif/temporaire par collision (masse).
var COLL_GAIN  = .4;
var COLL_DECAY = .94;
var COLL_MAX   = 6;
var COLL_MARGIN= 10;
//Repulsion douce d'un gris qui s'ecarte d'un groupe non compatible.
var GREY_REPULSION = .1;
//Evitement anticipe radial (stable) des groupes par un gris.
var AVOID_STRENGTH = 1.4;

//Raideur du "coussin" de bord pour les groupes (verts/jaunes) : ressort doux
//perpendiculaire au mur, proportionnel a l'enfoncement. Monter = bord plus ferme.
var BORDER_PUSH = .03;

//Tampon d'hysteresis du wrap toroidal des gris (px) : evite les teleportations
//en boucle a la couture. Le gris reapparait en retrait de cette marge du bord.
var WRAP_MARGIN = 30;

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
	this.radVar=Math.random()*2;   //variation de taille persistante (comme catalog)
	this.radius=this.radVar+1.*this.scale;

	this.on = false;
	this.maxSpeed = 4.;

	this.velocity={x:0, y:0};
	this.collMass=0;   //masse temporaire accumulee par les collisions

	this.alpha=.2;
	this.fillAlpha = .1;

	this.color1 = 'rgba(255, 165, 0,'+ this.alpha + ')'; //orange
	this.color2 = 'rgb(52, 152, 219,'+ this.alpha + ')'; //blue
	this.color3 = 'rgba(255, 0, 0, 1)'; //red

	this.font = 10*this.scale + "pt Calibri";

	this.iso=getISO3(this.label);

	this.radius_to_add=config.addRadiusVal;

	this.open=false;
	this.max_extra_radius=32.*this.scale; //agrandi : les membres restent loin du bord
	this.extra_radius=0.;
	this.opening=false;

	this.childs=[];

	this.lastHit=-999;
	this.titles=[];

	this.lastNodeSelected=false;

	//rotation des membres affiches quand tous ne tiennent pas dans le disque
	this.memberCursor=0;
	this.rotT=0;
}
Particle.prototype.openOrCloseIt = function(){

	this.open=!this.open;

	if(this.open){

		//cible d'ouverture d'apres la surface reelle des membres
		this.max_extra_radius = Math.max(10., this.computeOpenRadius() - this.radius);

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

	//champ de bruit lisse et evolutif : la 3e dimension avance lentement
	//avec le temps, les courants se reconfigurent au lieu de se figer
	var t = Date.now()*.00006;

	var x = noise.perlin3(this.x/150, this.y/150, t);
    var y = noise.perlin3(this.x/150+7.31, this.y/150+3.17, t);
    
    //la force du champ diminue avec la TAILLE du cercle (masse ~ rayon),
    //au lieu du seul nombre de membres : un gros cercle est moins deplace
    //qu'un petit, et deux gris de tailles differentes reagissent differemment
    var sizeFactor = this.radius/(2.*this.scale);
    if(sizeFactor<1)sizeFactor=1;   //plancher 1 : pas de sur-propulsion des petits (gris)
    x*=coef/sizeFactor;
    y*=coef/sizeFactor;

	//agitation reduite pour les gris (reglable via GREY_NOISE)
	if(this.ids.length===1){ x*=GREY_NOISE; y*=GREY_NOISE; }

	//la masse de collision freine la PROPULSION (a = F/masse), pas la separation
	if(this.collMass){ var cd = 1/(1+this.collMass); x*=cd; y*=cd; }

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

	//derive lente et continue : les regroupements ne deviennent jamais
	//totalement immobiles, meme quand plus rien ne fusionne
	if(this.driftT===undefined){ this.driftT=Math.random()*1000; this.driftP=Math.random()*100; }
	this.driftT+=.008;
	if(this.ids.length>1){
		var driftAmp = (this.open ? .5 : .4)*this.ids.length/(1+this.collMass); //derive un peu plus vive (etait .4/.2), freinee par la masse de collision
		this.velocity.x += noise.perlin2(this.driftT, this.driftP)*driftAmp;
		this.velocity.y += noise.perlin2(this.driftT, this.driftP+50)*driftAmp;
	}


	//les gris isoles s'ecartent doucement de leurs voisins isoles
	//avec lesquels ils ne partagent pas la valeur de propriete ciblee
	if(this.ids.length===1)this.separateFromLoners(index, particles);

	//evitement anticipe (radial, stable) des groupes non compatibles
	this.avoidGroupsAhead(index, particles);

	//masse de collision : ralentissement cumulatif et temporaire, pour TOUS
	//(gris ET groupes) -> la masse se resorbe aussi sur les groupes, sinon un
	//groupe herite d'une collMass figee et devient immobile.
	this.updateMass(index, particles);

	if(this.opening){

		//les membres commencent a apparaitre des le debut de l'ouverture,
		//chacun seulement quand il a de la place
		this.tryAddChild();

		if(this.extra_radius<this.max_extra_radius){
			this.radius-=this.extra_radius;
			this.extra_radius+=.25; //ouverture lente
			this.radius+=this.extra_radius;
			// console.log(this.radius, " ", this.extra_radius);
		} else { //cible atteinte ou depassee : fin d'ouverture
			this.opening=false;

			// var txt = this.ids.toString();
			var txt = this.ids.length+' composers';
			$("#selection p").text(txt);

		}
	} else if(this.open){

		this.tryAddChild();

		//rotation continue : quand des membres restent invisibles faute de
		//place, les affiches fondent tour a tour pour leur ceder la place
		if(this.childs.length < this.ids.length && this.childs.length > 0){
			this.rotT++;
			if(this.rotT>40){
				for (var rc=0; rc<this.childs.length; rc++) {
					if(!this.childs[rc].dying && !this.childs[rc].lastNodeSelected){
						this.childs[rc].dying = true;
						this.rotT = 0;
						break;
					}
				}
			}
		} else {
			this.rotT = 0;
		}

		//cible recalculee en continu : le disque suit la surface reelle
		//de ses membres, absorptions comprises
		var rad_max = this.computeOpenRadius();

		if(this.radius< rad_max)this.radius+=.25;

	} else if(!this.open){
		//taille fermee a saturation douce : les tres gros pays (USA, FRA)
		//plafonnent vers ~33 au lieu de croitre lineairement sans limite
		var target = this.radVar+1.*this.scale + 30.*(1.-Math.exp(-Math.sqrt(this.ids.length-1)/8.))*this.scale;
		if(this.radius>target)this.radius=Math.max(target, this.radius-1.);
		else if(this.radius<target)this.radius=Math.min(target, this.radius+.25); //croissance lente apres fusion
	}

	for (var i = this.childs.length-1; i >= 0; i--) {

		var ch = this.childs[i];

		//disparition progressive : le diametre fond, puis retrait
		if(ch.dying){
			ch.radius *= .9;
			ch.appearAlpha = Math.min(ch.appearAlpha===undefined ? 1 : ch.appearAlpha, ch.radius/3.);
			if(ch.radius < .3){ this.childs.splice(i, 1); continue; }
		}

		ch.getAwayFrom(this.childs, this.radius, i);
		ch.getCloseTo(this.x, this.y, this.radius);
		ch.getAwayFromCenter(this.x, this.y, this.radius);
		ch.reduceVelocityAndUseIt(.6); //plus d'inertie : glisse fluide
	}

	if(this.on)this.mergeNodesAndFindTarget(index, particles);
	// if(this.on)particles[index].mergeNodesAndFindTarget(index, particles);
	
    this.checkEdgesV2();
    // particles[index].checkEdgesV2();

    this.velocity.x /= this.ids.length;
    this.velocity.y /= this.ids.length;

    //vitesses etagees : ouvert tres calme, vert pose, gris tranquille
    var maxSpeed = this.open ? 1.2 : (this.ids.length>1 ? 2. : 2.8);

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

		//repulsion DOUCE, proportionnelle au chevauchement (etait distance*.3,
		//trop brutale : elle ejectait le gris)
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

				//fusion au recouvrement total : un cercle ferme de meme label
				//entierement recouvert par ce disque est absorbe
				var engulfed = !particles[i].open &&
					distance + particles[i].radius*2 <= this.radius*2;

				//if two nodes are sharing the same property and are colliding
				//and if the targeted particle has less child than this one --> eat it
				if((distance<minDistance && this.ids.length >= particles[i].ids.length) || engulfed){

					//TODO UPDATE IT ? radius to add
		    		for (var j=particles[i].ids.length-1; j>=0; j--) {
    					this.ids.push(particles[i].ids.pop());
    					this.counts.push(particles[i].counts.pop());
    				}

		    		//la croissance vers le nouveau rayon se fait progressivement dans update()

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
	//les regroupements (verts ET jaunes) s'ecartent des autres regroupements
	//non compatibles ; un gris isole garde sa repulsion reactive
	else if(this.ids.length>1)this.getAwayFromGroups(index, particles);
	else this.getAwayFrom(index, particles);
	
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

	    if(this.ids.length>=50){

	    	//deux lignes (nom + effectif) : le bloc entier reste centre
	    	//sur le cercle, le nom decale d'une demi-ligne vers le haut
	    	ctx.fillText(this.iso, this.x, this.y - 7*this.scale);

	    	var referenced = 0;
	    	for (var j=0; j<this.counts.length; j++) {
	    		if(this.counts[j]>0)referenced++;
	    	}

	    	ctx.font = (8*this.scale) + "pt Calibri";
	    	ctx.fillText(referenced + '/' + this.ids.length + ' composers', this.x, this.y + 7*this.scale);
	    	ctx.font = this.font;

	    } else {
	    	ctx.fillText(this.iso, this.x, this.y);
	    }

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

		//coussin doux : ressort PERPENDICULAIRE au mur le plus proche,
		//proportionnel a l'enfoncement : le groupe longe la bordure et glisse
		//au lieu d'etre catapulte vers le centre (fini le saccade au bord).
		//Premultiplie par la masse car update() divise la vitesse par elle.
		var border = this.radius*2+25;
		var W = this.canvas.width, H = this.canvas.height;
		var fx = 0, fy = 0;

		if(this.x < border)            fx += (border - this.x);
		else if(this.x > W - border)   fx -= (this.x - (W - border));

		if(this.y < border)            fy += (border - this.y);
		else if(this.y > H - border)   fy -= (this.y - (H - border));

		if(fx !== 0 || fy !== 0){
			var k = BORDER_PUSH * this.ids.length;
			this.velocity.x += fx * k;
			this.velocity.y += fy * k;
		}

	} else {

		//pas d'espace torique : quand un gris est sorti d'une certaine distance
		//(WRAP_MARGIN), au lieu de le "wrapper" au bord oppose (source des
		//teleportations en boucle a la couture), on le fait REAPPARAITRE a un
		//endroit LIBRE au hasard sur le canvas, en FONDU (opacite + taille via
		//fillAlpha remis a 0). Plus de couture, plus de pop brutal.
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
			this.fillAlpha = 0;   //reapparition progressive : fondu + grossissement
		}

	}
	
}
//evitement reserve aux regroupements : pousse douce, proportionnelle au
//chevauchement ; premultipliee par ids.length car update() divise la
//vitesse par la taille du groupe
Particle.prototype.getAwayFromGroups = function(index, particles){

	for (var i=0; i<particles.length; i++) {

		//les regroupements qui partagent le meme label (pays) sont des
		//candidats a la fusion : on ne les repousse pas, on les laisse approcher
		var sameValue = this.label!=="" &&
			String(this.label).localeCompare(String(particles[i].label))===0;

		if(index!==i && particles[i].ids.length>1 && !sameValue){

			var minDistance = this.radius*2 + particles[i].radius*2 + 28;
			var distance = dist(this.x, particles[i].x, this.y, particles[i].y);

			if(distance<minDistance && distance>0){

				var x = (particles[i].x - this.x)/distance;
				var y = (particles[i].y - this.y)/distance;

				var push = Math.min((minDistance - distance)*.03, 1.)*this.ids.length;

				this.velocity.x -= x*push;
				this.velocity.y -= y*push;
			}
		}
	}
}

//separation douce entre agents isoles (gris) : proportionnelle au
//chevauchement, ignoree entre candidats a la fusion (meme valeur)
Particle.prototype.separateFromLoners = function(index, particles){

	for (var i=0; i<particles.length; i++) {

		if(index!==i && particles[i].ids.length===1){

			//meme label (pays) -> candidats a la fusion, on ne les separe pas
			if(this.label!=="" &&
				String(this.label).localeCompare(String(particles[i].label))===0) continue;

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

//ajoute un membre seulement s'il y a de la place pour lui : capacite du
//disque respectee, et emplacement libre trouve avant de le faire naitre
Particle.prototype.tryAddChild = function(){

	if(this.childs.length >= this.ids.length)return false;

	//prochain membre a faire apparaitre : curseur circulaire qui saute les
	//membres deja affiches — la rotation parcourt tout le monde a l'infini
	var idx = -1;
	for (var t2=0; t2<this.ids.length; t2++) {
		var cand = (this.memberCursor + t2) % this.ids.length;
		var shown = false;
		for (var j2=0; j2<this.childs.length; j2++) {
			if(this.childs[j2].id === this.ids[cand]){ shown=true; break; }
		}
		if(!shown){ idx = cand; break; }
	}
	if(idx<0)return false;

	var usable = this.radius*2*.7;

	//capacite : somme des diametres reels des bleus presents + le candidat
	var sum = 0;
	for (var j=0; j<this.childs.length; j++) {
		var dj = this.childs[j].radius*2 + 2.;
		sum += dj*dj;
	}
	var dc = (this.counts[idx]>0 ? 6. : 2.)*this.scale + 2.;
	sum += dc*dc;
	if(sum > 0.55*usable*usable)return false;

	//emplacement : quelques essais aleatoires, on garde une position libre
	for (var t=0; t<20; t++) {

		var a = Math.random()*2*Math.PI;
		var r = Math.sqrt(Math.random())*Math.max(1, usable-8);
		var px = this.x + Math.cos(a)*r;
		var py = this.y + Math.sin(a)*r;

		var free = true;
		for (var j=0; j<this.childs.length; j++) {
			var d = dist(px, this.childs[j].x, py, this.childs[j].y);
			var cd = (this.counts[idx]>0 ? 6. : 2.)*this.scale;
			if(d < this.childs[j].radius*2 + cd + 2){ free=false; break; }
		}

		if(free){
			var c = this.createNewChild(this.ids[idx], this.counts[idx]);
			c.x = px; c.y = py;
			this.childs.push(c);
			this.memberCursor = (idx+1)%this.ids.length;
			return true;
		}
	}

	return false;
};

//taille du disque ouvert calculee d'apres la surface reelle de ses membres :
//un composer sans oeuvre archivee est minuscule et compte pour tres peu
Particle.prototype.computeOpenRadius = function(){

	//taille conditionnee uniquement au nombre et aux diametres reels
	//des cercles bleus deja presents a l'interieur
	var sum = 0;
	for (var i=0; i<this.childs.length; i++) {
		var d = this.childs[i].radius*2 + 2.; //diametre dessine + espacement
		sum += d*d;
	}

	var usable = Math.sqrt(sum/0.55); //taux de remplissage 55%
	var r = usable/1.4;               //la zone utile fait 70% du rayon dessine

	//plancher base sur la taille FERMEE (stable) et non sur le rayon courant :
	//se referer au rayon courant creait un effet cliquet qui faisait grossir
	//tous les cercles ouverts jusqu'a la borne, quel que soit leur contenu
	var closedT = 2.+1.*this.scale + 30.*(1.-Math.exp(-Math.sqrt(Math.max(0, this.ids.length-1))/8.))*this.scale;

	//contrainte ferme : la taille de tous les cercles ouverts est bornee
	//a une fraction modeste du canvas
	var maxOpen = Math.min(this.canvas.width, this.canvas.height)/20.;

	return Math.min(Math.max(r, closedT+8.), maxOpen);
};

//evitement anticipe des groupes (radial, stable) : un gris qui se dirige vers un
//groupe non compatible est repousse a l'oppose, dose par l'alignement. Nulle des
//qu'il se detourne -> pas d'oscillation, il se degage toujours.
Particle.prototype.avoidGroupsAhead = function(index, particles){

	var speed = Math.sqrt(this.velocity.x*this.velocity.x + this.velocity.y*this.velocity.y);
	if(speed < .01)return;

	var vx = this.velocity.x/speed, vy = this.velocity.y/speed;
	var ahead = 85*this.scale;

	for (var i=0; i<particles.length; i++) {

		if(index===i)continue;
		var o = particles[i];
		if(o.ids.length<=1)continue;

		var sameValue = this.label!=="" && String(this.label).localeCompare(String(o.label))===0;
		if(sameValue)continue;

		var dx = o.x - this.x, dy = o.y - this.y;
		var distance = Math.sqrt(dx*dx + dy*dy);
		var reach = ahead + o.radius*2 + this.radius*2;
		if(distance<=0 || distance>reach)continue;

		var align = (dx*vx + dy*vy)/distance;
		if(align<=0)continue;

		var proximity = 1 - distance/reach;
		var push = proximity*align*AVOID_STRENGTH*this.scale*this.ids.length;
		//radiale (s'ecarter) + tangentielle (contourner) ; cote choisi par la
		//direction de l'obstacle (stable) -> pas d'oscillation.
		var ux = dx/distance, uy = dy/distance;
		var tx = -uy, ty = ux;
		if(vx*tx + vy*ty < 0){ tx = -tx; ty = -ty; }
		this.velocity.x += (-ux*.7 + tx)*push;
		this.velocity.y += (-uy*.7 + ty)*push;
	}
}

//masse de collision : chaque contact alourdit temporairement la particule
//(cumulatif), et cette masse se resorbe quand les contacts cessent.
Particle.prototype.updateMass = function(index, particles){

	this.collMass *= COLL_DECAY;

	var contacts = 0;
	for (var i=0; i<particles.length; i++) {
		if(index===i)continue;
		var minTouch = this.radius*2 + particles[i].radius*2 + COLL_MARGIN;
		var d = dist(this.x, particles[i].x, this.y, particles[i].y);
		if(d>0 && d<minTouch)contacts++;
	}

	if(contacts>0)this.collMass += contacts*COLL_GAIN;
	if(this.collMass>COLL_MAX)this.collMass=COLL_MAX;
}
