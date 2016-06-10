class Console {

  String message;
  String stat;

  PVector loc;
  PVector loc2;
  
  PFont font;
  PFont font2;
  
  StringBuilder sb;

  Console(PVector _loc, PVector _loc2) {
    
    sb = new StringBuilder();

    font = createFont("HelveticaNeue-Bold-18.vlw", 18);
    font2 = createFont("Gadugi-12.vlw", 12);

    loc = _loc.get();
    loc2 = _loc2.get();

    message="SMA";
    stat = "";
  }
  void update(String str) {
    message = str;
  }
  void updateStats(String str) {
    stat = str;
  }
  void display() {
    fill(0);
    textFont(font);
    text(message, loc.x, loc.y);
    textFont(font2);
    text(stat, loc2.x, loc2.y);
  }
}

