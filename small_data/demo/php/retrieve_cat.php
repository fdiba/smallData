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
			case 302:
				return "1 et Prix CIME";
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

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		//---------------


		$sth = $dbh->query('SELECT imeb_music.award_year, imeb_music.award_price,
							imeb_music.award_cat, imeb_music.award_cat_2, imeb_music.euphonies,
							imeb_music.title, imeb_music.duration, imeb_music.misam,
							imeb_artist.firstName, imeb_artist.name, imeb_music.id,
							imeb_music.ark, imeb_music.isni
							
							FROM imeb_music
							INNER JOIN imeb_artist
							ON imeb_music.id_artist = imeb_artist.id');

		$arr= array();
		$rows= array();

		while($row = $sth->fetch()) {

			$euphonies=$row['euphonies'];

			if($euphonies>0){

				//$ark="";
				//if($row['ark'])$ark="ark:/".$row['ark'];

				// $ark=$row['ark'];
				$isni=$row['isni'];

				// $isni="0000000114444583";


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

		

				array_push($rows, array($year, $award_year, $award_price, $misam, $firstName, $name, $title, $duration, $id, $award_cat, $award_sub_cat, $isni));

			}

		}

		//--------- tri : edition (recente d'abord) puis nom de famille ---------//
		usort($rows, function($a, $b){
			if((int)$a[0] != (int)$b[0]) return (int)$b[0] - (int)$a[0];
			return strcasecmp($a[5], $b[5]);
		});

		foreach($rows as $row_fields){
			foreach($row_fields as $field) array_push($arr, $field);
		}

		//---------------

		$results="";
		if(sizeof($arr)>0){
			for($i=0; $i<sizeof($arr); $i++){
				
				//if($i<sizeof($arr)-1)$results.=$arr[$i].'%';
				if($i<sizeof($arr)-1)$results.=$arr[$i].'|';
				else $results.=$arr[$i];

			}
		}

		echo $results;


	}

	function retrieve_cat($cat){

		require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

		//---------------


		//--------- filtrage en SQL : seules les lignes utiles sont rapatriees ---------//
		$where = '';
		if($cat==1){ //International collection
			$where = ' WHERE imeb_music.misam > 0 AND imeb_music.misam < 200000';
		} else if($cat==2){ //IMEB collection
			$where = ' WHERE imeb_music.misam >= 200000';
		}

		$sth = $dbh->query('SELECT imeb_music.title, imeb_music.duration, imeb_music.misam,
							imeb_artist.firstName, imeb_artist.name, imeb_music.id,
							imeb_artist.id AS id_artist
							FROM imeb_music
							INNER JOIN imeb_artist
							ON imeb_music.id_artist = imeb_artist.id'
							. $where . '
							ORDER BY imeb_artist.name ASC, imeb_artist.firstName ASC, imeb_artist.id ASC, imeb_music.title ASC');

		$arr= array();
		while($row = $sth->fetch()) {

			array_push($arr, $row['misam'], $row['firstName'], $row['name'],
						$row['id_artist'], $row['title'], $row['duration'], $row['id']);

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