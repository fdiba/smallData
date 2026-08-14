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
			<div id="view">
				<label>diagram</label>
				<ul>
					<li class="b_on" data-view="light" role="button" tabindex="0" aria-pressed="true">year &rarr; category</li>
					<li class="b_off" data-view="full" role="button" tabindex="0" aria-pressed="false">year &rarr; category &rarr; composer</li>
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
							<li>It follows the prize list from left to right: the <em>year</em> of the award, the <em>category</em> it was given in, and the <em>composer</em> who received it. It gathers 729 awards to 508 composers under 27 labels, across the 36 editions of 1973 to 2009. No competition was held in 1995.</li>
							<li>The <em>diagram</em> switch above gives two views of the same data. <em>year &rarr; category</em> fits one screen and is where the page opens. <em>year &rarr; category &rarr; composer</em> adds the 508 composers and is some ten times taller.</li>
							<li>Both views share their first two columns, and every total is the same in both. The short view holds 64 nodes and 195 flows, the full one 572 and 848.</li>
						</ul>
						<p><strong>The two years</strong></p>
						<ul>
							<li>The <em>awarded</em> year is the year of the prize. The <em>festival</em> years are those in which the work was programmed at Bourges. The two usually coincide, and they need not.</li>
							<li>For 234 of the 729 awards no programming year is recorded at all. The <em>festival</em> mention is then simply omitted, which is an absence of evidence and not evidence of absence.</li>
						</ul>
					</div>
					<div>
						<p><strong>The columns and the flows</strong></p>
						<ul>
							<li>The thickness of a flow is the number of awards it carries.</li>
							<li>Flows on the left run from a year to a category. In the full view, flows on the right run from a category to a composer.</li>
							<li>Colours only tell neighbouring flows apart. They carry no meaning of their own.</li>
							<li>The 39 awards recorded without a category are gathered under <em>None</em>. Thirty-eight of them fall between 1973 and 1976, when the competition still had a single ranking.</li>
							<li>The full prize list, work by work, is on the <a href="award-winning_works.php">Award-winning works</a> page.</li>
						</ul>
						<p><strong>Hovering and clicking</strong></p>
						<ul>
							<li>Hover a flow on the left for what a category received that year: <em>Programme, 1988 &mdash; 7 awards</em>.</li>
							<li>Hover a node for what the diagram does <em>not</em> show. A year reads <em>31 awards in 6 categories</em>, a composer <em>9 awards in 6 categories</em>.</li>
							<li>A category opens with <strong>the period it covers</strong>, as in <em>1977-1998 &mdash; 79 awards to 66 composers, across 20 editions</em>. That period is the one the competition declared, and <em>editions</em> counts the years in which it actually distinguished something. The two need not agree.</li>
							<li>In the full view, hover a flow on the right for the composer, the category and the years concerned: <em>Robert Normandeau &mdash; 2 awards in Programme (awarded 1988, 1993 &middot; festival 1988, 1993)</em>.</li>
							<li>In the full view, a name with a dotted underline has an ISNI, 396 of the 508. Click it to open the public authority record.</li>
						</ul>
					</div>
					<div>
						<p><strong>The categories</strong></p>
						<ul>
							<li><strong>Two nodes each carry two names</strong>, and the catalogue keeps both. <em>Studio</em> covers what the catalogue calls <em>&Eacute;lectroacoustique</em> in 1985&ndash;1991 and <em>Studio</em> in 1993&ndash;1998, the two bailiff's records that define it naming it alike. 1992 is empty inside that span without being a gap: the twentieth competition was open for one degree only, the R&eacute;sidence, so it ranked nothing and had no category to name. <em>Multim&eacute;dia</em> is the second such node, and it covers 1999&ndash;2009.</li>
							<li><strong>A node marked <em>&#10022;</em> is a distinction, not a category.</strong> The <em>Magist&egrave;re</em> crowns a whole edition, and the <em>R&eacute;sidence</em> is a residency offered rather than a ranked award. They carry 146 of the 729 awards, from 1988 on. They sit on this axis only because the printed catalogue puts them there.</li>
							<li>Twelve categories were defined in 2000, from <em>&oelig;uvre d'esth&eacute;tique formelle</em> to <em>&oelig;uvre pour le multim&eacute;dia</em>. They carry 152 of the 729 awards.</li>
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