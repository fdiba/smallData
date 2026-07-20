<?php
	$title = "IMEB Euphonies d’Or";
?>
<!DOCTYPE html>
<html>
<head>
	<title><?php echo $title ?> | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/euphonies.css">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
	<script src="lib/jquery-3.1.1.min.js"></script>
	<script src="lib/perlin.js"></script>
	<script src="js/variables.js"></script>
	<script src="js/functions.js"></script>
	<script src="js/sma_core.js"></script>
	<script src="js/childs_euphonies.js"></script>
	<script src="js/particles_euphonies.js"></script>
	<script src="js/euphonies.js"></script>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main"><?php echo $title ?></h1>
				<p></p>
			</div>
			<?php include_once("./php/menus.php") ?>
			<div id="sma_main_ctrl">
				<ul>
				</ul>
			</div>
			<div id="sma_menu">
				<div id="commons">
					<p>Group by:</p>
					<ul></ul>
				</div>
				<div id="calculations">
					<ul></ul>
				</div>
			</div>
		</div>
		<div id="middle">
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
						<p><strong>Table &amp; agents</strong></p>
						<ul>
							<li>the table lists the Euphonies d'Or, sorted by edition then last name; click a row to retrieve the matching records from data.bnf.fr, shown below the table, and follow the ISNI link for the composer's international identity record</li>
							<li>on the canvas, each moving ellipse is an agent carrying one Euphonie d'Or</li>
						</ul>
					</div>
					<div>
						<p><strong>Agents</strong></p>
						<ul>
							<li><span class="sq" style="background:#bdc3c7"></span> an agent, still looking for others sharing a common property</li>
							<li><span class="sq" style="background:#2ecc71"></span> a grouping &mdash; click it to open it</li>
							<li><span class="sq" style="background:#f1c40f"></span> an opened grouping, showing its members</li>
							<li><span class="sq" style="background:#3498db"></span> a single work inside an opened grouping &mdash; click it to display its details</li>
						</ul>
					</div>
					<div>
						<p><strong>Grouping</strong></p>
						<ul>
							<li>agents compare their properties as they move; candidate properties and their exchange counts appear in the white panel of the top bar, and a property (such as <em>edition</em> or <em>cat</em>) becomes clickable once exchanged often enough</li>
							<li>click that property name to let the agents regroup around it</li>
							<li><em>reset</em> restarts the system, <em>pause</em> freezes it (the <em>p</em> key toggles the agents' drift)</li>
						</ul>
					</div>
				</div>
			</div>
			<div id="main_table">
				<table id="euphonies_table">
					<tr>
						<th>edition</th>
						<th>year</th>
						<th>price</th>
						<th>imeb id</th>
						<th>first name</th>
						<th>last name</th>
						<th>title</th>
						<th>duration</th>
						<!-- <th>temp id</th> -->
						<th>category</th>
						<th>sub category</th>
						<th>isni</th>
					</tr>
				</table>
			</div>
			<div id="bnfData">
			</div>
		</div>
 	</div>
</body>
</html>