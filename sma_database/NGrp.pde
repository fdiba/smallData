class NGrp {

  String name;
  ArrayList<Node> gNodes;
  ArrayList<DistanceJoint> joints;

  float len;

  NGrp(Node n1, Node n2) {

    joints = new ArrayList<DistanceJoint>();

    len = 20;

    name = n1.country;

    n1.alone = false;
    n2.alone = false;

    gNodes = new ArrayList<Node>();
    gNodes.add(n1);
    gNodes.add(n2);

    createNewJoint(gNodes.get(0).body, gNodes.get(1).body);
  }
  void createNewJoint(Body b1, Body b2) {

    DistanceJointDef djd = new DistanceJointDef();
    // Connection between previous particle and this one
    djd.bodyA = b1;
    djd.bodyB = b2;
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
    //box2d.world.destroyJoint(dj);
  }
  void addNode(Node n) {

    n.alone = false;

    n.setNode();

    Node pn = gNodes.get(gNodes.size()-1);

    gNodes.add(n);
    createNewJoint(pn.body, n.body);
    
    if(gNodes.size()==3){
      Node fn = gNodes.get(0);
      createNewJoint(n.body, fn.body);
    }
    
  }
  void display() {

    for (DistanceJoint j : joints) {

      Vec2 pos1 = box2d.getBodyPixelCoord(j.getBodyA());
      Vec2 pos2 = box2d.getBodyPixelCoord(j.getBodyB());

      stroke(255, 0, 0);
      line(pos1.x, pos1.y, pos2.x, pos2.y);
    }
  }
}

