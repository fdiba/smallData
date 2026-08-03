<?php

	/* Donnees du diagramme de flux (page Categories) generees depuis la base
	   au lieu du fichier data/smallData.csv.
	   Renvoie, pour chaque oeuvre primee, l'enregistrement de SIX champs
	       annee % categorie % nom % prenom % isni % id_artist
	   separe par des %, dans l'ordre chronologique (plus ancien d'abord).

	   Les trois derniers champs ont ete ajoutes EN FIN d'enregistrement pour
	   ne decaler aucun index existant :
	     - prenom     : le diagramme n'affichait que le patronyme ;
	     - isni       : rend le nom cliquable (fiche ISNI) quand il est
	                    renseigne — 236 des 508 compositeurs primes ;
	     - id_artist  : identifie le noeud compositeur. C'est lui, et non le
	                    nom, qui distingue les homonymes (Berger, Kokoras, Lee,
	                    Schubert, Thompson, Tremblay, Freedman sont chacun
	                    portes par deux compositeurs primes distincts).
	   ATTENTION : la longueur d'enregistrement (6) est ecrite en dur dans la
	   boucle de lecture de js/categories.js ; les deux doivent bouger
	   ensemble. */

	retrieve_categories();

	function retrieve_categories(){

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		//aucune entree utilisateur : requete simple
		$sth = $dbh->query('SELECT imeb_music.award_year,
							imeb_music.award_cat,
							imeb_artist.name,
							imeb_artist.firstName,
							imeb_artist.isni,
							imeb_artist.id AS id_artist
							FROM imeb_music
							INNER JOIN imeb_artist
							ON imeb_music.id_artist = imeb_artist.id
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

			array_push($arr, $year, $category, $name, $firstName, $isni, $row['id_artist']);
		}

		echo implode('%', $arr);
	}

?>
