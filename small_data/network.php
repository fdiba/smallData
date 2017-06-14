<?php
if(isset($_POST["name"]) && $_POST["name"]=="overview"){
	setcookie("access", "open", time()+3600);
} else if($_COOKIE["access"]=="open"){
	setcookie("access", "open", time()+3600);
} else {
	header('Location: ../index.php'); 
}
?>
<!DOCTYPE html>
<html>
<head>
	<title>Network | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/network.css">
	<?php include_once("../../analyticstracking.php") ?>
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
			<ul id="launcher">
				<li class="b_off" id="get_all">get all data</li>
				<li class="b_off" id="get_sl">compute traces</li>
				<li class="b_off" id="cp_all">compute all</li>		
			</ul>
			<ul id="links">
				<li><a href="index.php">overview</a></li>
				<li><a href="animated_data.php">animated data</a></li>
			</ul>
			<div id="commons">
				<p>null</p>
			</div>
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