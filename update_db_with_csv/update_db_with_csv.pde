import de.bezier.data.sql.*;
MySQL msql;

Table table;

int r_count;

void setup() {


  //------------------ database ------------------//
  String lines[] = loadStrings("access.txt");
  String user = lines[0];
  String pass = "";

  msql = new MySQL( this, "localhost", "imeb", user, pass );

  if (msql.connect()) {
    msql.query( "SELECT COUNT(*) FROM artist" );
    msql.next();
    println("number of rows: " + msql.getInt(1));
  } else {
    println("connection failed!");
  }

  //----------------------------------------------//

  table = loadTable("smallData_IMEB.csv", "header");

  println(table.getRowCount() + " total rows in table"); 

  for (TableRow row : table.rows ()) {

    int year = row.getInt("year");
    //String species = row.getString("species");
    String fName = row.getString("firstName");
    String title = row.getString("title");


    String category = row.getString("category");



    //---------------- name & fName --------------//

    String name = getName(row.getString("name"));



    //------------------- encode --------------//
    try {
      name = new String(name.getBytes("UTF-8"), "iso-8859-1");
      fName = new String(fName.getBytes("UTF-8"), "iso-8859-1");
      title = new String(title.getBytes("UTF-8"), "iso-8859-1");
    } 
    catch (IOException ie) {
      println(ie);
    }

    //println(fName, name, title);


    //---------------- request --------------//

    String request = "SELECT id FROM artist WHERE name =\"" + 
      name + "\" and firstName =\"" + fName + "\""; 

    msql.query(request);

    if (!msql.next ()) { //artist not already present
      //println("artist not already present");
      r_count++;

      /*if (category.equals("R")) { //pas présent dans les capsules
       println(year, fName, name, " - ", title);
       }*/
    } else {

      int artist_id = msql.getInt("id");

      tryToFindTitleInMusic(artist_id, fName, name, title, year);

      if (category.equals("R")) { //pas présent dans les capsules
        //println(year, fName, name, " - ", title);
      }
    }
  }

  println(r_count);
}

void tryToFindTitleInMusic(int id_artist, String fName, String name, String title, int year) {

  String request = "SELECT id, editions FROM music WHERE title = \"" + 
    title + "\" and id_artist = " + id_artist;

  msql.query(request);


  if (!msql.next ()) { //title not already present
    //println("title not already present");
  } else {
    
    int music_id = msql.getInt("id");
    String editions = msql.getString("editions");
    
    request = "UPDATE music SET residence = " + year + " WHERE id =" + music_id; 

    msql.query(request); //-----------------------------------------------------------------------> 1/1
    //println(misam);
    
    //println(name, fName, '-', title, year, "VS", editions);
  }
}

String getName(String str) { //check rebuild sketch

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

