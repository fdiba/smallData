<?php

	retrieve_categories();

	function retrieve_categories(){

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		$sth = $dbh->query('SELECT imeb_music.award_year,
							imeb_music.award_cat,
							imeb_artist.name,
							imeb_artist.firstName,
							imeb_artist.isni,
							imeb_artist.id AS id_artist,
							imeb_music.editions,
							imeb_music.award_price,
							CASE
								WHEN imeb_music.award_cat = \'Résidence\'  THEN \'Degré I - Résidence\'
								WHEN imeb_music.award_cat = \'Magistère\'  THEN \'Degré III - Magistère\'
								WHEN imeb_music.award_year >= 1988         THEN \'Degré II\'
								ELSE NULL END AS cat_canon,
							COALESCE(cat.annee_debut,
								(SELECT d.annee_debut FROM imeb_categorie AS d
								 WHERE d.libelle = imeb_music.award_cat
								   AND imeb_music.award_price IN (500,600)
								 ORDER BY d.id ASC LIMIT 1)) AS cat_debut,
							COALESCE(cat.annee_fin,
								(SELECT d.annee_fin FROM imeb_categorie AS d
								 WHERE d.libelle = imeb_music.award_cat
								   AND imeb_music.award_price IN (500,600)
								 ORDER BY d.id ASC LIMIT 1)) AS cat_fin,
							cat.libelle AS sous_cat
							FROM imeb_music
							INNER JOIN imeb_artist
							ON imeb_music.id_artist = imeb_artist.id
							LEFT JOIN imeb_categorie AS cat
							ON cat.id = imeb_music.id_categorie
							WHERE imeb_music.award_year IS NOT NULL
							ORDER BY imeb_music.award_year ASC,
							imeb_music.award_price ASC,
							imeb_artist.name ASC');

		$arr = array();

		while($row = $sth->fetch()) {

			$year = $row['award_year'];

			$category = $row['cat_canon'];
			if($category === null || $category === '') $category = '';

			$name = $row['name'];

			$firstName = $row['firstName'] ? $row['firstName'] : '';
			$isni      = $row['isni'] ? $row['isni'] : '';

			$editions  = $row['editions'] ? $row['editions'] : '';

			$catDebut  = $row['cat_debut'] !== null ? $row['cat_debut'] : '';
			$catFin    = $row['cat_fin']   !== null ? $row['cat_fin']   : '';

			$sousCat   = $row['sous_cat'] !== null ? $row['sous_cat'] : '';

			$prix      = $row['award_price'] !== null ? $row['award_price'] : '';

			array_push($arr, $year, $category, $name, $firstName, $isni, $row['id_artist'], $editions, $catDebut, $catFin, $sousCat, $prix);
		}

		echo implode('%', $arr);
	}

?>
