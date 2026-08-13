<!DOCTYPE html>
<html>
<head>
	<title>Award-winning composers | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/sankey.css">
	<link rel="stylesheet" type="text/css" href="css/isni.css">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main">Categories</h1>
				<p></p>
			</div>
			<!-- Commutateur de vue. Il reprend deux tournures deja presentes
			     dans la barre, et n'en introduit aucune : le libelle de
			     #searchBox (index.php) et les boutons b_on / b_off de
			     #launcher. Sa place ici, entre le titre et les menus, est
			     celle de #launcher sur index.php.
			     La page arrive sur la vue allegee — voir l'en-tete de
			     js/categories.js. L'etat ecrit ci-dessous n'est que l'etat
			     initial : js/categories.js le repose au chargement, puis a
			     chaque clic. Une page sans JavaScript n'a de toute facon pas
			     de diagramme a commuter. -->
			<div id="view">
				<label>diagram</label>
				<ul>
					<!-- « year -> category », et non plus « year -> category -> sub
					     category » : la troisieme colonne a ete retiree le 2026-08-13.
					     Elle portait la « sous-categorie », qui EST la categorie — le
					     concours a des DEGRES et des CATEGORIES, et le constat de 1990
					     l'ecrit, une lettre pour le degre et un chiffre pour la
					     categorie. La garder faisait un nœud sous lui-meme. -->
					<li class="b_on" data-view="light" role="button" tabindex="0" aria-pressed="true">year &rarr; category</li>
					<li class="b_off" data-view="full" role="button" tabindex="0" aria-pressed="false">year &rarr; category &rarr; composer</li>
				</ul>
			</div>
			<?php include_once("./php/menus.php") ?>
		</div>
		<!-- Legende "How to read", septieme et derniere page a la recevoir.
		     Seule celle-ci est repliable et posee en fixe : voir la note qui
		     ouvre le bloc correspondant dans css/sankey.css. Le titre EST le
		     bouton de repli, de sorte que la bande reste visible une fois la
		     legende fermee.
		     La page arrive REPLIEE : ouverte, la legende couvre pres de la
		     moitie de la hauteur utile, et le diagramme est ce qu'on vient
		     voir. La classe est donc posee ici, dans le HTML, et non par le
		     script — la page ne s'ouvre pas sur un panneau qui se refermerait
		     sous les yeux. Le diagramme etant lui-meme dessine en JavaScript,
		     une page sans JavaScript n'a de toute facon rien a legender. -->
		<div id="legend" class="is-collapsed">
			<button type="button" id="lg_toggle" class="lg-title" aria-expanded="false" aria-controls="lg_body">
				How to read this page<span class="lg-caret" aria-hidden="true"></span>
			</button>
			<div id="lg_body">
				<p class="lg-intro">This diagram follows the IMEB competition prize list from left to right: the <em>year</em> of the award, the <em>category</em> in which it was given, and the <em>composer</em> who received it. It gathers <em>729 awards</em> to <em>508 composers</em> across <em>27 named labels</em> and <em>36 editions</em>, from 1973 to 2009 &mdash; no competition was held in 1995. <strong>Two of those labels are not categories</strong>: the <em>Magist&egrave;re</em> and the <em>R&eacute;sidence</em> are <em>distinctions</em>, awarded across categories, which the <em>R&eacute;pertoire g&eacute;n&eacute;ral</em> nevertheless records in the category column. They carry <em>146 of the 729 awards</em>, from 1988 on, and are marked here with a <em>&#10022;</em>. Two views of the same data are available from the <em>diagram</em> switch above: <em>year &rarr; category</em>, which fits one screen and is where the page opens, and <em>year &rarr; category &rarr; composer</em>, which adds the 508 composers and is some ten times taller.</p>
				<p class="lg-note">Two different years are recorded, and the diagram keeps them apart. <em>awarded</em> is the year of the prize; <em>festival</em> lists the years in which the work was programmed at Bourges. The two usually coincide, but need not: 69 awarded works were also played in another edition, and 7 carry an award year that is not among their programming years. For <em>234 of the 729 awards</em> the <em>R&eacute;pertoire g&eacute;n&eacute;ral</em> records no programming year at all; the <em>festival</em> mention is then simply omitted, which is an absence of evidence and not evidence that the work was never played.</p>
				<!-- TROIS COLONNES DEPUIS LE 2026-08-13, et la troisieme n'est pas
				     un decoupage de confort : la colonne du milieu repond a UNE
				     question — que nomme un nœud de la colonne du milieu ? — et
				     c'est la question que la page posait sans y repondre tant
				     qu'elle parlait de « sous-categories ». Le concours a des
				     DEGRES et des CATEGORIES ; il n'a jamais eu de sous-categorie.
				     La regle CSS ne change pas : #legend .lg-cols est un flex a
				     `flex: 1 1 300px`, qui prend trois colonnes comme il en prenait
				     deux, et repasse a deux puis a une quand la fenetre retrecit. -->
				<div class="lg-cols">
					<div>
						<p><strong>The columns and the flows</strong></p>
						<ul>
							<li>categories are the competition's own labels, and they changed over the years; the <em>39 awards</em> recorded without one are gathered under <em>None</em> &mdash; 38 of them from 1973 to 1976, when the competition had a single ranking</li>
							<li>the thickness of a flow is the <em>number of awards</em> it carries: a composer distinguished twice in the same category shows a band twice as thick as one distinguished once</li>
							<li>flows on the left run from a year to a category and, in the full view, flows on the right from a category to a composer; a category therefore gathers, on one side, the editions that awarded it and, on the other, the composers it distinguished</li>
							<li>both views share their first two columns, and <strong>every total is the same in both</strong>: the short view holds <em>64 nodes</em> and <em>195 flows</em> and fits one screen; the full view adds the 508 composers, which makes <em>572 nodes</em> and <em>848 flows</em></li>
							<li>colours only tell neighbouring flows apart &mdash; they carry no meaning of their own</li>
							<li>the full prize list, work by work, is on the <a href="award-winning_works.php">Award-winning works</a> page</li>
						</ul>
					</div>
					<div>
						<p><strong>The categories</strong></p>
						<ul>
							<li><strong>twelve of them were defined in 2000</strong>, from <em>&oelig;uvre d'esth&eacute;tique formelle</em> to <em>&oelig;uvre pour le multim&eacute;dia</em>, and they carry <em>152 of the 729 awards</em></li>
							<!-- La fusion des lignes 6 et 12 de imeb_categorie
							     (DB/fusion_categorie_studio.sql, 2026-08-12) fait UN nœud la ou le
							     catalogue en donnait deux : le diagramme ne doit pas le faire en
							     silence. Le catalogue garde ses deux mots — imeb_music.award_cat
							     n'est pas reecrit —, c'est la page qui n'en montre qu'un, et cette
							     puce dit lequel est l'autre. Les citations sont dans le commentaire
							     de la categorie 6. DB/fusion_multimedia.sql fait de meme pour les
							     deux « Multimedia », celui de 1999 et celui de 2000-2009. -->
							<li><strong>two nodes each carry two names</strong>, and the catalogue keeps both. The <em>R&eacute;pertoire g&eacute;n&eacute;ral</em> writes <em>&Eacute;lectroacoustique</em> for the awards of 1985&ndash;1991 and <em>Studio</em> for those of 1993&ndash;1998, but the two bailiff's records that <em>define</em> the category call it by the same full name, <em>&laquo;&nbsp;Prix de la Musique &Eacute;lectroacoustique de Studio&nbsp;&raquo;</em>. They are one node here, <em>Studio</em>, spanning <em>1985-1998</em> &mdash; and <strong>1992 is empty inside that span without being a gap</strong>: that year the competition held a retrospective and named no categories at all. <em>Multim&eacute;dia</em> is the second, one category over <em>1999-2009</em></li>
							<li><strong>a node marked <em>&#10022;</em> is a distinction, not a category.</strong> The <em>Magist&egrave;re</em> crowns a whole edition &mdash; the 1988 record calls it <em>1er MAGISTERIUM du 16&egrave;me Concours</em>, with no category and no rank &mdash; and the <em>R&eacute;sidence</em> is a residency offered, not a ranked award. Both appear on this axis only because the printed catalogue puts them there, and they are kept rather than hidden: dropping them would lose a fifth of the prize list</li>
						</ul>
					</div>
					<div>
						<p><strong>Hovering and clicking</strong></p>
						<ul>
							<li>hover a flow on the left for the awards a category received in a given year, in the form <em>Programme, 1988 &mdash; 7 awards</em></li>
							<li>hover a node &mdash; a year, a category, a composer &mdash; for what the diagram does <em>not</em> show. Its label is not repeated, since it is already written beside it: a year reads <em>31 awards in 6 categories</em>, a composer <em>9 awards in 6 categories</em></li>
							<li>a category opens with <strong>the period it covers</strong>, as in <em>1977-1998 &mdash; 79 awards to 66 composers, across 20 editions</em>. That period is the category's own span, as the competition defined it; <em>editions</em> counts the years in which it actually distinguished something. The two need not agree, and the gap between them is itself worth reading</li>
							<li><strong>that period is declared, not observed.</strong> <em>Art Visuel, 1982-1984</em> stays true whether or not a 1983 award has yet been entered</li>
							<li>in the full view, hover a flow on the right for the composer, the category and the years concerned, in the form <em>Robert Normandeau &mdash; 2 awards in Programme (awarded 1988, 1993 &middot; festival 1988, 1993)</em></li>
							<li>in the full view, a name carrying a <em>dotted underline</em> has an ISNI identifier &mdash; 396 of the 508 composers: click it to open the public authority record, with the works held by the Biblioth&egrave;que nationale de France where the alignment allows it</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
		<div id="chart"></div>
 	</div>
	<!-- jQuery n'etait pas charge sur cette page : il l'est desormais pour la
	     fiche ISNI (js/isni_box.js), qui en depend. d3 ne s'en sert pas.
	     Fiche ISNI : code partage par les quatre pages qui affichent un ISNI
	     (voir l'en-tete de js/isni_box.js). Le point d'entree, lui, reste dans
	     js/categories.js — ici le <text> SVG du noeud compositeur. -->
	<script src="lib/jquery-3.1.1.min.js"></script>
	<script src="js/isni_box.js"></script>
	<script src="lib/d3.v3.min.js" charset="utf-8"></script>
	<!-- <script src="lib/d3-sankey.min.js"></script> -->
	<script src="lib/erase_old_sankey.js"></script>
	<script src="js/categories.js"></script>
	<!-- Repli de la legende "How to read", partage par les sept pages qui en portent une : voir l'en-tete de js/legend_toggle.js -->
	<script src="js/legend_toggle.js"></script>
</body>
</html>