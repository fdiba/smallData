<!DOCTYPE html>
<html>
<head>
	<title>Participation | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<?php include_once("./php/asset.php") ?>
	<!-- Feuilles et scripts sont horodates par asset() : sans cela, une
	     correction deployee reste invisible tant que le lecteur n'a pas vide
	     son cache — verifie le 2026-08-11 sur une regle de main.css. Voir
	     l'en-tete de php/asset.php ; a reporter sur les six autres pages. -->
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/main.css') ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/animated_data.css') ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/isni.css') ?>">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
	<script src="lib/jquery-3.1.1.min.js"></script>
	<!-- Fiche ISNI : code partage par les pages qui affichent un ISNI (voir
	     l'en-tete de js/isni_box.js). Depend de jQuery, donc charge apres lui. -->
	<script src="<?php echo asset('js/isni_box.js') ?>"></script>
	<script src="<?php echo asset('js/variables.js') ?>"></script>
	<script src="<?php echo asset('js/functions.js') ?>"></script>
	<script src="<?php echo asset('js/barchart.js') ?>"></script>
	<script src="<?php echo asset('js/linechart.js') ?>"></script>
	<!-- Matrice pays x editions + bandeau de flux cumule. APRES linechart.js,
	     et non par gout de l'ordre : elle lui emprunte retrieveData() a la
	     lecture du fichier plutot que d'en tenir une copie (voir le pied de
	     js/matrixchart.js). Chargee avant, l'emprunt echouerait sans bruit et
	     le clic sur une cellule ne chargerait plus aucun compositeur. -->
	<script src="<?php echo asset('js/matrixchart.js') ?>"></script>
	<script src="<?php echo asset('js/animated_data.js') ?>"></script>
	<!-- Repli de la legende "How to read", partage par les sept pages qui en portent une : voir l'en-tete de js/legend_toggle.js -->
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
			<!-- Commutateur de vue. Meme bloc que sur categories.php, au
			     caractere pres : deux boutons b_on / b_off dans la barre de
			     controle. La matrice est la vue par defaut ; le line chart
			     reste accessible, ce qui est la seule facon de verifier a
			     tout moment qu'aucune fonction n'a ete perdue. Grise quand
			     une seule edition est selectionnee (diagramme en barres) :
			     voir setViewSwitchEnabled() dans js/animated_data.js. -->
			<!-- Le commutateur de COMPTE. Il agit en amont des trois vues, dans
			     updateSlData() : c'est la meme question posee aux memes
			     donnees, et les trois figures changent ensemble. Le drapeau
			     qu'il pilote, `takeCountIntoAccount`, existait depuis
			     l'origine dans js/animated_data.js, fige a `false` sous un
			     « TODO CONTROL USING GUI » : c'est ce controle-la. -->
			<div id="count">
				<label>count</label>
				<ul>
					<li class="b_on" data-count="all" role="button" tabindex="0" aria-pressed="true">all entrants</li>
					<li class="b_off" data-count="works" role="button" tabindex="0" aria-pressed="false">only those with a work</li>
				</ul>
			</div>
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
		<!-- La legende arrive REPLIEE depuis le 2026-08-11, comme categories.php et
		     pour la meme raison : ouverte, elle occupe plus de hauteur que le graphe
		     lui-meme, et le graphe est ce qu'on vient voir. L'etat d'arrivee s'ecrit
		     ICI et non dans js/legend_toggle.js — voir l'en-tete de ce fichier : une
		     page sans JavaScript garde la legende dans l'etat ou le serveur l'a
		     envoyee, et aucune page ne s'ouvre sur un panneau qui se refermerait sous
		     les yeux. -->
		<div id="legend" class="is-collapsed">
			<button type="button" id="lg_toggle" class="lg-title" aria-expanded="false" aria-controls="lg_body">
				How to read this page<span class="lg-caret" aria-hidden="true"></span>
			</button>
			<div id="lg_body">
			<p class="lg-note">Coverage &mdash; this chart is knowingly incomplete, and the strip above each edition square says <em>on what authority</em> each edition is counted. For the <em>twenty-two editions of 1973&ndash;1994</em> the bailiff's record of deposit &mdash; the original is at the Biblioth&egrave;que nationale de France &mdash; has been <em>transcribed into the database in full</em>: those counts are attested entry by entry, and they are exact. 1993 and 1994 joined that group in August 2026, the last two of the run. From <em>1996 on</em> the count rests mainly on a recapitulative list of entrants kept by the IMEB itself &mdash; a second-hand document, and a fallible one: it omits <em>269</em> deposits that the bailiff&rsquo;s records attest, and <em>every one</em> of those people is listed elsewhere in the same document under the same name &mdash; so a blank in that list proves nothing at all. Where a first-hand record exists, that record wins and the list is never allowed to contradict it. Against the minutes themselves, the database holds roughly <em>three quarters</em> of the entrants they list: 348 of 500 for 1996, 474 of 633 for 2005, 364 of 506 for 2008. A selection is flagged <em>complete data</em> up to 1994 and <em>incomplete data</em> from 1996 on, next to the page title. No competition was held in <em>1995</em> (36 editions in all), so the timeline skips that year and the lines join 1994 directly to 1996. Two low editions are not gaps in the record: <em>2004</em> (137), because the competition itself ran at a third of its size &mdash; the first three categories, the <em>Trivium A</em>, were not opened, and the IMEB&rsquo;s own chronicle records 154 works from only 132 composers, fewer than the database holds; and <em>1992</em> (112), because that year the competition was <em>open for one degree only</em> &mdash; the <em>Residence</em> &mdash; and the bailiff&rsquo;s record says so twice: &laquo;&nbsp;only the section Residence is open to candidates&nbsp;&raquo;, and &laquo;&nbsp;102 compositions were submitted&nbsp;&raquo;. The 20th-anniversary retrospective &mdash; the <em>Euphonies d&rsquo;Or</em>, honouring the finest works of 1973&ndash;1991 &mdash; was held the same year, but it was a <em>separate event</em>: this page long said 1992 was that retrospective <em>instead of</em> a competition, and the bailiff&rsquo;s record, read in August 2026, says otherwise. The 33 people whose only trace in 1992 is a work replayed at the retrospective are counted here as a <em>presence</em>, not a candidacy.</p>
			<p class="lg-note">Most of the people counted here have <em>no work in the collection at all</em>. The two figures beside the page title say how many of each: composers with a work in the IMEB capsules, and everyone the database records as an entrant. The gap between them is made of candidacies and nothing else &mdash; a name read off an entry list, with no music attached. That is why most names in the list below are withheld, and why the strip above each square matters more than the height of the line.</p>
			<div class="lg-cols">
				<div>
					<p><strong>Timeline (top strip)</strong></p>
					<ul>
						<li><span class="sq" style="background:#ecf0f1"></span> one square per edition of the competition — the first square, <em>all</em>, charts every edition from 1973 to 2009</li>
						<!-- Le lisere de provenance, dessine par drawPvStrip() dans js/animated_data.js.
						     Il n'est PLUS CODE EN DUR : il est lu dans imeb_participation par le
						     case 12 de php/retrieve_data.php, et se corrige a chaque edition versee. -->
						<li><span class="sq" style="background:#2ecc71"></span> <em>transcribed in full from the bailiff's record</em> &mdash; every entry is attested (1973&ndash;1994)</li>
						<li><span class="sq" style="background:#5dade2"></span> <em>counted from the entrants list</em> and from archived works &mdash; second-hand, and short of the minutes (1996&ndash;2009)</li>
						<li>within that last group, six editions have minutes that were transcribed but <em>never imported</em> (1996, 1999, 2005&ndash;2008), and eight have <em>no transcription at all</em> (1997, 1998, 2000&ndash;2004, 2009). That difference says what is left to do, not what the count is worth &mdash; so it is written here and not in the strip</li>
						<li><span class="sq" style="background:#1abc9c"></span> selected edition(s)</li>
						<li><span class="sq" style="background:#f1c40f"></span> editions inside the selected time span</li>
						<li><span class="sq" style="background:#e74c3c"></span> <em>span</em> toggle on: pick two years to chart the period between them &mdash; with only the first one picked the chart waits and says so &middot; <span class="sq" style="background:#ffcccc"></span> off: pick a single year to get a bar chart of that edition. In both of those cases the <em>chart</em> switch greys out: a single edition has neither a matrix nor a line to show, and a half-made span has nothing at all</li>
					</ul>
				</div>
				<div>
					<p><strong>Count</strong> &mdash; what the three charts count</p>
					<ul>
						<li><em>all entrants</em> &mdash; everyone the database records as having entered that edition, whether or not any music of theirs is in the collection. This is what the charts have always counted, and it is the honest measure of the <em>competition</em></li>
						<li><em>only those with a work</em> &mdash; the same people, minus those the database knows by a candidacy alone. This is the measure of the <em>collection</em>, and it is a good deal smaller: of the <em>4&nbsp;262</em> people the database records as entrants, <em>2&nbsp;773</em> have no archived work at all &mdash; nearly two in three, and the share grows with every edition transcribed, because a bailiff&rsquo;s record names entrants, not works</li>
						<li>the switch acts on all three charts at once, <em>and on the list of composers below them</em> &mdash; it is the same question put to the same data, so the figures change together. That last part had been promised here and was not done until 2026-08-11: the charts dropped the people known by a candidacy alone, and the list went on naming them just underneath. With the switch on, the list holds only composers with an archived work &mdash; so <em>no name in it is withheld any more</em>, and every line is clickable: a name published with a work is a published name. The <em>c/t</em> counts beside each country do not move: they state a fact about that country across all editions, not about the current selection</li>
					</ul>
				</div>
				<!-- Bloc ajoute le 2026-08-11. Il repond a une question posee sur la page,
				     et la reponse est une propriete du MODELE, pas un defaut du graphe :
				     `imeb_artist.id_country` porte l'Etat d'AUJOURD'HUI, `imeb_adresse.id_country`
				     celui que le document ECRIVAIT. Les trois charts comptent des PERSONNES,
				     donc le premier. Mesure du 2026-08-11 : 62 adresses du fonds sont en
				     Tchecoslovaquie, 22 en R.D.A., 9 en U.R.S.S. — et AUCUNE fiche. -->
				<div>
					<p><strong>Countries</strong> &mdash; whose map is this</p>
					<ul>
						<li><em>81 countries</em> are charted. The country shown is the one a person is attached to <em>today</em>, not the state named on the envelope they posted in &mdash; so this is the map of the present laid over a corpus that runs from 1973 to 2009</li>
						<li>the consequence is worth knowing before reading any line: <em>Czechoslovakia, the German Democratic Republic and the Soviet Union never appear</em>, though the database holds <em>62</em>, <em>22</em> and <em>9</em> addresses that name them on the deposit itself. The 29 Czechoslovak entrants of 1973&ndash;1991 are counted under Czech Republic (13) and Slovakia (16); the 11 East German entrants of 1977&ndash;1990 under Germany; the 7 Soviet entrants of 1989&ndash;1991 under Russia. <em>Yugoslavia</em> is the one vanished state still carried by a few people (3); the twelve others whose address says Yugoslavia are spread over its five successor states</li>
						<li>this is a decision, not an oversight. The address keeps the wording of the document &mdash; that is what a bailiff&rsquo;s record is for &mdash; while a person outlives the state they lived in and is looked up under the name that state has now. <em>Both answers are true and they are not the same</em>; a chart drawn on addresses instead of people would show the other one</li>
						<li><em>Unknown</em> is a country row like any other (25 people): the source names no state, and a blank is not a zero here either</li>
					</ul>
				</div>
				<div>
					<p><strong>Matrix</strong> &mdash; the default chart</p>
					<ul>
						<li>one row per country, one column per edition; the colour of a cell counts the entrants recorded for that country in that edition &mdash; on the authority the strip above the column names</li>
						<li><em>an empty cell is not a zero</em>: that country entered nothing that year. The grid keeps the hole, so a country's first entry, its single-edition appearances and the 1995 gap are read directly &mdash; none of which a line could show</li>
						<li>the scale is square-root, as it was on the old vertical axis: it now runs through the colour, so one entrant stays visible next to a hundred. The key sits top right</li>
						<li><em>rows: total &middot; first entry &middot; A&ndash;Z</em> reorders the matrix. Three orders, three questions: how large, how early, where is a given country</li>
						<li>click a country's name to isolate it: it takes a colour, and its share is stacked inside the band above. <em>The other rows fade back but keep their place</em>, so isolating a second and a third country is the same gesture again, and the ones you chose are read <em>among</em> the others rather than instead of them. Eight at most carry a colour; beyond that they stay in the grey mass, because a ninth band is one nobody can read</li>
						<li>click a cell to list, below, all the composers of that country, and <em>click the same cell again to drop it</em>. Clicking a column that is crossed out (1995), or the key, or the band, does nothing. <em>reset all</em> clears everything at once</li>
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
						<li><em>the gap between the two is the subject of this database</em>: of the people the index counts, about half left nothing but a candidacy &mdash; a name read off an entry list, with no music attached. Two countries can send the same number of entrants and leave very different amounts of music behind, and it is the height of the emerald foot that says so</li>
						<li>hover a column for the exact figures; <em>click it to list that country's composers below</em>, exactly as clicking a line or a cell does &mdash; same orange bar, same list, same works panel. Click it again to clear</li>
					</ul>
				</div>
				<div>
					<p><strong>Line chart</strong> &mdash; the other view</p>
					<ul>
						<li>each line is a country; the vertical axis counts the entrants recorded for that edition, and the scale is square-root (gridlines at 1, 2, 5, 10, 20, 50, 100&hellip;)</li>
						<li>this chart carries <em>no provenance strip of its own</em>: the strip on the edition squares sits immediately above it and is read with it</li>
						<li>it is kept because it reads a <em>single</em> trajectory better than any matrix once a handful of countries are isolated &mdash; and because two views answering the same click on the same data is what makes a regression something anyone can check rather than something to be argued about</li>
						<li>in the chart legend, <em>c/t</em> has the same meaning; the square next to each country shows or hides its line. The legend now lays itself out from the width of the canvas and the number of countries, and <em>every country charted is named in it</em> &mdash; until 2026-08-11 the last six alphabetically (Unknown, Uruguay, Venezuela, Vietnam, <em>Yugoslavia</em> and Zimbabwe, 58 people between them) were painted just past the right edge: invisible, and their square unclickable. A canvas has no edge that protests, so nothing said so</li>
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
						<li>the violet box of works and the ISNI record are both capped at about a third of the window height and scroll inside themselves, their headers staying put: a composer with a dozen archived works no longer pushes the rest of the column off the screen</li>
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
