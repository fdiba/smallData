<!DOCTYPE html>
<html>
<head>
	<title>Network</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/network.css">
	<script src="lib/jquery-3.1.1.min.js"></script>
	<script src="lib/jquery.cookie.js"></script>
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
			<div id="launcher">
				<div class="b_off" id="get_sl">get selected data</div>
				<div class="b_off" id="get_all">get all data</div>
			</div>
			<ul id="links">
				<li><a href="index.php">index</a></li>
				<li><a href="animated_data.php">animated data</a></li>
			</ul>
		</div>
		<div id="main_container">
			<canvas id="myCanvas" width="500" height="500">Votre navigateur ne supporte pas les canvas.</canvas>
			<div id="infos">
				<div id="cookies"></div>
			    <div id="selection"><p>no selection</p></div>
			    <ul id="titles"></ul>
		    </div>
	    </div>
 	</div>
</body>
</html>