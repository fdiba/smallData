class Particle {

  PVector loc;
  PVector vel;
  PVector acc;

  String name;
  String ctryCode;

  ArrayList<Composer> composers;
  int[] table;
  color c, strokeColor;
  float diamMax;
  float diam;

  float alpha;

  float maxspeed = 1;
  float maxforce = 0.025;

  float growth;

  int countTS;
  PFont font;

  Particle(Composer cp, int[] t) {

    font = createFont("HelveticaNeue-Bold-10.vlw", 10);
    countTS = 20;

    diamMax = 6f;
    alpha = 0;
    growth=.3;

    name = cp.country;

    if (name.equals("France"))ctryCode = "FR";
    else if (name.equals("Canada"))ctryCode = "CA";
    else if (name.equals("Royaume-Uni"))ctryCode = "GB";
    else if (name.equals("Allemagne"))ctryCode = "DE";
    else if (name.equals("Italie"))ctryCode = "IT";
    else if (name.equals("Argentine"))ctryCode = "ARG";
    else if (name.equals("Pays-Bas"))ctryCode = "NL";
    else if (name.equals("Pologne"))ctryCode = "PL";
    else if (name.equals("Espagne"))ctryCode = "ES";
    else if (name.equals("Japon"))ctryCode = "JP";
    else if (name.equals("Grèce"))ctryCode = "GR";
    else if (name.equals("Suède"))ctryCode = "SE";
    else ctryCode = name;

    acc = new PVector(0, 0);
    vel = new PVector(0, 0);
    //vel = new PVector(random(-1, 1), random(-1, 1));

    composers = new ArrayList<Composer>();
    composers.add(cp);

    table = t;

    loc = new PVector(table[0]+table[4]+random(table[2]-table[4]*2), table[1]+table[4]+random(table[3]-+table[4]*2));

    //colorMode(HSB, 360, 100, 100);
    c = color(200, 100, 100);
  }
  void addComposer(Composer cp) {

    composers.add(cp);

    setColors();

    diamMax+=growth;
    diam = diamMax;

    //println(name, composers.size());
  }
  void setColors() {
    colorMode(HSB, 360, 100, 100);
    float value = map(composers.size(), 1, 400, 200, 40);
    value = constrain(value, 40, 200);
    c = color(value, 100, 100);
    strokeColor = color(value, 100, 90);
  }
  PVector separate(ArrayList<Particle> myParticles) {


    PVector steer = new PVector(0, 0);
    int count = 0;

    for (Particle p : particles) {

      float desiredseparation = diam/2+p.diam/2+1;

      float d = PVector.dist(loc, p.loc);

      if ((d > 0) && (d < desiredseparation)) {

        PVector diff = PVector.sub(loc, p.loc);
        diff.normalize();
        diff.div(d); // Weight by distance
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) {

      steer.div((float)count);
      // Implement Reynolds: Steering = Desired - Velocity
      steer.normalize();
      steer.mult(maxspeed);
      steer.sub(vel);
      steer.limit(maxforce);
    }

    return steer;
  }
  void applyForce(PVector force) {
    // We could add mass here if we want A = F / M
    acc.add(force);
  }
  void update(ArrayList<Particle> myParticles) {

    if (alpha<255) {
      alpha+=5;
      diam = diamMax/(256f/(1f+alpha));
    }

    PVector sep = separate(myParticles);
    sep.mult(1);
    applyForce(sep);

    //loc.x += random(-1, 1);
    //loc.y += random(-1, 1);

    //loc.x += random(1, 2);
    //loc.y += random(1, 2);

    vel.add(acc);
    //vel.limit(maxspeed);
    loc.add(vel);
    acc.mult(0);

    vel.mult(0.9);
  }
  void checkEdges() {

    if (loc.x < table[0] + table[4]) {

      loc.x = table[0] + table[2] - table[4];
    } else if (loc.x > table[0] + table[2] - table[4]) {

      loc.x = table[0] + table[4];
    }

    if (loc.y < table[1] + table[4]) {

      loc.y = table[1] + table[3] - table[4];
    } else if (loc.y > table[1] + table[3] - table[4]) {
      loc.y = table[1] + table[4];
    }
  }
  void displayText() {
    if (composers.size()>countTS) {
      textFont(font);
      fill(25, alpha);
      text(ctryCode, loc.x-textWidth(ctryCode)/2, loc.y+4);
    }
  }
  void display() {
    fill(c, alpha);
    if (composers.size()>countTS) {
      stroke(strokeColor);
      strokeWeight(1);
    } else {
      noStroke();
    }
    ellipse(loc.x, loc.y, diam, diam);
  }
}

