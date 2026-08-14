<!DOCTYPE html>
<html>
<head>
	<title>Overview | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<?php include_once("./php/asset.php") ?>
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/main.css') ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/overview.css') ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/isni.css') ?>">
	<?php include_once("../../analyticstracking.php") ?>
	<script src="<?php echo asset('lib/perlin.js') ?>"></script>
	<script src="<?php echo asset('lib/jquery-3.1.1.min.js') ?>"></script>
    <script src="<?php echo asset('lib/jquery.cookie.js') ?>"></script>
    <script src="<?php echo asset('js/variables.js') ?>"></script>
    <script src="<?php echo asset('js/functions.js') ?>"></script>
    <script src="<?php echo asset('js/isni_box.js') ?>"></script>
    <script src="<?php echo asset('js/overview_sma.js') ?>"></script>
	<script src="<?php echo asset('js/overview.js') ?>"></script>
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
		<div id="legend" class="is-collapsed">
			<button type="button" id="lg_toggle" class="lg-title" aria-expanded="false" aria-controls="lg_body">
				How to read this page<span class="lg-caret" aria-hidden="true"></span>
			</button>
			<div id="lg_body">
			<div class="lg-cols">
				<div>
					<p><strong>Coverage</strong></p>
					<p class="lg-note" id="lg-incomplete" style="display:none">With <em>num of records</em> at 0, every participant is listed and this index is then knowingly incomplete. The minutes are fully entered for the editions of 1973&ndash;1994, only partly for those of 1996&ndash;2009.</p>
					<p class="lg-note">No competition was held in 1995, so no square carries that year. There are 36 editions in all.</p>
					<p><strong>The index</strong></p>
					<ul>
						<li>Each composer is a slate square followed by one coloured square per participation. The slate square only marks where a run begins, and it carries no count.</li>
						<li>A participation square is coloured by its <em>edition year</em>, from the sea green of 1973 to the pale amethyst of 2009. It is the lightness that carries the order, and the key sits at the top right of the grid.</li>
						<li>The <em>squares: first entry &middot; archived works &middot; A&ndash;Z</em> control at the top left reorders the grid. Three orders, three questions. <em>first entry</em> settles ties by surname.</li>
					</ul>
				</div>
				<div>
					<p><strong>Selection</strong></p>
					<ul>
						<li>Click a square to select a composer, and the boxes on the right fill up. They arrive <strong>folded</strong>. The orange one names the composer, their country code and how many editions they entered; the purple one counts their archived works. Click a header to unfold it, and again to fold it back.</li>
						<li>A third box appears between them <strong>only for composers who have an ISNI</strong>, and its header is that identifier. Unfold it to load the international identity record: name forms, dates and external links. Nothing is requested before that.</li>
					</ul>
					<p><strong>Search</strong></p>
					<ul>
						<li>Type a name in <em>composer name</em> to list the composers matching it. Click a result to highlight their squares in yellow.</li>
						<li>The <em>num of records &gt;=</em> field rebuilds the index with only the composers having at least that many archived works.</li>
						<li id="lg-archived-only">The search lists only composers with <strong>at least one archived work</strong>. An application is not a publication.</li>
						<li>A result marked <em>not in this index</em> has no square to highlight, no participation having been recorded for them in the minutes entered so far. Their works are still listed on the catalogue and award pages.</li>
					</ul>
				</div>
				<div>
					<p><strong>Year markers</strong> in the orange box</p>
					<ul>
						<li>A bare year, <em>1984</em>, is an entry to the competition attested by a document.</li>
						<li>A plus, <em>1984+</em>, is that same entry <em>and</em> a work programmed at the <em>Synth&egrave;se</em> festival the same year.</li>
						<li>A degree sign, <em>1984&deg;</em>, is the festival alone. No entry to the competition is attested, and the year was inferred from the work.</li>
						<li>An asterisk, <em>1984*</em>, is a participation recorded with no document attached to it.</li>
						<li>Hover a year for the document the claim rests on: <em>bailiff&rsquo;s record</em>, <em>IMEB list of entrants</em>, <em>prize awarded</em>, <em>festival programme</em>, or <em>transcription only</em>.</li>
					</ul>
					<p><strong>Navigation trace</strong></p>
					<ul>
						<li>Every composer you consult joins the small canvas as a bubble, grouped by country. That is your navigation trace.</li>
						<li>The green box counts them. Click a bubble to detail one country.</li>
						<li>The trace is saved, and it can be replayed on the <em>Network</em> page with <em>compute traces</em>.</li>
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
		    <div id="isniColumn"></div>
		    <ul id="titles"></ul>
		    <ul id="results"></ul>
	    </div>
				</div>
			</div>
 	</div>
</body>
</html>