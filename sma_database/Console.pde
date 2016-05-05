class Console {

String message;  
  PVector loc;
  Console() {
    
    loc = new PVector(width-200, 20);
    
    message="SMA";
  }
  void update(String str) {
    message = str;
  }
  void display() {
    text(message, loc.x, loc.y);
  }
}

