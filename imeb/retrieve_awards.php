<?php

	/* Oeuvres primees generees depuis la base au lieu de data/smallData.csv.
	   Renvoie, pour chaque oeuvre primee, 6 champs separes par des % :
	       year % country % category % name % firstName % award
	   repetes, dans l'ordre chronologique (plus ancien d'abord). */

	require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

	//code numerique de prix -> libelle lisible (meme table que le reste de l'appli)
	function price_label($p){
		if($p === null) return '';
		switch((int)$p){
			case 1:   return '1';
			case 2:   return '2';
			case 3:   return '3';
			case 4:   return '4';
			case 100: return 'Mention';
			case 101: return 'Mention 1';
			case 102: return 'Mention 2';
			case 103: return 'Mention 3';
			case 197: return 'Nominé';
			case 198: return 'Finaliste';
			case 199: return 'Prix';
			case 200: return 'Prix CNM';
			case 201: return 'Grand Prix';
			case 296: return "Pierre d'Or";
			case 297: return "Pierre d'Argent";
			case 298: return 'Prix Bregman';
			case 299: return 'Prix FNME';
			case 300: return 'Prix CIME';
			case 301: return '1, Prix CIME et Euphonies';
			case 302: return '1 et Prix CIME';
			case 303: return 'Prix CIME et Mention';
			case 304: return 'Prix CIME et Mention 1';
			case 500: return 'Magistère';
			case 600: return 'Résidence';
			default:  return (string)((int)$p);
		}
	}

	$sth = $dbh->query('SELECT imeb_music.award_year, imeb_music.award_cat,
						imeb_music.award_price,
						imeb_artist.firstName, imeb_artist.name,
						imeb_country.c_name AS country
						FROM imeb_music
						INNER JOIN imeb_artist  ON imeb_music.id_artist = imeb_artist.id
						INNER JOIN imeb_country ON imeb_artist.id_country = imeb_country.id
						WHERE imeb_music.award_year IS NOT NULL
						ORDER BY imeb_music.award_year ASC,
						imeb_music.award_price ASC,
						imeb_artist.name ASC');

	$arr = array();

	while($row = $sth->fetch()) {

		$year     = $row['award_year'];
		$country  = ($row['country']  === null) ? '' : $row['country'];
		$category = ($row['award_cat'] === null) ? '' : $row['award_cat'];
		$name     = $row['name'];
		$fname    = $row['firstName'];
		$award    = price_label($row['award_price']);

		array_push($arr, $year, $country, $category, $name, $fname, $award);
	}

	echo implode('%', $arr);

?>
