<!DOCTYPE html>
<html>
<head>
	<title>Diagramme de Sankey | Concours Internationaux de Bourges</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" href="sankey.css">
	<link rel="stylesheet" href="../main.css">
	<?php include_once("../../analyticstracking.php") ?>
</head>
<body>
	<header>
		<nav id="top-bar">
			<h1 id="btn1"><a href="../../">WEBODROME</a></h1>
			<ul>
				<li><a target="_blank" href="https://github.com/fdiba"><img src="../../images/net/github.png" alt=""></a></li>
				<li><a target="_blank" href="http://twitter.com/webodrome"><img src="../../images/net/twitter.png" alt=""></a></li>
			</ul>
		</nav>
	</header>
	<div class="container">
		<h1 id="mainTitle">Concours Internationaux de Bourges</h1>
		<h2>Catégories des oeuvres primées</h2>
		<div id="chart"></div>	
	</div>
	<?php include_once("../../footer.php") ?>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.6/d3.min.js" charset="utf-8"></script>
	<script src="sankey.js"></script>
	<script src="script.js"></script>
</body>
</html>