<?php queryDB(); ?>
<?php

	function queryDB(){

		require("../access/connexion.php");

		$numResults;
		$years = array(1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009);

		$sth = $dbh->query('SELECT artist.id AS a_id,
								country.c_name AS ctry, country.id AS c_id,
								edition.ed_1973, edition.ed_1974,
								edition.ed_1975, edition.ed_1976,
							   	edition.ed_1977, edition.ed_1978,
								edition.ed_1979, edition.ed_1980,
								edition.ed_1981, edition.ed_1982,
								edition.ed_1983, edition.ed_1984,
								edition.ed_1985, edition.ed_1986,
								edition.ed_1987, edition.ed_1988,
								edition.ed_1989, edition.ed_1990,
								edition.ed_1991, edition.ed_1992,
								edition.ed_1993, edition.ed_1994,
								edition.ed_1995, edition.ed_1996,
								edition.ed_1997, edition.ed_1998,
								edition.ed_1999, edition.ed_2000,
								edition.ed_2001, edition.ed_2002,
								edition.ed_2003, edition.ed_2004,
								edition.ed_2005, edition.ed_2006,
								edition.ed_2007, edition.ed_2008,
								edition.ed_2009
								
							FROM artist
							INNER JOIN country
							ON artist.id_country = country.id
							INNER JOIN edition
							ON artist.id = edition.artist_id
							');

		$sth->setFetchMode(PDO::FETCH_ASSOC);

		$str_all = "";
	
		while($row = $sth->fetch()) {

			if(strlen($str_all)>0) $str_all .=  "%" . $row['a_id'] . "%" . $row['ctry'] . "%" . $row['c_id'] . "%";
			else $str_all = $row['a_id'] . "%" . $row['ctry'] . "%" . $row['c_id'] . "%";

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
?>