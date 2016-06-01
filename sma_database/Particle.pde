class Particle {

  String name;
  String ctryCode;

  ArrayList<Composer> composers;

  Particle(Composer cp) {

    name = cp.country;

    composers = new ArrayList<Composer>();
    composers.add(cp);
  }
  void addComposer(Composer cp) {
    composers.add(cp);
    //println(name, composers.size());
  }
}

