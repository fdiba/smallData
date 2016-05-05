import java.awt.GraphicsConfiguration;
import java.awt.GraphicsDevice;
import java.awt.GraphicsEnvironment;
import java.util.Date;

import de.bezier.data.sql.*;
import org.jbox2d.collision.shapes.*;
import org.jbox2d.common.*;
import org.jbox2d.dynamics.*;
import org.jbox2d.dynamics.contacts.*;
import org.jbox2d.dynamics.joints.*;
import shiffman.box2d.*;

MySQL dbconnection;

Box2DProcessing box2d;
//World world;

ArrayList<Boundary> boundaries;
ArrayList<String[]> records;
ArrayList<Node> nodes;
ArrayList<NGrp> groupes;
ArrayList<Node> notAloneNodes;

boolean fsMode;
boolean displayNoiseField = false;

float noiseScale = 50f; //50: 1 to infiny
float noiseStrength = 1; //1: 1 to infiny

boolean isDead;

int maxCreatures;
int pointer;

boolean useBox2d = true; //TODO constant

int world_offset;

float maxDist;

boolean pause;
boolean isOn;

Console cs;

void setup() {

  size(800, 600);
  frame.setLocation(20, 40);
  frame.setResizable(true);

  maxDist = 20;

  world_offset = 20;

  box2d = new Box2DProcessing(this);
  box2d.createWorld();
  box2d.setGravity(0, 0);
  
  cs = new Console();

  //------------------------------------------------------------------->
  //box2d.listenForCollisions();

  int thickness = 6;
  boundaries = new ArrayList<Boundary>();
  boundaries.add(new Boundary(width/2, height+thickness/2, width, thickness));
  boundaries.add(new Boundary(width/2, 0-thickness/2, width, thickness));
  boundaries.add(new Boundary(0-thickness/2, height/2, thickness, height));
  boundaries.add(new Boundary(width+thickness/2, height/2, thickness, height));

  maxCreatures = 100; //------------------------------------------------>

  String lines[] = loadStrings("access.txt");
  String user = lines[0];
  String pass = "";

  String database = "imeb";

  dbconnection = new MySQL( this, "localhost", database, user, pass );

  if ( dbconnection.connect() ) {

    //dbconnection.query( "SELECT COUNT(*) FROM artist" );
    //dbconnection.query( "SELECT firstName, id, name FROM artist" );
    dbconnection.query( "SELECT artist.id, artist.firstName, artist.name, country.c_name FROM artist INNER JOIN country ON artist.id_country = country.id" );

    groupes = new ArrayList<NGrp>();
    records = new ArrayList<String[]>();
    nodes = new ArrayList<Node>();
    notAloneNodes = new ArrayList<Node>();
    
    while (dbconnection.next ()) {

      int id = dbconnection.getInt("id");
      String fName = dbconnection.getString("firstName");
      String name = dbconnection.getString("name");
      String country = dbconnection.getString("c_name");

      try {
        fName = new String(fName.getBytes("iso-8859-1"), "UTF-8");
        name = new String(name.getBytes("iso-8859-1"), "UTF-8");
        country = new String(country.getBytes("iso-8859-1"), "UTF-8");
      } 
      catch (IOException ie) {
        println(ie);
      }
      String[] arr = {
        str(id), fName, name, country
      };
      records.add(arr);
      //nodes.add(new Node(id, fName, name));
      println(arr[0], arr[1], arr[2], arr[3]);
    }
  } else {
    println("connection failed !");
  }

  if (maxCreatures>records.size())maxCreatures=records.size();

  for (int i=0; i<maxCreatures; i++) {
    String[] arr = records.get(i);
    nodes.add(new Node(Integer.parseInt(arr[0]), arr[1], arr[2], arr[3]));
  }

  pointer = maxCreatures;
}
void draw() {

  background(225);

  if (!pause) box2d.step();

  if (displayNoiseField) displayNoiseField();

  while (nodes.size () < maxCreatures) {
    String[] arr = records.get(pointer);
    nodes.add(new Node(Integer.parseInt(arr[0]), arr[1], arr[2], arr[3]));
    pointer++;
    if (pointer>=records.size())pointer=0;
  }

  for (int i=0; i<nodes.size (); i++) {
    Node n = nodes.get(i);

    if (!useBox2d) {
      if (n.alone) {
        n.update();
        n.editVelBasedOnNoiseField(noiseScale, noiseStrength);
        n.checkEdges();
      }
      n.display();
    } else {
      n.updateBox2d();

      if (isOn)createConnexion(n, i);

      if (n.alone) {
        n.editVelBasedOnNoiseFieldBox2d(noiseScale, noiseStrength);
        n.checkEdgesBox2d();
      }
      n.displayBox2d();
    }
  }

  if (useBox2d) {
    for (NGrp g : groupes) {
      g.update();
      g.display();
    }
    for (Boundary b : boundaries) b.display();
    removeDeadNodes();
  }

  if (pause)checkNodeInfo();
  
  cs.display();

  if (frameCount%(24*10)==0)println("nodes: ", nodes.size(), "records:", records.size());
}
void createConnexion(Node n, int i) {

  for (int j=0; j<nodes.size (); j++) {

    float dist = maxDist;
    Node f = null;

    if (i!=j) {
      Node o = nodes.get(j);

      if (n.alone) { //it is looking for a grp

        if (n.country.equals(o.country)) {

          float distance = sqrt ((o.pos.x - n.pos.x)*(o.pos.x - n.pos.x) + (o.pos.y - n.pos.y)*(o.pos.y - n.pos.y));
          if (distance < dist) {
            f = nodes.get(j);
            dist = distance;
          }
        }
      }
    }

    if (f!=null) {

      if (groupes.size()>0) {

        NGrp grp = checkGrps(n.country);

        if (grp!=null) { //s'ajouter seulement si f n'est pas seul

            if (!f.alone) {
              String str = str(n.id) + " " + n.fName + " " + n.name + " " + n.country;
              cs.update(str);
              grp.addNode(n, f);
            }
        } else { //create new grp if group do not exist
          NGrp g = new NGrp(n, f);
          groupes.add(g);
          n.setNode();
          f.setNode();
          removeNodeFromRecord(n);
          removeNodeFromRecord(f);
        }
      } else { // create first grp
        NGrp g = new NGrp(n, f);
        groupes.add(g);
        n.setNode();
        f.setNode();
        removeNodeFromRecord(n);
        removeNodeFromRecord(f);
      }
    }
  }
}
NGrp checkGrps(String ctryName) {
  NGrp grp = null;
  for (NGrp g : groupes) {
    if (g.name.equals(ctryName)) {
      grp = g;
      break;
    }
  }
  return grp;
}
void removeNodeFromRecord(Node n) {
  String str_id =  str(n.id);
  for (int i=0; i<records.size (); i++) {
    if (records.get(i)[0].equals(str_id)) {
      records.remove(i);
      break;
    }
  }
}
void removeDeadNodes() {

  for (int i = nodes.size ()-1; i >= 0; i--) {
    if (nodes.get(i).isDead) {
      box2d.world.destroyBody(nodes.get(i).body);
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
void checkNodeInfo() {
  if (pause) {
    for (Node n : nodes) {
      if (n.contains(mouseX, mouseY)) {
        if (!str(n.id).equals(cs.message)) {
          String str = str(n.id) + " " + n.fName + " " + n.name + " " + n.country;
          cs.update(str);
        }
      }
    }
    for (NGrp g : groupes) {
      if (g.contains(mouseX, mouseY)) {
        if (!g.name.equals(cs.message)) {
          String str = g.name + " " + g.gNodes.size();
          cs.update(str);
        }
      }
    }
  }
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
  } else if (key == 'a') {
    isOn = !isOn;
  } else if (key == 'b') {
    displayNoiseField = !displayNoiseField;
  } else if (key == 'n') { //TODO BUG WITH COLLISION
    useBox2d = !useBox2d;
    if (!useBox2d) {

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
  } else if (key == ' ') {
    pause = !pause;
  } else if (key == 's') {
    saveIMG();
  }
}
//--------------------------- collision ------------//
/*
void endContact(Contact cp) {
 //println("endContact");
 }
 void beginContact(Contact cp) {
 //println("collision", random(255));
 }
 */
