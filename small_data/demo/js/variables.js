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

   L'ORDRE PRECEDENT ETAIT FAUTIF, et d'un defaut mesurable. Il ouvrait
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

   DEUX CONTROLES NE PASSENT TOUJOURS PAS, ET C'EST ASSUME. Trois teintes
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

   SIGNALE A L'USAGE : « c'est normal que la couleur des pays deja
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

/* ------------------------------------------------------------------------
   LA RAMPE DES ANNEES (grille de l'Overview) — 2026-08-08.

   ELLE REMPLACE UN ARC-EN-CIEL, et l'arc-en-ciel etait faux de trois
      facons, mesurees et non jugees a l'oeil. L'annee etait codee par la
      TEINTE : `hue = (annee-1973) x 310/36`, de 0° a 310°.

      1. LA TEINTE EST UN CANAL CATEGORIEL. L'oeil y lit des changements de
         NATURE, pas de DEGRE : rien ne dit que le vert vient apres le rouge.
         Mesure sur sept editions : la clarte valait 0,552 / 0,745 / 0,722 /
         0,721 / 0,603 / 0,489 / 0,587 de 1973 a 2009 — non monotone, donc
         l'ordre des annees n'etait pas lisible du tout.
      2. DES ANNEES INDISCERNABLES. 1985 et 1991 avaient exactement la meme
         clarte (ecart 0,000) et un ecart OKLab de 8,1 en vision normale
         (plancher 15). En simulation protanope, 1979 et 1985 tombaient a 2,0
         — la meme couleur.
      3. LE VIOLET DE 2003 TENAIT 1,60:1 contre le fond de la page, a la
         limite du visible.

   La rampe est donc SEQUENTIELLE : la clarte croit strictement avec l'annee
   (0,576 -> 0,906 en OKLab, ecarts >= 0,066), et c'est elle qui porte l'ordre.
   La teinte se deplace en meme temps, ce qui garde une grille COLOREE sans que
   la couleur ait a porter l'ordre toute seule. C'est le principe des rampes
   type viridis, et non celui d'un arc-en-ciel HSL : la difference tient tout
   entiere dans la monotonie de la clarte.

   ELLE RESTE DANS LE REGISTRE DU SITE. Elle va du VERT-MER (#16a085,
      greensea) au BLEU (#3498db, peter river) puis a l'AMETHYSTE (#9b59b6) :
      trois couleurs de la palette Flat UI du site, dans cet ordre. Aucune
      teinte chaude — c'est ce qui la separe du jaune reserve (voir plus bas).

   Contraste sur le fond : 2,64:1 pour 1973 (le plus sombre reste visible,
   c'est le plancher qui compte) jusqu'a 8,21:1 pour 2009.

   AUCUN ENCODAGE SECONDAIRE N'EST REQUIS, ET C'EST CE QUI LA DISTINGUE DES
      DEUX RAMPES ESSAYEES AVANT ELLE. Son ecart minimal au JAUNE #f1c40f, qui
      designe la selection partout sur le site, est de 21,0 — au-dessus du
      plancher de 15. La rampe amethyste -> carotte essayee le meme jour
      tombait a 13,0 et ne tenait QUE par un carre de selection dessine en
      retrait ; ce retrait a ete retire avec elle. *Une compensation dont la
      cause a disparu est une regle que plus personne ne saura expliquer.*
      L'ecart minimal a l'EMERAUDE (« a une oeuvre au fonds ») est de 19,0.

   ET UNE DETTE, ECRITE PLUTOT QUE TUE : l'ANCRE #7f8c8d (asbestos) n'est
      qu'a 8,4 de l'echelon 1980 et a 9,8 de l'echelon 1973, sous le plancher
      de 15. La rampe traverse toute la moitie froide du cercle, ou vivent
      aussi les gris du site : AUCUN gris de la palette ne s'en ecarte de 15
      (mesures : #95a5a6 -> 7,9 ; #909497 -> 9,4 ; #5d6d7e -> 10,3 mais 2,07:1
      de contraste, c'est-a-dire invisible). On garde donc le gris du site et
      l'on s'appuie sur la POSITION : l'ancre OUVRE la trainee, elle ne se lit
      jamais isolement. Meme arbitrage qu'au §18.7, a un ecart plus serre.

   Le seul controle ordinal qu'elle ne passe pas est « teinte unique », et
      c'est par construction — une rampe multi-teintes n'en est pas une. Les
      trois autres (monotonie, ecarts de clarte >= 0,066, contraste de la
      borne sombre) passent. Toute reecriture doit les repasser. */
var VIZ_YEAR = ["#288b77", "#339cb1", "#78a5d8", "#b2afe4", "#d6c1e8", "#edd8f1"];

/* Le carre d'ANCRE de chaque compositeur — celui qui ouvre sa trainee.

   IL PORTE DESORMAIS « A-T-IL UNE OEUVRE AU FONDS », qui etait code par la
      LUMINOSITE des carres d'edition, c'est-a-dire sur le canal dont la
      rampe des annees a besoin. Les deux encodages se disputaient le meme
      mark. Et le reglage retenu donnait ceci :

        carre SANS oeuvre archivee : 8,2 a 9,3:1 de contraste
        carre AVEC oeuvre archivee : 1,6 a 4,7:1

      c'est-a-dire que la page dessinait ce qui N'EST PAS LA cinq fois plus
      fort que ce qui y est — l'inverse exact de ce que le reste de
      l'application dit partout ailleurs.

   L'ancre dit QUI, la trainee dit QUAND. Emeraude et ardoise sont le
   vocabulaire deja en place (#composers li.active, les deux parts du
   diagramme en barres) ; ecart entre les deux : 20,7. */
var VIZ_OV_WORKS   = "#2ecc71";   // a au moins une oeuvre au fonds  (5,23:1)
var VIZ_OV_NOWORKS = "#7f8c8d";   // candidature seule               (3,16:1)

/* Le JAUNE reste hors de toutes les palettes ci-dessus : il ne designe pas un
   pays, il designe le SURVOL et le point selectionne. Une couleur qui veut
   dire deux choses n'en dit plus aucune. */
var VIZ_HILITE = "#f1c40f";
var VIZ_SURFACE = "#2c3e50";
