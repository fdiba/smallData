class NGrp {

  Body body;
  String name;

  ArrayList<Node> gNodes;

  float len;
  float diam;

  ArrayList<DistanceJoint> joints;

  Vec2 pos, linearVelocity;
  float angularVelocity;

  float G = 0;

  NGrp(Node n1, Node n2) {

    pos = new Vec2();
    
    diam = 15;
    len = 20;
    
    

    name = n1.country;

    n1.alone = false;
    n2.alone = false;
    
    createBody(diam/2, n1, n2);

    n1.resetBody();
    n2.resetBody();
    
    joints = new ArrayList<DistanceJoint>();

    gNodes = new ArrayList<Node>();
    gNodes.add(n1);
    gNodes.add(n2);
    
    createJoint(body, n1.body);
    createJoint(body, n2.body);
        
  }
  void addNode(Node n) {

    n.alone = false;
    n.setNode();

    n.resetBody();

    gNodes.add(n);

    createJoint(body, n.body);

  }
  void createJoint(Body body, Body n_body) {

    DistanceJointDef djd = new DistanceJointDef();
    // Connection between previous particle and this one
    djd.bodyA = body;
    djd.bodyB = n_body;
    // Equilibrium length
    djd.length = box2d.scalarPixelsToWorld(len);

    // These properties affect how springy the joint is 
    djd.frequencyHz = 0;  // Try a value less than 5 (0 for no elasticity)
    djd.dampingRatio = 1; // Ranges between 0 and 1

      // Make the joint.  Note we aren't storing a reference to the joint ourselves anywhere!
    // We might need to someday, but for now it's ok
    DistanceJoint dj = (DistanceJoint) box2d.world.createJoint(djd);

    //println(dj.getBodyA());

    joints.add(dj);
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

    //fd.filter.groupIndex = -2;

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



    Vec2 v = new Vec2(0f, 0f);
    Vec2 force;

    for (Node n : gNodes) {
      v.addLocal(n.pos);
      //println(n.pos.x, n.pos.y);

      //force = attract(n);
      //n.applyForce(force);


      /*int test = round(random(3));
       if (test%2==0) {
       n.linearVelocity = new Vec2(10, 0);
       n.body.setLinearVelocity(n.linearVelocity);
       } else {
       n.linearVelocity = new Vec2(-10, 0);
       n.body.setLinearVelocity(n.linearVelocity);
       }*/
    }

    v.x /= gNodes.size();
    v.y /= gNodes.size();
    //println(v.x, v.y);

    for (Node n : gNodes) {

      Vec2 vv = n.pos;
      Vec2 xx = n.pos.sub(v);
      xx.normalize();
      xx.mulLocal(diam+1.1);
      
      //n.body.setTransform(xx, 0);
      //n.linearVelocity = xx;
      //n.body.setLinearVelocity(n.linearVelocity);
      
      xx.addLocal(v);

      noFill();
      stroke(0);
      ellipse(xx.x, xx.y, 5, 5);
    }

    if (body!=null) {

      //pos.x = v.x;
      //pos.y = v.y;
      //body.setTransform(v, 0);

      pos = box2d.getBodyPixelCoord(body);

      //linearVelocity = new Vec2(random(-1, 1), random(-1, 1));
      linearVelocity = new Vec2(1, 0);
      body.setLinearVelocity(linearVelocity);



      /* 
       Vec2 target = v.sub(pos);
       target.normalize();
       
       linearVelocity = target;
       body.setLinearVelocity(linearVelocity);*/
    }


    fill(0, 0, 255);
    noStroke();
    ellipse(v.x, v.y, 5, 5);
  }
  Vec2 attract(Node m) {


    if (body!=null) {
      // clone() makes us a copy
      Vec2 bpos = body.getWorldCenter();    
      Vec2 moverPos = m.body.getWorldCenter();

      // Vector pointing from mover to attractor
      Vec2 force = bpos.sub(moverPos);
      float distance = force.length();

      // Keep force within bounds
      distance = constrain(distance, 1, 5);
      force.normalize();

      // Note the attractor's mass is 0 because it's fixed so can't use that
      float strength = (G * 1 * m.body.m_mass) / (distance * distance); // Calculate gravitional force magnitude
      force.mulLocal(strength);         // Get force vector --> magnitude * direction

      return force;
    } else {
      return new Vec2();
    }
  }
  void display() {

    if (body!=null) {
      fill(0, 25);
      noStroke();
      ellipse(pos.x, pos.y, diam, diam);
    }

    for (DistanceJoint j : joints) {

      Vec2 pos1 = box2d.getBodyPixelCoord(j.getBodyA());
      Vec2 pos2 = box2d.getBodyPixelCoord(j.getBodyB());

      stroke(255, 0, 0);
      line(pos1.x, pos1.y, pos2.x, pos2.y);
    }

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

