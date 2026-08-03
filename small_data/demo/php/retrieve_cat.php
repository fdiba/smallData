<?php

	$cat=$_POST['cat'];
	// filtre pays optionnel (menu "Country" de catalog.php?id=1, Phono A)
	$country = isset($_POST['country']) ? intval($_POST['country']) : 0;

	if($cat==1 || $cat==2){
		retrieve_cat($cat, $country);
	} else if($cat==3){
		retrieve_euphonies();
	} else {
		retrieve_cat(0);
	}



	//-------------------------------- functions --------------------------------------//

	// Libelles des sous-categories (imeb_music.award_cat_2, code entier 1-12).
	// Les libelles sont ecrits en toutes lettres, tels que l'IMEB les a
	// formules lors de la restructuration de 2005 (Trivium / Quadrivium) :
	// la base ne stocke que le code, aucune modification de la bdd n'est
	// necessaire pour changer un libelle.
	// ATTENTION : la meme table existe cote client dans js/aww.js (page
	// award-winning_works.php, ou retrieve_works.php sert award_cat_2 brut).
	// Les deux doivent rester identiques.
	function set_sub_cat($sub_cat){

		switch ($sub_cat) {
			case 1:
				return "Avec dispositifs et/ou instruments";
				break;
			case 2:
				return "Esthétique formelle";
				break;
			case 3:
				return "Esthétique à programme";
				break;
			case 4:
				return "Danse ou théâtre";
				break;
			case 5:
				return "Installation ou environnement sonore et musical";
				break;
			case 6:
				return "Multimédia";
				break;
			case 7:
				return "Art sonore électroacoustique";
				break;
			case 8:
				return "Avec instruments";
				break;
			case 9:
				return "Sans instruments";
				break;
			case 10:
				return "tendance netart";
				break;
			case 11:
				return "tendance création";
				break;
			case 12:
				return "tendance performance";
				break;
			default:
				return $sub_cat;
				break;
		}

		
	}

	function set_price($price){

		switch ($price) {
			case 199:
				return "Prix";
				break;
			case 300:
				return "Prix CIME";
				break;
			case 302:
				return "1 et Prix CIME";
				break;
			default:
				return $price;
				break;
		}

		

		/*if(rank==100)rank="Mention";
        else if(rank==101)rank="Mention 1";
        else if(rank==102)rank="Mention 2";
        else if(rank==103)rank="Mention 3";
        else if(rank==197)rank="Nominé";
        else if(rank==198)rank="Finaliste";
        else if(rank==199)rank="Prix";
        else if(rank==200)rank="Prix CNM";
        else if(rank==201)rank="Grand Prix";
        
        else if(rank==296)rank="Pierre d'Or";
        else if(rank==297)rank="Pierre d'Argent";


        else if(rank==298)rank="Prix Bregman";
        else if(rank==299)rank="Prix FNME";
        else if(rank==300)rank="Prix CIME";
        else if(rank==301)rank="1, Prix CIME et Euphonies";
        else if(rank==302)rank="1 et Prix CIME";
        else if(rank==303)rank="Prix CIME et Mention";
        else if(rank==304)rank="Prix CIME et Mention 1";
        else if(rank==500)rank="Magistère";
        else if(rank==600)rank="Résidence";*/
	}

	function retrieve_euphonies(){

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		//---------------


		// L'ISNI identifie une PERSONNE, pas une oeuvre : il est donc lu sur
		// imeb_artist (colonne alimentee depuis data.bnf.fr, ~567 artistes) et
		// non plus sur imeb_music.isni, vestige des essais d'interconnexion de
		// 2017 qui ne portait que 28 valeurs. L'alias explicite "AS isni" garde
		// la cle $row['isni'] inchangee : rien d'autre ne bouge, ni ici ni dans
		// le flux envoye a js/euphonies.js (l'ISNI reste en arr[i+11]).
		$sth = $dbh->query('SELECT imeb_music.award_year, imeb_music.award_price,
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
		$rows= array();

		while($row = $sth->fetch()) {

			$euphonies=$row['euphonies'];

			if($euphonies>0){

				// L'ARK de la notice d'oeuvre n'est plus selectionne : il n'a
				// jamais ete affiche (les trois lignes ci-dessous dorment depuis
				// 2017) et le garder dans le SELECT aurait casse la page pendant
				// le renommage de la colonne. La colonne existe toujours, sous
				// le nom imeb_music.ark_oeuvre — a ne pas confondre avec
				// imeb_artist.ark_bnf, qui pointe une notice d'AUTORITE.
				// Pour la reveiller un jour : ajouter imeb_music.ark_oeuvre au
				// SELECT et decommenter.
				//$ark="";
				//if($row['ark_oeuvre'])$ark="ark:/".$row['ark_oeuvre'];

				// $ark=$row['ark_oeuvre'];
				$isni=$row['isni'];

				// $isni="0000000114444583";


				$award_year=$row['award_year'];
				$award_price=set_price($row['award_price']);

				$award_cat=$row['award_cat'];
				$award_sub_cat=set_sub_cat($row['award_cat_2']);

				$misam=$row['misam'];
				// if(!$misam)$misam=000000;

				$title=$row['title'];
				$duration=$row['duration'];
				
				$firstName=$row['firstName'];
				$name=$row['name'];

				$id=$row['id'];

				// 13e et dernier champ : le pays du compositeur, en anglais
				// (c_name_en, a defaut c_name), ajoute en fin d'enregistrement
				// pour ne decaler aucun index existant — l'ISNI reste en 11.
				// Chaine vide si l'artiste n'a pas de pays rattache.
				$ctry=$row['ctry'] ? $row['ctry'] : '';


				$year=-999;
				if($euphonies==1)$year=1992;
				else if($euphonies==2)$year=2004;
				else if($euphonies==3)$year=2010;

		

				array_push($rows, array($year, $award_year, $award_price, $misam, $firstName, $name, $title, $duration, $id, $award_cat, $award_sub_cat, $isni, $ctry));

			}

		}

		//--------- tri : edition (recente d'abord) puis nom de famille ---------//
		usort($rows, function($a, $b){
			if((int)$a[0] != (int)$b[0]) return (int)$b[0] - (int)$a[0];
			return strcasecmp($a[5], $b[5]);
		});

		foreach($rows as $row_fields){
			foreach($row_fields as $field) array_push($arr, $field);
		}

		//---------------

		$results="";
		if(sizeof($arr)>0){
			for($i=0; $i<sizeof($arr); $i++){
				
				//if($i<sizeof($arr)-1)$results.=$arr[$i].'%';
				if($i<sizeof($arr)-1)$results.=$arr[$i].'|';
				else $results.=$arr[$i];

			}
		}

		echo $results;


	}

	function retrieve_cat($cat, $country=0){

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		//---------------


		//--------- filtrage en SQL : seules les lignes utiles sont rapatriees ---------//
		$where = '';
		if($cat==1){ //International collection
			$where = ' WHERE imeb_music.misam > 0 AND imeb_music.misam < 200000';
		} else if($cat==2){ //IMEB collection
			$where = ' WHERE imeb_music.misam >= 200000';
		}
		// exclure les oeuvres marquees hors du repertoire (colonne statut)
		if($where !== '') $where .= ' AND imeb_music.statut <> \'hors_repertoire\'';
		// filtre pays : menu "Country" (Phono A id=1 ET Phono B id=2). intval() securise.
		if(($cat==1 || $cat==2) && $country>0) $where .= ' AND imeb_artist.id_country = ' . intval($country);

		// Le pays est lu sur imeb_country et servi en anglais, exactement comme
		// le menu "Country" de la page (php/retrieve_countries.php) : c_name_en,
		// a defaut c_name. LEFT JOIN et non INNER : un artiste sans pays
		// renseigne doit rester dans le tableau.
		$sth = $dbh->query('SELECT imeb_music.title, imeb_music.duration, imeb_music.misam,
							imeb_artist.firstName, imeb_artist.name, imeb_music.id,
							imeb_artist.id AS id_artist,
							COALESCE(NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name) AS ctry
							FROM imeb_music
							INNER JOIN imeb_artist
							ON imeb_music.id_artist = imeb_artist.id
							LEFT JOIN imeb_country
							ON imeb_artist.id_country = imeb_country.id'
							. $where . '
							ORDER BY imeb_artist.name ASC, imeb_artist.firstName ASC, imeb_artist.id ASC, imeb_music.title ASC');

		$arr= array();
		while($row = $sth->fetch()) {

			// 8e et dernier champ : le pays du compositeur, ajoute en FIN
			// d'enregistrement pour ne decaler aucun index existant. Chaine
			// vide si l'artiste n'a pas de pays rattache : js/catalog.js
			// n'ajoute alors aucune ligne sous le nom.
			// ATTENTION : la longueur d'enregistrement est passee en dur a
			// retrieveData() dans js/catalog.js (parametre numOfElements) ;
			// les deux doivent bouger ensemble.
			$ctry = $row['ctry'] ? $row['ctry'] : '';

			array_push($arr, $row['misam'], $row['firstName'], $row['name'],
						$row['id_artist'], $row['title'], $row['duration'], $row['id'],
						$ctry);

		}

		//---------------

		$results="";
		if(sizeof($arr)>0){
			for($i=0; $i<sizeof($arr); $i++){
				
				if($i<sizeof($arr)-1)$results.=$arr[$i].'%';
				else $results.=$arr[$i];

			}
		}


		//$result = $row['firstName'] . '%' . $row['name'] . '%' . $row['ctry']
		//			  . '%' . $str_editions;

		echo $results;

	}



?>