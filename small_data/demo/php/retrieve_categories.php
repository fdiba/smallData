<?php

	/* Donnees du diagramme de flux (page Categories) generees depuis la base
	   au lieu du fichier data/smallData.csv.
	   Renvoie, pour chaque oeuvre primee, l'enregistrement de ONZE champs
	       annee % categorie % nom % prenom % isni % id_artist % editions
	             % cat_debut % cat_fin % sous_categorie % award_price
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

	   ⚠️⚠️ REPRISE DU 2026-08-12 — DEUX LIBELLES DU CATALOGUE NOMMENT UNE
	      SEULE CATEGORIE, ET LA JOINTURE DOIT LE SAVOIR.

	      Le constat de 1993 ecrit, en tete de son Degre 2, « 1°) PRIX DE LA
	      MUSIQUE ELECTROACOUSTIQUE DE STUDIO » — exactement ce que le
	      constat de 1990 ecrit page 1 pour DEFINIR sa categorie 1. Mesure :
	      les laureats de la categorie 1 de 1990 portent `award_cat =
	      Electroacoustique`, ceux de 1993 portent `award_cat = Studio`.
	      **Le catalogue separe en deux ce que les deux constats appellent du
	      meme nom.** Les lignes 6 et 12 de `imeb_categorie` ont donc ete
	      fusionnees le 2026-08-12 (DB/fusion_categorie_studio.sql) : une
	      seule ligne, `libelle` = « Studio », `annee_debut` 1985,
	      `annee_fin` 1998, et le libelle du catalogue conserve dans la
	      colonne neuve `libelle_alt`.

	      DEUX CHOSES CHANGENT ICI, ET UNE TROISIEME NON :
	        - la jointure porte sur `libelle` OU `libelle_alt`, sans quoi les
	          44 oeuvres de 1985-1991 ne tomberaient plus sur aucune ligne et
	          PERDRAIENT LEUR PERIODE en silence (mesure : 44) ;
	        - le champ `categorie` emis est desormais LE LIBELLE CANONIQUE de
	          `imeb_categorie` — c'est lui qui fait le nœud du diagramme, et
	          c'est la seule facon d'en avoir UN au lieu de deux ;
	        - `imeb_music.award_cat` N'EST PAS TOUCHE. Le §4 principe 2 du
	          chantier tient : *la table du chantier sert a comparer, pas a
	          remplacer.* Reecrire 44 lignes du catalogue aurait efface ce
	          qu'il ecrit pour y mettre ce que nous en concluons.

	      ⚠️ La longueur d'enregistrement ne bouge pas : c'est la VALEUR du
	         troisieme champ qui change, pas le nombre de champs. js/categories.js
	         n'a rien a reprendre.

	      ⚠️ ET LE REPLI RESTE ECRIT : si la jointure ne trouve rien — un
	         libelle neuf au catalogue —, on emet `award_cat` tel quel, comme
	         avant. La page perd une periode, elle n'invente pas un nœud.

	   Le dixieme a ete ajoute le 2026-08-06 au soir, EN FIN d'enregistrement
	   comme tous les precedents :
	     - sous_categorie : le LIBELLE, pas le code. `imeb_music.award_cat_2`
	                        est un entier de 1 a 12 dont le vocabulaire
	                        n'existe que dans le code (voir
	                        php/sous_categories.php) ; le traduire ICI evite
	                        d'en poser une TROISIEME copie dans
	                        js/categories.js. Chaine vide pour les 575 oeuvres
	                        primees qui n'ont pas de sous-categorie — le
	                        concours n'en a eu qu'a partir de 2000, et sur
	                        cinq categories seulement.

	   Le onzieme a ete ajoute le 2026-08-08, EN FIN d'enregistrement comme
	   tous les precedents :
	     - award_price   : le CODE de la distinction, pas son libelle.

	   ⚠️ IL SERT A UNE SEULE CHOSE, ET C'EST LA MEME QU'EN §24.15 : deux
	      valeurs de `imeb_music.award_cat` ne sont PAS des categories.
	      « Magistere » (code 500) et « Residence » (code 600) sont des
	      DISTINCTIONS, decernees a travers les categories — le Magistere
	      couronne l'edition entiere, la Residence est un sejour et non une
	      recompense de rang. Le Repertoire general les inscrit pourtant dans
	      la colonne de categorie, et `imeb_categorie` leur donne meme une
	      ligne (8 et 9, bornes 1988-2008 et 1988-2009). 146 oeuvres sur 727
	      sont concernees, sur vingt et une editions.

	   ⚠️ ET LE TEST PORTE SUR LE CODE, JAMAIS SUR LE LIBELLE — c'est la regle
	      posee pour js/aww.js le 2026-08-08 : le code est stable, `award_cat`
	      est une chaine que quelqu'un corrigera un jour. UNE oeuvre de 2005
	      porte un Magistere avec `award_cat = 'Trivium A'`, c'est-a-dire une
	      VRAIE categorie : elle doit la garder. Le marquage n'a donc lieu que
	      si le libelle REPETE la distinction.

	   ATTENTION : la longueur d'enregistrement (11) est ecrite en dur dans la
	   boucle de lecture de js/categories.js ; les deux doivent bouger
	   ensemble. Aucun champ ne contient de %, le separateur reste sur. */

	require_once(__DIR__ . '/sous_categories.php');

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
							imeb_music.award_cat_2,
							imeb_music.award_price,
							imeb_categorie.libelle AS cat_canon,
							imeb_categorie.annee_debut AS cat_debut,
							imeb_categorie.annee_fin AS cat_fin
							FROM imeb_music
							INNER JOIN imeb_artist
							ON imeb_music.id_artist = imeb_artist.id
							LEFT JOIN imeb_categorie
							ON imeb_categorie.libelle = imeb_music.award_cat
							OR imeb_categorie.libelle_alt = imeb_music.award_cat
							WHERE imeb_music.award_year IS NOT NULL
							ORDER BY imeb_music.award_year ASC,
							imeb_music.award_price ASC,
							imeb_artist.name ASC');

		$arr = array();

		while($row = $sth->fetch()) {

			$year = $row['award_year'];

			//⚠️ LE NŒUD DU DIAGRAMME EST LE LIBELLE CANONIQUE, PAS CELUI DU
			//   CATALOGUE. Deux libelles du Repertoire general — « Electro-
			//   acoustique » (1985-1991) et « Studio » (1993-1998) — nomment
			//   une seule categorie : les deux constats qui la definissent,
			//   1990 et 1993, l'appellent « Prix de la Musique Electro-
			//   acoustique de Studio ». Emis tels quels, ils feraient DEUX
			//   nœuds la ou il n'y a qu'une categorie.
			//   Repli inchange quand la jointure ne trouve rien : on garde ce
			//   que le catalogue ecrit.
			$category = $row['cat_canon'];
			if($category === null || $category === '') $category = $row['award_cat'];
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

			//sous-categorie : le libelle, ou la chaine vide. La table est dans
			//php/sous_categories.php, seul endroit du projet ou ce vocabulaire
			//doive vivre.
			$sousCat   = libelle_sous_categorie($row['award_cat_2']);

			//code de la distinction. Chaine vide plutot que NULL, comme les
			//autres : le champ garde sa place dans l'enregistrement.
			$prix      = $row['award_price'] !== null ? $row['award_price'] : '';

			array_push($arr, $year, $category, $name, $firstName, $isni, $row['id_artist'], $editions, $catDebut, $catFin, $sousCat, $prix);
		}

		echo implode('%', $arr);
	}

?>
