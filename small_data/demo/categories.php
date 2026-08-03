<!DOCTYPE html>
<html>
<head>
	<title>Award-winning composers | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/sankey.css">
	<link rel="stylesheet" type="text/css" href="css/isni.css">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main">Categories</h1>
				<p></p>
			</div>
			<?php include_once("./php/menus.php") ?>
		</div>
		<div id="chart"></div>
 	</div>
	<!-- jQuery n'etait pas charge sur cette page : il l'est desormais pour la
	     fiche ISNI de js/categories.js, qui reprend telle quelle celle des
	     autres pages (requete vers php/retrieve_isni.php, placement de la
	     boite). d3 ne s'en sert pas ; seul js/categories.js en depend, il
	     suffit donc qu'il soit charge avant lui. -->
	<script src="lib/jquery-3.1.1.min.js"></script>
	<script src="lib/d3.v3.min.js" charset="utf-8"></script>
	<!-- <script src="lib/d3-sankey.min.js"></script> -->
	<script src="lib/erase_old_sankey.js"></script>
	<script src="js/categories.js"></script>
</body>
</html>