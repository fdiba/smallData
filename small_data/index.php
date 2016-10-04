<?php require("access/connexion.php"); ?>
<?php

	$numResults;

	$sth = $dbh->query('SELECT artist.firstName, artist.name,
							country.c_name
							
						FROM artist
						INNER JOIN country
						ON artist.id_country = country.id
						');

	$sth->setFetchMode(PDO::FETCH_ASSOC);

	$objects = array();

	while($row = $sth->fetch()) {

		array_push($objects, array($row['firstName'], $row['name'],
								   $row['c_name']));

		
		



	}

	$numResults = sizeof($objects);

	$dbh=null;

?>
<!DOCTYPE html>
<html>
<head>
	<title>Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<script type="text/javascript" src="js/canvas.js"></script>
</head>
<body>
	<h1>Small Data</h1>
	<div><p>composers: <?php echo $numResults ?></p></div>
	<script type='text/javascript'>
	<?php
	$php_array = array('abc','def','ghi');
	//$js_array = json_encode($php_array);
	echo "var num = ". $numResults . ";\n";
	?>
</script>
	<canvas id="myCanvas" width="500" height="500">

            Votre navigateur ne supporte pas les canvas.

    </canvas>
         <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script> 
</body>
</html>