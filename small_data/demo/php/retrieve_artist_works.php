<?php
/* =========================================================================
   retrieve_artist_works.php — les oeuvres d'UNE fiche d'artiste
   -------------------------------------------------------------------------
   Alimente la colonne centrale de isni_tools.php. Renvoie du JSON, en
   lecture seule.

   Pourquoi : l'outil d'alignement propose des candidats ISNI accompagnes des
   titres releves dans les referentiels (ISNI SRU, data.bnf.fr). Reconnaitre
   le bon compositeur suppose de comparer ces titres a ceux que la base
   possede deja — jusqu'ici il fallait ouvrir une autre page pour les lire.
   Cet endpoint les sert a cote des candidats, et js/isni_tools.js s'en sert
   aussi pour SIGNALER les titres communs aux deux listes.

   Difference volontaire avec les endpoints publics : AUCUN filtre sur
   `statut`. php/retrieve_cat.php et php/retrieve_data.php excluent
   `hors_repertoire` parce qu'ils alimentent le site ; ici on veut voir tout
   ce que la base porte, y compris ce qui est masque au public — une oeuvre
   hors repertoire reste un indice d'identification parfaitement valable.
   Elle est simplement marquee comme telle dans la reponse.

   Parametres :
     id    identifiant de imeb_artist (obligatoire)

   Reponse : {status, id, total, works:[{id, title, duration, misam,
             editions, award_year, award_price, award_cat, euphonies,
             statut}]}

   Ordre : par MISAM croissant, qui est un registre d'entree chronologique
   (cf. §H.3 du recapitulatif de nettoyage) — les oeuvres se lisent donc dans
   l'ordre ou elles sont entrees au fonds. Les oeuvres sans MISAM ferment la
   liste, triees par titre.
   ========================================================================= */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, max-age=0');

$id = isset($_REQUEST['id']) ? intval($_REQUEST['id']) : 0;

if($id <= 0){
	echo json_encode(array(
		'status'  => 'error',
		'message' => 'Parametre id manquant ou invalide.',
		'id'      => 0,
		'total'   => 0,
		'works'   => array()
	), JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
	exit;
}

require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

/* Parametre lie, jamais concatene — meme regle que retrieve_no_isni.php. */
$sth = $dbh->prepare(
	"SELECT id, title, duration, misam, editions,
	        award_year, award_price, award_cat, euphonies, statut
	   FROM imeb_music
	  WHERE id_artist = ?
	  ORDER BY (misam IS NULL), misam ASC, title ASC"
);

$works = array();

if($sth && $sth->execute(array($id))){
	while($row = $sth->fetch()){
		$works[] = array(
			'id'          => (int)$row['id'],
			'title'       => $row['title'],
			'duration'    => $row['duration'] ? $row['duration'] : '',
			'misam'       => $row['misam'] !== null ? (int)$row['misam'] : null,
			'editions'    => $row['editions'] ? $row['editions'] : '',
			'award_year'  => $row['award_year'] !== null ? (int)$row['award_year'] : null,
			'award_price' => $row['award_price'] !== null ? (int)$row['award_price'] : null,
			'award_cat'   => $row['award_cat'] ? $row['award_cat'] : '',
			'euphonies'   => (int)$row['euphonies'],
			'statut'      => $row['statut']
		);
	}
}

echo json_encode(array(
	'status' => 'ok',
	'id'     => $id,
	'total'  => count($works),
	'works'  => $works
), JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
