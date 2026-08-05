<!DOCTYPE html>
<html>
<head>
	<title>IMEB Award-winning Works | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/aww.css">
	<link rel="stylesheet" type="text/css" href="css/isni.css">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
	<script src="lib/jquery-3.1.1.min.js"></script>
	<!-- Fiche ISNI : code partage par les quatre pages qui affichent un ISNI
	     (voir l'en-tete de js/isni_box.js). Depend de jQuery, donc charge
	     apres lui ; les points d'entree, eux, restent dans les scripts de la
	     page — ici js/particles_award.js pour la boite violette du SMA. -->
	<script src="js/isni_box.js"></script>
	<script src="lib/perlin.js"></script>
	<script src="js/variables.js"></script>
	<script src="js/functions.js"></script>
	<script src="js/sma_core.js"></script>
	<script src="js/childs_award.js"></script>
	<script src="js/particles_award.js"></script>
	<script src="js/aww.js"></script>
	<!-- Repli de la legende "How to read", partage par les sept pages qui en portent une : voir l'en-tete de js/legend_toggle.js -->
	<script src="js/legend_toggle.js"></script>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main">IMEB Award-winning Works</h1>
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
			<div id="years">
				<p>Year</p>
				<ul></ul>
			</div>
			<div id="main_container">
				<div id="sma_note"></div>
				<canvas id="myCanvas" width="500" height="500">Votre navigateur ne supporte pas les canvas.</canvas>
				<div id="infos">
					<div id="cookies"></div>
				    <div id="selection"></div>
				    <!-- Fiche ISNI de l'agent selectionne dans le SMA. Elle se pose
				         ICI, entre la boite orange et la boite violette : en flux,
				         elle ne recouvre rien (js/isni_box.js,
				         enableIsniInflowFiche). C'est une AUTRE fiche que celle du
				         tableau, qui reste ce qu'elle etait. Vide tant qu'aucun
				         agent portant un ISNI n'a ete clique. -->
				    <div id="isniColumn"></div>
				    <ul id="titles"></ul>
			    </div>
		    </div>
			<div id="legend">
				<button type="button" id="lg_toggle" class="lg-title" aria-expanded="true" aria-controls="lg_body">
					How to read this page<span class="lg-caret" aria-hidden="true"></span>
				</button>
				<div id="lg_body">
				<p class="lg-intro">The Bourges International Competition of Electroacoustic Music, founded by the GMEB (later <em>IMEB</em>) in <em>1973</em>, was held almost every year until <em>2009</em> &mdash; 36 editions in all, with none in <em>1995</em>. It drew works from composers across dozens of countries: until <em>1977</em> entries shared a single ranking, after which they were split into categories and sub&nbsp;categories. Over the decades its distinctions took many forms &mdash; from the early numbered <em>Prix</em> to the <em>Grand&nbsp;Prix</em>, the <em>Magistère</em>, the <em>Résidence</em>, the <em>Prix&nbsp;CIME</em> and the retrospective <em>Euphonies&nbsp;d'Or</em>. This table gathers the award-winning works of those editions, grouped by edition, category, sub category and prize.</p>
				<div class="lg-cols">
					<div>
						<p><strong>Table &amp; agents</strong></p>
						<ul>
							<li>the table lists the award-winning works of the Bourges competitions, sorted by edition, category, sub category, price and last name</li>
							<li>a composer whose name is <span class="composer-isni">underlined with dots</span> has an ISNI: click either part of the name to open their international identity record in the panel on the right &mdash; name forms, dates, external links (VIAF, Wikidata, MusicBrainz&hellip;) and contributing databases. The panel stays open while you scroll the table; close it with the cross or the <em>Esc</em> key. Clicking an agent closes it, since it sits over the information boxes &mdash; but the loading counter alone leaves it open</li>
							<li>the <em>visualization</em> has an ISNI record of its own, and it does not behave like the one above: click an agent whose composer has an ISNI and a box appears in the information column, between the orange box and the purple one, headed by that identifier &mdash; click the header to unfold the record. It sits in the column instead of over it, so nothing is hidden, and nothing is requested until you unfold it</li>
							<li>on the canvas, each moving ellipse is an agent carrying one award-winning work</li>
						</ul>
					</div>
					<div>
						<p><strong>Agents</strong></p>
						<ul>
							<li><span class="sq" style="background:#bdc3c7"></span> an agent, still looking for others sharing a common property</li>
							<li><span class="sq" style="background:#2ecc71"></span> a grouping &mdash; click it to open it</li>
							<li><span class="sq" style="background:#f1c40f"></span> an opened grouping, showing its members &mdash; double-click it to close it</li>
							<li><span class="sq" style="background:#3498db"></span> a single work inside an opened grouping &mdash; click it to display its details in the information column: the <em>orange</em> box names the composer and their country, the <em>purple</em> one describes the work, and a <em>blue</em> box appears between them when that composer has an ISNI</li>
						</ul>
					</div>
					<div>
						<p><strong>Grouping</strong></p>
						<ul>
							<li>agents compare their properties as they move; candidate properties and their exchange counts appear in the white panel of the top bar, and a property (such as <em>edition</em> or <em>price</em>) becomes clickable once exchanged often enough</li>
							<li>click that property name to let the agents regroup around it</li>
							<li><em>reset</em> restarts the system, <em>pause</em> freezes it (the <em>p</em> key toggles the agents' drift)</li>
						</ul>
					</div>
				</div>
				</div>
			</div>
			<div id="main_table">
				<table id="works_table">
					<tr>
						<th>edition</th>
						<th>category</th>
						<th>sub category</th>
						<th>price</th>
						<th>first name</th>
						<th>last name</th>
						<th>country</th>
						<th>title</th>
					</tr>
				</table>
			</div>
			<div id="listing"></div>
		</div>
 	</div>
</body>
</html>