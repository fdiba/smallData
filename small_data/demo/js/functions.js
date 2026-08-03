//----------- index and network ----------------//
function displayTitlesInfosGN(arr){

    $("#titles").empty();
    if(arr.length>0){
        // en-tete non italique, "work" au singulier si une seule oeuvre, suivi
        // de ":" puisque la liste des titres vient juste apres
        $("#titles").append('<span>'+arr.length+' archived work'+(arr.length>1 ? 's' : '')+':</span>');
        for (var i=0; i<arr.length; i++) {
            var obj=arr[i];
            var div='<li class="'+(i%2===0 ? 't-a' : 't-b')+'">'+obj.t;
            if(obj.d) div += ' ('+obj.d+')';
            if(obj.ed){
                var edCount = (''+obj.ed).split(',').length;
                div += ' | ' + (edCount === 1 ? 'edition' : 'editions') + ': ' + obj.ed;
            }
            div += '</li>';
            $("#titles").append(div);
        }
    } else {
        var div='<li>no archived work for this composer</li>';
        $("#titles").append(div);
    }

}

//----------- only network ----------------//
function displayFirstnameAndNameGN(obj){
    $("#selection").empty().append('<p>');
    var txt=obj.fn+' '+obj.n;
    $("#selection p").text(txt);
}
//----------------------------------------------//
function dist(x1, x2, y1, y2){
	var a = x1 - x2;
	var b = y1 - y2;
	var c = Math.sqrt(a*a + b*b);
	return c;
}
function map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}
