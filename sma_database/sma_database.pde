import java.awt.GraphicsConfiguration;
import java.awt.GraphicsDevice;
import java.awt.GraphicsEnvironment;
import java.util.Date;

import de.bezier.data.sql.*;
import themidibus.*;
import org.jbox2d.collision.shapes.*;
import org.jbox2d.common.*;
import org.jbox2d.dynamics.*;
import org.jbox2d.dynamics.contacts.*;
import org.jbox2d.dynamics.joints.*;
import shiffman.box2d.*;

MySQL dbconnection;
MidiBus myBus;

Box2DProcessing box2d;
Attractor attractor;

ArrayList<Boundary> boundaries;
ArrayList<String[]> records;
ArrayList<Node> nodes;
ArrayList<NGrp> groupes;

boolean fsMode;
boolean displayNoiseField = false;

float noiseScale = 50f; //50: 1 to infiny
float noiseStrength = 1; //1: 1 to infiny

boolean isDead;

int maxCreatures;
int pointer;

boolean useBox2d = true; //TODO constant

boolean pause;
boolean isOn;

Console cs;

float extension;

int fr;
int usa;

FloatList floats;

//x, y, w, h, offset must be < 15
int[][] tables = {
  {
    20, 40, 640/2, 480/2, 6
  }
  , {
    20, 40+480/2+20, 640/2, 480/2, 6
  }
};

void setup() {

  size(800, 600);
  frame.setLocation(20, 40);
  frame.setResizable(true);

  extension = 20;

  box2d = new Box2DProcessing(this);
  box2d.createWorld();
  box2d.setGravity(0, 0);

  cs = new Console(new PVector(20, 24));

  //------------------ midi ------------------//
  MidiBus.list();
  myBus = new MidiBus(this, "Midi Fighter Twister", "Midi Fighter Twister");
  resetFighterTwister();


  //------------------------------------------------------------------->
  //box2d.listenForCollisions();

  createBoundaries(1);

  attractor = new Attractor(2, tables[1][0]+tables[1][2]/2, tables[1][1]+tables[1][3]/2);

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

      if (country.equals("USA")) {
        usa++;
      } else if (country.equals("France")) {
        fr++;
      }
    }
  } else {
    println("connection failed !");
  }

  println("fr:", fr, "usa:", usa);

  if (maxCreatures>records.size())maxCreatures=records.size();

  for (int i=0; i<maxCreatures; i++) {
    String[] arr = records.get(i);
    addNewNode(arr);

    pointer = i;
  }
}
void addNewNode(String[] arr) {
  nodes.add(new Node(random(tables[0][0]+15, tables[0][0]+tables[0][2]-15), 
  random(tables[0][1]+15, tables[0][1]+tables[0][3]-15), 
  Integer.parseInt(arr[0]), arr[1], arr[2], arr[3]));
}
void createBoundaries(int thickness) {

  boundaries = new ArrayList<Boundary>();

  for (int[] t : tables) {

    boundaries.add(new Boundary(t[2]/2+t[0], t[3]+thickness/2+t[1], t[2]+10, thickness)); //bottom
    boundaries.add(new Boundary(t[2]/2+t[0], t[1]-thickness/2-1, t[2]+10, thickness)); //top
    boundaries.add(new Boundary(t[0]-thickness/2-1, t[3]/2+t[1], thickness, t[3]+10)); //left
    boundaries.add(new Boundary(t[2]+thickness/2+t[0], t[3]/2+t[1], thickness, t[3]+10)); //right
  }
}
void draw() { //TODO ENLARGE TERRITORY

  colorMode(RGB, 255);
  background(225);

  if (!pause) box2d.step();

  if (displayNoiseField) displayNoiseField();

  //while (box2d.world.getBodyCount () < maxCreatures) {
  while (nodes.size () < maxCreatures && records.size()>0) {

    pointer++;
    if (pointer>=records.size())pointer=0;

    String[] arr = records.get(pointer);
    addNewNode(arr);

    if (maxCreatures>records.size())maxCreatures=records.size();
  }

  for (int i=0; i<nodes.size (); i++) {
    Node n = nodes.get(i);

    if (!useBox2d) { //check it
      if (n.alone) {
        n.update();
        n.editVelBasedOnNoiseField(noiseScale, noiseStrength);
        n.checkEdges(tables[0]); //--------------------------------- TODO EDIT IT
      }
      n.display();
    } else {
      n.updateBox2d();

      /*if (isOn) { //SMA V1
       tryCreateGroup(n, i); //--------------------------------------------------------------------> check it
       if (!n.isDead)tryLinkToGrp(n); //--------------------------------------------------------------------> check it
       }*/

      n.editVelBasedOnNoiseFieldBox2d(noiseScale, noiseStrength);

      if (n.checkEdgesBox2d(tables[0]) && isOn) { //SMA V2
        createOrEditGroup(n);
      }

      n.displayBox2d();
    }
  }

  if (useBox2d) {
    for (NGrp g : groupes) {

      if (!pause) {
        g.update();
        g.checkEdgesBox2d();

        Vec2 force;
        force = attractor.attract(g);
        //println(force);
        g.applyForce(force);
      }

      g.display();
      g.displayText();
    }

    removeDeadNodes();
  }

  for (Boundary b : boundaries) b.display();
  attractor.display();

  if (pause)checkNodeInfo();

  cs.display();

  if (frameCount%(24*10)==0)println("nodes: ", nodes.size(), 
  "records:", records.size(), 
  "bodies:", box2d.world.getBodyCount(), 
  "groupes:", groupes.size());
}
void createOrEditGroup(Node n) { //SMA V2

  if (groupes.size()>0) {

    NGrp grp = checkGrps(n.country);

    if (grp==null) { //create new grp if grp do not already exists
      NGrp g = new NGrp(n, tables[1]);
      groupes.add(g);
      removeNodeFromRecords(n);
    } else { //check tryLinkToGrp

      for (int i=0; i<groupes.size (); i++) {
        NGrp g = groupes.get(i);
        if (n.country.equals(g.name)) {
          g.addNode(n);
          removeNodeFromRecords(n);   
          cs.update(g.name+" "+g.g_records.size());  
          break;
        }
      }
    }
  } else {  // create first grp
    NGrp g = new NGrp(n, tables[1]);
    groupes.add(g);
    removeNodeFromRecords(n);
  }
}
void tryLinkToGrp(Node n) {

  for (int i=0; i<groupes.size (); i++) {

    NGrp g = groupes.get(i);

    if (n.country.equals(g.name)) {

      float collisionDist = n.diam/2+g.diam/2+4+extension;

      float distance = sqrt ((g.pos.x - n.pos.x)*(g.pos.x - n.pos.x) + (g.pos.y - n.pos.y)*(g.pos.y - n.pos.y));

      if (distance < collisionDist) {
        g.addNode(n);
        removeNodeFromRecords(n);   
        cs.update(g.name+" "+g.g_records.size());     
        break;
      }
    }
  }
}
void tryCreateGroup(Node n, int i) {

  Node f = null;
  float collisionDist = n.diam+4+extension;

  for (int j=0; j<nodes.size (); j++) {

    if (i!=j) {
      Node o = nodes.get(j);

      if (n.alone) { //it is still looking for a grp

        if (n.country.equals(o.country)) {

          float distance = sqrt ((o.pos.x - n.pos.x)*(o.pos.x - n.pos.x) + (o.pos.y - n.pos.y)*(o.pos.y - n.pos.y));
          if (distance < collisionDist) {
            f = nodes.get(j);
            break;
          }
        }
      }
    }
  }

  if (f!=null) {

    if (groupes.size()>0) {

      NGrp grp = checkGrps(n.country);

      if (grp==null) { //create new grp if grp do not already exists
        NGrp g = new NGrp(n, f);
        groupes.add(g);
        removeNodeFromRecords(n);
        removeNodeFromRecords(f);
      }
    } else { // create first grp
      NGrp g = new NGrp(n, f);
      groupes.add(g);
      removeNodeFromRecords(n);
      removeNodeFromRecords(f);
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
void removeNodeFromRecords(Node n) {
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

//------------------------- noiseField -------------------------//

void displayNoiseField() {

  stroke (#b1c999, 180);

  int steps = 10;
  float x2, y2;
  float noiseVal, angle;

  for (int x = tables[0][0]; x < tables[0][2]+tables[0][0]; x+=steps) {
    for (int y = tables[0][1]+steps; y < tables[0][3]+tables[0][1]; y+=steps) {

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
          String str = g.name + " " + g.g_records.size();
          cs.update(str);
        }
      }
    }
  }
}
//------------------------- mouse -------------------------//
void mousePressed() {
  cs.update("");
}
//------------------------- midi interface -------------------------//
void resetFighterTwister() {
  int channel = 0;
  int value = 0;
  for (int i=0; i<16; i++) myBus.sendControllerChange(channel, i, value);
}
//------------------------- keyboard -------------------------//
void keyPressed() {

  if (key == ' ') {
    pause = !pause;
    if (pause)cs.update("||");
    else cs.update("...");
  } else if (key == 'a') {
    isOn = !isOn;
    cs.update("interact " + str(isOn));
  } else if (key == 'b') {
    displayNoiseField = !displayNoiseField;
  } else if (key == 'f') { //TODO update it
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
  } else if (key == 'n') { //TODO BUG WITH COLLISION
    useBox2d = !useBox2d;
    cs.update("physics " + str(useBox2d));
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
  } else if (key == 'o') { //dezoom
    noiseScale--;
    if (noiseScale < 1) noiseScale = 1;
  } else if (key == 'p') { //zoom
    noiseScale++;
  } else if (key == 'r') {
    noiseSeed ((int) random (10000));
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
