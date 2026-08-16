<?php
function canonique($params = ''){
	$base = 'https://www.webodrome.fr/small_data/demo/';
	$page = basename($_SERVER['SCRIPT_NAME']);
	$url  = $base . $page . $params;
	echo '<link rel="canonical" href="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '">';
}
