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
	}

	//-------------------------------- functions --------------------------------------//

	function retrieveAllCompositionsFrom($aId){

		require("../access/connexion.php");

		$sth = $dbh->query('SELECT artist.firstName, artist.name
							, music.id, music.title, music.duration, music.misam, music.editions
							FROM artist
							INNER JOIN music
							ON artist.id = music.id_artist
							WHERE artist.id =' . $aId);

		$sth->setFetchMode(PDO::FETCH_ASSOC);

		$str_all = "";
	
		while($row = $sth->fetch()) {
			if(strlen($str_all)>0) $str_all .=  "%";
			$str_all .= $row['id'] . "%" . $row['title'] . "%" . $row['duration'] . "%" . $row['misam'] . "%" . $row['editions'];
		}
		// if($str_all=="")$str_all="no result";
		echo $str_all;

	}

	function retrieveAllComposers($cId, $y, $v){

		require("../access/connexion.php");

		$ed_XXXX="ed_".$y;

		$sth = $dbh->query('SELECT artist.id AS a_id, artist.firstName, artist.name, ' . $ed_XXXX . ' 
							FROM artist
							INNER JOIN country
							ON artist.id_country = country.id
							INNER JOIN edition
							ON artist.id = edition.artist_id
							WHERE country.id =' . $cId);

		$sth->setFetchMode(PDO::FETCH_ASSOC);

		$str_all = "";
	
		while($row = $sth->fetch()) {
			if(strlen($str_all)>0) $str_all .=  "%";
			$str_all .= $row['a_id'] . "%" . $row['firstName'] . "%" . $row['name'] . "%" . $row[$ed_XXXX];
		}

		echo $str_all;
	}

?>