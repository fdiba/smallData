<?php

	function provenanceCharger($dbh, $clause = '', $params = array()){

		$conc = array();
		$fest = array();

		$sthC = $dbh->prepare('SELECT mc.id_music, mc.annee, s.code
								FROM imeb_music_concours mc
								INNER JOIN imeb_music m ON m.id = mc.id_music
								INNER JOIN imeb_source_secondaire s
									ON s.id = mc.id_source_secondaire' . $clause);
		$sthC->execute($params);
		$sthC->setFetchMode(PDO::FETCH_ASSOC);
		while($r = $sthC->fetch()){
			$conc[(int)$r['id_music']][(string)$r['annee']][$r['code']] = true;
		}

		$sthF = $dbh->prepare('SELECT mf.id_music, mf.annee, s.code
								FROM imeb_music_festival mf
								INNER JOIN imeb_music m ON m.id = mf.id_music
								INNER JOIN imeb_source_secondaire s
									ON s.id = mf.id_source_secondaire' . $clause);
		$sthF->execute($params);
		$sthF->setFetchMode(PDO::FETCH_ASSOC);
		while($r = $sthF->fetch()){
			$fest[(int)$r['id_music']][(string)$r['annee']][$r['code']] = true;
		}

		return array($conc, $fest);
	}

	function provenanceParArtiste($dbh, $aId){
		return provenanceCharger($dbh, ' WHERE m.id_artist = ?', array((int)$aId));
	}

	function provenanceTout($dbh){
		return provenanceCharger($dbh);
	}

	function provenanceOeuvre($id, $editions, $award, $conc, $fest){

		$c = isset($conc[$id]) ? $conc[$id] : array();
		$f = isset($fest[$id]) ? $fest[$id] : array();

		$annees = array();
		foreach($c as $y => $v) $annees[(string)$y] = true;
		foreach($f as $y => $v) $annees[(string)$y] = true;

		foreach(explode(',', (string)$editions) as $y){
			$y = trim($y);
			if(ctype_digit($y)) $annees[$y] = true;
		}

		$aw = trim((string)$award);
		if(ctype_digit($aw)) $annees[$aw] = true;

		$annees = array_keys($annees);
		sort($annees, SORT_NUMERIC);

		$codes = array();

		foreach($annees as $y){

			$y = (string)$y;

			$primee   = ($aw !== '' && $aw === $y);
			$concours = isset($c[$y]) || $primee;
			$festival = isset($f[$y]);

			if($concours && $festival)      $etat = 2;
			elseif($concours)               $etat = 1;
			elseif($festival)               $etat = 3;
			else                            $etat = 4;

			$src = array();
			if(isset($c[$y])) foreach($c[$y] as $k => $v) $src[$k] = true;
			if(isset($f[$y])) foreach($f[$y] as $k => $v) $src[$k] = true;

			$a = isset($src['a_phonoa']);
			$b = isset($src['b1_phonob']);

			if($primee)         $piece = 'a';
			elseif($a && $b)    $piece = 'd';
			elseif($a)          $piece = 'r';
			elseif($b)          $piece = 'g';
			else                $piece = 'n';

			$codes[] = $y . '=' . $etat . $piece;
		}

		return array(implode(', ', $annees), implode(',', $codes));
	}

?>
