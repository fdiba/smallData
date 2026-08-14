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
	<script src="js/isni_box.js"></script>
	<script src="lib/perlin.js"></script>
	<script src="js/variables.js"></script>
	<script src="js/functions.js"></script>
	<script src="js/sma_core.js"></script>
	<script src="js/childs_award.js"></script>
	<script src="js/particles_award.js"></script>
	<script src="js/aww.js"></script>
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
			<div id="page_cols">
			<div id="left_col">
			<div id="main_container">
				<div id="sma_note"></div>
				<canvas id="myCanvas" width="500" height="500">Votre navigateur ne supporte pas les canvas.</canvas>
			</div>

			<div id="legend" class="is-collapsed">
				<button type="button" id="lg_toggle" class="lg-title" aria-expanded="false" aria-controls="lg_body">
					How to read this page<span class="lg-caret" aria-hidden="true"></span>
				</button>
				<div id="lg_body">
				<div class="lg-cols">
					<div>
						<p class="lg-intro">The Bourges International Competition of Electroacoustic Music was founded by the GMEB, later the <em>IMEB</em>, in 1973. It was held almost every year until 2009, 36 editions in all, with none in 1995. Until 1977 entries shared a single ranking; after that they were split into categories. This table gathers the award-winning works of those editions, grouped by edition, category and prize.</p>
						<p class="lg-intro"><strong>From 1993 on, one edition holds two competitions.</strong> The bailiff's record of 8 June 1993 covers both the 21st International Competition and the 1st Puy of Electroacoustic Music: one document, one year, two series of tape numbers, <em>C</em> and <em>P</em>, and two prize lists. The Puy's awards are shown <strong>after</strong> those of the competition, edition by edition.</p>
						<p><strong>The table</strong></p>
						<ul>
							<li>The table lists the award-winning works of the Bourges competitions, sorted by edition, category, price and last name.</li>
							<li>Pick an edition in the <em>year</em> menu and <strong>columns that hold nothing for it are hidden</strong>. From 1973 to 1976 the competition had no category at all. Nothing is lost, since the column comes back as soon as the selection changes, and <em>All works</em> shows all nine.</li>
							<li><em>duration</em> is the length recorded for the work in the <em>R&eacute;pertoire g&eacute;n&eacute;ral</em>, in minutes and seconds. It is blank in 82 of the 799 rows: 12 award-winning works for which the catalogue gives no duration, the 17 distinctions whose work is not held at the fonds, and the 53 <em>not awarded</em> rows, which carry no work at all. A blank cell means the duration is unknown, not that it is zero.</li>
							<li>A composer whose name is <span class="composer-isni">underlined with dots</span> has an ISNI. Click either part of the name to open their international identity record in the panel on the right: name forms, dates, external links (VIAF, Wikidata, MusicBrainz&hellip;) and contributing databases. The panel stays open while you scroll the table, and the cross or the <em>Esc</em> key closes it.</li>
						</ul>
					</div>
					<div>
						<p><strong>Two competitions, one category</strong></p>
						<ul>
							<li><strong>The Puy is not a degree of the competition, it is another competition</strong>, and the 1993 record says so itself, on its first page: <em>&laquo;&nbsp;it was decided, in order to tell the entrants apart, to write the letter C for the competition and the letter P for the Puy beside the number given to the tape&nbsp;&raquo;</em>. 433 tapes bear a C, 159 a P. Its four disciplines, <em>Humour</em>, <em>Circonstance</em>, <em>Jeunesse</em> and <em>Danse</em>, are not musical categories of the competition, and its scale is not the same either: four ranks, first to fourth prize, where the Quadrivium has two prizes and mentions. Its 15 rows are therefore placed after the competition's, within their edition, rather than interleaved with them. <strong>The R&eacute;pertoire g&eacute;n&eacute;ral holds none of them.</strong> The catalogue records 23 award-winning works for 1993 and all 23 are the competition's, so the Puy's seven prizes exist in the bailiff's record alone.</li>
							<li><strong>One category carries two names, and the catalogue keeps both.</strong> The <em>R&eacute;pertoire g&eacute;n&eacute;ral</em> writes <em>&Eacute;lectroacoustique</em> for the awards of 1985&ndash;1991 and <em>Studio</em> for those of 1993&ndash;1998, but the two bailiff's records that define the category call it by the same full name, <em>&laquo;&nbsp;Prix de la Musique &Eacute;lectroacoustique de Studio&nbsp;&raquo;</em>, in 1990 and again in 1993. They are shown here under one name, <em>Studio</em>, as on the <a href="categories.php">Categories</a> page. <strong>That name is an anachronism for 46 of these rows.</strong> Between 1985 and 1991 six records out of seven write the short form, without <em>de Studio</em>. The historical spelling is not lost, and the catalogue keeps it untouched.</li>
						</ul>
					</div>
					<div>
						<p><strong>Agents</strong></p>
						<ul>
							<li>The <em>visualization</em> has an ISNI record of its own, and it does not behave like the one above. Click an agent whose composer has an ISNI and a box appears in the information column, between the orange box and the purple one, headed by that identifier. Click the header to unfold the record. It sits in the column instead of over it, so nothing is hidden, and nothing is requested until you unfold it.</li>
							<li>On the canvas, each moving ellipse is an agent carrying one award-winning work.</li>
							<li><span class="sq" style="background:#bdc3c7"></span> An agent, still looking for others sharing a common property.</li>
							<li><span class="sq" style="background:#2ecc71"></span> A grouping. Click it to open it.</li>
							<li><span class="sq" style="background:#f1c40f"></span> An opened grouping, showing its members. Double-click it to close it.</li>
							<li><span class="sq" style="background:#3498db"></span> A single work inside an opened grouping. Click it to display its details in the information column: the orange box names the composer and their country, the purple one describes the work, and a blue box appears between them when that composer has an ISNI.</li>
						</ul>
						<p><strong>Grouping</strong></p>
						<ul>
							<li>Agents compare their properties as they move. Candidate properties and their exchange counts appear in the white panel of the top bar, and a property such as <em>edition</em> or <em>price</em> becomes clickable once exchanged often enough.</li>
							<li>Click that property name to let the agents regroup around it.</li>
							<li><em>reset</em> restarts the system and <em>pause</em> freezes it. The <em>p</em> key toggles the agents' drift.</li>
						</ul>
	
					</div>
				</div>
				</div>
			</div>
			<div id="main_table">
				<table id="works_table">
					<tr>
						<th class="c-year">edition</th>
						<th class="c-cat">category</th>
						<th class="c-price">price</th>
						<th class="c-composer">composer</th>
						<th class="c-coauth">with</th>
						<th class="c-ctry">country</th>
						<th class="c-title">title</th>
						<th class="c-dur">duration</th>
					</tr>
				</table>
			</div>
			<div id="listing"></div>
			</div>
			<div id="infos">
				<div id="cookies"></div>
				<div id="selection"></div>
				<div id="isniColumn"></div>
				<ul id="titles"></ul>
			</div>
			</div>		</div>
 	</div>
</body>
</html>