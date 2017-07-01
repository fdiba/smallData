<?php
if(isset($_POST["name"]) && $_POST["name"]=="overview"){
	setcookie("access", "open", time()+3600);
} else if(isset($_COOKIE["access"]) && $_COOKIE["access"]=="open"){
	setcookie("access", "open", time()+3600);
} else if(isset($_GET["src"]) && $_GET["src"]=="ISEA17"){
	setcookie("access", "open", time()+3600);
} else if(isset($_GET["src"]) && $_GET["src"]=="EVA17"){
	setcookie("access", "open", time()+3600);
} else {
	header('Location: ../index.php'); 
}
?>
<!DOCTYPE html>
<html>
<head>
	<title>Award-winning composers | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/sankey.css">
	<?php include_once("../../analyticstracking.php") ?>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main">Categories</h1>
				<p></p>
			</div>
			<ul id="links">
				<li><a href="index.php">overview</a></li>
				<li><a href="network.php">network</a></li>
				<li><a href="animated_data.php">line charts</a></li>
			</ul>
		</div>
		<div id="chart"></div>
 	</div>
	<script src="lib/d3.v3.min.js" charset="utf-8"></script>
	<!-- <script src="lib/d3-sankey.min.js"></script> -->
	<script src="lib/erase_old_sankey.js"></script>
	<script src="js/categories.js"></script>
</body>
</html>