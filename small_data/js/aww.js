window.onload = function() {

    $.ajax({                                      
        url: 'php/retrieve_works.php',       
        type: "POST"
        //,
        //data: {cat: $cat}

    }).done(function(str) {

        var arr=str.split("%");

        $("#listing").append('<ul></ul>');

        var numOfElements = 8;

        for (var i = 0; i < arr.length; i+=numOfElements) {

            var year = arr[i];
            var rank = arr[i+1];
            if(rank==100)rank="Mention";

            var li_class = "class=\"even\"";
            if(i/numOfElements%2==0) li_class = "class=\"odd\"";

            var new_element = "<li " + li_class + " >" + year + " " + rank + " " + arr[i+2]
            + " " + arr[i+3] + " " + arr[i+4] + " " + arr[i+5] +  "</li>";
            $("#listing ul").append(new_element);
        }

        $("#info").append("<p>" + arr.length/numOfElements + "</p>");

    });

	
};