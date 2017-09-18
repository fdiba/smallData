<?php

	retrieve_works();

	//-------------------------------- functions --------------------------------------//

	function retrieve_works(){

		require("../access/connexion.php");

		//---------------


		$sth = $dbh->query('SELECT imeb_music.award_year, imeb_music.award_price,
							imeb_music.award_cat, imeb_music.award_cat_2, imeb_music.euphonies,
							imeb_music.title, imeb_music.duration, imeb_music.misam,
							imeb_artist.firstName, imeb_artist.name, imeb_music.id
							FROM imeb_music
							INNER JOIN imeb_artist
							ON imeb_music.id_artist = imeb_artist.id');

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

			if($award_year!=null){

				array_push($arr, $award_year, $award_price, $misam, $firstName, $name, $title, $duration, $id, $award_cat,
							$award_cat2);

				if($euphonies>0){

					$year=-999;
					if($euphonies==1)$year=1992;
					else if($euphonies==2)$year=2004;

					array_push($arr, $year, "Euphonie", $misam, $firstName, $name, $title, $duration, $id, "Euphonie",
						$award_cat2);
				}
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