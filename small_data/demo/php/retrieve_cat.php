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

	// LE CODE-BOOK DES SOUS-CATEGORIES A ETE SUPPRIME LE 2026-08-13.
	//
	// `set_sub_cat()` traduisait `imeb_music.award_cat_2`, un code entier de 1 a
	// 12 sans table, par un tableau ecrit ici. CE TABLEAU EXISTAIT EN TROIS
	// EXEMPLAIRES — ici, dans php/sous_categories.php et dans js/aww.js —, et
	// les trois portaient deja la note « les deux doivent rester identiques »,
	// qui est l'aveu du probleme et non sa solution.
	//
	// IL N'Y A PAS DE SOUS-CATEGORIE DANS LE CONCOURS : il y a des DEGRES et des
	// CATEGORIES. Le constat de 1990 l'ecrit en toutes lettres — une LETTRE pour
	// le degre, un CHIFFRE pour la categorie. `award_cat_2` EST la categorie, et
	// depuis le 2026-08-13 elle est une ligne de `imeb_categorie`, pointee par
	// `imeb_music`.`id_categorie`. La colonne `award_cat_2` sera supprimee.
	//
	// LE FLUX ENVOYE A js/euphonies.js EST INCHANGE, ET C'EST MESURE : le
	// libelle servi est le meme, enregistrement par enregistrement.

	function set_price($price, $label = null, $rank = null, $label2 = null){

		$label  = $label  !== null ? trim($label)  : '';
		$rank   = $rank   !== null ? trim((string)$rank) : '';
		$label2 = $label2 !== null ? trim($label2) : '';

		if($label === '') return $price;          // base non migree

		$out = $rank !== '' ? $label . ' ' . $rank : $label;
		if($label2 !== '') $out .= ' et ' . $label2;

		return $out;

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
							imeb_music.award_label, imeb_music.award_rank,
							imeb_music.award_label_2,
							imeb_music.award_cat, imeb_music.euphonies,
							imeb_music.title, imeb_music.duration, imeb_music.misam,
							imeb_artist.firstName, imeb_artist.name, imeb_music.id,
							imeb_artist.isni AS isni,
							COALESCE(NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name) AS ctry,
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
				// Le 3e champ du flux a TOUJOURS porte un libelle, jamais un
				// code : la longueur d'enregistrement ne change donc pas, et
				// js/euphonies.js n'a rien a modifier.
				$award_price=set_price($row['award_price'], $row['award_label'],
									   $row['award_rank'], $row['award_label_2']);

				$award_cat=$row['award_cat'];
				// LA CATEGORIE, DEPUIS LA TABLE — 2026-08-13. Elle venait de
				// set_sub_cat($row['award_cat_2']), supprimee en tete de
				// fichier. La condition `deg.id <> cat.id` de la jointure rend
				// exactement ce que le code-book rendait, SANS ecrire d'annee :
				// de 1977 a 1999 `award_cat` EST la categorie, et ce champ
				// repeterait alors le precedent. *La categorie ne se repete pas
				// quand elle est deja dite.*
				$award_sub_cat=$row['sous_cat'] !== null ? $row['sous_cat'] : '';

				/* LE DEGRE, QUATORZIEME ET DERNIER CHAMP — 2026-08-13.

				   « I », « II » ou « III », vide avant 1988 : les degres
				   naissent cette annee-la. Il prend, dans le tableau, la place
				   que tenait « category » (`award_cat`), et la CATEGORIE prend
				   celle de « sub category ». Le concours a des DEGRES et des
				   CATEGORIES ; il n'a pas de sous-categorie.

				   ET LA CONDITION `deg.id <> cat.id` A DISPARU AVEC LA
				      JOINTURE QUI LA PORTAIT. Elle taisait la categorie de
				      1977 a 1999, ou `award_cat` la disait deja — mais
				      `award_cat` ne s'affiche plus, et la taire laisserait la
				      colonne vide sur vingt-trois editions. La jointure avait
				      de plus un defaut propre : deux lignes de
				      `imeb_categorie` portent le libelle « Multimedia », et
				      les oeuvres de 1999 qui le portent tombaient sur les
				      deux — un enregistrement DEDOUBLE, en silence.

				   ATTENTION : numOfElements passe de 13 a 14 dans
				      js/euphonies.js, seul consommateur de ce flux. */
				$degre = $row['degre'] !== null ? $row['degre'] : '';

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

		

				array_push($rows, array($year, $award_year, $award_price, $misam, $firstName, $name, $title, $duration, $id, $award_cat, $award_sub_cat, $isni, $ctry, $degre));

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
		//
		// L'ISNI identifie une PERSONNE, pas une oeuvre : il est donc lu sur
		// imeb_artist (colonne alimentee depuis data.bnf.fr) et non sur
		// imeb_music.isni, vestige des essais d'interconnexion de 2017. Meme
		// source que retrieve_euphonies() ci-dessus et que retrieve_works.php.
		//
		// imeb_music.editions : annee(s) ou l'oeuvre a ete PROGRAMMEE dans une
		// edition de l'IMEB (1973-2009), separees par des virgules. A ne pas
		// confondre avec award_year : le concours se tenait a l'interieur du
		// festival, donc l'annee de concours figure parmi ces annees (verifie
		// sur 484 des 491 oeuvres primees dont editions est renseigne). Une
		// oeuvre reprogrammee porte plusieurs annees (jusqu'a cinq).
		// imeb_music.award_year ne sert ici qu'a marquer les oeuvres primees
		// d'un signe a cote du titre : le detail du palmares reste l'affaire de
		// award-winning_works.php.
		// `cat.libelle AS sous_cat` A ETE AJOUTE ICI PAR ERREUR LE 2026-08-13,
		// ET RETIRE LE MEME JOUR.
		//
		// CETTE REQUETE N'A PAS DE TABLE `cat`. La colonne a ete posee en meme
		// temps que dans retrieve_euphonies() ci-dessus, ou la jointure
		// `LEFT JOIN imeb_categorie AS cat` existe ; ici elle n'a jamais
		// existe. MySQL rendait donc ERROR 1054, Unknown column
		// 'cat.libelle in field list'. La requete echouait ENTIEREMENT :
		// $dbh->query rendait false, la page ne recevait aucun enregistrement,
		// et le SMA du catalogue restait vide. Signale par Florent.
		//
		// ET LA COLONNE NE SERVAIT A RIEN : cette branche pousse ONZE champs —
		// misam, prenom, nom, id_artist, titre, duree, id, pays, isni,
		// editions, annee de prix — et `sous_cat` n'etait dans aucun. La page
		// Catalogue n'affiche ni categorie ni degre, et son attrOfInterest est
		// ['name', 'duration', 'title'].
		//
		// *Une colonne ajoutee dans une requete qui ne la sert pas ne dort pas :
		// elle casse la requete.* La lecon est celle du banc — le SQL se joue
		// avant d'etre livre, et CETTE requete-la ne l'avait pas ete, parce que
		// je n'avais mesure que la branche que je croyais toucher.
		$sth = $dbh->query('SELECT imeb_music.title, imeb_music.duration, imeb_music.misam,
							imeb_artist.firstName, imeb_artist.name, imeb_music.id,
							imeb_artist.id AS id_artist,
							imeb_artist.isni AS isni,
							imeb_music.editions, imeb_music.award_year,
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

			// 8e champ : le pays du compositeur, ajoute en fin d'enregistrement
			// pour ne decaler aucun index existant. Chaine vide si l'artiste
			// n'a pas de pays rattache : js/catalog.js n'ajoute alors aucune
			// ligne sous le nom.
			$ctry = $row['ctry'] ? $row['ctry'] : '';

			// 9e champ : l'ISNI du compositeur, lui aussi ajoute en
			// FIN d'enregistrement. Chaine vide pour la majorite des artistes
			// (la colonne n'est renseignee que pour ceux alignes sur
			// data.bnf.fr) : la boite violette n'affiche alors rien.
			// ATTENTION : la longueur d'enregistrement est passee en dur a
			// retrieveData() dans js/catalog.js (parametre numOfElements) ;
			// les deux doivent bouger ensemble. Le separateur est '%' ici,
			// alors que retrieve_euphonies() ci-dessus utilise '|'.
			$isni = $row['isni'] ? $row['isni'] : '';

			// 10e champ : les annees de programmation, telles quelles
			// ("1980" ou "1980,1992"). Renseigne pour environ la moitie de la
			// Phono A et le quart de la Phono B : la cellule reste vide
			// ailleurs, js/catalog.js n'y met rien.
			$editions = $row['editions'] ? $row['editions'] : '';

			// 11e et dernier champ : l'annee de concours, uniquement pour
			// signaler d'un marqueur les oeuvres primees. Chaine vide sinon.
			$award = $row['award_year'] ? $row['award_year'] : '';

			array_push($arr, $row['misam'], $row['firstName'], $row['name'],
						$row['id_artist'], $row['title'], $row['duration'], $row['id'],
						$ctry, $isni, $editions, $award);

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