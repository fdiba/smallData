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
		case "Belgium":
			return "BEL";
		case "Canada":
			return "CAN";
		case "France":
			return "FRA";
		case "Germany":
			return "DEU";
		case "Italy":
			return "ITA";
		case "Japan":
			return "JPN";
		case "Netherlands":
			return "NLD";
		case "Poland":
			return "POL";
		case "Spain":
			return "ESP";
		case "Sweden":
			return "SWE";
		case "United Kingdom":
			return "GBR";
		default:
			return ctry;
	}
}
function checkCountry(ctry){
	switch(ctry){
		case "Autriche":
			return "Austria";
		case "Brésil":
			return "Brazil";
		case "Pays-Bas":
			return "Netherlands";
		case "Slovaquie":
			return "Slovakia";
		case "Belgique":
			return "Belgium";
		case "Italie":
			return "Italy";
		case "Suède":
			return "Sweden";
		case "Allemagne":
			return "Germany";
		case "Pologne":
			return "Poland";
		case "Royaume-Uni":
			return "United Kingdom";
		case "Finlande":
			return "Finland";
		case "République tchèque":
			return "Czech Republic";
		case "Turquie":
			return "Turkey";
		case "Argentine":
			return "Argentina";
		case "Roumanie":
			return "Romania";
		case "Hongrie":
			return "Hungary";
		case "Chili":
			return "Chile";
		case "Serbie":
			return "Serbia";
		case "Japon":
			return "Japan";
		case "Espagne":
			return "Spain";
		case "Nouvelle-Zélande":
			return "New Zealand";
		case "Colombie":
			return "Colombia";
		case "Suisse":
			return "Swiss";
		case "Danemark":
			return "Denmark";
		case "Ecosse":
			return "Scotland";
		case "Slovénie":
			return "Slovenia";
		case "Bosnie-Herzégovine":
			return "Bosnia and Herzegovina";
		case "Malte":
			return "Malta";
		case "Hollande":
			return "Holland";
		case "Israël":
			return "Israel";
		case "Islande":
			return "Iceland";
		case "Afrique du Sud":
			return "South Africa";
		case "Irlande":
			return "Irland";
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