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
			<!-- TROIS CELLULES DE DEUX RUBRIQUES, ET NON SIX CELLULES — 2026-08-14.
			     La grille est un flex qui passe a la ligne : la hauteur d une rangee
			     est celle de sa plus haute cellule, et « Coverage », qui tient en
			     deux lignes, laissait sous lui la hauteur entiere de « The index ».
			     Empilees deux par deux dans une meme cellule, les six rubriques ne
			     font plus qu UNE rangee et le vide disparait. L ordre de lecture
			     reste celui de la page : ce qu on regarde, ce sur quoi on clique,
			     puis le vocabulaire des annees. -->
			<div class="lg-cols">
				<div>
					<p><strong>Coverage</strong></p>
					<!-- LES DEUX LIGNES RESTENT DES `p.lg-note` ET NON DES `li` : c est
					     `#legend .lg-note` qui porte le filet violet a gauche (overview.css
					     ligne 208, `border-left: 3px solid var(--sd-amethyst)`). Passees en
					     puces le 2026-08-14, elles l avaient perdu.
					     `#lg-incomplete` reste PILOTE PAR updateCoverageNote() dans
					     js/overview.js : il n apparait que quand `num of records` vaut 0.
					     Le `display:none` est en dur parce que le champ vaut 1 au
					     chargement — une page qui l enverrait visible le ferait disparaitre
					     sous les yeux des que le script tourne. -->
					<p class="lg-note" id="lg-incomplete" style="display:none">with <em>num of records</em> at <em>0</em> every participant is listed, and the index is then knowingly incomplete: the minutes are fully entered for <em>1973&ndash;1994</em>, only partly for <em>1996&ndash;2009</em></p>
					<p class="lg-note">No competition was held in <em>1995</em> (36 editions in all), so no square carries that year</p>
					<p><strong>The index</strong></p>
					<ul>
						<li>each composer is a slate square followed by one coloured square per participation; the slate square carries no count</li>
						<li>a participation square is coloured by its <em>edition year</em>: sea green in <em>1973</em>, pale amethyst in <em>2009</em>, the lightness carrying the order. Key top right</li>
						<li><em>squares: first entry &middot; archived works &middot; A&ndash;Z</em>, top left, reorders the grid; <em>first entry</em> settles ties by surname</li>
					</ul>
				</div>
				<div>
					<p><strong>Selection</strong></p>
					<ul>
						<li>click a square to select a composer. The boxes on the right arrive <strong>folded</strong>. Orange: name, country code, editions entered; purple: archived works. Click a header to unfold, again to fold</li>
						<li>a third box appears between them <strong>only for composers who have an ISNI</strong>, headed by that identifier. Unfold it to load the international identity record: name forms, dates, external links. Nothing is requested before that</li>
					</ul>
					<p><strong>Search</strong></p>
					<ul>
						<li>type in <em>composer name</em> to list matches; click a result to highlight their squares in yellow</li>
						<li><em>num of records &gt;=</em> rebuilds the index with only the composers having at least that many archived works</li>
						<!-- Retiree par js/overview.js dans la vue de travail (?v=all),
						     ou la recherche rend aussi les candidats sans oeuvre. -->
						<li id="lg-archived-only">the search lists only composers with <strong>at least one archived work</strong></li>
						<li>a result marked <em>not in this index</em> has no square to highlight: no participation has been recorded for them in the minutes entered so far. Their works are still on the catalogue and award pages</li>
					</ul>
				</div>
				<div>
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
					<p><strong>Year markers</strong> in the orange box</p>
					<ul>
						<li><em>1984</em> &mdash; an entry to the competition, attested by a document</li>
						<li><em>1984+</em> &mdash; that entry <em>and</em> a work programmed at the <em>Synth&egrave;se</em> festival the same year</li>
						<li><em>1984&deg;</em> &mdash; the festival alone: no entry attested, the year inferred from the work</li>
						<li><em>1984*</em> &mdash; a participation recorded with no document attached</li>
						<li>hover a year for the document it rests on: <em>bailiff&rsquo;s record</em>, <em>IMEB list of entrants</em>, <em>prize awarded</em>, <em>festival programme</em>, or <em>transcription only</em></li>
					</ul>
					<p><strong>Navigation trace</strong></p>
					<ul>
						<li>every composer you consult joins the small canvas as a bubble, grouped by country</li>
						<li>the green box counts them; click a bubble to detail one country</li>
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