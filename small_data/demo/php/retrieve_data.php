<?php

	$case=$_POST['case'];

	if($case==0){
		$cId = $_POST['cId'];
		$year = $_POST['year'];
		$value = $_POST['value'];
		retrieveAllComposers($cId, $year, $value);
	} elseif ($case==1){
		$aId = $_POST['aId'];
		retrieveAllCompositionsFrom($aId);
	} elseif ($case==5){
		$aId = $_POST['aId'];
		retrieveAllCompositionsFrom02($aId);
	} elseif ($case==10){
		queryDB();
	} elseif ($case==11){
		$aId = $_POST['aId'];
		retrieveAllCompositionsFrom03($aId);
	} elseif($case==28){ //overview.js
		$terms = $_POST['terms'];
		retrieveAllComposersNamed($terms);
	}

	//-------------------------------- functions --------------------------------------//

	function retrieveAllComposersNamed($str){

		$terms = explode(' ', trim($str));

		//--------- requete preparee : un couple de LIKE par terme ---------//
		$conditions = array();
		$params = array();

		foreach($terms as $term){
			if($term==='') continue;
			$conditions[] = '(name LIKE ? OR firstName LIKE ?)';
			$params[] = '%' . $term . '%';
			$params[] = '%' . $term . '%';
		}

		if(sizeof($conditions)<1) return;

		$req = 'SELECT id, firstName, name FROM imeb_artist WHERE '
				. implode(' OR ', $conditions);

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		//---------------
		$sth = $dbh->prepare($req);
		$sth->execute($params);

		$arr= array();
		$results="";

		while($row = $sth->fetch()) {
			$id=$row['id'];
			$firstName=$row['firstName'];
			$name=$row['name'];
			array_push($arr, $id, $firstName, $name);
		}

		if(sizeof($arr)>0){
			for($i=0; $i<sizeof($arr); $i++){

				if($i<sizeof($arr)-1)$results.=$arr[$i].'%';
				else $results.=$arr[$i];

			}
		}

		echo $results;

	}


	function queryDB(){

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		//---------------

		// exclure les oeuvres marquees hors du repertoire (colonne statut)
		$sth = $dbh->query('SELECT imeb_music.id, imeb_music.id_artist
							FROM imeb_music
							WHERE imeb_music.statut <> \'hors_repertoire\'');

		$arr= array();
		while($row = $sth->fetch()) {
			$id=$row['id_artist'];
			if(isset($arr[$id]))$arr[$id]+=1;
			else $arr[$id]=1;
		}

		//---------------

		$numResults;
		$years = array(1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009);

		$sth = $dbh->query('SELECT imeb_artist.id AS artist_id,
								COALESCE(NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name) AS ctry, imeb_country.id AS c_id,
								COALESCE(NULLIF(imeb_country.iso3, \'\'), NULLIF(imeb_country.iso2, \'\'), NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name) AS iso,
								imeb_edition.ed_1973, imeb_edition.ed_1974,
								imeb_edition.ed_1975, imeb_edition.ed_1976,
							   	imeb_edition.ed_1977, imeb_edition.ed_1978,
								imeb_edition.ed_1979, imeb_edition.ed_1980,
								imeb_edition.ed_1981, imeb_edition.ed_1982,
								imeb_edition.ed_1983, imeb_edition.ed_1984,
								imeb_edition.ed_1985, imeb_edition.ed_1986,
								imeb_edition.ed_1987, imeb_edition.ed_1988,
								imeb_edition.ed_1989, imeb_edition.ed_1990,
								imeb_edition.ed_1991, imeb_edition.ed_1992,
								imeb_edition.ed_1993, imeb_edition.ed_1994,
								imeb_edition.ed_1995, imeb_edition.ed_1996,
								imeb_edition.ed_1997, imeb_edition.ed_1998,
								imeb_edition.ed_1999, imeb_edition.ed_2000,
								imeb_edition.ed_2001, imeb_edition.ed_2002,
								imeb_edition.ed_2003, imeb_edition.ed_2004,
								imeb_edition.ed_2005, imeb_edition.ed_2006,
								imeb_edition.ed_2007, imeb_edition.ed_2008,
								imeb_edition.ed_2009

							FROM imeb_artist
							INNER JOIN imeb_country
							ON imeb_artist.id_country = imeb_country.id
							INNER JOIN imeb_edition
							ON imeb_artist.id = imeb_edition.artist_id
							');

		$sth->setFetchMode(PDO::FETCH_ASSOC);

		$str_all = "";

		while($row = $sth->fetch()) {

			if(strlen($str_all)>0) $str_all .=  "%";

			$aId=$row['artist_id'];

			$count=0;
			if(isset($arr[$aId]))$count=$arr[$aId];

			$str_all .= $aId."%". $row['ctry']."%".$row['c_id']."%".$count."%";

			$hasBeenInit = false;

			for($i = 0; $i <sizeof($years); $i++){
				$column_name = 'ed_' . $years[$i];
				if ($row[$column_name]) {
					if($hasBeenInit) $str_all .=  "," . $years[$i];
					else {
						$str_all .=  $years[$i];
						$hasBeenInit = true;
					}
				}
			}

			// 6e et dernier champ : le code pays affiche dans les bulles.
			// iso3, a defaut iso2 (l'Ecosse n'a pas d'iso3 : elle affiche GB),
			// a defaut le nom du pays (entrees sans code, type "Unknown").
			$str_all .= "%" . $row['iso'];
		}
		$dbh=null;
		echo $str_all;
	}
	function retrieveAllCompositionsFrom02($aId){ //only index case 5

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		$years = array(1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009);

		$result = "no result";

		/* imeb_artist.isni : 5e champ de la reponse (voir plus bas). C'est la
		   colonne renseignee par l'enrichissement data.bnf.fr — la meme que
		   celle servie aux Euphonies, au catalogue et aux oeuvres primees
		   (cf. Recapitulatif_nettoyage_bdd_IMEB.md, §G). */
		$sth = $dbh->prepare('SELECT imeb_artist.firstName, imeb_artist.name, imeb_artist.isni,
							COALESCE(NULLIF(imeb_country.iso3, \'\'), NULLIF(imeb_country.iso2, \'\'), NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name) AS \'ctry\',
							COALESCE(NULLIF(orig.iso3, \'\'), NULLIF(orig.iso2, \'\'), NULLIF(orig.c_name_en, \'\'), orig.c_name) AS \'origin\',
							imeb_edition.ed_1973, imeb_edition.ed_1974,
							imeb_edition.ed_1975, imeb_edition.ed_1976,
						   	imeb_edition.ed_1977, imeb_edition.ed_1978,
							imeb_edition.ed_1979, imeb_edition.ed_1980,
							imeb_edition.ed_1981, imeb_edition.ed_1982,
							imeb_edition.ed_1983, imeb_edition.ed_1984,
							imeb_edition.ed_1985, imeb_edition.ed_1986,
							imeb_edition.ed_1987, imeb_edition.ed_1988,
							imeb_edition.ed_1989, imeb_edition.ed_1990,
							imeb_edition.ed_1991, imeb_edition.ed_1992,
							imeb_edition.ed_1993, imeb_edition.ed_1994,
							imeb_edition.ed_1995, imeb_edition.ed_1996,
							imeb_edition.ed_1997, imeb_edition.ed_1998,
							imeb_edition.ed_1999, imeb_edition.ed_2000,
							imeb_edition.ed_2001, imeb_edition.ed_2002,
							imeb_edition.ed_2003, imeb_edition.ed_2004,
							imeb_edition.ed_2005, imeb_edition.ed_2006,
							imeb_edition.ed_2007, imeb_edition.ed_2008,
							imeb_edition.ed_2009

						FROM imeb_artist
						INNER JOIN imeb_country
						ON imeb_artist.id_country = imeb_country.id
						LEFT JOIN imeb_country AS orig
						ON imeb_artist.id_country_origin = orig.id
						INNER JOIN imeb_edition
						ON imeb_artist.id = imeb_edition.artist_id
						WHERE imeb_artist.id = ?');

		$sth->execute(array((int)$aId));

		$sth->setFetchMode(PDO::FETCH_ASSOC);

		while($row = $sth->fetch()) {

			$editions = array();
			for($i = 0; $i <sizeof($years); $i++){
				$column_name = 'ed_' . $years[$i];
				if ($row[$column_name]) array_push($editions, $years[$i]);
			}

			$str_editions = implode(", ", $editions);

			/* --- Provenance de chaque participation (2026-08-04) -------------
			   imeb_edition ne dit PAS d'ou vient une coche. Trois origines la
			   nourrissent, et elles ne valent pas la meme chose :

			     - un PRIX cette annee-la (imeb_music.award_year) : la personne
			       a forcement concouru — candidature certaine ;
			     - AUCUNE oeuvre datee de cette annee-la : le nom ne peut venir
			       que d'un proces-verbal — candidature quasi certaine
			       (verifie 67/67 sur le PV de 1973) ;
			     - une PROGRAMMATION au festival Synthese et rien d'autre
			       (imeb_music.editions, cf. §H du recapitulatif : cette colonne
			       porte les annees de PROGRAMMATION, pas de concours) : la
			       personne etait a Bourges, mais rien n'atteste qu'elle ait
			       candidate. Sur le PV de 1973, 7 des 9 cas de cette classe
			       avaient bel et bien candidate — et 2 non (Luc Ferrari,
			       Joran Rudi). La classe est donc AMBIGUE, pas fausse.

			   On ne corrige rien ici : on RENSEIGNE la troisieme classe, pour
			   que la boite orange cesse de presenter trois faits differents
			   sous un seul mot. Seuls les proces-verbaux trancheront. */
			$sthP = $dbh->prepare('SELECT award_year, editions FROM imeb_music
									WHERE id_artist = ?');
			$sthP->execute(array((int)$aId));
			$sthP->setFetchMode(PDO::FETCH_ASSOC);

			$aw = array();   // annees de prix
			$fe = array();   // annees de programmation au festival
			while($w = $sthP->fetch()){
				$y = trim((string)$w['award_year']);
				if(ctype_digit($y)) $aw[$y] = true;
				foreach(explode(',', (string)$w['editions']) as $y2){
					$y2 = trim($y2);
					if(ctype_digit($y2)) $fe[$y2] = true;
				}
			}

			$festivalSeul = array();
			foreach($editions as $y){
				$y = (string)$y;
				if(!isset($aw[$y]) && isset($fe[$y])) $festivalSeul[] = $y;
			}
			$str_festival = implode(", ", $festivalSeul);

			// 3e champ : le code pays affiche dans la boite orange d'Overview.
			// iso3, a defaut iso2 (l'Ecosse n'a pas d'iso3 : elle affiche GB),
			// a defaut le nom du pays (entrees sans code, type "Unknown").
			//
			// 5e champ : l'ISNI, AJOUTE EN FIN DE CHAINE. C'est lui qui rend le
			// nom du compositeur cliquable dans la boite orange (js/overview.js).
			// Ajouter en fin, jamais au milieu : les champs sont lus par POSITION
			// (arr[0..3]) et tout decalage casserait silencieusement l'affichage
			// existant. Chaine vide quand la fiche n'a pas d'ISNI — le nom reste
			// alors du texte simple.
			//
			// 6e champ : le PAYS D'ORIGINE, meme vocabulaire que le 3e (code
			// ISO3) puisqu'ils s'affichent cote a cote — "ARG / FRA". Jointure
			// LEFT : la colonne id_country_origin est nulle pour la quasi-
			// totalite des fiches, et elle ne porte QUE les origines qui
			// DIFFERENT du pays (regle du 2026-08-04) ; un champ non vide est
			// donc toujours une information nouvelle. Vide -> la boite orange
			// n'affiche que le pays, comme avant.
			//
			// 7e champ : parmi les annees du 4e champ, celles qui ne reposent
			// QUE sur une programmation au festival. Sous-ensemble du 4e, donc
			// aucun risque de contradiction : la boite orange les marque d'un
			// signe au lieu d'en faire une liste separee.
			$result = $row['firstName'] . '%' . $row['name'] . '%' . $row['ctry']
					  . '%' . $str_editions
					  . '%' . ($row['isni'] === null ? '' : $row['isni'])
					  . '%' . ($row['origin'] === null ? '' : $row['origin'])
					  . '%' . $str_festival;

		}

		echo $result;

	}
	function retrieveAllCompositionsFrom03($aId){ //only network case 11

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		/* imeb_artist.isni : 8e champ de chaque enregistrement (voir plus bas).
		   Pays et pays d'origine : 9e et 10e champs, en NOMS ANGLAIS et non en
		   codes — la boite orange de Network n'affichait aucun pays jusqu'ici,
		   elle n'a donc pas de vocabulaire ISO3 a respecter (contrairement au
		   case 5). */
		$sth = $dbh->prepare('SELECT imeb_artist.firstName, imeb_artist.name, imeb_artist.isni,
							COALESCE(NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name) AS \'ctry\',
							COALESCE(NULLIF(orig.c_name_en, \'\'), orig.c_name) AS \'origin\',
							imeb_music.id, imeb_music.title, imeb_music.duration,
							imeb_music.misam, imeb_music.editions
							FROM imeb_artist
							INNER JOIN imeb_music
							ON imeb_artist.id = imeb_music.id_artist
							LEFT JOIN imeb_country
							ON imeb_artist.id_country = imeb_country.id
							LEFT JOIN imeb_country AS orig
							ON imeb_artist.id_country_origin = orig.id
							WHERE imeb_artist.id = ?
							AND imeb_music.statut <> \'hors_repertoire\'');

		$sth->execute(array((int)$aId));

		$sth->setFetchMode(PDO::FETCH_ASSOC);

		$str_all = "";

		/* Une reponse a PAS DE FIN : c'est une suite d'enregistrements de
		   longueur fixe, lus par paquets ("i += 7" dans Particle.getTitlesFrom,
		   js/particles.js). Le champ ajoute l'est donc en fin de CHAQUE
		   enregistrement, et le pas de lecture passe de 7 a 8 dans l'unique
		   consommateur — le seul endroit du site qui appelle le case 11.
		   Ajouter au milieu aurait decale toutes les colonnes suivantes.

		   Le prenom, le nom et l'ISNI sont repetes a chaque ligne : c'est la
		   forme d'origine du flux, on ne la change pas. Seul le premier
		   enregistrement est lu pour la boite orange. Le pays et le pays
		   d'origine, ajoutes le 2026-08-04, suivent la meme convention : le pas
		   passe de 8 a 10. */
		while($row = $sth->fetch()) {
			if(strlen($str_all)>0) $str_all .=  "%";
			$str_all .= $row['id'] . "%" . $row['title'] . "%" . $row['duration'] . "%" . $row['misam'] . "%" . $row['editions'] . "%" . $row['firstName'] . "%" . $row['name'] . "%" . ($row['isni'] === null ? '' : $row['isni']) . "%" . ($row['ctry'] === null ? '' : $row['ctry']) . "%" . ($row['origin'] === null ? '' : $row['origin']);
		}

		echo $str_all;

	}
	function retrieveAllCompositionsFrom($aId){

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		$sth = $dbh->prepare('SELECT imeb_artist.firstName, imeb_artist.name,
							imeb_music.id, imeb_music.title, imeb_music.duration,
							imeb_music.misam, imeb_music.editions
							FROM imeb_artist
							INNER JOIN imeb_music
							ON imeb_artist.id = imeb_music.id_artist
							WHERE imeb_artist.id = ?
							AND imeb_music.statut <> \'hors_repertoire\'');

		$sth->execute(array((int)$aId));

		$sth->setFetchMode(PDO::FETCH_ASSOC);

		$str_all = "";

		while($row = $sth->fetch()) {
			if(strlen($str_all)>0) $str_all .=  "%";
			$str_all .= $row['id'] . "%" . $row['title'] . "%" . $row['duration'] . "%" . $row['misam'] . "%" . $row['editions'];
		}

		echo $str_all;

	}

	function retrieveAllComposers($cId, $y, $v){

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		//--------- l'annee sert de nom de colonne : validation stricte ---------//
		$y = (int)$y;
		if($y<1973 || $y>2009) return;

		$ed_XXXX="ed_".$y;

		/* imeb_artist.isni : 5e champ de chaque enregistrement (voir plus bas). */
		$sth = $dbh->prepare('SELECT imeb_artist.id AS a_id, imeb_artist.firstName,
							imeb_artist.name, imeb_artist.isni,
							COALESCE(NULLIF(orig.c_name_en, \'\'), orig.c_name) AS \'origin\', ' . $ed_XXXX . '
							FROM imeb_artist
							INNER JOIN imeb_country
							ON imeb_artist.id_country = imeb_country.id
							LEFT JOIN imeb_country AS orig
							ON imeb_artist.id_country_origin = orig.id
							INNER JOIN imeb_edition
							ON imeb_artist.id = imeb_edition.artist_id
							WHERE imeb_country.id = ?');

		$sth->execute(array((int)$cId));

		$sth->setFetchMode(PDO::FETCH_ASSOC);

		$str_all = "";

		/* L'ISNI voyage avec la LISTE DES COMPOSITEURS, et non avec leurs
		   oeuvres (case 1) : sur les line charts on clique un compositeur qui
		   peut n'avoir aucune oeuvre archivee, et son nom doit rester cliquable
		   vers sa notice d'identite. Attache aux oeuvres, il aurait disparu
		   precisement pour ces fiches-la.

		   Ajoute en fin de CHAQUE enregistrement : le flux est une suite de
		   paquets de longueur fixe, lus par pas de 4 dans js/linechart.js. Le
		   pas y passe a 5 — c'est l'unique consommateur du case 0.

		   6e champ (2026-08-04) : le PAYS D'ORIGINE, en nom anglais. Le pays
		   COURANT n'est pas envoye : l'appel porte deja sur un pays unique
		   (parametre cId), et js/linechart.js en tient le libelle dans
		   this.sl_ctry. Le pas passe donc de 5 a 6. */
		while($row = $sth->fetch()) {
			if(strlen($str_all)>0) $str_all .=  "%";
			$str_all .= $row['a_id'] . "%" . $row['firstName'] . "%" . $row['name'] . "%" . $row[$ed_XXXX] . "%" . ($row['isni'] === null ? '' : $row['isni']) . "%" . ($row['origin'] === null ? '' : $row['origin']);
		}

		echo $str_all;
	}

?>
