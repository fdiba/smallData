import java.awt.GraphicsConfiguration;
import java.awt.GraphicsDevice;
import java.awt.GraphicsEnvironment;
import java.util.Date;

import de.bezier.data.sql.*;
import org.jbox2d.collision.shapes.*;
import org.jbox2d.common.*;
import org.jbox2d.dynamics.*;
import shiffman.box2d.*;

MySQL dbconnection;

Box2DProcessing box2d;

ArrayList<String[]> records;
ArrayList<Node> nodes;

boolean fsMode;
boolean displayNoiseField = false;

float noiseScale = 50f; //50: 1 to infiny
float noiseStrength = 1; //1: 1 to infiny

boolean isDead;

int maxCreatures;
int pointer;

boolean useNoise;

void setup() {

  size(800, 600);
  frame.setLocation(20, 40);
  frame.setResizable(true);

  box2d = new Box2DProcessing(this);
  box2d.createWorld();
  box2d.setGravity(0, 0);

  maxCreatures = 200;

  String lines[] = loadStrings("access.txt");
  String user = lines[0];
  String pass = "";

  String database = "imeb";

  dbconnection = new MySQL( this, "localhost", database, user, pass );

  if ( dbconnection.connect() ) {

    //dbconnection.query( "SELECT COUNT(*) FROM artist" );
    dbconnection.query( "SELECT firstName, id, name FROM artist" );

    records = new ArrayList<String[]>();
    nodes = new ArrayList<Node>();

    while (dbconnection.next ()) {

      int id = dbconnection.getInt("id");
      String fName = dbconnection.getString("firstName");
      String name = dbconnection.getString("name");

      try {
        fName = new String(fName.getBytes("iso-8859-1"), "UTF-8");
        name = new String(name.getBytes("iso-8859-1"), "UTF-8");
      } 
      catch (IOException ie) {
        println(ie);
      }
      String[] arr = {
        str(id), fName, name
      };
      records.add(arr);
      //nodes.add(new Node(id, fName, name));
      //println(id, " ", fName, " ", name);
    }
  } else {
    println("connection failed !");
  }

  if (maxCreatures>records.size())maxCreatures=records.size();

  for (int i=0; i<maxCreatures; i++) {
    String[] arr = records.get(i);
    nodes.add(new Node(Integer.parseInt(arr[0]), arr[1], arr[2]));
  }

  pointer = maxCreatures;

  println("nodes size: ", nodes.size());
}
void keyPressed() {
  if (key == 'f') {
    fsMode = !fsMode;

    if (fsMode) {

      println("fsMode");

      GraphicsEnvironment ge = GraphicsEnvironment.getLocalGraphicsEnvironment();
      GraphicsDevice[] gs = ge.getScreenDevices();

      println(gs.length);

      GraphicsDevice gd;

      if (gs.length > 1) {

        gd = gs[0];
        GraphicsDevice gd1 = gs[1];

        int m_width = gd1.getDisplayMode().getWidth();
        int m_height = gd1.getDisplayMode().getHeight();

        int xpos = gd.getDisplayMode().getWidth();

        frame.removeNotify();
        frame.setUndecorated(true);
        frame.addNotify();

        frame.setSize(m_width, m_height);
        frame.setLocation(xpos, 0);
      } else {

        gd = GraphicsEnvironment.getLocalGraphicsEnvironment().getDefaultScreenDevice();

        int m_width = gd.getDisplayMode().getWidth();
        int m_height = gd.getDisplayMode().getHeight();

        frame.removeNotify();
        frame.setUndecorated(true);
        frame.addNotify();

        frame.setSize(m_width, m_height);
        frame.setLocation(0, 0);
      }
    } else {

      println("!fsMode");

      frame.removeNotify();
      frame.setUndecorated(false);
      frame.addNotify();

      frame.setSize(800, 600);
      frame.setLocation(20, 40);
    }
  } else if (key == 'b') {
    displayNoiseField = !displayNoiseField;
  } else if (key == 'n') {
    useNoise = !useNoise;
    if (useNoise) {
      for (int i=0; i<nodes.size (); i++) {
        Node n = nodes.get(i);
        n.loc.x = n.pos.x;
        n.loc.y = n.pos.y;
      }
    } else {
      for (int i=0; i<nodes.size (); i++) {
        Node n = nodes.get(i);

        box2d.destroyBody(n.body);

        BodyDef bd = new BodyDef();
        bd.type = BodyType.DYNAMIC;

        bd.position = box2d.coordPixelsToWorld(n.loc.x, n.loc.y);
        n.body = box2d.world.createBody(bd);

        CircleShape cs = new CircleShape();
        cs.m_radius = box2d.scalarPixelsToWorld(n.diam/2);

        FixtureDef fd = new FixtureDef();
        fd.shape = cs;

        fd.density = n.density;
        fd.friction = n.friction;
        fd.restitution = n.restitution;

        n.body.createFixture(fd);

        n.body.setLinearVelocity(n.linearVelocity);
        n.body.setAngularVelocity(n.angularVelocity);
      }
    }
  } else if (key == 's') {
    saveIMG();
  }
}
void draw() {

  background(225);

  box2d.step();

  if (displayNoiseField) displayNoiseField();

  while (box2d.world.getBodyCount () < maxCreatures) {
    String[] arr = records.get(pointer);
    nodes.add(new Node(Integer.parseInt(arr[0]), arr[1], arr[2]));
    pointer++;
    if (pointer>=nodes.size())pointer=0;
  }

  noStroke();

  for (int i=0; i<nodes.size (); i++) {
    Node n = nodes.get(i);

    if (useNoise) {
      n.update();
      n.editVelBasedOnNoiseField(noiseScale, noiseStrength);
      n.checkEdges();
      n.display();
    } else {
      n.updateBox2d();
      n.editVelBasedOnNoiseFieldBox2d(noiseScale, noiseStrength);
      n.checkEdgesBox2d();
      n.displayBox2d();
    }
  }

  if (!useNoise)removeDeadNodes();
}
void removeDeadNodes() {

  for (int i = nodes.size ()-1; i >= 0; i--) {
    if (nodes.get(i).isDead) {
      box2d.destroyBody(nodes.get(i).body);
      nodes.remove(i);
    }
  }
}
void saveIMG() {
  Date date = new Date();
  String name = "data/sma-db-" + date.getTime() + ".jpg";
  save(name);
}
void displayNoiseField() {

  stroke (#b1c999, 255);

  float steps = 10;
  float x2, y2;
  float noiseVal, angle;

  for (int x=0; x<width; x+=steps) {
    for (int y=0; y<height; y+=steps) {

      noiseVal = noise (x/noiseScale, y/noiseScale) * noiseStrength;
      angle = map (noiseVal, 0, 1, 0, TWO_PI);

      x2 = x + cos (angle)*steps;
      y2 = y + sin (angle)*steps;

      line (x, y, x2, y2);
    }
  }
}

