import java.awt.GraphicsConfiguration;
import java.awt.GraphicsDevice;
import java.awt.GraphicsEnvironment;
import java.util.Date;
import java.util.List;
import java.util.Arrays;

import de.bezier.data.sql.*;
import themidibus.*;
import org.jbox2d.collision.shapes.*;
import org.jbox2d.common.*;
import org.jbox2d.dynamics.*;
import org.jbox2d.dynamics.contacts.*;
import org.jbox2d.dynamics.joints.*;
import shiffman.box2d.*;
import controlP5.*;

MySQL msql;

Box2DProcessing box2d;
Attractor attractor;

ControlP5 cp5;

ControlBoard board;

boolean state0, state1;

ArrayList<Boundary> boundaries;
ArrayList<String[]> records;
ArrayList<Node> nodes;
ArrayList<NGrp> groupes;

ArrayList<Composer> composers;
ArrayList<Particle> particles;

boolean fsMode;
boolean displayNoiseField = false;

float noiseScale = 50f; //50: 1 to infiny
float noiseStrength = 1; //1: 1 to infiny

int maxCreatures;

boolean useBox2d = true; //TODO constant

boolean pause;
boolean isOn = false;

Console cs;

float extension;

int fr;
int usa;

int r_count1, r_musics, r_names;

FloatList floats;

int cpTS;

Particle sl_p;
Composer sl_cp;

boolean search;

//x, y, w, h, offset must be < 15
int[][] tables = {
  {
    20, 40, 640/2, 480/2, 6, 0, 0
  }
  , {
    20, 40+480/2+20, 640/2, 480/2, 6, 0, 0
  }
  , 
  {
    20+640/2+20, 40+480/2+20, 640/2, 480/2, 6, 20+640/2+20+(640/2)/2, 40+480/2+20+(480/2)/2
  }
};

void setup() {

  size(800, 600);
  frame.setLocation(20, 40);
  frame.setResizable(true);

  //-------------------- cp5 --------------------------//

  cp5 = new ControlP5(this);
  board = new ControlBoard();

  //----------------------------------------------//

  r_count1 = r_musics = r_names = 0;

  extension = 20;

  box2d = new Box2DProcessing(this);
  box2d.createWorld();
  box2d.setGravity(0, 0);

  cs = new Console(new PVector(20, 24), new PVector(20, 580));

  //------------------------------------------------------------------->
  //box2d.listenForCollisions();

  createBoundaries(1);

  attractor = new Attractor(2, tables[1][0]+tables[1][2]/2, tables[1][1]+tables[1][3]/2);

  maxCreatures = 100; //------------------------------------------------>

  String lines[] = loadStrings("access.txt");
  String user = lines[0];
  String pass = "";

  String database = "imeb";

  msql = new MySQL( this, "localhost", database, user, pass );

  if ( msql.connect() ) {

    String request = "SELECT artist.id, artist.firstName, artist.name, country.c_name"
      + " FROM artist"
      + " INNER JOIN country ON artist.id_country = country.id";
    msql.query(request);

    records = new ArrayList<String[]>();
    nodes = new ArrayList<Node>();
    groupes = new ArrayList<NGrp>();

    composers = new ArrayList<Composer>();
    particles = new ArrayList<Particle>();

    while (msql.next ()) {

      r_count1++;

      int id = msql.getInt("id");
      String fName = msql.getString("firstName");
      String name = msql.getString("name");
      String country = msql.getString("c_name");

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
  println("r_count:", r_count1);

  if (maxCreatures>records.size())maxCreatures=records.size();

  for (int i=0; i<maxCreatures; i++) {
    String[] arr = records.remove(records.size()-1);
    addNewNode(arr);
  }

  if (maxCreatures>records.size())maxCreatures=records.size();
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

  if (state0) state0();
  else if (state1) state1();

  board.display(); //cp5 code

  if (frameCount%(24*10)==0) {

    cs.sb.setLength(0);
    cs.sb.append("nodes: ").append(nodes.size())
      .append(" | records: ").append(records.size())
        .append(" | bodies: ").append(box2d.world.getBodyCount())
          .append(" | groupes: ").append(groupes.size())
            .append(" | composers: ").append(composers.size())
              .append(" | particles: ").append(particles.size())
                .append(" | r_musics: ").append(r_musics)
                  .append(" | r_names: ").append(r_names);

    cs.updateStats(cs.sb.toString());
    //println(cs.sb.toString());
    
  }
}
void state1() {

  if (!pause) box2d.step();

  //-------------------------- batches 2 and 3 -----------------------------//

  updateAndDisplayBatch2();
  updateAndDisplayBatch3();

  //-------------------------- others -----------------------------//

  displayBoundaries();

  if (pause)checkNodeAndParticleInfo();

  cs.display();
}
void state0() {

  if (!pause) box2d.step();

  if (displayNoiseField) displayNoiseField();

  while (nodes.size () < maxCreatures && maxCreatures>0) {

    addNewNode(records.remove(records.size()-1));

    if (maxCreatures>records.size())maxCreatures=records.size();
  }


  //-------------------------- nodes -----------------------------//
  for (int i = nodes.size ()-1; i >= 0; i--) {
    Node n = nodes.get(i);

    if (!useBox2d) { //TODO update it
      n.update();
      n.editVelBasedOnNoiseField(noiseScale, noiseStrength);

      n.checkEdges(tables[0]); //--------------------------------- TODO EDIT IT

      n.display();
    } else {


      if (!n.isDead) {

        n.updateBox2d();

        n.editVelBasedOnNoiseFieldBox2d(noiseScale, noiseStrength);

        if (n.checkEdgesBox2d(tables[0])) { //SMA V2
          if (isOn) {

            createOrEditGroup(n); //batch 2

            checkDBforMusic(n.id, n.fName, n.name, n.country); //batch 3
          } else {
            putItInRecords(n.id, n.fName, n.name, n.country);
          }

          n.isDead = true;
        }
      } else {

        box2d.destroyBody(nodes.get(i).body);
        nodes.remove(i);
      }

      n.displayBox2d();
    }
  }  

  //-------------------------- batches 2 and 3 -----------------------------//

  updateAndDisplayBatch2();
  updateAndDisplayBatch3();

  //-------------------------- others -----------------------------//

  displayBoundaries();

  if (pause)checkNodeAndParticleInfo();

  cs.display();
}
void displayBoundaries() {

  for (int i=0; i<boundaries.size (); i++) {

    if (state0)boundaries.get(i).display();
    else {

      if (state1 && i >3)boundaries.get(i).display();
    }
  }
}
void updateAndDisplayBatch3() {

  if (composers.size()>0)createOrEditParticle();

  for (Particle p : particles) {

    if (p.composers.size()>cpTS) {
      if (!pause) {
        p.update(particles);
        p.checkEdges();
      }
      p.display();
    }
  }
  for (Particle p : particles) {
    if (p.composers.size()>cpTS) p.displayText();
  }
}
void updateAndDisplayBatch2() {

  attractor.display();

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
  }
}
void putItInRecords(int id, String fName, String name, String country) {
  String[] arr = {
    str(id), fName, name, country
  };
  records.add(arr);
}
void checkDBforMusic(int id, String fName, String name, String country) { //--------------------------- TODO TOO MANY REQUESTS

  String request = "SELECT title, duration, editions, residence, misam FROM music  WHERE id_artist=" + id;
  msql.query(request);

  int c=0;
  String title = "";
  ArrayList<String[]>musics = new ArrayList<String[]>();

  while (msql.next ()) {

    r_musics++;
    c++;

    //------------------------ title --------------------------//
    title = msql.getString("title");

    try {
      title = new String(title.getBytes("iso-8859-1"), "UTF-8");
    } 
    catch (IOException ie) {
      println(ie);
    }

    //------------------------ duration editions misam --------------------------//

    String duration = msql.getString("duration");
    String editions = msql.getString("editions");
    String residence = msql.getString("residence");
    String misam = msql.getString("misam");

    if (misam!=null) { //------------- check only accessible ressources

      misam = "MISAM-"+misam;

      String[] music = {
        title, duration, editions, residence, misam
      };
      musics.add(music);
    }
  }


  if (musics.size()>0) {
    Composer cp = new Composer(id, fName, name, country, musics);
    composers.add(cp);
    //println(musics.size());
  }
  if (musics.size()>5) {

    int init=0;

    for (String[] str : musics) {

      if (str[3]!= null) {

        init++;
        if (init==1) {
          //println("");
          //println(fName, name, country, musics.size(), "hits :");
          //println("-----------------------------------");
        }

        //println(str[0], str[1], "- résidence :", str[3], "MISAM :", str[4]);
      }
    }
    //println(musics.size(), "hits:", fName, name); //----------------------------------------------> check highest!
  }
}
void createOrEditParticle() {


  for (int i=composers.size ()-1; i>=0; i--) {

    if (particles.size()>0) {

      int index = checkParticles(composers.get(i).country);

      if (index<0) { //create new grp if grp do not already exists

        particles.add(new Particle(composers.remove(i), tables[2]));
      } else {

        particles.get(index).addComposer(composers.remove(i));
      }
    } else {
      particles.add(new Particle(composers.remove(i), tables[2]));
    }
  }
}
void createOrEditGroup(Node n) {

  if (groupes.size()>0) {

    int index = checkGrps(n.country);

    if (index<0) { //create new grp if grp do not already exists

      NGrp g = new NGrp(n, tables[1]);
      groupes.add(g);
    } else {

      NGrp g = groupes.get(index);
      g.addNode(n);

      cs.update(g.name+" "+g.g_records.size());
    }
  } else {  // create first grp
    NGrp g = new NGrp(n, tables[1]);
    groupes.add(g);
  }
  r_names++;
}
int checkParticles(String ctryName) {
  for (int i=0; i<particles.size (); i++) {
    if (particles.get(i).name.equals(ctryName)) {
      return i;
    }
  }
  return -1;
}
int checkGrps(String ctryName) {
  for (int i=0; i<groupes.size (); i++) {
    if (groupes.get(i).name.equals(ctryName)) {
      return i;
    }
  }
  return -1;
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


//------------------------- mouse -------------------------//

void checkNodeAndParticleInfo() {

  for (Node n : nodes) {
    if (n.contains(mouseX, mouseY)) {
      String str = str(n.id) + " " + n.fName + " " + n.name + " " + n.country;
      if (!str.equals(cs.message)) cs.update(str);
    }
  }

  for (NGrp g : groupes) {
    if (g.contains(mouseX, mouseY)) {
      String str = g.name + " " + g.g_records.size();
      if (!str.equals(cs.message)) cs.update(str);
    }
  }

  for (Particle p : particles) {
    if (p.contains(mouseX, mouseY) && p.composers.size()>cpTS) {
      String str = p.name + " " + p.composers.size();
      if (!str.equals(cs.message)) cs.update(str);
      //println(random(200));
    }
  }
}
void changeStateifNeededTo(int value) {

  if (value==1) {

    if (!state1) {

      state0 = false;
      state1 = true;
      cp5.getController("state 0").setValue(0);
    }
  } else {
    //cp5.get(ScrollableList.class, "composers").clear();
  }
}
void mousePressed() {

  cs.update("");


  for (Particle p : particles) {
    if (p.contains(mouseX, mouseY)) {
      String str = p.name + " " + p.composers.size();
      if (!str.equals(cs.message)) {

        cs.update(str);
        search = false;
        board.updateComposersList(p);
      }
      //println(random(200));

      changeStateifNeededTo(1);

      //if not the same
      cp5.getController("composers").show();

      //saveIMG();
    }
  }
}
//------------------------- keyboard -------------------------//
void keyPressed() {

  if (!cp5.get(Textfield.class, "input").isFocus()) {

    if (key == ' ') {
      pause = !pause;
      if (pause)cs.update("||");
      else cs.update("...");
    } else if (key == 'a') {
      isOn = !isOn;
      cs.update("interact " + str(isOn));
    } else if (key == 'b') {
      displayNoiseField = !displayNoiseField;
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
}

//--------------------------- collision ------------//
/*
void endContact(Contact cp) {
 //println("endContact");
 }
 void beginContact(Contact cp) {
 //println("collision", random(255));
 }
 ) */
