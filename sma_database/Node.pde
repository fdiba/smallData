class Node {

  Body body;
  
  int id;
  String fName;
  String name;

  PVector loc;
  Vec2 pos, linearVelocity;
  float angularVelocity;
  
  PVector vel;
  float speed;
  
  color rgb;
  int alpha;
  float diam;
  
  boolean isDead;
  
  float density, friction, restitution;
  
  Node(int _id, String _fName, String _name) {
    
    density = 10f;
    friction = .3;
    restitution = .5;
    
    diam = 6f;
    rgb = color(0);
    alpha = 0;
    
    id = _id;
    fName = _fName;
    name = _name;
    
    BodyDef bd = new BodyDef();
    bd.type = BodyType.DYNAMIC;
    
    bd.position = box2d.coordPixelsToWorld(random(width), random(height));
    body = box2d.world.createBody(bd);
    
    CircleShape cs = new CircleShape();
    cs.m_radius = box2d.scalarPixelsToWorld(diam/2);
    
    FixtureDef fd = new FixtureDef();
    fd.shape = cs;
    
    fd.density = density; //1 how heavy it is in relation to its area
    fd.friction = friction; //.3 how slippery it is
    fd.restitution = restitution; //.5 how bouncy the fixture is
    
    body.createFixture(fd);

    loc = new PVector(random(width), random(height));
    
    
    linearVelocity = new Vec2(random(-5, 5),random(-5, 5));
    body.setLinearVelocity(linearVelocity);
    //angularVelocity = random(-1, 1);
    angularVelocity = 0f;
    body.setAngularVelocity(angularVelocity);
    
    vel = new PVector(random(-1, 1), random(-1, 1));
    vel.normalize();

    speed = random(1, 3);
  }
  void checkEdgesBox2d () {
    if (pos.x < 0 || pos.x > width ||
      pos.y < 0 || pos.y > height) {
      rgb = color(255, 0, 0); 
      isDead = true;
    }
  }
  void checkEdges () {

    if (loc.x < 0 || loc.x > width ||
      loc.y < 0 || loc.y > height) {
      loc.x = random(width);
      loc.y = random(height);
      alpha = 0;
    }
  }
  void editVelBasedOnNoiseField(float noiseScale, float noiseStength){
    float noiseVal = noise (loc.x/noiseScale, loc.y/noiseScale) * noiseStength;
    float angle = map (noiseVal, 0,1, 0, TWO_PI);
    vel.x = cos (angle);
    vel.y = sin (angle);
  }
  void updateBox2d() {
    if(alpha<255)alpha+=5;
    pos = box2d.getBodyPixelCoord(body);
  }
  void update() {
    if(alpha<255)alpha+=5;
    loc.add (PVector.div(PVector.mult(vel, speed), 256f/(1f+alpha)));
  }
  void displayBox2d() {
    fill(rgb, alpha);
    float tmp_diam = diam/(256f/(1f+alpha));
    ellipse(pos.x, pos.y, tmp_diam, tmp_diam);
  }
  void display() {
    fill(rgb, alpha);
    float tmp_diam = diam/(256f/(1f+alpha));
    ellipse(loc.x, loc.y, tmp_diam, tmp_diam);
  }
}

