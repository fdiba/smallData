class Particle {

  PVector loc;
  String name;
  String ctryCode;

  ArrayList<Composer> composers;
  int[] table;
  color c;
  float diam;

  Particle(Composer cp, int[] t) {

    diam = 10;

    name = cp.country;

    composers = new ArrayList<Composer>();
    composers.add(cp);

    table = t;

    loc = new PVector(table[0]+table[4]+random(table[2]-table[4]*2), table[1]+table[4]+random(table[3]-+table[4]*2));

    colorMode(RGB, 360);
    c = color(0, 127, 127);
  }
  void addComposer(Composer cp) {
    composers.add(cp);
    //println(name, composers.size());
  }
  void update() {
    //loc.x += random(-1, 1);
    //loc.y += random(-1, 1);
    
    loc.x += random(1, 2);
    loc.y += random(1, 2);
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
  void display() {
    fill(c);
    noStroke();
    ellipse(loc.x, loc.y, diam, diam);
  }
}

