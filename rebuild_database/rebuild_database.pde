import java.nio.*;
import java.nio.file.*;

String mainTarget = "F:/IMEB/capsules";

void setup() {  

  File dir = new File(mainTarget);
  String[] children = dir.list();
  if (children != null) processFolders(mainTarget, children);
}
void processMtdFile(String target, String[] elements, String folderName) {
  
    for (int i=0; i<elements.length; i++) {
      
      String filename = elements[i];
      
      if(filename.equals(folderName+".mtd")){
        println("do something "+random(200));
        delay(200);
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

