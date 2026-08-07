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

window.onload = function() {

    initSMA(1064, 800);
    startSMA();             // boucle SMA lancee UNE seule fois

    $("#info p:eq(0)").text('loading…');

    $.ajax({ url: 'php/retrieve_works.php', type: "POST" }).done(function(str) {
        allWorks = parseWorks(str);
        buildYearMenu();
        showAllWorks();     // etat initial : tout (comme catalog id=2)
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
    var numOfElements = 16;
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

        var rank;
        if(label){
            rank = rg ? (label + ' ' + rg) : label;
            if(lab2) rank += ' et ' + lab2;
        } else {
            rank = arr[i+1];          // base non migree : on montre le code brut
        }

        // Libelles des sous-categories (imeb_music.award_cat_2, code entier
        // 1-12), en toutes lettres. Table identique a set_sub_cat() dans
        // php/retrieve_cat.php, qui sert la page euphonies : ici le code
        // arrive brut (retrieve_works.php ligne 28) et est traduit cote
        // client. Les deux tables doivent rester synchronisees.
        var cat2 = arr[i+9];
        if(cat2==1)cat2="Avec dispositifs et/ou instruments";
        else if(cat2==2)cat2="Esthétique formelle";
        else if(cat2==3)cat2="Esthétique à programme";
        else if(cat2==4)cat2="Danse ou théâtre";
        else if(cat2==5)cat2="Installation ou environnement sonore et musical";
        else if(cat2==6)cat2="Multimédia";
        else if(cat2==7)cat2="Art sonore électroacoustique";
        else if(cat2==8)cat2="Avec instruments";
        else if(cat2==9)cat2="Sans instruments";
        else if(cat2==10)cat2="tendance netart";
        else if(cat2==11)cat2="tendance création";
        else if(cat2==12)cat2="tendance performance";

        /* rank_num : le RANG SEUL, en plus du libelle compose. Il ne
           s'affiche nulle part — il sert uniquement au tri, ou rank_code ne
           suffit plus (voir sortAndRender). */
        objects.push({ year:arr[i], rank:rank, rank_code:arr[i+1], rank_num:rg,
                       misam:arr[i+2],
                       fn:arr[i+3], name:arr[i+4], title:arr[i+5], cat:arr[i+8], cat2:cat2,
                       cat2_code:arr[i+9], duration:arr[i+6], id:arr[i+7],
                       ctry:arr[i+10], isni:arr[i+11],
                       coauth:parseCoauteurs(arr[i+15]) });
    }
    return objects;
}

/* LES CO-AUTEURS — « Nom|ISNI;Nom|ISNI », ajoute le 2026-08-07.

   Le flux porte le nom ET l'ISNI de chaque co-auteur, pour que son nom soit
   cliquable comme celui du compositeur principal. Point-virgule entre
   co-auteurs, barre verticale entre le nom et l'ISNI.

   ⚠️ LES DEUX SEPARATEURS SONT VERIFIES SUR LA BASE, pas choisis au hasard :
      aucune des 3 258 fiches ne porte « | », « ; » ni « % » dans son nom.

   ⚠️ ET L'ISNI EST VIDE POUR LES TROIS CO-AUTEURS D'AUJOURD'HUI — Doherty,
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

   ⚠️ UNE SEULE FONCTION POUR LE COMPOSITEUR ET SES CO-AUTEURS depuis le
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
    renderSelection(allWorks);
}

function selectYear(year){
    highlightYearMenu($("#years ul li").filter(function(){ return $(this).attr('data-year') === String(year); }));
    var subset = allWorks.filter(function(w){ return String(w.year) === String(year); });
    renderSelection(subset);
}

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

       CE QUE CE TRI SERT AUJOURD'HUI, exactement : les mentions numerotees
       de 1981, 1983, 1987 et 1993 — douze oeuvres, dont le numero vient du
       CATALOGUE et dont on ignore la provenance. Il ne sert PLUS 1974 ni
       1979 : la relecture des constats a montre que ces documents ENUMERENT
       leurs mentions (« 1°) », le meme ordinal que leurs depots) au lieu de
       les classer, et leur numero est reparti dans
       imeb_distinction.ordre_document, qui ne s'affiche pas. Le jour ou ces
       douze-la seront tranchees a leur tour, ce critere pourra disparaitre.

       Un rang vide — l'immense majorite des mentions du fonds — compare
       comme chaine vide et laisse le tri retomber sur le patronyme. */
    var objects = works.slice();
    objects.sort(function(a, b){
        return cmpValues(b.year, a.year)
            || cmpValues(a.cat, b.cat)
            || cmpValues(a.cat2_code, b.cat2_code)
            || cmpValues(ordreDistinction(a.rank_code), ordreDistinction(b.rank_code))
            || cmpValues(a.rank_num, b.rank_num)
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
            records.push({ edition:o.year, cat:o.cat, sub_cat:o.cat2, price:o.rank,
                           imeb_id:o.misam, fn:o.fn, ln:o.name, title:o.title,
                           duration:o.duration, ctry:o.ctry, isni:o.isni, id:o.id });
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

   ⚠️ CE MELANGE MARCHE TANT QUE LES CODES SONT BIEN RANGES, ET PAS PLUS.
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

   ⚠️ LE CODE NE DIT PAS QUEL ORGANISME, LE LIBELLE OUI. La famille des 300
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

   ⚠️ UNE LISTE DE VALEURS EN DUR NE SE MET PAS A JOUR TOUTE SEULE. Le 200 y
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

function ordreDistinction(code){
    var n = parseInt(code, 10);
    if(HORS_CATEGORIE[n])      return -1;
    if(n === PRIX_SANS_RANG)   return 99;   // un prix, donc avant 100
    return code;
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

   ⚠️ L'ORDRE EST CELUI DES <th> DE award-winning_works.php, et les classes
      y sont ecrites aussi. Un contrôle le vérifie à chaque rendu et se
      plaint dans la console si les deux divergent : c'est le genre de
      couple qui se desynchronise le jour ou l'on ajoute une colonne d'un
      seul cote — la colonne « duration » a ete ajoutee le matin meme. */
var COLONNES = [
    {cls: 'c-year',  lire: function(o){ return o.year; }},
    {cls: 'c-cat',   lire: function(o){ return o.cat; }},
    {cls: 'c-cat2',  lire: function(o){ return o.cat2; }},
    {cls: 'c-price', lire: function(o){ return o.rank; }},
    /* LE COMPOSITEUR EN UNE SEULE COLONNE — 2026-08-07.

       « first name » et « last name » etaient deux colonnes, et le nom
       s'ecrivait donc en deux morceaux qu'il fallait relire ensemble. Elles
       n'en font plus qu'une, « composer », et le marqueur ISNI ne se pose
       plus qu'une fois au lieu de deux.

       ⚠️ LE TRI, LUI, RESTE SUR LE PATRONYME (`o.name`, dernier critere de
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

       ⚠️ LA COLONNE EST VIDE SUR TOUTES LES AUTRES SELECTIONS, et elle se
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

   ⚠️ ON MASQUE, ON NE SUPPRIME PAS. La colonne revient telle quelle des que
      la selection change, et « All works » les montre toutes : le tableau
      ne perd aucune colonne, il n'affiche que celles qui portent quelque
      chose. Le masquage est donc une propriete de la SELECTION, pas du
      tableau, et il se recalcule a chaque rendu.

   ⚠️ ET UNE SELECTION VIDE NE MASQUE RIEN. Sans cette garde, un filtre qui
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

    function groupKey(o){ return o.year + '|' + o.cat + '|' + o.cat2 + '|' + o.rank; }

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
            // taille du groupe (edition/category/sub category/price) -> rowspan
            var span = 1;
            for(var k=j+1; k<objects.length && groupKey(objects[k])===groupKey(objects[j]); k++) span++;
            // les quatre cellules fusionnees, dans l'ordre de COLONNES
            for(var g = 0; g < 4; g++){
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

           ⚠️ RIEN N'A CHANGE COTE DONNEES. `imeb_music.duration` voyageait
              deja dans le flux — septieme champ, arr[i+6] — et servait la
              boite violette du SMA depuis toujours ; elle n'etait simplement
              pas dans le tableau. La longueur d'enregistrement ne bouge donc
              pas, et php/retrieve_works.php n'est pas touche.

           ⚠️ QUARANTE-TROIS LIGNES SUR 755 SORTENT VIDES, et les trois causes
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
