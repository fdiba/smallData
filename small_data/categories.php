<!DOCTYPE html>
<html>
<head>
	<title>Award-winning composers | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/sankey.css">
	<?php include_once("../../analyticstracking.php") ?>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main">Categories</h1>
				<p></p>
			</div>
			<ul id="links">
				<li><a href="index.php">overview</a></li>
				<li><a href="network.php">network</a></li>
				<li><a href="animated_data.php">line charts</a></li>
			</ul>
			<ul id="listings">
				<li><a href="award-winning_works.php">award-winning works</a></li>
				<li><a href="catalog.php?id=1">catalog A</a></li>
				<li><a href="catalog.php?id=2">catalog B</a></li>
			</ul>
		</div>
		<div id="chart"></div>
 	</div>
	<script src="lib/d3.v3.min.js" charset="utf-8"></script>
	<!-- <script src="lib/d3-sankey.min.js"></script> -->
	<script src="lib/erase_old_sankey.js"></script>
	<script src="js/categories.js"></script>
</body>
</html>