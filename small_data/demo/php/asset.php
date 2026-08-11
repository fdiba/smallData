<?php
/* asset.php — L'ADRESSE D'UN FICHIER STATIQUE, DATEE DE SA DERNIERE ECRITURE
   ---------------------------------------------------------------------------
   ⚠️ POURQUOI CE FICHIER EXISTE : le 2026-08-11, une regle de css/main.css a
   ete corrigee, deployee, verifiee sur le disque — et elle ne se voyait pas.
   Le fichier etait juste ; le navigateur servait celui d'avant. Les <link> et
   les <script> du site portaient une adresse SANS VERSION, donc immuable :
   rien n'obligeait le cache a redemander quoi que ce soit, et toute correction
   de feuille de style ou de script restait invisible jusqu'a ce qu'un lecteur
   pense a vider son cache. *Un correctif qu'il faut savoir demander n'est pas
   deploye, il est disponible.*

   LA VERSION EST LA DATE D'ECRITURE DU FICHIER, PAS UN NUMERO A LA MAIN.
   Un numero se bump ou s'oublie, et c'est toujours au mauvais moment : c'est
   la meme faute que « un fichier de correction qui ne corrige pas sa source »
   (§20.13 du chantier). `filemtime()` change EXACTEMENT quand le fichier
   change, et jamais autrement — l'adresse est donc stable tant que le contenu
   l'est, ce qui laisse le cache faire son travail le reste du temps.

   USAGE, une ligne par ressource :

       <link rel="stylesheet" type="text/css" href="<?php echo asset('css/main.css') ?>">
       <script src="<?php echo asset('js/functions.js') ?>"></script>

   ⚠️ LE CHEMIN EST RELATIF A CE DOSSIER-CI (demo/), comme dans le HTML : la
   page et le disque disent la meme chose, il n'y a rien a traduire. Le fichier
   introuvable rend le chemin NU plutot que de lever une erreur — une page qui
   perd son horodatage doit rester une page, pas une trace d'exception.

   A REPORTER SUR LES SIX AUTRES PAGES (index, network, catalog,
   award-winning_works, euphonies, categories) : elles ont le meme probleme, et
   ce fichier est ecrit pour etre inclus tel quel. */

function asset($rel){
	$abs = __DIR__ . '/../' . $rel;
	$t   = @filemtime($abs);
	return $t ? ($rel . '?v=' . $t) : $rel;
}
