<!DOCTYPE html>
<html>
<head>
	<title>Animated data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/animated_data.css">
	<script src="lib/jquery-3.1.1.min.js"></script>
	<script src="js/functions.js"></script>
	<script src="js/barchart.js"></script>
	<script src="js/linechart.js"></script>
	<script src="js/animated_data.js"></script>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main">Animated data</h1>
				<p></p>
				<p></p>
				<p></p>
			</div>
			<div id="launcher">
				<div class="b_off" id="get_all">get all data</div>
			</div>
			<ul id="links">
				<li><a href="index.php">index</a></li>
				<li><a href="network.php">network</a></li>
			</ul>
		</div>
		<div id="allCanvas">
			<canvas id="cv_nav" width="500" height="20">
		        Votre navigateur ne supporte pas les canvas.
		    </canvas>
			<canvas id="myCanvas" width="500" height="500">
		        Votre navigateur ne supporte pas les canvas.
		    </canvas>
		</div>
	    <div id="selection"><p>no selection</p></div>
	    <ul id="composers"></ul>
	    <ul id="titles"></ul>
    </div>
</body>
</html>