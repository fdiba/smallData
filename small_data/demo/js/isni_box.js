/* =========================================================================
   Fiche ISNI — boite flottante partagee par les quatre pages qui affichent
   un identifiant ISNI : award-winning_works.php, catalog.php, categories.php
   et euphonies.php.

   Ce fichier est la SEULE copie du code. Il etait auparavant recopie a
   l'identique dans js/aww.js, js/catalog.js, js/categories.js et
   js/euphonies.js — quatre exemplaires strictement egaux octet pour octet,
   verifies fonction par fonction avant l'extraction. C'est exactement le
   mecanisme qui avait laisse survivre l'en-tete « imeb id » sur une page
   apres sa correction sur les autres : une seule copie, une seule
   correction.

   Le point d'entree, lui, reste propre a chaque page, et n'est donc pas ici :
     - award-winning_works.php et catalog.php : l'ISNI affiche dans la boite
       violette du SMA (Particle.prototype.getInfoFrom) ;
     - euphonies.php : la colonne ISNI du tableau ;
     - categories.php : le <text> SVG du noeud compositeur.
   Chacun se contente d'appeler openIsniBox($(element)), ou l'element porte
   un attribut data-isni. C'est le seul contrat entre les pages et ce fichier.

   La boite est attachee a <body> en position absolue : elle est donc HORS
   FLUX et ne deplace rien (ni tableau, ni canvas, ni diagramme). Elle se
   place sous l'element clique, recalee si elle deborde de la fenetre — utile
   sur categories.php, dont le diagramme fait plus de 6000 px de haut.

   Les styles (.isni-*) sont dans css/isni.css, feuille elle aussi partagee
   par les quatre pages. Les donnees viennent de php/retrieve_isni.php (proxy
   serveur : ISNI SRU, la notice JSON-LD d'isni.org et Wikidata ; voir ce
   fichier). Le proxy est indispensable, un appel direct depuis le navigateur
   serait bloque par CORS.

   Les libelles affiches sont en anglais, comme le reste du site. Ils
   n'existent plus qu'une fois : c'etait la seconde raison de l'extraction.

   Depend de jQuery (charge avant ce fichier dans les quatre pages).
   L'indentation d'origine (4 espaces) est conservee.
   ========================================================================= */

var isniCache = {};        // memoire de session : une notice n'est chargee qu'une fois
var isniAnchor = null;     // lien actuellement ouvert

/* ---------------------------------------------------------------------------
   Mode PANNEAU (dock). Par defaut la fiche est une boite flottante posee sous
   l'element clique. Une page peut demander qu'elle soit rendue dans un
   conteneur a elle — catalog.php l'ancre a droite de ses deux tableaux, ou il
   y a de la place libre, et le panneau y suit le defilement.

   Ce que le mode change, et rien d'autre :
     - la boite est appendue au conteneur au lieu de <body> ;
     - placeIsniBox() ne fait plus rien : c'est la CSS de la page qui place le
       conteneur (position fixe), pas le JS ;
     - le clic hors de la boite ne la referme plus. Une boite flottante posee
       sous un lien doit s'effacer des qu'on regarde ailleurs ; un panneau
       lateral, non — on veut pouvoir parcourir le tableau en le gardant sous
       les yeux. La croix et Echap restent, et un autre nom le remplace.

   A appeler AVANT la premiere ouverture (la boite n'est construite qu'une
   fois). Les trois autres pages ne l'appellent pas et gardent la boite
   flottante, inchangee.
   --------------------------------------------------------------------------- */
var isniDock = null;

/* Forme du compteur de chargement du SMA, ecrit dans la boite verte par
   addParticleUsing() (sma_core.js) : « 58 nodes 77% ». C'est la seule
   ecriture de cette boite qui ne soit pas une reponse a un geste de
   l'utilisateur — d'ou la regle du panneau, plus bas. Le « 400 nodes » sans
   pourcentage, ecrit a la fermeture d'un groupe, ne correspond pas : c'est
   bien un geste, et la fiche doit se refermer. */
var ISNI_LOADING_RE = /^\s*\d+\s+nodes\s+\d+\s*%\s*$/;

function setIsniDock(el){
    isniDock = el || null;
}

/* ---------------------------------------------------------------------------
   enableIsniPanel() — le panneau lateral, cle en main.

   setIsniDock() ci-dessus n'est que la primitive : elle dit OU rendre la
   fiche. Autour d'elle, une page qui veut un panneau a besoin des memes cinq
   choses — creer le conteneur, le caler a droite du contenu, le recaler au
   redimensionnement et au defilement, rendre des noms cliquables, et refermer
   la fiche quand elle se met a masquer autre chose. Ce bloc a d'abord ete
   ecrit dans js/catalog.js ; le porter tel quel sur award-winning_works.php
   en aurait fait une seconde copie de quatre-vingt-dix lignes. C'est
   exactement le mecanisme qui avait laisse survivre l'en-tete « imeb id » sur
   une page apres sa correction sur les autres (§J du recapitulatif), et qui a
   motive l'extraction de ce fichier (§K) puis celle de js/legend_toggle.js
   (§M). Il est donc ici, appele avec des parametres.

   Options — toutes facultatives :
     dockId     id du conteneur cree (defaut 'isniPanel')
     into       id d'un conteneur DEJA present dans la page, ou la fiche doit
                etre rendue EN FLUX (voir ci-dessous). Exclut dockId/anchors.
     anchors    ids dont le bord droit cale le panneau : il se pose 10 px a
                droite du plus a droite d'entre eux, et se rabat contre le
                bord de la fenetre s'il n'y a pas la place
     clickable  selecteur DELEGUE des elements qui ouvrent la fiche ; ils
                portent data-isni (et, si l'on veut, data-label)
     watch      id d'un conteneur dont toute modification referme la fiche,
                parce que le panneau le recouvre

   DEUX PLACEMENTS, ET POURQUOI. Par defaut le panneau est en position FIXE
   a droite du contenu : c'est le cas du catalogue et des oeuvres primees, ou
   la page occupe la largeur d'un tableau et laisse une gouttiere libre. Sur
   Overview il n'y a pas de gouttiere — la grille prend toute la largeur moins
   la colonne d'information (maxWidth = largeur du document - 525). Un panneau
   flottant y recouvrirait la boite violette, exactement le defaut signale sur
   le catalogue. D'ou `into` : la fiche est rendue DANS la colonne, en flux,
   sous la boite orange. Elle ne recouvre rien, elle prend sa place — et le
   placement est alors entierement affaire de CSS (la page dimensionne son
   conteneur), donc pas de mesure, pas de rappel au defilement.

   Retourne la fonction de placement, pour les pages qui doivent la rappeler
   (fonction inerte en mode `into`).
   --------------------------------------------------------------------------- */
function enableIsniPanel(opt){

    opt = opt || {};

    var dockId    = opt.dockId    || 'isniPanel';
    var into      = opt.into      || '';
    var anchors   = opt.anchors   || [];
    var clickable = opt.clickable || '';
    var watch     = opt.watch     || '';

    var panel;
    var inflow = false;      // vrai seulement si le conteneur demande existe

    if(into){
        panel = document.getElementById(into);
        /* Conteneur absent (page pas a jour, HTML en cache) : on NE renonce
           PAS. Les noms cliquables sont poses par le JS de la page, ils
           seraient alors soulignes sans rien ouvrir — pire qu'un placement
           imparfait. La fiche revient donc a la boite flottante, son mode
           d'origine, qui ne demande aucun conteneur. */
        if(panel){
            inflow = true;
            panel.className += (panel.className ? ' ' : '') + 'isni-inflow';
            setIsniDock('#' + into);
        }
    } else {
        /* Le conteneur est cree ici plutot que dans le HTML de la page : sans
           JavaScript il n'y aurait rien a y mettre, et une div vide dans le
           source serait une promesse non tenue. */
        panel = document.getElementById(dockId);
        if(!panel){
            panel = document.createElement('div');
            panel.id = dockId;
            document.body.appendChild(panel);
        }
        setIsniDock('#' + dockId);
    }

    /* Le panneau se cale juste a DROITE du contenu, pas au bord de la
       fenetre : il se lit alors comme une colonne de plus, alignee sur la
       bande de contenu. S'il n'y a pas la place, il se rabat contre le bord
       droit et recouvre la fin du tableau — c'est le compromis accepte pour
       ne jamais deplacer la mise en page. La mesure est refaite au
       redimensionnement ET au defilement : le panneau est en position fixe,
       un defilement horizontal decalerait le contenu sous lui. */
    function place(){
        if(inflow || !panel) return;         // en flux : c'est la CSS qui place
        var right = 0;
        for(var i = 0; i < anchors.length; i++){
            var e = document.getElementById(anchors[i]);
            if(!e || e.offsetParent === null) continue;      // absent ou masque
            var r = e.getBoundingClientRect();
            if(r.width > 0 && r.right > right) right = r.right;
        }
        if(right <= 0) return;

        var w    = panel.offsetWidth || 340;
        var left = right + 10;
        if(left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8);
        panel.style.left = Math.round(left) + 'px';
    }

    if(!inflow){
        place();
        $(window).on('resize.isnipanel scroll.isnipanel', place);
    }

    /* Les boites d'information du SMA vivent a droite du canvas, c'est-a-dire
       sous le panneau, qui les recouvre entierement. La fiche se referme donc
       des que l'une d'elles change : on ne laisse pas une notice masquer la
       reponse au clic qu'on vient de faire.

       SAUF LE COMPTEUR DE CHARGEMENT. Le SMA cree ses agents UN PAR IMAGE
       (sma_core.js, addParticleUsing) et reecrit a chaque fois la boite verte
       — « 58 nodes 77% », trente fois par seconde. Ce n'est pas une reponse a
       un clic, c'est un compteur qui tourne : fermer la fiche la-dessus la
       rend inutilisable tant que le chargement n'a pas atteint 100 %.

       Le test porte donc sur le CONTENU, pas sur la phase du SMA. Un premier
       essai s'appuyait sur sl_attribute (vide = phase 1) ; c'etait trop
       grossier, parce que la creation des agents a lieu AVANT le test de
       phase dans sma_animation() et se poursuit donc en phase 2 — des qu'une
       propriete de regroupement etait choisie avant la fin du chargement, la
       fiche se refermait de nouveau a chaque image.

       On ignore donc la mutation quand DEUX conditions sont reunies : elle ne
       touche que #cookies, et le texte qui en resulte a la forme du compteur.
       Toutes les autres ecritures de la boite verte ont une autre forme et
       referment bien la fiche — « property: ln », « country: France », ou le
       « 400 nodes » sans pourcentage de la fermeture d'un groupe, qui sont,
       elles, des reponses a un geste. */
    if(watch && window.MutationObserver){
        var box = document.getElementById(watch);
        if(box){
            new MutationObserver(function(records){

                // Un re-rendu de la boite violette par le SMA n'est pas un
                // geste : getInfoFrom decide lui-meme s'il faut fermer ou
                // re-ancrer (voir isniBeginRerender, plus haut).
                if(isniRerenderGuard) return;

                var onlyCounter = true;
                for(var i = 0; i < records.length; i++){
                    var t  = records[i].target;
                    var el = (t.nodeType === 1) ? t : t.parentNode;
                    if(!el || !el.closest || !el.closest('#cookies')){ onlyCounter = false; break; }
                }

                // le texte est lu APRES coup : addParticleUsing vide la boite
                // puis y ecrit, et un rappel d'observateur est une micro-tache
                // — il s'execute une fois les deux operations faites.
                if(onlyCounter && ISNI_LOADING_RE.test($('#cookies').text())) return;

                closeIsniBox();
            }).observe(box, {childList: true, subtree: true, characterData: true});
        }
    }

    /* Delegue : les lignes des tableaux sont (re)construites a chaque
       changement de selection, un gestionnaire pose sur chaque cellule serait
       a reposer a chaque fois. */
    if(clickable){
        $(document).on('click', clickable, function(evt){
            evt.stopPropagation();
            place();
            openIsniBox($(this));
        });
        $(document).on('keydown', clickable, function(evt){
            if(evt.key !== 'Enter' && evt.key !== ' ' && evt.key !== 'Spacebar') return;
            evt.preventDefault();
            evt.stopPropagation();
            place();
            openIsniBox($(this));
        });
    }

    return place;
}

function esc(s){
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function ensureIsniBox(){

    var box = $('#isniBox');
    if(box.length) return box;

    box = $('<div id="isniBox" class="isni-box" role="dialog" aria-label="ISNI record">'
          + '<div class="isni-hd"><span class="isni-hd-t"></span>'
          + '<span class="isni-close" title="close">&times;</span></div>'
          + '<div class="isni-bd"></div></div>').appendTo(isniDock || 'body');

    if(isniDock) box.addClass('isni-docked');

    box.on('click', '.isni-close', function(){ closeIsniBox(); });
    // un clic dans la boite ne doit pas la refermer
    box.on('click', function(evt){ evt.stopPropagation(); });

    /* Le repli — voir showIsniBox() plus bas. Le gestionnaire est pose ici,
       une fois, sur la boite qui ne se reconstruit jamais ; il ne rencontre
       .isni-toggle que sur les pages qui appellent showIsniBox(). */
    box.on('click', '.isni-toggle', function(evt){
        evt.preventDefault();
        evt.stopPropagation();
        toggleIsniBox();
    });

    $(document).on('keydown.isni', function(evt){ if(evt.key === 'Escape') closeIsniBox(); });
    if(!isniDock) $(document).on('click.isni', function(){ closeIsniBox(); });
    $(window).on('resize.isni scroll.isni', function(){ if(isniAnchor) placeIsniBox(isniAnchor); });

    return box;
}

function closeIsniBox(){
    $('#isniBox').removeClass('open');
    isniAnchor = null;
}

/* =======================================================================
   MODE REPLIE — la fiche s'affiche SANS QU'ON LA DEMANDE

   Ajoute le 2026-08-05 pour Overview, et pour elle seule. Les quatre autres
   pages continuent d'appeler openIsniBox() et ne voient aucune difference :
   ni le repli, ni le chargement differe, ni l'en-tete cliquable. C'est la
   raison de ce point d'entree separe plutot que d'un drapeau dans
   openIsniBox() — un drapeau aurait fait passer les cinq pages par le meme
   chemin, et la premiere correction faite pour l'une aurait porte sur toutes.

   CE QUE CE MODE CHANGE, ET RIEN D'AUTRE :

     1. la boite s'ouvre SANS CLIC, des qu'un compositeur porte un ISNI. Le
        nom n'est plus le declencheur : c'est l'existence de l'identifiant.
        L'utilisateur n'a plus a deviner que le pointille sous un nom cache
        quelque chose ;
     2. elle s'ouvre REPLIEE : seul son en-tete est visible, et cet en-tete
        est l'identifiant lui-meme. On voit donc qu'il y a un ISNI, et ce
        qu'il vaut, sans rien charger ;
     3. RIEN N'EST DEMANDE AU RESEAU tant qu'on ne deplie pas. Le nom, le
        pays et l'identifiant viennent de la base, deja recus avec la
        selection ; la notice internationale, elle, coute une requete au
        proxy PHP (qui interroge ISNI SRU, isni.org et Wikidata). Selectionner
        vingt compositeurs de suite ne declenche aucun appel. La memoire de
        session (isniCache) fait le reste : un compositeur deja deplie se
        rouvre instantanement.

   L'ETAT DE PLI N'EST PAS MEMORISE d'un compositeur a l'autre : chaque
   selection repart repliee. C'est deliberé — la fiche depliee mesure
   plusieurs centaines de pixels dans la colonne, et la garder ouverte
   repousserait la liste des oeuvres hors de l'ecran a chaque clic sur la
   grille. Le geste de deplier reste bon marche.
   ======================================================================= */

/* L'ISNI actuellement affiche en mode replie, et l'etat de son chargement.
   Deux variables et non une : `isniShown` sert a ne pas reconstruire
   l'en-tete quand la selection ne change pas, `isniShownLoaded` a ne pas
   relancer la requete quand on replie puis deplie. */
var isniShown = '';
var isniShownLoaded = false;

/* Affiche la fiche repliee pour un identifiant donne. Rend true si quelque
   chose est affiche, false si l'ISNI est vide — auquel cas la boite est
   retiree, ce qui est le bon comportement pour un compositeur sans ISNI.

     isni    l'identifiant, espaces indifferents
     label   le nom affiche devant lui (facultatif)  */
function showIsniBox(isni, label){

    var id = String(isni || '').replace(/\s+/g, '');
    if(!id){ hideIsniBox(); return false; }

    var box = ensureIsniBox();

    /* L'en-tete EST le bouton. La croix disparait dans ce mode : une fiche
       qu'on n'a pas ouverte n'a pas a etre fermee, et le pli suffit. Elle
       reste en place pour les pages en mode clic — d'ou le retrait par CSS
       plutot que par suppression du noeud. */
    box.addClass('isni-foldable');

    if(id !== isniShown){
        isniShown = id;
        isniShownLoaded = false;
        box.find('.isni-bd').empty();
    }

    var head = 'ISNI ' + id.replace(/(.{4})(?=.)/g, '$1 ');
    var lbl  = String(label || '').trim();

    /* L'en-tete est reconstruit a chaque fois : c'est le seul endroit ou le
       nom du compositeur change sans que l'identifiant change (deux fiches
       fusionnees, une graphie corrigee). Le cout est nul, le noeud est unique. */
    box.find('.isni-hd-t').html(
        '<button type="button" class="isni-toggle" aria-expanded="false">'
        + esc(lbl ? lbl + ' — ' + head : head)
        + '<span class="isni-caret" aria-hidden="true"></span></button>');

    box.addClass('open').addClass('is-folded');
    isniAnchor = null;          // pas d'ancre : la fiche n'est pas posee sous un lien
    return true;
}

/* Retire la fiche. A appeler quand la selection change pour un compositeur
   sans ISNI, ou quand il n'y a plus de selection du tout : sans cela, la
   fiche du precedent resterait affichee sous une boite orange qui parle de
   quelqu'un d'autre — le pire des deux mondes. */
function hideIsniBox(){
    $('#isniBox').removeClass('open is-folded');
    isniShown = '';
    isniShownLoaded = false;
}

/* Le pli. Au PREMIER depliage seulement, la notice est demandee au proxy. */
function toggleIsniBox(){

    var box = $('#isniBox');
    if(!box.length) return;

    var folded = box.hasClass('is-folded');
    box.toggleClass('is-folded', !folded);
    box.find('.isni-toggle').attr('aria-expanded', folded ? 'true' : 'false');

    if(!folded || isniShownLoaded || !isniShown) return;

    // On deplie et rien n'est charge : c'est ici, et seulement ici, que le
    // reseau est sollicite.
    isniShownLoaded = true;

    if(isniCache[isniShown]){ renderIsniBox(isniCache[isniShown]); return; }

    var id = isniShown;
    box.find('.isni-bd').html('<p class="isni-wait">Querying ISNI&hellip;</p>');

    $.ajax({url: 'php/retrieve_isni.php', type: 'POST', dataType: 'json', data: {isni: id}})

        .done(function(data){
            isniCache[id] = data;
            if(isniShown === id) renderIsniBox(data);
        })

        .fail(function(){
            // meme en cas d'echec la fiche reste utile : les deux liens
            // canoniques se construisent sans le serveur. NON mis en cache —
            // une panne reseau ne doit pas condamner l'identifiant pour la
            // duree de la session.
            isniShownLoaded = false;
            if(isniShown !== id) return;
            renderIsniBox({status: 'error', isni: id, links: {
                isni_org:  'https://isni.org/isni/' + id,
                isni_oclc: 'https://isni.oclc.org/cbs/DB=1.2//CMD?ACT=SRCH&IKT=8006&TRM=ISN%3A'
                           + id + '&TERMS_OF_USE_AGREED=Y&terms_of_use_agree=send'
            }});
        });
}

/* =======================================================================
   LE RE-RENDU DU SMA N'EST PAS UN GESTE — corrige le 2026-08-04

   Sur award-winning_works.php, la fiche ISNI a DEUX points d'entree : le
   nom du compositeur dans le tableau, et l'ISNI affiche dans la boite
   violette du SMA (#titles, rempli par Particle.prototype.getInfoFrom).

   Le second se refermait AUSSITOT, une fois et une seule. Deux causes qui
   se cumulent, et aucune n'est un geste de l'utilisateur :

     1. getInfoFrom vide #titles et le reconstruit. Il fermait la fiche
        avant, avec raison : le lien auquel elle est ancree est sur le
        point d'etre detruit. Mais quand la boite est reconstruite avec le
        MEME ISNI — le SMA re-affiche le meme agent —, l'ancre est
        remplacee par son equivalent, pas supprimee.
     2. L'observateur ci-dessous voit muter #titles, qui est dans #infos,
        et referme a son tour.

   « Une fois et une seule » s'explique : au deuxieme clic le SMA a fini de
   se stabiliser et ne reconstruit plus la boite.

   Deux outils, donc, pour que getInfoFrom decide seul :

     isniBeginRerender()  — le temps d'un re-rendu, l'observateur se tait.
                            Le drapeau tombe au tour de boucle suivant :
                            un rappel d'observateur est une micro-tache, il
                            passe AVANT le setTimeout, donc il est bien
                            couvert.
     isniOpenFor()        — l'ISNI actuellement ouvert, pour savoir si le
                            re-rendu le reprend.
     reanchorIsniBox()    — deplacer l'ancre sans fermer.

   L'intention d'origine est preservee : si le SMA affiche un AUTRE agent,
   l'ISNI change, la fiche se ferme comme avant. On ne laisse pas une
   notice masquer la reponse au clic qu'on vient de faire.
   ======================================================================= */
var isniRerenderGuard = false;

function isniBeginRerender(){
    isniRerenderGuard = true;
    setTimeout(function(){ isniRerenderGuard = false; }, 0);
}

function isniOpenFor(){
    return isniAnchor
         ? String(isniAnchor.data('isni') || '').replace(/\s+/g, '')
         : '';
}

function reanchorIsniBox(anchor){
    if(!anchor || !anchor.length) return false;
    isniAnchor = anchor;
    placeIsniBox(anchor);
    return true;
}

/* Positionnement : sous le lien, cale dans la fenetre. La boite est deja
   visible (classe open) quand on appelle ceci, sinon sa largeur vaut 0. */
function placeIsniBox(anchor){

    if(isniDock) return;   // mode panneau : la place est fixee par la CSS de la page

    var box = $('#isniBox');
    if(!box.length || !anchor || !anchor.length) return;

    var r  = anchor[0].getBoundingClientRect();
    var bw = box.outerWidth();
    var bh = box.outerHeight();
    var vw = $(window).width();
    var vh = $(window).height();
    var m  = 8;
    // la barre de controle est fixe : on ne passe jamais dessous
    var barH = ($('#ctrl_bar').outerHeight() || 0) + m;

    var left = r.left;
    if(left + bw > vw - m) left = vw - bw - m;
    if(left < m) left = m;

    // sous le lien ; au-dessus s'il n'y a pas la place en bas ; et si la boite
    // ne tient nulle part, on la remonte juste ce qu'il faut pour qu'elle
    // reste entierement visible sous la barre de controle.
    var top = r.bottom + 6;
    if(top + bh > vh - m){
        var above = r.top - bh - 6;
        if(above >= barH) top = above;
        else              top = Math.max(barH, vh - m - bh);
    }
    if(top < barH) top = barH;

    box.css({left: Math.round(left + window.pageXOffset) + 'px',
             top:  Math.round(top  + window.pageYOffset) + 'px'});
}

function openIsniBox(anchor){

    var isni = String(anchor.data('isni') || '').replace(/\s+/g, '');
    if(!isni) return;

    var box = ensureIsniBox();
    isniAnchor = anchor;

    /* Mode clic : on quitte le mode replie s'il avait ete pose. Aucune des
       quatre pages historiques ne melange les deux, mais la boite est unique
       et un reste de pli la laisserait vide apres un clic. */
    box.removeClass('isni-foldable is-folded');
    isniShown = '';
    isniShownLoaded = false;

    // En-tete : l'identifiant, precede du nom quand l'element clique en porte
    // un (data-label). Utile surtout en mode panneau, ou la fiche n'est plus
    // posee a cote de ce qu'on vient de cliquer et ou « ISNI 0000 0000 … »
    // seul ne dit pas de qui il s'agit. Sans data-label, rien ne change.
    var label = String(anchor.attr('data-label') || '').trim();
    var head  = 'ISNI ' + isni.replace(/(.{4})(?=.)/g, '$1 ');
    box.find('.isni-hd-t').text(label ? label + ' — ' + head : head);
    box.addClass('open');

    if(isniCache[isni]){
        renderIsniBox(isniCache[isni]);
        placeIsniBox(anchor);
        return;
    }

    box.find('.isni-bd').html('<p class="isni-wait">Querying ISNI&hellip;</p>');
    placeIsniBox(anchor);

    $.ajax({url: 'php/retrieve_isni.php', type: 'POST', dataType: 'json', data: {isni: isni}})

        .done(function(data){
            isniCache[isni] = data;
            renderIsniBox(data);
            placeIsniBox(anchor);
        })

        .fail(function(){
            // meme en cas d'echec la boite reste utile : les deux liens canoniques
            // se construisent sans le serveur.
            renderIsniBox({status: 'error', isni: isni, links: {
                isni_org:  'https://isni.org/isni/' + isni,
                isni_oclc: 'https://isni.oclc.org/cbs/DB=1.2//CMD?ACT=SRCH&IKT=8006&TRM=ISN%3A'
                           + isni + '&TERMS_OF_USE_AGREED=Y&terms_of_use_agree=send'
            }});
            placeIsniBox(anchor);
        });
}

function renderIsniBox(d){

    var h = [];
    var lnk = function(url, label){
        return '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(label) + '</a>';
    };

    //--- identite
    var who = [];
    if(d.names && d.names.length){
        for (var i = 0; i < d.names.length && i < 4; i++) {
            var n = d.names[i];
            var s = $.trim((n.forename || '') + ' ' + (n.surname || ''));
            if(n.dates) s += ' (' + n.dates + ')';
            if(s) who.push(esc(s));
        }
    }
    if(who.length) h.push('<p class="isni-name">' + who.join('<br>') + '</p>');
    if(d.wikidata && d.wikidata.description){
        h.push('<p class="isni-desc">' + esc(d.wikidata.description) + '</p>');
    }

    //--- les deux acces canoniques a la notice
    if(d.links){
        h.push('<p class="isni-sec">Record</p><ul class="isni-list">');
        if(d.links.isni_org)  h.push('<li>' + lnk(d.links.isni_org, 'isni.org — public record') + '</li>');
        if(d.links.isni_oclc) h.push('<li>' + lnk(d.links.isni_oclc, 'isni.oclc.org — full data') + '</li>');
        h.push('</ul>');
    }

    //--- liens externes (Discogs, MusicBrainz, VIAF, Wikipedia...)
    if(d.external && d.external.length){
        h.push('<p class="isni-sec">External links</p><ul class="isni-list">');
        for (var k = 0; k < d.external.length && k < 20; k++) {
            h.push('<li>' + lnk(d.external[k].url, d.external[k].label) + '</li>');
        }
        if(d.external.length > 20) h.push('<li class="isni-more">and ' + (d.external.length - 20) + ' more</li>');
        h.push('</ul>');
    }

    //--- notes de la notice ISNI
    if(d.notes && d.notes.length){
        h.push('<p class="isni-sec">Notes</p><ul class="isni-list isni-notes">');
        for (var m = 0; m < d.notes.length && m < 8; m++) h.push('<li>' + esc(d.notes[m]) + '</li>');
        h.push('</ul>');
    }

    //--- oeuvres relevees par ISNI
    if(d.titles && d.titles.length){
        h.push('<p class="isni-sec">Works listed</p><ul class="isni-list isni-titles">');
        for (var t = 0; t < d.titles.length; t++) h.push('<li>' + esc(d.titles[t]) + '</li>');
        if(d.titlesMore) h.push('<li class="isni-more">and ' + d.titlesMore + ' more</li>');
        h.push('</ul>');
    }

    //--- bases contributrices
    if(d.sources && d.sources.length){
        var codes = [];
        for (var s = 0; s < d.sources.length; s++) {
            if(d.sources[s].code && codes.indexOf(d.sources[s].code) === -1) codes.push(d.sources[s].code);
        }
        if(codes.length) h.push('<p class="isni-sec">Contributing databases</p>'
                              + '<p class="isni-codes">' + esc(codes.join(', ')) + '</p>');
    }

    //--- etats degradés
    if(d.status === 'empty'){
        h.push('<p class="isni-warn">No detailed data retrieved: the record is still available through the links above.</p>');
    } else if(d.status === 'error'){
        h.push('<p class="isni-warn">The server could not query ISNI: the links above remain valid.</p>');
    } else if(d.status === 'invalid'){
        h.push('<p class="isni-warn">Invalid ISNI.</p>');
    }

    $('#isniBox .isni-bd').html(h.join(''));
}
