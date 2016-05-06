class NGrp {

  Body body;
  String name;

  ArrayList<Record> g_records;

  float diam;

  Vec2 pos, linearVelocity;
  float angularVelocity;

  float G = 0;

  float tx, ty;

  color c;

  int groupIndex = 2;

  NGrp(Node n1, Node n2) {

    c = color(40, 209, 89);

    pos = new Vec2();

    diam = 15;

    tx = random(1000);
    ty = tx+1000;

    name = n1.country;

    n1.alone = false;
    n2.alone = false;

    n1.isDead = true;
    n2.isDead = true;

    //---- bodies ----//
    createBody(diam/2, n1, n2);

    g_records = new ArrayList<Record>();
    g_records.add(new Record(n1.id, n1.fName, n1.name));
    g_records.add(new Record(n2.id, n2.fName, n2.name));

  }
  void addNode(Node n) {

    n.alone = false;
    n.isDead = true;
    g_records.add(new Record(n.id, n.fName, n.name));

    redefineBody();
  }
  void redefineBody() {

    box2d.destroyBody(body);
    diam+=1;

    //-------

    BodyDef bd = new BodyDef();
    bd.type = BodyType.DYNAMIC;

    bd.position = box2d.coordPixelsToWorld(pos.x, pos.y);
    body = box2d.world.createBody(bd);

    CircleShape cs = new CircleShape();

    cs.m_radius = box2d.scalarPixelsToWorld(diam/2);

    FixtureDef fd = new FixtureDef();
    fd.shape = cs;

    fd.filter.groupIndex = groupIndex;

    fd.density = 1f; //1 how heavy it is in relation to its area
    fd.friction = .3; //.3 how slippery it is
    fd.restitution = .5; //.5 how bouncy the fixture is

    body.createFixture(fd);

    body.setLinearVelocity(linearVelocity);
    body.setAngularVelocity(angularVelocity);
  }
  void createBody(float radius, Node n1, Node n2) {

    BodyDef bd = new BodyDef();
    bd.type = BodyType.DYNAMIC;

    Vec2 a = box2d.getBodyPixelCoord(n1.body);
    Vec2 b = box2d.getBodyPixelCoord(n2.body);

    Vec2 pos = a.add(b);
    pos.x /= 2;
    pos.y /= 2;

    bd.position = box2d.coordPixelsToWorld(pos.x, pos.y);
    body = box2d.world.createBody(bd);

    CircleShape cs = new CircleShape();

    cs.m_radius = box2d.scalarPixelsToWorld(radius);

    FixtureDef fd = new FixtureDef();
    fd.shape = cs;

    fd.filter.groupIndex = groupIndex;

    fd.density = 1f; //1 how heavy it is in relation to its area
    fd.friction = .3; //.3 how slippery it is
    fd.restitution = .5; //.5 how bouncy the fixture is

    body.createFixture(fd);

    linearVelocity = new Vec2(0, 0);
    body.setLinearVelocity(linearVelocity);
    //angularVelocity = random(-1, 1);
    angularVelocity = 0f;
    body.setAngularVelocity(angularVelocity);
  }
  void update() {

    pos = box2d.getBodyPixelCoord(body); //not normalized coordinates

    //float val = 25/(g_records.size()+1/10);
    float val = 25;
    float x = map(noise(tx), 0, 1, -val, val);
    float y = map(noise(ty), 0, 1, -val, val);

    float step = 0.01;
    tx += step;
    ty += step;

    //linearVelocity = new Vec2(random(-5, 5), random(-5, 5));
    linearVelocity = new Vec2(x, y);
    body.setLinearVelocity(linearVelocity);
  }
  void checkEdgesBox2d () {

    float offset = diam/2+5;

    if (pos.x < 0 + offset || pos.x > width - offset) {
      tx = random(1000);
    }

    if (pos.y < 0 + offset || pos.y > height - offset) {
      ty = tx+1000;
    }
  }
  void displayText(){
    if(g_records.size()>10){
      fill(25);
      text(name, pos.x-textWidth(name)/2, pos.y+4);
    }
  }
  void display() {

    fill(c);
    noStroke();
    ellipse(pos.x, pos.y, diam, diam);
    
  }
  boolean contains(float x, float y) {

    if (body!=null) {
      Vec2 worldPoint = box2d.coordPixelsToWorld(x, y);
      Fixture f = body.getFixtureList();
      boolean inside = f.testPoint(worldPoint);
      return inside;
    } else {
      return false;
    }
  }
}

