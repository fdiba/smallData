class Attractor {

  float diam;
  PVector location;

  Body body;
  
  float G;
  color c;

  Attractor(float _diam, float x, float y) {
    
    G = 10; // Strength of force

    colorMode(RGB, 360);
    c = color(255, 0, 0);

    location = new PVector(x, y);
    diam = _diam;

    BodyDef bd = new BodyDef();
    bd.type = BodyType.STATIC;

    bd.position = box2d.coordPixelsToWorld(x, y);
    body = box2d.world.createBody(bd);

    CircleShape cs = new CircleShape();
    cs.m_radius = box2d.scalarPixelsToWorld(diam/2);

    body.createFixture(cs, 1);
  }
  // Formula for gravitational attraction
  // We are computing this in "world" coordinates
  // No need to convert to pixels and back
  Vec2 attract(NGrp g) {

    // clone() makes us a copy
    Vec2 pos = body.getWorldCenter();
    Vec2 moverPos = g.body.getWorldCenter();

    // Vector pointing from mover to attractor
    Vec2 force = pos.sub(moverPos);
    float distance = force.length();

    // Keep force within bounds
    //distance = constrain(distance, 1, 15);
    force.normalize();

    // Note the attractor's mass is 0 because it's fixed so can't use that
    //float strength = (G * 1 * g.body.m_mass) / (distance * distance); // Calculate gravitional force magnitude
    //float strength = distance * distance; // Calculate gravitional force magnitude
    //float strength = (G * 1 * g.body.m_mass) / (distance * distance); // Calculate gravitional force magnitude
    float strength = map(g.diam, g.diamMin, 50, -20, 100);
    force.mulLocal(strength*g.body.m_mass);         // Get force vector --> magnitude * direction

    return force;
  }
  void display() {

    Vec2 pos = box2d.getBodyPixelCoord(body);
    noStroke();
    fill(c);
    //noFill();
    ellipse(pos.x, pos.y, diam, diam);
  }
}

