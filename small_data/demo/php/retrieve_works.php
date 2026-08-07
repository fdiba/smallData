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
		//
		// TROIS SOURCES, depuis le 2026-08-04.
		//
		//   1. imeb_music    — l'oeuvre primee et archivee. Le cas normal.
		//   2. imeb_bande    — la distinction dont l'oeuvre n'est PAS au
		//                      fonds (« Happy end », 1974).
		//   3. imeb_non_attribution — le prix que le jury a refuse de
		//                      decerner. Ni oeuvre, ni laureat, ni bande.
		//
		// La troisieme est la plus etrange et la plus utile : elle fait
		// apparaitre un TROU a l'endroit exact ou il se trouve. « 1977,
		// Mixte, Prix 1, not awarded » se lit entre les categories voisines
		// et dit quelque chose que l'absence de ligne ne dirait pas — un
		// jury qui refuse de decerner a pris une decision, il n'a pas oublie.
		//
		// LE LIBELLE EST EN ANGLAIS — « not awarded » — comme tout le reste
		// de cette page : ses en-tetes (« first name », « country »,
		// « title »), son menu (« All works ») et ses messages. La citation
		// francaise du jury, elle, reste dans imeb_non_attribution.citation.
		//
		// Ces lignes n'ont ni compositeur ni pays : js/aww.js n'affiche que
		// ce qu'on lui donne, les cellules restent vides. L'identifiant est
		// tres negatif (-1000000 - id) pour ne heurter ni les identifiants
		// d'oeuvre ni ceux, deja negatifs, des distinctions de bande.
		//
		// DEUXIEME SOURCE : les distinctions qui ne tiennent pas a une oeuvre.
		//
		// La page a toujours ete construite sur imeb_music : une recompense y
		// est une COLONNE de l'oeuvre primee. Cela suppose que l'oeuvre soit au
		// fonds — et ce n'est pas toujours vrai. Le proces-verbal de 1974
		// attribue une mention speciale a « Happy end » d'Alexandre
		// Rabinovitch-Barakovsky, piece qui n'a jamais ete archivee : la
		// distinction existe, elle est attestee par un constat d'huissier, et
		// elle n'avait aucun endroit ou s'afficher.
		//
		// D'ou l'union avec imeb_distinction, qui s'accroche a la BANDE.
		// Le NOT EXISTS evite le double affichage : quand le laureat a bien une
		// oeuvre primee la meme annee — dix cas sur onze aujourd'hui —, c'est
		// la ligne du catalogue qui parle, plus riche (duree, MISAM, categorie).
		// Seule remonte ici la distinction qu'aucune oeuvre ne porte.
		//
		// L'identifiant est le NEGATIF de l'identifiant de bande : il ne peut
		// entrer en collision avec aucun id d'oeuvre, et son signe suffit a
		// dire d'ou vient la ligne. Meme convention que le -1 de la recherche
		// par nom dans overview.
		//
		// Le rang n'est joint au libelle que pour les libelles GENERIQUES
		// (« Prix », « Mention ») : « Mention speciale 3 » ne se dit pas.
		//
		// ⚠️ LES SELECTIONS NE SONT PAS DES RECOMPENSES — filtre du 2026-08-06.
		//
		// Un concours SELECTIONNE des oeuvres avant d'en primer quelques-unes.
		// Le constat de 1985 en nomme vingt-quatre — « Ont ete selctionnees au
		// 13eme Concours les oeuvres de : … » —, celui de 1973 en nomme deux.
		// Elles sont dans la base et doivent y rester : c'est une decision du
		// jury, attestee par un huissier, et rien d'autre ne la porte.
		//
		// MAIS CETTE PAGE LISTE DES OEUVRES PRIMEES, et une selection n'en est
		// pas une. Les seize de 1985 y sont apparues le jour de son versement,
		// parce que leurs deposants n'ont pas d'oeuvre primee cette annee-la et
		// qu'ils passaient donc par cette branche.
		//
		// LE FILTRE PORTE SUR LE TYPE, PAS SUR LE LIBELLE. `imeb_distinction`
		// a l'enum ('prix','selection','mention') depuis sa creation, et
		// `selection` y attendait sans emploi — le §7.4 du chantier l'avait
		// meme reserve a ce cas, avant que le §16.3 ne verse les deux bandes
		// de 1973 en `mention`. Les deux paragraphes se contredisaient ; la
		// question posee par cette page tranche, et DB/type_selection.sql
		// remet les dix-huit lignes a `selection`.
		//
		// Filtrer sur le libelle aurait remis un code-book dans le PHP —
		// « Oeuvre selectionnee par le jury », « Bande selectionnee par le
		// jury », et le prochain mot du prochain constat. Le type classifie,
		// le libelle cite la source : c'est le type qu'on interroge.
		//
		// LE DEUXIEME CHAMP SUIT LE MEME CODE-BOOK QUE LE CATALOGUE — corrige
		// le 2026-08-04. Il valait « 100 + rang » pour une mention, la ou
		// imeb_music.award_price ecrit 100 tout court quel que soit le rang.
		// C'etait une ruse de tri, du temps ou le rang ne voyageait pas dans
		// le flux : elle ordonnait les mentions entre elles. Depuis que le
		// rang s'y lit en clair, elle NUIT — une mention 3 codee 103 se
		// classait apres toutes les mentions du catalogue, codees 100, au lieu
		// de s'intercaler a son rang. Deux encodages pour une meme notion,
		// la panne habituelle : il n'y en a plus qu'un, et js/aww.js trie sur
		// le rang lui-meme.
		//
		// LA CATEGORIE DE LA DEUXIEME SOURCE — corrige le 2026-08-04.
		//
		// Cette branche servait NULL en categorie, et la ligne s'affichait sans
		// categorie ni sous-categorie. Le defaut s'est vu sur Ricardo
		// Mandolini, mention 3 de musique analogique en 1979 : seul laureat de
		// l'edition dont l'oeuvre n'est pas au catalogue, donc seul a passer
		// par ici, et le seul des vingt-deux a apparaitre sans categorie.
		//
		// C'etait un oubli de recopie, pas un manque de donnee :
		// imeb_distinction.id_categorie est renseigne depuis 1977, il n'etait
		// simplement pas lu. Le LEFT JOIN (et non INNER) parce que les editions
		// d'avant 1977 n'ont pas de categorie du tout — une distinction sans
		// categorie doit rester affichee, colonne vide.
		//
		// A RETENIR : cette branche est peu frequentee — deux lignes sur
		// plusieurs milliers aujourd'hui — et c'est justement pourquoi ses
		// colonnes se verifient mal. Chaque champ qu'on ajoute a la premiere
		// source doit etre relu ici.
		$sth = $dbh->query('SELECT imeb_music.award_year, imeb_music.award_price,
							imeb_music.award_label, imeb_music.award_rank,
							imeb_music.award_label_2,
							imeb_music.award_cat, imeb_music.award_cat_2, imeb_music.euphonies,
							imeb_music.title, imeb_music.duration, imeb_music.misam,
							imeb_artist.firstName, imeb_artist.name, imeb_music.id,
							imeb_artist.isni AS isni,
							COALESCE(NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name) AS ctry,
							co.coauteurs AS coauteurs
							FROM imeb_music
							INNER JOIN imeb_artist
							ON imeb_music.id_artist = imeb_artist.id
							LEFT JOIN imeb_country
							ON imeb_artist.id_country = imeb_country.id
							LEFT JOIN (
								SELECT b2.id_music AS m_id,
									GROUP_CONCAT(CONCAT(
											TRIM(CONCAT(COALESCE(a2.firstName, \'\'), \' \', a2.name)),
											\'|\', COALESCE(a2.isni, \'\'))
										ORDER BY ba2.rang SEPARATOR \';\') AS coauteurs
								FROM imeb_bande b2
								INNER JOIN imeb_bande_artiste ba2
									ON ba2.id_bande = b2.id AND ba2.rang > 1
								INNER JOIN imeb_artist a2 ON a2.id = ba2.id_artist
								WHERE b2.id_music IS NOT NULL
								GROUP BY b2.id_music
							) co ON co.m_id = imeb_music.id

							UNION ALL

							SELECT c.annee,
							CASE WHEN d.type = \'prix\' THEN d.rang
								ELSE 100 END,
							d.libelle,
							CASE WHEN d.libelle IN (\'Prix\', \'Mention\') THEN d.rang ELSE NULL END,
							NULL,
							catd.libelle, NULL, 0,
							b.titre_declare, NULL, NULL,
							a.firstName, a.name, -b.id,
							a.isni,
							COALESCE(NULLIF(pays.c_name_en, \'\'), pays.c_name),
							cod.coauteurs
							FROM imeb_distinction d
							INNER JOIN imeb_bande b ON b.id = d.id_bande
							INNER JOIN imeb_pv p ON p.id = b.id_pv
							INNER JOIN imeb_concours c ON c.id = p.id_concours
							LEFT JOIN imeb_bande_artiste ba ON ba.id_bande = b.id AND ba.rang = 1
							LEFT JOIN imeb_artist a ON a.id = ba.id_artist
							LEFT JOIN imeb_country pays ON a.id_country = pays.id
							LEFT JOIN imeb_categorie catd ON catd.id = d.id_categorie
							LEFT JOIN (
								SELECT ba3.id_bande AS b_id,
									GROUP_CONCAT(CONCAT(
											TRIM(CONCAT(COALESCE(a3.firstName, \'\'), \' \', a3.name)),
											\'|\', COALESCE(a3.isni, \'\'))
										ORDER BY ba3.rang SEPARATOR \';\') AS coauteurs
								FROM imeb_bande_artiste ba3
								INNER JOIN imeb_artist a3 ON a3.id = ba3.id_artist
								WHERE ba3.rang > 1
								GROUP BY ba3.id_bande
							) cod ON cod.b_id = b.id
							WHERE d.type <> \'selection\'
							AND NOT EXISTS (
								SELECT 1 FROM imeb_bande_artiste ba4
								INNER JOIN imeb_music m ON m.id_artist = ba4.id_artist
													AND m.award_year = c.annee
								WHERE ba4.id_bande = b.id)

							UNION ALL

							SELECT c.annee, n.rang,
							n.libelle,
							n.rang,
							NULL,
							cat.libelle, NULL, 0,
							\'not awarded\', NULL, NULL,
							NULL, NULL, -1000000 - n.id,
							NULL,
							NULL,
							NULL
							FROM imeb_non_attribution n
							INNER JOIN imeb_pv p2 ON p2.id = n.id_pv
							INNER JOIN imeb_concours c ON c.id = p2.id_concours
							LEFT JOIN imeb_categorie cat ON cat.id = n.id_categorie');

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

			// 16e champ : LES CO-AUTEURS, ajoute le 2026-08-07.
			//
			// `imeb_music.id_artist` est un entier UNIQUE : le catalogue n'a
			// jamais connu la co-signature. `imeb_bande_artiste` la porte
			// depuis 1981 (§13.2), et depuis le 2026-08-07 `imeb_bande.id_music`
			// relie les deux (§22.9) — c'est ce lien qui rend la requete
			// ci-dessus possible, et il n'existe que pour 1986.
			//
			// TROIS BANDES SONT CONCERNEES : 94 (De Clercq / Van Helvert),
			// 149 (Harrison / Doherty) et 226 (Schryer / Scheidt), toutes de
			// 1986 — les PREMIERES bandes co-signees distinguees du corpus.
			//
			// ⚠️ LE CHAMP EST VIDE PARTOUT AILLEURS, et c'est normal : la
			//    colonne se masque toute seule quand la selection ne porte
			//    aucune oeuvre co-signee (masquerColonnesVides, §21.18).
			//
			// ⚠️ C'EST UNE JOINTURE SUR UNE TABLE DERIVEE, ET NON UNE
			//    SOUS-REQUETE CORRELEE — corrige le 2026-08-07, une heure
			//    apres l'avoir ecrite dans l'autre sens.
			//
			//    La premiere branche de cette union N'A PAS DE WHERE : elle
			//    lit les 6 772 lignes de imeb_music et c'est le PHP qui
			//    ecarte les non primees ($award_year != null). Une
			//    sous-requete correlee s'y executait donc SIX MILLE SEPT CENT
			//    SOIXANTE-DOUZE FOIS, pour dix-neuf lignes de resultat. La
			//    table derivee, elle, est calculee UNE FOIS et jointe.
			//
			//    Mesure sur le banc, base locale : 44 ms sans co-auteurs,
			//    64 ms avec la sous-requete correlee, 45 ms avec la jointure.
			//    Le surcout tombe de 45 % a 2 %. Sur le serveur, ou la base
			//    est sur un HOTE DISTANT, l'ecart etait bien plus visible —
			//    c'est Florent qui l'a signale, pas une mesure.
			//
			//    ⚠️ ET LA TABLE DERIVEE FILTRE SUR `ba2.rang > 1`, non sur
			//       « different de imeb_music.id_artist » : c'est ce qui la
			//       rend independante de la ligne courante, donc calculable
			//       une fois. Cela SUPPOSE que l'auteur du catalogue soit
			//       l'auteur de rang 1 de la bande liee — vrai pour les
			//       dix-neuf liens de 1986, et VERIFIE PAR UN CONTROLE
			//       PERMANENT (§5.7 de DB/controles_toutes_editions.sql),
			//       parce qu'une hypothese qui ne se controle pas finit par
			//       etre fausse en silence.
			//
			// ⚠️ LE CHAMP PORTE LE NOM **ET L'ISNI** DE CHAQUE CO-AUTEUR
			//    depuis le 2026-08-07, pour que son nom soit cliquable comme
			//    celui du compositeur principal. La forme est
			//    « Nom|ISNI;Nom|ISNI » : point-virgule entre co-auteurs,
			//    barre verticale entre le nom et l'ISNI, ISNI VIDE quand la
			//    fiche n'en porte pas — c'est le cas des trois co-auteurs de
			//    1986 aujourd'hui, et le lien apparaitra le jour ou la
			//    campagne ISNI les atteindra, sans toucher au code.
			//
			//    ⚠️ LES DEUX SEPARATEURS ONT ETE VERIFIES SUR LA BASE, pas
			//       choisis au hasard : AUCUNE des 3 258 fiches ne porte
			//       « | », « ; » ni « % » dans son nom ou son prenom. Le
			//       troisieme est le separateur d'enregistrement du flux
			//       lui-meme — le seul dont la presence casserait la page
			//       entiere, et il n'apparait pas.
			$coauteurs = isset($row['coauteurs']) && $row['coauteurs'] !== null
						? $row['coauteurs'] : '';

			if($award_year!=null){

				array_push($arr, $award_year, $award_price, $misam, $firstName, $name, $title, $duration, $id, $award_cat,
							$award_cat2, $ctry, $isni, $award_label, $award_rank, $award_label2,
							$coauteurs);

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