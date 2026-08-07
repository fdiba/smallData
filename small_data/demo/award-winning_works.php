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
							<li>pick an edition in the <em>year</em> menu and <strong>columns that hold nothing for it are hidden</strong> &mdash; from 1973 to 1976 the competition had neither <em>category</em> nor <em>sub category</em>, and most later editions have no sub category either. Nothing is lost: the column comes back as soon as the selection changes, and <em>All works</em> shows all nine</li>
							<li><em>duration</em> is the length recorded for the work in the <em>Répertoire général</em>, in minutes and seconds. It is blank in <em>43 of the 755 rows</em>: 15 award-winning works for which the catalogue gives no duration, the 2 distinctions whose work is not held at the fonds, and the 26 <em>not awarded</em> rows, which carry no work at all. A blank cell means the duration is unknown, not that it is zero</li>
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
					<!-- Les classes c-… nomment la COLONNE, et elles sont posees
					     sur l'en-tete comme sur chaque cellule : c'est par elles
					     que js/aww.js masque une colonne restee vide pour la
					     selection courante (masquerColonnesVides). L'ordre et les
					     noms doivent correspondre au tableau COLONNES de
					     js/aww.js, qui verifie le compte a chaque rendu et se
					     plaint dans la console s'il diverge. -->
					<tr>
						<th class="c-year">edition</th>
						<th class="c-cat">category</th>
						<th class="c-cat2">sub category</th>
						<th class="c-price">price</th>
						<!-- « first name » et « last name » n'en font plus qu'une
						     depuis le 2026-08-07 : le nom s'ecrivait en deux
						     morceaux qu'il fallait relire ensemble, et le marqueur
						     ISNI se posait deux fois pour une seule personne. Le
						     TRI reste sur le patronyme. -->
						<th class="c-composer">composer</th>
						<!-- Les co-auteurs, ajoutes le 2026-08-07. imeb_music.id_artist
						     est un entier unique : le catalogue n'a jamais connu la
						     co-signature, que imeb_bande_artiste porte depuis 1981.
						     Trois bandes de 1986 sont concernees, les premieres du
						     corpus a etre a la fois co-signees et distinguees. La
						     colonne se masque d'elle-meme sur les selections qui n'en
						     portent aucune. -->
						<th class="c-coauth">with</th>
						<th class="c-ctry">country</th>
						<th class="c-title">title</th>
						<!-- La duree vient de imeb_music.duration, au format mm:ss.
						     Elle voyageait deja dans le flux depuis l'origine et
						     servait la boite violette du SMA ; le tableau ne la
						     montrait pas. Colonne ajoutee le 2026-08-06. -->
						<th class="c-dur">duration</th>
					</tr>
				</table>
			</div>
			<div id="listing"></div>
		</div>
 	</div>
</body>
</html>