<?php

$page  = basename($_SERVER['PHP_SELF']);

$home  = '../';
$catId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

function nav_item($href, $label, $isHere) {
    return '<li><a href="' . $href . '"' . ($isHere ? ' class="here"' : '') . '>'
         . $label . '</a></li>';
}

echo '<ul id="links">'
   . nav_item('index.php',         'Overview',      $page === 'index.php')

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
