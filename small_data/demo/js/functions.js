//----------- index and network ----------------//

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
function displayTitlesInfosGN(arr){

    var box = $("#titles");

    bindTitlesFold();
    box.empty();

    if(arr.length>0){

        // "work" au singulier si une seule oeuvre, sans parentheses
        var label = arr.length + ' archived work' + (arr.length>1 ? 's' : '');

        box.addClass('is-folded').append(
            '<li class="t-hd"><button type="button" class="t-toggle" aria-expanded="false">'
            + label + '<span class="t-caret" aria-hidden="true"></span></button></li>');

        for (var i=0; i<arr.length; i++) {
            var obj=arr[i];
            var div='<li class="'+(i%2===0 ? 't-a' : 't-b')+'">'+obj.t;
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
        box.removeClass('is-folded').append('<li>no archived work for this composer</li>');
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

   Overview, Network et Line Charts affichent chacune une boite d'identite
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

/* Ecrire une ligne unique dans la boite d'identite — « 12 composers »,
   « 340 elements ».

   ⚠️ POURQUOI CE DETOUR PLUTOT QU'UN `$("#selection p").text(txt)`.
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
    if(typeof hideIsniBox === 'function') hideIsniBox();
}

/* Remettre la colonne d'information a zero : plus de compositeur, donc plus de
   boite d'identite ET plus de fiche ISNI. Les deux vont ensemble — c'est tout
   l'objet du changement ci-dessus, et un `$("#selection").empty()` isole les
   separerait de nouveau. Appele par js/particles.js a la fermeture d'un groupe
   et quand une fiche n'a aucune oeuvre. */
function clearIdentityBoxGN(){
    $("#selection").empty();
    if(typeof hideIsniBox === 'function') hideIsniBox();
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
