import de.bezier.data.sql.*;
import java.nio.*;
import java.nio.file.*;

MySQL msql;

String mainTarget = "F:/IMEB/capsules";
IntList years;

String concours_fpart, name_fpart, fName_fpart, ctry_fpart, title_fpart, duration_fpart;

int count = 0;

void setup() {

  //------------------ database ------------------//
  String lines[] = loadStrings("access.txt");
  String user = lines[0];
  String pass = "";

  String database = "imeb";

  msql = new MySQL( this, "localhost", database, user, pass );

  if (msql.connect()) {
    msql.query( "SELECT COUNT(*) FROM artist" );
    msql.next();
    println("number of rows: " + msql.getInt(1));
  } else {
    println("connection failed!");
  }

  //----------------------------------------------//


  concours_fpart = "année-concours=";
  name_fpart = "nom=";
  fName_fpart = "prénom=";
  ctry_fpart = "pays=";

  title_fpart = "titre=";
  duration_fpart = "durée=";

  //----------------------------------------------//
  years = new IntList();

  File dir = new File(mainTarget);
  String[] children = dir.list();
  if (children != null) processFolders(mainTarget, children);

  years.sort();
  for (Integer year : years) {
    println(year);
  }
  //println(years.size());
}
void processMtdFile(String target, String[] elements, String folderName) {

  for (int i=0; i<elements.length; i++) {

    String filename = elements[i];

    if (filename.equals(folderName+".mtd")) {


      String[] lines = loadStrings(target+"/"+filename);
      //println("there are " + lines.length + " lines " + random(200));

      Node node = new Node();
      String info_concours = "";

      if (lines.length>40) {

        info_concours = lines[40];

        if (info_concours.length() > concours_fpart.length()) {

          //editArtistInfos(lines, info_concours); //----------------------------------> where magic happens 1/2
          editMusicInfos(lines, info_concours); //----------------------------------> where magic happens 2/2
        }
      }
    }
  }
}
void editMusicInfos(String[] lines, String editions) {

  //---------------- editions --------------//
  editions = editions.substring(concours_fpart.length());
  editions = trim(editions);

  //---------------- title --------------//
  String title = lines[22].substring(title_fpart.length());
  title = trim(title);

  title = title.replaceAll("\'", "\\\\'");

  /*try {
   title = new String(title.getBytes("UTF-8"), "iso-8859-1");
   } 
   catch (IOException ie) {
   println(ie);
   }*/

  //println(title);

  //---------------- duration --------------//
  String duration;
  if (lines[24].length()>duration_fpart.length()) {
    duration = lines[24].substring(duration_fpart.length());
    duration = trim(duration);
    duration = duration.replaceAll("\'", ":");
    if (duration.equals("11:"))duration="11:00";
    else if(duration.indexOf("00:")==0)duration=duration.substring(3);
  } else duration = "";

  //print(duration, ' ');

  //---------------- fName & name --------------//
  String name = getName(lines[20]);
  String fName = lines[21].substring(fName_fpart.length());

  if (name.equals("Rozman")) {
    name = "Rozmann";
    fName = "Akos";
  }

  try {
    fName = new String(fName.getBytes("UTF-8"), "iso-8859-1");
  } 
  catch (IOException ie) {
    println(ie);
  }

  //---------------- request --------------//

  String request = "SELECT id FROM artist WHERE name =\"" + 
    name + "\" and firstName =\"" + fName + "\""; 

  msql.query(request);

  if (!msql.next ()) { //we got a pb
    println("pb ");
  } else {
    //println(random(200));

    int artist_id = msql.getInt("id");

    /*request = "INSERT INTO music (title, duration, editions, id_artist) VALUES ('"
      + title + "', '" + duration + "', '" + editions + "', '"
      +  artist_id + "') AS tmp WHERE NOT EXISTS (SELECT title FROM music WHERE title='"
      + title + "') LIMIT 1;";*/

    request = "INSERT INTO music (title, duration, editions, id_artist) VALUES ('"
      + title + "', '" + duration + "', '" + editions + "', '"
      +  artist_id + "')";

    //msql.query(request); //-----------------------------------------------------------------------> 1/1
    //println(fName, name, ctry, "            000000000 ", c_id);
  }
}
String getName(String line) {

  String str = line.substring(name_fpart.length());
  String endStr = str.substring(1, str.length());
  str = str.substring(0, 1) + endStr.toLowerCase();

  str = trim(str);

  String[] names = split(str, ' ');
  names = trim(names);

  str = "";

  for (String n : names) {
    char c = n.charAt(0);
    if (str.length()<1) n = str(c).toUpperCase() + n.substring(1);
    else n = " " + str(c).toUpperCase() + n.substring(1);
    str = str + n;
  }

  int pos = str.indexOf("-"); 
  if (pos>=0) {
    char c = str.charAt(pos+1);            
    str = str.substring(0, pos) + " " + str(c).toUpperCase()
      + str.substring(pos+2, str.length());
  }

  pos = str.indexOf("'"); 
  if (pos>=0) {
    char c = str.charAt(pos+1);            
    str = str.substring(0, pos) + "'" + str(c).toUpperCase()
      + str.substring(pos+2, str.length());
  }

  str = str.replaceAll("\'", "\\\\'");

  try {
    str = new String(str.getBytes("UTF-8"), "iso-8859-1");
  } 
  catch (IOException ie) {
    println(ie);
  }

  return str;
}
void editArtistInfos(String[] lines, String info_concours) {

  //---------------- editions --------------//

  info_concours = info_concours.substring(concours_fpart.length());

  String[] editions = split(info_concours, ',');
  editions = trim(editions);

  //---------------- fName & name --------------//
  String name = getName(lines[20]);
  String fName = lines[21].substring(fName_fpart.length());

  if (name.equals("Rozman")) {
    name = "Rozmann";
    fName = "Akos";
  }

  try {
    fName = new String(fName.getBytes("UTF-8"), "iso-8859-1");
  } 
  catch (IOException ie) {
    println(ie);
  }

  //------------------ country ------------//

  String ctry = lines[26].substring(ctry_fpart.length());
  if (ctry.equals("Italie/Suisse")) ctry = "Italie";
  else if (ctry.equals("Canada; France")) ctry = "Canada";
  else if (ctry.equals("Grande Bretagne")) ctry = "Royaume-Uni";
  else if (ctry.equals("Grande-Bretagne")) ctry = "Royaume-Uni";
  else if (ctry.equals("") || ctry.equals("-mvt=")) ctry = "Unknown";
  else if (ctry.equals("Nouvelle Zélande")) ctry = "Nouvelle-Zélande";
  else if (ctry.equals("USA/Belgique")) ctry = "USA";
  else if (ctry.equals("Serbie/Canada")) ctry = "Serbie";
  else if (ctry.equals("Pays Bas")) ctry = "Pays-Bas";
  else if (ctry.equals("Taiwan")) ctry = "Taïwan";
  else if (ctry.equals("France-Argentine")) ctry = "France";
  else if (ctry.equals("République Tchèque")) ctry = "République tchèque";
  else if (ctry.equals("Gréce")) ctry = "Grèce";

  //----------------------------------------//

  //println(fName, name, ctry, "             ", filename);
  //delay(200);

  String request = "SELECT id FROM artist WHERE name =\"" + 
    name + "\" and firstName =\"" + fName + "\""; 

  msql.query(request);

  if (!msql.next ()) { //not new artist

      count++;
    //println(fName, name, ctry, "             ", count);

    //------------ create record --------------//

    try { //check ctry first
      ctry = new String(ctry.getBytes("UTF-8"), "iso-8859-1");
      //ctry = new String(ctry.getBytes("UTF-8"), "UTF-8");
    } 
    catch (IOException ie) {
      println(ie);
    }

    request = "SELECT id FROM country WHERE c_name =\"" + ctry + "\""; 
    msql.query(request);

    if (!msql.next ()) { //STEP 1/3 add missing country

      //check updateTableCountry.php
      request = "INSERT INTO country (c_name) VALUES ('"+ ctry +"')";
      //msql.query(request); //-----------------------------------------------------------------------> 1/3
      //println(ctry);
    } else { //STEP 2/3 new artist

      //check updateArtistsTable.php
      int c_id = msql.getInt("id");
      request = "INSERT INTO artist (firstName, name, id_country) VALUES ('" + fName + "', '" + name + "', '" +  c_id + "')"; 
      //msql.query(request); //-----------------------------------------------------------------------> 2/3
      //println(fName, name, ctry, "            000000000 ", c_id);
    }
  } else { //STEP 1/3 edit artist


    int artist_id = msql.getInt("id");

    for (String edition : editions) {

      if (!edition.equals("")) {

        edition = "ed_" + edition;

        request = "INSERT INTO edition (artist_id, " + edition + ") VALUES ('" + artist_id + "', '1')" +
          " ON DUPLICATE KEY UPDATE artist_id= '" + artist_id + "', " + edition + "=1";

        //msql.query(request); //-----------------------------------------------------------------------> 3/3
        //print(edition, " ");
      }
    }
  }

  //--------------------- years calculation ----------------------//

  for (String str : editions) {

    if (str.length()>0) {

      int year = Integer.parseInt(str);

      if (years.size()<1) {
        years.append(year);
      } else {

        boolean hasBeenFound=false;

        for (int j=0; j<years.size (); j++) {

          if (year == years.get(j)) {
            hasBeenFound = true;
            break;
          }
        }

        if (!hasBeenFound)years.append(year);
      }
    }
  }
}
void processFolders(String target, String[] elements) {

  for (int i=0; i<elements.length; i++) {

    String filename = elements[i];
    int position = filename.indexOf(".");

    if (position<0) { //new folder to explore

      String newTarget = target + "/" + filename;
      File dir = new File(newTarget);
      String[] children = dir.list();
      if (children != null) processMtdFile(newTarget, children, filename);
    }
  }
}

