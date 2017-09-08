<?php

	$cat=$_POST['cat'];

	if($cat==1 || $cat==2){
		retrieve_cat($cat);
	} else {
		retrieve_cat(0);
	}



	//-------------------------------- functions --------------------------------------//

	function retrieve_cat($cat){

		require("../access/connexion.php");

		//---------------


		$sth = $dbh->query('SELECT imeb_music.title, imeb_music.duration, imeb_music.misam,
							imeb_artist.firstName, imeb_artist.name, imeb_music.id,
							imeb_artist.id AS id_artist
							FROM imeb_music
							INNER JOIN imeb_artist
							ON imeb_music.id_artist = imeb_artist.id');

		$arr= array();
		while($row = $sth->fetch()) {

			$misam=$row['misam'];
			$title=$row['title'];
			$duration=$row['duration'];
			
			$firstName=$row['firstName'];
			$name=$row['name'];

			$id=$row['id'];
			$id_artist=$row['id_artist'];

			if($cat==1){

				if($misam<200000 && $misam!=null){
					array_push($arr, $misam, $firstName, $name, $id_artist, $title, $duration, $id);
				}

			} else if ($cat==2){ //IMEB collection

				if($misam>=200000 && $misam!=null){
					array_push($arr, $misam, $firstName, $name, $id_artist, $title, $duration, $id);
				}

			} else {
				array_push($arr, $misam, $firstName, $name, $id_artist, $title, $duration, $id);
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


		//$result = $row['firstName'] . '%' . $row['name'] . '%' . $row['ctry']
		//			  . '%' . $str_editions;

		echo $results;

	}



?>