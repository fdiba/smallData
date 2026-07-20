<?php
	
	$title = "Sound Archives";
	if(isset($_GET["id"])){
		if($_GET["id"]==1)$title = "IMEB International Sound Archives";
		else if($_GET["id"]==2)$title = "IMEB Sound Archives";
		else if($_GET["id"]==3)header('Location: '.'euphonies.php');;
	}

?>
<!DOCTYPE html>
<html>
<head>
	<title><?php echo $title ?> | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/catalog.css">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
	<script src="lib/jquery-3.1.1.min.js"></script>
	<script src="lib/perlin.js"></script>
	<script src="js/variables.js"></script>
	<script src="js/functions.js"></script>
	<script src="js/sma_core.js"></script>
	<script src="js/childs_catalog.js"></script>
	<script src="js/particles_catalog.js"></script>
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
			<div id="sma_main_ctrl">
				<ul>
				</ul>
			</div>
			<div id="sma_menu">
				<div id="commons">
					<ul></ul>
				</div>
				<div id="calculations">
					<ul></ul>
				</div>
			</div>
		</div>
		<div id="middle">
			<div id="main_container">
				<canvas id="myCanvas" width="500" height="500">Votre navigateur ne supporte pas les canvas.</canvas>
				<div id="infos">
					<div id="cookies"></div>
				    <div id="selection"></div>
				    <ul id="titles"></ul>
			    </div>
		    </div>
		<div id="main_table">
			<table id="works_table">
				<tr>
					<th>imeb id</th>
					<th>first name</th>
					<th>last name</th>
					<!-- <th>artist t_id</th> -->
					<th>title</th>
					<th>duration</th>
					<!-- <th>work t_id</th> -->
				</tr>
			</table>
		</div>
		<div id="listing"></div>
		</div>
		</div>
 	</div>
</body>
</html>