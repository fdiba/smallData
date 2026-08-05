<!DOCTYPE html>
<html>
<head>
	<title>Overview | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/overview.css">
	<link rel="stylesheet" type="text/css" href="css/isni.css">
	<?php include_once("../../analyticstracking.php") ?>
	<script src='lib/perlin.js'></script>
	<script src="lib/jquery-3.1.1.min.js"></script>
    <script src="lib/jquery.cookie.js"></script>
    <script src="js/variables.js"></script>
    <script src="js/functions.js"></script>
    <!-- Fiche ISNI : code partage par les pages qui affichent un ISNI (voir
         l'en-tete de js/isni_box.js). Depend de jQuery, donc charge apres lui,
         et AVANT js/overview.js qui appelle enableIsniPanel() et esc(). -->
    <script src="js/isni_box.js"></script>
    <script src="js/overview_sma.js"></script>
	<script src="js/overview.js"></script>
	<!-- Repli de la legende "How to read", partage par les sept pages qui en portent une : voir l'en-tete de js/legend_toggle.js -->
	<script src="js/legend_toggle.js"></script>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main">Small Data</h1>
				<p></p>
			</div>
			<ul id="launcher">
				<li class="b_off" id="get_all">get all data</li>
				<li class="b_off" id="anim">anim</li>
			</ul>
			<?php include_once("./php/menus.php") ?>
			<!-- Les deux outils de la page sont EMPILES et forment un seul bloc,
			     cale a droite de la barre. Groupes dans #tools plutot que poses
			     cote a cote dans #ctrl_bar : elements independants, ils se
			     reordonnaient au gre des retours a la ligne du flex et le filtre
			     passait sous les menus. Un seul element ne se coupe pas en deux.
			     Voir css/overview.css. -->
			<div id="tools">
				<div class="tool-row">
					<div id="searchBox">
						<label for="searchTerms">composer name</label>
						<form id="myForm">
						    <input id="searchTerms" type="text" value="">
						</form>
					</div>
					<div id="searchBoxBtn"></div>
				</div>
				<div class="tool-row">
					<div id="filters">
						<label for="numOfRecords">num of records &gt;=</label>
						<form id="formFilters">
						    <!-- <input id="year_01" type="text"> -->
						    <!-- <input id="year_02" type="text"> -->
						    <input id="numOfRecords" type="text" value="1">
						</form>
					</div>
					<div id="filtersBtn"></div>
				</div>
			</div>
		</div>
			<div id="board">
				<div id="left_col">
					<div id="allCanvas">
			<canvas id="myCanvas" width="500" height="500">
	            Votre navigateur ne supporte pas les canvas.
		    </canvas>
					</div>
		<div id="legend">
			<button type="button" id="lg_toggle" class="lg-title" aria-expanded="true" aria-controls="lg_body">
				How to read this page<span class="lg-caret" aria-hidden="true"></span>
			</button>
			<div id="lg_body">
			<p class="lg-note">Coverage &mdash; <span id="lg-incomplete" style="display:none">with <em>num of records</em> set to <em>0</em>, every participant is listed and this index is then knowingly incomplete &mdash; the competition minutes have been fully entered for the editions from <em>1973 to 1994</em>, but those from <em>1996 to 2009</em> are only partially processed, so the later editions are under-represented and some participations are missing. </span>No competition was held in <em>1995</em> (36 editions in all), so no square carries that year.</p>
			<div class="lg-cols">
				<div>
					<p><strong>The index</strong></p>
					<ul>
						<li>each composer is a grey square followed by one coloured square per participation in the Bourges competitions</li>
						<li>the hue encodes the edition year, from red (1973) to pink (2009)</li>
						<li>washed-out squares mark composers with no archived work; vivid ones have recordings in the IMEB capsules</li>
					</ul>
				</div>
				<div>
					<p><strong>Selection &amp; search</strong></p>
					<ul>
						<li>click a square to select a composer: the boxes on the right fill up, and each of them is <strong>folded</strong> &mdash; the orange one names the composer, their country code and how many editions they entered; the purple one counts their archived works. Click a box's header to unfold it, click again to fold it back</li>
						<li>a third box appears between the two <strong>only for composers who have an ISNI</strong>, and its header is that identifier. Unfold it to load the international identity record &mdash; name forms, dates, external links (VIAF, Wikidata, MusicBrainz&hellip;) and contributing databases. Nothing is requested until you unfold it, and a record already opened once is kept for the session. Selecting another composer replaces it; selecting one without an ISNI removes it</li>
						<li>type a name in <em>composer name</em> to list matching composers; click a result to highlight their squares in yellow</li>
						<li><em>num of records &gt;=</em> rebuilds the index with only the composers having at least that many archived works</li>
						<li>a result marked <em>not in this index</em> has no square to highlight: some composers are in the repertoire without appearing in this participation grid, because no participation has been recorded for them in the minutes entered so far &mdash; their works are still listed on the catalogue and award pages</li>
						<!-- La reserve de provenance : imeb_edition melange une candidature
						     attestee, un nom releve au proces-verbal et une oeuvre programmee
						     au festival dont on a deduit la presence de son auteur. Le degre
						     signale le troisieme cas. Voir editionsHtml() dans js/overview.js. -->
						<li>a year followed by a degree sign (<em>1973&deg;</em>) means the composer had a work programmed at the <em>Synthese</em> festival that year, but no entry to the competition is attested: the year was inferred from the work, not read in the minutes</li>
					</ul>
				</div>
				<div>
					<p><strong>Navigation trace</strong></p>
					<ul>
						<li>every composer you consult joins the small canvas as a bubble, grouped by country &mdash; your navigation trace</li>
						<li>the green box counts the composers consulted so far; click a bubble to detail one country</li>
						<li>the trace is saved and can be replayed on the <em>Network</em> page with <em>compute traces</em></li>
					</ul>
				</div>
			</div>
			</div>
		</div>
				</div>
				<div id="right_col">
		    <canvas id="sma" width="250" height="250">
		    </canvas>
		<div id="infos">
			<div id="cookies"></div>
		    <div id="selection"><p>no selection</p></div>
		    <!-- Fiche ISNI du compositeur selectionne. Elle se pose ICI, entre
		         la boite orange d'ou part le clic et la liste des oeuvres :
		         en flux, elle ne recouvre rien (js/isni_box.js, option `into`).
		         Vide tant qu'aucun nom n'a ete clique. -->
		    <div id="isniColumn"></div>
		    <ul id="titles"></ul>
		    <ul id="results"></ul>
	    </div>
				</div>
			</div>
 	</div>
</body>
</html>