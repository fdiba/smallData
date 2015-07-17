<!DOCTYPE html>
<html>
<head>
	<title>fonds IMEB - small data project</title>
	<?php include_once("../analyticstracking.php") ?>
	<link rel="stylesheet" href="main.css">
	<link rel="stylesheet" href="imeb.css">
</head>
<body>
	<div class="container">
		<h2>IMEB</h2>
		<div id="charts">
			<div id="pie01"></div>
			<div id="pie02"></div>
			<div id="pie03"></div>
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