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
        var numOfElements = 10;

        for (var i = 0; i < arr.length-(numOfElements-1); i+=numOfElements) {

            var year = arr[i];
            var rank = arr[i+1];
            var cat = arr[i+8];
            var cat2 = arr[i+9];

            if(rank==100)rank="Mention";
            else if(rank==101)rank="Mention 1";
            else if(rank==102)rank="Mention 2";
            else if(rank==103)rank="Mention 3";
            else if(rank==197)rank="Nominé";
            else if(rank==198)rank="Finaliste";
            else if(rank==199)rank="Prix";
            else if(rank==200)rank="Prix CNM";
            else if(rank==201)rank="Grand Prix";
            
            else if(rank==296)rank="Pierre d'Or";
            else if(rank==297)rank="Pierre d'Argent";


            else if(rank==298)rank="Prix Bregman";
            else if(rank==299)rank="Prix FNME";
            else if(rank==300)rank="Prix CIME";
            else if(rank==301)rank="1, Prix CIME et Euphonies";
            else if(rank==302)rank="1 et Prix CIME";
            else if(rank==303)rank="Prix CIME et Mention";
            else if(rank==304)rank="Prix CIME et Mention 1";
            else if(rank==500)rank="Magistère";
            else if(rank==600)rank="Résidence";


            if(cat2==1)cat2="Dispositif et instru.";
            else if(cat2==2)cat2="Esthétique formelle";
            else if(cat2==3)cat2="Esthétique program.";
            else if(cat2==4)cat2="Danse ou théâtre";
            else if(cat2==5)cat2="Installation ou environ.";
            else if(cat2==6)cat2="Multimédia";

            else if(cat2==7)cat2="Art sonore électroa.";
            else if(cat2==8)cat2="Avec instruments";
            else if(cat2==9)cat2="Sans instruments";

            else if(cat2==10)cat2="tendance netart";
            else if(cat2==11)cat2="tendance création";
            else if(cat2==12)cat2="tendance performance";
            
            
            
            
            var obj = {year:year, rank:rank, misam:arr[i+2],
                       fn: arr[i+3], name: arr[i+4], title:arr[i+5], cat:cat, cat2:cat2};

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

            var new_element = "<li " + li_class + " >" + objects[j].year
            + " " + objects[j].cat + " " + objects[j].cat2
            + " " + objects[j].rank + " " + objects[j].misam
            + " " + objects[j].fn + " " + objects[j].name + " " + objects[j].title + "</li>";

            $("#listing ul").append(new_element);
        }

        $("#info").append("<p>" + arr.length/numOfElements + "</p>");

    });

	
};