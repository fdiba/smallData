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
	function nb($n){ return ($n === null) ? '?' : number_format($n, 0, ',', '&thinsp;'); }

	$primee = 'imeb_music.award_year IS NOT NULL';
	$noeud = "COALESCE(c.libelle, imeb_music.award_cat, 'None')";
	$jointure = "FROM imeb_music LEFT JOIN imeb_categorie c ON c.id = imeb_music.id_categorie WHERE $primee";

	$n_recompenses  = compte($dbh, "SELECT COUNT(*) FROM imeb_music WHERE $primee");
	$n_compositeurs = compte($dbh, "SELECT COUNT(DISTINCT imeb_music.id_artist) FROM imeb_music WHERE $primee");
	$n_editions     = compte($dbh, "SELECT COUNT(DISTINCT imeb_music.award_year) FROM imeb_music WHERE $primee");
	$n_libelles     = compte($dbh, "SELECT COUNT(*) FROM (SELECT DISTINCT $noeud L $jointure) t");
	$n_flux_g       = compte($dbh, "SELECT COUNT(*) FROM (SELECT DISTINCT imeb_music.award_year, $noeud L $jointure) t");
	$n_flux_d       = compte($dbh, "SELECT COUNT(*) FROM (SELECT DISTINCT $noeud L, imeb_music.id_artist $jointure) t");
	$n_sans_fest    = compte($dbh, "SELECT COUNT(*) FROM imeb_music WHERE $primee AND (imeb_music.editions IS NULL OR imeb_music.editions = '')");
	$n_none         = compte($dbh, "SELECT COUNT(*) FROM imeb_music WHERE $primee AND imeb_music.id_categorie IS NULL AND imeb_music.award_cat IS NULL");
	$n_none_73_76   = compte($dbh, "SELECT COUNT(*) FROM imeb_music WHERE imeb_music.award_year BETWEEN 1973 AND 1976 AND imeb_music.id_categorie IS NULL AND imeb_music.award_cat IS NULL");
	$n_distinctions = compte($dbh, "SELECT COUNT(*) FROM imeb_music WHERE $primee AND imeb_music.award_cat IN (_utf8mb4 0x52C3A9736964656E6365, _utf8mb4 0x4D6167697374C3A87265)");
	$n_isni         = compte($dbh, "SELECT COUNT(DISTINCT imeb_music.id_artist) FROM imeb_music INNER JOIN imeb_artist a ON a.id = imeb_music.id_artist WHERE $primee AND a.isni IS NOT NULL AND a.isni <> ''");
	$n_cat_2000     = compte($dbh, "SELECT COUNT(*) FROM imeb_music WHERE imeb_music.award_year >= 2000 AND imeb_music.id_categorie IS NOT NULL");
	$n_douze        = compte($dbh, "SELECT COUNT(DISTINCT imeb_music.id_categorie) FROM imeb_music WHERE imeb_music.award_year >= 2000 AND imeb_music.id_categorie IS NOT NULL");

	$n_noeuds_court = ($n_editions === null || $n_libelles === null) ? null : $n_editions + $n_libelles;
	$n_noeuds_plein = ($n_noeuds_court === null || $n_compositeurs === null) ? null : $n_noeuds_court + $n_compositeurs;
	$n_flux_plein   = ($n_flux_g === null || $n_flux_d === null) ? null : $n_flux_g + $n_flux_d;
	$n_nommes       = ($n_libelles === null) ? null : $n_libelles - 1;

	// ?d=1 : year -> category (defaut) ; ?d=2 : year -> category -> composer
	$vue = (isset($_GET['d']) && $_GET['d'] === '2') ? 'full' : 'light';

?>
<!DOCTYPE html>
<html>
<head>
	<title>Award-winning composers | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/sankey.css">
	<link rel="stylesheet" type="text/css" href="css/isni.css">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main">Categories</h1>
				<p></p>
			</div>
			<div id="view" data-view-default="<?php echo $vue ?>">
				<label>diagram</label>
				<ul>
					<li class="<?php echo $vue === 'light' ? 'b_on' : 'b_off' ?>" data-view="light" role="button" tabindex="0" aria-pressed="<?php echo $vue === 'light' ? 'true' : 'false' ?>">year &rarr; category</li>
					<li class="<?php echo $vue === 'full' ? 'b_on' : 'b_off' ?>" data-view="full" role="button" tabindex="0" aria-pressed="<?php echo $vue === 'full' ? 'true' : 'false' ?>">year &rarr; category &rarr; composer</li>
				</ul>
			</div>
			<?php include_once("./php/menus.php") ?>
		</div>
		<div id="legend" class="is-collapsed">
			<button type="button" id="lg_toggle" class="lg-title" aria-expanded="false" aria-controls="lg_body">
				How to read this page<span class="lg-caret" aria-hidden="true"></span>
			</button>
			<div id="lg_body">
				<div class="lg-cols">
					<div>
						<p><strong>The diagram</strong></p>
						<ul>
							<li>It follows the prize list from left to right: the <em>year</em> of the award, the <em>category</em> it was given in, and the <em>composer</em> who received it. It gathers <?php echo nb($n_recompenses) ?> awards to <?php echo nb($n_compositeurs) ?> composers under <?php echo nb($n_nommes) ?> labels, across the <?php echo nb($n_editions) ?> editions of 1973 to 2009. No competition was held in 1995.</li>
							<li>The <em>diagram</em> switch above gives two views of the same data. <em>year &rarr; category</em> fits one screen<?php echo $vue === 'light' ? ' and is where the page opens' : '' ?>. <em>year &rarr; category &rarr; composer</em> adds the <?php echo nb($n_compositeurs) ?> composers and is some ten times taller<?php echo $vue === 'full' ? ', and is where the page opens' : '' ?>.</li>
							<li>Both views share their first two columns, and every total is the same in both. The short view holds <?php echo nb($n_noeuds_court) ?> nodes and <?php echo nb($n_flux_g) ?> flows, the full one <?php echo nb($n_noeuds_plein) ?> and <?php echo nb($n_flux_plein) ?>.</li>
						</ul>
						<p><strong>The two years</strong></p>
						<ul>
							<li>The <em>awarded</em> year is the year of the prize. The <em>festival</em> years are those in which the work was programmed at Bourges. The two usually coincide, and they need not.</li>
							<li>For <?php echo nb($n_sans_fest) ?> of the <?php echo nb($n_recompenses) ?> awards no programming year is recorded at all. The <em>festival</em> mention is then simply omitted, which is an absence of evidence and not evidence of absence.</li>
						</ul>
					</div>
					<div>
						<p><strong>The columns and the flows</strong></p>
						<ul>
							<li>The thickness of a flow is the number of awards it carries.</li>
							<li>Flows on the left run from a year to a category. In the full view, flows on the right run from a category to a composer.</li>
							<li>Colours only tell neighbouring flows apart. They carry no meaning of their own.</li>
							<li>The <?php echo nb($n_none) ?> awards recorded without a category are gathered under <em>None</em>. <?php echo nb($n_none_73_76) ?> of them fall between 1973 and 1976, when the competition still had a single ranking; the rest are the Pierre d'Or and Pierre d'Argent of 1999 and 2001, which reward a work of the repertoire and not an entry.</li>
							<li>The full prize list, work by work, is on the <a href="award-winning_works.php">Award-winning works</a> page.</li>
						</ul>
						<p><strong>Hovering and clicking</strong></p>
						<ul>
							<li>Hover a flow on the left for what a category received that year: <em>Programme, 1988 &mdash; 7 awards</em>.</li>
							<li>Hover a node for what the diagram does <em>not</em> show. A year reads <em>31 awards in 6 categories</em>, a composer <em>9 awards in 6 categories</em>.</li>
							<li>A category opens with <strong>the period it covers</strong>, as in <em>1977-1998 &mdash; 79 awards to 66 composers, across 20 editions</em>. That period is the one the competition declared, and <em>editions</em> counts the years in which it actually distinguished something. The two need not agree.</li>
							<li>In the full view, hover a flow on the right for the composer, the category and the years concerned: <em>Robert Normandeau &mdash; 2 awards in Programme (awarded 1988, 1993 &middot; festival 1988, 1993)</em>.</li>
							<li>In the full view, a name with a dotted underline has an ISNI, <?php echo nb($n_isni) ?> of the <?php echo nb($n_compositeurs) ?>. Click it to open the public authority record.</li>
						</ul>
					</div>
					<div>
						<p><strong>The categories</strong></p>
						<ul>
							<li><strong>Two nodes each carry two names</strong>, and the catalogue keeps both. <em>Studio</em> covers what the catalogue calls <em>&Eacute;lectroacoustique</em> in 1985&ndash;1991 and <em>Studio</em> in 1993&ndash;1998, the two bailiff's records that define it naming it alike. 1992 is empty inside that span without being a gap: the twentieth competition was open for one degree only, the R&eacute;sidence, so it ranked nothing and had no category to name. <em>Multim&eacute;dia</em> is the second such node, and it covers 1999&ndash;2009.</li>
							<li><strong>A node marked <em>&#10022;</em> is a distinction, not a category.</strong> The <em>Magist&egrave;re</em> crowns a whole edition, and the <em>R&eacute;sidence</em> is a residency offered rather than a ranked award. They carry <?php echo nb($n_distinctions) ?> of the <?php echo nb($n_recompenses) ?> awards, from 1988 on. They sit on this axis only because the printed catalogue puts them there.</li>
							<li><?php echo nb($n_douze) ?> categories were defined in 2000, from <em>&oelig;uvre d'esth&eacute;tique formelle</em> to <em>&oelig;uvre pour le multim&eacute;dia</em>. They carry <?php echo nb($n_cat_2000) ?> of the <?php echo nb($n_recompenses) ?> awards.</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
		<div id="chart"></div>
 	</div>
	<script src="lib/jquery-3.1.1.min.js"></script>
	<script src="js/isni_box.js"></script>
	<script src="lib/d3.v3.min.js" charset="utf-8"></script>
	<script src="lib/erase_old_sankey.js"></script>
	<script src="js/categories.js"></script>
	<script src="js/legend_toggle.js"></script>
</body>
</html>