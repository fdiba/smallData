<?php

function asset($rel){
	$abs = __DIR__ . '/../' . $rel;
	$t   = @filemtime($abs);
	return $t ? ($rel . '?v=' . $t) : $rel;
}
