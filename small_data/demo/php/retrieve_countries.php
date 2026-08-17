<?php

	require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

	$cat = isset($_POST['cat']) ? intval($_POST['cat']) : 1;
	$range = ($cat == 2)
		? 'imeb_music.misam >= 200000'
		: 'imeb_music.misam > 0 AND imeb_music.misam < 200000';

	$sth = $dbh->query('SELECT COALESCE(imeb_country.id, 0) AS id,
							   COALESCE(NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name, \'Unknown\') AS label,
							   COUNT(*) AS n,
							   COALESCE(imeb_country.iso3, \'\') AS iso3
						FROM imeb_music
						INNER JOIN imeb_artist  ON imeb_music.id_artist  = imeb_artist.id
						LEFT JOIN  imeb_country ON imeb_artist.id_country = imeb_country.id
						WHERE ' . $range . '
						  AND imeb_music.statut <> \'hors_repertoire\'
						GROUP BY imeb_country.id, imeb_country.c_name_en, imeb_country.c_name, imeb_country.iso3
						ORDER BY n DESC, imeb_country.c_name ASC');

	$arr = array();
	while($row = $sth->fetch()) {
		array_push($arr, $row['id'], $row['label'], $row['n'], $row['iso3']);
	}

	echo implode('%', $arr);
