window.onload = function() {

    $.ajax({                                      
        url: 'php/retrieve_works.php',       
        type: "POST"
        //,
        //data: {cat: $cat}

    }).done(function(str) {

        var arr=str.split("%");

        $("#listing").append('<ul></ul>');

        var objects=[];
        var numOfElements = 9;

        for (var i = 0; i < arr.length; i+=numOfElements) {

            var year = arr[i];
            var rank = arr[i+1];
            var cat = arr[i+8];

            if(rank==100)rank="Mention";
            if(rank==101)rank="Mention 1";
            if(rank==102)rank="Mention 2";
            if(rank==103)rank="Mention 3";
            if(rank==200)rank="Prix CNM";
            if(rank==300)rank="Prix CIME";
            if(rank==301)rank="1, Prix CIME et Euphonies";
            if(rank==302)rank="1 et Prix CIME";
            if(rank==303)rank="Prix CIME et Mention";
            
            var obj = {year:year, rank:rank, misam:arr[i+2],
                       fn: arr[i+3], name: arr[i+4], title:arr[i+5], cat:cat};

            if(objects.length<1)objects.push(obj);
            else {

                for (var k = 0; k < objects.length; k++) {

                    if(obj.year >= objects[k].year){

                        objects.splice(k, 0, obj);
                        break;

                    }
                }
                
            }

        }

        for (var j = 0; j < objects.length; j++) {

            var li_class = "class=\"even\"";
            if(j%2==0) li_class = "class=\"odd\"";

            var new_element = "<li " + li_class + " >" + objects[j].year + " " + objects[j].cat + " " + objects[j].rank + " " + objects[j].misam
            + " " + objects[j].fn + " " + objects[j].name + " " + objects[j].title + "</li>";

            $("#listing ul").append(new_element);
        }

        $("#info").append("<p>" + arr.length/numOfElements + "</p>");

    });

	
};