//Intensite du champ de bruit appliquee aux agents GRIS en phase 2
//(1 = comme les autres cercles, <1 = plus calme/moins nerveux).
//Reglage rapide de la nervosite des gris. Voir addNoiseField().
var GREY_NOISE = .35;

//--- ralentissement cumulatif par collision (masse temporaire) ---
//Chaque contact alourdit la particule (elle ralentit), et la masse se resorbe
//quand les contacts cessent. Voir updateMass() et la masse effective d'update().
var COLL_GAIN  = .4;    //masse ajoutee par voisin en contact et par image (cumulatif)
var COLL_DECAY = .94;   //resorption par image (temporaire ; plus haut = persiste)
var COLL_MAX   = 6;     //plafond : evite qu'une particule ne se fige totalement
var COLL_MARGIN= 10;    //marge de detection : la proximite compte, pas que le chevauchement

//Force de repulsion d'un gris qui s'ecarte d'un groupe non compatible.
//Proportionnelle au chevauchement (douce). Baisser = repulsion plus faible.
var GREY_REPULSION = .1;

//Force d'evitement ANTICIPE des groupes par un gris (poussee radiale a l'oppose,
//dosee par l'alignement). Stable, ne peut pas provoquer d'oscillation.
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
	this.collMass=0;   //masse temporaire accumulee par les collisions

	this.fillAlpha = .1;
	this.maxSpeed = 4.;

	this.open=false;
	this.childs=[];

	//SMA
	this.attrOfInterest = ['edition', 'price', 'ln', 'duration', 'cat', 'sub_cat'];
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
	this.collMass=0;
}
Particle.prototype.openOrCloseIt = function(){
	
	// console.log("open close: ", this.radius, this.extra_rad, this.max_extra_rad);
	if(!this.open){
		//rayon d'ouverture dimensionne pour loger tous les membres (cercles bleus),
		//dans la limite du canvas
		var sq = Math.sqrt(this.records.length);
		var needed = 9.*sq/(1.+sq/28.)*this.scale; //croissance compressee pour les gros groupes
		var maxOpen = Math.min(this.canvas.width, this.canvas.height)/4. - 20.;
		var base = this.setSmallRadius();
		this.max_extra_rad = Math.max(20.*this.scale, Math.min(Math.max(needed, base+20.*this.scale), maxOpen) - base);
		this.open_step = Math.max(.25, this.max_extra_rad/90.); //ouverture lente

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

	//SMA
	var propNames =  ["edition", "price", "imeb_id", "title",
					"duration", "cat", "sub_cat", "fn", "ln"];
	
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

	//derive lente et continue : les regroupements ne deviennent jamais
	//totalement immobiles, meme quand plus rien ne fusionne
	if(this.driftT===undefined){ this.driftT=Math.random()*1000; this.driftP=Math.random()*100; }
	this.driftT+=.008;
	if(this.records.length>1){
		//derive des groupes, freinee par la masse de collision (comme le bruit)
		var driftAmp = (this.open ? .5 : .3)*this.records.length/(1+this.collMass);
		this.velocity.x += noise.perlin2(this.driftT, this.driftP)*driftAmp;
		this.velocity.y += noise.perlin2(this.driftT, this.driftP+50)*driftAmp;
	}

	//les gris isoles s'ecartent doucement de leurs voisins isoles
	//avec lesquels ils ne partagent pas la valeur de propriete ciblee
	if(this.records.length===1)this.separateFromLoners(i, particles);

	//evitement anticipe : un gris qui se dirige vers un groupe (vert/jaune)
	//avec lequel il ne cherche PAS a fusionner l'esquive avant le contact
	this.avoidGroupsAhead(i, particles);

	//masse de collision : ralentissement cumulatif et temporaire en cas de contact.
	//Applique aux GRIS comme aux groupes (verts/jaunes). Note : update() n'est
	//appele qu'en phase 2 -> la masse n'est jamais modifiee en phase 1.
	this.updateMass(i, particles);

	if(this.opening){

		//les membres commencent a apparaitre des le debut de l'ouverture,
		//en fondu, chacun seulement quand il a de la place
		var toAdd = Math.max(1, Math.ceil(this.records.length/120));
		while(toAdd-- > 0 && this.tryAddChild());

		// console.log("open close: ", this.radius, this.extra_radius, this.max_extra_radius);

		if(this.extra_rad<this.max_extra_rad){
			
			this.radius-=this.extra_rad;
			this.extra_rad+=this.open_step;
			this.radius+=this.extra_rad;
			
			// console.log(this.radius, " ", this.extra_radius);
		
		} else {   //extra_rad a atteint/depasse max_extra_rad : fin de l'ouverture

			this.opening=false;


			var txt = this.records.length+' elements';
			$("#selection p").text(txt);

		}

	} else if(this.open){

		//les membres apparaissent au fil des images, chacun seulement
		//quand il a de la place dans le disque
		var toAdd = Math.max(1, Math.ceil(this.records.length/120));
		while(toAdd-- > 0 && this.tryAddChild());

		//cible recalculee en continu : un cercle ouvert qui absorbe de
		//nouveaux membres grandit pour continuer a tous les loger
		var sq = Math.sqrt(this.records.length);
		var needed = 9.*sq/(1.+sq/28.)*this.scale; //croissance compressee pour les gros groupes
		var maxOpen = Math.min(this.canvas.width, this.canvas.height)/4. - 20.;
		var base = this.setSmallRadius();
		this.max_extra_rad = Math.max(20.*this.scale, Math.min(Math.max(needed, base+20.*this.scale), maxOpen) - base);

		var rad_max = base + this.max_extra_rad;

		if(this.radius< rad_max)this.radius+=.25; //croissance lente
			
	} else if(!this.open){
		var target = this.setSmallRadius();
		if(this.radius>target)this.radius=Math.max(target, this.radius-3.);
		else if(this.radius<target)this.radius=Math.min(target, this.radius+.25); //croissance lente apres fusion
	}

	for (var j=0; j<this.childs.length; j++) {
		this.childs[j].getAwayFrom(this.childs, this.radius, j);
		this.childs[j].getCloseTo(this.x, this.y, this.radius);
		this.childs[j].getAwayFromCenter(this.x, this.y, this.radius);
		this.childs[j].reduceVelocityAndUseIt(.6); //plus d'inertie : glisse fluide
	}

	if(this.on)this.mergeNodesAndFindTarget(i, particles);

	this.checkEdgesV2();

	//division par la masse du groupe (les gros bougent moins). La masse de
	//collision, elle, ne freine QUE la propulsion (bruit/derive), pas les forces
	//de separation -> un agent coince peut toujours se degager (aucun verrou).
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

				//fusion au recouvrement total : un cercle ferme de meme propriete
				//entierement recouvert par ce disque est absorbe
				var engulfed = !particles[i].open &&
					distance + particles[i].radius*2 <= this.radius*2;

				//if two nodes are sharing the same property and are colliding
				//and if the targeted particle has less child than this one --> eat it
				if((distance<minDistance && this.records.length >= particles[i].records.length) || engulfed){

					//TODO UPDATE IT ? radius to add
			    	var val=this.radius_to_add; //conserve pour reference

					for (var j=particles[i].records.length-1; j>=0; j--) {
						var newRecord = particles[i].records.pop();
						this.records.push(newRecord);
					}

					//la croissance vers le nouveau rayon se fait progressivement dans update()

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
	} else if(this.records.length>1){
		//les regroupements (verts ET jaunes) s'ecartent des autres
		//regroupements avec lesquels ils ne partagent pas la propriete ciblee
		this.getAwayFromGroups(index, particles);
	} else {
		//un gris isole garde sa repulsion reactive
		this.getAwayFrom(index, particles);
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

		//repulsion DOUCE, proportionnelle au chevauchement (etait distance*.3,
		//trop brutale : elle ejectait le gris). Le gris s'ecarte sans etre projete.
		var dx = particles[target_id].x - this.x;
		var dy = particles[target_id].y - this.y;
		var d = Math.sqrt(dx*dx + dy*dy);

		if(d>0){
			var minD = this.radius*2 + particles[target_id].radius*2 + 10;
			var overlap = minD - d;                 //>0 : cible choisie dans minDistance
			var push = overlap*GREY_REPULSION;
			this.velocity.x -= (dx/d)*push;
			this.velocity.y -= (dy/d)*push;
		}
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
	    label = label.replace("&#xE9;", "é");
	    label = label.replace("&#xE8;", "è");

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
			var k = BORDER_PUSH * this.records.length;
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
Particle.prototype.checkEdgesV1 = function(){
	
	if(this.x<0)this.x=this.canvas.width;
	else if(this.x>this.canvas.width)this.x=0;

	if(this.y<0)this.y=this.canvas.height;
	else if(this.y>this.canvas.height)this.y=0;
	
}
Particle.prototype.addNoiseField = function(coef){

	//champ de bruit lisse et evolutif : la 3e dimension avance lentement
	//avec le temps, les courants se reconfigurent au lieu de se figer
	var t = Date.now()*.00006;

	var x = noise.perlin3(this.x/150, this.y/150, t);
    var y = noise.perlin3(this.x/150+7.31, this.y/150+3.17, t);
    
    //la force du champ diminue avec la TAILLE du cercle (masse ~ rayon).
    //Plancher a 1 (etait .5) : les petits cercles (gris) ne sont PLUS
    //sur-propulses par le bruit ; les gros regroupements restent attenues.
    var sizeFactor = this.radius/(2.*this.scale);
    if(sizeFactor<1)sizeFactor=1;
    x*=coef/sizeFactor;
    y*=coef/sizeFactor;

	//agitation reduite pour les gris : derive plus douce, moins nerveuse.
	//GREY_NOISE global pour regler finement (1 = comme les autres).
	if(this.records.length===1){ x*=GREY_NOISE; y*=GREY_NOISE; }

	//la masse de collision freine la PROPULSION (a = F/masse) : un agent qui
	//percute recoit moins de poussee du bruit, donc se calme -- SANS etre
	//bloque, car les forces de separation ne passent pas par la masse.
	if(this.collMass){ var cd = 1/(1+this.collMass); x*=cd; y*=cd; }

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

			//marge de respiration entre groupes non compatibles (etait +10)
			var minDistance = this.radius*2 + particles[i].radius*2 + 28;
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

//separation douce entre agents isoles (gris) : proportionnelle au
//chevauchement, ignoree entre candidats a la fusion (meme valeur)
Particle.prototype.separateFromLoners = function(index, particles){

	for (var i=0; i<particles.length; i++) {

		if(index!==i && particles[i].records.length===1){

			if(this.targetedAttr!=="" &&
				String(this[this.targetedAttr]).localeCompare(String(particles[i][particles[i].targetedAttr]))===0) continue;

			//marge de respiration un peu plus large : les gris ne se collent pas
			var minDistance = this.radius*2 + particles[i].radius*2 + 12;
			var distance = dist(this.x, particles[i].x, this.y, particles[i].y);

			if(distance<minDistance && distance>0){

				var x = (particles[i].x - this.x)/distance;
				var y = (particles[i].y - this.y)/distance;

				//separation renforcee (etait .04) : ils s'ecartent plus nettement
				var push = (minDistance - distance)*.08;

				this.velocity.x -= x*push;
				this.velocity.y -= y*push;
			}
		}
	}
}

//masse de collision : chaque contact (surfaces qui se touchent) alourdit
//temporairement la particule (cumulatif), et cette masse se resorbe quand les
//contacts cessent. Elle est injectee dans la masse effective en fin d'update()
//-> une particule qui percute beaucoup ralentit, puis repart en se degageant.
Particle.prototype.updateMass = function(index, particles){

	this.collMass *= COLL_DECAY;              //resorption progressive (temporaire)

	var contacts = 0;
	for (var i=0; i<particles.length; i++) {
		if(index===i)continue;
		var minTouch = this.radius*2 + particles[i].radius*2 + COLL_MARGIN;
		var d = dist(this.x, particles[i].x, this.y, particles[i].y);
		if(d>0 && d<minTouch)contacts++;
	}

	if(contacts>0)this.collMass += contacts*COLL_GAIN;   //cumulatif
	if(this.collMass>COLL_MAX)this.collMass=COLL_MAX;    //plafond anti-gel
}

//evitement anticipe des groupes : un agent gris regarde DEVANT lui (dans le
//sens de son deplacement) et, s'il fonce vers un regroupement (vert/jaune)
//avec lequel il ne partage pas la valeur ciblee (donc pas un candidat a la
//fusion), il devie legerement sur le cote pour le contourner au lieu de
//buter dessus. Un groupe deja derriere ou hors trajectoire est ignore.
Particle.prototype.avoidGroupsAhead = function(index, particles){

	var speed = Math.sqrt(this.velocity.x*this.velocity.x + this.velocity.y*this.velocity.y);
	if(speed < .01)return;                       //pas de cap clair : rien a esquiver

	var vx = this.velocity.x/speed, vy = this.velocity.y/speed;   //direction (unitaire)
	var ahead = 85*this.scale;                   //distance d'anticipation

	for (var i=0; i<particles.length; i++) {

		if(index===i)continue;

		var o = particles[i];
		if(o.records.length<=1)continue;         //on n'esquive que les GROUPES (verts/jaunes)

		//candidat a la fusion (meme valeur de propriete ciblee) : on le laisse approcher
		var sameValue = this.targetedAttr!=="" && this[this.targetedAttr]!=="" &&
			String(this[this.targetedAttr]).localeCompare(String(o[o.targetedAttr]))===0;
		if(sameValue)continue;

		var dx = o.x - this.x, dy = o.y - this.y;
		var distance = Math.sqrt(dx*dx + dy*dy);
		var reach = ahead + o.radius*2 + this.radius*2;
		if(distance<=0 || distance>reach)continue;

		//alignement : a quel point on FONCE vers le groupe (cos de l'angle entre
		//notre cap et la direction du groupe). <=0 -> on s'en eloigne deja :
		//AUCUNE poussee, l'agent se degage librement (corrige le blocage).
		var align = (dx*vx + dy*vy)/distance;
		if(align<=0)continue;

		//poussee RADIALE, a l'oppose du groupe. Stable : la direction ne depend
		//PAS du signe de la vitesse (contrairement a une esquive perpendiculaire
		//qui faisait tourner le vecteur vitesse et s'auto-entretenait). Dosee par
		//proximite x alignement : franche si on fonce dessus, nulle des qu'on se
		//detourne. Ne bloque jamais un candidat a la fusion (ecarte plus haut).
		var proximity = 1 - distance/reach;      //0..1
		var push = proximity*align*AVOID_STRENGTH*this.scale*this.records.length;
		//radiale (s'ecarter) + tangentielle (contourner) ; cote choisi par la
		//direction de l'obstacle (stable) -> pas d'oscillation.
		var ux = dx/distance, uy = dy/distance;
		var tx = -uy, ty = ux;
		if(vx*tx + vy*ty < 0){ tx = -tx; ty = -ty; }
		this.velocity.x += (-ux*.7 + tx)*push;
		this.velocity.y += (-uy*.7 + ty)*push;
	}
}

//ajoute un membre seulement s'il y a de la place pour lui : capacite du
//disque respectee, et emplacement libre trouve avant de le faire naitre
Particle.prototype.tryAddChild = function(){

	if(this.childs.length >= this.records.length)return false;

	var usable = this.radius*2*.7;

	//capacite globale : combien de membres tiennent dans la zone utile
	var slot = 320.*this.scale*this.scale;
	var capacity = Math.max(1, Math.floor((Math.PI*usable*usable)/slot));
	if(this.childs.length >= capacity)return false;

	//emplacement : quelques essais aleatoires, on garde une position libre
	for (var t=0; t<12; t++) {

		var a = Math.random()*2*Math.PI;
		var r = Math.sqrt(Math.random())*Math.max(1, usable-8);
		var px = this.x + Math.cos(a)*r;
		var py = this.y + Math.sin(a)*r;

		var free = true;
		for (var j=0; j<this.childs.length; j++) {
			var d = dist(px, this.childs[j].x, py, this.childs[j].y);
			if(d < this.childs[j].radius*2 + 9){ free=false; break; }
		}

		if(free){
			var c = this.createNewChild(this.records[this.childs.length]);
			c.x = px; c.y = py;
			this.childs.push(c);
			return true;
		}
	}

	return false;
};
