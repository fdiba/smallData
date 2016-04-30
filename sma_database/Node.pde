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

  Node(int _id, String _fName, String _name, String _country) {

    density = 10f;
    friction = .3;
    restitution = .5;
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

    float x = world_offset + random(width-world_offset);
    float y = world_offset + random(height-world_offset);

    pos = new Vec2(x, y);

    bd.position = box2d.coordPixelsToWorld(x, y);
    body = box2d.world.createBody(bd);

    CircleShape cs = new CircleShape();
    cs.m_radius = box2d.scalarPixelsToWorld(diam/2);

    FixtureDef fd = new FixtureDef();
    fd.shape = cs;

    fd.density = density; //1 how heavy it is in relation to its area
    fd.friction = friction; //.3 how slippery it is
    fd.restitution = restitution; //.5 how bouncy the fixture is

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
  void setNode() {
    editColor(color(40, 209, 89));
    alone = false;
    linearVelocity.x  = 0;
    linearVelocity.y = 0;
    body.setLinearVelocity(linearVelocity);
  }
  void editColor(color c) {
    rgb = c;
  }
  void checkEdgesBox2d () {
    if (pos.x < 0 + world_offset || pos.x > width - world_offset ||
      pos.y < 0 + world_offset || pos.y > height - world_offset) {
      rgb = color(255, 0, 0); 
      isDead = true;
    }
  }
  void checkEdges () {

    if (loc.x < 0 + world_offset || loc.x > width - world_offset ||
      loc.y < 0 + world_offset || loc.y > height - world_offset) {
      loc.x = random(width);
      loc.y = random(height);
      alpha = 0;
    }
  }
  void editVelBasedOnNoiseField(float noiseScale, float noiseStength) {
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

