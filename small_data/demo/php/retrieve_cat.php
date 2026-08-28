<?php

	require_once(dirname(__FILE__) . '/provenance.php');

	$cat=$_POST['cat'];

	$country = (isset($_POST['country']) && $_POST['country'] !== '') ? intval($_POST['country']) : null;

	if($cat==1 || $cat==2){
		retrieve_cat($cat, $country);
	} else if($cat==3){
		retrieve_euphonies();
	} else {
		retrieve_cat(0);
	}

	function set_price($price, $label = null, $rank = null, $label2 = null){

		$label  = $label  !== null ? trim($label)  : '';
		$rank   = $rank   !== null ? trim((string)$rank) : '';
		$label2 = $label2 !== null ? trim($label2) : '';

		if($label === '') return $price;

		$out = $rank !== '' ? $label . ' ' . $rank : $label;
		if($label2 !== '') $out .= ' et ' . $label2;

		return $out;

	}

	function retrieve_euphonies(){

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		$sth = $dbh->query('SELECT imeb_music.award_year, imeb_music.award_price,
							imeb_music.award_label, imeb_music.award_rank,
							imeb_music.award_label_2,
							imeb_music.award_cat, imeb_music.euphonies,
							imeb_music.editions,
							CASE
								WHEN imeb_music.annee_composition IS NULL THEN NULL
								WHEN imeb_music.annee_composition_fin IS NULL
								  OR imeb_music.annee_composition_fin = imeb_music.annee_composition
									THEN imeb_music.annee_composition
								ELSE CONCAT(imeb_music.annee_composition, \'-\',
											imeb_music.annee_composition_fin)
							END AS compose,
							imeb_music.title, imeb_music.duration, imeb_music.misam,
							imeb_artist.firstName, imeb_artist.name, imeb_music.id,
							imeb_artist.isni AS isni,
							COALESCE(NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name) AS ctry,
							imeb_artist.annee_naissance AS ne,
							imeb_artist.annee_deces AS mo,
							cat.libelle AS sous_cat,
							CASE
								WHEN imeb_music.award_cat = \'Résidence\' THEN \'I\'
								WHEN imeb_music.award_cat = \'Magistère\' THEN \'III\'
								WHEN imeb_music.award_year >= 1988        THEN \'II\'
								ELSE NULL END AS degre

							FROM imeb_music
							INNER JOIN imeb_artist
							ON imeb_music.id_artist = imeb_artist.id
							LEFT JOIN imeb_country
							ON imeb_artist.id_country = imeb_country.id
							LEFT JOIN imeb_categorie AS cat
							ON cat.id = imeb_music.id_categorie');

		list($conc, $fest, $deces) = provenanceTout($dbh);

		$arr= array();
		$rows= array();

		while($row = $sth->fetch()) {

			$euphonies=$row['euphonies'];

			if($euphonies>0){

				$isni=$row['isni'];

				$award_year=$row['award_year'];

				$award_price=set_price($row['award_price'], $row['award_label'],
									   $row['award_rank'], $row['award_label_2']);

				$award_cat=$row['award_cat'];

				$award_sub_cat=$row['sous_cat'] !== null ? $row['sous_cat'] : '';

				$degre = $row['degre'] !== null ? $row['degre'] : '';

				$misam=$row['misam'];

				$title=$row['title'];
				$duration=$row['duration'];

				$firstName=$row['firstName'];
				$name=$row['name'];

				$id=$row['id'];

				$ctry=$row['ctry'] ? $row['ctry'] : '';

				$year=-999;
				if($euphonies==1)$year=1992;
				else if($euphonies==2)$year=2004;
				else if($euphonies==3)$year=2010;

				list($annees, $codes) = provenanceOeuvre((int)$id, $row['editions'],
														 $row['award_year'], $conc, $fest, $deces);

				$compose = $row['compose'] !== null ? $row['compose'] : '';

				array_push($rows, array($year, $award_year, $award_price, $misam, $firstName, $name, $title, $duration, $id, $award_cat, $award_sub_cat, $isni, $ctry, $degre, $compose, $annees, $codes,
									($row['ne'] === null ? '' : $row['ne']),
									($row['mo'] === null ? '' : $row['mo'])));

			}

		}

		usort($rows, function($a, $b){
			if((int)$a[0] != (int)$b[0]) return (int)$b[0] - (int)$a[0];
			return strcasecmp($a[5], $b[5]);
		});

		foreach($rows as $row_fields){
			foreach($row_fields as $field) array_push($arr, $field);
		}

		$results="";
		if(sizeof($arr)>0){
			for($i=0; $i<sizeof($arr); $i++){

				if($i<sizeof($arr)-1)$results.=$arr[$i].'|';
				else $results.=$arr[$i];

			}
		}

		echo $results;

	}

	function retrieve_cat($cat, $country=null){

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		$where = '';
		$champ_misam = 'imeb_music.misam';

		if($cat==1 || $cat==2){

			$borne = ($cat==2)
				   ? 'imeb_music.misam >= 200000'
				   : 'imeb_music.misam > 0 AND imeb_music.misam < 200000';

			$fusion = '(SELECT f.misam FROM imeb_music_fusion f
						WHERE f.id_music = imeb_music.id AND f.serie = ' . intval($cat) . '
						  AND f.misam_repris = 0 AND f.statut_brut = \'repertoire\' LIMIT 1)';

			$where = ' WHERE ((' . $borne . ') OR ' . $fusion . ' IS NOT NULL)';
			$champ_misam = 'CASE WHEN ' . $borne . ' THEN imeb_music.misam ELSE ' . $fusion . ' END';
		}

		if($where !== '') $where .= ' AND imeb_music.statut <> \'hors_repertoire\'';

		$ordre = ' ORDER BY imeb_artist.name ASC, imeb_artist.firstName ASC, imeb_artist.id ASC, '
			   . 'imeb_music.annee_composition IS NULL ASC, '
			   . 'imeb_music.annee_composition DESC, imeb_music.annee_composition_fin DESC, '
			   . 'imeb_music.title ASC';

		if(($cat==1 || $cat==2) && $country !== null){
			$where .= ($country > 0)
					? ' AND imeb_artist.id_country = ' . intval($country)
					: ' AND imeb_artist.id_country IS NULL';
		}

		$sth = $dbh->query('SELECT imeb_music.title, imeb_music.duration, '
							. $champ_misam . ' AS misam,
							imeb_artist.firstName, imeb_artist.name, imeb_music.id,
							imeb_artist.id AS id_artist,
							imeb_artist.isni AS isni,
							imeb_artist.annee_naissance AS ne,
							imeb_artist.annee_deces AS mo,
							imeb_music.editions, imeb_music.award_year,
							CASE
								WHEN imeb_music.annee_composition IS NULL THEN NULL
								WHEN imeb_music.annee_composition_fin IS NULL
								  OR imeb_music.annee_composition_fin = imeb_music.annee_composition
									THEN imeb_music.annee_composition
								ELSE CONCAT(imeb_music.annee_composition, \'-\',
											imeb_music.annee_composition_fin)
							END AS compose,
							(SELECT GROUP_CONCAT(mf.annee ORDER BY mf.annee SEPARATOR \',\')
							   FROM imeb_music_festival mf
							  WHERE mf.id_music = imeb_music.id) AS festival,
							(SELECT GROUP_CONCAT(DISTINCT mc.annee ORDER BY mc.annee SEPARATOR \',\')
							   FROM imeb_music_concours mc
							  WHERE mc.id_music = imeb_music.id) AS concours,
							(SELECT CONCAT(
										UPPER(SUBSTRING(COALESCE(c.libelle, r.edition_brut), 1, 1)),
										SUBSTRING(COALESCE(c.libelle, r.edition_brut), 2))
							   FROM imeb_music_registre r
							   LEFT JOIN imeb_code_b1 c ON c.id = r.id_edition
							  WHERE r.id_music = imeb_music.id LIMIT 1) AS editeur,
							COALESCE(NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name) AS ctry
							FROM imeb_music
							INNER JOIN imeb_artist
							ON imeb_music.id_artist = imeb_artist.id
							LEFT JOIN imeb_country
							ON imeb_artist.id_country = imeb_country.id'
							. $where . $ordre);

		list($conc, $fest, $deces) = provenanceTout($dbh);

		$arr= array();
		while($row = $sth->fetch()) {

			$ctry = $row['ctry'] ? $row['ctry'] : '';

			$isni = $row['isni'] ? $row['isni'] : '';

			$editions = $row['editions'] ? $row['editions'] : '';

			$award = $row['award_year'] ? $row['award_year'] : '';

			$festival = $row['festival'] ? $row['festival'] : '';

			$concours = $row['concours'] ? $row['concours'] : '';

			$compose = $row['compose'] ? $row['compose'] : '';

			$editeur = $row['editeur'] ? $row['editeur'] : '';

			list($annees, $codes) = provenanceOeuvre((int)$row['id'], $row['editions'],
													 $row['award_year'], $conc, $fest, $deces);

			array_push($arr, $row['misam'], $row['firstName'], $row['name'],
						$row['id_artist'], $row['title'], $row['duration'], $row['id'],
						$ctry, $isni, $editions, $award, $festival, $compose, $editeur,
						$annees, $codes, $concours,
						($row['ne'] === null ? '' : $row['ne']),
						($row['mo'] === null ? '' : $row['mo']));

		}

		$results="";
		if(sizeof($arr)>0){
			for($i=0; $i<sizeof($arr); $i++){

				if($i<sizeof($arr)-1)$results.=$arr[$i].'%';
				else $results.=$arr[$i];

			}
		}

		echo $results;

	}

?>