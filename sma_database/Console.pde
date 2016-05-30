class Console {

String message;

  PVector loc;
  Console(PVector _loc) {
    
    loc = _loc.get();
    
    message="SMA";
  }
  void update(String str) {
    message = str;
  }
  void display() {
    text(message, loc.x, loc.y);
  }
}

