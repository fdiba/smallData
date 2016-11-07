//----------- index and network ----------------//
function displayTitlesInfosGN(arr){

    $("#titles").empty();
    if(arr.length>0){
        for (var i=0; i<arr.length; i++) {
            var obj=arr[i];
            var div='<li>'+obj.t+" "+obj.d+" "+obj.m+" "+obj.ed+'</li>';
            $("#titles").append(div);
        }
    } else { //TO DO REMOVE THIS CASE
        var div='<li>no title</li>';
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
function getISO3(ctry){
	switch(ctry){
		case "Argentina":
			return "ARG";
		case "Australia":
			return "AUS";
		case "Austria":
			return "AUT";
		case "Belgium":
			return "BEL";
		case "Brazil":
			return "BRA";
		case "Bulgaria":
			return "BGR";
		case "Canada":
			return "CAN";
		case "Chile":
			return "CHL";
		case "China":
			return "CHN";
		case "Colombia":
			return "COL";
		case "Cuba":
			return "CUB";
		case "Czech Republic":
			return "CZE";
		case "Denmark":
			return "DNK";
		case "Finland":
			return "FIN";
		case "France":
			return "FRA";
		case "Germany":
			return "DEU";
		case "Greece":
			return "GRC";
		case "Hungary":
			return "HUN";
		case "Iceland":
			return "ISL";
		case "Ireland":
			return "IRL";
		case "Israel":
			return "ISR";
		case "Italy":
			return "ITA";
		case "Japan":
			return "JPN";
		case "Mexico":
			return "MEX";
		case "Netherlands":
			return "NLD";
		case "New Zealand":
			return "NZL";
		case "Norway":
			return "NOR";
		case "Poland":
			return "POL";
		case "Portugal":
			return "PRT";
		case "Romania":
			return "ROU";
		case "Russia":
			return "RUS";
		case "Serbia":
			return "SRB";
		case "Slovakia":
			return "SVK";
		case "Slovenia":
			return "SVN";
		case "South Korea":
			return "KOR";
		case "Spain":
			return "ESP";
		case "Sweden":
			return "SWE";
		case "Switzerland":
			return "CHE";
		case "Taiwan":
			return "TWN";
		case "United Kingdom":
			return "GBR";
		case "Uruguay":
			return "URY";
		case "Venezuela":
			return "VEN";
		default:
			return ctry;
	}
}
function checkCountry(ctry){
	switch(ctry){
		case "Allemagne":
			return "Germany";
		case "Argentine":
			return "Argentina";
		case "Autriche":
			return "Austria";
		case "Belgique":
			return "Belgium";
		case "Brésil":
			return "Brazil";
		case "Chili":
			return "Chile";
		case "Colombie":
			return "Colombia";
		case "Danemark":
			return "Denmark";
		case "Ecosse":
			return "Scotland";
		case "Espagne":
			return "Spain";
		case "Finlande":
			return "Finland";
		case "Hollande": //Pays-Bas
			return "Netherlands";
		case "Hongrie":
			return "Hungary";
		case "Islande":
			return "Iceland";
		case "Israël":
			return "Israel";
		case "Italie":
			return "Italy";
		case "Japon":
			return "Japan";
		case "Nouvelle-Zélande":
			return "New Zealand";
		case "Pays-Bas":
			return "Netherlands";
		case "Pologne":
			return "Poland";
		case "République tchèque":
			return "Czech Republic";
		case "Roumanie":
			return "Romania";
		case "Royaume-Uni":
			return "United Kingdom";
		case "Serbie":
			return "Serbia";
		case "Slovaquie":
			return "Slovakia";
		case "Suède":
			return "Sweden";
		case "Suisse":
			return "Switzerland";
		case "Taïwan":
			return "Taiwan";
		case "Turquie":
			return "Turkey";
		
	
		
		
		
		case "Slovénie":
			return "Slovenia";
		case "Bosnie-Herzégovine":
			return "Bosnia and Herzegovina";
		case "Malte":
			return "Malta";


		case "Afrique du Sud":
			return "South Africa";
		case "Irlande":
			return "Ireland";
		case "Mexique":
			return "Mexico";
		case "Corée du Sud":
			return "South Korea";
		case "Chine":
			return "China";
		case "Australie":
			return "Australia";
		case "Grèce":
			return "Greece";
		case "Norvège":
			return "Norway";
		case "Monténégro":
			return "Montenegro";
		case "Porto Rico":
			return "Puerto Rico";
		case "Nicaragua":
			return "Nicaragua";
		case "Algérie":
			return "Algeria";
		case "Russie":
			return "Russia";
		case "Croatie":
			return "Croatia";
		case "Bulgarie":
			return "Bulgaria";
		case "Pérou":
			return "Peru";
		case "Bolivie":
			return "Bolivia";
		case "Moldavie":
			return "Moldova";
		case "Malaisie":
			return "Malaysia";
		case "Syrie":
			return "Syria";
		case "Lettonie":
			return "Latvia";
		case "Macédoine":
			return "Macedonia";
		default:
			return ctry;
	}
}