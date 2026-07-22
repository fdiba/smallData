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
    <script src="js/particles_interactive_index.js"></script>
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
				<label for="searchTerms">composer name</label>
				<form id="myForm">
				    <input id="searchTerms" type="text" value="">
				</form>
			</div>
			<div id="searchBoxBtn"></div>
			<div id="filters">
				<label for="numOfRecords">num of records &gt;=</label>
				<form id="formFilters">
				    <!-- <input id="year_01" type="text"> -->
				    <!-- <input id="year_02" type="text"> -->
				    <input id="numOfRecords" type="text" value="0">
				</form>
			</div>
			<div id="filtersBtn"></div>
		</div>
			<div id="board">
				<div id="left_col">
					<div id="allCanvas">
			<canvas id="myCanvas" width="500" height="500">
	            Votre navigateur ne supporte pas les canvas.
		    </canvas>
					</div>
		<div id="legend">
			<p class="lg-title">How to read this page</p>
			<div class="lg-cols">
				<div>
					<p><strong>The index</strong></p>
					<ul>
						<li>each composer is a grey square followed by one coloured square per participation in the Bourges competitions</li>
						<li>the hue encodes the edition year, from red (1973) to pink (2009)</li>
						<li>washed-out squares mark composers with no archived work; vivid ones have recordings in the IMEB capsules</li>
					</ul>
				</div>
				<div>
					<p><strong>Selection &amp; search</strong></p>
					<ul>
						<li>click a square to select a composer: the orange box sums up their participations and the purple box lists their archived works</li>
						<li>type a name in <em>composer name</em> to list matching composers; click a result to highlight their squares in yellow</li>
						<li><em>num of records &gt;=</em> rebuilds the index with only the composers having at least that many archived works</li>
					</ul>
				</div>
				<div>
					<p><strong>Navigation trace</strong></p>
					<ul>
						<li>every composer you consult joins the small canvas as a bubble, grouped by country &mdash; your navigation trace</li>
						<li>the green box counts the composers consulted so far; click a bubble to detail one country</li>
						<li>the trace is saved and can be replayed on the <em>Network</em> page with <em>compute traces</em></li>
					</ul>
				</div>
			</div>
		</div>
				</div>
				<div id="right_col">
		    <canvas id="sma" width="250" height="250">
		    </canvas>
		<div id="infos">
			<div id="cookies"></div>
		    <div id="selection"><p>no selection</p></div>
		    <ul id="titles"></ul>
		    <ul id="results"></ul>
	    </div>
				</div>
			</div>
 	</div>
</body>
</html>