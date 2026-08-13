<!DOCTYPE html>
<html>
<head>
	<title>Overview | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<?php include_once("./php/asset.php") ?>
	<!-- Feuilles et scripts horodates par asset() : sans cela, une correction
	     deployee reste invisible tant que le lecteur n'a pas vide son cache —
	     verifie le 2026-08-11 sur une regle de main.css. Voir php/asset.php. -->
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/main.css') ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/overview.css') ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/isni.css') ?>">
	<?php include_once("../../analyticstracking.php") ?>
	<script src="<?php echo asset('lib/perlin.js') ?>"></script>
	<script src="<?php echo asset('lib/jquery-3.1.1.min.js') ?>"></script>
    <script src="<?php echo asset('lib/jquery.cookie.js') ?>"></script>
    <script src="<?php echo asset('js/variables.js') ?>"></script>
    <script src="<?php echo asset('js/functions.js') ?>"></script>
    <!-- Fiche ISNI : code partage par les pages qui affichent un ISNI (voir
         l'en-tete de js/isni_box.js). Depend de jQuery, donc charge apres lui,
         et AVANT js/overview.js qui appelle enableIsniPanel() et esc(). -->
    <script src="<?php echo asset('js/isni_box.js') ?>"></script>
    <script src="<?php echo asset('js/overview_sma.js') ?>"></script>
	<script src="<?php echo asset('js/overview.js') ?>"></script>
	<!-- Repli de la legende "How to read", partage par les sept pages qui en portent une : voir l'en-tete de js/legend_toggle.js -->
	<script src="<?php echo asset('js/legend_toggle.js') ?>"></script>
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
		<!-- La legende arrive REPLIEE depuis le 2026-08-11, comme categories.php et
		     animated_data.php : ouverte, elle occupe plus de hauteur que la grille,
		     et la grille est ce qu'on vient voir. L'etat d'arrivee s'ecrit ICI et non
		     dans js/legend_toggle.js — voir l'en-tete de ce fichier : une page sans
		     JavaScript garde la legende dans l'etat ou le serveur l'a envoyee, et
		     aucune page ne s'ouvre sur un panneau qui se refermerait sous les yeux. -->
		<div id="legend" class="is-collapsed">
			<button type="button" id="lg_toggle" class="lg-title" aria-expanded="false" aria-controls="lg_body">
				How to read this page<span class="lg-caret" aria-hidden="true"></span>
			</button>
			<div id="lg_body">
			<p class="lg-note">Coverage &mdash; <span id="lg-incomplete" style="display:none">with <em>num of records</em> set to <em>0</em>, every participant is listed and this index is then knowingly incomplete &mdash; the competition minutes have been fully entered for the editions from <em>1973 to 1994</em>, but those from <em>1996 to 2009</em> are only partially processed, so the later editions are under-represented and some participations are missing. </span>No competition was held in <em>1995</em> (36 editions in all), so no square carries that year.</p>
			<div class="lg-cols">
				<div>
					<p><strong>The index</strong></p>
					<ul>
						<li>each composer is a slate square followed by one coloured square per participation in the Bourges competitions. The slate square only marks where a run begins; it carries no count</li>
						<li>the colour of a participation square is its <em>edition year</em>: the ramp runs from the sea green of <em>1973</em> through blue to the pale amethyst of <em>2009</em>, and the key sits at the top right of the grid. It is the <em>lightness</em> that carries the order &mdash; it increases with the year</li>
						<li><em>squares: first entry &middot; archived works &middot; A&ndash;Z</em>, at the top left of the grid, reorders it. Three orders, three questions: when each composer entered (the corpus then reads as a staircase, earliest at the top), where the collection actually is, and where a given person is. <em>First entry</em> settles ties by surname</li>
						<li>with <em>num of records</em> at <em>0</em> the index also lists composers with no archived work, and the slate square then splits in two: <em>emerald</em> for those who have a work in the collection, slate for those the database knows by a candidacy alone. Above 0 every composer shown has one, so there is nothing to tell apart and the square stays slate</li>
					</ul>
				</div>
				<div>
					<p><strong>Selection &amp; search</strong></p>
					<ul>
						<li>click a square to select a composer: the boxes on the right fill up, and each of them is <strong>folded</strong> &mdash; the orange one names the composer, their country code and how many editions they entered; the purple one counts their archived works. Click a box's header to unfold it, click again to fold it back</li>
						<li>a third box appears between the two <strong>only for composers who have an ISNI</strong>, and its header is that identifier. Unfold it to load the international identity record &mdash; name forms, dates, external links (VIAF, Wikidata, MusicBrainz&hellip;) and contributing databases. Nothing is requested until you unfold it, and a record already opened once is kept for the session. Selecting another composer replaces it; selecting one without an ISNI removes it</li>
						<li>type a name in <em>composer name</em> to list matching composers; click a result to highlight their squares in yellow</li>
						<li><em>num of records &gt;=</em> rebuilds the index with only the composers having at least that many archived works &mdash; one is the lowest it goes</li>
						<!-- Retiree par js/overview.js dans la vue de travail (?v=all),
						     ou la recherche rend aussi les candidats sans oeuvre. -->
						<li id="lg-archived-only">the search lists only composers with <strong>at least one archived work</strong>. Many more names appear in the minutes &mdash; people who entered the competition without a recording joining the collection: an application is not a publication, so those names are not listed here</li>
						<li>a result marked <em>not in this index</em> has no square to highlight: some composers are in the repertoire without appearing in this participation grid, because no participation has been recorded for them in the minutes entered so far &mdash; their works are still listed on the catalogue and award pages</li>
						<!-- LES QUATRE MARQUEURS DES ANNEES (boite orange).
						     Ils ne sont plus deduits d'imeb_edition mais lus dans
						     imeb_participation (source, cite_par_liste, cite_par_oeuvre)
						     et dans le programme du festival. Comptes mesures sur la base
						     le 2026-08-08 : classe 1 = 6 736 annees (69,4 %), classe 2 =
						     2 660 (27,4 %), classe 3 = 109 (1,1 %), classe 4 = 199 (2,1 %).
						     C'EST ICI QUE LE VOCABULAIRE S'EXPLIQUE, ET NULLE PART
						     AILLEURS : les infobulles du survol ne portent que deux mots
						     (« competition · IMEB list of entrants »), parce qu'une phrase
						     de vingt mots au survol d'une annee ne se lit pas. Voir
						     editionsHtml() dans js/overview.js et le `case 5` de
						     php/retrieve_data.php. -->
						<li>in the orange box, each edition year carries a <strong>marker</strong> saying what is known of that year: a bare year (<em>1984</em>) is an entry to the competition attested by a document; a <strong>plus</strong> (<em>1984+</em>) is that same entry <em>and</em> a work programmed at the <em>Synth&egrave;se</em> festival the same year; a <strong>degree sign</strong> (<em>1984&deg;</em>) is the festival alone &mdash; a work was programmed, no entry to the competition is attested, and the year was inferred from the work; an <strong>asterisk</strong> (<em>1984*</em>) is a participation recorded with no document attached to it</li>
						<li>hovering a year names the document the claim rests on, in two words: <em>bailiff's record</em> (a record of deposit drawn up by a bailiff, listing entrants one by one), <em>IMEB list of entrants</em> (the institute's own list), <em>prize awarded</em> (the year is attested by the award itself), <em>festival programme</em>, or <em>transcription only</em> (read off transcribed minutes, the record itself not being attached to the entry)</li>
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