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

    $("#selection").empty().append('<p>');

    if(isni && typeof esc === 'function'){
        $("#selection p").html(
            '<span class="composer-isni" tabindex="0" role="button"'
            + ' data-isni="'+esc(isni)+'" data-label="'+esc(txt)+'">'
            + esc(txt)+'</span>');
    } else {
        $("#selection p").text(txt);
    }

    $("#selection").append(countryLineHtml(obj.origin, obj.ctry));
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
