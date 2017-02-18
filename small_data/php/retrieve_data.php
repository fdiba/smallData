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
	} elseif($case==28){ //overview.js
		$terms = $_POST['terms'];
		retrieveAllComposersNamed($terms);
	}

	//-------------------------------- functions --------------------------------------//

	function retrieveAllComposersNamed($str){

		$t=$str;

		$terms = explode(' ', $str);
		$where_str="";

		$where_str = ' WHERE name LIKE \'%' . $terms[0] .'%\'
							 OR firstName LIKE \'%' . $terms[0] . '%\'';

		$req = 'SELECT id, firstName, name FROM imeb_artist';

		
		for ($j=0; $j < sizeof($terms); $j++) { 
			if($j==0){
				$where_str = ' WHERE name LIKE \'%' . $terms[$j] .'%\'
							 OR firstName LIKE \'%' . $terms[$j] . '%\'';	
			} else {
				$where_str = ' OR name LIKE \'%' . $terms[$j] .'%\'
							 OR firstName LIKE \'%' . $terms[$j] . '%\'';
			}

			$req .= $where_str;
		}


		require("../access/connexion.php");

		//---------------
		// SELECT id, firstName, name FROM artist WHERE name LIKE '%e%' 
		$sth = $dbh->query($req);

		$arr= array();
		$results="";


		while($row = $sth->fetch()) {
			$id=$row['id'];
			$firstName=$row['firstName'];
			$name=$row['name'];
			array_push($arr, $id, $firstName, $name);
		}

		if(sizeof($arr)>0){
			for($i=0; $i<sizeof($arr); $i++){
				
				if($i<sizeof($arr)-1)$results.=$arr[$i].'%';
				else $results.=$arr[$i];

			}
		}

		echo $results;

	}


	function queryDB(){

		require("../access/connexion.php");

		//---------------

		$sth = $dbh->query('SELECT imeb_music.id, imeb_music.id_artist
							FROM imeb_music');

		$arr= array();
		while($row = $sth->fetch()) {
			$id=$row['id_artist'];
			if(isset($arr[$id]))$arr[$id]+=1;
			else $arr[$id]=1;
		}

		//---------------

		$numResults;
		$years = array(1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009);

		$sth = $dbh->query('SELECT imeb_artist.id AS artist_id,
								imeb_country.c_name AS ctry, imeb_country.id AS c_id,
								imeb_edition.ed_1973, imeb_edition.ed_1974,
								imeb_edition.ed_1975, imeb_edition.ed_1976,
							   	imeb_edition.ed_1977, imeb_edition.ed_1978,
								imeb_edition.ed_1979, imeb_edition.ed_1980,
								imeb_edition.ed_1981, imeb_edition.ed_1982,
								imeb_edition.ed_1983, imeb_edition.ed_1984,
								imeb_edition.ed_1985, imeb_edition.ed_1986,
								imeb_edition.ed_1987, imeb_edition.ed_1988,
								imeb_edition.ed_1989, imeb_edition.ed_1990,
								imeb_edition.ed_1991, imeb_edition.ed_1992,
								imeb_edition.ed_1993, imeb_edition.ed_1994,
								imeb_edition.ed_1995, imeb_edition.ed_1996,
								imeb_edition.ed_1997, imeb_edition.ed_1998,
								imeb_edition.ed_1999, imeb_edition.ed_2000,
								imeb_edition.ed_2001, imeb_edition.ed_2002,
								imeb_edition.ed_2003, imeb_edition.ed_2004,
								imeb_edition.ed_2005, imeb_edition.ed_2006,
								imeb_edition.ed_2007, imeb_edition.ed_2008,
								imeb_edition.ed_2009
								
							FROM imeb_artist
							INNER JOIN imeb_country
							ON imeb_artist.id_country = imeb_country.id
							INNER JOIN imeb_edition
							ON imeb_artist.id = imeb_edition.artist_id
							');

		$sth->setFetchMode(PDO::FETCH_ASSOC);

		$str_all = "";
	
		while($row = $sth->fetch()) {

			if(strlen($str_all)>0) $str_all .=  "%";
			
			$aId=$row['artist_id'];
			
			$count=0;			
			if(isset($arr[$aId]))$count=$arr[$aId];

			$str_all .= $aId."%". $row['ctry']."%".$row['c_id']."%".$count."%";

			$hasBeenInit = false;

			for($i = 0; $i <sizeof($years); $i++){
				$column_name = 'ed_' . $years[$i];
				if ($row[$column_name]) {
					if($hasBeenInit) $str_all .=  "," . $years[$i];
					else {
						$str_all .=  $years[$i];
						$hasBeenInit = true;
					}
				}
			}
		}
		$dbh=null;
		echo $str_all;
	}
	function retrieveAllCompositionsFrom02($aId){ //only index case 5

		require("../access/connexion.php");		

		$years = array(1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009);

		$result = "no result";

		$sth = $dbh->query('SELECT imeb_artist.firstName, imeb_artist.name,
							imeb_country.c_name AS \'ctry\',
							imeb_edition.ed_1973, imeb_edition.ed_1974,
							imeb_edition.ed_1975, imeb_edition.ed_1976,
						   	imeb_edition.ed_1977, imeb_edition.ed_1978,
							imeb_edition.ed_1979, imeb_edition.ed_1980,
							imeb_edition.ed_1981, imeb_edition.ed_1982,
							imeb_edition.ed_1983, imeb_edition.ed_1984,
							imeb_edition.ed_1985, imeb_edition.ed_1986,
							imeb_edition.ed_1987, imeb_edition.ed_1988,
							imeb_edition.ed_1989, imeb_edition.ed_1990,
							imeb_edition.ed_1991, imeb_edition.ed_1992,
							imeb_edition.ed_1993, imeb_edition.ed_1994,
							imeb_edition.ed_1995, imeb_edition.ed_1996,
							imeb_edition.ed_1997, imeb_edition.ed_1998,
							imeb_edition.ed_1999, imeb_edition.ed_2000,
							imeb_edition.ed_2001, imeb_edition.ed_2002,
							imeb_edition.ed_2003, imeb_edition.ed_2004,
							imeb_edition.ed_2005, imeb_edition.ed_2006,
							imeb_edition.ed_2007, imeb_edition.ed_2008,
							imeb_edition.ed_2009
							
						FROM imeb_artist
						INNER JOIN imeb_country
						ON imeb_artist.id_country = imeb_country.id
						INNER JOIN imeb_edition
						ON imeb_artist.id = imeb_edition.artist_id
						WHERE imeb_artist.id = ' . $aId );

		$sth->setFetchMode(PDO::FETCH_ASSOC);

		while($row = $sth->fetch()) {

			$editions = array();
			for($i = 0; $i <sizeof($years); $i++){
				$column_name = 'ed_' . $years[$i];
				if ($row[$column_name]) array_push($editions, $years[$i]);
			}

			$str_editions = implode(", ", $editions);

			$result = $row['firstName'] . '%' . $row['name'] . '%' . $row['ctry']
					  . '%' . $str_editions;

		}

		echo $result;

	}
	function retrieveAllCompositionsFrom03($aId){

		require("../access/connexion.php");

		$sth = $dbh->query('SELECT imeb_artist.firstName, imeb_artist.name,
							imeb_music.id, imeb_music.title, imeb_music.duration,
							imeb_music.misam, imeb_music.editions
							FROM imeb_artist
							INNER JOIN imeb_music
							ON imeb_artist.id = imeb_music.id_artist
							WHERE imeb_artist.id =' . $aId);

		$sth->setFetchMode(PDO::FETCH_ASSOC);

		$str_all = "";
	
		while($row = $sth->fetch()) {
			if(strlen($str_all)>0) $str_all .=  "%";
			$str_all .= $row['id'] . "%" . $row['title'] . "%" . $row['duration'] . "%" . $row['misam'] . "%" . $row['editions'] . "%" . $row['firstName'] . "%" . $row['name'];
		}

		echo $str_all;

	}
	function retrieveAllCompositionsFrom($aId){

		require("../access/connexion.php");

		$sth = $dbh->query('SELECT imeb_artist.firstName, imeb_artist.name,
							imeb_music.id, imeb_music.title, imeb_music.duration,
							imeb_music.misam, imeb_music.editions
							FROM imeb_artist
							INNER JOIN imeb_music
							ON imeb_artist.id = imeb_music.id_artist
							WHERE imeb_artist.id =' . $aId);

		$sth->setFetchMode(PDO::FETCH_ASSOC);

		$str_all = "";
	
		while($row = $sth->fetch()) {
			if(strlen($str_all)>0) $str_all .=  "%";
			$str_all .= $row['id'] . "%" . $row['title'] . "%" . $row['duration'] . "%" . $row['misam'] . "%" . $row['editions'];
		}

		echo $str_all;

	}

	function retrieveAllComposers($cId, $y, $v){

		require("../access/connexion.php");

		$ed_XXXX="ed_".$y;

		$sth = $dbh->query('SELECT imeb_artist.id AS a_id, imeb_artist.firstName,
							imeb_artist.name, ' . $ed_XXXX . ' 
							FROM imeb_artist
							INNER JOIN imeb_country
							ON imeb_artist.id_country = imeb_country.id
							INNER JOIN imeb_edition
							ON imeb_artist.id = imeb_edition.artist_id
							WHERE imeb_country.id =' . $cId);

		$sth->setFetchMode(PDO::FETCH_ASSOC);

		$str_all = "";
	
		while($row = $sth->fetch()) {
			if(strlen($str_all)>0) $str_all .=  "%";
			$str_all .= $row['a_id'] . "%" . $row['firstName'] . "%" . $row['name'] . "%" . $row[$ed_XXXX];
		}

		echo $str_all;
	}

?>