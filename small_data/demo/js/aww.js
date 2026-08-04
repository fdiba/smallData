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
    var numOfElements = 15;
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
                       ctry:arr[i+10], isni:arr[i+11] });
    }
    return objects;
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
            || cmpValues(a.rank_code, b.rank_code)
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

function cmpValues(a, b){
    if(a===undefined || a===null || a==='') a='';
    if(b===undefined || b===null || b==='') b='';
    var na = parseFloat(a), nb = parseFloat(b);
    if(!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b), 'fr', {sensitivity: 'base'});
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
            html += '<td class="grp-cell '+grpParity+'" rowspan="'+span+'">'+ objects[j].year + '</td>'
                  + '<td class="grp-cell '+grpParity+'" rowspan="'+span+'">'+ objects[j].cat + '</td>'
                  + '<td class="grp-cell '+grpParity+'" rowspan="'+span+'">'+ objects[j].cat2 + '</td>'
                  + '<td class="grp-cell '+grpParity+'" rowspan="'+span+'">'+ objects[j].rank + '</td>';
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
        var nameCell = function(txt){
            if(!objects[j].isni) return txt;
            return '<span class="composer-isni" role="button" tabindex="0" data-isni="'
                 + esc(objects[j].isni) + '" data-label="' + esc(fullName) + '">' + txt + '</span>';
        };

        html += '<td class="'+memParity+'">'+ nameCell(objects[j].fn) + '</td>'
              + '<td class="'+memParity+'">'+ nameCell(objects[j].name) + '</td>'
              + '<td class="'+memParity+'">'+ objects[j].ctry + '</td>'
              + '<td class="'+memParity+'">'+ objects[j].title + '</td></tr>';
    }

    var table = document.getElementById('works_table');
    var tbody = table.tBodies[0] || table;
    tbody.insertAdjacentHTML('beforeend', html);
}
