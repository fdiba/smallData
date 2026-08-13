<!DOCTYPE html>
<html>
<head>
	<title>Network | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<?php include_once("./php/asset.php") ?>
	<!-- Feuilles et scripts horodates par asset() : sans cela, une correction
	     deployee reste invisible tant que le lecteur n'a pas vide son cache —
	     verifie le 2026-08-11 sur une regle de main.css. Voir php/asset.php. -->
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/main.css') ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/network.css') ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/isni.css') ?>">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
	<script src="<?php echo asset('lib/jquery-3.1.1.min.js') ?>"></script>
	<script src="<?php echo asset('lib/jquery.cookie.js') ?>"></script>
	<script src="<?php echo asset('lib/perlin.js') ?>"></script>
	<!-- Fiche ISNI : code partage par les pages qui affichent un ISNI (voir
	     l'en-tete de js/isni_box.js). Depend de jQuery, donc charge apres lui.
	     js/functions.js s'en sert pour rendre le nom cliquable dans la boite
	     orange, et js/network.js appelle enableIsniPanel(). -->
	<script src="<?php echo asset('js/isni_box.js') ?>"></script>
	<script src="<?php echo asset('js/variables.js') ?>"></script>
    <script src="<?php echo asset('js/functions.js') ?>"></script>
    <script src="<?php echo asset('js/childs.js') ?>"></script>
    <script src="<?php echo asset('js/particles.js') ?>"></script>
	<script src="<?php echo asset('js/network.js') ?>"></script>
	<!-- Repli de la legende "How to read", partage par les sept pages qui en portent une : voir l'en-tete de js/legend_toggle.js -->
	<script src="<?php echo asset('js/legend_toggle.js') ?>"></script>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main">Network</h1>
				<p></p>
			</div>
			<?php include_once("./php/menus.php") ?>
			<ul id="launcher">
				<li class="b_off" id="get_all">get all data</li>
				<li class="b_off" id="get_sl">compute traces</li>
				<li class="b_off" id="cp_all">compute all</li>		
			</ul>
			<!-- Les deux panneaux blancs dans UN SEUL conteneur : elements
			     independants dans le flex de la barre, ils se separaient des
			     que celle-ci se repliait — le controle du SMA restait en haut,
			     la boite d'information passait a la ligne suivante, tout a
			     gauche. #sma_menu existe deja pour cela sur les oeuvres
			     primees, le catalogue et les Euphonies, et sa regle est dans
			     css/main.css : Network le reutilise tel quel, sans une ligne
			     de CSS de plus. -->
			<div id="sma_menu">
				<div id="sma_main_ctrl">
					<ul>
					</ul>
				</div>
				<div id="commons">
					<p></p>
				</div>
			</div>
		</div>
		<div id="main_container">
			<canvas id="myCanvas" width="500" height="500">Votre navigateur ne supporte pas les canvas.</canvas>
			<div id="infos">
				<div id="cookies"></div>
			    <div id="selection"></div>
			    <!-- Fiche ISNI du compositeur selectionne. Elle se pose ICI,
			         entre la boite orange d'ou part le clic et la liste des
			         oeuvres : en flux, elle ne recouvre rien (js/isni_box.js,
			         option `into`). Vide tant qu'aucun nom n'a ete clique. -->
			    <div id="isniColumn"></div>
			    <ul id="titles"></ul>
		    </div>
	    </div>
		<!-- La legende arrive REPLIEE depuis le 2026-08-11, comme categories.php,
		     index.php et animated_data.php : ouverte, elle occupe plus de hauteur que
		     le graphe, et le graphe est ce qu'on vient voir. L'etat d'arrivee s'ecrit
		     ICI et non dans js/legend_toggle.js — voir l'en-tete de ce fichier : une
		     page sans JavaScript garde la legende dans l'etat ou le serveur l'a
		     envoyee, et aucune page ne s'ouvre sur un panneau qui se refermerait sous
		     les yeux. -->
		<div id="legend" class="is-collapsed">
			<button type="button" id="lg_toggle" class="lg-title" aria-expanded="false" aria-controls="lg_body">
				How to read this page<span class="lg-caret" aria-hidden="true"></span>
			</button>
			<div id="lg_body">
			<div class="lg-cols">
				<div>
					<p><strong>Controls</strong></p>
					<ul>
						<!-- « with at least one archived work » : le filtre est pose par
						     computeAll() dans js/network.js, et leve par ?v=all. -->
						<li><em>compute all</em> builds the multi-agent system from every composer of the database <strong>who has at least one archived work</strong> &mdash; about half of the people recorded in the minutes entered the competition without a recording joining the collection, and an agent with nothing to show has nothing to open; <em>compute traces</em> builds it only from the composers you have consulted in Overview (your navigation path)</li>
						<li>both buttons can be clicked at any time to restart the simulation</li>
						<li><em>pause</em> (or the space bar) freezes the system; the <em>p</em> key toggles the agents' drift</li>
					</ul>
				</div>
				<div>
					<p><strong>Agents</strong></p>
					<ul>
						<li><span class="sq" style="background:#bdc3c7"></span> a composer, still looking for others sharing a common property</li>
						<li><span class="sq" style="background:#2ecc71"></span> a grouping of composers &mdash; click it to open it</li>
						<li><span class="sq" style="background:#f1c40f"></span> an opened grouping, showing its members &mdash; double-click it to close it</li>
						<li><span class="sq" style="background:#3498db"></span> a composer inside an opened grouping &mdash; click it to see how many archived works they have; click that count to unfold the list, click it again to fold it back</li>
							<li>a box appears under the orange one <strong>only for composers who have an ISNI</strong>, and its header is that identifier. Click the header to unfold the international identity record &mdash; name forms, dates, external links (VIAF, Wikidata, MusicBrainz&hellip;) and contributing databases. Nothing is requested until you unfold it, and a record already opened once is kept for the session. Selecting another composer replaces it; selecting one without an ISNI removes it</li>
					</ul>
				</div>
				<div>
					<p><strong>Grouping</strong></p>
					<ul>
						<li>agents compare their properties as they move; when a shared property (such as <em>country</em>) has been exchanged often enough, its name appears in the white panel of the top bar</li>
						<li>click that property name to let the agents regroup around it</li>
						<li>the green box reports the number of nodes while the system grows, then details whatever you click on the canvas</li>
					</ul>
				</div>
			</div>
			</div>
		</div>
 	</div>
</body>
</html>