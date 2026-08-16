<?php

	require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

	function compte($dbh, $sql){
		try {
			$sth = $dbh->query($sql);
			if(!$sth) return null;
			$v = $sth->fetchColumn();
			return ($v === false || $v === null) ? null : (int) $v;
		} catch (Exception $e) {
			return null;
		}
	}
	function nb($n){ return ($n === null) ? '?' : number_format($n, 0, ',', '&nbsp;'); }

	$n_entrants   = compte($dbh, "SELECT COUNT(DISTINCT id_artist) FROM imeb_participation");
	$n_sans_oeuvre = compte($dbh, "SELECT COUNT(*) FROM (SELECT DISTINCT p.id_artist FROM imeb_participation p
								   WHERE NOT EXISTS (SELECT 1 FROM imeb_music m WHERE m.id_artist = p.id_artist)) t");
	$n_1992       = compte($dbh, "SELECT COUNT(DISTINCT id_artist) FROM imeb_participation WHERE annee = 1992");
	$n_2004       = compte($dbh, "SELECT COUNT(DISTINCT id_artist) FROM imeb_participation WHERE annee = 2004");
	$n_pays       = compte($dbh, "SELECT COUNT(DISTINCT a.id_country) FROM imeb_participation p
								  INNER JOIN imeb_artist a ON a.id = p.id_artist
								  WHERE a.id_country IS NOT NULL");
	$n_inconnu    = compte($dbh, "SELECT COUNT(DISTINCT p.id_artist) FROM imeb_participation p
								  INNER JOIN imeb_artist a ON a.id = p.id_artist
								  INNER JOIN imeb_country c ON c.id = a.id_country
								  WHERE c.c_name_en = 'Unknown' OR c.c_name = 'Unknown'");

	// ?chart=1 : matrix (defaut) ; ?chart=2 : line chart
	$chart = (isset($_GET['chart']) && $_GET['chart'] === '2') ? 'line' : 'matrix';
	// ?count=0 : all entrants (defaut) ; ?count=1 : only those with a work
	$count = (isset($_GET['count']) && $_GET['count'] === '1') ? 'works' : 'all';

	// Deux etats litteraux, et non un ternaire dans le corps de la legende :
	// docs/how_to_read.py releve les affectations, pas les expressions.
	if($chart === 'matrix'){
		$leg_matrix = "the chart the page opens on";
		$leg_line   = "the other view";
	}else{
		$leg_matrix = "the other view";
		$leg_line   = "the chart the page opens on";
	}

?>
<!DOCTYPE html>
<html>
<head>
	<title>Participation | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<meta name="description" content="Entrants per country and per edition of the Bourges international electroacoustic music competitions, 1973-2009, as a matrix, a line chart or a bar chart.">
	<?php include_once("./php/canonical.php"); canonique() ?>
	<?php include_once("./php/asset.php") ?>
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/main.css') ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/animated_data.css') ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/isni.css') ?>">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
	<script src="lib/jquery-3.1.1.min.js"></script>
	<script src="<?php echo asset('js/isni_box.js') ?>"></script>
	<script src="<?php echo asset('js/variables.js') ?>"></script>
	<script src="<?php echo asset('js/functions.js') ?>"></script>
	<script src="<?php echo asset('js/barchart.js') ?>"></script>
	<script src="<?php echo asset('js/linechart.js') ?>"></script>
	<script src="<?php echo asset('js/matrixchart.js') ?>"></script>
	<script src="<?php echo asset('js/animated_data.js') ?>"></script>
	<script src="<?php echo asset('js/legend_toggle.js') ?>"></script>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main">Participation</h1>
				<p></p>
				<p></p>
				<p></p>
			</div>
			<div id="count" data-count-default="<?php echo $count ?>">
				<label>count</label>
				<ul>
					<li class="<?php echo $count === 'all' ? 'b_on' : 'b_off' ?>" data-count="all" role="button" tabindex="0" aria-pressed="<?php echo $count === 'all' ? 'true' : 'false' ?>">all entrants</li>
					<li class="<?php echo $count === 'works' ? 'b_on' : 'b_off' ?>" data-count="works" role="button" tabindex="0" aria-pressed="<?php echo $count === 'works' ? 'true' : 'false' ?>">only those with a work</li>
				</ul>
			</div>
			<div id="view" data-view-default="<?php echo $chart ?>">
				<label>chart</label>
				<ul>
					<li class="<?php echo $chart === 'matrix' ? 'b_on' : 'b_off' ?>" data-view="matrix" role="button" tabindex="0" aria-pressed="<?php echo $chart === 'matrix' ? 'true' : 'false' ?>">matrix &middot; countries &times; editions</li>
					<li class="<?php echo $chart === 'line' ? 'b_on' : 'b_off' ?>" data-view="line" role="button" tabindex="0" aria-pressed="<?php echo $chart === 'line' ? 'true' : 'false' ?>">line chart &middot; one line per country</li>
				</ul>
			</div>
			<?php include_once("./php/menus.php") ?>
		</div>
		<div id="allCanvas">
			<canvas id="cv_nav" width="500" height="20">
		        Votre navigateur ne supporte pas les canvas.
		    </canvas>
			<canvas id="myCanvas" width="500" height="500">
		        Votre navigateur ne supporte pas les canvas.
		    </canvas>
		</div>
		<div id="legend" class="is-collapsed">
			<button type="button" id="lg_toggle" class="lg-title" aria-expanded="false" aria-controls="lg_body">
				How to read this page<span class="lg-caret" aria-hidden="true"></span>
			</button>
			<div id="lg_body">
			<div class="lg-cols">
				<div>
					<p class="lg-note"><strong>What is counted</strong>: <em>entrants</em>, not works. Most of the people on this page have no work in the collection at all. Of the <?php echo nb($n_entrants) ?> entrants the database records, <?php echo nb($n_sans_oeuvre) ?> left nothing but a candidacy, a name read off an entry list. That gap is the subject of this page, and it is why most names in the list below are withheld.</p>
					<p class="lg-note"><strong>The chart is knowingly incomplete</strong>, and the strip above each edition square says on what authority that edition is counted. There was no competition in 1995, so the timeline skips it and 1994 joins 1996 directly. Two low editions are not gaps in the record. 1992 (<?php echo nb($n_1992) ?>) was open for one degree only, the R&eacute;sidence, and 2004 (<?php echo nb($n_2004) ?>) ran without its first three categories.</p>
					<p><strong>Timeline (top strip)</strong></p>
					<ul>
						<li><span class="sq" style="background:#ecf0f1"></span> One square per edition. The first, <em>all</em>, charts 1973&ndash;2009.</li>
						<li><span class="sq" style="background:#2ecc71"></span> <em>The bailiff&rsquo;s record is transcribed in full</em>. Every entry is attested.</li>
						<li><span class="sq" style="background:#5dade2"></span> <em>Counted from the entrants list</em> and from archived works. This is second-hand, and short of the minutes.</li>
						<li><span class="sq" style="background:#1abc9c"></span> Selected &middot; <span class="sq" style="background:#f1c40f"></span> inside the selected span &middot; <span class="sq" style="background:#e74c3c"></span> <em>span</em> on, <span class="sq" style="background:#ffcccc"></span> off. A single year gives a bar chart.</li>
					</ul>
					<p><strong>Count</strong>: the switch, which acts on all three charts and on the list</p>
					<ul>
						<li><em>all entrants</em> counts everyone recorded as having entered, work or no work. It is the honest measure of the competition.</li>
						<li><em>only those with a work</em> is the measure of the collection, and a good deal smaller.</li>
						<li>With the switch on, no name in the list is withheld and every line is clickable. A name published with a work is a published name.</li>
					</ul>
				</div>
				<div>
					<p><strong>Countries</strong>: whose map is this</p>
					<ul>
						<li>There are <?php echo nb($n_pays) ?> countries. Each person is charted under the state they are attached to <em>today</em>, not the one on the envelope they posted in.</li>
						<li>So Czechoslovakia, the GDR and the USSR never appear, though addresses in the base name all three. A chart drawn on addresses would show the other answer, and both are true.</li>
						<li><em>Unknown</em> is a country row like any other, and it holds <?php echo nb($n_inconnu) ?> people.</li>
					</ul>
					<p><strong>Matrix</strong>: <?php echo $leg_matrix ?></p>
					<ul>
						<li>There is one row per country and one column per edition. The colour counts the entrants, on the authority the strip above names.</li>
						<li>The scale is square-root and runs through the colour, so one entrant stays visible next to a hundred. The key sits at the top right.</li>
						<li><em>rows: total &middot; first entry &middot; A&ndash;Z</em> reorders the grid. Click a country to isolate it, eight at most; the others fade but keep their place.</li>
						<li>Click a cell to list that country&rsquo;s composers below, and again to drop it. <em>reset all</em> clears everything.</li>
					</ul>
					<p><strong>Band on top</strong>: entrants per edition</p>
					<ul>
						<li>The outline is the total for each edition, every country together.</li>
						<li>The scale here is linear, not square-root. An area that is stacked must sum, and &radic;a + &radic;b is not &radic;(a+b).</li>
						<li>The right-hand column totals each country over the period on screen. The <em>c/t</em> figure left of the grid is composers with works out of entrants, across all editions.</li>
					</ul>
				</div>
				<div>
					<p><strong>Bar chart</strong>: one edition on its own</p>
					<ul>
						<li>Turn <em>span</em> off and pick a year. The full height counts the entrants, and the emerald foot how many of them have a work in the collection.</li>
						<li>The gap between the two is the subject of this database. Two countries can send the same number of entrants and leave very different amounts of music behind.</li>
						<li>Hover for figures, click to list that country&rsquo;s composers, and click again to clear.</li>
					</ul>
					<p><strong>Line chart</strong>: <?php echo $leg_line ?></p>
					<ul>
						<li>There is one line per country, on a square-root axis with gridlines at 1, 2, 5, 10, 20, 50, 100&hellip;</li>
						<li>It has no provenance strip of its own. The one on the edition squares sits just above and is read with it.</li>
					</ul>
					<p><strong>Composers list</strong></p>
					<ul>
						<li><span class="demo demo-active">Name (n)</span> has n archived works, and clicking it lists them. <span class="demo demo-selected">Name</span> took part in the selected edition.</li>
						<li><span class="demo">J****** D*****</span> is an entrant with no archived work. The name is withheld and the line is not clickable, because what is recorded is an <em>application</em>, not a published work.</li>
						<li>The orange bar sums up the selection. Click it to switch between all composers and those of the selected edition.</li>
						<li>Clicking a name opens a panel on the right: the name, the count of archived works (click to unfold), and, if the composer <strong>has an ISNI</strong>, a third box for the international identity record. Nothing is requested until you unfold it.</li>
					</ul>
				</div>
			</div>
			</div>
		</div>
	    <div id="selection"><p>no selection</p></div>
	    <ul id="composers"></ul>
	    <div id="workPanel">
	        <div id="composerBox"></div>
	        <div id="isniColumn"></div>
	        <ul id="titles"></ul>
	    </div>
    </div>
</body>
</html>
