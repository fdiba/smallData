<?php
/* Small Data — landing page for small_data/.
   $app = folder holding the application, relative to THIS file.
   The former index.php linked to "./demo", so the default is 'demo/'.
   If the application now sits directly in small_data/, use '' instead. */

$app = 'demo/';
?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/analyticstracking.php") ?>
<title>Small Data — Visualising the IMEB Archives</title>
<meta name="description" content="A visualisation application for the international electroacoustic music competitions held in Bourges, 1973-2009.">
<style>
:root{
	--midnight:#2c3e50;
	--asphalt:#34495e;
	--amethyst:#9b59b6;
	--river:#3498db;
	--emerald:#2ecc71;
	--greensea:#16a085;
	--silver:#bdc3c7;
}
*{ box-sizing:border-box; }
body{
	margin:0;
	background:var(--midnight);
	color:#fff;
	font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;
	font-size:16px;
	line-height:1.6;
}
.wrap{ max-width:860px; margin:0 auto; padding:48px 24px 72px; }

/* --- Header: the colour band reuses the edition encoding,
       1973 → 2009 mapped onto the colour wheel, as in Overview --- */
.editions{ display:flex; height:10px; margin-bottom:28px; }
.editions span{ flex:1; }

h1{
	margin:0;
	font-size:34px;
	font-weight:600;
	letter-spacing:.06em;
	text-transform:uppercase;
}
.baseline{
	margin:6px 0 40px;
	color:var(--greensea);
	font-size:17px;
}
h2{
	margin:48px 0 6px;
	font-size:13px;
	font-weight:600;
	letter-spacing:.14em;
	text-transform:uppercase;
	color:var(--silver);
	border-bottom:1px solid rgba(255,255,255,.18);
	padding-bottom:8px;
}
p{ margin:0 0 18px; }
a{ color:#fff; }

.intro p:first-of-type{ font-size:18px; }

/* --- Sections --- */
.rubriques{ list-style:none; margin:22px 0 0; padding:0; }
.rubriques li{
	display:flex;
	flex-wrap:wrap;
	gap:4px 16px;
	padding:12px 0 12px 14px;
	border-left:3px solid var(--river);
	margin-bottom:4px;
	background:var(--asphalt);
	padding-right:14px;
}
.rubriques li.catalogue{ border-left-color:var(--amethyst); }
.rubriques a{
	flex:0 0 190px;
	font-weight:600;
	text-decoration:none;
	border-bottom:1px solid rgba(255,255,255,.35);
	align-self:flex-start;
}
.rubriques a:hover{ border-bottom-color:#fff; background:rgba(255,255,255,.12); }
.rubriques span{ flex:1 1 320px; color:var(--silver); font-size:15px; }

/* --- Publications --- */
.pub{
	margin:0 0 18px;
	padding-left:16px;
	border-left:3px solid var(--emerald);
	font-size:15px;
	color:var(--silver);
}
.pub em{ color:#fff; font-style:normal; font-weight:600; }

/* --- Video --- */
.video{
	position:relative;
	width:100%;
	padding-top:56.25%;      /* 16/9 */
	margin:0 0 8px;
	background:#000;
}
.video iframe{
	position:absolute;
	top:0; left:0;
	width:100%; height:100%;
	border:0;
}
.caption{ font-size:14px; color:var(--silver); margin:0 0 8px; }

/* --- Liens annexes --- */
.plain{ list-style:none; padding:0; margin:22px 0 0; }
.plain li{ margin-bottom:8px; }
.plain a{ font-weight:600; }

footer{
	margin-top:56px;
	padding-top:18px;
	border-top:1px solid rgba(255,255,255,.18);
	font-size:14px;
	color:var(--silver);
}
@media (max-width:600px){
	h1{ font-size:26px; }
	.rubriques a{ flex-basis:100%; }
}
</style>
</head>
<body>
<div class="wrap">

	<div class="editions" aria-hidden="true">
<?php
	/* One band per edition, 1973 to 2009: the same hue formula
	   as in overview.js — hue = (year - 1973) × 310 / 36. */
	for ($y = 1973; $y <= 2009; $y++) {
		$hue = ($y - 1973) * 310 / 36;
		echo "\t\t<span style=\"background:hsl(" . round($hue) . ",50%,50%)\" title=\"" . $y . "\"></span>\n";
	}
?>
	</div>

	<h1>Small Data</h1>
	<p class="baseline">Thirty-seven years of international electroacoustic music competitions</p>

	<div class="intro">
		<p>From 1973 to 2009, Bourges's Institute of Electroacoustic Music held an annual competition that brought together several thousand composers from across the world. Small Data is a visualisation application that makes this history legible: within a single space, it renders visible the entries, the award-winning works, the competition's successive categories and the trajectories of participating countries.</p>

		<p>The project starts from a simple observation: the data documenting this activity is neither large nor complex — a few thousand records. Its interest lies in its historical density rather than its volume. The approach is one of exploratory programming: the visualisations are not final renderings but reading instruments, built in the course of analysing the collection.</p>
	</div>

	<h2>Overview in motion</h2>
	<div class="video">
		<iframe src="https://player.vimeo.com/video/237232737?title=0&amp;byline=0&amp;portrait=0" allowfullscreen title="Small Data — video presentation"></iframe>
	</div>
	<p class="caption">A short walkthrough of the application and its visualisations.</p>

	<h2>Explore</h2>

	<ul class="rubriques">
		<li>
			<a target="_blank" rel="noopener" href="<?php echo $app ?>index.php">Overview</a>
			<span>Each square stands for one entry in the competition; its hue indicates the year of the edition. Clicking selects a composer and lists their works. Search by name, filter by number of records.</span>
		</li>
		<li>
			<a target="_blank" rel="noopener" href="<?php echo $app ?>network.php">Network</a>
			<span>A multi-agent system computes and displays navigation traces through the corpus, revealing proximities between composers and editions.</span>
		</li>
		<li>
			<a target="_blank" rel="noopener" href="<?php echo $app ?>animated_data.php">Line Charts</a>
			<span>How the number of participants evolved by country and by year. Any country can be isolated to follow its own curve.</span>
		</li>
		<li>
			<a target="_blank" rel="noopener" href="<?php echo $app ?>categories.php">Categories</a>
			<span>A flow diagram retracing how the competition's categories appeared, merged and disappeared across the editions.</span>
		</li>
		<li class="catalogue">
			<a target="_blank" rel="noopener" href="<?php echo $app ?>award-winning_works.php">Award-Winning Works</a>
			<span>The complete table of award-winning works, with composer, duration, year and award category.</span>
		</li>
		<li class="catalogue">
			<a target="_blank" rel="noopener" href="<?php echo $app ?>catalog.php?id=1">International Sound Archives</a>
			<span>Catalogue of the international sound collection assembled by the institute.</span>
		</li>
		<li class="catalogue">
			<a target="_blank" rel="noopener" href="<?php echo $app ?>catalog.php?id=2">IMEB Sound Archives</a>
			<span>Catalogue of the institute's own sound archives.</span>
		</li>
		<li class="catalogue">
			<a target="_blank" rel="noopener" href="<?php echo $app ?>euphonies.php">Euphonies d'Or</a>
			<span>The Euphonies d'Or roll of honour, with the persistent identifiers linking works to their records at the National Library of France.</span>
		</li>
	</ul>

	<h2>Publications</h2>

	<p class="pub">Florent Di Bartolo, <em>Visualising the Multimedia Archives of Bourges's Institute of Electroacoustic Music</em>, EVA London 2017 — Electronic Visualisation and the Arts, London, 2017.</p>

	<p class="pub">Florent Di Bartolo, <em>Retracing the story of Bourges's Institute of Electroacoustic Music through exploratory programming and live visualizations</em>, ISEA2017 — 23rd International Symposium on Electronic Art, Manizales, 2017.</p>

	<h2>Source code</h2>
	<ul class="plain">
		<li><a href="https://github.com/fdiba/smallData" target="_blank" rel="noopener">github.com/fdiba/smallData</a></li>
	</ul>

	<footer>
		<p>The IMEB archives were donated to the National Library of France between 2005 and 2011. Application designed and developed by Florent Di Bartolo, Université Gustave Eiffel.</p>
		<?php include_once($_SERVER["DOCUMENT_ROOT"] . "/footer.php") ?>
	</footer>

</div>
</body>
</html>
