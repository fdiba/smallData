<!DOCTYPE html>
<html>
<head>
	<title>Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/index.css">
	<script type="text/javascript" src='js/perlin.js'></script>
	<script type="text/javascript" src="js/index.js"></script>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main">Small Data</h1>
				<p></p>
			</div>
			<div id="launcher">
				<div class="b_off" id="get_all">get data</div>
			</div>
			<div id="navigation">
				<div class="b_off" id="anim">anim</div>
			</div>
			<ul id="links">
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
		    <div id="selection"><p>no selection</p></div>
		    <ul id="titles"></ul>
	    </div>
 	</div>
         <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
</body>
</html>