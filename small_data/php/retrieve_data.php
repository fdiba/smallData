<?php
	$cId = $_POST['cId'];
	$year = $_POST['year'];
	$value = $_POST['value'];
	queryDB2($cId, $year, $value);
?>

<?php

	

	function queryDB2($cId, $y, $v){

		require("../access/connexion.php");

		$sth = $dbh->query('SELECT artist.id AS \'a_id\', artist.firstName, artist.name
							FROM artist
							INNER JOIN country
							ON artist.id_country = country.id
							WHERE country.id =' . $cId);

	$sth->setFetchMode(PDO::FETCH_ASSOC);

	$str_all = "";
	
		while($row = $sth->fetch()) {
			if(strlen($str_all)>0) $str_all .=  "%";
			$str_all .= $row['a_id'] . "%" . $row['firstName'] . "%" . $row['name'];
		}


		echo $str_all;
	}

?>