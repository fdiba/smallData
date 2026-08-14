//---- Award-winning Works — logique propre a la page.
//---- L'etat et les fonctions du SMA sont dans js/sma_core.js.
//
//---- Menu "Year" (calque sur le menu Country de catalog) : "All works" par
//---- defaut (SMA sur tout, comme catalog.php?id=2) ; un clic sur une annee
//---- (edition) filtre le tableau ET le SMA. Le SMA ne s'affiche/ne se lance
//---- que si la selection compte au moins SMA_MIN_WORKS oeuvres (sinon tableau
//---- seul + note), comme sur catalog.

var SMA_MIN_WORKS = 20;
var allWorks = [];          // toutes les oeuvres primees chargees (objets)

/* --- HAUTEUR DU CANVAS : PLEINE POUR « ALL WORKS », MOITIE POUR UNE EDITION
   ---------------------------------------------------------------------------
   « All works » pose des centaines d'oeuvres sur le canvas ; une edition en
   pose quelques dizaines. La meme surface les laisse flotter loin les unes des
   autres, et le regroupement — qui est ce que la page donne a voir — se lit
   mal. La hauteur passe donc a la MOITIE des qu'une annee est choisie, et
   revient a la pleine hauteur sur « All works ».

   ECRIRE `canvas.height` REMET LE CONTEXTE 2D A ZERO. Ce n'est pas un
      redimensionnement : le navigateur jette le bitmap, et `fillStyle`,
      `strokeStyle`, les transformations reviennent a leur valeur par defaut.
      D'ou le fond repeint juste apres — sans quoi la premiere image du SMA
      s'affiche sur un canvas transparent.

   ET ELLE SE POSE AVANT `resetAll()`, PAS APRES. Les particules naissent a
      `Math.random()*canvas.height` (js/sma_core.js) : creees pendant que le
      canvas fait encore 800, la moitie d'entre elles naitrait sous le bord du
      nouveau. La grille spatiale, elle, se refait toute seule — `ensureGrid`
      compare ses dimensions a celles du canvas a chaque tour.

   AUCUNE HAUTEUR N'EST ECRITE EN CSS pour `#myCanvas` : c'est l'attribut
      qui fait la taille affichee. Si une regle CSS lui en donne une un jour,
      cette fonction changera la resolution du bitmap SANS changer la mise en
      page, et les clics tomberont a cote (`getBoundingClientRect` dans
      js/sma_core.js).

   ET RIEN D'AUTRE NE DEPEND DE CETTE HAUTEUR. La colonne d'information est
      depuis le 2026-08-10 a cote de TOUTE la pile (canvas + legende +
      tableau) et non du canvas seul : elle ne se cale plus dessus, et le
      canvas peut passer de 800 a 400 sans deplacer quoi que ce soit. */
var SMA_H_FULL = 800;
var SMA_H_YEAR = SMA_H_FULL / 2;

function setCanvasHeight(h){
    var cv = document.getElementById('myCanvas');
    if(!cv) return;
    var px = h * scale;
    if(cv.height === px) return;          //deja a cette taille : ne pas effacer pour rien
    cv.height = px;
    context.fillStyle = COLORS[0];
    context.fillRect(0, 0, cv.width, cv.height);
    context.stroke();
}

window.onload = function() {

    initSMA(1064, SMA_H_FULL);
    startSMA();             // boucle SMA lancee UNE seule fois

    $("#info p:eq(0)").text('loading…');

    $.ajax({ url: 'php/retrieve_works.php', type: "POST" }).done(function(str) {
        allWorks = parseWorks(str);
        buildYearMenu();
        /* L'ETAT INITIAL VIENT DE L'URL, PAS D'UNE CONVENTION — 2026-08-12.
           `?y=1994` ouvre la page sur cette edition. Sans `y`, ou avec un `y`
           que le fonds ne porte pas, on retombe sur « All works » : une adresse
           fausse ne doit pas rendre une page vide, elle doit rendre la page. */
        appliquerAnneeDeLUrl();
    });
};

//------------------------------------------------------------------
// Parsing (12 champs par oeuvre) + libelles rank / sous-categorie
//------------------------------------------------------------------
function parseWorks(str){

    var arr = str.split("%");
    // 12 depuis l'ajout du pays (arr[i+10]) puis de l'ISNI (arr[i+11]) en fin,
    // 15 depuis celui de la distinction en clair (arr[i+12..14])
    // d'enregistrement (php/retrieve_works.php)
    // 12 -> 15 le 2026-08-04 : award_label, award_rank et award_label_2
    // ajoutes EN FIN d'enregistrement par php/retrieve_works.php. Le pas doit
    // suivre, sinon la lecture se decale des la deuxieme oeuvre.
    //
    // 15 -> 16 le 2026-08-07 : les CO-AUTEURS (arr[i+15]). Meme regle —
    // ajoute en FIN d'enregistrement, longueur ecrite en dur des deux cotes,
    // les deux fichiers bougent ensemble.
    //
    // 16 -> 17 le 2026-08-07 : LE NUMERO DE LA MENTION (arr[i+16]),
    // imeb_music.award_ordre. Onze oeuvres du fonds en portent un et aucune
    // ne l'affichait — voir le bloc `rank` ci-dessous.
    //
    // 17 -> 18 le 2026-08-12 : L'EVENEMENT (arr[i+17]), imeb_categorie.evenement.
    // 1993 est la premiere edition du fonds a en porter DEUX : le constat du
    //    8 juin 1993 couvre le 21e Concours International ET le 1er PUY de
    //    Musique electroacoustique. Une seule piece, une seule annee, deux
    //    series de numeros — C et P — et deux palmares. Sans ce champ, les sept
    //    prix du Puy s'affichent melanges aux prix du Concours.
    // 18 -> 19 le 2026-08-13 : LE DEGRE (arr[i+18]). « I », « II » ou
    //    « III », vide avant 1988 — les degres naissent cette annee-la.
    //    Il prend la place que tenait la colonne « sub category », qui
    //    n'existe plus : le concours a des DEGRES et des CATEGORIES, et le
    //    constat de 1990 l'ecrit, une lettre pour le degre et un chiffre
    //    pour la categorie. Ce que la page appelait « sous-categorie » EST
    //    la categorie, et elle tient maintenant la colonne « category ».
    var numOfElements = 19;
    var objects = [];

    for (var i = 0; i < arr.length-(numOfElements-1); i+=numOfElements) {

        /* La distinction, LUE EN CLAIR dans la base depuis le 2026-08-04.

           Ce bloc contenait vingt-trois lignes de traduction — 100 ->
           « Mention », 600 -> « Residence »... Le meme code-book existait une
           seconde fois dans php/retrieve_cat.php, ou il ne traduisait que
           TROIS valeurs : les pages Euphonies et Catalogue affichaient donc
           « 100 » la ou celle-ci affichait « Mention ». Deux copies dont une
           perimee, la panne classique de ce projet.

           Le code-book vit desormais dans imeb_music.award_label /
           award_rank / award_label_2. Ici on ne traduit plus rien : on
           compose ce que la base dit. `award_price` continue de voyager dans
           le flux (arr[i+1]) et sert de repli si le decodage n'a pas ete
           joue sur le serveur — sans quoi la page afficherait du vide. */
        var label = $.trim(arr[i+12] || '');
        var rg    = $.trim(arr[i+13] || '');
        var lab2  = $.trim(arr[i+14] || '');

        /* LE NUMERO DE LA MENTION — arr[i+16], ajoute le 2026-08-07.

           ONZE OEUVRES DU FONDS PORTENT UN NUMERO DE MENTION et aucune ne
           l'affichait : 1981 (Doyle), 1983 (Carl, Weidenaar, Uehara), 1987
           (Schweizer) et 1993 (six). La composition ci-dessus lisait
           `award_rank`, qui est NULL sur TOUTES les mentions du fonds — le
           numero vit dans `award_ordre`, et il n'entrait pas dans le flux.
           Le commentaire de sortAndRender disait deja que ce tri servait
           « les mentions numerotees de 1981, 1983, 1987 et 1993 » : il ne
           servait rien, puisque sa colonne etait vide.

           RANG ET ORDRE RESTENT DEUX CHOSES. Le rang dit qui l'emporte,
              l'ordre dit dans quel ordre c'est proclame (§16.5, §22.8). On
              affiche l'un OU l'autre — jamais les deux, jamais leur somme —
              et le rang passe devant quand les deux existent, ce qui
              n'arrive sur aucune ligne du fonds aujourd'hui. */
        var ord = $.trim(arr[i+16] || '');
        var num = rg || ord;

        var rank;
        if(label){
            rank = num ? (label + ' ' + num) : label;
            if(lab2) rank += ' et ' + lab2;
        } else {
            rank = arr[i+1];          // base non migree : on montre le code brut
        }

        // LA CATEGORIE ARRIVE EN CLAIR — 2026-08-13.
        //
        // Ce champ portait `imeb_music.award_cat_2`, un code entier de 1 a 12,
        // et il etait traduit ICI par une table qui existait en TROIS
        // exemplaires — ici, dans php/retrieve_cat.php (set_sub_cat) et dans
        // php/sous_categories.php. Les trois portaient la note « les deux
        // doivent rester synchronisees », qui est l'aveu du probleme et non sa
        // solution.
        //
        // IL N'Y A PAS DE SOUS-CATEGORIE DANS LE CONCOURS : il y a des DEGRES
        // et des CATEGORIES — le constat de 1990 l'ecrit, une LETTRE pour le
        // degre, un CHIFFRE pour la categorie. `award_cat_2` EST la categorie,
        // et depuis le 2026-08-13 c'est une ligne de `imeb_categorie` pointee
        // par `imeb_music`.`id_categorie`. php/retrieve_works.php sert
        // desormais le LIBELLE.
        //
        // C'EST LE §16.5 ET LE §20.13 UNE FOIS DE PLUS : une traduction de
        // valeurs qui appartient a la DONNEE ne vit pas dans le code.
        var cat2 = arr[i+9];

        /* DEUX « CATEGORIES » QUI N'EN SONT PAS — 2026-08-08.

           `imeb_music`.`award_cat` porte « Magistère » et « Résidence » sur
           les codes 500 et 600 : UN TYPE DE DISTINCTION DANS LA COLONNE DE
           CATEGORIE. Or sortAndRender compare `cat` AVANT ordreDistinction.
           Le Magistere s'affichait donc comme une categorie musicale,
           intercalee entre Live et Mixte par ordre alphabetique, et la
           Residence apres Programme.

           146 oeuvres sont concernees — 21 Magisteres de 1988 a 2008, 125
           Residences de 1988 a 2009 —, et AUCUNE AVANT 1988 : c'est le
           constat de cette annee-la qui les introduit dans le fonds, et
           c'est pourquoi le defaut s'est vu ce jour-la.

           QUATRIEME FOIS QU'UN CODE MELANT DEUX NATURES COUTE QUELQUE
              CHOSE : le 199 qui mettait onze editions de prix sous leurs
              mentions (§21.13), les mentions numerotees classees sous les
              autres (§23.13), les secondes distinctions invisibles
              (§22.12). Ici le melange n'est pas dans `award_price` mais
              dans `award_cat`, et il fait le meme genre de degat.

           ON NE TRADUIT RIEN ET ON NE CORRIGE PAS LA BASE : on dit
           seulement OU CES LIGNES SE PLACENT, ce qui est de l'affichage.
           Le libelle continue de venir de `award_label`, et la colonne
           « price » affiche donc « Magistère » ou « Résidence ».

           LE TEST PORTE SUR LE CODE, PAS SUR LE LIBELLE. `award_price`
              est stable ; `award_cat` est une chaine que quelqu'un peut
              corriger un jour. Et la cellule n'est videe QUE si elle
              repete le libelle : si un Magistere recevait un jour une
              VRAIE categorie — le catalogue sait le faire, il donne
              « Mixte » aux trois prix hors categorie de 1987 —, elle
              resterait affichee et seul le rang de tri jouerait. */
        /* `award_cat` NE S'AFFICHE PLUS, ET N'EST PLUS LU — 2026-08-13.

           Il servait la colonne « category » et le tri. Le tableau porte
           maintenant « degree » puis « category », toutes deux servies par
           le serveur, et ce champ ne sert plus qu'a une chose : reperer les
           lignes hors axe, ce que fait `CAT_HORS_AXE` SUR LE CODE et non
           sur lui. Le vidage de la cellule qui suivait n'a donc plus d'objet
           — la cellule affiche `cat2`, qui est vide sur ces 146 lignes
           puisqu'un Magistere et une Residence n'ont pas de categorie. */
        var catRang = CAT_HORS_AXE[parseInt(arr[i+1], 10)] || 0;

        /* LE PUY N'EST PAS UN DEGRE DU CONCOURS, C'EST UN AUTRE CONCOURS
           — 2026-08-12.

           Le constat du 8 juin 1993 en couvre DEUX, et il le dit lui-meme en
           page 1 : « il a ete decide pour differencier les participants
           d'inscrire sur les bulletins la lettre C pour le concours et la
           lettre P pour le Puy a cote du numero attribue a la bande ». 433
           numeros C, 159 numeros P, un seul huissier, une seule date — et
           donc, pour cette page, une seule annee.

           Ses quatre disciplines — Humour, Circonstance, Jeunesse, Danse — ne
           sont pas des categories musicales du Concours, et son echelle n'est
           pas la meme : QUATRE rangs, 1er a 4e Prix, la ou le Quadrivium a
           deux prix et des mentions. Melanges, un « 2e Prix » du Puy et un
           « 2e Prix » de Studio se lisent comme deux recompenses de meme
           nature. Ils n'en sont pas.

           ON NE TRADUIT RIEN ET ON NE CORRIGE PAS LA BASE : on dit seulement
           OU CES LIGNES SE PLACENT — apres toutes les autres de leur annee —,
           ce qui est de l'affichage. C'est exactement le correctif du
           2026-08-08 sur le Magistere et la Residence, et il emprunte le meme
           chemin : `cat_rang`, qui passe AVANT `cat` dans sortAndRender.

               -1  Magistere    couronne l'edition entiere
                0  les vraies categories du Concours
               +1  Residence    un sejour, pas une recompense de rang
               +2  le PUY       un autre concours

           ET LE TEST PORTE SUR L'EVENEMENT, PAS SUR LE LIBELLE NI SUR
              L'IDENTIFIANT. Quatre identifiants en dur — 23, 24, 25, 26 —
              seraient le code-book que php/retrieve_works.php s'est deja
              interdit, et il se perimerait des le 2e Puy de 1994 : celui-la
              reconduit « et Humour » et « et Danse » et abandonne « de
              Circonstance » et « pour la Jeunesse ». */
        if(arr[i+17] === 'puy') catRang = 2;

        /* rank_num : le RANG SEUL, en plus du libelle compose. Il ne
           s'affiche nulle part — il sert uniquement au tri, ou rank_code ne
           suffit plus (voir sortAndRender). */
        objects.push({ year:arr[i], rank:rank, rank_code:arr[i+1], rank_num:num,
                       misam:arr[i+2], cat_rang:catRang,
                       fn:arr[i+3], name:arr[i+4], title:arr[i+5], cat2:cat2,
                       degre:arr[i+18], duration:arr[i+6], id:arr[i+7],
                       ctry:arr[i+10], isni:arr[i+11],
                       coauth:parseCoauteurs(arr[i+15]) });
    }
    return objects;
}

/* LES CO-AUTEURS — « Nom|ISNI;Nom|ISNI », ajoute le 2026-08-07.

   Le flux porte le nom ET l'ISNI de chaque co-auteur, pour que son nom soit
   cliquable comme celui du compositeur principal. Point-virgule entre
   co-auteurs, barre verticale entre le nom et l'ISNI.

   LES DEUX SEPARATEURS SONT VERIFIES SUR LA BASE, pas choisis au hasard :
      aucune des 3 258 fiches ne porte « | », « ; » ni « % » dans son nom.

   ET L'ISNI EST VIDE POUR LES TROIS CO-AUTEURS D'AUJOURD'HUI — Doherty,
      Van Helvert, Scheidt. Le lien apparaitra le jour ou la campagne ISNI les
      atteindra, sans qu'une ligne de code bouge : c'est la difference entre
      « la page ne sait pas le faire » et « la donnee n'est pas la ». */
function parseCoauteurs(champ){
    var out = [];
    var brut = $.trim(champ || '');
    if(!brut) return out;
    var parts = brut.split(';');
    for(var k = 0; k < parts.length; k++){
        if(!$.trim(parts[k])) continue;
        var t = parts[k].split('|');
        out.push({ nom: $.trim(t[0]), isni: $.trim(t[1] || '') });
    }
    return out;
}

/* Le NOM d'un compositeur, cliquable quand — et seulement quand — son ISNI est
   renseigne : rien n'invite a cliquer la ou il n'y a rien a ouvrir. Le repere
   est un souligne pointille, comme sur catalog.php et dans le diagramme de
   flux. `data-label` sert l'en-tete de la fiche.

   UNE SEULE FONCTION POUR LE COMPOSITEUR ET SES CO-AUTEURS depuis le
      2026-08-07. Elle etait ecrite en dur dans buildTableRows et ne servait
      qu'au premier ; la dupliquer pour les co-auteurs aurait remis deux
      copies d'une meme chose dans ce fichier — la panne habituelle du
      projet (§16.5, §21.19). */
function nomCliquable(txt, isni, label){
    if(!isni) return esc(txt);
    return '<span class="composer-isni" role="button" tabindex="0" data-isni="'
         + esc(isni) + '" data-label="' + esc(label || txt) + '">' + esc(txt)
         + '</span>';
}

/* =========================================================================
   Fiche ISNI — le code de la boite est desormais dans js/isni_box.js, seule
   copie pour les quatre pages qui l'affichent (award-winning_works.php,
   catalog.php, categories.php, euphonies.php). Il figurait ici a l'identique,
   octet pour octet, comme dans les trois autres.

   Ne restent ici que les points d'entree, propres a cette page. Il y en a
   DEUX, et ils aboutissent au meme endroit :
     - le NOM du compositeur dans le tableau (span.composer-isni, pose par
       buildTableRows sur les colonnes « first name » et « last name » pour
       les seuls artistes dont l'ISNI est renseigne) ;
     - l'ISNI affiche dans la boite violette du SMA
       (Particle.prototype.getInfoFrom, js/particles_award.js).

   Comme sur catalog.php, la fiche n'est pas une boite flottante mais un
   PANNEAU ancre a droite du tableau. Tout le dispositif — conteneur,
   placement, fermeture — vient de js/isni_box.js (enableIsniPanel) ; ne
   restent ici que les trois parametres propres a la page.
   ========================================================================= */

/* anchors   le tableau et la legende : le panneau se cale a droite du plus a
             droite d'entre eux, soit le bord de la bande de 1064 px
   clickable les noms du tableau
   watch     #infos, qui porte les boites verte, orange et violette du SMA :
             le panneau les recouvre, il se referme donc quand elles
             changent — sauf quand seul le compteur de chargement du SMA
             bouge (« 58 nodes 77% »), cf. js/isni_box.js */
$(function(){
    if(typeof enableIsniPanel !== 'function') return;   // isni_box.js absent
    enableIsniPanel({
        anchors:   ['works_table', 'legend'],
        clickable: '#main_table .composer-isni',
        watch:     'infos'
    });

    /* LA FICHE DU SMA — une SECONDE fiche, et non un second point d'entree
       vers le panneau ci-dessus (2026-08-05).

       L'ISNI de la boite violette ouvrait jusqu'ici ce panneau-la. Deux
       defauts, et le second explique le premier : le panneau RECOUVRE les
       boites d'information, si bien qu'il fallait le refermer des qu'elles
       bougent — donc a chaque clic sur un agent, c'est-a-dire au geste meme
       qui venait de l'ouvrir. Il ne tenait ouvert que par une suite
       d'exceptions (le compteur de chargement, le re-rendu de la boite
       violette, la re-ancre).

       Le SMA recoit donc le dispositif d'Overview, Network et Line Charts :
       une fiche EN FLUX dans la colonne, entre la boite orange et la boite
       violette, qui ne recouvre rien et prend sa place. Elle s'affiche seule
       des qu'un agent porte un ISNI, repliee sur l'identifiant, et c'est
       l'identifiant qui deplie — rien n'est demande au proxy avant.

       Le tableau ne change pas : les deux fiches sont deux objets distincts
       (js/isni_box.js), chacune avec son etat. Elles ne partagent que le
       cache de session — une notice ouverte d'un cote se deplie
       instantanement de l'autre. */
    if(typeof enableIsniInflowFiche === 'function'){
        enableIsniInflowFiche({ into: 'isniColumn' });
    }
});

//------------------------------------------------------------------
// Menu des annees (editions) : "All works" + une entree par annee
//------------------------------------------------------------------
function buildYearMenu(){

    var seen = {};
    for(var i=0; i<allWorks.length; i++) seen[allWorks[i].year] = true;
    // annees recentes d'abord (comme le tri du tableau)
    var years = Object.keys(seen).sort(function(a,b){ return parseInt(b,10) - parseInt(a,10); });

    var ul = $("#years ul");
    ul.empty();

    ul.append('<li class="all-works">All works</li>');
    ul.find('li.all-works').on("click", showAllWorks);

    for(var j=0; j<years.length; j++){
        var li = $('<li>').text(years[j]).attr('data-year', years[j]);
        li.on("click", (function(y){ return function(){ selectYear(y); }; })(years[j]));
        ul.append(li);
    }
}

function highlightYearMenu(sel){
    $("#years ul li").css("font-weight", "normal");
    if(sel) sel.css("font-weight", "bold");
}

function showAllWorks(){
    highlightYearMenu($("#years ul li.all-works"));
    setCanvasHeight(SMA_H_FULL);        // avant renderSelection : voir le commentaire en tete
    renderSelection(allWorks);
    ecrireAnneeDansLUrl(null);
}

function selectYear(year){
    highlightYearMenu($("#years ul li").filter(function(){ return $(this).attr('data-year') === String(year); }));
    setCanvasHeight(SMA_H_YEAR);        // une edition : moitie de hauteur
    var subset = allWorks.filter(function(w){ return String(w.year) === String(year); });
    renderSelection(subset);
    ecrireAnneeDansLUrl(year);
}

//------------------------------------------------------------------
// L'ANNEE DANS L'ADRESSE — `?y=1994`
//------------------------------------------------------------------
/* RIEN DE CE PARAMETRE N'ATTEINT LA BASE, ET C'EST LA REPONSE A LA
   QUESTION DE L'INJECTION. Le flux `php/retrieve_works.php` est appele SANS
   parametre : il rend TOUTES les œuvres primees, une fois, et `y` ne fait que
   filtrer un tableau deja en memoire (`allWorks`). Il n'y a donc ni requete
   parametree a ecrire ni echappement a poser — il n'y a pas de requete.
   *La donnee la mieux protegee d'une injection est celle qui n'atteint pas le
   SQL.*

   DEUX BARRIERES QUAND MEME, parce qu'une valeur d'URL est une valeur
      etrangere meme quand elle ne va nulle part :
        1. la FORME — exactement quatre chiffres, `^\d{4}$` ;
        2. la LISTE BLANCHE — l'annee doit exister dans le menu, donc dans le
           fonds. `?y=1795` et `?y=<script>` tombent pareil : sur « All works ».
      La valeur n'est jamais injectee dans le DOM : elle sert de cle de
      comparaison (`String(w.year) === String(year)`) et rien d'autre.

   `replaceState` ET NON `pushState` : choisir une edition dans le menu
      n'est pas une navigation, c'est un filtre. `pushState` empilerait une
      entree d'historique par clic, et le bouton « precedent » deviendrait un
      « annuler mon dernier clic » que personne n'a demande. L'adresse suit la
      selection ; l'historique n'en garde qu'une trace, celle par laquelle on
      est arrive.

   ET LA PAGE NE SE RECHARGE PAS : tout est deja charge. C'est le meme
      tableau `allWorks` qui est refiltre, exactement comme au clic. */
function anneesDuFonds(){
    var out = {};
    for(var i=0; i<allWorks.length; i++) out[String(allWorks[i].year)] = true;
    return out;
}
function anneeDemandee(){
    var m = /[?&]y=([^&#]*)/.exec(window.location.search || '');
    if(!m) return null;
    var brut;
    try{ brut = decodeURIComponent(m[1]); }catch(e){ return null; }
    if(!/^\d{4}$/.test(brut)) return null;          // barriere 1 : la forme
    if(!anneesDuFonds()[brut]) return null;         // barriere 2 : le fonds
    return brut;
}
function ecrireAnneeDansLUrl(year){
    if(!window.history || !window.history.replaceState) return;   // vieux moteur : on ne casse rien
    var base = window.location.pathname;
    var url  = year ? (base + '?y=' + encodeURIComponent(String(year))) : base;
    if(url === window.location.pathname + window.location.search) return;  // rien a ecrire
    try{ window.history.replaceState({y: year || null}, '', url); }catch(e){}
}
function appliquerAnneeDeLUrl(){
    var y = anneeDemandee();
    if(y) selectYear(y);
    else  showAllWorks();
}
/* Le bouton « precedent » ramene a l'adresse par laquelle on est arrive : on
   la relit plutot que de supposer l'etat. */
window.onpopstate = function(){ if(allWorks.length) appliquerAnneeDeLUrl(); };

//------------------------------------------------------------------
// Construit tableau + SMA pour une selection (tout / une annee)
//------------------------------------------------------------------
function renderSelection(works){

    // reinitialise le SMA (particules, menus Group by, selection, titres)
    resetAll();
    records = [];

    /* Copie triee : edition (recente d'abord) > category > sub category >
       price > RANG > last name.

       LE RANG A ETE AJOUTE LE 2026-08-04.

       `rank_code` est award_price, l'ancien code-book : il vaut 1 ou 2 pour
       un prix — le rang y est donc contenu — mais **100 pour TOUTE mention**,
       quel que soit son numero. Un seul code pour cinq rangs. Une mention
       numerotee 3 recevait donc la meme cle de tri qu'une mention 1,
       l'egalite retombait sur le critere suivant — le patronyme — et le
       tableau les affichait dans l'ordre alphabetique des compositeurs.

       Le rang voyage dans le flux depuis que la distinction s'y lit en clair
       (arr[i+13]) ; il n'etait pas dans la chaine de tri. Le voici, APRES
       rank_code et non a sa place : rank_code separe encore les prix des
       mentions (1, 2 puis 100), le rang ne departage qu'a l'interieur de
       cette separation. Ecrase l'un par l'autre, on melangerait « Prix 1 »
       et « Mention 1 ».

       ET IL NE SERVAIT RIEN JUSQU'AU 2026-08-07. `rank_num` valait
       `award_rank`, qui est NULL sur TOUTES les mentions du fonds : le
       critere comparait une colonne vide a une autre colonne vide. Le
       numero des mentions vit dans `award_ordre`, et il n'entrait pas dans
       le flux. Il y entre depuis aujourd'hui (arr[i+16]).

       CE QUE CE TRI SERT MAINTENANT, exactement : les ONZE mentions
       numerotees de 1981, 1983, 1987 et 1993. Il ne sert PAS 1974 ni 1979 :
       la relecture des constats a montre que ces documents ENUMERENT leurs
       mentions (« 1°) », le meme ordinal que leurs depots) au lieu de les
       classer, et leur numero est reparti dans
       imeb_distinction.ordre_document, QUI NE VOYAGE PAS DANS CE FLUX — le
       servir afficherait un classement que le document n'a pas prononce.

       ET 1987 DONNE ENFIN LA PROVENANCE QU'ON IGNORAIT. Le constat de la
       musique en direct ecrit « PREMIERE MENTION : bande 215 » puis
       « MENTIONS : bande 19, bande 197 » : le numero du catalogue
       (award_ordre = 1, award_price = 101 sur le seul Schweizer) est celui
       du document. Deux sources independantes, meme lecture (§23.7).

       Un rang vide — l'immense majorite des mentions du fonds — compare
       comme chaine vide et laisse le tri retomber sur le patronyme. */
    /* `cat_rang` PASSE AVANT `cat`, ET L'ORDRE DES DEUX LIGNES EST TOUT
       LE CORRECTIF DU 2026-08-08.

       Le Magistere et la Residence portent leur propre nom dans
       `award_cat` (voir parseWorks). Compare comme une chaine, « Magistère »
       tombait entre « Live » et « Mixte », et « Résidence » apres
       « Programme » : les deux s'affichaient comme des categories
       musicales. `ordreDistinction` n'avait aucune chance de corriger cela
       — elle est consultee DEUX LIGNES PLUS BAS, quand `cat` a deja
       tranche.

       Le rang hors-axe passe donc devant : -1 le Magistere, qui couronne
       l'edition entiere, 0 les vraies categories, +1 la Residence, qui est
       un sejour et non une recompense de rang. */
    var objects = works.slice();
    objects.sort(function(a, b){
        return cmpValues(b.year, a.year)
            || cmpValues(a.cat_rang || 0, b.cat_rang || 0)
            || cmpValues(a.cat2, b.cat2)
            || cmpValues(ordreDistinction(a.rank_code), ordreDistinction(b.rank_code))
            || cmpValues(numeroDeTri(a.rank_num), numeroDeTri(b.rank_num))
            /* LE CODE DEPARTAGE CE QUE `ordreDistinction` A MIS A EGALITE
               — 2026-08-13. Relevé par Florent : *« Pierre d'Argent est
               placé au-dessus de Pierre d'Or en 1999, ça devrait être
               l'inverse »*.

               `HORS_CATEGORIE` compte DIX codes — 200, 201, 296 a 300, 302,
               303, 304 — et `ordreDistinction` les replie tous sur **-1**.
               C'est juste pour les sortir de l'axe des categories, et faux
               pour les ordonner entre eux : l'egalite retombait sur le
               critere suivant, puis sur le PATRONYME. En 1999, Kosk
               (Pierre d'Argent, 297) passait donc devant Merit (Pierre
               d'Or, 296).

               DEUX EDITIONS ETAIENT CONCERNEES, et deux seulement :
                 1987 — CIME, Bregman, CNM-France, c'est-a-dire 300, 298,
                        200 : l'ordre du patronyme, Alvarez, Karpen,
                        Kergomard. Les trois sont dans `Mixte` ;
                 1999 — Pierre d'Argent avant Pierre d'Or, Kosk avant Merit.
                        Les deux sont sans categorie.
               2001 portait les deux Pierres dans le bon ordre PAR ACCIDENT,
               Brummer venant avant Harrison.

               J'AI D'ABORD ANNONCE QUATRE EDITIONS, ET LE BANC EN A RENDU
                  DEUX. J'avais compte 1985 — deux `Prix CNM-France` que
                  separait un `Prix CIME` — et 1986 — deux `Prix
                  FNME-France` separes de meme. **Ces lignes-la ne sont pas
                  dans la meme categorie** : MacDonald est en `Mixte` et
                  Beyls en `Numerique` ; de Clercq est en `Programme` et
                  Normandeau en `Studio`. La categorie est comparee AVANT la
                  distinction, et elle avait donc deja tranche. *Elles
                  n'etaient pas mal ordonnees, elles etaient groupees par
                  autre chose — et je l'avais lu de travers en regardant la
                  liste sans la colonne qui separe.*

               CE CRITERE NE DEPLACE RIEN D'AUTRE. Il ne se lit que sur des
                  lignes qui ont deja la meme annee, la meme categorie, la
                  meme place de distinction ET le meme numero : partout
                  ailleurs, un des criteres precedents a deja tranche. Les
                  mentions sont departagees par `numeroDeTri` une ligne plus
                  haut, et les prix ordinaires portent leur code comme place.

               ET LE CODE N'EST UNE HIERARCHIE QUE POUR LES DEUX PIERRES :
                  296 avant 297, l'or avant l'argent, et c'est ce que le
                  catalogue a voulu en les numerotant ainsi. Pour les prix
                  d'organismes — CNM, FNME, Bregman, CIME — il n'ordonne
                  rien ; il GROUPE, ce qui est deja tout ce qu'on lui
                  demande : deux lignes du meme prix ne doivent pas etre
                  separees par une troisieme. */
            || cmpValues(a.rank_code, b.rank_code)
            || cmpValues(a.name, b.name);
    });

    buildTableRows(objects);

    $("#info p:eq(0)").text(objects.length + " works");

    // SMA seulement si assez d'oeuvres (seuil commun a catalog : SMA_MIN_WORKS)
    if(objects.length >= SMA_MIN_WORKS){
        for (var i=0; i<objects.length; i++) {
            var o = objects[i];
            // ctry et isni alimentent la boite violette
            // (Particle.prototype.getInfoFrom). ATTENTION : l'ajout d'une
            // propriete au SMA se declare a QUATRE endroits — ici, puis dans
            // js/particles_award.js (champ du constructeur, litteral
            // this.records, et createNewChild) et dans js/childs_award.js.
            /* LES DEUX LIBELLES DU SMA ONT CHANGE DE SENS — 2026-08-13.
               `cat` portait `award_cat` et `sub_cat` la categorie. Le menu
               « Group by » affichait donc « cat » et « sub_cat », deux mots
               dont le second nomme un niveau qui n'existe pas. Ils sont
               maintenant `degree` et `category`, et ce sont les noms que le
               menu montre : *l'etiquette du menu EST le nom de la propriete*
               (checkAttributes, js/sma_core.js). */
            records.push({ edition:o.year, degree:o.degre, category:o.cat2,
                           price:o.rank,
                           imeb_id:o.misam, fn:o.fn, name:o.name, title:o.title,
                           duration:o.duration, minutes:minutesGN(o.duration),
                           ctry:o.ctry, isni:o.isni, id:o.id });
        }
        $("#myCanvas").show();
        $("#infos").show();      // boites verte (#cookies) / orange (#selection) / violette (#titles)
        $("#sma_note").hide().empty();
    } else {
        $("#myCanvas").hide();
        $("#infos").hide();      // pas de SMA -> on masque aussi ses boites d'info
        $("#sma_note").text('Too few works (' + objects.length + ') for the visualization — table only (needs at least ' + SMA_MIN_WORKS + ').').show();
    }
}

/* OU SE PLACE UNE DISTINCTION — 2026-08-05, REECRIT LE 2026-08-06

   `award_price` melange deux natures d'information. Pour une partie des
   oeuvres c'est un RANG — 1, 2, 3, 4 —, pour les autres un CODE DE FORME :
   100 « Mention », 600 « Residence », 199 « Prix, rang non renseigne ».

   CE MELANGE MARCHE TANT QUE LES CODES SONT BIEN RANGES, ET PAS PLUS.
      Trier sur le nombre brut donnait le bon ordre par accident : 1 et 2
      avant 100. Le jour ou une valeur superieure a 100 a designe autre
      chose qu'une mention, l'accident a cesse — et il a cesse DEUX FOIS.

   D'ou cette fonction, qui ne compare plus le code : elle le traduit
   d'abord en une PLACE, et les trois familles sont ecrites ici noir sur
   blanc.

   -------------------------------------------------------------------
   1. LES PRIX HORS CATEGORIE PASSENT DEVANT  ->  -1
   -------------------------------------------------------------------
   Decernes par un organisme exterieur, ou couronnant toute une edition.
   Un prix international n'est pas au-dessous d'un deuxieme prix.

       200  Prix CNM seul                   4 oeuvres   1984-1987
       201  Grand Prix                      4           1996-1997
       296  Pierre d'Or                     2           1999-2001
       297  Pierre d'Argent                 2           1999-2001
       298  Prix Bregman                    1           1987
       299  Prix FNME                       2           1986
       300  Prix CIM France / CIME seul     7           1981-1987
       302  ... + Prix 1                    2           1980, 1983
       303  ... + Mention                   2           1984, 1985
       304  ... + Mention 1                 1           1986

   LE CODE NE DIT PAS QUEL ORGANISME, LE LIBELLE OUI. La famille des 300
   couvre le Prix C.I.M. France (1981-1983) ET le Prix C.I.M.E. (1984-1987)
   — deux prix distincts que le §16 du chantier a du separer, et que ce code
   confond encore.

   -------------------------------------------------------------------
   2. « PRIX, RANG NON RENSEIGNE »  ->  99, juste avant les mentions
   -------------------------------------------------------------------
       199  Prix                           93 oeuvres   1985, puis 1996-2009

   C'est un PRIX : sa place est avant les mentions, apres les prix classes.
   Compare comme un nombre il valait 199 > 100, et TOUT prix de ces quinze
   editions s'affichait donc APRES les mentions de sa categorie. Le defaut
   touchait ONZE editions et VINGT-TROIS categories, et il a ete vu sur
   1985 : ses deux prix mixtes, codes 199 tous les deux, se departageaient
   sur le seul critere restant — le patronyme —, si bien qu'EMMERSON, qui a
   le deuxieme prix, s'affichait au-dessus de RAI, qui a le premier.

   Le rang de 1985 est desormais en base (DB/rang_prix_1985.sql l'a repris
   au constat) : `rank_num` departage les deux. Les quatorze autres editions
   n'ont pas de constat lu et gardent un rang vide — elles s'ordonnent alors
   par patronyme, ce qui est arbitraire mais AU MOINS SOUS LEURS MENTIONS.

   -------------------------------------------------------------------
   3. TOUT LE RESTE GARDE SON CODE
   -------------------------------------------------------------------
   1-4 (rangs), 100-103 (mentions), 197 « Nomine », 198 « Finaliste »,
   500 « Magistere », 600 « Residence ». Les nomines et finalistes restent
   SOUS les mentions : ce ne sont pas des recompenses mais des etapes.

   UNE LISTE DE VALEURS EN DUR NE SE MET PAS A JOUR TOUTE SEULE. Le 200 y
      manquait jusqu'au 2026-08-06 (vu en relisant imeb_music apres 1984,
      premiere edition a en porter un) ; le 199 n'y etait nulle part (vu sur
      1985). Deux fois en deux jours. Quand une edition entre, REDEMANDER AU
      CATALOGUE quelles valeurs existent :

          SELECT award_price, award_label, COUNT(*), MIN(award_year),
                 MAX(award_year)
            FROM imeb_music WHERE award_year > 0
           GROUP BY award_price, award_label ORDER BY award_price;

      Toute valeur > 100 qui n'est pas une mention doit etre classee ici.

   CE N'EST PAS LE CODE-BOOK QUI REVIENT. On ne traduit rien — les libelles
   continuent de venir de imeb_music.award_label. On dit seulement OU CES
   LIGNES SE PLACENT. Traduire un code, c'est dire ce qu'il veut dire, et ca
   appartient a la donnee ; l'ordonner, c'est de l'affichage.

   ATTENTION AU 3. « Prix 3 » porte le code 3, quatre oeuvres au fonds :
   c'est un vrai rang, il ne fait pas partie de ces familles. Le test porte
   sur une LISTE de valeurs exactes, jamais sur « commence par 3 ». */
var HORS_CATEGORIE = {200:1, 201:1, 296:1, 297:1, 298:1, 299:1,
                      300:1, 302:1, 303:1, 304:1};
var PRIX_SANS_RANG = 199;

/* LA FAMILLE DES MENTIONS SE REPLIE SUR UNE SEULE PLACE — 2026-08-07.

   `award_price` vaut 100 pour une mention sans numero et 101, 102, 103 pour
   les mentions numerotees. Comparees comme des nombres, les mentions SANS
   numero passaient donc DEVANT celles que le document numerote :

       1987, musique en direct   Rai (100), Taylor (100), puis Schweizer (101)
       1983, art visuel          Kershaw (100), puis Weidenaar (101), Uehara (103)

   Le constat de 1987 dit l'inverse en toutes lettres : « PREMIERE MENTION :
   bande 215 » — Schweizer — PUIS « MENTIONS : bande 19, bande 197 ».

   C'EST LE MEME DEFAUT QUE LE 199, ET POUR LA MEME RAISON : un code qui
      melange une FORME (« ceci est une mention ») et un RANG (« la
      premiere ») ne peut pas se trier comme un nombre. Le 199 avait mis
      onze editions de prix sous leurs mentions ; celui-ci met les mentions
      numerotees sous les autres. Troisieme fois que ce melange coute.

   Les quatre codes rendent donc la meme place, 100, et c'est `rank_num` —
   le numero lui-meme, qui voyage dans le flux depuis aujourd'hui — qui
   departage a l'interieur. */
var MENTIONS = {100:1, 101:1, 102:1, 103:1};

/* LES DEUX DISTINCTIONS QUI SORTENT DE L'AXE DES CATEGORIES — 2026-08-08.

   Elles ne couronnent pas une categorie : le Magistere couronne l'EDITION
   ENTIERE, la Residence n'est pas une recompense de rang mais un sejour.
   Toutes deux portent leur propre nom dans `award_cat`, ce qui les faisait
   trier comme des categories musicales (voir le bloc de parseWorks).

   La valeur est un RANG SUR L'AXE DES CATEGORIES, pas une place de
   distinction : -1 passe devant les categories, +1 passe derriere.

   ET LE COMMENTAIRE DU 2026-08-06 LE DEMANDAIT DEJA : « toute valeur
      > 100 qui n'est pas une mention doit etre classee ici ». 500 et 600
      etaient dans « tout le reste garde son code » depuis toujours, c'est-
      a-dire nulle part. La liste en dur ne s'est pas mise a jour toute
      seule, TROISIEME FOIS — apres le 200 en 1984 et le 199 en 1985. */
var CAT_HORS_AXE = {500: -1, 600: 1};

function ordreDistinction(code){
    var n = parseInt(code, 10);
    if(HORS_CATEGORIE[n])      return -1;
    if(n === PRIX_SANS_RANG)   return 99;   // un prix, donc avant 100
    if(MENTIONS[n])            return 100;  // toutes les mentions au meme rang
    /* LE MAGISTERE ET LA RESIDENCE SONT DEJA SEPARES PAR `cat_rang`,
       AVANT que cette fonction soit consultee — dans le cas ordinaire elle
       ne les voit donc jamais. Mais si l'un d'eux recevait un jour une
       VRAIE categorie, `cat_rang` vaudrait quand meme -1 ou +1 et les
       sortirait de l'axe : c'est le comportement voulu, et il faut que la
       place de distinction suive. Le Magistere passe devant les prix hors
       categorie ; la Residence se range juste apres les mentions. */
    if(n === 500)              return -2;
    if(n === 600)              return 101;
    return code;
}

/* UNE DISTINCTION SANS NUMERO PASSE APRES CELLES QUI EN ONT UN.

   `cmpValues` compare une chaine vide comme une chaine, donc AVANT « 1 ».
   Il faut l'inverse : le document proclame d'abord ce qu'il numerote, puis
   le reste. On repousse donc les valeurs vides a la fin de leur famille.

   99 ET NON 999 : la valeur ne sert qu'a comparer entre elles des lignes
      qui ont deja la meme place de distinction, la meme categorie et la
      meme annee. Aucune edition n'a jamais eu 99 mentions dans une
      categorie — la plus fournie en a six (1981, analogique). */
function numeroDeTri(v){
    return (v === undefined || v === null || v === '') ? 99 : parseFloat(v);
}

function cmpValues(a, b){
    if(a===undefined || a===null || a==='') a='';
    if(b===undefined || b===null || b==='') b='';
    var na = parseFloat(a), nb = parseFloat(b);
    if(!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b), 'fr', {sensitivity: 'base'});
}

/* LES NEUF COLONNES DU TABLEAU, DECRITES UNE FOIS.

   Chaque descripteur porte la classe posee sur la cellule ET la facon de
   lire sa valeur dans un objet-oeuvre. Les deux ensemble permettent a
   masquerColonnesVides() de savoir, sans relire le DOM, si une colonne est
   vide pour la selection courante.

   L'ORDRE EST CELUI DES <th> DE award-winning_works.php, et les classes
      y sont ecrites aussi. Un contrôle le vérifie à chaque rendu et se
      plaint dans la console si les deux divergent : c'est le genre de
      couple qui se desynchronise le jour ou l'on ajoute une colonne d'un
      seul cote — la colonne « duration » a ete ajoutee le matin meme. */
var COLONNES = [
    {cls: 'c-year',  lire: function(o){ return o.year; }},
    /* LA COLONNE « sub category » A DISPARU, ET CELLE DU DEGRE AVEC ELLE
       — 2026-08-13, le meme jour toutes les deux.

       Le tableau portait « category » puis « sub category », c'est-a-dire
       `imeb_music.award_cat` puis la categorie. Il ne porte plus qu'une
       colonne, « category », et elle porte LA CATEGORIE — ce que la page
       appelait « sous-categorie » EST la categorie : le concours a des
       DEGRES et des CATEGORIES, et le constat de 1990 l'ecrit, une lettre
       pour le degre et un chiffre pour la categorie.

       `award_cat` NE S'AFFICHE PLUS, parce qu'il ne dit pas la meme chose
          selon l'annee : de 1977 a 1999 c'est la CATEGORIE, de 2000 a 2009
          c'est la SECTION du degre II — Trivium, Trivium A, Trivium B,
          Quadrivium. Une colonne qui change de sens en cours de tableau ne
          se trie pas et ne se lit pas. Il reste dans le flux.

       LE DEGRE A EU SA COLONNE PENDANT UNE HEURE, et elle est retiree pour
          la meme raison qu'en §16.1 : il n'a que TROIS valeurs, et 373 des
          519 lignes qui en portent une portent « II ». Une colonne qui
          repete la meme lettre sur sept lignes sur dix n'apprend rien.
          CE N'EST PAS UN DEFAUT DE CALCUL, et c'est mesure : sur 2005, le
          catalogue (`award_cat`) et le constat (`imeb_distinction.type`)
          rendent le MEME compte par deux chemins independants — 6 au degre
          I, 17 au II, 1 au III —, et le document ecrit lui-meme ses trois
          titres, « RESIDENCE - DEGRE 1 », « TRIVIUM / QUADRIVIUM - DEGRE
          Il », « MAGISTERIUM - DEGRE Ill ». Le degre II EST le concours ;
          les degres I et III sont les deux distinctions qui l'encadrent.
          *Une valeur qui est vraie sept fois sur dix decrit la regle, pas
          la ligne.*
          Il reste dans le flux (dernier champ) et dans le menu « Group by »
          du SMA, ou un attribut ne coute aucune place. */
    {cls: 'c-cat',   lire: function(o){ return o.cat2; }},
    {cls: 'c-price', lire: function(o){ return o.rank; }},
    /* LE COMPOSITEUR EN UNE SEULE COLONNE — 2026-08-07.

       « first name » et « last name » etaient deux colonnes, et le nom
       s'ecrivait donc en deux morceaux qu'il fallait relire ensemble. Elles
       n'en font plus qu'une, « composer », et le marqueur ISNI ne se pose
       plus qu'une fois au lieu de deux.

       LE TRI, LUI, RESTE SUR LE PATRONYME (`o.name`, dernier critere de
          sortAndRender). L'affichage est « Prenom Nom », l'ordre est celui
          des noms de famille : c'est voulu, et c'est ce que fait toute
          liste de compositeurs. */
    {cls: 'c-composer', lire: function(o){
        return ((o.fn || '') + ' ' + (o.name || '')).trim(); }},
    /* LES CO-AUTEURS, ajoutes le 2026-08-07.

       `imeb_music.id_artist` est un entier UNIQUE — le catalogue n'a jamais
       connu la co-signature. Trois bandes de 1986 sont co-signees ET
       distinguees, les premieres du corpus : 94 De Clercq / Van Helvert,
       149 Harrison / Doherty, 226 Schryer / Scheidt. Le second nom
       n'apparaissait nulle part.

       LA COLONNE EST VIDE SUR TOUTES LES AUTRES SELECTIONS, et elle se
          masque donc toute seule (masquerColonnesVides). C'est exactement ce
          pour quoi ce mecanisme a ete ecrit la veille : une colonne d'en-tete
          au-dessus de trente cellules vides n'informe pas. */
    {cls: 'c-coauth', lire: function(o){
        return o.coauth.map(function(c){ return c.nom; }).join(', '); }},
    {cls: 'c-ctry',  lire: function(o){ return o.ctry; }},
    {cls: 'c-title', lire: function(o){ return o.title; }},
    {cls: 'c-dur',   lire: function(o){ return o.duration; }}
];

/* UNE COLONNE VIDE POUR TOUTE LA SELECTION NE S'AFFICHE PAS.

   Le tableau est le meme pour les 36 editions, mais toutes n'ont pas les
   memes colonnes a remplir : de 1973 a 1976 le concours n'avait NI
   categorie NI sous-categorie, et la sous-categorie reste vide sur la
   plupart des editions suivantes. Une colonne d'en-tete au-dessus de trente
   cellules vides n'informe pas — elle fait croire a une donnee manquante la
   ou il n'y a rien a manquer.

   ON MASQUE, ON NE SUPPRIME PAS. La colonne revient telle quelle des que
      la selection change, et « All works » les montre toutes : le tableau
      ne perd aucune colonne, il n'affiche que celles qui portent quelque
      chose. Le masquage est donc une propriete de la SELECTION, pas du
      tableau, et il se recalcule a chaque rendu.

   ET UNE SELECTION VIDE NE MASQUE RIEN. Sans cette garde, un filtre qui
      ne rend aucune oeuvre ferait disparaitre les neuf colonnes d'un coup,
      en-tetes compris, et la page semblerait cassee plutot que vide. */
function masquerColonnesVides(objects){

    var table = document.getElementById('works_table');
    if(!table) return;

    var ths = table.getElementsByTagName('th');
    if(ths.length !== COLONNES.length){
        console.log('aww : ' + ths.length + ' en-tetes pour ' +
                    COLONNES.length + ' colonnes decrites — les deux doivent '
                    + 'bouger ensemble (COLONNES ici, <th> dans le PHP)');
    }

    for(var c = 0; c < COLONNES.length; c++){

        var vide = objects.length > 0;

        for(var j = 0; j < objects.length; j++){
            var v = COLONNES[c].lire(objects[j]);
            if(v !== undefined && v !== null && String(v).trim() !== ''){
                vide = false;
                break;
            }
        }

        // th ET td portent la meme classe : un seul selecteur suffit.
        $('#works_table .' + COLONNES[c].cls).toggleClass('col-vide', vide);
    }
}

function buildTableRows(objects){

    // on vide les lignes existantes SAUF l'en-tete (1re ligne)
    $('#works_table tr:gt(0)').remove();

    // LES TROIS PREMIERES COLONNES SONT FUSIONNEES QUAND ELLES SE REPETENT,
    //   et cette cle doit donc nommer exactement ces trois-la : edition,
    //   categorie, distinction — TROIS depuis le retrait de la colonne du
    //   degre, quatre avant lui. Une cle qui ne suit pas les colonnes
    //   fusionne des lignes qui n'affichent pas la meme chose, ou refuse de
    //   fusionner des lignes identiques.
    function groupKey(o){ return o.year + '|' + o.cat2 + '|' + o.rank; }

    var html = '';
    var groupIndex = -1;
    var memberIndex = 0;

    for (var j = 0; j < objects.length; j++) {

        var isNewGroup = (j===0) || groupKey(objects[j-1]) !== groupKey(objects[j]);
        if(isNewGroup){ groupIndex++; memberIndex = 0; } else memberIndex++;

        var grpParity = (groupIndex % 2 === 0) ? 'grp-cell-a' : 'grp-cell-b';
        var memParity = ((groupIndex + memberIndex) % 2 === 0) ? 'mem-a' : 'mem-b';

        html += isNewGroup ? '<tr class="group-start">' : '<tr>';

        if(isNewGroup){
            // taille du groupe (edition/category/price) -> rowspan
            var span = 1;
            for(var k=j+1; k<objects.length && groupKey(objects[k])===groupKey(objects[j]); k++) span++;
            // LES TROIS cellules fusionnees, dans l'ordre de COLONNES. Elles
            // etaient QUATRE tant que « sub category » puis « degree »
            // tenaient la troisieme place ; ce nombre doit suivre groupKey().
            for(var g = 0; g < 3; g++){
                html += '<td class="grp-cell '+grpParity+' '+COLONNES[g].cls
                      + '" rowspan="'+span+'">'
                      + COLONNES[g].lire(objects[j]) + '</td>';
            }
        }

        // "country" prend la place de l'ancienne colonne "imeb id" (le MISAM,
        // numero de gestion interne) et vient juste apres "last name".
        // Le MISAM reste transporte dans l'objet (objects[j].misam) et sert
        // toujours de propriete imeb_id aux agents du SMA.
        //
        // Le nom devient cliquable pour les seuls compositeurs dont l'ISNI est
        // renseigne : rien n'invite a cliquer la ou il n'y a rien a ouvrir. Le
        // repere est un souligne pointille, comme sur catalog.php et dans le
        // diagramme de flux. Ici le nom occupe DEUX colonnes (prenom et
        // patronyme) : les deux portent le marqueur et ouvrent la meme fiche,
        // parce qu'ils designent la meme personne et qu'on clique
        // indifferemment l'un ou l'autre. data-label sert l'en-tete de la
        // fiche, qui affiche le nom complet.
        var fullName = ((objects[j].fn || '') + ' ' + (objects[j].name || '')).trim();

        /* La duree, ajoutee le 2026-08-06, JUSTE APRES LE TITRE : elle
           qualifie l'oeuvre et se lit avec lui.

           RIEN N'A CHANGE COTE DONNEES. `imeb_music.duration` voyageait
              deja dans le flux — septieme champ, arr[i+6] — et servait la
              boite violette du SMA depuis toujours ; elle n'etait simplement
              pas dans le tableau. La longueur d'enregistrement ne bouge donc
              pas, et php/retrieve_works.php n'est pas touche.

           QUARANTE-TROIS LIGNES SUR 755 SORTENT VIDES, et les trois causes
              sont legitimes :
                 15  oeuvres primees dont le catalogue ne donne pas la duree
                     — quatorze depuis toujours, plus celle de Lea Collins
                     (Quadrivium 2007), qui portait « 00 » et que
                     DB/duree_zero.sql a ramenee a NULL le meme jour ;
                  2  distinctions dont l'oeuvre n'est pas au fonds (deuxieme
                     branche de l'union) ;
                 26  lignes « not awarded », qui ne portent AUCUNE oeuvre
                     (troisieme branche : imeb_non_attribution).
              Une cellule vide dit qu'on ne sait pas ; elle ne se remplit pas
              d'un tiret, qui se lirait comme une valeur. */
        /* LES CO-AUTEURS PORTENT LEUR PROPRE MARQUEUR ISNI depuis le
           2026-08-07 — chacun le sien, jamais celui du compositeur
           principal : poser le marqueur d'un autre ouvrirait la fiche de
           quelqu'un d'autre, ce qui est pire que de ne rien poser. */
        var coauth = objects[j].coauth.map(function(c){
            return nomCliquable(c.nom, c.isni);
        }).join(', ');

        html += '<td class="'+memParity+' c-composer">'
              + nomCliquable(fullName, objects[j].isni, fullName) + '</td>'
              + '<td class="'+memParity+' c-coauth">'+ coauth + '</td>'
              + '<td class="'+memParity+' c-ctry">'+ objects[j].ctry + '</td>'
              + '<td class="'+memParity+' c-title">'+ objects[j].title + '</td>'
              + '<td class="'+memParity+' c-dur dur">'+ esc(objects[j].duration) + '</td></tr>';
    }

    var table = document.getElementById('works_table');
    var tbody = table.tBodies[0] || table;
    tbody.insertAdjacentHTML('beforeend', html);

    // APRES l'insertion : les cellules doivent exister pour etre masquees.
    masquerColonnesVides(objects);
}
