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
			<?php include_once("./php/menus.php") ?>
		</div>
		<!-- Legende "How to read", septieme et derniere page a la recevoir.
		     Seule celle-ci est repliable et posee en fixe : voir la note qui
		     ouvre le bloc correspondant dans css/sankey.css. Le titre EST le
		     bouton de repli, de sorte que la bande reste visible une fois la
		     legende fermee.
		     La page arrive REPLIEE : ouverte, la legende couvre pres de la
		     moitie de la hauteur utile, et le diagramme est ce qu'on vient
		     voir. La classe est donc posee ici, dans le HTML, et non par le
		     script — la page ne s'ouvre pas sur un panneau qui se refermerait
		     sous les yeux. Le diagramme etant lui-meme dessine en JavaScript,
		     une page sans JavaScript n'a de toute facon rien a legender. -->
		<div id="legend" class="is-collapsed">
			<button type="button" id="lg_toggle" class="lg-title" aria-expanded="false" aria-controls="lg_body">
				How to read this page<span class="lg-caret" aria-hidden="true"></span>
			</button>
			<div id="lg_body">
				<p class="lg-intro">This diagram follows the IMEB competition prize list from left to right: the <em>year</em> of the award, the <em>category</em> in which it was given, and the <em>composer</em> who received it. It gathers <em>728 awards</em> to <em>508 composers</em> across <em>23 categories</em> and <em>36 editions</em>, from 1973 to 2009 &mdash; no competition was held in 1995.</p>
				<p class="lg-note">Two different years are recorded, and the diagram keeps them apart. <em>awarded</em> is the year of the prize; <em>festival</em> lists the years in which the work was programmed at Bourges. The two usually coincide, but need not: 69 awarded works were also played in another edition, and 7 carry an award year that is not among their programming years. For <em>237 of the 728 awards</em> the <em>Répertoire général</em> records no programming year at all; the <em>festival</em> mention is then simply omitted, which is an absence of evidence and not evidence that the work was never played.</p>
				<div class="lg-cols">
					<div>
						<p><strong>The flows</strong></p>
						<ul>
							<li>the thickness of a flow is the <em>number of awards</em> it carries: a composer distinguished twice in the same category shows a band twice as thick as a composer distinguished once</li>
							<li>flows on the left run from a year to a category, flows on the right from a category to a composer; a category therefore gathers, on one side, the editions that awarded it and, on the other, the composers it distinguished</li>
							<li>categories are the competition's own labels, and they changed over the years; the 38 awards recorded without one are gathered under <em>None</em></li>
							<li>colours only tell neighbouring flows apart &mdash; they carry no meaning of their own</li>
						</ul>
					</div>
					<div>
						<p><strong>Hovering and clicking</strong></p>
						<ul>
							<li>hover a flow on the right for the composer, the category and the years concerned, in the form <em>Robert Normandeau &mdash; 2 awards in Programme (awarded 1988, 1993 &middot; festival 1988, 1993)</em></li>
							<li>hover a flow on the left for the awards a category received in a given year, in the form <em>Programme, 1988 &mdash; 7 awards</em></li>
							<li>hover a node &mdash; a year, a category, a composer &mdash; for its totals, in the form <em>Programme &mdash; 78 awards to 67 composers, across 20 editions</em></li>
							<li>a name carrying a <em>dotted underline</em> has an ISNI identifier &mdash; 236 of the 508 composers: click it to open the public authority record, with the works held by the Bibliothèque nationale de France where the alignment allows it</li>
							<li>the full prize list, work by work, is on the <a href="award-winning_works.php">Award-winning works</a> page</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
		<div id="chart"></div>
 	</div>
	<!-- jQuery n'etait pas charge sur cette page : il l'est desormais pour la
	     fiche ISNI de js/categories.js, qui reprend telle quelle celle des
	     autres pages (requete vers php/retrieve_isni.php, placement de la
	     boite). d3 ne s'en sert pas ; seul js/categories.js en depend, il
	     suffit donc qu'il soit charge avant lui. -->
	<script src="lib/jquery-3.1.1.min.js"></script>
	<script src="lib/d3.v3.min.js" charset="utf-8"></script>
	<!-- <script src="lib/d3-sankey.min.js"></script> -->
	<script src="lib/erase_old_sankey.js"></script>
	<script src="js/categories.js"></script>
</body>
</html>