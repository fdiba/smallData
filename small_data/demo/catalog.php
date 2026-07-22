<?php
	
	$title = "Sound Archives";
	$id = isset($_GET["id"]) ? intval($_GET["id"]) : 0;
	if($id==1)$title = "IMEB International Sound Archives";
	else if($id==2)$title = "IMEB Sound Archives";
	else if($id==3)header('Location: '.'euphonies.php');

	// Texte propre a chaque phonotheque pour la rubrique "How to read"
	if($id==1){
		$coll_desc  = "This page shows the <strong>International Sound Archives</strong> &mdash; the IMEB's <em>Phonothèque A</em>, said &laquo;&nbsp;Extérieure&nbsp;&raquo;: electroacoustic works by outside composers, gathered by the IMEB (catalogue index 100&thinsp;000).";
		$table_desc = "the table lists the works of the International collection (Phonothèque A), grouped by composer";
	} else {
		$coll_desc  = "This page shows the <strong>IMEB Sound Archives</strong> &mdash; the IMEB's <em>Phonothèque B</em>: works produced in the institute's own studios (catalogue index 200&thinsp;000).";
		$table_desc = "the table lists the works of the IMEB collection (Phonothèque B), grouped by composer";
	}

?>
<!DOCTYPE html>
<html>
<head>
	<title><?php echo $title ?> | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/catalog.css">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
	<script src="lib/jquery-3.1.1.min.js"></script>
	<script src="lib/perlin.js"></script>
	<script src="js/variables.js"></script>
	<script src="js/functions.js"></script>
	<script src="js/sma_core.js"></script>
	<script src="js/childs_catalog.js"></script>
	<script src="js/particles_catalog.js"></script>
	<script src="js/catalog.js"></script>
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
<?php if($id==1 || $id==2){ ?>
			<div id="legend">
				<p class="lg-title">How to read this page</p>
				<p class="lg-intro">The IMEB's holdings form the <em>Fonds MISAME</em>, whose <em>Répertoire général</em> &mdash; compiled by Christian Clozier &mdash; brings together 1&thinsp;946 composers, 6&thinsp;612 works and 63 countries, split into two phonothèques: the <em>International Sound Archives</em> (Phonothèque A, &laquo;&nbsp;Extérieure&nbsp;&raquo;) and the <em>IMEB Sound Archives</em> (Phonothèque B). <?php echo $coll_desc ?></p>
				<div class="lg-cols">
					<div>
						<p><strong>Table<?php if($id==2) echo ' &amp; agents'; ?></strong></p>
						<ul>
							<li><?php echo $table_desc ?></li>
							<li>the composer cell is shared across all of their works; the background alternates to separate composers and, within a composer, their pieces</li>
<?php if($id==2){ ?>							<li>on the canvas, each moving ellipse is an agent carrying one archived work</li>
<?php } ?>						</ul>
					</div>
<?php if($id==2){ ?>
					<div>
						<p><strong>Agents</strong></p>
						<ul>
							<li><span class="sq" style="background:#bdc3c7"></span> an agent, still looking for others sharing a common property</li>
							<li><span class="sq" style="background:#2ecc71"></span> a grouping &mdash; click it to open it</li>
							<li><span class="sq" style="background:#f1c40f"></span> an opened grouping, showing its members &mdash; double-click it to close it</li>
							<li><span class="sq" style="background:#3498db"></span> a single work inside an opened grouping &mdash; click it to display its details</li>
						</ul>
					</div>
					<div>
						<p><strong>Grouping</strong></p>
						<ul>
							<li>agents compare their properties as they move; candidate properties and their exchange counts appear in the white panel of the top bar, and a property (such as <em>ln</em> (last name)) becomes clickable once exchanged often enough</li>
							<li>click that property name to let the agents regroup around it</li>
							<li><em>reset</em> restarts the system, <em>pause</em> freezes it (the <em>p</em> key toggles the agents' drift)</li>
						</ul>
					</div>
<?php } ?>
				</div>
			</div>
			<?php } ?>
		<div id="main_table">
			<table id="works_table">
				<tr>
					<th>composer</th>
					<th>title</th>
					<th>duration</th>
					<th>imeb id</th>
				</tr>
			</table>
		</div>
		<div id="listing"></div>
		</div>
		</div>
 	</div>
</body>
</html>