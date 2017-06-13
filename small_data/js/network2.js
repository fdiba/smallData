var canvas, context;

var particles=[];

var animation01;

var commonAttr="";

window.onload = function() {

	canvas = document.getElementById('myCanvas');
    context = canvas.getContext('2d');

    canvas.width = Math.max(800, $(document).width()-600);
    canvas.height = Math.max(600, $(document).height()-600);


    //particles.push(createNewParticle(composers[i].id, allData[index+1], composers[i].count, 1));

    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
    particles.push(createNewParticle(100, "France", 3, 1));
    particles.push(createNewParticle(56, "USA", 2, 1));
        

    animation01=setInterval(sma_animation, 1000/30);

}
function displayNoise(){

    for (var x = 0; x < 800; x+=10) {
        for (var y = 0; y < 600; y+=10) {
            var val_x = noise.simplex2(x/50, y/50);
            //console.log(val_x);



      }
    }


/*ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius*2, 0, 2*Math.PI);
    ctx.fill();
    ctx.closePath();*/

}
function sma_animation(){

    resetSMACanvas();

    //displayNoise();

    if(commonAttr.localeCompare("")==0){
        //console.log("22");

        for (var i=0; i<particles.length; i++) {
        
            var val_x = noise.perlin2(particles[i].x/50, particles[i].y/50);
            var val_y = noise.perlin2((particles[i].x+1000)/50, (particles[i].y+1000)/50);
            //var val_y = noise.simplex2(particles[i].x/50, particles[i].y/50);
            
            var coef = 3.;
            particles[i].update22(val_x*coef, val_y*coef);
            particles[i].getAwayFrom22(i, particles);
            particles[i].display();

            //particles[i].getAwayOrCloserFrom(i, particles);
        }

    } else {
        
        
        //console.log("333");


        for (var i=0; i<particles.length; i++) {
        
            
            particles[i].update();
            particles[i].checkEdges();
            particles[i].display();

            //particles[i].getAwayOrCloserFrom(i, particles);
        }


    }
    
    

}
function resetSMACanvas(){
    // context.fillStyle="white";
    context.fillStyle=COLORS[0];
    context.fillRect(0, 0, canvas.width, canvas.height);
}
function createNewParticle(id, ctry, count, addRadiusVal){

    //800 600
    var radius=150;

    return new Particle({
        canvasId: "myCanvas",
        count: count,
        addRadiusVal: addRadiusVal,
        id: id,
        label: ctry,
        x:canvas.width/2-radius+Math.random()*(radius*2),
        y:canvas.height/2-radius+Math.random()*(radius*2)
    });
}