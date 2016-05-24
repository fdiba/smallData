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
//World world;

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

int world_offset;


boolean pause;
boolean isOn;

Console cs;

float extension;

int fr;
int usa;

FloatList floats;

void setup() {

  size(800, 600);
  frame.setLocation(20, 40);
  frame.setResizable(true);


  world_offset = 20;

  extension = 20;

  box2d = new Box2DProcessing(this);
  box2d.createWorld();
  box2d.setGravity(0, 0);

  cs = new Console();

  //------------------ midi ------------------//
  MidiBus.list();
  myBus = new MidiBus(this, "Midi Fighter Twister", "Midi Fighter Twister");
  resetFighterTwister();


  //------------------------------------------------------------------->
  //box2d.listenForCollisions();

  int thickness = 6;
  boundaries = new ArrayList<Boundary>();
  boundaries.add(new Boundary(width/2, height+thickness/2, width+10, thickness));
  boundaries.add(new Boundary(width/2, 0-thickness/2-1, width+10, thickness));
  boundaries.add(new Boundary(0-thickness/2-1, height/2, thickness, height+10));
  boundaries.add(new Boundary(width+thickness/2, height/2, thickness, height+10));

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
    nodes.add(new Node(Integer.parseInt(arr[0]), arr[1], arr[2], arr[3]));
    pointer = i;
  }
}
void draw() { //TODO ENLARGE TERRITORY

  background(225);

  if (!pause) box2d.step();

  if (displayNoiseField) displayNoiseField();

  //while (box2d.world.getBodyCount () < maxCreatures) {
  while (nodes.size () < maxCreatures && records.size()>0) {

    pointer++;
    if (pointer>=records.size())pointer=0;

    String[] arr = records.get(pointer);
    nodes.add(new Node(Integer.parseInt(arr[0]), arr[1], arr[2], arr[3]));


    if (maxCreatures>records.size())maxCreatures=records.size();
  }

  for (int i=0; i<nodes.size (); i++) {
    Node n = nodes.get(i);

    if (!useBox2d) { //check it
      if (n.alone) {
        n.update();
        n.editVelBasedOnNoiseField(noiseScale, noiseStrength);
        n.checkEdges();
      }
      n.display();
    } else {
      n.updateBox2d();

      if (isOn) {
        tryCreateGroup(n, i);
        if (!n.isDead)tryLinkToGrp(n);
      }

      n.editVelBasedOnNoiseFieldBox2d(noiseScale, noiseStrength);
      n.checkEdgesBox2d();

      n.displayBox2d();
    }
  }

  if (useBox2d) {
    for (NGrp g : groupes) {
      g.update();
      g.checkEdgesBox2d();
      g.display();
    }
    for (NGrp g : groupes)g.displayText();

    for (Boundary b : boundaries) b.display();
    removeDeadNodes();
  }

  if (pause)checkNodeInfo();

  cs.display();

  if (frameCount%(24*10)==0)println("nodes: ", nodes.size(), "records:", records.size(), "bodies:", box2d.world.getBodyCount());
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

  float steps = 10;
  float x = 0, y = 0, x2, y2;
  float noiseVal, angle;

  for (int i = 0; i < width; i+=steps)
  {
    x = i;
    for (int j = 0; j < height; j+=steps)
    {
      y = j;

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
