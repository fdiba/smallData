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
	} elseif ($case==12){
		pvProvenance();
	} elseif($case==28){
		$terms = $_POST['terms'];
		retrieveAllComposersNamed($terms);
	}

	function viewAll(){
		return isset($_POST['v']) && $_POST['v'] === 'all';
	}

	function maskName($txt){
		$out = array();
		foreach(preg_split('/\s+/u', trim((string)$txt), -1, PREG_SPLIT_NO_EMPTY) as $mot){
			$out[] = preg_replace('/(?<=.)./u', '*', $mot);
		}
		return implode(' ', $out);
	}

	function retrieveAllComposersNamed($str){

		$terms = explode(' ', trim($str));

		$conditions = array();
		$params = array();

		foreach($terms as $term){
			if($term==='') continue;
			$conditions[] = '(a.name LIKE ? OR a.firstName LIKE ?)';
			$params[] = '%' . $term . '%';
			$params[] = '%' . $term . '%';
		}

		if(sizeof($conditions)<1) return;

		$req = 'SELECT a.id, a.firstName, a.name,
					(NOT EXISTS(SELECT 1 FROM imeb_participation p WHERE p.id_artist = a.id)
					 AND NOT EXISTS(SELECT 1 FROM imeb_music m WHERE m.id_artist = a.id)
					 AND EXISTS(SELECT 1 FROM imeb_festival_participation f WHERE f.id_artist = a.id)
					) AS fest
				FROM imeb_artist a WHERE '
				. implode(' OR ', $conditions);

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		$sth = $dbh->prepare($req);
		$sth->execute($params);

		$arr= array();
		$results="";

		while($row = $sth->fetch()) {
			$id=$row['id'];
			$firstName=$row['firstName'];
			$name=$row['name'];
			$fest=(int)$row['fest'];
			array_push($arr, $id, $firstName, $name, $fest);
		}

		if(sizeof($arr)>0){
			for($i=0; $i<sizeof($arr); $i++){

				if($i<sizeof($arr)-1)$results.=$arr[$i].'%';
				else $results.=$arr[$i];

			}
		}

		echo $results;

	}

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

		$sth = $dbh->query('SELECT imeb_music.id, imeb_music.id_artist
							FROM imeb_music
							WHERE imeb_music.statut <> \'hors_repertoire\'');

		$arr= array();
		while($row = $sth->fetch()) {
			$id=$row['id_artist'];
			if(isset($arr[$id]))$arr[$id]+=1;
			else $arr[$id]=1;
		}

		$numResults;

		$sth = $dbh->query('SELECT imeb_artist.id AS artist_id,
								COALESCE(NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name, \'Unknown\') AS ctry,
								COALESCE(imeb_country.id, 0) AS c_id,
								COALESCE(NULLIF(imeb_country.iso3, \'\'), NULLIF(imeb_country.iso2, \'\'), NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name, \'UNK\') AS iso,
								GROUP_CONCAT(imeb_participation.annee
											 ORDER BY imeb_participation.annee) AS editions

							FROM imeb_artist
							LEFT JOIN imeb_country
							ON imeb_artist.id_country = imeb_country.id
							INNER JOIN imeb_participation
							ON imeb_participation.id_artist = imeb_artist.id
							GROUP BY imeb_artist.id,
									 imeb_country.id, imeb_country.c_name_en,
									 imeb_country.c_name, imeb_country.iso3,
									 imeb_country.iso2

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

			$str_all .= ($row['editions'] === null ? '' : $row['editions']);

			$str_all .= "%" . $row['iso'];
		}
		$dbh=null;
		echo $str_all;
	}
	function retrieveAllCompositionsFrom02($aId){

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		$result = "no result";

		$sth = $dbh->prepare('SELECT imeb_artist.firstName, imeb_artist.name, imeb_artist.isni,
							COALESCE(NULLIF(imeb_country.iso3, \'\'), NULLIF(imeb_country.iso2, \'\'), NULLIF(imeb_country.c_name_en, \'\'), imeb_country.c_name) AS \'ctry\',
							COALESCE(NULLIF(orig.iso3, \'\'), NULLIF(orig.iso2, \'\'), NULLIF(orig.c_name_en, \'\'), orig.c_name) AS \'origin\',
							GROUP_CONCAT(imeb_participation.annee
										 ORDER BY imeb_participation.annee) AS editions

						FROM imeb_artist
						LEFT JOIN imeb_country
						ON imeb_artist.id_country = imeb_country.id
						LEFT JOIN imeb_country AS orig
						ON imeb_artist.id_country_origin = orig.id
						LEFT JOIN imeb_participation
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

			$editions = ($row['editions'] === null || $row['editions'] === '')
						? array() : explode(',', $row['editions']);

			$str_editions = implode(", ", $editions);

			$sthP = $dbh->prepare('SELECT award_year FROM imeb_music WHERE id_artist = ?');
			$sthP->execute(array((int)$aId));
			$sthP->setFetchMode(PDO::FETCH_ASSOC);

			$aw = array();
			while($w = $sthP->fetch()){
				$y = trim((string)$w['award_year']);
				if(ctype_digit($y)) $aw[$y] = true;
			}

			$sthF = $dbh->prepare('SELECT DISTINCT annee FROM imeb_festival_participation
									WHERE id_artist = ?');
			$sthF->execute(array((int)$aId));
			$sthF->setFetchMode(PDO::FETCH_ASSOC);

			$fe = array();
			while($f = $sthF->fetch()) $fe[(string)$f['annee']] = true;

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

				if($q['source'] === 'constat')                             $p = 'c';
				elseif(isset($aw[$y]))                                     $p = 'a';
				elseif($q['source'] === 'liste' || (int)$q['cite_par_liste'] === 1) $p = 'l';
				elseif($c === 3)                                           $p = 'o';
				else                                                       $p = 't';

				$prov[$y] = $c . $p;
			}

			foreach($fe as $y => $v){
				if(!isset($prov[$y])) $prov[$y] = '3o';
			}

			$annees = array();
			foreach($editions as $y) $annees[(string)$y] = true;
			foreach($fe as $y => $v) $annees[(string)$y] = true;
			$annees = array_keys($annees);
			sort($annees, SORT_NUMERIC);

			$str_editions = implode(", ", $annees);

			$classes = array();
			foreach($annees as $y){
				$y = (string)$y;
				$classes[] = $y . '=' . (isset($prov[$y]) ? $prov[$y] : '1l');
			}
			$str_festival = implode(",", $classes);

			$result = $row['firstName'] . '%' . $row['name'] . '%' . $row['ctry']
					  . '%' . $str_editions
					  . '%' . ($row['isni'] === null ? '' : $row['isni'])
					  . '%' . ($row['origin'] === null ? '' : $row['origin'])
					  . '%' . $str_festival;

		}

		echo $result;

	}
	function retrieveAllCompositionsFrom03($aId){

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

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

		$y = (int)$y;
		if($y<1973 || $y>2009) return;

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
							LEFT JOIN imeb_country
							ON imeb_artist.id_country = imeb_country.id
							LEFT JOIN imeb_country AS orig
							ON imeb_artist.id_country_origin = orig.id
							WHERE COALESCE(imeb_country.id, 0) = ?
							AND EXISTS(SELECT 1 FROM imeb_participation p2
										WHERE p2.id_artist = imeb_artist.id)');

		$sth->execute(array($y, (int)$cId));

		$sth->setFetchMode(PDO::FETCH_ASSOC);

		$str_all = "";

		$tout = viewAll();

		while($row = $sth->fetch()) {

			$a_id      = $row['a_id'];
			$firstName = $row['firstName'];
			$name      = $row['name'];
			$isni      = ($row['isni']   === null ? '' : $row['isni']);
			$origin    = ($row['origin'] === null ? '' : $row['origin']);

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
