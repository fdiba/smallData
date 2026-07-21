<?php

	/* Donnees du diagramme de flux (annee -> categorie) generees depuis la
	   base au lieu du fichier ../data/smallData.csv.
	   Renvoie, pour chaque oeuvre primee, le couple annee % categorie,
	   dans l'ordre chronologique (plus ancien d'abord). */

	require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

	$sth = $dbh->query('SELECT award_year, award_cat
						FROM imeb_music
						WHERE award_year IS NOT NULL
						ORDER BY award_year ASC, award_price ASC');

	$arr = array();

	while($row = $sth->fetch()) {
		$year = $row['award_year'];
		$cat  = $row['award_cat'];
		if($cat === null || $cat === '') $cat = 'Inconnue';
		array_push($arr, $year, $cat);
	}

	echo implode('%', $arr);

?>
