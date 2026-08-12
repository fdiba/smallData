<?php
	
	$title = "Sound Archives";
	$id = isset($_GET["id"]) ? intval($_GET["id"]) : 0;
	if($id==1)$title = "IMEB International Sound Archives";
	else if($id==2)$title = "IMEB Sound Archives";
	else if($id==3)header('Location: '.'euphonies.php');

	// Texte propre a chaque phonotheque pour la rubrique "How to read"
	// $cov_note : note de completude de la colonne "edition(s)", sur le modele
	// des notes "Coverage" de animated_data.php et index.php (meme classe
	// .lg-note, meme liseré amethyste). Elle dit ce qu'une cellule vide
	// signifie — absence de trace, PAS absence de programmation — parce que la
	// colonne est vide une fois sur deux en Phono A et trois fois sur quatre en
	// Phono B : sans cette note, le lecteur infere le contraire.
	if($id==1){
		$coll_desc  = "This page shows the <strong>International Sound Archives</strong> &mdash; the IMEB's <em>Phonothèque A</em>, said &laquo;&nbsp;Extérieure&nbsp;&raquo;: electroacoustic works by outside composers, gathered by the IMEB (catalogue index 100&thinsp;000).";
		$table_desc = "the table lists the works of the International collection (Phonothèque A), grouped by composer";
		$cov_note   = "Coverage &mdash; the <em>edition(s)</em> column is knowingly incomplete. The <em>Répertoire général</em> records a programming year for about <em>half</em> of the 5&thinsp;828 works in this collection; the cell is left empty for the other half. An empty cell means the repertoire holds no record of a performance, <em>not</em> that the work was never played. Around a thousand works here are by composers who appear at no edition in our participation index either &mdash; but that index is drawn from the competition minutes, which have been fully entered only for <em>1973 to 1994</em> and are still partially processed from <em>1996 to 2009</em>, so their absence is a gap in what has been read, not a statement about what happened. No competition was held in <em>1995</em> (36 editions in all, between 1973 and 2009), so no work carries that year.";
	} else {
		$coll_desc  = "This page shows the <strong>IMEB Sound Archives</strong> &mdash; the IMEB's <em>Phonothèque B</em>: works produced in the institute's own studios (catalogue index 200&thinsp;000).";
		$table_desc = "the table lists the works of the IMEB collection (Phonothèque B), grouped by composer";
		$cov_note   = "Coverage &mdash; the <em>edition(s)</em> column is knowingly incomplete: a programming year is recorded for roughly <em>one work in four</em> of this collection's 765 works. These works were produced in the institute's own studios, and an entry in the archive does not imply a festival performance &mdash; an empty cell means the repertoire holds no record of one. No competition was held in <em>1995</em> (36 editions in all, between 1973 and 2009), so no work carries that year.";
	}

?>
<!DOCTYPE html>
<html>
<head>
	<title><?php echo $title ?> | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<?php include_once("./php/asset.php") ?>
	<!-- ⚠️ Feuilles et scripts horodates par asset() : sans cela, une correction
	     deployee reste invisible tant que le lecteur n'a pas vide son cache —
	     verifie le 2026-08-11 sur une regle de main.css. Voir php/asset.php. -->
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/main.css') ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/catalog.css') ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/isni.css') ?>">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
	<script src="<?php echo asset('lib/jquery-3.1.1.min.js') ?>"></script>
	<!-- Fiche ISNI : code partage par les quatre pages qui affichent un ISNI
	     (voir l'en-tete de js/isni_box.js). Depend de jQuery, donc charge
	     apres lui ; les points d'entree, eux, restent dans les scripts de la
	     page — ici js/particles_catalog.js pour la boite violette du SMA. -->
	<script src="<?php echo asset('js/isni_box.js') ?>"></script>
	<script src="<?php echo asset('lib/perlin.js') ?>"></script>
	<script src="<?php echo asset('js/variables.js') ?>"></script>
	<script src="<?php echo asset('js/functions.js') ?>"></script>
	<script src="<?php echo asset('js/sma_core.js') ?>"></script>
	<script src="<?php echo asset('js/childs_catalog.js') ?>"></script>
	<script src="<?php echo asset('js/particles_catalog.js') ?>"></script>
	<script src="<?php echo asset('js/catalog.js') ?>"></script>
	<!-- Repli de la legende "How to read", partage par les sept pages qui en portent une : voir l'en-tete de js/legend_toggle.js -->
	<script src="<?php echo asset('js/legend_toggle.js') ?>"></script>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main"><?php echo $title ?></h1>
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
<?php if($id==1 || $id==2){ ?>
			<div id="countries">
				<p>Country:</p>
				<ul></ul>
			</div>
<?php } ?>
			<div id="main_container">
<?php if($id==1 || $id==2){ ?>				<div id="sma_note"></div>
<?php } ?>
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
<?php if($id==1 || $id==2){ ?>
			<!-- La legende arrive REPLIEE depuis le 2026-08-11, comme les cinq autres pages
			     qui en portent une : ouverte, elle occupe plus de hauteur que le contenu, et
			     le contenu est ce qu'on vient voir. L'etat d'arrivee s'ecrit ICI et non dans
			     js/legend_toggle.js — voir l'en-tete de ce fichier : une page sans
			     JavaScript garde la legende dans l'etat ou le serveur l'a envoyee, et aucune
			     page ne s'ouvre sur un panneau qui se refermerait sous les yeux. -->
			<div id="legend" class="is-collapsed">
				<button type="button" id="lg_toggle" class="lg-title" aria-expanded="false" aria-controls="lg_body">
					How to read this page<span class="lg-caret" aria-hidden="true"></span>
				</button>
				<div id="lg_body">
				<p class="lg-intro">The IMEB's holdings form the <em>Fonds MISAME</em>, whose <em>Répertoire général</em> &mdash; compiled by Christian Clozier &mdash; brings together 1&thinsp;946 composers, 6&thinsp;612 works and 63 countries, split into two phonothèques: the <em>International Sound Archives</em> (Phonothèque A, &laquo;&nbsp;Extérieure&nbsp;&raquo;) and the <em>IMEB Sound Archives</em> (Phonothèque B). <?php echo $coll_desc ?></p>
				<p class="lg-note"><?php echo $cov_note ?></p>
								<div class="lg-cols">
				<div>
					<p><strong>The table</strong></p>
					<ul>
						<li><?php echo $table_desc ?></li>
						<li>the composer cell is shared across all of their works; the background alternates to separate composers and, within a composer, their pieces</li>
						<li><em>edition(s)</em> gives the year or years in which the work was programmed at Bourges, between 1973 and 2009; the cell is left empty where the <em>Répertoire général</em> does not record it, and a work played again in a later edition carries several years</li>
						<li>a <span class="work-award">&#9733;</span> after a title marks a work distinguished at the competition, held within the festival; the award year is not carried into <em>edition(s)</em>, and a number of awarded works carry no programming year at all &mdash; the full prize list is on the <a href="award-winning_works.php">Award-winning works</a> page</li>
					</ul>
				</div>
				<div>
					<p><strong>Composers &amp; works</strong></p>
					<ul>
						<li>a composer whose name is <span class="composer-isni">underlined with dots</span> has an ISNI: click the name to open their international identity record in the panel on the right &mdash; name forms, dates, external links (VIAF, Wikidata, MusicBrainz&hellip;) and contributing databases. The panel stays open while you scroll the table; close it with the cross or the <em>Esc</em> key. Clicking an agent closes it, since it sits over the information boxes &mdash; but the loading counter alone leaves it open</li>
						<li>the <em>visualization</em> has an ISNI record of its own, and it does not behave like the one above: click an agent whose composer has an ISNI and a box appears in the information column, between the orange box and the purple one, headed by that identifier &mdash; click the header to unfold the record. It sits in the column instead of over it, so nothing is hidden, and nothing is requested until you unfold it</li>
					<?php if($id==1){ ?>
						<li>by default <em>All works</em> shows the whole collection on the canvas; you can also pick a <em>country</em> in the Country menu to filter the table and the visualization to that country's composers, pick another to switch, or come back to <em>All works</em>. This collection is the large one &mdash; some 4&thinsp;380 works &mdash; so <em>All works</em> takes a moment to build; the number of agents on screen is capped either way, and each one carries several works in turn rather than standing for a single one</li>
					<?php } ?>
					<?php if($id==2){ ?>
						<li>by default <em>All works</em> shows the whole collection on the canvas; you can also pick a <em>country</em> in the Country menu to filter the table and the visualization to that country's composers</li>
					<?php } ?>
					</ul>
				</div>
<?php if($id==1 || $id==2){ ?>
				<div>
					<p><strong>Agents</strong></p>
					<ul>
						<li>on the canvas, each moving ellipse is an agent carrying one archived work</li>
						<li><span class="sq" style="background:#bdc3c7"></span> an agent, still looking for others sharing a common property</li>
						<li><span class="sq" style="background:#2ecc71"></span> a grouping &mdash; click it to open it</li>
						<li><span class="sq" style="background:#f1c40f"></span> an opened grouping, showing its members &mdash; double-click it to close it</li>
						<li><span class="sq" style="background:#3498db"></span> a single work inside an opened grouping &mdash; click it to display its details in the information column: the <em>orange</em> box names the composer and their country, the <em>purple</em> one describes the work, and a <em>blue</em> box appears between them when that composer has an ISNI</li>
					</ul>
					<p><strong>Grouping</strong></p>
					<ul>
						<li>agents compare their properties as they move; candidate properties and their exchange counts appear in the white panel of the top bar, and a property (such as <em>ln</em> (last name)) becomes clickable once exchanged often enough</li>
						<li>click that property name to let the agents regroup around it</li>
						<li><em>reset</em> restarts the system, <em>pause</em> freezes it (the <em>p</em> key toggles the agents' drift)</li>
					</ul>
				</div>
<?php } ?>
				</div>
				</div>
			</div>
			<?php } ?>
		<div id="main_table">
			<table id="works_table" class="works_table">
				<tr>
					<th>composer</th>
					<th>title</th>
					<th>duration</th>
					<th>edition(s)</th>
				</tr>
			</table>
			<table id="works_table_2" class="works_table">
				<tr>
					<th>composer</th>
					<th>title</th>
					<th>duration</th>
					<th>edition(s)</th>
				</tr>
			</table>
		</div>
		<div id="listing"></div>
		</div>
		</div>
 	</div>
</body>
</html>