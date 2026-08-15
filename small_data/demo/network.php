<!DOCTYPE html>
<html>
<head>
	<title>Network | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<?php include_once("./php/asset.php") ?>
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/main.css') ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/network.css') ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/isni.css') ?>">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
	<script src="<?php echo asset('lib/jquery-3.1.1.min.js') ?>"></script>
	<script src="<?php echo asset('lib/jquery.cookie.js') ?>"></script>
	<script src="<?php echo asset('lib/perlin.js') ?>"></script>
	<script src="<?php echo asset('js/isni_box.js') ?>"></script>
	<script src="<?php echo asset('js/variables.js') ?>"></script>
    <script src="<?php echo asset('js/functions.js') ?>"></script>
    <script src="<?php echo asset('js/childs.js') ?>"></script>
    <script src="<?php echo asset('js/particles.js') ?>"></script>
	<script src="<?php echo asset('js/network.js') ?>"></script>
	<script src="<?php echo asset('js/legend_toggle.js') ?>"></script>
</head>
<body>
	<div id="content">
		<div id="ctrl_bar">
			<div id="info">
				<h1 id="main">Network</h1>
				<p></p>
			</div>
			<ul id="launcher">
				<li class="b_off" id="get_sl">compute traces</li>
				<li class="b_off" id="cp_all">compute all</li>		
			</ul>
			<?php include_once("./php/menus.php") ?>
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
					<p><strong>Controls</strong></p>
					<ul>
						<li><em>compute all</em> builds the multi-agent system from every composer of the database <strong>who has at least one archived work</strong>. About half of the people recorded in the minutes entered the competition without a recording joining the collection, and an agent with nothing to show has nothing to open. <em>compute traces</em> builds it only from the composers you have consulted in Overview, which is your navigation path.</li>
						<li>Both buttons can be clicked at any time to restart the simulation.</li>
						<li><em>reset</em> rebuilds the system from the same composers, and <em>pause</em>, or the space bar, freezes it. The agents slow to a stop instead of jumping, and pick up again the same way.</li>
					</ul>
				</div>
				<div>
					<p><strong>Agents</strong></p>
					<ul>
						<li><span class="sq" style="background:#bdc3c7"></span> A composer, still looking for others sharing a common property.</li>
						<li><span class="sq" style="background:#2ecc71"></span> A grouping of composers. Click it to open it.</li>
						<li><span class="sq" style="background:#f1c40f"></span> An opened grouping, showing its members. Double-click it to close it.</li>
						<li><span class="sq" style="background:#3498db"></span> A composer inside an opened grouping. Click it to see how many archived works they have, then click that count to unfold the list and again to fold it back.</li>
						<li>A box appears under the orange one <strong>only for composers who have an ISNI</strong>, and its header is that identifier. Click the header to unfold the international identity record: name forms, dates, external links (VIAF, Wikidata, MusicBrainz&hellip;) and contributing databases. Nothing is requested until you unfold it, and a record already opened once is kept for the session. Selecting another composer replaces it, and selecting one without an ISNI removes it.</li>
					</ul>
				</div>
				<div>
					<p><strong>Grouping</strong></p>
					<ul>
						<li>Agents compare their properties as they move. Two of them can be shared: <em>country</em> and <em>archived works</em>. Every time two agents meet and match on one, that property gains a point, and a blue line is drawn between them.</li>
						<li>The white panel of the top bar lists the properties that have been exchanged, the most shared first, with a running count while it is still low. Click one to let the agents regroup around it. Nothing else changes: the same agents rearrange themselves under the other reading.</li>
						<li>The green box reports the number of nodes while the system grows, then details whatever you click on the canvas.</li>
					</ul>
				</div>
			</div>
			</div>
		</div>
		</div>
		<div id="infos">
			<div id="cookies"></div>
			<div id="selection"></div>
			<div id="isniColumn"></div>
			<ul id="titles"></ul>
		</div>
		</div>
 	</div>
</body>
</html>