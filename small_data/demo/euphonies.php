<?php
	$title = "IMEB Euphonies d’Or";
?>
<!DOCTYPE html>
<html>
<head>
	<title><?php echo $title ?> | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/euphonies.css">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
	<script src="lib/jquery-3.1.1.min.js"></script>
	<script src="lib/perlin.js"></script>
	<script src="js/variables.js"></script>
	<script src="js/functions.js"></script>
	<script src="js/sma_core.js"></script>
	<script src="js/childs_euphonies.js"></script>
	<script src="js/particles_euphonies.js"></script>
	<script src="js/euphonies.js"></script>
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
				<table id="euphonies_table">
					<tr>
						<th>edition</th>
						<th>year</th>
						<th>price</th>
						<th>imeb id</th>
						<th>first name</th>
						<th>last name</th>
						<th>title</th>
						<th>duration</th>
						<!-- <th>temp id</th> -->
						<th>category</th>
						<th>sub category</th>
						<th>isni</th>
					</tr>
				</table>
			</div>
			<div id="bnfData">
			</div>
		</div>
 	</div>
</body>
</html>