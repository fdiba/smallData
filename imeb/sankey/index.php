<?php
/* =========================================================================
   ANCIEN PROTOTYPE — REDIRECTION PERMANENTE.

   Cette page dessinait, depuis 2016, un diagramme de Sankey a deux colonnes :
   annee -> categorie. Elle refaisait pour cela sa propre requete, chargeait
   son propre d3 depuis un CDN et portait son propre algorithme d'identite des
   noeuds — par recherche de sous-chaine, donc juste seulement tant que
   l'ordre des enregistrements ne changeait pas.

   Le meme diagramme est desormais un ETAT de small_data/demo/categories.php,
   accessible par le commutateur « diagram » de la barre de controle, et c'est
   d'ailleurs sur cette vue allegee que la page s'ouvre. Entretenir deux pages
   pour une seule donnee n'avait plus d'objet.

   La redirection est permanente (301) et non temporaire : l'adresse ne
   reviendra pas. Les liens existants — y compris la note 24 de PU019, qui
   cite deja .../small_data/demo/categories.php et non ce dossier — restent
   donc valides.

   Les autres fichiers du dossier ont ete deplaces dans _to_delete/ ;
   ce fichier est le seul qui doive rester en ligne.
   ========================================================================= */

header('Location: /small_data/demo/categories.php', true, 301);
exit;
