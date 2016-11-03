<!DOCTYPE html>
<html>
<head>
	<title>Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/index.css">
	<script src='lib/perlin.js'></script>
	<script src="lib/jquery-3.1.1.min.js"></script>
    <script src="lib/jquery.cookie.js"></script>
    <script src="js/functions.js"></script>
    <script src="js/particles.js"></script>
	<script src="js/index.js"></script>
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
			</ul>
			<div id="navigation">
				<div class="b_off" id="anim">anim</div>
			</div>
			<ul id="links">
				<li><a href="network.php">network</a></li>
				<li><a href="animated_data.php">animated data</a></li>
			</ul>
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
	    </div>
 	</div>
</body>
</html>