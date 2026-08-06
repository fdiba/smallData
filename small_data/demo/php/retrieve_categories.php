<?php

	/* Donnees du diagramme de flux (page Categories) generees depuis la base
	   au lieu du fichier data/smallData.csv.
	   Renvoie, pour chaque oeuvre primee, l'enregistrement de NEUF champs
	       annee % categorie % nom % prenom % isni % id_artist % editions
	             % cat_debut % cat_fin
	   separe par des %, dans l'ordre chronologique (plus ancien d'abord).

	   Les quatre derniers champs ont ete ajoutes EN FIN d'enregistrement pour
	   ne decaler aucun index existant :
	     - prenom     : le diagramme n'affichait que le patronyme ;
	     - isni       : rend le nom cliquable (fiche ISNI) quand il est
	                    renseigne — 236 des 508 compositeurs primes ;
	     - id_artist  : identifie le noeud compositeur. C'est lui, et non le
	                    nom, qui distingue les homonymes (Berger, Kokoras, Lee,
	                    Schubert, Thompson, Tremblay, Freedman sont chacun
	                    portes par deux compositeurs primes distincts) ;
	     - editions   : annees de participation au festival, separees par des
	                    virgules (ex. "1980,1992,2003"). A ne pas confondre
	                    avec award_year, qui est l'annee du prix. Vide pour
	                    237 des 728 oeuvres primees. Alimente l'infobulle du
	                    lien categorie -> compositeur.
	   Les deux derniers ont ete ajoutes le 2026-08-06, EN FIN d'enregistrement
	   comme les precedents :
	     - cat_debut  \
	     - cat_fin    /  les bornes d'annees de imeb_categorie, la PERIODE QUE
	                     LA CATEGORIE COUVRE. C'est une definition, pas un
	                     constat : elle ne bouge pas selon ce qui est verse.
	                     Vides pour les 38 oeuvres sans categorie, que la page
	                     regroupe sous « None » — celles d'avant 1977, quand le
	                     concours n'avait qu'un seul classement.

	   ⚠️ LA MEME VALEUR EST REPETEE A CHAQUE ENREGISTREMENT. C'est le prix du
	      format : le flux est un tableau plat, il repete deja la categorie, le
	      nom et l'ISNI. Vingt-trois valeurs distinctes recopiees 728 fois font
	      environ 7 Ko sur une reponse qui en pese cent — l'autre solution, un
	      second appel ou un en-tete a part, coutait un protocole de plus pour
	      economiser cela.

	   ⚠️ LA JOINTURE SE FAIT SUR LE LIBELLE, faute d'une cle etrangere :
	      imeb_music.award_cat est une CHAINE, pas un id. Verifie le
	      2026-08-06 sur les 728 oeuvres primees — les vingt-trois libelles du
	      catalogue tombent tous sur une ligne de imeb_categorie, et les
	      annees observees coincident exactement avec les bornes declarees,
	      categorie par categorie. Le jour ou un libelle nouveau n'y tombera
	      plus, ses deux champs sortiront vides et la periode ne s'affichera
	      pas : la page perd une information, elle n'en invente pas.

	   ATTENTION : la longueur d'enregistrement (9) est ecrite en dur dans la
	   boucle de lecture de js/categories.js ; les deux doivent bouger
	   ensemble. Aucun champ ne contient de %, le separateur reste sur. */

	retrieve_categories();

	function retrieve_categories(){

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		//aucune entree utilisateur : requete simple
		$sth = $dbh->query('SELECT imeb_music.award_year,
							imeb_music.award_cat,
							imeb_artist.name,
							imeb_artist.firstName,
							imeb_artist.isni,
							imeb_artist.id AS id_artist,
							imeb_music.editions,
							imeb_categorie.annee_debut AS cat_debut,
							imeb_categorie.annee_fin AS cat_fin
							FROM imeb_music
							INNER JOIN imeb_artist
							ON imeb_music.id_artist = imeb_artist.id
							LEFT JOIN imeb_categorie
							ON imeb_categorie.libelle = imeb_music.award_cat
							WHERE imeb_music.award_year IS NOT NULL
							ORDER BY imeb_music.award_year ASC,
							imeb_music.award_price ASC,
							imeb_artist.name ASC');

		$arr = array();

		while($row = $sth->fetch()) {

			$year = $row['award_year'];

			$category = $row['award_cat'];
			if($category === null || $category === '') $category = 'None';

			$name = $row['name'];

			//chaine vide plutot que NULL : le champ garde sa place dans
			//l'enregistrement, js/categories.js n'affiche simplement rien
			$firstName = $row['firstName'] ? $row['firstName'] : '';
			$isni      = $row['isni'] ? $row['isni'] : '';

			//annees de participation au festival, deja stockees sous forme de
			//liste separee par des virgules. Le nettoyage (doublons, tri) est
			//fait cote client, ou l'infobulle est composee.
			$editions  = $row['editions'] ? $row['editions'] : '';

			//bornes de la categorie. LEFT JOIN : elles sont NULL pour les
			//oeuvres sans categorie, et la chaine vide garde leur place dans
			//l'enregistrement — js/categories.js n'affiche alors pas de periode.
			$catDebut  = $row['cat_debut'] !== null ? $row['cat_debut'] : '';
			$catFin    = $row['cat_fin']   !== null ? $row['cat_fin']   : '';

			array_push($arr, $year, $category, $name, $firstName, $isni, $row['id_artist'], $editions, $catDebut, $catFin);
		}

		echo implode('%', $arr);
	}

?>
