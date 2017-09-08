window.onload = function() {

	$cat = $.urlParam('id');

	if($cat==1 || $cat==2)retrieveData($cat);
	else retrieveData(-999);

};

function retrieveData($cat){

	$.ajax({                                      
        url: 'php/retrieve_cat.php',       
        type: "POST",
        data: {cat: $cat}

    }).done(function(str) {

        var arr=str.split("%");

        $("#listing").append('<ul></ul>');

        var numOfElements = 7;

        for (var i = 0; i < arr.length; i+=numOfElements) {

        	var li_class = "class=\"even\"";
        	if(i/numOfElements%2==0) li_class = "class=\"odd\"";

			var new_element = "<li " + li_class + " >" + arr[i] + " " + arr[i+1] + " " + arr[i+2]
			+ " " + arr[i+3] + " " + arr[i+4] + " " + arr[i+5] +  " " + arr[i+6] +  "</li>";
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
