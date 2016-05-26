class Console {

String message;  
  PVector loc;
  Console() {
    
    loc = new PVector(200, 30);
    
    message="SMA";
  }
  void update(String str) {
    message = str;
  }
  void display() {
    text(message, loc.x, loc.y);
  }
}

