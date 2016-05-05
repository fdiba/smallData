class Console {

String message;  
  PVector loc;
  Console() {
    
    loc = new PVector(200, 40);
  }
  void update() {
  }
  void display() {
    text(message, loc.x, loc.y);
  }
}

