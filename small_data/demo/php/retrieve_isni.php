<?php

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=3600');

$raw_in  = isset($_REQUEST['isni']) ? $_REQUEST['isni'] : '';
$refresh = !empty($_REQUEST['refresh']);
$want_raw= !empty($_REQUEST['raw']);

$isni = strtoupper(preg_replace('/[^0-9Xx]/', '', $raw_in));

if(!preg_match('/^[0-9]{15}[0-9X]$/', $isni)){
	echo json_encode(array(
		'status'  => 'invalid',
		'message' => 'ISNI invalide (16 caracteres attendus).',
		'isni'    => $raw_in
	), JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
	exit;
}

$CACHE_TTL = 30 * 24 * 3600;
$TIMEOUT   = 8;
$UA        = 'SmallData-IMEB/1.0 (+https://webodrome.fr/small_data/)';

$CACHE_VERSION = 2;

$cache_dir  = __DIR__ . '/../cache/isni';
$cache_file = $cache_dir . '/' . $isni . '.v' . $CACHE_VERSION . '.json';

if(!$refresh && is_readable($cache_file) && (time() - filemtime($cache_file) < $CACHE_TTL)){
	$hit = file_get_contents($cache_file);
	if($hit !== false && $hit !== ''){

		$pos = strpos($hit, '"cached":false');
		echo ($pos === false) ? $hit : substr_replace($hit, '"cached":true', $pos, 14);
		exit;
	}
}

function sd_http_get($url, $timeout, $ua, $accept = '*/*'){

	if(function_exists('curl_init')){
		$ch = curl_init($url);
		curl_setopt_array($ch, array(
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_FOLLOWLOCATION => true,
			CURLOPT_MAXREDIRS      => 4,
			CURLOPT_CONNECTTIMEOUT => 5,
			CURLOPT_TIMEOUT        => $timeout,
			CURLOPT_USERAGENT      => $ua,
			CURLOPT_HTTPHEADER     => array('Accept: ' . $accept),
			CURLOPT_SSL_VERIFYPEER => true
		));
		$body = curl_exec($ch);
		$code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
		curl_close($ch);
		if($body !== false && $body !== '' && $code >= 200 && $code < 400) return $body;
		return null;
	}

	if(ini_get('allow_url_fopen')){
		$ctx = stream_context_create(array('http' => array(
			'method'  => 'GET',
			'timeout' => $timeout,
			'header'  => "User-Agent: $ua\r\nAccept: $accept\r\n"
		)));
		$body = @file_get_contents($url, false, $ctx);
		if($body !== false && $body !== '') return $body;
	}

	return null;
}

function sd_is_noise_url($url){
	$noise = array('www.w3.org', 'xmlns.com', 'purl.org', 'rdvocab.info',
	               'www.loc.gov/zing', 'schema.org', 'isni.org/ontology',
	               'creativecommons.org', 'www.openlinksw.com');
	foreach($noise as $n){ if(strpos($url, $n) !== false) return true; }
	if(preg_match('#^https?://(www\.)?isni\.org/isni/#i', $url)) return true;
	return false;
}

function sd_label_for_url($url){
	$host = strtolower(parse_url($url, PHP_URL_HOST));
	if(!$host) return 'lien';

	if(preg_match('/^([a-z\-]+)\.wikipedia\.org$/', $host, $w)) return 'Wikipedia (' . $w[1] . ')';
	$map = array(
		'brahms.ircam.fr'    => 'Ircam — Brahms',
		'discogs.com'        => 'Discogs',
		'musicbrainz.org'    => 'MusicBrainz',
		'viaf.org'           => 'VIAF',
		'wikidata.org'       => 'Wikidata',
		'wikipedia.org'      => 'Wikipedia',
		'data.bnf.fr'        => 'data.bnf.fr',
		'catalogue.bnf.fr'   => 'Catalogue BnF',
		'd-nb.info'          => 'GND (DNB)',
		'id.loc.gov'         => 'Library of Congress',
		'worldcat.org'       => 'WorldCat',
		'imslp.org'          => 'IMSLP',
		'allmusic.com'       => 'AllMusic',
		'last.fm'            => 'Last.fm',
		'imdb.com'           => 'IMDb',
		'bandcamp.com'       => 'Bandcamp',
		'soundcloud.com'     => 'SoundCloud',
		'youtube.com'        => 'YouTube',
		'orcid.org'          => 'ORCID',
		'idref.fr'           => 'IdRef',
		'ircam.fr'           => 'Ircam',
		'isni.oclc.org'      => 'ISNI (base OCLC)'
	);
	foreach($map as $needle => $label){
		if($host === $needle || substr($host, -(strlen($needle) + 1)) === '.' . $needle) return $label;
	}
	return preg_replace('/^www\./', '', $host);
}

function sd_known_labels(){
	return array('Discogs','MusicBrainz','Wikidata','Wikipedia (fr)','Wikipedia (en)',
	             'VIAF','data.bnf.fr','Catalogue BnF','GND (DNB)','Library of Congress',
	             'IdRef','IMSLP','AllMusic','Bandcamp','SoundCloud','Site officiel',
	             'Ircam — Brahms','Ircam','ORCID','WorldCat','IMDb','Last.fm');
}
function sd_label_rank($label){
	$i = array_search($label, sd_known_labels(), true);
	if($i !== false) return $i;

	if(strpos($label, 'Wikipedia') === 0) return 50;
	return 99;
}

function sd_url_key($url){
	$u = strtolower($url);
	if(preg_match('#discogs\.com/(?:[a-z]{2}/)?artist/(\d+)#',   $u, $m)) return 'discogs:'  . $m[1];
	if(preg_match('#discogs\.com/(?:[a-z]{2}/)?label/(\d+)#',    $u, $m)) return 'discogsl:' . $m[1];
	if(preg_match('#wikidata\.org/(?:wiki|entity)/(q\d+)#',      $u, $m)) return 'wikidata:' . $m[1];
	if(preg_match('#musicbrainz\.org/artist/([0-9a-f\-]{8,})#',  $u, $m)) return 'mb:'       . $m[1];
	if(preg_match('#viaf\.org/viaf/(\d+)#',                      $u, $m)) return 'viaf:'     . $m[1];
	if(preg_match('#d-nb\.info/gnd/([0-9x\-]+)#',                $u, $m)) return 'gnd:'      . $m[1];
	if(preg_match('#([a-z\-]+)\.wikipedia\.org/wiki/(.+)$#',     $u, $m)) return 'wp:' . $m[1] . ':' . rawurldecode($m[2]);
	$u = preg_replace('#^http://#', 'https://', $u);
	return rtrim($u, '/');
}

function sd_push_link(&$list, $url, $label = null){

	$url = trim(html_entity_decode($url, ENT_QUOTES, 'UTF-8'));
	if($url === '' || !preg_match('#^https?://#i', $url)) return;
	if(sd_is_noise_url($url)) return;

	$url   = rtrim($url, ".,;:)]}'\"");
	$label = $label ? $label : sd_label_for_url($url);
	$key   = sd_url_key($url);

	foreach($list as $i => $l){
		if($l['key'] !== $key) continue;
		if(sd_label_rank($label) < sd_label_rank($l['label'])) $list[$i]['label'] = $label;
		if(strlen($url) > strlen($l['url']))                   $list[$i]['url']   = $url;
		return;
	}

	$list[] = array('label' => $label, 'url' => $url, 'key' => $key);
}

function sd_harvest_urls($text, &$list){
	if(!$text) return;
	if(preg_match_all('#https?://[^\s"\'<>\\\\]+#i', $text, $m)){
		foreach($m[0] as $u) sd_push_link($list, html_entity_decode($u, ENT_QUOTES, 'UTF-8'));
	}
}

function sd_source_url($code, $id){
	$code = strtoupper(trim($code));
	$id   = trim($id);
	if($id === '') return null;
	switch($code){
		case 'VIAF':                 return 'https://viaf.org/viaf/' . rawurlencode($id);
		case 'WKP': case 'WKD':
			return preg_match('/^Q\d+$/', $id) ? 'https://www.wikidata.org/wiki/' . $id : null;
		case 'DNB':  case 'GND':     return 'https://d-nb.info/gnd/' . rawurlencode($id);
		case 'LC':   case 'LCNACO':  return 'https://id.loc.gov/authorities/names/' . rawurlencode($id);
		case 'BNF':
			if(preg_match('/(cb\d{8,9}[0-9a-z]?)/i', $id, $mm))
				return 'https://catalogue.bnf.fr/ark:/12148/' . strtolower($mm[1]);
			return null;
		case 'SUDOC': case 'IDREF':  return 'https://www.idref.fr/' . rawurlencode($id);
		case 'MBL':   case 'MUSICBRAINZ':
			return 'https://musicbrainz.org/artist/' . rawurlencode($id);
		default:                     return null;
	}
}

function sd_clean_title($s){
	$s = str_replace(array("\xc2\xa0", "\xe2\x80\x8b"), ' ', (string)$s);
	$s = str_replace('@', '', $s);
	$s = preg_replace('/\s+/u', ' ', $s);

	$s = preg_replace('/(\p{L}[\'’])\s+(?=\p{L})/u', '$1', $s);
	return trim($s);
}

function sd_title_key($s){
	$s = mb_strtolower($s, 'UTF-8');
	if(function_exists('iconv')){
		$t = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
		if($t !== false && $t !== '') $s = $t;
	}
	return preg_replace('/[^a-z0-9]+/', '', strtolower($s));
}

function sd_push_title(&$list, &$keys, $raw){
	$v = sd_clean_title($raw);
	if($v === '') return;
	$k = sd_title_key($v);
	if($k === '') return;
	if(!isset($keys[$k])){
		$keys[$k] = count($list);
		$list[]   = $v;
	} else if(mb_strlen($v, 'UTF-8') > mb_strlen($list[$keys[$k]], 'UTF-8')){
		$list[$keys[$k]] = $v;
	}
}

$sru_body = null;
$sru_urls = array(
	'https://isni.oclc.org/sru/DB=1.2/?operation=searchRetrieve&recordSchema=isni-b&query=pica.isn+%3D+%22' . $isni . '%22',
	'https://isni.oclc.org/sru/?operation=searchRetrieve&recordSchema=isni-b&query=pica.isn+%3D+%22' . $isni . '%22'
);
foreach($sru_urls as $u){
	$sru_body = sd_http_get($u, $TIMEOUT, $UA, 'application/xml,text/xml');
	if($sru_body && strpos($sru_body, 'responseRecord') !== false) break;
	$sru_body = null;
}

$names    = array();
$titles   = array();
$titleKeys= array();
$sources  = array();
$notes    = array();
$external = array();
$warnings = array();

if($sru_body){

	$prev = libxml_use_internal_errors(true);
	$doc  = new DOMDocument();
	$ok   = $doc->loadXML($sru_body);
	libxml_clear_errors();
	libxml_use_internal_errors($prev);

	if($ok){
		$xp = new DOMXPath($doc);

		foreach($xp->query('//*[local-name()="personalName"]') as $n){
			$get = function($tag) use ($xp, $n){
				$r = $xp->query('.//*[local-name()="' . $tag . '"]', $n);
				return $r->length ? trim($r->item(0)->textContent) : '';
			};
			$fore = $get('forename');
			$sur  = $get('surname');
			$date = $get('marcDate');
			if($date === '') $date = $get('dates');
			if($fore === '' && $sur === '') continue;
			$key = $fore . '|' . $sur . '|' . $date;
			$names[$key] = array('forename' => $fore, 'surname' => $sur, 'dates' => $date);
		}

		foreach($xp->query('//*[local-name()="organisationName"]') as $n){
			$r = $xp->query('.//*[local-name()="mainName"]', $n);
			if($r->length){
				$main = trim($r->item(0)->textContent);
				if($main !== '') $names['org|' . $main] = array('forename' => '', 'surname' => $main, 'dates' => '');
			}
		}

		foreach($xp->query('//*[local-name()="titleOfWork"]/*[local-name()="title"]') as $t){
			sd_push_title($titles, $titleKeys, $t->textContent);
		}

		foreach($xp->query('//*[local-name()="sources"]') as $s){
			$g = function($tag) use ($xp, $s){
				$r = $xp->query('.//*[local-name()="' . $tag . '"]', $s);
				return $r->length ? trim($r->item(0)->textContent) : '';
			};
			$code = $g('codeOfSource');
			$sid  = $g('sourceIdentifier');
			if($code === '' && $sid === '') continue;
			$url  = sd_source_url($code, $sid);

			foreach($xp->query('.//*[local-name()="reference"]', $s) as $r){
				$txt = trim($r->textContent);
				if(preg_match('#^https?://#i', $txt)){ $url = $txt; break; }
			}
			$k = $code . '|' . $sid;
			$sources[$k] = array('code' => $code, 'id' => $sid, 'url' => $url);
			if($url) sd_push_link($external, $url);
		}

		foreach($xp->query('//*[contains(translate(local-name(),"NOTE","note"),"note")]') as $n){
			$v = trim(preg_replace('/\s+/u', ' ', $n->textContent));
			if($v !== '' && strlen($v) < 600 && !in_array($v, $notes, true)) $notes[] = $v;
		}

		foreach($xp->query('//*[local-name()="URI" or local-name()="uri" or local-name()="isniURI"]') as $n){
			sd_push_link($external, trim($n->textContent));
		}
	} else {
		$warnings[] = 'Reponse SRU illisible (XML invalide).';
	}

	sd_harvest_urls($sru_body, $external);

} else {
	$warnings[] = "L'API SRU d'ISNI n'a pas repondu.";
}

$jsonld_body = sd_http_get('https://isni.org/isni/' . $isni . '/about.jsonld',
                            $TIMEOUT, $UA, 'application/ld+json,application/json');
if($jsonld_body){
	sd_harvest_urls($jsonld_body, $external);
} else {
	$warnings[] = "La notice JSON-LD d'isni.org n'a pas repondu.";
}

$isni_spaced = trim(chunk_split($isni, 4, ' '));

$sparql =
 'SELECT ?item ?itemLabel ?itemDescription ?discogs ?mbid ?viaf ?bnf ?gnd ?site ?frwiki ?enwiki WHERE {' .
 ' VALUES ?code { "' . $isni_spaced . '" "' . $isni . '" }' .
 ' ?item wdt:P213 ?code .' .
 ' OPTIONAL { ?item wdt:P1953 ?discogs . }' .
 ' OPTIONAL { ?item wdt:P434  ?mbid . }' .
 ' OPTIONAL { ?item wdt:P214  ?viaf . }' .
 ' OPTIONAL { ?item wdt:P268  ?bnf . }' .
 ' OPTIONAL { ?item wdt:P227  ?gnd . }' .
 ' OPTIONAL { ?item wdt:P856  ?site . }' .
 ' OPTIONAL { ?frwiki schema:about ?item ; schema:isPartOf <https://fr.wikipedia.org/> . }' .
 ' OPTIONAL { ?enwiki schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }' .
 ' SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }' .
 '} LIMIT 5';

$wd_body = sd_http_get('https://query.wikidata.org/sparql?format=json&query=' . rawurlencode($sparql),
                        $TIMEOUT, $UA, 'application/sparql-results+json');

$wikidata = null;
if($wd_body){
	$wd = json_decode($wd_body, true);
	if(isset($wd['results']['bindings'][0])){
		$b = $wd['results']['bindings'][0];
		$v = function($k) use ($b){ return isset($b[$k]['value']) ? $b[$k]['value'] : null; };

		$wikidata = array(
			'item'        => $v('item'),
			'label'       => $v('itemLabel'),
			'description' => $v('itemDescription')
		);
		if($v('item'))    sd_push_link($external, $v('item'), 'Wikidata');
		if($v('discogs')) sd_push_link($external, 'https://www.discogs.com/artist/' . $v('discogs'), 'Discogs');
		if($v('mbid'))    sd_push_link($external, 'https://musicbrainz.org/artist/' . $v('mbid'), 'MusicBrainz');
		if($v('viaf'))    sd_push_link($external, 'https://viaf.org/viaf/' . $v('viaf'), 'VIAF');
		if($v('bnf'))     sd_push_link($external, 'https://catalogue.bnf.fr/ark:/12148/cb' . $v('bnf'), 'Catalogue BnF');
		if($v('gnd'))     sd_push_link($external, 'https://d-nb.info/gnd/' . $v('gnd'), 'GND (DNB)');
		if($v('site'))    sd_push_link($external, $v('site'), 'Site officiel');
		if($v('frwiki'))  sd_push_link($external, $v('frwiki'), 'Wikipedia (fr)');
		if($v('enwiki'))  sd_push_link($external, $v('enwiki'), 'Wikipedia (en)');
	}
} else {
	$warnings[] = "Wikidata n'a pas repondu.";
}

$oclc = 'https://isni.oclc.org/cbs/DB=1.2//CMD?ACT=SRCH&IKT=8006&TRM=ISN%3A' . $isni
      . '&TERMS_OF_USE_AGREED=Y&terms_of_use_agree=send';

usort($external, function($a, $b){
	$ia = sd_label_rank($a['label']);
	$ib = sd_label_rank($b['label']);
	if($ia !== $ib) return $ia - $ib;
	return strcasecmp($a['label'], $b['label']);
});

foreach($external as $i => $l) unset($external[$i]['key']);
$external = array_values($external);

$out = array(
	'cached'    => false,
	'status'    => (count($names) || count($external) || count($notes)) ? 'ok' : 'empty',
	'isni'      => $isni,
	'formatted' => $isni_spaced,
	'links'     => array(
		'isni_org'  => 'https://isni.org/isni/' . $isni,
		'isni_oclc' => $oclc
	),
	'names'     => array_values($names),
	'titles'    => array_slice($titles, 0, 12),
	'titlesMore'=> max(0, count($titles) - 12),
	'sources'   => array_values($sources),
	'notes'     => $notes,
	'external'  => $external,
	'wikidata'  => $wikidata,
	'warnings'  => $warnings
);

if($want_raw){
	$out['raw'] = array(
		'sru'    => $sru_body    ? substr($sru_body, 0, 20000)    : null,
		'jsonld' => $jsonld_body ? substr($jsonld_body, 0, 20000) : null,
		'wd'     => $wd_body     ? substr($wd_body, 0, 20000)     : null
	);
}

$json = json_encode($out, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);

if(!$want_raw && $out['status'] === 'ok'){
	if(!is_dir($cache_dir)) @mkdir($cache_dir, 0775, true);
	if(is_dir($cache_dir) && is_writable($cache_dir)) @file_put_contents($cache_file, $json, LOCK_EX);
}

echo $json;
