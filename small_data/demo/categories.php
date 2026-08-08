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
			<!-- Commutateur de vue. Il reprend deux tournures deja presentes
			     dans la barre, et n'en introduit aucune : le libelle de
			     #searchBox (index.php) et les boutons b_on / b_off de
			     #launcher. Sa place ici, entre le titre et les menus, est
			     celle de #launcher sur index.php.
			     La page arrive sur la vue allegee — voir l'en-tete de
			     js/categories.js. L'etat ecrit ci-dessous n'est que l'etat
			     initial : js/categories.js le repose au chargement, puis a
			     chaque clic. Une page sans JavaScript n'a de toute facon pas
			     de diagramme a commuter. -->
			<div id="view">
				<label>diagram</label>
				<ul>
					<li class="b_on" data-view="light" role="button" tabindex="0" aria-pressed="true">year &rarr; category &rarr; sub category</li>
					<li class="b_off" data-view="full" role="button" tabindex="0" aria-pressed="false">year &rarr; category &rarr; composer</li>
				</ul>
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
				<p class="lg-intro">This diagram follows the IMEB competition prize list from left to right: the <em>year</em> of the award, the <em>category</em> in which it was given, and the <em>composer</em> who received it. It gathers <em>727 awards</em> to <em>507 composers</em> across <em>22 named labels</em> and <em>36 editions</em>, from 1973 to 2009 &mdash; no competition was held in 1995. <strong>Two of those labels are not categories</strong>: the <em>Magistère</em> and the <em>Résidence</em> are <em>distinctions</em>, awarded across categories, which the <em>Répertoire général</em> nevertheless records in the category column. They carry <em>146 of the 727 awards</em>, from 1988 on, and are marked here with a <em>&#10022;</em>. Two views of the same data are available from the <em>diagram</em> switch above: <em>year &rarr; category &rarr; sub category</em>, which fits roughly one screen and is where the page opens, and <em>year &rarr; category &rarr; composer</em>, which adds the 507 composers and is some ten times taller.</p>
				<p class="lg-note">Two different years are recorded, and the diagram keeps them apart. <em>awarded</em> is the year of the prize; <em>festival</em> lists the years in which the work was programmed at Bourges. The two usually coincide, but need not: 69 awarded works were also played in another edition, and 7 carry an award year that is not among their programming years. For <em>236 of the 727 awards</em> the <em>Répertoire général</em> records no programming year at all; the <em>festival</em> mention is then simply omitted, which is an absence of evidence and not evidence that the work was never played.</p>
				<div class="lg-cols">
					<div>
						<p><strong>The flows</strong></p>
						<ul>
							<li>the thickness of a flow is the <em>number of awards</em> it carries: a composer distinguished twice in the same category shows a band twice as thick as a composer distinguished once</li>
							<li>flows on the left run from a year to a category and, in the full view, flows on the right from a category to a composer; a category therefore gathers, on one side, the editions that awarded it and, on the other, the composers it distinguished</li>
							<li>categories are the competition's own labels, and they changed over the years; the 38 awards recorded without one are gathered under <em>None</em></li>
							<li><strong>a node marked <em>&#10022;</em> is a distinction, not a category.</strong> The <em>Magistère</em> crowns a whole edition &mdash; the 1988 bailiff's record calls it <em>1er MAGISTERIUM du 16&egrave;me Concours</em>, with no category and no rank &mdash; and the <em>Résidence</em> is a residency offered, not a ranked award. Both are given <em>across</em> the categories, and both appear on this axis only because the printed catalogue puts them there. They are kept rather than hidden: dropping them would lose a fifth of the prize list. One 2005 work holds a <em>Magistère</em> while belonging to a real category, <em>Trivium A</em>, and it is shown under that one</li>
							<li><strong>sub categories appear in the short view only.</strong> They exist from 2000 on and only under five categories &mdash; Trivium, Trivium A, Trivium B, Quadrivium and Arts Electroniques &mdash; and <em>152 of the 727 awards</em> carry one. Adding them to the full view was tried and dropped: beside 507 composers the extra column made an already very tall diagram unreadable</li>
							<li>in the short view the last column holds <strong>the finest classification each work has</strong> &mdash; its sub category where there is one, its category otherwise &mdash; so <em>Résidence</em> and <em>Multimédia</em> sit side by side there. What that column aligns is not a common nature but a common end point, and the hover bubble keeps them apart. No <em>None</em> node was added for the 575 awards without a sub category: one carrying 575 would dwarf the twelve real ones</li>
							<li>colours only tell neighbouring flows apart &mdash; they carry no meaning of their own</li>
						</ul>
					</div>
					<div>
						<p><strong>Hovering and clicking</strong></p>
						<ul>
							<li>hover a flow on the left for the awards a category received in a given year, in the form <em>Programme, 1988 &mdash; 7 awards</em>; a flow from a category to a sub category reads the same way, as in <em>Multimédia, Quadrivium &mdash; 5 awards</em></li>
							<li>hover a node &mdash; a year, a category, a composer &mdash; for what the diagram does <em>not</em> show. Its label is not repeated, since it is already written beside it: a year reads <em>30 awards in 6 categories</em>, a composer <em>5 awards in 3 categories</em></li>
							<li>a category opens with <strong>the period it covers</strong>, as in <em>1977-1998 &mdash; 79 awards to 66 composers, across 20 editions</em>. That period is the category's own span, as the competition defined it; <em>editions</em> counts the years in which it actually distinguished something. The two need not agree, and the gap between them is itself worth reading. Totals and period are the same in both views</li>
							<li>a sub category reads <em>2000-2009 &mdash; 27 awards to 26 composers, in 2 categories : Quadrivium, Trivium B</em>. It is fed by categories, not by years, so it counts them rather than editions &mdash; <strong>and it names them</strong>, since a sub category may sit under one, two or three, and the flows are hard to follow by eye where they cross. <strong>Its years are not of the same kind as a category's</strong>: a category's span is declared by the competition's own table, a sub category's is simply the earliest and latest award it carries, because no table records one for them</li>
							<li>in the full view, hover a flow on the right for the composer, the category and the years concerned, in the form <em>Robert Normandeau &mdash; 2 awards in Programme (awarded 1988, 1993 &middot; festival 1988, 1993)</em></li>
							<li>in the full view, a name carrying a <em>dotted underline</em> has an ISNI identifier &mdash; 318 of the 507 composers: click it to open the public authority record, with the works held by the Bibliothèque nationale de France where the alignment allows it</li>
							<li>the full prize list, work by work, is on the <a href="award-winning_works.php">Award-winning works</a> page</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
		<div id="chart"></div>
 	</div>
	<!-- jQuery n'etait pas charge sur cette page : il l'est desormais pour la
	     fiche ISNI (js/isni_box.js), qui en depend. d3 ne s'en sert pas.
	     Fiche ISNI : code partage par les quatre pages qui affichent un ISNI
	     (voir l'en-tete de js/isni_box.js). Le point d'entree, lui, reste dans
	     js/categories.js — ici le <text> SVG du noeud compositeur. -->
	<script src="lib/jquery-3.1.1.min.js"></script>
	<script src="js/isni_box.js"></script>
	<script src="lib/d3.v3.min.js" charset="utf-8"></script>
	<!-- <script src="lib/d3-sankey.min.js"></script> -->
	<script src="lib/erase_old_sankey.js"></script>
	<script src="js/categories.js"></script>
	<!-- Repli de la legende "How to read", partage par les sept pages qui en portent une : voir l'en-tete de js/legend_toggle.js -->
	<script src="js/legend_toggle.js"></script>
</body>
</html>