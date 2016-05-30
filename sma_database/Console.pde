class Console {

String message;

  PVector loc;
  PFont font;
  
  Console(PVector _loc) {
    
    font = createFont("HelveticaNeue-Bold-18.vlw", 18);
    
    loc = _loc.get();
    
    message="SMA";
  }
  void update(String str) {
    message = str;
  }
  void display() {
    fill(0);
    textFont(font);
    text(message, loc.x, loc.y);
  }
}

