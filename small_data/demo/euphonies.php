<?php
	$title = "IMEB Euphonies d’Or";

	require(dirname($_SERVER['DOCUMENT_ROOT']) . '/access/connexion.php');

	function compte($dbh, $sql){
		try {
			$sth = $dbh->query($sql);
			if(!$sth) return null;
			$v = $sth->fetchColumn();
			return ($v === false || $v === null) ? null : (int) $v;
		} catch (Exception $e) {
			return null;
		}
	}
	function nb($n){ return ($n === null) ? '?' : number_format($n, 0, ',', '&thinsp;'); }

	$n_euph   = compte($dbh, "SELECT COUNT(*) FROM imeb_music WHERE euphonies > 0");
	$n_euph_1 = compte($dbh, "SELECT COUNT(*) FROM imeb_music WHERE euphonies = 1");
	$n_euph_2 = compte($dbh, "SELECT COUNT(*) FROM imeb_music WHERE euphonies = 2");
	$n_euph_3 = compte($dbh, "SELECT COUNT(*) FROM imeb_music WHERE euphonies = 3");
	$n_rondes = compte($dbh, "SELECT COUNT(DISTINCT euphonies) FROM imeb_music WHERE euphonies > 0");
?>
<!DOCTYPE html>
<html>
<head>
	<title><?php echo $title ?> | Small Data</title>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<?php include_once("./php/asset.php") ?>
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/main.css') ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/euphonies.css') ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo asset('css/isni.css') ?>">
	<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
	<script src="<?php echo asset('lib/jquery-3.1.1.min.js') ?>"></script>
	<script src="<?php echo asset('js/isni_box.js') ?>"></script>
	<script src="<?php echo asset('lib/perlin.js') ?>"></script>
	<script src="<?php echo asset('js/variables.js') ?>"></script>
	<script src="<?php echo asset('js/functions.js') ?>"></script>
	<script src="<?php echo asset('js/sma_core.js') ?>"></script>
	<script src="<?php echo asset('js/childs_euphonies.js') ?>"></script>
	<script src="<?php echo asset('js/particles_euphonies.js') ?>"></script>
	<script src="<?php echo asset('js/table_sort.js') ?>"></script>
	<script src="<?php echo asset('js/euphonies.js') ?>"></script>
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
			<div id="main_container">
				<canvas id="myCanvas" width="500" height="500">Votre navigateur ne supporte pas les canvas.</canvas>
				<div id="infos">
					<div id="cookies"></div>
				    <div id="selection"></div>
				    <div id="isniColumn"></div>
				    <ul id="titles"></ul>
			    </div>
		    </div>
			<div id="legend" class="is-collapsed">
				<button type="button" id="lg_toggle" class="lg-title" aria-expanded="false" aria-controls="lg_body">
					How to read this page<span class="lg-caret" aria-hidden="true"></span>
				</button>
				<div id="lg_body">
				<div class="lg-cols">
					<div>
						<p class="lg-intro">The <em>Euphonies d'Or</em> are honorary distinctions awarded in <strong><?php echo nb($n_rondes) ?> retrospective rounds</strong>, not one. There are <strong><?php echo nb($n_euph) ?> works</strong> in all, which is why this page lists more than twenty: <?php echo nb($n_euph_1) ?> at the competition's 20th anniversary in 1992, chosen among the finest works of 1973&ndash;1991; <?php echo nb($n_euph_2) ?> more in 2004, chosen among the prizes of 1993&ndash;2003; and a final <?php echo nb($n_euph_3) ?> in 2010, for 2005&ndash;2009. The <em>edition</em> column marks which round each work belongs to.</p>
						<p><strong>Table &amp; agents</strong></p>
						<ul>
							<li>The table lists the Euphonies d'Or, sorted on arrival by edition then last name. The <em>composer</em> column shows &laquo;&nbsp;first name last name&nbsp;&raquo; but sorts on the last name, the first one only breaking ties.</li>
							<li>Click any column header to sort on that column, and again to reverse the order. Sorting <em>edition</em> twice thus restores the order the page opened with. Empty cells always come last, in either direction: a blank is a missing piece of information, not a small value.</li>
							<li>Click a row and the composer's records held by data.bnf.fr unfold right underneath it. Click the ISNI itself for a summary of the composer's international identity record and the external resources it points to.</li>
						</ul>
					</div>
					<div>
						<p><strong>Agents</strong></p>
						<ul>
							<li>On the canvas, each moving ellipse is an agent carrying one Euphonie d'Or.</li>
							<li><span class="sq" style="background:#bdc3c7"></span> An agent, still looking for others sharing a common property.</li>
							<li><span class="sq" style="background:#2ecc71"></span> A grouping. Click it to open it.</li>
							<li><span class="sq" style="background:#f1c40f"></span> An opened grouping, showing its members. Double-click it to close it.</li>
							<li><span class="sq" style="background:#3498db"></span> A single work inside an opened grouping. Click it to display its details in the information column: the orange box names the composer and their country, the purple one describes the work, and a blue box appears between them when that composer has an ISNI.</li>
							<li>When the composer of the selected work has an ISNI, a box appears in the information column, between the orange box and the purple one, headed by that identifier. Click the header to unfold the international identity record. It sits in the column instead of over it, so nothing is hidden, and nothing is requested until you unfold it.</li>
						</ul>
					</div>
					<div>
						<p><strong>Grouping</strong></p>
						<ul>
							<li>Agents compare their properties as they move. Candidate properties and their exchange counts appear in the white panel of the top bar, and a property such as <em>edition</em>, <em>category</em> or <em>minutes</em>, the duration rounded to the nearest minute, becomes clickable once exchanged often enough.</li>
							<li>Click that property name to let the agents regroup around it.</li>
							<li><em>reset</em> restarts the system and <em>pause</em> freezes it. The <em>p</em> key toggles the agents' drift.</li>
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
						<th>price</th>
						<th>composer</th>
						<th>country</th>
						<th>title</th>
						<th>duration</th>
						<th>isni</th>
					</tr>
				</table>
			</div>
		</div>
 	</div>
</body>
</html>