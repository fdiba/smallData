<?php
	
	$title = "Sound Archives";
	$meta_desc = "The sound archives of the Institute of Electroacoustic Music of Bourges, the Fonds MISAME, listed composer by composer and work by work.";
	$id = isset($_GET["id"]) ? intval($_GET["id"]) : 0;
	if($id==1){
		$title = "IMEB International Sound Archives";
		$meta_desc = "The IMEB Phonotheque A, electroacoustic works by outside composers gathered at Bourges under catalogue index 100 000.";
	}
	else if($id==2){
		$title = "IMEB Sound Archives";
		$meta_desc = "The IMEB Phonotheque B, the electroacoustic works produced in the institute's own studios at Bourges, under catalogue index 200 000.";
	}
	else if($id==3)header('Location: '.'euphonies.php');

	require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

	$phono_a       = 'imeb_music.misam > 0 AND imeb_music.misam < 200000';
	$phono_b       = 'imeb_music.misam >= 200000';
	$au_repertoire = "imeb_music.statut <> 'hors_repertoire'";
	$plage         = ($id == 2) ? $phono_b : $phono_a;

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
	function nb($n){ return ($n === null) ? '?' : number_format($n, 0, ',', '&thinsp;'); }

	$oeuvres_a = compte($dbh, "SELECT COUNT(*) FROM imeb_music WHERE $phono_a AND $au_repertoire");
	$oeuvres_b = compte($dbh, "SELECT COUNT(*) FROM imeb_music WHERE $phono_b AND $au_repertoire");

	$n_oeuvres      = nb(($oeuvres_a === null || $oeuvres_b === null) ? null : $oeuvres_a + $oeuvres_b);
	$n_oeuvres_ici  = nb(($id == 2) ? $oeuvres_b : $oeuvres_a);

	$n_compositeurs = nb(compte($dbh, "SELECT COUNT(DISTINCT imeb_music.id_artist) FROM imeb_music
									   WHERE imeb_music.misam > 0 AND $au_repertoire"));
	$n_pays         = nb(compte($dbh, "SELECT COUNT(DISTINCT imeb_artist.id_country) FROM imeb_music
									   INNER JOIN imeb_artist ON imeb_music.id_artist = imeb_artist.id
									   WHERE imeb_music.misam > 0 AND $au_repertoire"));
	$n_datees       = nb(compte($dbh, "SELECT COUNT(*) FROM imeb_music
									   WHERE $plage AND $au_repertoire
										 AND imeb_music.editions IS NOT NULL AND imeb_music.editions <> ''"));
	$n_sans_part    = nb(compte($dbh, "SELECT COUNT(*) FROM imeb_music
									   INNER JOIN imeb_artist ON imeb_music.id_artist = imeb_artist.id
									   WHERE $plage AND $au_repertoire
										 AND NOT EXISTS (SELECT 1 FROM imeb_participation p
														 WHERE p.id_artist = imeb_artist.id)"));

?>
<!DOCTYPE html>
<html>
<head>
	<title><?php echo $title ?> | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<meta name="description" content="<?php echo $meta_desc ?>">
	<?php include_once("./php/canonical.php"); canonique($id ? '?id=' . $id : '') ?>
	<?php include_once("./php/asset.php") ?>
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/main.css') ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/catalog.css') ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/isni.css') ?>">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
	<script src="<?php echo asset('lib/jquery-3.1.1.min.js') ?>"></script>
	<script src="<?php echo asset('js/isni_box.js') ?>"></script>
	<script src="<?php echo asset('lib/perlin.js') ?>"></script>
	<script src="<?php echo asset('js/variables.js') ?>"></script>
	<script src="<?php echo asset('js/functions.js') ?>"></script>
	<script src="<?php echo asset('js/sma_core.js') ?>"></script>
	<script src="<?php echo asset('js/childs_catalog.js') ?>"></script>
	<script src="<?php echo asset('js/particles_catalog.js') ?>"></script>
	<script src="<?php echo asset('js/catalog.js') ?>"></script>
	<script src="<?php echo asset('js/legend_toggle.js') ?>"></script>
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
			<div id="page_cols">
			<div id="left_col">
			<div id="main_container">
<?php if($id==1 || $id==2){ ?>				<div id="sma_note"></div>
<?php } ?>
				<canvas id="myCanvas" width="500" height="500">Votre navigateur ne supporte pas les canvas.</canvas>
			</div>
<?php if($id==1 || $id==2){ ?>
			<div id="legend" class="is-collapsed">
				<button type="button" id="lg_toggle" class="lg-title" aria-expanded="false" aria-controls="lg_body">
					How to read this page<span class="lg-caret" aria-hidden="true"></span>
				</button>
				<div id="lg_body">
				<div class="lg-cols">
					<div>
						<p class="lg-intro">The IMEB's holdings form the <em>Fonds MISAME</em>. Its <em>R&eacute;pertoire g&eacute;n&eacute;ral</em>, compiled by Christian Clozier, brings together <?php echo $n_compositeurs ?> composers, <?php echo $n_oeuvres ?> works and <?php echo $n_pays ?> countries, split into two phonoth&egrave;ques: the <em>International Sound Archives</em> (Phonoth&egrave;que A, &laquo;&nbsp;Ext&eacute;rieure&nbsp;&raquo;) and the <em>IMEB Sound Archives</em> (Phonoth&egrave;que B).</p>
						<?php if($id==1){ ?>
						<p class="lg-intro">This page shows the <strong>International Sound Archives</strong>, the IMEB's <em>Phonoth&egrave;que A</em>, said &laquo;&nbsp;Ext&eacute;rieure&nbsp;&raquo;: electroacoustic works by outside composers, gathered by the IMEB under catalogue index 100&thinsp;000.</p>
						<?php } ?>
						<?php if($id==2){ ?>
						<p class="lg-intro">This page shows the <strong>IMEB Sound Archives</strong>, the IMEB's <em>Phonoth&egrave;que B</em>: works produced in the institute's own studios, under catalogue index 200&thinsp;000.</p>
						<?php } ?>
						<?php if($id==1){ ?>
						<p class="lg-note"><strong>Coverage.</strong> The <em>edition(s)</em> column is knowingly incomplete. The <em>R&eacute;pertoire g&eacute;n&eacute;ral</em> records a programming year for <?php echo $n_datees ?> of the <?php echo $n_oeuvres_ici ?> works in this collection, and the cell is left empty for the others. An empty cell means the repertoire holds no record of a performance, not that the work was never played. <?php echo $n_sans_part ?> works here are by composers who appear at no edition in our participation index either. That index is drawn from the competition minutes, which have been fully entered only for 1973 to 1994 and are still partially processed from 1996 to 2009, so their absence is a gap in what has been read, not a statement about what happened. No competition was held in 1995, so no work carries that year.</p>
						<?php } ?>
						<?php if($id==2){ ?>
						<p class="lg-note"><strong>Coverage.</strong> The <em>edition(s)</em> column is knowingly incomplete: a programming year is recorded for <?php echo $n_datees ?> of this collection's <?php echo $n_oeuvres_ici ?> works. These works were produced in the institute's own studios, and an entry in the archive does not imply a festival performance. An empty cell means the repertoire holds no record of one. No competition was held in 1995, so no work carries that year.</p>
						<?php } ?>
						</div>
					<div>
						<p><strong>Composers &amp; works</strong></p>
						<ul>
							<li>A composer whose name is <span class="composer-isni">underlined with dots</span> has an ISNI. Click the name to open their international identity record in the panel on the right: name forms, dates, external links (VIAF, Wikidata, MusicBrainz&hellip;) and contributing databases. The panel stays open while you scroll the table, and the cross or the <em>Esc</em> key closes it.</li>
							<li>The <em>visualization</em> has an ISNI record of its own, and it does not behave like the one above. Click an agent whose composer has an ISNI and a box appears in the information column, between the orange box and the purple one, headed by that identifier. Click the header to unfold the record. It sits in the column instead of over it, so nothing is hidden, and nothing is requested until you unfold it.</li>
						<?php if($id==1){ ?>
							<li>By default <em>All works</em> shows the whole collection on the canvas. You can also pick a <em>country</em> in the Country menu to filter the table and the visualization to that country's composers, pick another to switch, or come back to <em>All works</em>. This collection holds <?php echo $n_oeuvres_ici ?> works, so <em>All works</em> takes a moment to build. The number of agents on screen is capped either way, and each one carries several works in turn rather than standing for a single one.</li>
						<?php } ?>
						<?php if($id==2){ ?>
							<li>By default <em>All works</em> shows the whole collection on the canvas. You can also pick a <em>country</em> in the Country menu to filter the table and the visualization to that country's composers.</li>
						<?php } ?>
						</ul>
					</div>
					<div>
						<p><strong>Agents</strong></p>
						<ul>
							<li>On the canvas, each moving ellipse is an agent carrying one archived work.</li>
							<li><span class="sq" style="background:#bdc3c7"></span> An agent, still looking for others sharing a common property.</li>
							<li><span class="sq" style="background:#2ecc71"></span> A grouping. Click it to open it.</li>
							<li><span class="sq" style="background:#f1c40f"></span> An opened grouping, showing its members. Double-click it to close it.</li>
							<li><span class="sq" style="background:#3498db"></span> A single work inside an opened grouping. Click it to display its details in the information column: the orange box names the composer and their country, the purple one describes the work, and a blue box appears between them when that composer has an ISNI.</li>
						</ul>
						<p><strong>Grouping</strong></p>
						<ul>
							<li>Agents compare their properties as they move. Candidate properties and their exchange counts appear in the white panel of the top bar, and a property such as <em>name</em> or <em>minutes</em>, the duration rounded to the nearest minute, becomes clickable once exchanged often enough.</li>
							<li>Click that property name to let the agents regroup around it.</li>
							<li><em>reset</em> restarts the system and <em>pause</em> freezes it. The space bar does the same as <em>pause</em>.</li>
						</ul>
					</div>
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
		<div id="infos">
			<div id="cookies"></div>
			<div id="selection"></div>
			<div id="isniColumn"></div>
			<ul id="titles"></ul>
		</div>
		</div>
		</div>
		</div>
 	</div>
</body>
</html>