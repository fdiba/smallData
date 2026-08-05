<?php
	$title = "IMEB Euphonies d’Or";
?>
<!DOCTYPE html>
<html>
<head>
	<title><?php echo $title ?> | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/euphonies.css">
	<link rel="stylesheet" type="text/css" href="css/isni.css">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
	<script src="lib/jquery-3.1.1.min.js"></script>
	<!-- Fiche ISNI : code partage par les quatre pages qui affichent un ISNI
	     (voir l'en-tete de js/isni_box.js). Depend de jQuery, donc charge
	     apres lui ; les points d'entree, eux, restent dans les scripts de la
	     page — ici deux : la colonne ISNI du tableau (js/euphonies.js) et la
	     boite violette du SMA (js/particles_euphonies.js). -->
	<script src="js/isni_box.js"></script>
	<script src="lib/perlin.js"></script>
	<script src="js/variables.js"></script>
	<script src="js/functions.js"></script>
	<script src="js/sma_core.js"></script>
	<script src="js/childs_euphonies.js"></script>
	<script src="js/particles_euphonies.js"></script>
	<!-- Tri du tableau par clic sur ses en-tetes : module partage, sans
	     dependance (voir l'en-tete de js/table_sort.js). Il est appele depuis
	     js/euphonies.js, une fois les lignes construites. -->
	<script src="js/table_sort.js"></script>
	<script src="js/euphonies.js"></script>
	<!-- Repli de la legende "How to read", partage par les sept pages qui en portent une : voir l'en-tete de js/legend_toggle.js -->
	<script src="js/legend_toggle.js"></script>
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
			<div id="main_container">
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
					<p class="lg-intro">The <em>Euphonies d'Or</em> are honorary distinctions awarded in <strong>three retrospective rounds</strong>, not one &mdash; <strong>35 works</strong> in all, which is why this page lists more than twenty: <em>20</em> at the competition's 20th anniversary in <em>1992</em> (the finest works of 1973&ndash;1991), <em>10</em> more in <em>2004</em> (chosen among the prizes of 1993&ndash;2003), and a final <em>5</em> in <em>2010</em> (for 2005&ndash;2009). The <em>edition</em> column marks which round each work belongs to.</p>
				<div class="lg-cols">
					<div>
						<p><strong>Table &amp; agents</strong></p>
						<ul>
							<li>the table lists the Euphonies d'Or, sorted on arrival by edition then last name; <em>click any column header</em> to sort on that column, and again to reverse the order &mdash; sorting <em>edition</em> twice thus restores the order the page opened with. Empty cells always come last, in either direction: a blank is a missing piece of information, not a small value</li>
							<li>click a row and the composer's records held by data.bnf.fr unfold right underneath it, or click the ISNI itself for a summary of the composer's international identity record and the external resources it points to</li>
							<li>on the canvas, each moving ellipse is an agent carrying one Euphonie d'Or</li>
						</ul>
					</div>
					<div>
						<p><strong>Agents</strong></p>
						<ul>
							<li><span class="sq" style="background:#bdc3c7"></span> an agent, still looking for others sharing a common property</li>
							<li><span class="sq" style="background:#2ecc71"></span> a grouping &mdash; click it to open it</li>
							<li><span class="sq" style="background:#f1c40f"></span> an opened grouping, showing its members &mdash; double-click it to close it</li>
							<li><span class="sq" style="background:#3498db"></span> a single work inside an opened grouping &mdash; click it to display its details in the information column: the <em>orange</em> box names the composer and their country, the <em>purple</em> one describes the work, and a <em>blue</em> box appears between them when that composer has an ISNI</li>
							<li>when the composer of the selected work has an ISNI, a box appears in the information column, between the orange box and the purple one, headed by that identifier &mdash; click the header to unfold the international identity record. It sits in the column instead of over it, so nothing is hidden, and nothing is requested until you unfold it</li>
						</ul>
					</div>
					<div>
						<p><strong>Grouping</strong></p>
						<ul>
							<li>agents compare their properties as they move; candidate properties and their exchange counts appear in the white panel of the top bar, and a property (such as <em>edition</em> or <em>cat</em>) becomes clickable once exchanged often enough</li>
							<li>click that property name to let the agents regroup around it</li>
							<li><em>reset</em> restarts the system, <em>pause</em> freezes it (the <em>p</em> key toggles the agents' drift)</li>
						</ul>
					</div>
				</div>
				</div>
			</div>
			<div id="main_table">
				<table id="euphonies_table">
					<tr>
						<th>edition</th>
						<th>year</th>
						<th>category</th>
						<th>sub category</th>
						<th>price</th>
						<th>first name</th>
						<th>last name</th>
						<th>country</th>
						<th>title</th>
						<th>duration</th>
						<!-- <th>temp id</th> -->
						<th>isni</th>
					</tr>
				</table>
			</div>
		</div>
 	</div>
</body>
</html>