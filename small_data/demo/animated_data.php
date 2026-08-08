<!DOCTYPE html>
<html>
<head>
	<title>Participation | Small Data</title>
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
	<!-- Matrice pays x editions + bandeau de flux cumule. APRES linechart.js,
	     et non par gout de l'ordre : elle lui emprunte retrieveData() a la
	     lecture du fichier plutot que d'en tenir une copie (voir le pied de
	     js/matrixchart.js). Chargee avant, l'emprunt echouerait sans bruit et
	     le clic sur une cellule ne chargerait plus aucun compositeur. -->
	<script src="js/matrixchart.js"></script>
	<script src="js/animated_data.js"></script>
	<!-- Repli de la legende "How to read", partage par les sept pages qui en portent une : voir l'en-tete de js/legend_toggle.js -->
	<script src="js/legend_toggle.js"></script>
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
			<!-- Commutateur de vue. Meme bloc que sur categories.php, au
			     caractere pres : deux boutons b_on / b_off dans la barre de
			     controle. La matrice est la vue par defaut ; le line chart
			     reste accessible, ce qui est la seule facon de verifier a
			     tout moment qu'aucune fonction n'a ete perdue. Grise quand
			     une seule edition est selectionnee (diagramme en barres) :
			     voir setViewSwitchEnabled() dans js/animated_data.js. -->
			<div id="view">
				<label>chart</label>
				<ul>
					<li class="b_on" data-view="matrix" role="button" tabindex="0" aria-pressed="true">matrix &middot; countries &times; editions</li>
					<li class="b_off" data-view="line" role="button" tabindex="0" aria-pressed="false">line chart &middot; one line per country</li>
				</ul>
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
			<p class="lg-note">Coverage &mdash; this chart is knowingly incomplete, and the strip above each edition square says <em>on what authority</em> each edition is counted. For the <em>fifteen editions of 1973&ndash;1987</em> the bailiff's record of deposit &mdash; the original is at the Biblioth&egrave;que nationale de France &mdash; has been <em>transcribed into the database in full</em>: those counts are attested entry by entry, and they are exact. For <em>1988&ndash;1994</em> a transcription of the minutes was entered, but no bailiff's record backs it. From <em>1996 on</em> the count rests mainly on a recapitulative list of entrants kept by the IMEB itself &mdash; a second-hand document, and a fallible one: it omits 92 deposits that the bailiff's records attest. Where a first-hand record exists, that record wins and the list is never allowed to contradict it. Against the minutes themselves, the database holds roughly <em>three quarters</em> of the entrants they list: 348 of 500 for 1996, 474 of 633 for 2005, 364 of 506 for 2008. A selection is flagged <em>complete data</em> up to 1994 and <em>incomplete data</em> from 1996 on, next to the page title. No competition was held in <em>1995</em> (36 editions in all), so the timeline skips that year and the lines join 1994 directly to 1996. Two low editions are not gaps in the record: <em>2004</em> (138), because the competition itself ran at a third of its size &mdash; the first three categories, the <em>Trivium A</em>, were not opened, and the IMEB's own chronicle records 154 works from only 132 composers, fewer than the database holds; and <em>1992</em> (124), because that edition marked the competition's 20th anniversary and took the form of a retrospective &mdash; the <em>Euphonies d'Or</em>, honouring the finest works of 1973&ndash;1991 &mdash; rather than an open call.</p>
			<p class="lg-note">Most of the people counted here have <em>no work in the collection at all</em>. The two figures beside the page title say how many of each: composers with a work in the IMEB capsules, and everyone the database records as an entrant. The gap between them is made of candidacies and nothing else &mdash; a name read off an entry list, with no music attached. That is why most names in the list below are withheld, and why the strip above each square matters more than the height of the line.</p>
			<div class="lg-cols">
				<div>
					<p><strong>Timeline (top strip)</strong></p>
					<ul>
						<li><span class="sq" style="background:#ecf0f1"></span> one square per edition of the competition — the first square, <em>all</em>, charts every edition from 1973 to 2009</li>
						<!-- Le lisere de provenance, dessine par drawPvStrip() dans js/animated_data.js.
						     Il n'est PLUS CODE EN DUR : il est lu dans imeb_participation par le
						     case 12 de php/retrieve_data.php, et se corrige a chaque edition versee. -->
						<li><span class="sq" style="background:#2ecc71"></span> <em>transcribed in full from the bailiff's record</em> &mdash; every entry is attested (1973&ndash;1987)</li>
						<li><span class="sq" style="background:#e67e22"></span> <em>minutes transcribed</em>, but not from the bailiff's record &mdash; the count is entered, not attested (1988&ndash;1994)</li>
						<li><span class="sq" style="background:#5dade2"></span> <em>counted from the entrants list</em> and from archived works &mdash; second-hand, and short of the minutes (1996&ndash;2009)</li>
						<li>within that last group, six editions have minutes that were transcribed but <em>never imported</em> (1996, 1999, 2005&ndash;2008), and eight have <em>no transcription at all</em> (1997, 1998, 2000&ndash;2004, 2009). That difference says what is left to do, not what the count is worth &mdash; so it is written here and not in the strip</li>
						<li><span class="sq" style="background:#1abc9c"></span> selected edition(s)</li>
						<li><span class="sq" style="background:#f1c40f"></span> editions inside the selected time span</li>
						<li><span class="sq" style="background:#e74c3c"></span> <em>span</em> toggle on: pick two years to chart the period between them &mdash; with only the first one picked the chart waits and says so &middot; <span class="sq" style="background:#ffcccc"></span> off: pick a single year to get a bar chart of that edition. In both of those cases the <em>chart</em> switch greys out: a single edition has neither a matrix nor a line to show, and a half-made span has nothing at all</li>
					</ul>
				</div>
				<div>
					<p><strong>Matrix</strong> &mdash; the default chart</p>
					<ul>
						<li>one row per country, one column per edition; the colour of a cell counts the entrants recorded for that country in that edition &mdash; on the authority the strip above the column names</li>
						<li><em>an empty cell is not a zero</em>: that country entered nothing that year. The grid keeps the hole, so a country's first entry, its single-edition appearances and the 1995 gap are read directly &mdash; none of which a line could show</li>
						<li>the scale is square-root, as it was on the old vertical axis: it now runs through the colour, so one entrant stays visible next to a hundred. The key sits top right</li>
						<li><em>rows: total &middot; first entry &middot; A&ndash;Z</em> reorders the matrix. Three orders, three questions: how large, how early, where is a given country</li>
						<li>click a country's name to isolate it: it takes a colour, and its share is stacked inside the band above. <em>The other rows do not disappear</em> &mdash; they fade back but keep their place, so isolating a second and a third country is the same gesture again, and the ones you chose are read <em>among</em> the others rather than instead of them. Eight at most carry a colour; beyond that they stay in the grey mass, because a ninth band is one nobody can read</li>
						<li>click a cell to list, below, all the composers of that country, and <em>click the same cell again to drop it</em> &mdash; a grid has no empty space to click into, so undoing is the same gesture twice. Clicking a column that is crossed out (1995), or the key, or the band, does nothing. <em>reset all</em> clears everything at once</li>
					</ul>
				</div>
				<div>
					<p><strong>Band on top</strong> &mdash; entrants per edition</p>
					<ul>
						<li>the outline is the total for each edition, every country together &mdash; the one figure sixty lines never allowed anyone to read</li>
						<li>the scale here is <em>linear</em>, not square-root: an area that is stacked must sum, and &radic;a + &radic;b is not &radic;(a+b). The square-root of this page lives in the colour of the cells, where it sums nothing</li>
						<li>the right-hand column totals each country <em>over the period on screen</em> — its heading says <em>this period</em> when a span is selected, <em>total</em> when the whole run is. The <em>c/t</em> figure to the left of the grid is a different reckoning: <em>c</em> composers with archived works out of <em>t</em> entrants from that country, <em>across all editions</em>, whatever the period shown</li>
						<li>1994 joins 1996 directly, in the band as on the lines: there was no 1995 edition, and a fall to zero would read as an empty one</li>
					</ul>
				</div>
				<div>
					<p><strong>Bar chart</strong> &mdash; one edition on its own</p>
					<ul>
						<li>turn <em>span</em> off and pick a single year: one bar per country, and the bar is read in two. Its full height counts the <em>entrants</em> recorded for that country &mdash; the same quantity as a point on a line or the colour of a cell. Its emerald foot counts how many of them have <em>a work in the collection</em></li>
						<li><em>the gap between the two is the subject of this database.</em> Of the people the index counts, about half left nothing but a candidacy &mdash; a name read off an entry list, with no music attached. The page has said so at the top and in the <em>c/t</em> figure since the start; the bars used to stack both into a single height, so a country with forty entrants of which two are archived and a country with forty entrants all archived drew the same bar</li>
						<li>hover a column for the exact figures; <em>click it to list that country's composers below</em>, exactly as clicking a line or a cell does &mdash; same orange bar, same list, same works panel. Click it again to clear</li>
					</ul>
				</div>
				<div>
					<p><strong>Line chart</strong> &mdash; the other view</p>
					<ul>
						<li>each line is a country; the vertical axis counts the entrants recorded for that edition, and the scale is square-root (gridlines at 1, 2, 5, 10, 20, 50, 100&hellip;)</li>
						<li>it is kept because it reads a <em>single</em> trajectory better than any matrix once a handful of countries are isolated &mdash; and because two views answering the same click on the same data is what makes a regression something anyone can check rather than something to be argued about</li>
						<li>in the chart legend, <em>c/t</em> has the same meaning; the square next to each country shows or hides its line</li>
						<li>click a point on a line to list, below, all the composers of that country</li>
					</ul>
				</div>
				<div>
					<p><strong>Composers list</strong></p>
					<ul>
						<li><span class="demo demo-active">Name (n)</span> n works archived in the IMEB capsules — click the name to list them</li>
						<li><span class="demo demo-selected">Name</span> took part in the selected edition</li>
						<!-- Le nom masque : voir SHOW_ALL_NAMES / maskName dans js/animated_data.js. -->
						<li><span class="demo">J****** D*****</span> recorded as an entrant, but no archived work &mdash; the name is withheld and the entry is not clickable: what is recorded here is an <em>application</em> to the competition, not a published work</li>
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
