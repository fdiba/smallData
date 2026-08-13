<?php

	// Liste des pays de la Phonotheque A (International Sound Archives), avec le
	// nombre d'oeuvres rattachables, pour le menu "Country" de catalog.php?id=1.
	// Serialise en une chaine "id%nom%nombre%id%nom%nombre%..." (meme convention
	// de separateur "%" que retrieve_cat.php).
	//
	// Le libelle renvoye est imeb_country.c_name_en (interface en anglais), avec
	// repli sur c_name si la colonne anglaise est vide. L'ordre du menu reste
	// celui d'origine (nombre d'oeuvres decroissant, c_name en departage des
	// ex aequo) : seul le libelle affiche change, pas la sequence.
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

	/* QUATRE CHAMPS PAR PAYS DEPUIS LE 2026-08-12, ET NON TROIS.
	   `iso3` est ajoute pour que catalog.php accepte `?ctry=FRA` dans la barre
	   d'adresse. Il vient de `imeb_country.iso3` — une colonne du referentiel,
	   pas une valeur saisie.
	   LE PAS DE LECTURE DOIT SUIVRE : js/catalog.js lit ce flux par pas de
	      QUATRE. Un pas reste a trois decalerait la lecture des le deuxieme
	      pays, silencieusement, avec des noms qui deviendraient des comptes.
	      C'est le defaut deja paye sur le `case 0` de retrieve_data.php, ou le
	      pas est passe de 4 a 5 puis a 6. **js/catalog.js est le SEUL
	      consommateur de ce flux** — verifie le 2026-08-12 sur tout demo/. */
	$sth = $dbh->query('SELECT imeb_country.id,
							   COALESCE(NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name) AS label,
							   COUNT(*) AS n,
							   COALESCE(imeb_country.iso3, \'\') AS iso3
						FROM imeb_music
						INNER JOIN imeb_artist  ON imeb_music.id_artist  = imeb_artist.id
						INNER JOIN imeb_country ON imeb_artist.id_country = imeb_country.id
						WHERE ' . $range . '
						  AND imeb_music.statut <> \'hors_repertoire\'
						GROUP BY imeb_country.id, imeb_country.c_name_en, imeb_country.c_name, imeb_country.iso3
						ORDER BY n DESC, imeb_country.c_name ASC');

	$arr = array();
	while($row = $sth->fetch()) {
		array_push($arr, $row['id'], $row['label'], $row['n'], $row['iso3']);
	}

	echo implode('%', $arr);
