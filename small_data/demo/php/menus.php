<?php
/* Menus de navigation communs aux 7 pages de Small Data.
   La page courante recoit la classe "here", stylee dans main.css.
   ("here" et non "active" : cette derniere est deja utilisee par
   animated_data.js pour la liste des compositeurs.) */

$page  = basename($_SERVER['PHP_SELF']);

/* Page d'accueil du projet, relative aux pages de l'application.
   '../' si l'application est dans small_data/demo/
   './'  si elle est directement dans small_data/ */
$home  = '../';
$catId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

function nav_item($href, $label, $isHere) {
    return '<li><a href="' . $href . '"' . ($isHere ? ' class="here"' : '') . '>'
         . $label . '</a></li>';
}

echo '<ul id="links">'
   . nav_item('index.php',         'Overview',      $page === 'index.php')
   /* « Participation » et non plus « Line Charts » — 2026-08-08. La page ne
      porte plus une seule visualisation mais TROIS (matrice, line chart,
      diagramme en barres) : la nommer d'apres l'une d'elles annoncait au
      lecteur la forme du dessin plutot que son sujet, et cessait d'etre vrai
      des qu'on commutait. Elle est aussi remontee AVANT Network : elle
      compte qui s'est presente au concours, ce dont tout le reste decoule,
      et le graphe des collaborations se lit apres. */
   . nav_item('animated_data.php', 'Participation', $page === 'animated_data.php')
   . nav_item('categories.php',    'Categories',    $page === 'categories.php')
   . nav_item('network.php',       'Network',       $page === 'network.php')
   . '</ul>'
   . '<ul id="listings">'
   . nav_item('award-winning_works.php', 'Award-Winning Works',          $page === 'award-winning_works.php')
   . nav_item('catalog.php?id=1',        'International Sound Archives', $page === 'catalog.php' && $catId === 1)
   . nav_item('catalog.php?id=2',        'IMEB Sound Archives',          $page === 'catalog.php' && $catId === 2)
   . nav_item('euphonies.php',           "Euphonies d'Or",               $page === 'euphonies.php')
   . '</ul>'
   . '<ul id="help">'
   . nav_item($home,       'The Project', false)
   . '</ul>';
