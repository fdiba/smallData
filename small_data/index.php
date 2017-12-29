<!DOCTYPE html>
<html>
<head>
	<title>Overview | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/overview.css">
	<?php include_once("../../analyticstracking.php") ?>
	<script src='lib/perlin.js'></script>
	<script src="lib/jquery-3.1.1.min.js"></script>
    <script src="lib/jquery.cookie.js"></script>
    <script src="js/variables.js"></script>
    <script src="js/functions.js"></script>
    <script src="js/particles.js"></script>
	<script src="js/overview.js"></script>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main">Small Data</h1>
				<p></p>
			</div>
			<ul id="launcher">
				<li class="b_off" id="get_all">get all data</li>
				<li class="b_off" id="anim">anim</li>
			</ul>
			<?php include_once("./php/menus.php") ?>
			<div id="searchBox">
				<form id="myForm">
				    <input id="searchTerms" type="text" value="composer name">
				</form>
			</div>
			<div id="searchBoxBtn"></div>
			<div id="filters">
				<form id="formFilters">
				    <!-- <input id="year_01" type="text"> -->
				    <!-- <input id="year_02" type="text"> -->
				    <input id="numOfRecords" type="text" value="num of records >=">
				</form>
			</div>
			<div id="filtersBtn"></div>
		</div>
		<div id="allCanvas">
			<canvas id="myCanvas" width="500" height="500">
	            Votre navigateur ne supporte pas les canvas.
		    </canvas>
		    <canvas id="sma" width="250" height="250">
		    </canvas>
		</div>
		<div id="infos">
			<div id="cookies"></div>
		    <div id="selection"><p>no selection</p></div>
		    <ul id="titles"></ul>
		    <ul id="results"></ul>
	    </div>
 	</div>
</body>
</html>