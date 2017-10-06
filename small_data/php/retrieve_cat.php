<?php

	$cat=$_POST['cat'];

	if($cat==1 || $cat==2){
		retrieve_cat($cat);
	} else if($cat==3){
		retrieve_euphonies();
	} else {
		retrieve_cat(0);
	}



	//-------------------------------- functions --------------------------------------//

	function set_sub_cat($sub_cat){

		switch ($sub_cat) {
			case 1:
				$sub_cat = "Dispositif et instru.";
				break;
			case 2:
				$sub_cat = "Esthétique formelle";
				break;
			case 3:
				$sub_cat = "Esthétique program.";
				break;
			case 4:
				$sub_cat = "Danse ou théâtre";
				break;
			case 5:
				$sub_cat = "Installation ou environ.";
				break;
			case 6:
				$sub_cat = "Multimédia";
				break;
			case 7:
				$sub_cat = "Art sonore électroa.";
				break;
			case 8:
				$sub_cat = "Avec instruments";
				break;
			case 9:
				$sub_cat = "Sans instruments";
				break;
			case 10:
				$sub_cat = "tendance netart";
				break;
			case 11:
				$sub_cat = "tendance création";
				break;
			case 12:
				$sub_cat = "tendance performance";
				break;
			default:
				// $sub_cat = "sub undefined";
				break;
		}

		return $sub_cat;
	}

	function retrieve_euphonies(){

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

		$count = 0;

		while($row = $sth->fetch()) {

			$euphonies=$row['euphonies'];

			if($euphonies>0){

				$award_year=$row['award_year'];
				$award_price=$row['award_price'];

				$award_cat=$row['award_cat'];
				// if(!$award_cat)$award_cat="cat undefined";

				$award_sub_cat=set_sub_cat($row['award_cat_2']);

				$misam=$row['misam'];
				// if(!$misam)$misam=000000;

				$title=$row['title'];
				$duration=$row['duration'];
				
				$firstName=$row['firstName'];
				$name=$row['name'];

				$id=$row['id'];


				$year=-999;
				if($euphonies==1)$year=1992;
				else if($euphonies==2)$year=2004;

				
				$count++;

				if(sizeof($arr)<1){
					array_push($arr, $year, $award_year, $award_price, $misam, $firstName, $name, $title, $duration, $id, $award_cat, $award_sub_cat);

					// array_push($arr, $year, $award_year, $count);

					//array_push($arr, $year);

				} else {

					$new_arr = array($year, $award_year, $award_price, $misam, $firstName, $name, $title, $duration, $id, $award_cat, $award_sub_cat);

					// $new_arr = array($year, $award_year, $count);

					//$new_arr = array($year);

					for ($j=0;  $j<sizeof($arr); $j+=11) {

						if((int)$year > (int)$arr[$j]){
							array_splice($arr, $j, 0, $new_arr);
							break;
						} else if($j+11==sizeof($arr)){
							//array_push($arr, 999, 999, $count);
							array_push($arr, $year, $award_year, $award_price, $misam, $firstName, $name, $title, $duration, $id, $award_cat, $award_sub_cat);
							break;
						}

					}

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
			if(!$duration)$duration="00:00";
			
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