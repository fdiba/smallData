class Node {

  int id;
  String fName;
  String name;

  PVector loc;
  PVector vel;
  float speed;
  
  int rgb;
  int alpha;
  float diam;

  Node(int _id, String _fName, String _name) {
    
    diam = 10f;
    rgb = 0;
    alpha = 255;
    
    id = _id;
    fName = _fName;
    name = _name;

    loc = new PVector(random(width), random(height));
    vel = new PVector(random(-1, 1), random(-1, 1));
    vel.normalize();

    speed = random(1, 3);
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
  void update() {
    if(alpha<255)alpha+=5;
    loc.add (PVector.div(PVector.mult(vel, speed), 256f/(1f+alpha)));
  }
  void display() {
    fill(rgb, alpha);
    float tmp_diam = diam/(256f/(1f+alpha));
    ellipse(loc.x, loc.y, tmp_diam, tmp_diam);
  }
}

