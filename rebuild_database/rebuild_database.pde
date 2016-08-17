import de.bezier.data.sql.*;
import java.nio.*;
import java.nio.file.*;

MySQL msql;

String mainTarget = "F:/IMEB/capsules";
IntList years;

String concours_fpart, name_fpart, fName_fpart, ctry_fpart, title_fpart, duration_fpart, misam_fpart;

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
  misam_fpart = "cote_ex_original= MISAM-";

  //----------------------------------------------//
  years = new IntList();

  File dir = new File(mainTarget);
  String[] children = dir.list();
  if (children != null) processFolders(mainTarget, children);

  years.sort();
  for (Integer year : years) {
    //println(year);
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

          //editArtistInfos(lines, info_concours); //----------------------------------> where magic happens 1/3
          //insertMusicInfos(lines, info_concours); //----------------------------------> where magic happens 2/3
          updateMusicInfos(lines, info_concours); //----------------------------------> where magic happens 3/3
        }
      }
    }
  }
}

//-------------------------------- CCC db step three ---------------------------//
void updateMusicInfos(String[] lines, String editions) { //just used to add misam code for the moment - add R

  //---------------- code misam --------------//
  String misam = lines[6].substring(misam_fpart.length());
  misam = trim(misam);

  //---------------- title --------------//
  String title = editTitle(lines[22]);
  //println(title);

  //---------------- duration --------------//
  String duration;
  if (lines[24].length()>duration_fpart.length()) {
    duration = lines[24].substring(duration_fpart.length());
    duration = trim(duration);
    duration = duration.replaceAll("\'", ":");
    if (duration.equals("11:"))duration="11:00";
    else if (duration.indexOf("00:")==0)duration=duration.substring(3);
  } else duration = "";

  //---------------- request --------------//

  String request = "SELECT id FROM music WHERE title =\"" + 
    title + "\" and duration =\"" + duration + "\""; 

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
//-------------------------------- BBB db step two ---------------------------//
void insertMusicInfos(String[] lines, String editions) {

  //---------------- editions --------------//
  editions = editions.substring(concours_fpart.length());
  editions = trim(editions);

  char lastChar = editions.charAt(editions.length()-1);
  if (lastChar==',') {
    editions = editions.substring(0, editions.length()-1);
    //println(editions);
  }

  //---------------- title --------------//
  String title = editTitle(lines[22]);
  //println(title);

  //---------------- duration --------------//
  String duration;
  if (lines[24].length()>duration_fpart.length()) {
    duration = lines[24].substring(duration_fpart.length());
    duration = trim(duration);
    duration = duration.replaceAll("\'", ":");
    if (duration.equals("11:"))duration="11:00";
    else if (duration.indexOf("00:")==0)duration=duration.substring(3);
  } else duration = "";

  //print(duration, ' ');

  //---------------- fName & name --------------//

  String[] idt = editNameAndFirstName(lines[21], lines[20]);
  String fName = idt[0];
  String name = idt[1];

  //---------------- request --------------//

  String request = "SELECT id FROM artist WHERE name =\"" + 
    name + "\" and firstName =\"" + fName + "\""; 

  msql.query(request);

  if (!msql.next ()) { //we got a pb
    println("pb: composer should be already present!");
  } else {
    //println(random(200));

    int artist_id = msql.getInt("id");

    request = "INSERT INTO music (title, duration, editions, id_artist) VALUES ('"
      + title + "', '" + duration + "', '" + editions + "', '"
      +  artist_id + "')";

    //msql.query(request); //-----------------------------------------------------------------------> 1/1
    println(fName, name, title, duration, editions);
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
String[] editNameAndFirstName(String fName, String name) {

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
//-------------------------------- AAA db step one ---------------------------//
void editArtistInfos(String[] lines, String info_concours) {

  //---------------- editions --------------//

  info_concours = info_concours.substring(concours_fpart.length());

  String[] editions = split(info_concours, ','); //TODO sort editions if size > 1 AND REMOVE WHEN edition[i]==0
  editions = trim(editions);

  //---------------- fName & name --------------//

  String[] idt = editNameAndFirstName(lines[21], lines[20]);
  String fName = idt[0];
  String name = idt[1];

  //------------------ country ------------//

  String ctry = lines[26].substring(ctry_fpart.length());
  ctry = trim(ctry);

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
  else if (ctry.equals("Corée")) ctry = "Corée du Sud";

  //----------------------------------------//

  //println(fName, name, ctry, "             ", filename);
  //delay(200);

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
      //println(ctry);
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

      boolean before96= false;

      String str_editions="";

      for (String edition : editions) {

        if (parseInt(edition)<1995 && parseInt(edition)!=0) {
          before96=true;
          str_editions = join(editions, ", "); 
          break;
        }
      }

      if (before96) {
        println(fName, "-", name, str_editions);
        //println(fName, name, ctry, c_id);
      }
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

