<?php
	
	$title = "Sound Archives";
	$id = isset($_GET["id"]) ? intval($_GET["id"]) : 0;
	if($id==1)$title = "IMEB International Sound Archives";
	else if($id==2)$title = "IMEB Sound Archives";
	else if($id==3)header('Location: '.'euphonies.php');

	// Texte propre a chaque phonotheque pour la rubrique "How to read"
	// $cov_note : note de completude de la colonne "edition(s)", sur le modele
	// des notes "Coverage" de animated_data.php et index.php (meme classe
	// .lg-note, meme liseré amethyste). Elle dit ce qu'une cellule vide
	// signifie — absence de trace, PAS absence de programmation — parce que la
	// colonne est vide une fois sur deux en Phono A et trois fois sur quatre en
	// Phono B : sans cette note, le lecteur infere le contraire.
	if($id==1){
		$coll_desc  = "This page shows the <strong>International Sound Archives</strong> &mdash; the IMEB's <em>Phonothèque A</em>, said &laquo;&nbsp;Extérieure&nbsp;&raquo;: electroacoustic works by outside composers, gathered by the IMEB (catalogue index 100&thinsp;000).";
		$table_desc = "the table lists the works of the International collection (Phonothèque A), grouped by composer";
		$cov_note   = "Coverage &mdash; the <em>edition(s)</em> column is knowingly incomplete. The <em>Répertoire général</em> records a programming year for about <em>half</em> of the 5&thinsp;828 works in this collection; the cell is left empty for the other half. An empty cell means the repertoire holds no record of a performance, <em>not</em> that the work was never played. Around a thousand works here are by composers who appear at no edition in our participation index either &mdash; but that index is drawn from the competition minutes, which have been fully entered only for <em>1973 to 1994</em> and are still partially processed from <em>1996 to 2009</em>, so their absence is a gap in what has been read, not a statement about what happened. No competition was held in <em>1995</em> (36 editions in all, between 1973 and 2009), so no work carries that year.";
	} else {
		$coll_desc  = "This page shows the <strong>IMEB Sound Archives</strong> &mdash; the IMEB's <em>Phonothèque B</em>: works produced in the institute's own studios (catalogue index 200&thinsp;000).";
		$table_desc = "the table lists the works of the IMEB collection (Phonothèque B), grouped by composer";
		$cov_note   = "Coverage &mdash; the <em>edition(s)</em> column is knowingly incomplete: a programming year is recorded for roughly <em>one work in four</em> of this collection's 765 works. These works were produced in the institute's own studios, and an entry in the archive does not imply a festival performance &mdash; an empty cell means the repertoire holds no record of one. No competition was held in <em>1995</em> (36 editions in all, between 1973 and 2009), so no work carries that year.";
	}

?>
<!DOCTYPE html>
<html>
<head>
	<title><?php echo $title ?> | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/catalog.css">
	<link rel="stylesheet" type="text/css" href="css/isni.css">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
	<script src="lib/jquery-3.1.1.min.js"></script>
	<!-- Fiche ISNI : code partage par les quatre pages qui affichent un ISNI
	     (voir l'en-tete de js/isni_box.js). Depend de jQuery, donc charge
	     apres lui ; les points d'entree, eux, restent dans les scripts de la
	     page — ici js/particles_catalog.js pour la boite violette du SMA. -->
	<script src="js/isni_box.js"></script>
	<script src="lib/perlin.js"></script>
	<script src="js/variables.js"></script>
	<script src="js/functions.js"></script>
	<script src="js/sma_core.js"></script>
	<script src="js/childs_catalog.js"></script>
	<script src="js/particles_catalog.js"></script>
	<script src="js/catalog.js"></script>
	<!-- Repli de la legende "How to read", partage par les sept pages qui en portent une : voir l'en-tete de js/legend_toggle.js -->
	<script src="js/legend_toggle.js"></script>
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
<?php if($id==1 || $id==2){ ?>
			<div id="countries">
				<p>Country:</p>
				<ul></ul>
			</div>
<?php } ?>
			<div id="main_container">
<?php if($id==1 || $id==2){ ?>				<div id="sma_note"></div>
<?php } ?>
				<canvas id="myCanvas" width="500" height="500">Votre navigateur ne supporte pas les canvas.</canvas>
				<div id="infos">
					<div id="cookies"></div>
				    <div id="selection"></div>
				    <ul id="titles"></ul>
			    </div>
		    </div>
<?php if($id==1 || $id==2){ ?>
			<div id="legend">
				<button type="button" id="lg_toggle" class="lg-title" aria-expanded="true" aria-controls="lg_body">
					How to read this page<span class="lg-caret" aria-hidden="true"></span>
				</button>
				<div id="lg_body">
				<p class="lg-intro">The IMEB's holdings form the <em>Fonds MISAME</em>, whose <em>Répertoire général</em> &mdash; compiled by Christian Clozier &mdash; brings together 1&thinsp;946 composers, 6&thinsp;612 works and 63 countries, split into two phonothèques: the <em>International Sound Archives</em> (Phonothèque A, &laquo;&nbsp;Extérieure&nbsp;&raquo;) and the <em>IMEB Sound Archives</em> (Phonothèque B). <?php echo $coll_desc ?></p>
				<p class="lg-note"><?php echo $cov_note ?></p>
				<div class="lg-cols">
					<div>
						<p><strong>Table<?php if($id==1 || $id==2) echo ' &amp; agents'; ?></strong></p>
						<ul>
							<li><?php echo $table_desc ?></li>
							<li>the composer cell is shared across all of their works; the background alternates to separate composers and, within a composer, their pieces</li>
							<li><em>edition(s)</em> gives the year or years in which the work was programmed at Bourges, between 1973 and 2009; the cell is left empty where the <em>Répertoire général</em> does not record it, and a work played again in a later edition carries several years</li>
							<li>a <span class="work-award">&#9733;</span> after a title marks a work distinguished at the competition, held within the festival; the award year is not carried into <em>edition(s)</em>, and a number of awarded works carry no programming year at all &mdash; the full prize list is on the <a href="award-winning_works.php">Award-winning works</a> page</li>
<?php if($id==1){ ?>							<li>Phonothèque A is large, so it is explored <strong>one country at a time</strong>: pick a <em>country</em> in the Country menu to filter the table and build the visualization for that country's composers; pick another country to switch, or <em>All works</em> to show the full table again</li>
<?php } ?>
<?php if($id==2){ ?>							<li>by default <em>All works</em> shows the whole collection on the canvas; you can also pick a <em>country</em> in the Country menu to filter the table and the visualization to that country's composers</li>
<?php } ?>
<?php if($id==1 || $id==2){ ?>							<li>on the canvas, each moving ellipse is an agent carrying one archived work</li>
<?php } ?>						</ul>
					</div>
<?php if($id==1 || $id==2){ ?>
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
			</div>
			<?php } ?>
		<div id="main_table">
			<table id="works_table" class="works_table">
				<tr>
					<th>composer</th>
					<th>title</th>
					<th>duration</th>
					<th>edition(s)</th>
				</tr>
			</table>
			<table id="works_table_2" class="works_table">
				<tr>
					<th>composer</th>
					<th>title</th>
					<th>duration</th>
					<th>edition(s)</th>
				</tr>
			</table>
		</div>
		<div id="listing"></div>
		</div>
		</div>
 	</div>
</body>
</html>