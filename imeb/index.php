<!DOCTYPE html>
<html>
<head>
	<title>Concours Internationaux de Bourges</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" href="main.css">
	<link rel="stylesheet" href="imeb.css">
	<?php include_once("../analyticstracking.php") ?>
</head>
<body>
	<div class="container">
		<h1>Concours Internationaux de Bourges</h1>
		<h2>Oeuvres primées</h2>
		<div id="charts">
			<div id="pie01"><div class="tPie">Pays</div></div>
			<div id="pie02"><div class="tPie">Studio</div></div>
			<div id="pie03"><div class="tPie">Catégorie</div></div>
		</div>
		<div id="nav"></div>
		<div id="awards"></div>
	</div>
	<?php include_once("../footer.php") ?>
	<!--<script src="d3.min.js"></script>-->
	<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.6/d3.min.js" charset="utf-8"></script>
	<script src="script.js"></script>
</body>
</html>