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
			<!-- Les deux notes d introduction sont DANS la grille, comme une
			     colonne parmi les autres — 2026-08-14. Sur toute la largeur elles
			     laissaient les deux tiers de leur bande vides : leur `max-width` est
			     de 80ch et rien ne venait a cote. Dans la grille, les huit blocs
			     plus celui-ci font NEUF, soit trois rangees pleines de trois. -->
			<div class="lg-cols">
				<div>
					<p class="lg-note"><strong>What is counted</strong> &mdash; <em>entrants</em>, not works. Most of the people on this page have <em>no work in the collection at all</em>: of the <em>4&nbsp;262</em> entrants the database records, <em>2&nbsp;773</em> left nothing but a candidacy &mdash; a name read off an entry list. That gap is the subject of this page, and it is why most names in the list below are withheld.</p>
					<p class="lg-note"><strong>The chart is knowingly incomplete</strong>, and the strip above each edition square says <em>on what authority</em> that edition is counted. There was <em>no competition in 1995</em>: the timeline skips it and 1994 joins 1996 directly. Two low editions are not gaps in the record &mdash; <em>1992</em> (112) was open for one degree only, the Residence, and <em>2004</em> (137) ran without its first three categories.</p>
				</div>
				<div>
					<p><strong>Timeline (top strip)</strong></p>
					<ul>
						<li><span class="sq" style="background:#ecf0f1"></span> one square per edition; the first, <em>all</em>, charts 1973&ndash;2009</li>
						<!-- Le lisere de provenance, dessine par drawPvStrip() dans js/animated_data.js.
						     Il n'est PAS CODE EN DUR : il est lu dans imeb_participation par le
						     case 12 de php/retrieve_data.php, et se corrige a chaque edition versee. -->
						<li><span class="sq" style="background:#2ecc71"></span> <em>the bailiff&rsquo;s record is transcribed in full</em> &mdash; every entry attested</li>
						<li><span class="sq" style="background:#5dade2"></span> <em>counted from the entrants list</em> and from archived works &mdash; second-hand, and short of the minutes</li>
						<li><span class="sq" style="background:#1abc9c"></span> selected &middot; <span class="sq" style="background:#f1c40f"></span> inside the selected span &middot; <span class="sq" style="background:#e74c3c"></span> <em>span</em> on, <span class="sq" style="background:#ffcccc"></span> off (a single year gives a bar chart)</li>
					</ul>
				</div>
				<div>
					<p><strong>Count</strong> &mdash; the switch, on all three charts <em>and</em> on the list</p>
					<ul>
						<li><em>all entrants</em> &mdash; everyone recorded as having entered, work or no work. The honest measure of the <em>competition</em></li>
						<li><em>only those with a work</em> &mdash; the measure of the <em>collection</em>, and a good deal smaller</li>
						<li>with the switch on, <em>no name in the list is withheld</em> and every line is clickable: a name published with a work is a published name</li>
					</ul>
				</div>
				<!-- Bloc ajoute le 2026-08-11. Il repond a une question posee sur la page,
				     et la reponse est une propriete du MODELE, pas un defaut du graphe :
				     `imeb_artist.id_country` porte l'Etat d'AUJOURD'HUI, `imeb_adresse.id_country`
				     celui que le document ECRIVAIT. Les trois charts comptent des PERSONNES,
				     donc le premier. -->
				<div>
					<p><strong>Countries</strong> &mdash; whose map is this</p>
					<ul>
						<li><em>81 countries.</em> Each person is charted under the state they are attached to <em>today</em>, not the one on the envelope they posted in</li>
						<li>so <em>Czechoslovakia, the GDR and the USSR never appear</em>, though <em>62</em>, <em>22</em> and <em>9</em> addresses in the base name them. A chart drawn on addresses would show the other answer; both are true</li>
						<li><em>Unknown</em> is a country row like any other (25 people)</li>
					</ul>
				</div>
				<div>
					<p><strong>Matrix</strong> &mdash; the default chart</p>
					<ul>
						<li>one row per country, one column per edition; the colour counts the entrants, on the authority the strip above names</li>
						<li>the scale is square-root and runs through the <em>colour</em>, so one entrant stays visible next to a hundred. Key top right</li>
						<li><em>rows: total &middot; first entry &middot; A&ndash;Z</em> &mdash; three orders, three questions. Click a country to isolate it (eight at most); the others fade but keep their place</li>
						<li>click a cell to list that country&rsquo;s composers below, again to drop it; <em>reset all</em> clears everything</li>
					</ul>
				</div>
				<div>
					<p><strong>Band on top</strong> &mdash; entrants per edition</p>
					<ul>
						<li>the outline is the total for each edition, every country together</li>
						<li>the scale here is <em>linear</em>, not square-root: an area that is stacked must sum, and &radic;a + &radic;b is not &radic;(a+b)</li>
						<li>the right-hand column totals each country <em>over the period on screen</em>; the <em>c/t</em> figure left of the grid is composers with works out of entrants, <em>across all editions</em></li>
					</ul>
				</div>
				<div>
					<p><strong>Bar chart</strong> &mdash; one edition on its own</p>
					<ul>
						<li>turn <em>span</em> off and pick a year: the full height counts the <em>entrants</em>, the emerald foot how many of them have <em>a work in the collection</em></li>
						<li><em>the gap between the two is the subject of this database</em>: two countries can send the same number of entrants and leave very different amounts of music behind</li>
						<li>hover for figures, click to list that country&rsquo;s composers, click again to clear</li>
					</ul>
				</div>
				<div>
					<p><strong>Line chart</strong> &mdash; the other view</p>
					<ul>
						<li>one line per country, square-root axis (gridlines at 1, 2, 5, 10, 20, 50, 100&hellip;)</li>
						<li>no provenance strip of its own: the one on the edition squares sits just above and is read with it</li>
					</ul>
				</div>
				<div>
					<p><strong>Composers list</strong></p>
					<ul>
						<li><span class="demo demo-active">Name (n)</span> n archived works &mdash; click to list them &middot; <span class="demo demo-selected">Name</span> took part in the selected edition</li>
						<!-- Le nom masque : voir SHOW_ALL_NAMES / maskName dans js/animated_data.js. -->
						<li><span class="demo">J****** D*****</span> an entrant with no archived work: the name is withheld and the line is not clickable &mdash; what is recorded is an <em>application</em>, not a published work</li>
						<li>the orange bar sums up the selection &mdash; click it to switch between all composers and those of the selected edition</li>
						<li>clicking a name opens a panel on the right: the name, the count of archived works (click to unfold), and &mdash; if the composer <strong>has an ISNI</strong> &mdash; a third box for the international identity record. Nothing is requested until you unfold it</li>
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
