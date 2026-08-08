var COLORS=["#ecf0f1", "#2c3e50", "#1abc9c", "#16a085"];
//grey: clouds, grey: midnight blue, vert:turquoise, green sea:dark green

/* =========================================================================
   PALETTES DE VISUALISATION — 2026-08-08

   Elles vivent ici, et non dans linechart.js, parce que DEUX vues dessinent
   maintenant les memes pays : le line chart et la matrice. Un pays isole dans
   l'une doit garder sa couleur dans l'autre, sinon commuter de vue revient a
   rebattre les cartes — et la couleur cesse de designer le pays pour ne plus
   designer que le rang du clic.

   L'ORDRE EST LE CONTENU. Ces listes ne sont pas des sacs de couleurs : la
   n-ieme couleur attribuee est la n-ieme de la liste, donc ce sont les
   couleurs VOISINES qui se retrouvent cote a cote a l'ecran, et ce sont
   elles qui doivent se distinguer.

   ⚠️ L'ORDRE PRECEDENT ETAIT FAUTIF, et d'un defaut mesurable. Il ouvrait
      par turquoise, bleu, amethyste, carotte, ALIZARINE — c'est-a-dire
      carotte (#e67e22) et alizarine (#e74c3c) en slots 4 et 5, donc
      systematiquement voisins des que cinq pays etaient isoles. Ecart
      OKLab entre ces deux-la : 10,8 en vision normale (plancher 15) et 6,9
      en simulation deuteranope (cible 8). Deux pays cote a cote qu'un
      lecteur a vision normale ne separait deja pas.

      AUCUNE COULEUR N'A ETE AJOUTEE NI RETIREE : ce sont les douze memes
      valeurs, reordonnees pour eloigner les paires trop proches. Le pire
      voisinage passe a 26,8 (normal) et 10,8 (deuteranope) — les deux
      controles passent. Verifie avec le validateur de la methode dataviz
      (six controles calcules, dont la simulation Machado-Oliveira-Fernandes
      2009), sur le fond sombre de la page (#2c3e50), et non a l'oeil.

   ⚠️ DEUX CONTROLES NE PASSENT TOUJOURS PAS, ET C'EST ASSUME. Trois teintes
      (turquoise, emeraude, carotte) sortent par le haut de la bande de clarte
      recommandee, et six descendent sous 3:1 contre le fond. Ce sont les
      couleurs Flat UI du site, presentes sur les sept pages depuis l'origine :
      les redresser ferait de cette page la seule a ne plus ressembler aux
      autres. La regle de compensation est tenue en revanche — une couleur ne
      porte JAMAIS seule une identite : tout pays colorie a son nom ecrit a
      cote, dans la gouttiere de la matrice ou dans la legende du line chart.

   Toute reecriture de ces listes doit repasser le validateur AVANT d'etre
   versee : une palette se degrade silencieusement, personne ne signale un
   rouge qu'il confond avec un orange, il croit lire un seul pays.
   ========================================================================= */

/* Isolement par la legende / le menu : douze pays maximum coloriés a la fois.
   Au-dela, la couleur ne designe plus rien — voir VIZ_CAT_MAX. */
var VIZ_CAT = ["#1abc9c", "#9b59b6", "#2ecc71", "#d35400", "#16a085", "#e74c3c",
               "#3498db", "#e67e22", "#2980b9", "#c0392b", "#27ae60", "#8e44ad"];

/* Empilement du diagramme de flux (bandeau des totaux) : PLAFOND A HUIT.
   Une huitieme bande est deja une bande de trop a lire ; la neuvieme ne
   serait plus une couleur choisie mais une couleur engendree, et le
   bandeau cesserait de se lire. Au-dela, le reste part dans le gris
   « autres pays » — ce qui est une information, pas un renoncement. */
var VIZ_CAT_MAX = 8;

/* Lignes selectionnees au CLIC. Meme famille, SANS bleu : une ligne non
   selectionnee est deja bleue, une ligne cliquee doit s'en detacher.
   Meme reordonnancement, memes dix valeurs qu'avant. */
var VIZ_CLICK = ["#1abc9c", "#e74c3c", "#16a085", "#d35400", "#2ecc71",
                 "#8e44ad", "#e67e22", "#9b59b6", "#27ae60", "#c0392b"];

/* Rampe SEQUENTIELLE de la matrice : une seule teinte, du sombre au clair.
   Une magnitude se code par la clarte, jamais par la teinte — un arc-en-ciel
   invente des seuils la ou les donnees n'en ont pas.

   Teinte turquoise et non bleue : le fond de la page (#2c3e50) EST un bleu
   sombre, une rampe bleue s'y noierait par le bas. Le premier echelon tient
   2,20:1 contre ce fond, donc « un seul participant » reste visible — c'est
   le cas le plus frequent de la matrice et le plus facile a perdre.
   Ecarts de clarte >= 0,06 entre echelons consecutifs, teinte constante a
   3 degres pres : les quatre controles ordinaux passent. */
var VIZ_SEQ = ["#1a7d70", "#22a692", "#2bbfa8", "#5ad4bf", "#93e5d5", "#ccf4ec"];

/* LES DEUX PARTS DU DIAGRAMME EN BARRES — 2026-08-08.

   Une barre = un pays a une edition, et elle se lit en deux : combien de
   candidats, et combien d'entre eux ont une oeuvre au fonds. Les deux
   couleurs ne sont pas choisies pour elles-memes, elles REPRENNENT le
   vocabulaire deja en place sur la page :

     - l'EMERAUDE dit depuis toujours « a une oeuvre archivee » — c'est le
       liseré de `#composers li.active` et de `.demo-active` dans
       css/animated_data.css ;
     - le BLEU est la couleur d'une ligne de pays dans le line chart, donc
       « des participants d'un pays » ; la hauteur totale de la barre dit
       exactement ce que disait la hauteur du point.

   Le couple passe tous les controles calcules sur le fond de la page :
   ecart OKLab 24,5 en vision normale, 22,8 en simulation deuteranope, et
   les deux tiennent 3:1 contre le fond. (Meme reserve que ci-dessus sur la
   bande de clarte, pour la meme raison : ce sont les couleurs du site.) */
var VIZ_WORKS    = "#2ecc71";   // la part qui a une oeuvre au fonds
var VIZ_ENTRANTS = "#3498db";   // la part qui n'a qu'une candidature

/* ------------------------------------------------------------------------
   UNE COULEUR SUIT LE PAYS, PAS SON RANG — 2026-08-08, second lot.

   ⚠️ SIGNALE A L'USAGE : « c'est normal que la couleur des pays deja
      selectionnes change quand j'en selectionne un autre ? » Non. C'etait le
      defaut, et il etait dans les deux vues depuis l'origine du menu
      d'isolement.

   La couleur se deduisait du RANG du pays parmi les pays actifs, rang lui-meme
   calcule en parcourant le tableau des donnees. Isoler un pays situe plus haut
   dans ce tableau decalait donc le rang de tous ceux d'apres, et les
   repeignait. On croyait suivre l'Argentine en vert ; elle passait au violet
   parce qu'on venait d'ajouter l'Allemagne.

   C'est la faute la plus grave qu'une palette categorielle puisse commettre :
   *la couleur cesse de designer une chose pour designer une position*, et tout
   ce qu'on avait retenu de la figure devient faux d'un clic.

   Chaque pays isole reçoit donc un RANG DE PALETTE qu'il GARDE tant qu'il est
   isole. Le rang libere par un pays relache est repris par le suivant — le
   plus petit rang libre, pour rester au debut de la palette et ne pas
   consommer des couleurs de plus en plus proches les unes des autres.
   ------------------------------------------------------------------------ */
function vizTakeSlot(slots){
    var pris={}, k;
    for(k in slots){ if(Object.prototype.hasOwnProperty.call(slots, k)) pris[slots[k]]=true; }
    var s=0;
    while(pris[s]) s++;
    return s;
}

/* Le JAUNE reste hors de toutes les palettes ci-dessus : il ne designe pas un
   pays, il designe le SURVOL et le point selectionne. Une couleur qui veut
   dire deux choses n'en dit plus aucune. */
var VIZ_HILITE = "#f1c40f";
var VIZ_SURFACE = "#2c3e50";
