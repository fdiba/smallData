//----------- index and network ----------------//

/* ------------------------------------------------------------------------
   INTERPOLATION DE COULEUR — hex vers hex.

   Ecrite pour le fondu de survol du line chart, elle vit ici depuis le
   2026-08-08 : la grille de l'Overview s'en sert aussi (pour attenuer les
   carres pendant une recherche), et ce fichier est le seul que les deux
   pages chargent. Utilisee par js/linechart.js, js/matrixchart.js et
   js/overview.js — tous charges apres celui-ci.
   ------------------------------------------------------------------------ */
function hexToRgb(h){
    h=(''+h).replace('#','');
    if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    return {r:parseInt(h.substr(0,2),16), g:parseInt(h.substr(2,2),16), b:parseInt(h.substr(4,2),16)};
}
function lerpHexColor(a, b, t){
    var ca=hexToRgb(a), cb=hexToRgb(b);
    return 'rgb(' + Math.round(ca.r+(cb.r-ca.r)*t) + ',' +
                    Math.round(ca.g+(cb.g-ca.g)*t) + ',' +
                    Math.round(ca.b+(cb.b-ca.b)*t) + ')';
}

/* La boite violette (#titles) d'Overview et de Network : un en-tete
   « N archived works », puis la liste des oeuvres, REPLIEE par defaut.

   Pourquoi replier. La liste pouvait faire plusieurs dizaines de lignes
   (Clozier en porte 43) et repoussait alors tout le bas de la colonne
   d'information. Ce qu'on veut savoir en cliquant un agent ou un carre, c'est
   d'abord COMBIEN d'oeuvres la fiche porte ; la liste elle-meme se demande.
   L'en-tete portait deja le compte — il devient le bouton qui l'affiche, et
   perd ses deux-points : il n'introduit plus une liste visible, il commande
   son affichage.

   ECRIT ICI, ET NON DANS LA PAGE. Le repli est ne dans js/overview.js, ou il
   ajoutait son propre en-tete DEVANT celui-ci — le compte s'affichait deux
   fois. Le porter tel quel sur Network en aurait fait, en plus, une seconde
   copie du JS et de la CSS. C'est le mecanisme qui avait laisse survivre
   l'en-tete « imeb id » sur une page apres sa correction sur les autres, et
   qui a motive l'extraction de js/isni_box.js puis de js/legend_toggle.js.
   Cette fonction etant deja la seule a construire cette boite pour les deux
   pages, c'est ici que le pli a sa place. Les styles suivent le meme chemin :
   ils sont dans css/main.css, aupres de la regle #titles.

   Mettre le <li> d'en-tete en tete de liste est sans danger : le zebrage
   violet est porte par des CLASSES (.t-a/.t-b) et non par :nth-child. Sur les
   Euphonies, ou il etait en nth-child, l'insertion d'une ligne inversait la
   parite de toutes les suivantes — c'est ce qui avait impose les classes.

   Le pli est refait a chaque compositeur : on ne garde pas ouvert l'etat
   demande pour la fiche precedente, qui portait un autre nombre d'oeuvres. */
/* L'ORDRE DES ŒUVRES DANS LA BOITE VIOLETTE — 2026-08-12.

   Les trois flux qui alimentent cette boite (le `case 1` d'Overview et de
   Participation, le `case 11` de Network) rendent les œuvres dans l'ordre ou
   la base les sort, c'est-a-dire par identifiant : l'ordre de SAISIE. Une
   boite de dix ou douze titres se lisait donc dans un ordre qui n'en est pas
   un — on ne peut ni y chercher un titre, ni dire d'un coup d'œil si une
   œuvre y est.

   LE TRI SE FAIT SUR UNE COPIE. `titles` est aussi lu ailleurs — c'est le
      tableau que displayComposerBox() et les compteurs relisent —, et il vient
      du flux : il garde l'ordre du flux. C'est la meme regle que
      displayCpInfos() dans js/animated_data.js, et pour la meme raison.

   `localeCompare` AVEC 'fr' ET `sensitivity: 'base'` : les titres du fonds
      portent des accents (« Eclats », « Écoute »), des apostrophes et des
      chiffres romains. Un tri sur les codes de caracteres range « Écoute »
      APRES « Zéphyr », ce qui n'est pas un ordre alphabetique — c'est un ordre
      d'octets. `numeric: true` range en outre « Etude II » avant « Etude X ».
      Le comparateur est pose une fois ici : les trois pages passent par cette
      fonction, et une quatrieme copie ne survivrait pas a la premiere
      correction faite ailleurs. */
function compareTitres(a, b){
    var ta = (a && a.t != null) ? String(a.t) : '';
    var tb = (b && b.t != null) ? String(b.t) : '';
    if(''.localeCompare){
        try{
            return ta.localeCompare(tb, 'fr', {sensitivity:'base', numeric:true});
        }catch(e){ /* moteur sans arguments de locale : on retombe plus bas */ }
    }
    return ta < tb ? -1 : (ta > tb ? 1 : 0);
}
function displayTitlesInfosGN(arr){

    var box = $("#titles");

    /* LA COPIE, PUIS LE TRI — jamais l'inverse, et jamais en place. */
    arr = (arr || []).slice().sort(compareTitres);

    bindTitlesFold();
    box.empty();

    /* `t-boxed` — LA BOITE VIOLETTE EST UNE BOITE DE COLONNE, ET ELLE SE
       BORNE COMME LA FICHE ISNI (2026-08-11).

       Elle n'avait aucune hauteur maximale : un compositeur tres documente —
       Dhomont en porte douze, d'autres davantage — poussait tout ce qui la
       suit hors de l'ecran, sur les TROIS pages qui l'affichent. C'est mot
       pour mot le defaut deja corrige deux fois ailleurs : sur `#results`
       d'Overview le 2026-08-08 (« on croyait la colonne vide ; elle etait
       seulement tres loin »), et sur la fiche ISNI en flux le 2026-08-05,
       dont la borne a du etre ramenee de 60vh a 36vh precisement parce
       qu'elle repoussait CETTE boite-ci sous le pli.

       LA CLASSE EST POSEE ICI, PAS DANS LE HTML DES PAGES, et c'est le point :
       cette fonction est le seul constructeur de la boite a en-tete repliable
       — Overview, Network et Participation passent par elle. La classe suit
       donc exactement les pages qui ont cette boite-la, sans qu'aucune ait a
       le declarer. Le catalogue et les œuvres primees remplissent `#titles`
       autrement, sans passer par ici : ils ne recoivent pas la classe, et leur
       boite — qui EST le contenu de la page, pas une boite de colonne — garde
       sa hauteur libre. Une regle posee sur `#titles` tout court les aurait
       bornes eux aussi.

       Ni `is-folded` ni `.t-hd` ne pouvaient servir de crochet : la premiere
       disparait au depli, la seconde n'existe pas quand il n'y a aucune
       oeuvre. `t-boxed` dit ce qu'est la boite, pas l'etat ou elle se trouve.

       La regle est dans css/main.css, aupres de `#titles`. */
    box.addClass('t-boxed');

    if(arr.length>0){

        // "work" au singulier si une seule oeuvre, sans parentheses
        var label = arr.length + ' archived work' + (arr.length>1 ? 's' : '');

        /* `t-hd-on` accompagne `is-folded` mais ne la suit pas : elle dit
           « cette boite a un en-tete », etat qui ne change pas au depli,
           quand `is-folded` disparait. La regle de css/main.css qui retire le
           padding haut et rend l'en-tete collant s'y accroche. */
        box.addClass('is-folded t-hd-on').append(
            '<li class="t-hd"><button type="button" class="t-toggle" aria-expanded="false">'
            + label + '<span class="t-caret" aria-hidden="true"></span></button></li>');

        for (var i=0; i<arr.length; i++) {
            var obj=arr[i];

            /* LE MISAM AU SURVOL — 2026-08-08.

               `obj.m` est le numero de repertoire Clozier de l'oeuvre
               (`imeb_music.misam`), deja transporte par les trois flux qui
               alimentent cette boite : le `case 1` d'Overview et de
               Participation, le `case 11` de Network. Il etait donc lu et
               jete par les trois pages depuis toujours.

               C'est un NUMERO D'INVENTAIRE, et c'est ce qui le rend utile a
                  cet endroit : un titre se recopie mal — sous-titre coupe,
                  apostrophe, chiffre romain, points de suspension : six
                  natures d'ecart relevees sur dix-neuf paires au chantier des
                  PV — tandis qu'un numero d'inventaire designe une piece et
                  une seule. C'est la cle par laquelle on retrouve l'oeuvre
                  dans le fonds, et elle n'apparaissait nulle part dans
                  l'interface.

               Au SURVOL et non en clair : la boite violette est une liste
               d'oeuvres, pas un bordereau, et une colonne de six chiffres a
               cote de chaque titre en ferait un bordereau.

               Attribut `title` natif plutot qu'une infobulle maison : c'est
               deja ce que font les lignes de `#composers` (voir
               appendComposerLi dans js/animated_data.js), et il n'y a aucune
               raison d'en avoir deux sortes sur la meme page.

               Rien n'est ecrit quand le MISAM manque : une bulle qui promet un
               numero et n'en montre aucun vaut moins que pas de bulle. */
            var misam = (obj.m == null) ? '' : String(obj.m).replace(/^\s+|\s+$/g, '');
            var tip = misam ? ' title="MISAM ' + misam.replace(/"/g, '&quot;') + '"' : '';

            var div='<li class="'+(i%2===0 ? 't-a' : 't-b')+'"'+tip+'>'+obj.t;
            if(obj.d) div += ' ('+obj.d+')';
            var eds = editionYears(obj.ed);
            if(eds.length){
                div += ' | ' + (eds.length === 1 ? 'edition' : 'editions')
                     + ': ' + eds.join(', ');
            }
            div += '</li>';
            box.append(div);
        }

    } else {
        /* Aucune oeuvre : il n'y a rien a replier, et surtout il faut RETIRER
           le pli laisse par le compositeur precedent — sinon la regle qui
           masque les <li> hors en-tete masquerait aussi cette phrase. */
        box.removeClass('is-folded t-hd-on').append('<li>no archived work for this composer</li>');
    }

}

/* Les annees de programmation d'une oeuvre (imeb_music.editions), nettoyees :
   decoupees, debarrassees des vides, DEDOUBLONNEES et remises dans l'ordre.

   Le dedoublonnage n'est pas cosmetique. Neuf oeuvres de la base portent une
   annee repetee — « Matrechka » de Robert Normandeau vaut '1986,1986', et
   « Postcards from the summer » de Robert Mackay '1999,2000,2000,2001,2002'.
   La boite violette affichait donc l'annee deux fois ET la comptait deux fois,
   ce qui faisait passer une oeuvre programmee une seule annee au pluriel
   (« editions: 1986, 1986 »). Le compte etant tire de la meme liste que
   l'affichage, les deux se trompaient ensemble.

   Corrige ici plutot qu'a la seule main dans la base : la donnee sera nettoyee,
   mais un import futur peut recreer le cas, et l'affichage doit y survivre. */
function editionYears(ed){
    var vus = {}, out = [];
    var l = ('' + (ed || '')).split(',');
    for(var i=0; i<l.length; i++){
        var y = l[i].replace(/^\s+|\s+$/g, '');
        if(!y || vus[y]) continue;
        vus[y] = true;
        out.push(y);
    }
    return out.sort();
}

/* Le pli lui-meme. Delegue sur #titles : l'en-tete est reconstruit a chaque
   selection, un gestionnaire pose dessus serait a reposer a chaque fois.

   POSE A LA PREMIERE UTILISATION, et non au chargement. Ce fichier ne
   contenait jusqu'ici que des DECLARATIONS de fonctions : il pouvait donc
   etre charge avant ou apres jQuery indifferemment, et les sept pages qui
   l'incluent ne suivent pas toutes le meme ordre. Un « $(function(){…} ) » au
   premier niveau aurait fait de jQuery une dependance de CHARGEMENT et casse
   silencieusement toute page qui le charge avant lui. Le drapeau garantit un
   seul gestionnaire, quel que soit le nombre d'appels.

   Pas dans js/legend_toggle.js (le repli du "How to read") : celui-ci
   s'adresse a un couple bouton/panneau identifie par id et present sur sept
   pages, alors qu'il s'agit ici de masquer les freres d'un <li> dans une liste
   reconstruite en permanence. Si un troisieme pli apparait, c'est
   legend_toggle.js qu'il faudra generaliser plutot que recopier ces lignes. */
var titlesFoldBound = false;

function bindTitlesFold(){

    if(titlesFoldBound) return;
    titlesFoldBound = true;

    $('#titles').on('click', '.t-toggle', function(){
        var ouvert = !$('#titles').toggleClass('is-folded').hasClass('is-folded');
        $(this).attr('aria-expanded', ouvert ? 'true' : 'false');
    });
}

//----------- only network ----------------//

/* Le nom du compositeur dans la boite orange de Network.

   Quand la fiche porte un ISNI, le NOM SEUL devient cliquable et ouvre la
   notice d'identite internationale dans la colonne (js/isni_box.js). Meme
   geste et meme marqueur .composer-isni que sur Overview, le catalogue et les
   oeuvres primees.

   La condition « typeof esc === 'function' » n'est pas une precaution de
   style : ce fichier est charge par des pages qui NE chargent PAS
   js/isni_box.js. La fonction y serait absente ; on retombe alors sur du texte
   simple, comme avant. Meme repli quand la fiche n'a pas d'ISNI : un nom
   souligne qui n'ouvre rien serait pire que pas de souligne du tout. */
function displayFirstnameAndNameGN(obj){

    var txt = obj.fn+' '+obj.n;
    var isni = obj.isni ? $.trim(obj.isni) : '';

    /* LE NOM N'EST PLUS CLIQUABLE — 2026-08-05, apres Overview.
       Il portait un souligne pointille et ouvrait la notice ISNI : il fallait
       avoir remarque le pointille, puis deviner ce qu'il cachait. La fiche
       s'affiche desormais d'elle-meme, repliee sur l'identifiant, et c'est cet
       identifiant — titre de sa propre boite — qui se deplie. Rien a deviner,
       et la boite d'identite redevient du texte. */
    $("#selection").empty().append('<p>');
    $("#selection p").text(txt);
    $("#selection").append(countryLineHtml(obj.origin, obj.ctry));

    /* La fiche ISNI suit la boite d'identite, et elle est ecrite ICI pour la
       meme raison qu'elle l'est dans renderSelection() sur Overview : les deux
       disent la MEME selection. Tant qu'elles etaient tenues par deux
       mecanismes independants — un clic pour ouvrir, un observateur de
       mutations pour fermer —, elles pouvaient se contredire. Un compositeur
       sans ISNI retire donc la fiche du precedent, au lieu de la laisser sous
       une boite qui parle de quelqu'un d'autre.

       Rien n'est demande au reseau tant que la fiche n'est pas depliee : le
       nom et l'identifiant viennent du meme flux que la selection. */
    syncIsniBoxGN(isni);
}

/* Accorder la fiche ISNI a la selection courante — TROIS PAGES, UN SEUL
   ENDROIT.

   Overview, Network et Participation affichent chacune une boite d'identite
   (respectivement #selection, #selection et #composerBox) et chacune, depuis
   le 2026-08-05, doit poser la fiche ISNI EN MEME TEMPS : l'ancienne paire
   « un clic pour ouvrir, un observateur de mutations pour fermer » pouvait
   laisser la fiche d'un compositeur sous le nom d'un autre.

   Les quatre lignes qui suivent etaient donc sur le point d'exister en trois
   exemplaires. C'est exactement ce qui avait laisse survivre l'en-tete
   « imeb id » sur une page apres sa correction sur les autres, et ce qui a
   motive l'extraction de js/isni_box.js, de js/legend_toggle.js, puis du repli
   de la boite violette dans ce fichier meme. Une seule copie.

   Rend true si une fiche est affichee. */
function syncIsniBoxGN(isni){

    if(typeof showIsniBox !== 'function') return false;   // page sans isni_box.js

    var id = isni ? $.trim('' + isni) : '';
    if(id) return showIsniBox(id);

    /* Pas d'ISNI : on RETIRE celle du precedent. C'est la moitie qu'on oublie,
       et c'est la plus visible — une notice d'identite sous une boite qui
       nomme quelqu'un d'autre est pire que pas de notice du tout. */
    if(typeof hideIsniBox === 'function') hideIsniBox();
    return false;
}

/* Le meme accord, pour la fiche EN FLUX DU SMA des trois pages qui portent
   aussi un tableau — award-winning_works, catalog, euphonies (js/isni_box.js,
   enableIsniInflowFiche). Fonction jumelle de syncIsniBoxGN ci-dessus, et non
   un parametre de plus : les deux fiches d'une meme page sont deux objets, et
   les melanger dans un seul appel aurait rendu impossible d'en bouger une sans
   toucher l'autre — ce qui est precisement ce qu'on demande ici, le tableau ne
   devant rien voir du changement.

   `label` — un nom affiche devant l'identifiant — reste possible mais N'EST
   PLUS UTILISE par les trois pages depuis le 2026-08-05 : le nom a rejoint la
   boite orange, juste au-dessus, et le repeter une ligne plus bas ne disait
   rien de plus. La bleue ne porte donc que l'ISNI. Le parametre survit pour
   une page ou la fiche serait seule, sans boite d'identite au-dessus d'elle.

   Rend true si une fiche est affichee. */
function syncIsniFicheGN(isni, label){

    if(typeof showIsniFiche !== 'function') return false;   // page sans la fiche en flux

    var id = isni ? $.trim('' + isni).replace(/\s+/g, '') : '';

    /* La valeur n'est retenue que si elle a bien la forme d'un ISNI (15
       chiffres + 1 chiffre ou X) : meme regle que dans la boite violette
       d'ou elle vient, ou une donnee mal formee s'affichait telle quelle
       plutot que de devenir un lien mort. */
    if(id && /^[0-9]{15}[0-9Xx]$/.test(id)) return showIsniFiche(id, label);

    if(typeof hideIsniFiche === 'function') hideIsniFiche();
    return false;
}

/* LA BOITE D'IDENTITE DU SMA — trois pages, un seul endroit (2026-08-05).

   QUI DIT QUOI, DANS LA COLONNE. Les trois boites disaient la meme selection
   sans se partager le travail : la violette ouvrait sur « Prenom Nom / Pays »
   avant d'enumerer l'oeuvre et son palmares, l'orange comptait des elements
   sans nommer personne, et la bleue repetait le nom devant l'identifiant. Le
   nom figurait donc DEUX fois et la boite d'identite ne portait aucune
   identite.

   Chacune ne dit plus qu'une chose, et c'est la meme repartition que sur
   Overview, Network et Participation :
     - ORANGE : QUI — le nom, puis le pays en dessous ;
     - BLEUE  : son identifiant international, et rien d'autre ;
     - VIOLETTE : QUOI — l'oeuvre, son palmares, ses dates.

   La ligne de pays est produite par countryLineHtml, la meme fonction que sur
   Network : meme rendu, un seul endroit a corriger. Les enregistrements du
   SMA ne portent pas de pays d'origine (colonne id_country_origin), d'ou le
   premier argument vide — la fonction rend alors le seul pays courant.

   ORDRE D'APPEL. sma_core.js ecrit « N elements » dans la boite orange
   AVANT d'appeler getInfoFrom : cette fonction passe donc apres et gagne. Le
   compte reste affiche pour un GROUPE dont aucun membre n'est vise, ce qui
   est juste — un groupe n'est pas un compositeur. */
/* LA DUREE ARRONDIE A LA MINUTE, POUR LE REGROUPEMENT DU SMA — 2026-08-13.

   `imeb_music.duration` est un « mm:ss », et le menu « Group by » proposait
   de regrouper dessus : MESURE SUR LE FONDS ENTIER — 1 319 valeurs distinctes
   pour 6 537 oeuvres, et le plus gros paquet en compte 143. Un attribut a
   1 319 valeurs ne regroupe rien ; il fabrique autant de nœuds que d'oeuvres.
   Arrondi a la minute : **66 valeurs**, et les paquets deviennent lisibles —
   706 oeuvres a 10 min, 582 a 8 min, 512 a 12 min.

   ARRONDI ET NON TRONQUE : 11:55 vaut 12 minutes et non 11. C'est ce qui a
      ete demande, et c'est aussi ce qu'un lecteur attend d'une duree.

   DEUX VALEURS NE SONT PAS DES NOMBRES, et elles sont rendues TELLES QUELLES
      plutot que vidées : `20env` (« 20 environ », oeuvre 5634) et `illim`
      (« illimite », oeuvre 6723, une installation). Les traduire serait
      interpreter le catalogue ; les vider perdrait deux oeuvres. Elles font
      chacune leur propre paquet, ce qui est exactement ce qu'elles sont.

   DEUX OEUVRES ARRONDISSENT A ZERO — les seules sous trente secondes, la plus
      courte a 00:13. Leur paquet s'appelle « < 1 min » et non « 0 min » :
      *arrondir n'autorise pas a ecrire qu'une piece dure zero.*

   LA DUREE EXACTE N'EST PAS TOUCHEE. `duration` reste dans l'enregistrement,
      et c'est elle que la boite violette affiche a cote du titre, et le
      tableau dans sa colonne. Ce champ-ci ne sert qu'a regrouper. */
function minutesGN(duration){

    var d = (duration == null ? '' : String(duration)).trim();
    if(!d) return '';

    var m = /^(\d{1,3}):(\d{2})$/.exec(d);
    if(!m) return d;                       // « 20env », « illim » : tel quel

    var sec = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    var min = Math.round(sec / 60);
    return min < 1 ? '< 1 min' : min + ' min';
}

function displaySmaIdentityGN(target){

    if(!target) return;

    var t   = function(v){ return $.trim(v == null ? '' : String(v)); };
    // `ln` s'appelle `name` depuis le 2026-08-13 — voir la note en tete de
    // js/particles_award.js. Les TROIS pages qui appellent cette fonction ont
    // ete reprises ensemble ; overview_sma.js ne l'appelle pas et garde `ln`.
    var who = $.trim(t(target.fn) + ' ' + t(target.name));

    $("#selection").empty().append('<p>');
    $("#selection p").text(who);

    if(typeof countryLineHtml === 'function'){
        $("#selection").append(countryLineHtml('', target.ctry));
    }

    /* La fiche ISNI est ecrite ICI, avec la boite d'identite et non ailleurs :
       les deux disent la MEME selection. Tenues par deux mecanismes separes,
       elles pouvaient se contredire — une notice sous un nom qui n'est plus le
       sien. Sans label : le nom est juste au-dessus. */
    syncIsniFicheGN(target.isni);
}

/* Retirer TOUTE fiche ISNI attachee a la selection courante — celle du mode
   replie et, sur les pages qui en ont une, celle du SMA en flux. Les sites
   qui vident la boite orange n'ont ainsi qu'un appel a faire, et n'ont pas a
   savoir combien de fiches vivent dans la page. */
function hideIsniAllGN(){
    if(typeof hideIsniBox   === 'function') hideIsniBox();
    if(typeof hideIsniFiche === 'function') hideIsniFiche();
}

/* Ecrire une ligne unique dans la boite d'identite — « 12 composers »,
   « 340 elements ».

   POURQUOI CE DETOUR PLUTOT QU'UN `$("#selection p").text(txt)`.
   Depuis que la boite porte une LIGNE DE PAYS sous le nom, elle contient DEUX
   <p>. Un selecteur « #selection p » les designe tous les deux, et .text() les
   ecrit tous les deux : le nombre de compositeurs s'affichait donc DEUX FOIS
   quand on ouvrait un groupe du SMA. Le defaut date de l'ajout de la ligne de
   pays et ne se voyait que sur ce geste-la.

   On vide donc avant d'ecrire — ce que js/sma_core.js faisait deja deux lignes
   plus loin pour la meme boite, et c'est de la que vient le motif.

   La fiche ISNI part avec : un groupe n'est pas un compositeur, et laisser la
   notice du precedent sous « 12 composers » serait la meme desynchronisation
   que celle corrigee partout ailleurs le 2026-08-05. */
function setSelectionTextGN(txt){
    $("#selection").empty().append('<p>');
    $("#selection p").text(txt);
    hideIsniAllGN();
}

/* Remettre la colonne d'information a zero : plus de compositeur, donc plus de
   boite d'identite ET plus de fiche ISNI. Les deux vont ensemble — c'est tout
   l'objet du changement ci-dessus, et un `$("#selection").empty()` isole les
   separerait de nouveau. Appele par js/particles.js a la fermeture d'un groupe
   et quand une fiche n'a aucune oeuvre. */
function clearIdentityBoxGN(){
    $("#selection").empty();
    hideIsniAllGN();
}
/* Le couple « origine / pays », rendu comme la BnF l'ecrit dans ses notices
   d'autorite — « Pays : Argentine / France » — c'est-a-dire les deux a EGALITE
   et l'origine EN PREMIER.

   Pourquoi pas « France (born in Argentina) », qui etait la premiere idee : la
   colonne id_country_origin ne garantit pas un lieu de NAISSANCE. Elle porte
   selon les fiches une nationalite (Vaggione, argentin installe en France) ou
   un lieu de naissance (Jacqueline Nova Sondag, colombienne nee a Gand). La
   paire ne dit que ce qu'on sait : deux pays attaches a cette personne. Une
   formule qui affirme davantage que la donnee serait fausse quelque part.

   Rendu vide si aucun pays n'est connu — on n'ecrit jamais un separateur seul.
   Rendu du seul pays courant quand l'origine est absente, ce qui est le cas de
   3 264 fiches sur 3 269 : la ligne de pays existe pour tout le monde, la paire
   n'apparait que la ou il y a un ecart a montrer. */
function countryLineHtml(origin, ctry){

    var o = origin ? ('' + origin).replace(/^\s+|\s+$/g, '') : '';
    var c = ctry   ? ('' + ctry).replace(/^\s+|\s+$/g, '')   : '';

    if(!o && !c) return '';
    if(typeof esc !== 'function') return '';   // page sans js/isni_box.js

    var txt = (o && c) ? (o + ' / ' + c) : (o || c);

    return '<p class="sd-country">' + esc(txt) + '</p>';
}
/* =======================================================================
   LA VUE DE TRAVAIL — `?v=all` (2026-08-07)

   Deux pages retiennent quelque chose par defaut, et c'est le MEME geste :

     - Participation (js/animated_data.js) — un compositeur sans oeuvre
       archivee n'est ni nomme ni cliquable dans la liste ;
     - Overview (js/overview.js) — la recherche par nom ne rend que les
       compositeurs ayant au moins une oeuvre archivee, et le filtre
       « num of records » ne descend plus sous 1.

   Ce que les deux protegent est la meme population : les personnes dont la
   base ne connait qu'une CANDIDATURE relevee dans un proces-verbal. Une
   candidature n'est pas une publication ; un nom d'oeuvre archivee, si.

   `?v=all` dans l'adresse leve les deux a la fois : c'est la vue qui sert a
   relire le depouillement.

   UNE SEULE DEFINITION, ICI, ET NON UNE PAR PAGE. Deux copies d'une
      regle de discretion se separent a la premiere correction faite d'un
      seul cote — et se separent SILENCIEUSEMENT : la page restee en
      arriere continue de fonctionner, elle montre seulement ce que l'autre
      cache. js/functions.js est charge par les deux pages, avant leur
      script propre.

   ET C'EST UN AFFICHAGE, PAS UNE PROTECTION. php/retrieve_data.php
      continue de livrer les noms complets au navigateur : les cas 0 et 28
      ne sont pas filtres. Ce qui est gagne, c'est qu'un nom releve au
      proces-verbal ne se lise plus par-dessus l'epaule de qui regarde la
      page. Si l'exigence devient de ne pas TRANSMETTRE ces noms, elle se
      tient cote PHP, et ce commentaire devra le dire.

   Une expression reguliere plutot que URLSearchParams : le site est ecrit
   en ES5 et charge jQuery 3.1 ; on ne change pas le socle pour lire un
   parametre. */
var SHOW_ALL_NAMES = /(^|[?&])v=all([&#]|$)/.test(window.location.search || '');

/* Initiales + etoiles : « Jean-Pierre Dupont » -> « J********** D***** ».
   TOUT ce qui suit la premiere lettre d'un mot devient une etoile, traits
   d'union et apostrophes compris — les garder dessinerait la forme du nom
   (« J***-P***** D***** »), ce qui, sur un corpus ou les noms composes sont
   rares, en designe deja quelques-uns. */
function maskName(txt){
    return String(txt == null ? '' : txt)
        .split(/\s+/)
        .filter(function(mot){ return mot.length > 0; })
        .map(function(mot){
            return mot.charAt(0) + new Array(mot.length).join('*');
        })
        .join(' ');
}
//----------------------------------------------//
function dist(x1, x2, y1, y2){
	var a = x1 - x2;
	var b = y1 - y2;
	var c = Math.sqrt(a*a + b*b);
	return c;
}
function map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}
