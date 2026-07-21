<?php

	/* Donnees du diagramme de flux (page Categories) generees depuis la base
	   au lieu du fichier data/smallData.csv.
	   Renvoie, pour chaque oeuvre primee, le triplet
	       annee % categorie % nom
	   separe par des %, dans l'ordre chronologique (plus ancien d'abord). */

	retrieve_categories();

	function retrieve_categories(){

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		//aucune entree utilisateur : requete simple
		$sth = $dbh->query('SELECT imeb_music.award_year,
							imeb_music.award_cat,
							imeb_artist.name
							FROM imeb_music
							INNER JOIN imeb_artist
							ON imeb_music.id_artist = imeb_artist.id
							WHERE imeb_music.award_year IS NOT NULL
							ORDER BY imeb_music.award_year ASC,
							imeb_music.award_price ASC,
							imeb_artist.name ASC');

		$arr = array();

		while($row = $sth->fetch()) {

			$year = $row['award_year'];

			$category = $row['award_cat'];
			if($category === null || $category === '') $category = 'None';

			$name = $row['name'];

			array_push($arr, $year, $category, $name);
		}

		echo implode('%', $arr);
	}

?>
