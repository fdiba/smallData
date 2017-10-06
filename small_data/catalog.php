<?php
	
	$title = "Sound Archives";
	if(isset($_GET["id"])){
		if($_GET["id"]==1)$title = "International Sound Archives";
		else if($_GET["id"]==2)$title = "IMEB Sound Archives";
		else if($_GET["id"]==3)$title = "Euphonies";
	}

?>
<!DOCTYPE html>
<html>
<head>
	<title><?php echo $title ?> | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/catalog.css">
	<?php include_once("../../analyticstracking.php") ?>
	<script src="lib/jquery-3.1.1.min.js"></script>
	<script src="js/catalog.js"></script>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main"><?php echo $title ?></h1>
				<p></p>
			</div>
			<?php include_once("./php/menus.php") ?>
		</div>
		<div id="listing"></div>
 	</div>
</body>
</html>