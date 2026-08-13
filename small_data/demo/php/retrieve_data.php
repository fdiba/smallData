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
	} elseif ($case==12){ //animated_data.js — liseré de provenance
		pvProvenance();
	} elseif($case==28){ //overview.js
		$terms = $_POST['terms'];
		retrieveAllComposersNamed($terms);
	}

	/* =====================================================================
	   LA VUE DE TRAVAIL, COTE SERVEUR — 2026-08-07

	   Par defaut, le `case 0` (liste des compositeurs d'un pays, affichee
	   par Line Charts) NE TRANSMET PLUS le nom des personnes dont la base
	   ne connait qu'une CANDIDATURE, c'est-a-dire aucune oeuvre archivee.
	   Il envoie des initiales suivies d'etoiles, et rien d'autre : ni
	   identifiant de fiche, ni ISNI, ni pays d'origine.

	   Jusqu'ici le masque etait POSE PAR LE NAVIGATEUR (js/functions.js).
	   Il reste — les deux couches disent la meme chose — mais il ne
	   protegeait rien : les noms complets partaient sur le reseau, et il
	   suffisait d'ouvrir l'onglet Reseau du navigateur pour les lire.
	   Desormais ils ne partent plus.

	   ET CE N'EST TOUJOURS PAS UN CONTROLE D'ACCES. Le drapeau arrive
	      du client, en clair, dans le POST : n'importe qui peut poster
	      `v=all` et recevoir tout. Ce qui est gagne est REEL mais precis —
	      le nom d'un candidat ne se trouve plus dans une page qu'on lit,
	      ni dans une reponse qu'on inspecte par curiosite, ni dans un cache
	      intermediaire. Ce qui n'est PAS gagne l'est tout autant : cela
	      n'arrete personne qui cherche a contourner.

	      Le rendre effectif tient en une ligne, et demande une decision :
	      remplacer le test ci-dessous par la comparaison de `v` a un jeton
	      secret range a cote de /access/connexion.php — hors de l'arbre
	      web, comme les identifiants de base. L'adresse de travail
	      deviendrait `?v=<jeton>` au lieu de `?v=all`. Tant que ce n'est
	      pas fait, ce fichier ne doit pas etre presente comme protegeant
	      quoi que ce soit.

	   LE CRITERE DOIT RESTER LE MEME QUE CELUI DU `case 10`, qui compte
	      les oeuvres avec `statut <> 'hors_repertoire'` (28 oeuvres
	      ecartees sur 6 772 ; la colonne est NOT NULL, donc le `<>` ne perd
	      aucune ligne). S'ils divergeaient, le navigateur nommerait
	      quelqu'un que le serveur a masque — ou masquerait un nom qu'il
	      vient de recevoir entier, ce qui ne se verrait nulle part.
	   ===================================================================== */
	function viewAll(){
		return isset($_POST['v']) && $_POST['v'] === 'all';
	}
	/* Initiales + etoiles, MEME REGLE QUE maskName() dans js/functions.js :
	   tout ce qui suit la premiere lettre d'un mot devient une etoile,
	   traits d'union et apostrophes compris.

	   Le motif `(?<=.)` avec le drapeau /u plutot que mb_substr() : il
	   compte en caracteres UTF-8 sans dependre de l'extension mbstring, qui
	   n'est pas garantie sur l'hebergement. Un « É » vaut une lettre, pas
	   deux etoiles. */
	function maskName($txt){
		$out = array();
		foreach(preg_split('/\s+/u', trim((string)$txt), -1, PREG_SPLIT_NO_EMPTY) as $mot){
			$out[] = preg_replace('/(?<=.)./u', '*', $mot);
		}
		return implode(' ', $out);
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


	/* =====================================================================
	   CASE 12 — CE QUE LA BASE SAIT DE CHAQUE EDITION (2026-08-07)

	   Le liseré de provenance d'animated_data.js etait CODE EN DUR : deux
	   tableaux d'annees, releves a la main dans
	   `sources/attribution des proces verbaux.xlsx`. Il decrivait l'etat du
	   DEPOUILLEMENT, pas celui de la base — et il est devenu faux le jour
	   ou les constats d'huissier ont commence a etre verses.

	   Il le redeviendra a chaque edition versee. D'ou ce case : la
	   provenance est desormais LUE DANS imeb_participation, et le liseré
	   se corrige tout seul.

	   Une ligne par edition, cinq champs separes par « % », sans en-tete :

	     annee % constat % inconnu % liste % inexplique

	   `inexplique` compte les participations de provenance 'inconnu' que
	   NI la liste des candidats NI une oeuvre du catalogue ne portent.
	   C'est la signature d'un DEPOUILLEMENT SAISI : le nom vient de
	   quelque part, et il ne reste que le releve des proces-verbaux des
	   annees 1990 pour l'expliquer.

	   POURQUOI CE TROISIEME COMPTE, ET PAS SIMPLEMENT `inconnu`. De
	      1996 a 2009, TOUTES les lignes 'inconnu' sont expliquees par une
	      oeuvre ou par la liste — `inexplique` y vaut zero, sauf UNE, en
	      2005 : Philippe Auclair, fiche 1426, deja signale au §3 de
	      Provenance_des_participations. De 1988 a 1994 il vaut 10 a 62.
	      L'ecart est d'un ordre de grandeur, et c'est lui qui separe
	      « un dépouillement est en base » de « il n'y en a pas ».
	   ===================================================================== */
	function pvProvenance(){

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		$sth = $dbh->query('SELECT `annee`,
								SUM(`source` = \'constat\') AS n_constat,
								SUM(`source` = \'inconnu\') AS n_inconnu,
								SUM(`source` = \'liste\')   AS n_liste,
								SUM(`source` = \'inconnu\'
									AND `cite_par_liste`  = 0
									AND `cite_par_oeuvre` = 0) AS n_inexplique
							FROM `imeb_participation`
							GROUP BY `annee`
							ORDER BY `annee`');

		$sth->setFetchMode(PDO::FETCH_ASSOC);

		$str_all = "";
		while($row = $sth->fetch()) {
			if(strlen($str_all)>0) $str_all .= "%";
			$str_all .= $row['annee']      . "%" . $row['n_constat'] . "%"
			          . $row['n_inconnu']  . "%" . $row['n_liste']   . "%"
			          . $row['n_inexplique'];
		}

		echo $str_all;
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

							/* IL N\'Y AVAIT AUCUN ORDER BY — 2026-08-08.
							   Le flux sortait dans l\'ordre que le moteur
							   produisait pour le GROUP BY : non garanti, et
							   susceptible de differer entre MariaDB et
							   MySQL 8. La grille de l\'Overview, qui dessine
							   les carres dans l\'ordre du flux, n\'avait donc
							   pas d\'ordre — elle en avait un par accident.

							   Le tri porte sur le NOM DE FAMILLE, puis le
							   prenom : l\'ordre d\'un catalogue. Et il est
							   fait ICI plutot que dans le navigateur parce
							   que le nom N\'EST PAS DANS LE FLUX : trier
							   alphabetiquement cote client aurait demande de
							   l\'y ajouter, donc un 7e champ, donc le pas de
							   lecture a corriger dans les CINQ boucles
							   `i+=6` d\'overview.js, animated_data.js et
							   network.js. C\'est la manoeuvre qui a deja mal
							   tourne trois fois dans ce projet (§12.5 du doc
							   d\'interface). Le serveur rend l\'ordre
							   alphabetique, le client en derive les autres
							   (premiere edition, nombre d\'oeuvres) a partir
							   de champs qu\'il a deja. Le flux ne change pas
							   d\'un octet. */
							ORDER BY imeb_artist.name, imeb_artist.firstName
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

			/* --- CE QUE LA BASE SAIT DE CHAQUE ANNEE -------------------------
			   Ecrit le 2026-08-04, REFAIT LE 2026-08-08.

			   LA VERSION PRECEDENTE DISAIT LE CONTRAIRE DE LA BASE, et sur
			      une grande echelle. Elle deduisait « festival seul » de deux
			      colonnes de imeb_music — pas de prix cette annee-la, mais une
			      programmation — parce qu'elle a ete ecrite TROIS JOURS AVANT
			      que imeb_participation porte `source` et `cite_par_*`. Elle ne
			      pouvait donc pas voir les constats d'huissier.

			      Mesure sur le dump du 2026-08-08 (9 704 participations) :
			      elle marquait 2 262 annees « concours non atteste », dont
			      2 153 — QUATRE-VINGT-QUINZE POUR CENT — sont en fait
			      attestees, le plus souvent par un constat. Il n'y a que 109
			      vraies annees « festival seul ».

			   La classe est desormais LUE dans imeb_participation, comme le
			   liseré de provenance des trois graphes de Participation l'est
			   depuis le 2026-08-07. Quatre classes :

			     1  CONCOURS ATTESTE — un constat d'huissier porte ce nom
			        (`source='constat'`), ou la liste recapitulative des
			        candidats le porte (`source='liste'` ou `cite_par_liste`),
			        ou un prix lui a ete decerne cette annee-la. 6 736 (69,4 %).
			     2  CONCOURS ET FESTIVAL — la meme chose, plus une oeuvre
			        programmee au festival Synthese cette annee-la
			        (imeb_music.editions : cette colonne porte les annees de
			        PROGRAMMATION, jamais de concours). 2 660 (27,4 %).
			     3  FESTIVAL SEUL — la seule trace est cette programmation :
			        la personne etait a Bourges, rien n'atteste qu'elle ait
			        candidate. 109 (1,1 %), 91 compositeurs, concentres sur
			        1990 et 2000. CLASSE AMBIGUE, PAS FAUSSE : sur le PV de
			        1973, 7 des 9 cas de cette classe avaient bel et bien
			        candidate, et 2 non (Luc Ferrari, Joran Rudi).
			     4  RELEVE SANS PIECE RATTACHEE — ni constat, ni liste, ni
			        oeuvre : le nom vient d'un depouillement de proces-verbal
			        saisi, dont la piece n'est pas liee. 199 (2,1 %),
			        EXCLUSIVEMENT de 1989 a 1994, plus un cas isole en 2005
			        (Philippe Auclair, fiche 1426). C'est la signature decrite
			        au §3 de Provenance_des_participations, et la distribution
			        par annee la confirme exactement.

			   Le 7e champ de la reponse rend « annee=classe+piece » pour CHAQUE
			   annee, et non plus la liste d'un sous-ensemble : le navigateur
			   n'a plus rien a deduire, il affiche ce que le serveur a lu. La
			   CLASSE (1 a 4) decide du marqueur, la PIECE (c/a/l/o/t) decide
			   de l'infobulle — l'ecran porte la structure, l'infobulle porte
			   la preuve. */
			$sthP = $dbh->prepare('SELECT award_year, editions FROM imeb_music
									WHERE id_artist = ?');
			$sthP->execute(array((int)$aId));
			$sthP->setFetchMode(PDO::FETCH_ASSOC);

			$aw = array();   // annees de prix
			$fe = array();   // annees de programmation au festival Synthese
			while($w = $sthP->fetch()){
				$y = trim((string)$w['award_year']);
				if(ctype_digit($y)) $aw[$y] = true;
				foreach(explode(',', (string)$w['editions']) as $y2){
					$y2 = trim($y2);
					if(ctype_digit($y2)) $fe[$y2] = true;
				}
			}

			/* La provenance de chaque participation, DANS LA BASE et non
			   deduite. `source` est un enum de cinq valeurs dont trois seules
			   sont employees (constat 24,8 %, liste 42,6 %, inconnu 32,6 %) :
			   `depouillement` et `oeuvre` sont a zero, et on ne les teste donc
			   pas — mais on ne les traite pas non plus comme inconnues, d'ou
			   le test explicite sur 'inconnu'. */
			$sthQ = $dbh->prepare('SELECT annee, source, cite_par_liste, cite_par_oeuvre
									FROM imeb_participation WHERE id_artist = ?');
			$sthQ->execute(array((int)$aId));
			$sthQ->setFetchMode(PDO::FETCH_ASSOC);

			$prov = array();
			while($q = $sthQ->fetch()){
				$y = (string)$q['annee'];

				$concours = ($q['source'] === 'constat')
						 || ($q['source'] === 'liste')
						 || ((int)$q['cite_par_liste'] === 1)
						 || isset($aw[$y]);

				$festival = isset($fe[$y]);

				if($concours && $festival)      $c = 2;
				elseif($concours)               $c = 1;
				elseif($festival)               $c = 3;
				else                            $c = 4;

				/* LA PIECE, et non seulement la classe. Elle ne change pas le
				   marqueur — elle change l'infobulle, qui NOMME le document.
				   C'est ce qui separe « attestee » de « attestee par quoi »,
				   et c'est la question que cette base pose partout ailleurs.
				   Ordre de priorite : le constat d'huissier prime (piece de
				   premiere main), puis le prix (le jury a proclame), puis la
				   liste (document de seconde main). Repartition mesuree sur
				   le dump du 2026-08-08 :
				     constat 2 408 (24,8 %) · prix 440 (4,5 %) ·
				     liste 6 548 (67,5 %) · oeuvre seule 109 (1,1 %) ·
				     transcription sans piece 199 (2,1 %). */
				if($q['source'] === 'constat')                             $p = 'c';
				elseif(isset($aw[$y]))                                     $p = 'a';
				elseif($q['source'] === 'liste' || (int)$q['cite_par_liste'] === 1) $p = 'l';
				elseif($c === 3)                                           $p = 'o';
				else                                                       $p = 't';

				$prov[$y] = $c . $p;
			}

			$classes = array();
			foreach($editions as $y){
				$y = (string)$y;
				$classes[] = $y . '=' . (isset($prov[$y]) ? $prov[$y] : '1l');
			}
			$str_festival = implode(",", $classes);

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
		/* `nb` — le nombre d'oeuvres archivees, qui decide du masque. Il
		   n'est PAS ajoute au flux : la longueur d'enregistrement reste de
		   six champs, codee en dur des deux cotes (le pas de la boucle dans
		   js/linechart.js). Il ne sert qu'ici, a l'ecriture. */
		$sth = $dbh->prepare('SELECT imeb_artist.id AS a_id, imeb_artist.firstName,
							imeb_artist.name, imeb_artist.isni,
							COALESCE(NULLIF(orig.c_name_en, \'\'), orig.c_name) AS \'origin\',
							(SELECT COUNT(*) FROM imeb_music m
								WHERE m.id_artist = imeb_artist.id
								  AND m.statut <> \'hors_repertoire\') AS nb,
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
		$tout = viewAll();

		while($row = $sth->fetch()) {

			$a_id      = $row['a_id'];
			$firstName = $row['firstName'];
			$name      = $row['name'];
			$isni      = ($row['isni']   === null ? '' : $row['isni']);
			$origin    = ($row['origin'] === null ? '' : $row['origin']);

			/* AUCUNE OEUVRE ARCHIVEE, ET NOUS NE SOMMES PAS EN VUE DE
			   TRAVAIL : la personne reste COMPTEE — la ligne part, sans
			   quoi les totaux de la barre orange (« all editions : c/t »)
			   et la longueur de la liste changeraient — mais elle n'est
			   plus NOMMEE.

			   L'IDENTIFIANT PART AVEC LE NOM, et c'est le point qui
			      compte. Un nom masque a cote de son id de fiche ne serait
			      pas masque : l'id se repose au `case 1`, qui rend les
			      oeuvres, et il se compare a la grille de l'Overview.
			      L'ISNI encore moins — c'est un identifiant PUBLIC et
			      mondial, il nomme la personne mieux que son nom.

			   Le pays d'origine part aussi : le navigateur ne l'affiche que
			   dans la boite d'un compositeur choisi, et une ligne masquee
			   ne peut pas etre choisie. Ce qui ne sert a rien n'a pas a
			   etre transmis. */
			if(!$tout && (int)$row['nb'] < 1){
				$a_id      = '';
				$firstName = maskName($firstName);
				$name      = maskName($name);
				$isni      = '';
				$origin    = '';
			}

			if(strlen($str_all)>0) $str_all .=  "%";
			$str_all .= $a_id . "%" . $firstName . "%" . $name . "%" . $row['ed'] . "%" . $isni . "%" . $origin;
		}

		echo $str_all;
	}

?>
