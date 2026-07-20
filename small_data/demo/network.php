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
		<div id="legend">
			<p class="lg-title">How to read this page</p>
			<div class="lg-cols">
				<div>
					<p><strong>Controls</strong></p>
					<ul>
						<li><em>compute all</em> builds the multi-agent system from every composer of the database; <em>compute traces</em> builds it only from the composers you have consulted in Overview (your navigation path)</li>
						<li>both buttons can be clicked at any time to restart the simulation</li>
						<li><em>pause</em> (or the space bar) freezes the system; the <em>p</em> key toggles the agents' drift</li>
					</ul>
				</div>
				<div>
					<p><strong>Agents</strong></p>
					<ul>
						<li><span class="sq" style="background:#bdc3c7"></span> a composer, still looking for others sharing a common property</li>
						<li><span class="sq" style="background:#2ecc71"></span> a grouping of composers &mdash; click it to open it</li>
						<li><span class="sq" style="background:#f1c40f"></span> an opened grouping, showing its members</li>
						<li><span class="sq" style="background:#3498db"></span> a composer inside an opened grouping &mdash; click it to list their archived works</li>
					</ul>
				</div>
				<div>
					<p><strong>Grouping</strong></p>
					<ul>
						<li>agents compare their properties as they move; when a shared property (such as <em>country</em>) has been exchanged often enough, its name appears in the white panel of the top bar</li>
						<li>click that property name to let the agents regroup around it</li>
						<li>the green box reports the number of nodes while the system grows, then details whatever you click on the canvas</li>
					</ul>
				</div>
			</div>
		</div>
 	</div>
</body>
</html>