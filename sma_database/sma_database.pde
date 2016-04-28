import java.awt.GraphicsConfiguration;
import java.awt.GraphicsDevice;
import java.awt.GraphicsEnvironment;
import java.util.Date;
import de.bezier.data.sql.*;

MySQL dbconnection;

ArrayList<Node> nodes;

boolean fsMode;
boolean displayNoiseField = false;

float noiseScale = 50f; //50: 1 to infiny
float noiseStrength = 1; //1: 1 to infiny

void setup() {

  size(800, 600);
  frame.setLocation(20, 40);
  frame.setResizable(true);

  String lines[] = loadStrings("access.txt");
  String user = lines[0];
  String pass = "";

  String database = "imeb";

  dbconnection = new MySQL( this, "localhost", database, user, pass );

  if ( dbconnection.connect() ) {

    //dbconnection.query( "SELECT COUNT(*) FROM artist" );
    dbconnection.query( "SELECT firstName, id, name FROM artist" );

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
      nodes.add(new Node(id, fName, name));
      //println(id, " ", fName, " ", name);
    }
  } else {
    println("connection failed !");
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
  } else if (key == 'b') {
    displayNoiseField = !displayNoiseField;
  } else if (key == 's') {
    saveIMG();
  }
}
void draw() {
  background(225);

  if (displayNoiseField) displayNoiseField();

  noStroke();

  for (int i=0; i<200; i++) {
    Node n = nodes.get(i);
    n.update();
    n.editVelBasedOnNoiseField(noiseScale, noiseStrength);
    n.checkEdges();
    n.display();
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

