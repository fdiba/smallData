<?php

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
