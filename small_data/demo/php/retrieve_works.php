<?php

	retrieve_works();

	//-------------------------------- functions --------------------------------------//

	function retrieve_works(){

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		//---------------


		// Le pays est lu sur imeb_country (LEFT JOIN : un artiste sans pays
		// renseigne doit rester dans le tableau) et servi en anglais, comme le
		// menu "Country" des pages catalogue : c_name_en, a defaut c_name.
		//
		// L'ISNI identifie une PERSONNE, pas une oeuvre : il est donc lu sur
		// imeb_artist (colonne alimentee depuis data.bnf.fr) et non sur
		// imeb_music.isni, vestige des essais d'interconnexion de 2017. Meme
		// source que la page euphonies (php/retrieve_cat.php).
		// award_label / award_rank / award_label_2 : les distinctions EN CLAIR,
		// depuis le 2026-08-04. `award_price` reste lu pour memoire mais
		// l'interface ne le decode plus — le code-book vivait en double dans
		// js/aww.js et php/retrieve_cat.php, dont une copie ne traduisait que
		// trois valeurs sur vingt-trois. Il est desormais dans la DONNEE.
		$sth = $dbh->query('SELECT imeb_music.award_year, imeb_music.award_price,
							imeb_music.award_label, imeb_music.award_rank,
							imeb_music.award_label_2,
							imeb_music.award_cat, imeb_music.award_cat_2, imeb_music.euphonies,
							imeb_music.title, imeb_music.duration, imeb_music.misam,
							imeb_artist.firstName, imeb_artist.name, imeb_music.id,
							imeb_artist.isni AS isni,
							COALESCE(NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name) AS ctry
							FROM imeb_music
							INNER JOIN imeb_artist
							ON imeb_music.id_artist = imeb_artist.id
							LEFT JOIN imeb_country
							ON imeb_artist.id_country = imeb_country.id');

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

			// 11e champ : le pays du compositeur. Chaine vide si l'artiste
			// n'a pas de pays rattache.
			$ctry=$row['ctry'] ? $row['ctry'] : '';

			// 12e et dernier champ : l'ISNI du compositeur, ajoute en fin
			// d'enregistrement pour ne decaler aucun index existant. Chaine
			// vide pour la majorite des artistes (la colonne n'est renseignee
			// que pour ceux alignes sur data.bnf.fr) : js/aww.js n'affiche le
			// lien que si la valeur ressemble a un ISNI.
			// ATTENTION : le separateur d'enregistrements est '%' ici (et non
			// '|' comme dans retrieve_cat.php) ; toute modification de la
			// longueur d'enregistrement doit etre repercutee sur
			// numOfElements dans js/aww.js.
			$isni=$row['isni'] ? $row['isni'] : '';

			// 13e, 14e et 15e champs : la distinction en clair. AJOUTES EN FIN
			// d'enregistrement, comme toujours — numOfElements passe de 12 a 15
			// dans js/aww.js, seul consommateur de ce flux.
			$award_label  = $row['award_label']   !== null ? $row['award_label']   : '';
			$award_rank   = $row['award_rank']    !== null ? $row['award_rank']    : '';
			$award_label2 = $row['award_label_2'] !== null ? $row['award_label_2'] : '';

			if($award_year!=null){

				array_push($arr, $award_year, $award_price, $misam, $firstName, $name, $title, $duration, $id, $award_cat,
							$award_cat2, $ctry, $isni, $award_label, $award_rank, $award_label2);

				/*if($euphonies>0){

					$year=-999;
					if($euphonies==1)$year=1992;
					else if($euphonies==2)$year=2004;

					array_push($arr, $year, "Euphonie", $misam, $firstName, $name, $title, $duration, $id, "Euphonie", $award_cat2);
				}*/
			}

		}

		//---------------

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