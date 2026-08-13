<?php

	/* LES DOUZE SOUS-CATEGORIES DU CONCOURS, EN UN SEUL ENDROIT.

	   `imeb_music.award_cat_2` est un code entier de 1 a 12. Il n'a AUCUNE
	   table dans la base — pas d'`imeb_sous_categorie` a cote d'`imeb_categorie`
	   —, et son vocabulaire n'a donc jamais existe qu'en clair dans le code.

	   IL Y EXISTAIT DEUX FOIS quand ce fichier a ete ecrit, le 2026-08-06 :
	      dans `php/retrieve_cat.php` (fonction set_sub_cat, qui sert les pages
	      Catalogue et Euphonies) et dans `js/aww.js` (traduction cote client,
	      qui sert la page des oeuvres primees). Les deux portaient deja la
	      note « les deux tables doivent rester synchronisees » — ce qui est
	      l'aveu d'un probleme, pas sa solution.

	      La page Categories en avait besoin d'une TROISIEME. Elle prend
	      celle-ci a la place, et les deux autres sont a y verser (§19).

	   CE N'EST PAS UN CODE-BOOK QUI REVIENT. Le §16.5 et le §20.13 ont
	      chasse du code les traductions de valeurs qui appartenaient a la
	      DONNEE — `award_label`, `award_rank`. Ici la donnee n'existe nulle
	      part ailleurs : le code EST la seule source. Le mettre a un seul
	      endroit est tout ce qu'on peut faire tant qu'une table
	      `imeb_sous_categorie` n'est pas creee, et c'est cette table qui
	      reglerait vraiment la question.

	   Les libelles sont ceux du reglement du concours, en francais, non
	   traduits — comme les libelles de `imeb_categorie`. */

	function libelle_sous_categorie($code){

		$table = array(
			1  => "Avec dispositifs et/ou instruments",
			2  => "Esthétique formelle",
			3  => "Esthétique à programme",
			4  => "Danse ou théâtre",
			5  => "Installation ou environnement sonore et musical",
			6  => "Multimédia",
			7  => "Art sonore électroacoustique",
			8  => "Avec instruments",
			9  => "Sans instruments",
			10 => "tendance netart",
			11 => "tendance création",
			12 => "tendance performance"
		);

		//  Le zero et le NULL disent la meme chose — pas de sous-categorie —
		//  et rendent la chaine vide, jamais un libelle invente. Un code
		//  inconnu fait de meme : la page perd une information, elle n'en
		//  fabrique pas.
		$c = (int) $code;
		return isset($table[$c]) ? $table[$c] : '';
	}

?>
