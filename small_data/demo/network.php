<!DOCTYPE html>
<html>
<head>
	<title>Network | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/network.css">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
	<script src="lib/jquery-3.1.1.min.js"></script>
	<script src="lib/jquery.cookie.js"></script>
	<script src="lib/perlin.js"></script>
	<script src="js/variables.js"></script>
    <script src="js/functions.js"></script>
    <script src="js/childs.js"></script>
    <script src="js/particles.js"></script>
	<script src="js/network.js"></script>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main">Network</h1>
				<p></p>
			</div>
			<?php include_once("./php/menus.php") ?>
			<ul id="launcher">
				<li class="b_off" id="get_all">get all data</li>
				<li class="b_off" id="get_sl">compute traces</li>
				<li class="b_off" id="cp_all">compute all</li>		
			</ul>
			<div id="sma_main_ctrl">
				<ul>
				</ul>
			</div>
			<div id="commons">
				<p></p>
			</div>
		</div>
		<div id="main_container">
			<canvas id="myCanvas" width="500" height="500">Votre navigateur ne supporte pas les canvas.</canvas>
			<div id="infos">
				<div id="cookies"></div>
			    <div id="selection"></div>
			    <ul id="titles"></ul>
		    </div>
	    </div>
 	</div>
</body>
</html>