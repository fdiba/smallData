<?php

	require_once(dirname(__FILE__) . '/provenance.php');

	retrieve_works();

function retrieve_works(){

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		$sth = $dbh->query('SELECT imeb_music.award_year, imeb_music.award_price,
							imeb_music.award_label, imeb_music.award_rank,
							imeb_music.award_label_2,
							COALESCE((SELECT c9.libelle FROM imeb_categorie c9
										WHERE c9.libelle = imeb_music.award_cat
										   OR c9.libelle_alt = imeb_music.award_cat
										LIMIT 1), imeb_music.award_cat) AS award_cat,
							cat.libelle AS award_cat_2, imeb_music.euphonies,
							imeb_music.title, imeb_music.duration, imeb_music.misam,
							imeb_artist.firstName, imeb_artist.name, imeb_music.id,
							imeb_artist.isni AS isni,
							COALESCE(NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name) AS ctry,
							co.coauteurs AS coauteurs,
							imeb_music.award_ordre AS award_ordre,
							imeb_music.editions AS editions,
							CASE
								WHEN imeb_music.annee_composition IS NULL THEN NULL
								WHEN imeb_music.annee_composition_fin IS NULL
								  OR imeb_music.annee_composition_fin = imeb_music.annee_composition
									THEN imeb_music.annee_composition
								ELSE CONCAT(imeb_music.annee_composition, \'-\',
											imeb_music.annee_composition_fin)
							END AS compose,
							\'concours\' AS evenement,
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
							LEFT JOIN (
								SELECT b2.id_music AS m_id,
									GROUP_CONCAT(CONCAT(
											TRIM(CONCAT(COALESCE(a2.firstName, \'\'), \' \', a2.name)),
											\'|\', COALESCE(a2.isni, \'\'))
										ORDER BY ba2.rang SEPARATOR \';\') AS coauteurs
								FROM imeb_bande b2
								INNER JOIN imeb_bande_artiste ba2
									ON ba2.id_bande = b2.id AND ba2.rang > 1
								INNER JOIN imeb_artist a2 ON a2.id = ba2.id_artist
								WHERE b2.id_music IS NOT NULL
								GROUP BY b2.id_music
							) co ON co.m_id = imeb_music.id
							LEFT JOIN imeb_categorie AS cat
							ON cat.id = imeb_music.id_categorie

							UNION ALL

							SELECT c.annee,
							CASE WHEN d.type = \'prix\'      THEN d.rang
								 WHEN d.type = \'finaliste\' THEN 198
								 WHEN d.type = \'nomine\'    THEN 197
								 ELSE 100 END,
							d.libelle,
							d.rang,
							NULL,
							NULL, catd.libelle, 0,
							b.titre_declare, NULL, NULL,
							a.firstName, a.name, -b.id,
							a.isni,
							COALESCE(NULLIF(pays.c_name_en, \'\'), pays.c_name),
							cod.coauteurs,
							NULL,
							NULL, NULL,
							COALESCE(catd.evenement, \'concours\'),
							CASE
								WHEN d.type = \'residence\'   THEN \'I\'
								WHEN d.type = \'magisterium\' THEN \'III\'
								WHEN c.annee >= 1988          THEN \'II\'
								ELSE NULL END
							FROM imeb_distinction d
							INNER JOIN imeb_bande b ON b.id = d.id_bande
							INNER JOIN imeb_pv p ON p.id = b.id_pv
							INNER JOIN imeb_concours c ON c.id = p.id_concours
							LEFT JOIN imeb_bande_artiste ba ON ba.id_bande = b.id AND ba.rang = 1
							LEFT JOIN imeb_artist a ON a.id = ba.id_artist
							LEFT JOIN imeb_country pays ON a.id_country = pays.id
							LEFT JOIN imeb_categorie catd ON catd.id = d.id_categorie
							LEFT JOIN (
								SELECT ba3.id_bande AS b_id,
									GROUP_CONCAT(CONCAT(
											TRIM(CONCAT(COALESCE(a3.firstName, \'\'), \' \', a3.name)),
											\'|\', COALESCE(a3.isni, \'\'))
										ORDER BY ba3.rang SEPARATOR \';\') AS coauteurs
								FROM imeb_bande_artiste ba3
								INNER JOIN imeb_artist a3 ON a3.id = ba3.id_artist
								WHERE ba3.rang > 1
								GROUP BY ba3.id_bande
							) cod ON cod.b_id = b.id
							WHERE d.type IN (\'prix\', \'mention\', \'magisterium\',
											 \'residence\', \'finaliste\', \'nomine\')
							AND NOT EXISTS (
								SELECT 1 FROM imeb_bande_artiste ba4
								INNER JOIN imeb_music m ON m.id_artist = ba4.id_artist
													AND m.award_year = c.annee
								WHERE ba4.id_bande = b.id)

							UNION ALL

							SELECT c.annee, n.rang,
							n.libelle,
							n.rang,
							NULL,
							NULL, cat.libelle, 0,
							\'not awarded\', NULL, NULL,
							NULL, NULL, -1000000 - n.id,
							NULL,
							NULL,
							NULL,
							NULL,
							NULL, NULL,
							COALESCE(cat.evenement, \'concours\'),
							CASE WHEN c.annee >= 1988 THEN \'II\' ELSE NULL END
							FROM imeb_non_attribution n
							INNER JOIN imeb_pv p2 ON p2.id = n.id_pv
							INNER JOIN imeb_concours c ON c.id = p2.id_concours
							LEFT JOIN imeb_categorie cat ON cat.id = n.id_categorie');

		list($conc, $fest) = provenanceTout($dbh);

		$arr= array();
		while($row = $sth->fetch()) {

			$award_year=$row['award_year'];
			$award_price=$row['award_price'];
			$award_cat=$row['award_cat'];

			$award_cat2=$row['award_cat_2'];

			$euphonies=$row['euphonies'];

			$misam=$row['misam'];
			$title=$row['title'];
			$duration=$row['duration'];

			$firstName=$row['firstName'];
			$name=$row['name'];

			$id=$row['id'];

			$ctry=$row['ctry'] ? $row['ctry'] : '';

			$isni=$row['isni'] ? $row['isni'] : '';

			$award_label  = $row['award_label']   !== null ? $row['award_label']   : '';
			$award_rank   = $row['award_rank']    !== null ? $row['award_rank']    : '';
			$award_label2 = $row['award_label_2'] !== null ? $row['award_label_2'] : '';

			$coauteurs = isset($row['coauteurs']) && $row['coauteurs'] !== null
						? $row['coauteurs'] : '';

			$award_ordre = $row['award_ordre'] !== null ? $row['award_ordre'] : '';

			$evenement = $row['evenement'] !== null ? $row['evenement'] : 'concours';

			$degre = $row['degre'] !== null ? $row['degre'] : '';

			if($award_year!=null){

				list($annees, $codes) = provenanceOeuvre((int)$id, $row['editions'],
														 $award_year, $conc, $fest);

				$compose = $row['compose'] !== null ? $row['compose'] : '';

				array_push($arr, $award_year, $award_price, $misam, $firstName, $name, $title, $duration, $id, $award_cat,
							$award_cat2, $ctry, $isni, $award_label, $award_rank, $award_label2,
							$coauteurs, $award_ordre, $evenement, $degre,
							$compose, $annees, $codes);

			}

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