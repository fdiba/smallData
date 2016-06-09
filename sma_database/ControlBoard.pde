class ControlBoard {

  PFont font;

  PVector loc;

  ControlBoard() {

    loc = new PVector(380, 50);

    font = createFont("CourierNewPSMT-14.vlw", 14);

    cp5.setAutoDraw(false);

    //Label.setUpperCaseDefault(false);
    //cp5.setFont(createFont("Arial", 12));

    cp5.addTextfield("input")
      .setPosition(loc.x, loc.y)
        .setSize(200, 20)
          //.setFont(font)
          .setFocus(true)
            .setId(4)
              .setColorLabel(color(0));
    //.setColor(color(255, 0, 0));

    cp5.addBang("R")
      .setPosition(loc.x+210, loc.y)
        .setSize(20, 20)
          .setId(4)
            .getCaptionLabel().align(ControlP5.CENTER, ControlP5.CENTER);    

    cp5.addScrollableList("composers")
      .setPosition(50, 100)
        .setSize(200, 100)
          .setBarHeight(20)
            .setItemHeight(20)
              .setType(ControlP5.LIST)
                .hide()
                  .setId(2);

    //cp5.get(ScrollableList.class, "composers").getValueLabel().toUpperCase(false);
    //cp5.get(ScrollableList.class, "composers").getCaptionLabel().toUpperCase(false);

    cp5.addScrollableList("playlist")
      .setPosition(loc.x, loc.y+96)
        .setSize(230, 100)
          .setBarHeight(20)
            .setItemHeight(20)
              .setType(ControlP5.LIST)
                .hide()
                  .setId(3);

    state0 = true;

    cp5.addToggle("state 0")
      .setPosition(loc.x, loc.y+36)
        .setSize(30, 14)
          .setId(0)
            .setValue(state0)
              .setColorLabel(color(0));

    // name, minValue, maxValue, defaultValue, x, y, width, height
    cpTS = 26;
    cp5.addSlider("composers TS", 0, 200, cpTS, (int)loc.x, (int)loc.y+66, 100, 14)
      .setId(1)
        .setColorLabel(color(0));
  }
  void updatePlaylist(Composer cp) {

    cp5.getController("playlist").show();

    cp5.get(ScrollableList.class, "playlist").clear();
    String str = cp.name + ' ' + cp.musics.size();
    cp5.get(ScrollableList.class, "playlist").setLabel(str);

    ArrayList<String> l = new ArrayList<String>();

    for (String[] info : cp.musics) {
      //String label = c.name + ' ' + c.fName + ' ' + c.musics.size();
      l.add(info[0]);
    }

    cp5.get(ScrollableList.class, "playlist").setItems(l);
  }
  void updateComposersList(Particle p) {

    if (sl_p != p)cp5.getController("playlist").hide();

    sl_p = p;

    cp5.get(ScrollableList.class, "composers").clear();
    String str = p.ctryCode + ' ' + p.composers.size();
    cp5.get(ScrollableList.class, "composers").setLabel(str);

    ArrayList<String> l = new ArrayList<String>();

    for (Composer c : p.composers) {
      String label = c.name + ' ' + c.fName + ' ' + c.musics.size();
      l.add(label);
    }

    cp5.get(ScrollableList.class, "composers").setItems(l);
  }
  void display() {

    cp5.draw();
  }
}
//-------------------------- P5 -----------------------------//
public void controlEvent(ControlEvent theEvent) {
  println("got a control event from controller with id " + theEvent.getId());
  switch(theEvent.getId()) {
    case(0):
    if (theEvent.getController().getValue()>0) {
      state0=true;
      //changeStateifNeededTo(0);
    } else {
      state0 = false;
    }
    state1 = !state0;

    if (state1)cp5.getController("composers").show();
    else {
      cp5.getController("composers").hide();
      cp5.get(ScrollableList.class, "composers").setLabel("composers").clear();
      cp5.getController("playlist").hide();
    }

    //println(state0);
    break;
    case(1):
    cpTS = (int)(theEvent.getController().getValue());
    break;
    case(2):
    println((int)theEvent.getController().getValue());
    if (!search) {//not manual search
      sl_cp = sl_p.composers.get((int)theEvent.getController().getValue());
      println(sl_cp.name, sl_cp.fName);
      board.updatePlaylist(sl_cp);
    } else {//TODO manual search - search titles
      
      
    }
    break;
    case(3):
    int music_id = (int)theEvent.getController().getValue();
    String str = sl_cp.musics.get(music_id)[0] + " | " + sl_cp.musics.get(music_id)[1] +
      " | " + sl_cp.musics.get(music_id)[2] + " | " + sl_cp.musics.get(music_id)[4]; //misam
    cs.update(str);
    println(sl_cp.musics.get(music_id));
    break;
    case(4):

    String expression = cp5.get(Textfield.class, "input").getText();
    if (!expression.equals("")) {

      search = true;

      changeStateifNeededTo(1);

      cp5.getController("playlist").hide();
      cp5.getController("composers").show();

      cp5.get(ScrollableList.class, "composers").clear();
      //TODO SPLIT STR WITH " "

      String request = "SELECT id, firstName, name FROM artist WHERE name LIKE '%" + expression + "%' OR firstName LIKE '%" + expression + "%'";
      println(request);
      msql.query(request);

      ArrayList<String> results = new ArrayList<String>();

      while (msql.next ()) {
        println(random(200));

        String id = msql.getString("id");
        String fName = msql.getString("firstName");
        String name = msql.getString("name");

        try {
          fName = new String(fName.getBytes("iso-8859-1"), "UTF-8");
          name = new String(name.getBytes("iso-8859-1"), "UTF-8");
          //country = new String(country.getBytes("iso-8859-1"), "UTF-8");
        } 
        catch (IOException ie) {
          println(ie);
        }

        String label = id + ' ' + fName + ' ' + name;
        results.add(label);
      }

      if (results.size()>0) {

        if (results.size()==1)cp5.get(ScrollableList.class, "composers").setLabel("result");
        else {
          String title = results.size() + " results"; 
          cp5.get(ScrollableList.class, "composers").setLabel(title);
        }

        cp5.get(ScrollableList.class, "composers").setItems(results);
      } else {

        cp5.get(ScrollableList.class, "composers").setLabel("no result");
      }
    }
    break;
  }
}

