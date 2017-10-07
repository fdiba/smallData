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
				return "Dispositif et instru.";
				break;
			case 2:
				return "Esthétique formelle";
				break;
			case 3:
				return "Esthétique program.";
				break;
			case 4:
				return "Danse ou théâtre";
				break;
			case 5:
				return "Installation ou environ.";
				break;
			case 6:
				return "Multimédia";
				break;
			case 7:
				return "Art sonore électroa.";
				break;
			case 8:
				return "Avec instruments";
				break;
			case 9:
				return "Sans instruments";
				break;
			case 10:
				return "tendance netart";
				break;
			case 11:
				return "tendance création";
				break;
			case 12:
				return "tendance performance";
				break;
			default:
				return $sub_cat;
				break;
		}

		
	}

	function set_price($price){

		switch ($price) {
			case 199:
				return "Prix";
				break;
			case 300:
				return "Prix CIME";
				break;
			default:
				return $price;
				break;
		}

		

		/*if(rank==100)rank="Mention";
        else if(rank==101)rank="Mention 1";
        else if(rank==102)rank="Mention 2";
        else if(rank==103)rank="Mention 3";
        else if(rank==197)rank="Nominé";
        else if(rank==198)rank="Finaliste";
        else if(rank==199)rank="Prix";
        else if(rank==200)rank="Prix CNM";
        else if(rank==201)rank="Grand Prix";
        
        else if(rank==296)rank="Pierre d'Or";
        else if(rank==297)rank="Pierre d'Argent";


        else if(rank==298)rank="Prix Bregman";
        else if(rank==299)rank="Prix FNME";
        else if(rank==300)rank="Prix CIME";
        else if(rank==301)rank="1, Prix CIME et Euphonies";
        else if(rank==302)rank="1 et Prix CIME";
        else if(rank==303)rank="Prix CIME et Mention";
        else if(rank==304)rank="Prix CIME et Mention 1";
        else if(rank==500)rank="Magistère";
        else if(rank==600)rank="Résidence";*/
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

		while($row = $sth->fetch()) {

			$euphonies=$row['euphonies'];

			if($euphonies>0){

				$award_year=$row['award_year'];
				$award_price=set_price($row['award_price']);

				$award_cat=$row['award_cat'];
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
				else if($euphonies==3)$year=2010;

		

				if(sizeof($arr)<1){
					array_push($arr, $year, $award_year, $award_price, $misam, $firstName, $name, $title, $duration, $id, $award_cat, $award_sub_cat);

				} else {

					$new_arr = array($year, $award_year, $award_price, $misam, $firstName, $name, $title, $duration, $id, $award_cat, $award_sub_cat);

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
			// if(!$duration)$duration="00:00";
			
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