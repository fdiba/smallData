<!DOCTYPE html>
<html>
<head>
	<title>Line Charts | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/animated_data.css">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
	<script src="lib/jquery-3.1.1.min.js"></script>
	<script src="js/variables.js"></script>
	<script src="js/functions.js"></script>
	<script src="js/barchart.js"></script>
	<script src="js/linechart.js"></script>
	<script src="js/animated_data.js"></script>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main">Line Charts</h1>
				<p></p>
				<p></p>
				<p></p>
			</div>
			<?php include_once("./php/menus.php") ?>
			<ul id="launcher">
				<li class="b_off" id="get_all">get all data</li>
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
		<div id="legend">
			<p class="lg-title">How to read this page</p>
			<p class="lg-note">Coverage &mdash; this chart is knowingly incomplete. The competition minutes have been fully entered for the editions from <em>1973 to 1994</em>; those from <em>1996 to 2009</em> are only partially processed, so their participant counts are under-estimated. A selection is therefore flagged <em>complete data</em> up to 1994 and <em>incomplete data</em> from 1996 on (next to the page title). No competition was held in <em>1995</em> (36 editions in all), so the timeline skips that year and the lines join 1994 directly to 1996.</p>
			<div class="lg-cols">
				<div>
					<p><strong>Timeline (top strip)</strong></p>
					<ul>
						<li><span class="sq" style="background:#ecf0f1"></span> one square per edition of the competition — the first square, <em>all</em>, charts every edition from 1973 to 2009</li>
						<li><span class="sq" style="background:#1abc9c"></span> selected edition(s)</li>
						<li><span class="sq" style="background:#f1c40f"></span> editions inside the selected time span</li>
						<li><span class="sq" style="background:#e74c3c"></span> <em>span</em> toggle on: pick two years to chart the period between them &middot; <span class="sq" style="background:#ffcccc"></span> off: pick a single year to get a bar chart of that edition</li>
					</ul>
				</div>
				<div>
					<p><strong>Charts</strong></p>
					<ul>
						<li>each line (or bar) is a country; the vertical axis counts the participants found in the competition minutes</li>
					<li>the vertical scale is square-root: countries with few participants stay readable next to the biggest ones (gridlines at 1, 2, 5, 10, 20, 50, 100&hellip;)</li>
						<li>in the chart legend, <em>c/t</em> means: <em>c</em> composers with archived works out of <em>t</em> participants from that country</li>
						<li>next to each country, the left square shows or hides its line, the right one highlights it</li>
						<li>click a point on a line to list, below, all the composers of that country</li>
					</ul>
				</div>
				<div>
					<p><strong>Composers list</strong></p>
					<ul>
						<li><span class="demo demo-active">Name (n)</span> n works archived in the IMEB capsules — click the name to list them</li>
						<li><span class="demo demo-selected">Name</span> took part in the selected edition</li>
						<li><span class="demo">Name</span> listed in the minutes, but no archived work</li>
						<li>the orange bar sums up the current selection — click it to switch between all composers and those of the selected edition only</li>
					</ul>
				</div>
			</div>
		</div>
	    <div id="selection"><p>no selection</p></div>
	    <ul id="composers"></ul>
	    <ul id="titles"></ul>
    </div>
</body>
</html>
