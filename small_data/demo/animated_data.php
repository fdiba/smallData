<!DOCTYPE html>
<html>
<head>
	<title>Line Charts | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/animated_data.css">
	<link rel="stylesheet" type="text/css" href="css/isni.css">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
	<script src="lib/jquery-3.1.1.min.js"></script>
	<!-- Fiche ISNI : code partage par les pages qui affichent un ISNI (voir
	     l'en-tete de js/isni_box.js). Depend de jQuery, donc charge apres lui. -->
	<script src="js/isni_box.js"></script>
	<script src="js/variables.js"></script>
	<script src="js/functions.js"></script>
	<script src="js/barchart.js"></script>
	<script src="js/linechart.js"></script>
	<script src="js/animated_data.js"></script>
	<!-- Repli de la legende "How to read", partage par les sept pages qui en portent une : voir l'en-tete de js/legend_toggle.js -->
	<script src="js/legend_toggle.js"></script>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main">Line Charts</h1>
				<p></p>
				<p></p>
				<p></p>
			</div>
			<?php include_once("./php/menus.php") ?>
			<ul id="launcher">
				<li class="b_off" id="get_all">get all data</li>
			</ul>
		</div>
		<div id="allCanvas">
			<canvas id="cv_nav" width="500" height="20">
		        Votre navigateur ne supporte pas les canvas.
		    </canvas>
			<canvas id="myCanvas" width="500" height="500">
		        Votre navigateur ne supporte pas les canvas.
		    </canvas>
		</div>
		<div id="legend">
			<button type="button" id="lg_toggle" class="lg-title" aria-expanded="true" aria-controls="lg_body">
				How to read this page<span class="lg-caret" aria-hidden="true"></span>
			</button>
			<div id="lg_body">
			<p class="lg-note">Coverage &mdash; this chart is knowingly incomplete, and the strip above each edition square says how. The minutes were transcribed <em>and</em> entered into the database for the <em>22 editions of 1973&ndash;1994</em>. For <em>six editions</em> (1996, 1999, 2005, 2006, 2007, 2008) the minutes were transcribed but <em>never imported</em>: the 1996 minutes list 500 entrants, the database holds 128. For <em>eight editions</em> (1997, 1998, 2000&ndash;2004, 2009) <em>no minutes were processed at all</em>. From 1996 on, what the chart counts is therefore mostly composers whose work entered the collection, not entrants to the competition &mdash; the drop after 1995 measures the archiving effort, not the competition, which kept drawing 500 to 633 entrants an edition. A selection is therefore flagged <em>complete data</em> up to 1994 and <em>incomplete data</em> from 1996 on (next to the page title). No competition was held in <em>1995</em> (36 editions in all), so the timeline skips that year and the lines join 1994 directly to 1996. The visible dip in <em>1992</em> is real: that edition marked the competition's 20th anniversary and took the form of a retrospective &mdash; the <em>Euphonies d'Or</em>, honouring the finest works of 1973&ndash;1991 &mdash; rather than an open call for new entries, so far fewer participants were recorded that year.</p>
			<div class="lg-cols">
				<div>
					<p><strong>Timeline (top strip)</strong></p>
					<ul>
						<li><span class="sq" style="background:#ecf0f1"></span> one square per edition of the competition — the first square, <em>all</em>, charts every edition from 1973 to 2009</li>
						<!-- Le lisere de provenance, dessine par drawPvStrip() dans js/animated_data.js. -->
						<li><span class="sq" style="background:#2ecc71"></span> minutes transcribed <em>and</em> entered &mdash; the count is reliable</li>
						<li><span class="sq" style="background:#e67e22"></span> minutes transcribed but <em>never imported</em> &mdash; the count falls far short</li>
						<li><span class="sq" style="background:#7f8c8d"></span> <em>no minutes processed</em> &mdash; only composers with an archived work appear</li>
						<li><span class="sq" style="background:#1abc9c"></span> selected edition(s)</li>
						<li><span class="sq" style="background:#f1c40f"></span> editions inside the selected time span</li>
						<li><span class="sq" style="background:#e74c3c"></span> <em>span</em> toggle on: pick two years to chart the period between them &middot; <span class="sq" style="background:#ffcccc"></span> off: pick a single year to get a bar chart of that edition</li>
					</ul>
				</div>
				<div>
					<p><strong>Charts</strong></p>
					<ul>
						<li>each line (or bar) is a country; the vertical axis counts the participants found in the competition minutes</li>
					<li>the vertical scale is square-root: countries with few participants stay readable next to the biggest ones (gridlines at 1, 2, 5, 10, 20, 50, 100&hellip;)</li>
						<li>in the chart legend, <em>c/t</em> means: <em>c</em> composers with archived works out of <em>t</em> participants from that country</li>
						<li>next to each country, the left square shows or hides its line, the right one highlights it</li>
						<li>click a point on a line to list, below, all the composers of that country</li>
					</ul>
				</div>
				<div>
					<p><strong>Composers list</strong></p>
					<ul>
						<li><span class="demo demo-active">Name (n)</span> n works archived in the IMEB capsules — click the name to list them</li>
						<li><span class="demo demo-selected">Name</span> took part in the selected edition</li>
						<!-- Le nom masque : voir SHOW_ALL_NAMES / maskName dans js/animated_data.js. -->
						<li><span class="demo">J****** D*****</span> listed in the minutes, but no archived work &mdash; the name is withheld and the entry is not clickable: what is recorded here is an <em>application</em> to the competition, not a published work</li>
						<li>the orange bar sums up the current selection — click it to switch between all composers and those of the selected edition only</li>
						<li>clicking a name opens a panel on the right: the composer's name, then the number of their archived works &mdash; click that count to unfold the list. For a composer who <strong>has an ISNI</strong>, a third box appears between the two, headed by that identifier: click the header to unfold the international identity record. Nothing is requested until you unfold it</li>
					</ul>
				</div>
			</div>
			</div>
		</div>
	    <div id="selection"><p>no selection</p></div>
	    <ul id="composers"></ul>
	    <!-- Panneau de droite, en trois etages solidaires : le NOM du
	         compositeur choisi, la fiche ISNI qu'il ouvre, puis ses
	         oeuvres. Le tout est place a droite de la legende et a hauteur de
	         la barre orange #selection par positionWorkPanel()
	         (js/animated_data.js) — c'est le panneau qui est positionne, pas
	         chacune des boites, et il ne remonte jamais au-dessus de la barre. -->
	    <div id="workPanel">
	        <div id="composerBox"></div>
	        <div id="isniColumn"></div>
	        <ul id="titles"></ul>
	    </div>
    </div>
</body>
</html>
