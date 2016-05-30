class Node {

  Body body;

  int id;
  String fName;
  String name;
  String country;

  PVector loc;
  Vec2 pos, linearVelocity;
  float angularVelocity;

  PVector vel;
  float speed;

  private color rgb;
  int alpha;
  float diam;

  boolean isDead;
  boolean alone;

  float density, friction, restitution;
  
  int groupIndex = 1;

  Node(float x, float y, int _id, String _fName, String _name, String _country) {

    alone = true;

    diam = 6f;
    rgb = color(0);
    alpha = 0;

    id = _id;
    fName = _fName;
    name = _name;
    country = _country;

    BodyDef bd = new BodyDef();
    bd.type = BodyType.DYNAMIC;
    
    //bd.fixedRotation =true;
    
    pos = new Vec2(x, y);

    bd.position = box2d.coordPixelsToWorld(x, y);
    body = box2d.world.createBody(bd);

    CircleShape cs = new CircleShape();
    cs.m_radius = box2d.scalarPixelsToWorld(diam/2);

    FixtureDef fd = new FixtureDef();
    fd.shape = cs;

    fd.density = 10.; //1 how heavy it is in relation to its area
    fd.friction = 1.; //.3 how slippery it is
    fd.restitution = 0; //.5 how bouncy the fixture is

    fd.filter.groupIndex = groupIndex;
  
    body.createFixture(fd);

    linearVelocity = new Vec2(random(-5, 5), random(-5, 5));
    body.setLinearVelocity(linearVelocity);
    //angularVelocity = random(-1, 1);
    angularVelocity = 0f;
    body.setAngularVelocity(angularVelocity);

    //body.setUserData(this);

    loc = new PVector(x, y);
    vel = new PVector(random(-1, 1), random(-1, 1));
    vel.normalize();
    speed = random(1, 3);
  }
  void applyForce(Vec2 v) {
    body.applyForce(v, body.getWorldCenter());
  }
  boolean contains(float x, float y) {
    Vec2 worldPoint = box2d.coordPixelsToWorld(x, y);
    Fixture f = body.getFixtureList();
    boolean inside = f.testPoint(worldPoint);
    return inside;
  }
  void editColor(color c) {
    rgb = c;
  }
  void checkEdgesBox2d () {
    if (pos.x < tables[0][0] + tables[0][4] || pos.x > tables[0][0] + tables[0][2] - tables[0][4] ||
      pos.y < tables[0][1] + tables[0][4] || pos.y > tables[0][1] + tables[0][3] - tables[0][4]) {
      rgb = color(255, 0, 0); 
      isDead = true;
    }
  }
  void checkEdges () {
    if (loc.x < tables[0][0] + tables[0][4] || loc.x > tables[0][0] + tables[0][2] - tables[0][4] ||
      loc.y < tables[0][1] + tables[0][4] || loc.y > tables[0][1] + tables[0][3] - tables[0][4]) {
      loc.x = random(width);
      loc.y = random(height);
      alpha = 0;
    }
  }
  void editVelBasedOnNoiseField(float noiseScale, float noiseStength) { //if !useBox2d
    float noiseVal = noise (loc.x/noiseScale, loc.y/noiseScale) * noiseStength;
    float angle = map (noiseVal, 0, 1, 0, TWO_PI);
    vel.x = cos (angle);
    vel.y = sin (angle);
  }
  void update() {
    if (alpha<255)alpha+=5;
    loc.add (PVector.div(PVector.mult(vel, speed), 256f/(1f+alpha)));
  }
  void display() {
    fill(rgb, alpha);
    float tmp_diam = diam/(256f/(1f+alpha));
    ellipse(loc.x, loc.y, tmp_diam, tmp_diam);
  }
  //---------------- Box2d ----------------//
  void editVelBasedOnNoiseFieldBox2d(float noiseScale, float noiseStength) {

    float noiseVal = noise (pos.x/noiseScale, pos.y/noiseScale) * noiseStength;
    float angle = map (noiseVal, 0, 1, 0, TWO_PI);


    int steps = 10;
    float x2 = pos.x + cos (angle)*steps;
    float y2 = pos.y + sin (angle)*steps;

    //stroke(255, 255, 0);
    //line (pos.x, pos.y, x2, y2);

    Vec2 test = pos.sub(new Vec2(x2, y2));
    test.mulLocal(-1);

    linearVelocity.x  = test.x;
    linearVelocity.y = test.y;
    //linearVelocity.x  = 0;
    //linearVelocity.y = 0;
    body.setLinearVelocity(linearVelocity);
  }
  void updateBox2d() {
    if (alpha<255)alpha+=5;
    pos = box2d.getBodyPixelCoord(body);
  }
  void displayBox2d() {

    noStroke();
    fill(rgb, alpha);
    float tmp_diam = diam/(256f/(1f+alpha));
    ellipse(pos.x, pos.y, tmp_diam, tmp_diam);

    /*float a = body.getAngle();
     pushMatrix();
     translate(pos.x, pos.y);
     rotate(a);
     
     noStroke();
     ellipse(0, 0, tmp_diam*2, tmp_diam*2);
     
     // Let's add a line so we can see the rotation
     strokeWeight(2);
     stroke(255, 0, 0);
     line(0, 0, tmp_diam, 0);
     
     popMatrix();*/
  }
}

