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
				<!-- CINQ RUBRIQUES DANS TROIS CELLULES — 2026-08-14. La grille est un
				     flex qui passe a la ligne : la hauteur d une rangee est celle de sa
				     plus haute cellule. Empilees, les rubriques ne font plus qu UNE
				     rangee. Meme geste que sur index.php et animated_data.php.

				     PHRASES ENTIERES — 2026-08-14, demande de Florent. Les puces de cette
				     page commencent par une MAJUSCULE et finissent par un POINT ; une puce
				     qui portait deux idees en fait deux phrases. Ce n'est pas encore le cas
				     des six autres legendes, qui gardent le fragment en minuscules : si on
				     les aligne un jour, c'est cette page qui sert de modele, pas l'inverse.
				     Les points ajoutes APRES une infobulle citee (« … 7 awards. ») sont ceux
				     de la legende, pas de l'interface : le </em> ferme avant le point. -->
				<div class="lg-cols">
					<div>
						<p><strong>The diagram</strong></p>
						<ul>
							<li>It follows the prize list from left to right: the <em>year</em> of the award, the <em>category</em> it was given in, and the <em>composer</em> who received it. It gathers 729 awards to 508 composers under 27 labels, across the 36 editions of 1973 to 2009. No competition was held in 1995.</li>
							<li>The <em>diagram</em> switch above gives two views of the same data. <em>year &rarr; category</em> fits one screen and is where the page opens. <em>year &rarr; category &rarr; composer</em> adds the 508 composers and is some ten times taller.</li>
							<li>Both views share their first two columns, and every total is the same in both. The short view holds 64 nodes and 195 flows, the full one 572 and 848.</li>
						</ul>
						<p><strong>The two years</strong></p>
						<ul>
							<li>The <em>awarded</em> year is the year of the prize. The <em>festival</em> years are those in which the work was programmed at Bourges. The two usually coincide, and they need not.</li>
							<li>For 234 of the 729 awards no programming year is recorded at all. The <em>festival</em> mention is then simply omitted, which is an absence of evidence and not evidence of absence.</li>
						</ul>
					</div>
					<div>
						<p><strong>The columns and the flows</strong></p>
						<ul>
							<li>The thickness of a flow is the number of awards it carries.</li>
							<li>Flows on the left run from a year to a category. In the full view, flows on the right run from a category to a composer.</li>
							<li>Colours only tell neighbouring flows apart. They carry no meaning of their own.</li>
							<li>The 39 awards recorded without a category are gathered under <em>None</em>. Thirty-eight of them fall between 1973 and 1976, when the competition still had a single ranking.</li>
							<li>The full prize list, work by work, is on the <a href="award-winning_works.php">Award-winning works</a> page.</li>
						</ul>
						<p><strong>Hovering and clicking</strong></p>
						<ul>
							<!-- LES TIRETS CADRATINS DES TROIS EXEMPLES CI-DESSOUS SONT CEUX DE
							     L'INTERFACE, pas de la legende : ce sont les infobulles reproduites
							     mot pour mot. Les remplacer par un deux-points ferait citer a la
							     legende un texte que la page n'affiche pas. Voir les gabarits dans
							     js/sankey.js. -->
							<li>Hover a flow on the left for what a category received that year: <em>Programme, 1988 &mdash; 7 awards</em>.</li>
							<li>Hover a node for what the diagram does <em>not</em> show. A year reads <em>31 awards in 6 categories</em>, a composer <em>9 awards in 6 categories</em>.</li>
							<li>A category opens with <strong>the period it covers</strong>, as in <em>1977-1998 &mdash; 79 awards to 66 composers, across 20 editions</em>. That period is the one the competition declared, and <em>editions</em> counts the years in which it actually distinguished something. The two need not agree.</li>
							<li>In the full view, hover a flow on the right for the composer, the category and the years concerned: <em>Robert Normandeau &mdash; 2 awards in Programme (awarded 1988, 1993 &middot; festival 1988, 1993)</em>.</li>
							<li>In the full view, a name with a dotted underline has an ISNI, 396 of the 508. Click it to open the public authority record.</li>
						</ul>
					</div>
					<div>
						<p><strong>The categories</strong></p>
						<ul>
							<!-- La fusion des lignes 6 et 12 de imeb_categorie
							     (DB/fusion_categorie_studio.sql, 2026-08-12) fait UN nœud la ou le
							     catalogue en donnait deux : le diagramme ne doit pas le faire en
							     silence. Le catalogue garde ses deux mots — imeb_music.award_cat
							     n'est pas reecrit —, c'est la page qui n'en montre qu'un, et cette
							     puce dit lequel est l'autre. Les citations sont dans le commentaire
							     de la categorie 6. DB/fusion_multimedia.sql fait de meme pour les
							     deux « Multimedia », celui de 1999 et celui de 2000-2009.

							     LE TROU DE 1992 : la page a ecrit jusqu'au 2026-08-14 que le
							     concours "held a retrospective". C'EST FAUX, et le constat du
							     6 juin 1992 dit l'inverse en toutes lettres : « Le 20e Concours
							     International de Bourges est exclusivement ouvert pour le Degre
							     Residence ». Il y a bien eu concours, avec 102 bandes ; ce qu'il
							     n'y a pas, c'est un deuxieme degre, donc aucun prix et aucune
							     categorie a nommer. La conclusion ne change pas, le motif si :
							     1992 ne relie ni ne separe Electroacoustique et Studio parce
							     qu'aucun prix n'y a ete decerne (Chantier_pv_addendum_1992,
							     §27.1). La retrospective de cette annee-la, ce sont les vingt
							     Euphonies d'Or, qui ne sont pas le concours (euphonies.php). -->
							<li><strong>Two nodes each carry two names</strong>, and the catalogue keeps both. <em>Studio</em> covers what the catalogue calls <em>&Eacute;lectroacoustique</em> in 1985&ndash;1991 and <em>Studio</em> in 1993&ndash;1998, the two bailiff's records that define it naming it alike. 1992 is empty inside that span without being a gap: the twentieth competition was open for one degree only, the R&eacute;sidence, so it ranked nothing and had no category to name. <em>Multim&eacute;dia</em> is the second such node, and it covers 1999&ndash;2009.</li>
							<li><strong>A node marked <em>&#10022;</em> is a distinction, not a category.</strong> The <em>Magist&egrave;re</em> crowns a whole edition, and the <em>R&eacute;sidence</em> is a residency offered rather than a ranked award. They carry 146 of the 729 awards, from 1988 on. They sit on this axis only because the printed catalogue puts them there.</li>
							<li>Twelve categories were defined in 2000, from <em>&oelig;uvre d'esth&eacute;tique formelle</em> to <em>&oelig;uvre pour le multim&eacute;dia</em>. They carry 152 of the 729 awards.</li>
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