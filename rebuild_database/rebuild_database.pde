import de.bezier.data.sql.*;
import java.nio.*;
import java.nio.file.*;

MySQL msql;

String mainTarget = "F:/IMEB/capsules";

String concours_fpart, name_fpart, fName_fpart, ctry_fpart, title_fpart, duration_fpart, misam_fpart;

int count = 0;

int errors;
int emptyFiles;

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
  misam_fpart = "cote_ex_original= MISAM-";

  //----------------------------------------------//

  File dir = new File(mainTarget);
  String[] children = dir.list();
  if (children != null) processFolders(mainTarget, children);

  println("errors:", errors);
  println("emptyFiles:", emptyFiles);
}
void processMtdFile(String target, String[] elements, String folderName) {

  for (int i=0; i<elements.length; i++) {

    String filename = elements[i];

    if (filename.equals(folderName+".mtd")) {


      String[] lines = loadStrings(target+"/"+filename);
      //println("there are " + lines.length + " lines " + random(200));

      Node node = new Node();
      String info_concours = "";

      //------------ process all composers ------------//
      if (lines.length>1) {

        int id = getLineID(lines, concours_fpart);
        if (id>=0)info_concours = lines[id];

        if (info_concours.length() > concours_fpart.length()) { //compositeurs ayant participé à au moins un concours

          //editArtistInfos(lines, info_concours, filename); //------------------------> where magic happens 1/3
          //insertMusicInfos(lines, info_concours, filename); //------------------------> where magic happens 2/3 //3064
          //updateMusicInfos(lines, info_concours, filename); //------------------------> where magic happens 3/3
          //println(info_concours);
        } else {

          //editArtistInfos(lines, info_concours, filename);
          //insertMusicInfos(lines, info_concours, filename); //insert only title, duration misam and editions USE IT ONLY ONCE THEN UPDATE
          updateMusicInfos(lines, info_concours, filename);
        }
      } else {
        emptyFiles++;
      }
    }
  }
}
//------------------------------------------------------------------------------//
//-------------------------------- CCC db step three ---------------------------//
//------------------------------------------------------------------------------//
void updateMusicInfos(String[] lines, String editions, String filename) { //just used to add misam code for the moment - add R


  //---------------- editions --------------//
  //add edition

  //---------------- code misam --------------//
  
  int id_misam = getLineID(lines, misam_fpart);
  String misam = lines[id_misam].substring(misam_fpart.length());
  misam = trim(misam);

  //---------------- title --------------//
  int id_title = getLineID(lines, title_fpart);
  String title = editTitle(lines[id_title]);
  //println(title);

  //---------------- duration --------------//
  
  int id_duration = getLineID(lines, duration_fpart);
  String duration = "";

  if (id_duration>-1) duration = processDuration(lines[id_duration]);

  //print(duration, ' ');

  //---------------- request --------------//

  String request = "SELECT id FROM music WHERE misam = " + misam; 

  msql.query(request);

  if (!msql.next ()) { //we got a pb
    println("pb: music should already be registered! ");
  } else {
    //println(random(200));

    int music_id = msql.getInt("id");

    request = "UPDATE music SET misam = '" + misam + "' WHERE id =" + music_id; 

    //msql.query(request); //-----------------------------------------------------------------------> 1/1
    //println(misam);
  }
}
//----------------------------------------------------------------------------//
//-------------------------------- BBB db step two ---------------------------//
//----------------------------------------------------------------------------//
void insertMusicInfos(String[] lines, String info_concours, String filename) {

  //---------------- editions --------------//

  String[] editionsArray = processEditions(info_concours); 
  String editions = join(editionsArray, ",");
  //println(editions);
  
  //---------------- code misam --------------//
  
  int id_misam = getLineID(lines, misam_fpart);
  String misam = lines[id_misam].substring(misam_fpart.length());
  misam = trim(misam);

  //---------------- title --------------//

  int id_title = getLineID(lines, title_fpart);
  String title = editTitle(lines[id_title]);
  //println(title);

  //---------------- duration --------------//

  int id_duration = getLineID(lines, duration_fpart);
  String duration = "";

  if (id_duration>-1) duration = processDuration(lines[id_duration]);

  //print(duration, ' ');

  //---------------- fName & name --------------//

  int id_fname, id_name;
  id_fname = getLineID(lines, fName_fpart);
  id_name = getLineID(lines, name_fpart);

  if (id_fname<0 || id_name<0) {
    println("NOT FOUND!", id_fname, id_name, filename);
    //println(lines[id_name], filename);
  }

  //--- TODO bugs
  if (filename.equals("MISAM_112729_V1_1.mtd")) {
    id_fname=21;
    //println(lines[id_fname]);
    println(lines[id_fname], lines[id_name], title, duration);
  }


  String[] idt = editFirstNameAndName(lines[id_fname], lines[id_name]);
  String fName = idt[0];
  String name = idt[1];

  //---------------- request --------------//

  String request = "SELECT id FROM artist WHERE name =\"" + 
    name + "\" and firstName =\"" + fName + "\""; 

  msql.query(request);

  if (!msql.next ()) { //we got a pb
    println("pb: composer should be already present!");
  } else { //WARNING use it only once !

    int artist_id = msql.getInt("id");

    request = "INSERT INTO music (title, duration, editions, misam, id_artist) VALUES ('"
      + title + "', '" + duration + "', '" + editions + "', '"
      + misam + "', '"
      +  artist_id + "')";

    msql.query(request); //-----------------------------------------------------------------------> 1/1
    //println(fName, name, title, duration, editions);
  }
}

//------------------------- edit Strings ----------------------------------------//
String editTitle(String line) {

  String str = line.substring(title_fpart.length());
  str = trim(str);

  str = str.replaceAll("\'", "\\\\'");
  str = str.replaceAll("\"", "\\\\\"");

  try {
    str = new String(str.getBytes("UTF-8"), "iso-8859-1");
  } 
  catch (IOException ie) {
    println(ie);
  }

  return str;
}
String editName(String line) {

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

  return str;
}
String editFirstName(String line) {

  String str = line.substring(fName_fpart.length());
  str = trim(str);

  str = str.replaceAll("Á", "A");
  str = str.replaceAll("á", "a");
  str = str.replaceAll("ã", "a");
  str = str.replaceAll("ë", "e");
  str = str.replaceAll("ó", "o");
  str = str.replaceAll("ø", "o");

  return str;
}
String[] editFirstNameAndName(String fName, String name) {

  fName = editFirstName(fName);
  name = editName(name);


  if (fName.equals("Martin Rudolf") && name.indexOf("Fischer")>0)name="Fischer";


  for (int i=0; i<namesAndFirstnamesToCheck.length; i++) {

    if (name.equals(namesAndFirstnamesToCheck[i][3]) && fName.equals(namesAndFirstnamesToCheck[i][2])) {
      name = namesAndFirstnamesToCheck[i][1];
      fName = namesAndFirstnamesToCheck[i][0];
    }
  }


  try { //utf8 to iso
    fName = new String(fName.getBytes("UTF-8"), "iso-8859-1");
    name = new String(name.getBytes("UTF-8"), "iso-8859-1");
  } 
  catch (IOException ie) {
    println(ie);
  }

  String[] array = {
    fName, name
  };

  return array;
}
//--------------------
int getLineID(String[] lines, String str_fpart) {

  int id = -1;

  for (int i=0; i<lines.length; i++) {
    int pos = lines[i].indexOf(str_fpart);
    if (pos==0) {
      id = i;
      break;
    }
  }

  return id;
}
String processDuration(String str){
  
  String duration = "";
  
  if (str.length()>duration_fpart.length()) {
      duration = str.substring(duration_fpart.length());
      duration = duration.replaceAll(" ", "");
      duration = duration.replaceAll("\'", ":");
      if (duration.equals("11:"))duration="11:00";
      else if (duration.indexOf("00:")==0)duration=duration.substring(3);
      else if (duration.equals("01:09:47"))duration="69:47";
      else if (duration.equals("01:18:30"))duration="78:30";
      else if (duration.equals("1:02:23"))duration="62:23";
    }
  return duration;
}
String[] processEditions(String str) {

  if (str.length()>0) {
    char lastChar = str.charAt(str.length()-1);
    if (lastChar==',') str = str.substring(0, str.length()-1);
  }

  if (str.length()>concours_fpart.length())str = str.substring(concours_fpart.length());
  else str = "";

  String[] editions = split(str, ','); //TODO sort editions if size > 1 AND REMOVE WHEN edition[i]==0
  editions = trim(editions);
  editions = sort(editions);

  return editions;
}
//----------------------------------------------------------------------------//
//-------------------------------- AAA db step one ---------------------------//
//----------------------------------------------------------------------------//
void editArtistInfos(String[] lines, String info_concours, String filename) {

  //---------------- editions --------------//

  String[] editions = processEditions(info_concours);

  //---------------- fName & name & country --------------//

  int id_fname, id_name, id_ctry;

  id_fname = getLineID(lines, fName_fpart);
  id_name = getLineID(lines, name_fpart);
  id_ctry = getLineID(lines, ctry_fpart);


  if (id_fname<0 || id_name<0 || id_ctry<0 ) {
    println("NOT FOUND!", id_fname, id_name, id_ctry, filename);
    //println(lines[id_name], filename);
  }


  //--- TODO bugs
  if (filename.equals("MISAM_112729_V1_1.mtd")) {
    id_fname=21;
    //println(lines[id_fname]);
  }

  String[] idt = editFirstNameAndName(lines[id_fname], lines[id_name]);
  String fName = idt[0];
  String name = idt[1];

  String ctry = lines[id_ctry].substring(ctry_fpart.length());
  ctry = trim(ctry);

  if (ctry.equals("Italie/Suisse")) ctry = "Italie";
  else if (ctry.equals("Canada; France")) ctry = "Canada";
  else if (ctry.equals("Grande Bretagne")) ctry = "Royaume-Uni";
  else if (ctry.equals("Grande-Bretagne")) ctry = "Royaume-Uni";
  else if (ctry.equals("") || ctry.equals("-mvt=")) ctry = "Unknown";
  else if (ctry.equals("Nouvelle Zélande")) ctry = "Nouvelle-Zélande";
  else if (ctry.equals("USA/Belgique")) ctry = "USA";
  else if (ctry.equals("Usa;Brézil")) ctry = "USA";
  else if (ctry.equals("Serbie/Canada")) ctry = "Serbie";
  else if (ctry.equals("Pays Bas")) ctry = "Pays-Bas";
  else if (ctry.equals("Taiwan")) ctry = "Taïwan";
  else if (ctry.equals("France-Argentine")) ctry = "France";
  else if (ctry.equals("République Tchèque")) ctry = "République tchèque";
  else if (ctry.equals("Gréce")) ctry = "Grèce";
  else if (ctry.equals("Corée")) ctry = "Corée du Sud";
  else if (ctry.equals("République Dominicaine")) ctry = "République dominicaine";
  else if (ctry.equals("Tchéquie")) ctry = "République tchèque";

  //----------------------------------------//

  String request = "SELECT id FROM artist WHERE name =\"" + 
    name + "\" and firstName =\"" + fName + "\""; 

  msql.query(request);

  if (!msql.next ()) { //no artist not found

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
      request = "INSERT INTO country (c_name) VALUES ('"+ ctry +"')";
      //msql.query(request); //-----------------------------------------------------------------------> 1/3
      println(ctry, fName, name, filename);
    } else { //STEP 2/3 add new new artist
      int c_id = msql.getInt("id");
      request = "INSERT INTO artist (firstName, name, id_country) VALUES ('" + fName + "', '" + name + "', '" +  c_id + "')"; 
      //msql.query(request); //-----------------------------------------------------------------------> 2/3

      //--------- get infos --------------//

      /* not found
       Philippe - Menard 1979
       Janine - Elliot 1983
       Janine - Elliot 1994
       Luc - Ferrari 1973
       */

      
      try { //for print
       fName = new String(fName.getBytes("iso-8859-1"), "UTF-8");
       name = new String(name.getBytes("iso-8859-1"), "UTF-8");
       } 
       catch (IOException ie) {
       println(ie);
       }
       
       println(ctry, fName, name, filename);

      //----------------------------------//
    }
  } else { //STEP 1/3 edit artist edition if artist already in database

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
}

//-----------------------------



//-----------------------------

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

