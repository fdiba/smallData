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

		/* =================================================================
		   imeb_participation REMPLACE imeb_edition — 2026-08-04

		   imeb_edition est PIVOTEE : une ligne par artiste, une colonne
		   booleenne par edition. Le fait elementaire — « cette personne a
		   participe a cette edition » — y est une CASE, et l'on n'attache
		   rien a une case : ni la source, ni le document qui l'atteste.
		   C'est la forme meme qui interdisait la question posee plus bas
		   dans retrieveAllCompositionsFrom02(), ou la provenance doit etre
		   RECALCULEE a chaque appel faute d'etre enregistree.

		   imeb_participation en fait une LIGNE, avec `source` et `id_pv` :
		   679 des 5 572 participations sont attestees par un constat
		   d'huissier ; les autres portent 'inconnu'.

		   LA SORTIE NE CHANGE PAS D'UN OCTET. Verifie sur une base MariaDB
		   chargee du dump du 2026-08-04, comparaison exhaustive chaine
		   contre chaine : 2 556 artistes de part et d'autre, zero ligne
		   differente, zero perdue, zero apparue. Deux raisons : aucune
		   ligne de imeb_edition n'est entierement a zero, et les trois qui
		   pointaient un artiste inexistant (0, 903, 1250) etaient DEJA
		   ecartees par le INNER JOIN sur imeb_artist.

		   LE GROUP BY ENUMERE TOUTES LES COLONNES. MySQL 8 se contenterait
		   des cles primaires — il en deduit la dependance fonctionnelle —
		   mais MariaDB NON : teste sous ONLY_FULL_GROUP_BY, erreur 1055
		   « imeb_country.c_name_en isn't in GROUP BY ». On ignore ce que
		   sert webodrome.fr : la forme retenue passe sur les deux.

		   37 annees de 5 caracteres font 185 octets, tres en deca de
		   group_concat_max_len (1024 par defaut) : pas de troncature.

		   imeb_edition n'est pas supprimee — elle reste comme temoin. */
		$sth = $dbh->query('SELECT imeb_artist.id AS artist_id,
								COALESCE(NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name) AS ctry, imeb_country.id AS c_id,
								COALESCE(NULLIF(imeb_country.iso3, \'\'), NULLIF(imeb_country.iso2, \'\'), NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name) AS iso,
								GROUP_CONCAT(imeb_participation.annee
											 ORDER BY imeb_participation.annee) AS editions

							FROM imeb_artist
							INNER JOIN imeb_country
							ON imeb_artist.id_country = imeb_country.id
							INNER JOIN imeb_participation
							ON imeb_participation.id_artist = imeb_artist.id
							GROUP BY imeb_artist.id,
									 imeb_country.id, imeb_country.c_name_en,
									 imeb_country.c_name, imeb_country.iso3,
									 imeb_country.iso2
							');

		$sth->setFetchMode(PDO::FETCH_ASSOC);

		$str_all = "";

		while($row = $sth->fetch()) {

			if(strlen($str_all)>0) $str_all .=  "%";

			$aId=$row['artist_id'];

			$count=0;
			if(isset($arr[$aId]))$count=$arr[$aId];

			$str_all .= $aId."%". $row['ctry']."%".$row['c_id']."%".$count."%";

			// 5e champ : les annees de participation separees par des
			// virgules — « 1973,1979,1992 ». GROUP_CONCAT les rend deja
			// dans cette forme et dans cet ordre ; la boucle sur les 37
			// colonnes qui les recomposait n'a plus lieu d'etre.
			$str_all .= ($row['editions'] === null ? '' : $row['editions']);

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

		$result = "no result";

		/* imeb_artist.isni : 5e champ de la reponse (voir plus bas). C'est la
		   colonne renseignee par l'enrichissement data.bnf.fr — la meme que
		   celle servie aux Euphonies, au catalogue et aux oeuvres primees
		   (cf. Recapitulatif_nettoyage_bdd_IMEB.md, §G). */
		$sth = $dbh->prepare('SELECT imeb_artist.firstName, imeb_artist.name, imeb_artist.isni,
							COALESCE(NULLIF(imeb_country.iso3, \'\'), NULLIF(imeb_country.iso2, \'\'), NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name) AS \'ctry\',
							COALESCE(NULLIF(orig.iso3, \'\'), NULLIF(orig.iso2, \'\'), NULLIF(orig.c_name_en, \'\'), orig.c_name) AS \'origin\',
							GROUP_CONCAT(imeb_participation.annee
										 ORDER BY imeb_participation.annee) AS editions

						FROM imeb_artist
						INNER JOIN imeb_country
						ON imeb_artist.id_country = imeb_country.id
						LEFT JOIN imeb_country AS orig
						ON imeb_artist.id_country_origin = orig.id
						INNER JOIN imeb_participation
						ON imeb_participation.id_artist = imeb_artist.id
						WHERE imeb_artist.id = ?
						GROUP BY imeb_artist.id, imeb_artist.firstName,
								 imeb_artist.name, imeb_artist.isni,
								 imeb_country.id, imeb_country.c_name_en,
								 imeb_country.c_name, imeb_country.iso3,
								 imeb_country.iso2, orig.c_name_en,
								 orig.c_name, orig.iso3, orig.iso2');

		$sth->execute(array((int)$aId));

		$sth->setFetchMode(PDO::FETCH_ASSOC);

		while($row = $sth->fetch()) {

			/* $editions RESTE UN TABLEAU : le calcul de $festivalSeul,
			   plus bas, l'itere annee par annee. GROUP_CONCAT rend une
			   chaine, on la redecoupe — c'est la seule difference avec la
			   version qui lisait les 37 colonnes. La chaine affichee,
			   $str_editions, garde son separateur « , » (virgule ESPACE),
			   different de celui de queryDB() : deux flux, deux lecteurs,
			   on ne les uniformise pas au passage. */
			$editions = ($row['editions'] === null || $row['editions'] === '')
						? array() : explode(',', $row['editions']);

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

		/* --------- L'ANNEE REDEVIENT UNE VALEUR (2026-08-04) ---------------
		   Cette fonction fabriquait un NOM DE COLONNE a partir d'un
		   parametre : $ed_XXXX = "ed_".$y, concatene dans le SQL. Ce n'etait
		   pas injectable — (int) puis controle de plage y veillaient — mais
		   cela ne tenait que parce que imeb_edition etait pivotee :
		   demander une annee, c'etait nommer une colonne.

		   Avec imeb_participation l'annee passe en parametre lie, comme le
		   pays. Il ne reste plus une seule chaine concatenee dans cette
		   requete.

		   Le controle de plage est CONSERVE mais a change de nature : il ne
		   protege plus la requete, il refuse une annee hors du concours.
		   C'est devenu une regle du domaine. */
		$y = (int)$y;
		if($y<1973 || $y>2009) return;

		/* imeb_artist.isni : 5e champ de chaque enregistrement (voir plus bas).

		   EXISTS rend 1 ou 0 — exactement ce que la colonne booleenne
		   rendait. Le SECOND EXISTS reproduit l'ancien INNER JOIN sur
		   imeb_edition : il ne sert QUE de filtre de presence (« cette
		   personne a au moins une participation »), sans quoi la fonction
		   se mettrait a servir des compositeurs qu'elle n'a jamais servis.
		   Une bascule doit rendre la meme chose, y compris ses silences. */
		$sth = $dbh->prepare('SELECT imeb_artist.id AS a_id, imeb_artist.firstName,
							imeb_artist.name, imeb_artist.isni,
							COALESCE(NULLIF(orig.c_name_en, \'\'), orig.c_name) AS \'origin\',
							EXISTS(SELECT 1 FROM imeb_participation p
									WHERE p.id_artist = imeb_artist.id
									  AND p.annee = ?) AS ed
							FROM imeb_artist
							INNER JOIN imeb_country
							ON imeb_artist.id_country = imeb_country.id
							LEFT JOIN imeb_country AS orig
							ON imeb_artist.id_country_origin = orig.id
							WHERE imeb_country.id = ?
							AND EXISTS(SELECT 1 FROM imeb_participation p2
										WHERE p2.id_artist = imeb_artist.id)');

		$sth->execute(array($y, (int)$cId));

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
			$str_all .= $row['a_id'] . "%" . $row['firstName'] . "%" . $row['name'] . "%" . $row['ed'] . "%" . ($row['isni'] === null ? '' : $row['isni']) . "%" . ($row['origin'] === null ? '' : $row['origin']);
		}

		echo $str_all;
	}

?>
