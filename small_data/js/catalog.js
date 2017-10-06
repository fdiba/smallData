window.onload = function() {

	$cat = $.urlParam('id');

	if($cat==1 || $cat==2)retrieveData($cat, 7);
    else if($cat==3)retrieveData($cat, 11);
	else retrieveData(-999, 7);

};

function retrieveData(cat, numOfElements){

	$.ajax({                                      
        url: 'php/retrieve_cat.php',       
        type: "POST",
        data: {cat: cat}

    }).done(function(str) {

        var arr=str.split("%");

        $("#listing").append('<ul></ul>');

        for (var i = 0; i < arr.length; i+=numOfElements) {

        	var li_class = "class=\"even\"";
        	if(i/numOfElements%2==0) li_class = "class=\"odd\"";

            var elements = "";

            for (var j = 0; j < numOfElements; j++) {
                if(j==0) elements = arr[i];
                else elements += " "+ arr[i+j];
            }

			var new_element = "<li " + li_class + " >" + elements +  "</li>";

        	$("#listing ul").append(new_element);
        }

        $("#info").append("<p>" + arr.length/numOfElements + "</p>");

    });

}

$.urlParam = function(name){
	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	// return results[1] || 0;
	if(results)return results[1];
}
