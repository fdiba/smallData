<?php setcookie("access", "open", time()+3600); ?>
<!DOCTYPE html>
<html>
<head>
	<title>Catalogs | Small Data</title>
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
				<h1 id="main">Catalogs</h1>
				<p></p>
			</div>
			<ul id="links">
				<li><a href="index.php">overview</a></li>
				<li><a href="network.php">network</a></li>
				<li><a href="animated_data.php">line charts</a></li>
				<li><a href="categories.php">categories</a></li>
			</ul>
			<ul id="listings">
				<li><a href="award-winning_works.php">award-winning works</a></li>
				<li><a href="catalog.php?id=1">catalog A</a></li>
				<li><a href="catalog.php?id=2">catalog B</a></li>
			</ul>
		</div>
		<div id="listing"></div>
 	</div>
</body>
</html>