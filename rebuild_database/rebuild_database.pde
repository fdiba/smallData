import java.nio.*;
import java.nio.file.*;

String mainTarget = "F:/IMEB/capsules";
IntList years;

void setup() {  

  years = new IntList();

  File dir = new File(mainTarget);
  String[] children = dir.list();
  if (children != null) processFolders(mainTarget, children);


  years.sort();
  for (Integer year : years) {
    println(year);
  }
  println(years.size());
}
void processMtdFile(String target, String[] elements, String folderName) {

  for (int i=0; i<elements.length; i++) {

    String filename = elements[i];

    if (filename.equals(folderName+".mtd")) {


      String lines[] = loadStrings(target+"/"+filename);
      //println("there are " + lines.length + " lines " + random(200));

      Node node = new Node();
      String info_concours = "";
      String str_first_part = "année-concours=";

      if (lines.length>40) {
        info_concours = lines[40];

        if (info_concours.length() > str_first_part.length()) {
          //info_concours.replace(", ", ",");

          info_concours = info_concours.substring(str_first_part.length());
          String[] list = split(info_concours, ',');
          list = trim(list);

          for (String str : list) {
            //println("     " + str);

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

          //println(info_concours);
        }
      }


      //delay(200);
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

