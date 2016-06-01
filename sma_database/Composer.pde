class Composer {
  
  int id;
  String name;
  String fName;
  String country;
  
  ArrayList<String[]> musics;

  Composer(int _id, String _fName, String _name, String _country, ArrayList<String[]> _musics) {
    
    id = _id;
    fName = _fName;
    name = _name;
    country = _country;
    
    musics = _musics;
    
  }
}

