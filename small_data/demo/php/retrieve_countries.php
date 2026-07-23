<?php

	// Liste des pays de la Phonotheque A (International Sound Archives), avec le
	// nombre d'oeuvres rattachables, pour le menu "Country" de catalog.php?id=1.
	// Serialise en une chaine "id%nom%nombre%id%nom%nombre%..." (meme convention
	// de separateur "%" que retrieve_cat.php).
	//
	// Note : le INNER JOIN sur imeb_country ecarte les oeuvres dont le
	// compositeur n'a pas de pays valide (~32 oeuvres "(inconnu)") ; elles ne
	// sont pas rattachables a un pays et n'apparaissent donc pas au menu.

	require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

	// phonotheque : cat=2 -> Phono B (misam >= 200000), sinon Phono A.
	$cat = isset($_POST['cat']) ? intval($_POST['cat']) : 1;
	$range = ($cat == 2)
		? 'imeb_music.misam >= 200000'
		: 'imeb_music.misam > 0 AND imeb_music.misam < 200000';

	$sth = $dbh->query('SELECT imeb_country.id, imeb_country.c_name, COUNT(*) AS n
						FROM imeb_music
						INNER JOIN imeb_artist  ON imeb_music.id_artist  = imeb_artist.id
						INNER JOIN imeb_country ON imeb_artist.id_country = imeb_country.id
						WHERE ' . $range . '
						  AND imeb_music.statut <> \'hors_repertoire\'
						GROUP BY imeb_country.id, imeb_country.c_name
						ORDER BY n DESC, imeb_country.c_name ASC');

	$arr = array();
	while($row = $sth->fetch()) {
		array_push($arr, $row['id'], $row['c_name'], $row['n']);
	}

	echo implode('%', $arr);
