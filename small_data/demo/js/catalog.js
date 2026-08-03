//---- Catalogues (International / IMEB Sound Archives) — logique propre a la page.
//---- L'etat et les fonctions du SMA sont dans js/sma_core.js.

numberOfNodesOnDisplayMax = 400;

// Phono A : en dessous de ce nombre d'OEUVRES, une portion-pays n'affiche pas le
// SMA (trop peu d'agents pour un regroupement parlant) — seul le tableau filtre
// s'affiche. (C'est le nombre affiche entre parentheses dans le menu Country.)
var SMA_MIN_WORKS = 20;

// id de la phonotheque courante (1 = Phono A, 2 = Phono B), lu au chargement et
// reutilise par le menu Country (selectCountry / showFullTable).
var _catId = 0;

window.onload = function() {

	var cat = $.urlParam('id');
	_catId = parseInt(cat, 10) || 0;

    if(cat==1 || cat==2){
        // Les deux phonotheques ont le menu "Country" + le bouton "All works".
        // Difference de DEFAUT :
        //  - Phono A (id=1) : trop d'oeuvres (~4380) pour un seul SMA (SMA.md §11)
        //    -> "All works" = tableau complet SANS SMA ; le SMA n'apparait qu'en
        //    choisissant un pays (et si >= SMA_MIN_WORKS oeuvres).
        //  - Phono B (id=2) : petit fonds (~470) -> "All works" affiche le SMA sur
        //    TOUT par defaut ; un pays filtre. Le SMA n'est jamais masque.
        initSMA(1210, 800);   // largeur = 2 tableaux (600) + gap (10) -> bord droit aligne
        startSMA();               // boucle lancee UNE seule fois
        buildCountryMenu();       // remplit le menu "Country" (pays de la bonne phono)
        retrieveData(cat, 11, 0);  // etat initial = "All works" (retrieveData gere le canvas)

    } else {
        retrieveData(-999, 11);
    }

};

//incremente a chaque nouveau chargement (clic pays / tableau complet) : une
//reponse AJAX arrivee en retard est ignoree si un autre chargement a ete
//lance entre-temps (evite de melanger deux portions).
var _catLoadSeq = 0;

function retrieveData(cat, numOfElements, country){

    var doSMA  = (cat == 2) || (cat == 1 && (+country) > 0);
    var myLoad = ++_catLoadSeq;

    var CHUNK = 200;   // nombre de lignes inserees par lot

    $("#info").append('<p id="loading">loading…</p>');

    $.ajax({
        url: 'php/retrieve_cat.php',
        type: "POST",
        data: {cat: cat, country: country || 0}

    }).done(function(str) {

        if(myLoad !== _catLoadSeq) return;   // chargement perime : on abandonne

        var arr = str.split("%");

        $("#listing").append('<ul></ul>');

        // Les donnees arrivent triees par compositeur (nom, prenom) puis titre.
        // 11 champs par oeuvre depuis l'ajout, tous en FIN d'enregistrement,
        // du pays (arr[k+7]), de l'ISNI (arr[k+8]), des annees de programmation
        // (arr[k+9]) et de l'annee de concours (arr[k+10]) — voir
        // php/retrieve_cat.php, fonction retrieve_cat. numOfElements est passe
        // par les appelants et doit rester synchronise avec le PHP.
        var works = [];
        for (var k = 0; k + numOfElements - 1 < arr.length; k += numOfElements) {
            works.push({misam: arr[k], fn: arr[k+1], ln: arr[k+2],
                        id_artist: arr[k+3], title: arr[k+4],
                        duration: arr[k+5], id: arr[k+6], ctry: arr[k+7],
                        isni: arr[k+8], editions: arr[k+9], award: arr[k+10]});
        }
        var total = works.length;

        // Le pays s'affiche sous le nom du compositeur UNIQUEMENT en vue
        // "All works" (country == 0). Des qu'un pays est selectionne dans le
        // menu Country, il est deja rappele dans #cookies et serait identique
        // sur toutes les lignes : l'afficher n'apprendrait rien et alourdirait
        // la colonne.
        var showCtry = !((+country) > 0);

        // Visibilite du SMA + du canvas.
        var showSMA = doSMA;
        if(cat == 1 && (+country) === 0){
            // Phono A "All works" : trop d'oeuvres (~4380) pour un seul SMA
            // (SMA.md §11) -> jamais de SMA, tableau seul.
            showSMA = false;
            $("#myCanvas").hide();
            $("#infos").hide();
            $("#sma_note").hide();
        } else if(cat == 1 || cat == 2){
            // Portion (un pays, ou "tout" en Phono B) : SMA seulement si assez
            // d'oeuvres. MEME SEUIL SMA_MIN_WORKS pour les deux phonotheques.
            showSMA = (total >= SMA_MIN_WORKS);
            if(showSMA){
                $("#sma_note").hide();
                $("#myCanvas").show();
                $("#infos").show();
            } else {
                $("#myCanvas").hide();
                $("#infos").hide();
                $("#sma_note").text('Too few works (' + total + ') to build the visualization — showing the table only.').show();
            }
        }

        // Longueur de chaque serie contigue d'oeuvres d'un meme compositeur,
        // pour le rowspan de la cellule composer. Calculee sur les series
        // reellement contigues : si un artiste apparait en plusieurs blocs
        // (fiche en double, tri imparfait), chaque bloc a sa propre cellule
        // au lieu de casser la mise en page.
        var runLength = [];
        for (var k = works.length - 1; k >= 0; k--) {
            if(k < works.length - 1 && works[k].id_artist === works[k+1].id_artist){
                runLength[k] = runLength[k+1] + 1;
            } else {
                runLength[k] = 1;
            }
        }

        var table  = document.getElementById('works_table');
        var table2 = document.getElementById('works_table_2');
        // Toutes les lignes d'un meme tableau doivent aller dans le meme tbody :
        // une insertion directe sur <table> cree un tbody par lot, et un rowspan
        // ne peut pas s'etendre d'un tbody a l'autre (colonnes decalees).
        var tbodyA = table.tBodies[0] || table;
        var tbodyB = table2 ? (table2.tBodies[0] || table2) : null;

        // --- repartition sur deux colonnes cote a cote ---
        // On coupe la liste en deux a une FRONTIERE DE COMPOSITEUR (jamais au
        // milieu d'un groupe, sinon le rowspan de la cellule compositeur serait
        // casse). Le point de coupure est le premier debut de groupe atteint
        // apres la moitie des lignes, pour equilibrer la hauteur des colonnes.
        var splitIndex = works.length;   // defaut : tout dans la colonne de gauche
        if(table2 && works.length > 1){
            var half = works.length / 2;
            var best = -1, bestDist = Infinity;
            for (var s = 1; s < works.length; s++) {
                if(works[s].id_artist !== works[s-1].id_artist){
                    var d = Math.abs(s - half);
                    if(d < bestDist){ bestDist = d; best = s; }
                }
            }
            if(best !== -1) splitIndex = best;   // sinon (1 seul compositeur) tout a gauche
        }

        var i = 0;
        var prevArtist = null;
        var groupIndex = -1;
        var memberIndex = 0;

        // Affichage par lots : le tableau se remplit progressivement
        // et le navigateur reste reactif entre deux lots.
        function renderChunk(){

            if(myLoad !== _catLoadSeq) return;   // un autre chargement a demarre : stop

            var htmlA = "", htmlB = "";
            var stop = Math.min(i + CHUNK, works.length);

            for (; i < stop; i++) {

                var w = works[i];

                //--------- SMA : Phono B (tout) ou Phono A filtree par pays
                //           (seulement si assez de compositeurs, cf. showSMA)
                if(showSMA){
                    // ctry et isni alimentent la boite violette
                    // (Particle.prototype.getInfoFrom). ATTENTION : l'ajout
                    // d'une propriete au SMA se declare a QUATRE endroits —
                    // ici, puis dans js/particles_catalog.js (champ du
                    // constructeur, litteral this.records, et createNewChild)
                    // et dans js/childs_catalog.js.
                    records.push({imeb_id: w.misam, fn: w.fn, ln: w.ln,
                                  id: w.id,
                                  title: w.title, duration: w.duration,
                                  ctry: w.ctry, isni: w.isni,
                                  editions: w.editions});
                }
                //---------

                // Une seule cellule par compositeur, etendue sur toutes ses oeuvres.
                var newGroup = (w.id_artist !== prevArtist);
                if(newGroup){ groupIndex++; memberIndex = 0; prevArtist = w.id_artist; }
                else { memberIndex++; }

                // Meme code couleur que award-winning_works.php :
                //  - la cellule compositeur (fusionnee) prend une teinte alternee par groupe
                //  - chaque oeuvre d'un meme compositeur recoit une teinte alternee
                var grpParity = (groupIndex % 2 === 0) ? 'grp-cell-a' : 'grp-cell-b';
                var memParity = ((groupIndex + memberIndex) % 2 === 0) ? 'mem-a' : 'mem-b';

                var row = newGroup ? '<tr class="group-start">' : '<tr>';

                if(newGroup){
                    // Le pays vient en seconde ligne DANS la cellule compositeur
                    // (deja fusionnee sur toutes les oeuvres de l'artiste) : pas
                    // de colonne supplementaire, la largeur du tableau ne bouge
                    // pas. Un artiste sans pays rattache n'a tout simplement pas
                    // cette seconde ligne.
                    // Le nom devient cliquable pour les seuls compositeurs dont
                    // l'ISNI est renseigne : rien n'invite a cliquer la ou il
                    // n'y a rien a ouvrir. Le repere est un souligne pointille
                    // qui passe en continu au survol, comme les noms du
                    // diagramme de flux (categories.php).
                    // L'attribut porte sur un <span> et non sur la cellule :
                    // celle-ci contient aussi la ligne de pays, qui n'a pas a
                    // etre soulignee ni cliquable.
                    var fullName = w.fn + ' ' + w.ln;
                    var composer = w.isni
                        ? '<span class="composer-isni" role="button" tabindex="0" data-isni="'
                          + esc(w.isni) + '" data-label="' + esc(fullName) + '">'
                          + fullName + '</span>'
                        : fullName;
                    if(showCtry && w.ctry){
                        composer += '<span class="composer-ctry">' + w.ctry + '</span>';
                    }
                    row += '<td class="composer grp-cell ' + grpParity + '" rowspan="' + runLength[i] + '">'
                          + composer + '</td>';
                }

                // Marqueur des oeuvres primees : une etoile discrete APRES le
                // titre, pour ne pas gener la lecture alphabetique. Elle ne
                // cree pas de colonne (9 % de la Phono A, 4 % de la Phono B :
                // une colonne serait vide presque partout). Le detail du
                // palmares reste sur award-winning_works.php.
                var titleCell = w.title;
                if(w.award){
                    titleCell += ' <span class="work-award" title="awarded at the '
                              + w.award + ' competition">&#9733;</span>';
                }

                // Derniere colonne : les annees de programmation, a la place de
                // l'ancienne colonne "imeb id" (le MISAM reste transporte dans
                // works et dans le SMA, il n'est simplement plus affiche).
                // La virgule du stockage ("1980,1992") recoit une espace pour
                // rester lisible ; la cellule est vide quand la donnee manque.
                var editionsCell = w.editions ? w.editions.replace(/\s*,\s*/g, ', ') : '';

                // "duration" et "edition(s)" portent une classe propre : la
                // cellule compositeur etant fusionnee (rowspan), une ligne de
                // tete a quatre <td> quand une ligne membre n'en a que trois,
                // et un selecteur positionnel (nth-child) ne viserait donc pas
                // la meme colonne d'une ligne a l'autre. Voir css/catalog.css.
                row += '<td class="' + memParity + '">' + titleCell + '</td>'
                      + '<td class="' + memParity + ' work-dur">' + w.duration + '</td>'
                      + '<td class="' + memParity + ' work-ed">' + editionsCell + '</td></tr>';

                // avant le point de coupure -> colonne de gauche, sinon droite
                if(i < splitIndex) htmlA += row; else htmlB += row;
            }

            // Une seule insertion par lot et par colonne
            if(htmlA) tbodyA.insertAdjacentHTML('beforeend', htmlA);
            if(htmlB && tbodyB) tbodyB.insertAdjacentHTML('beforeend', htmlB);

            $("#loading").text(Math.min(i, total) + " / " + total);

            if(i < works.length){
                setTimeout(renderChunk, 0);
            } else {
                $("#loading").remove();
                // si tout tient dans la colonne de gauche, on masque la seconde
                if(table2 && splitIndex >= works.length){ table2.classList.add('is-empty'); }
                if(cat != null){
                    $("#info").append("<p>" + total + " (provisionnal count)</p>");
                } else {
                    $("#info").append("<p>" + total + "</p>");
                }
            }
        }

        renderChunk();

    }).fail(function(){
        $("#loading").text("loading failed");
    });

}

/* =========================================================================
   Fiche ISNI — le code de la boite est desormais dans js/isni_box.js, seule
   copie pour les quatre pages qui l'affichent (award-winning_works.php,
   catalog.php, categories.php, euphonies.php). Il figurait ici a l'identique,
   octet pour octet, comme dans les trois autres.

   Ne restent ici que les points d'entree, propres a cette page. Il y en a
   DEUX, et ils aboutissent au meme endroit :
     - le NOM du compositeur dans le tableau (span.composer-isni, pose par
       renderChunk pour les seuls artistes dont l'ISNI est renseigne) ;
     - l'ISNI affiche dans la boite violette du SMA
       (Particle.prototype.getInfoFrom, js/particles_catalog.js).

   Sur cette page la fiche n'est pas une boite flottante mais un PANNEAU
   ancre a droite des tableaux : setIsniDock() le declare une fois pour
   toutes, donc les deux entrees s'y affichent sans que le second ait a etre
   modifie. Les tableaux, le canvas et la legende ne bougent pas d'un pixel :
   le panneau est en position fixe, hors flux, dans la place libre a droite
   de la bande de 1210 px.
   ========================================================================= */

/* Le conteneur est cree ici plutot que dans catalog.php : sans JavaScript il
   n'y aurait rien a y mettre, et une <div> vide dans le HTML serait un
   promesse non tenue. */
function ensureIsniPanel(){

    if(typeof setIsniDock !== 'function') return null;   // isni_box.js absent

    var p = document.getElementById('isniPanel');
    if(p) return p;

    p = document.createElement('div');
    p.id = 'isniPanel';
    document.body.appendChild(p);
    setIsniDock('#isniPanel');
    return p;
}

/* Le panneau se cale juste a DROITE des tableaux, pas au bord de la fenetre :
   il se lit alors comme une troisieme colonne alignee sur la bande de contenu.
   S'il n'y a pas la place, il se rabat contre le bord droit et recouvre la fin
   des tableaux — c'est le compromis accepte pour ne jamais deplacer la mise en
   page. La mesure est refaite au redimensionnement ET au defilement : le
   panneau est en position fixe, un defilement horizontal decalerait les
   tableaux sous lui. */
function positionIsniPanel(){

    var p = document.getElementById('isniPanel');
    if(!p) return;

    var right = 0;
    ['works_table', 'works_table_2', 'legend'].forEach(function(id){
        var e = document.getElementById(id);
        if(!e || e.offsetParent === null) return;          // absent ou masque
        var r = e.getBoundingClientRect();
        if(r.width > 0 && r.right > right) right = r.right;
    });
    if(right <= 0) return;

    var w    = p.offsetWidth || 340;
    var left = right + 10;
    if(left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8);
    p.style.left = Math.round(left) + 'px';
}

$(function(){

    if(!ensureIsniPanel()) return;

    positionIsniPanel();
    $(window).on('resize.isnipanel scroll.isnipanel', positionIsniPanel);

    // Les trois boites d'information du SMA — verte (#cookies), orange
    // (#selection) et violette (#titles) — vivent dans #infos, a droite du
    // canvas, c'est-a-dire EXACTEMENT sous le panneau : mesure prise sur la
    // page, #infos occupe 1222-1332 px et le panneau 1230-1570. Il les
    // recouvre donc entierement. Le panneau se referme des que l'une d'elles
    // change : on ne laisse pas une fiche masquer la reponse au clic qu'on
    // vient de faire.
    //
    // Un observateur plutot qu'un appel a closeIsniBox() pose dans chaque
    // ecrivain : ceux-ci sont repartis entre js/particles_catalog.js et
    // js/childs_catalog.js, et un futur ecrivain oublierait la consigne — le
    // defaut de l'en-tete « imeb id » (§J du recapitulatif) etait exactement
    // de cette famille. Mesure faite avant de choisir : SMA en marche, sans
    // aucune interaction, #infos ne bouge pas pendant 8 s. L'observateur ne
    // se declenche donc jamais tout seul.
    //
    // EXCEPTION — la phase 1. Tant que le SMA partage les proprietes, les
    // agents sont crees UN PAR IMAGE (sma_core.js, sma_animation ->
    // addParticleUsing), et chaque creation reecrit le compteur de la boite
    // verte : « 213 nodes 54% », trente fois par seconde. Fermer la fiche sur
    // ces mutations la rendrait inutilisable pendant tout le chargement — ce
    // n'est pas une reponse a un clic, c'est un compteur qui tourne.
    // Le test de phase est celui du noyau (sma_core.js, sma_animation ligne
    // 384) : sl_attribute vide = phase 1, renseigne = phase 2 (regroupement).
    // Le choix d'une propriete de regroupement, lui, ferme bien la fiche :
    // setCommonAttr() vide les trois boites AVANT d'affecter sl_attribute,
    // mais un rappel d'observateur est une micro-tache — il s'execute apres la
    // fin de la fonction, donc apres l'affectation, et voit la phase 2.
    var infos = document.getElementById('infos');
    if(infos && window.MutationObserver){
        new MutationObserver(function(){
            if(typeof sl_attribute !== 'undefined' && String(sl_attribute) === '') return;
            closeIsniBox();
        }).observe(infos, {childList: true, subtree: true, characterData: true});
    }

    // Delegue : les lignes sont inserees par lots (renderChunk), un
    // gestionnaire pose sur chaque cellule serait a reposer a chaque lot.
    $(document).on('click', '#main_table .composer-isni', function(evt){
        evt.stopPropagation();
        positionIsniPanel();
        openIsniBox($(this));
    });

    $(document).on('keydown', '#main_table .composer-isni', function(evt){
        if(evt.key !== 'Enter' && evt.key !== ' ' && evt.key !== 'Spacebar') return;
        evt.preventDefault();
        evt.stopPropagation();
        positionIsniPanel();
        openIsniBox($(this));
    });

});

//====================================================================
// Phono A (id=1) : navigation PAR PAYS
//--------------------------------------------------------------------
// Le fonds A (~4380 oeuvres) est trop grand pour un seul SMA (voir SMA.md
// §11). On affiche une PORTION a la fois : les oeuvres d'un pays. 63 pays
// sur 65 tiennent sous le plafond (<= 400 oeuvres) et se consolident
// entierement ; USA (614) et France (573) debordent et sont ecoules par le
// flux progressif existant. Changer de pays remet le SMA a zero.
//====================================================================

// Remet a zero le SMA pour charger une nouvelle portion (nouveau pays).
function resetSMAForPortion(){
    resetAll();                 // pointer001=0, particles=[], sl_attribute="", attributes_count=[], menu "Group by" vide...
    records = [];               // ...mais resetAll ne vide pas le pool : on le fait ici
    $("#calculations ul").empty();
    $("#cookies").empty();
    $("#titles").empty();
    $("#selection").empty();
    $("#sma_note").hide();      // masque une eventuelle note "trop peu de compositeurs"
}

// Vide la table d'oeuvres (garde les entetes) avant de la reconstruire.
//
// L'entete n'est PAS reecrite ici : on retire les lignes de donnees et on
// laisse en place la premiere ligne, celle que catalog.php a ecrite. Cette
// fonction reconstruisait auparavant le tableau entier a partir d'une chaine
// en dur, restee sur l'ancienne colonne "imeb id" : la colonne "edition(s)"
// qui l'a remplacee dans catalog.php reprenait donc son ancien nom des qu'on
// choisissait un pays ou revenait a "All works". Une seule source pour
// l'entete — le HTML — supprime la possibilite meme de cette derive.
function clearRowsBelowHeader(t){
    // deleteRow(1) plutot que innerHTML : l'entete conserve son identite et
    // ses eventuels attributs, et le tbody implicite du navigateur, dans
    // lequel renderChunk insere ensuite les lignes, n'est pas detruit.
    while(t.rows.length > 1) t.deleteRow(1);
}
function clearCatalogTable(){
    var t1 = document.getElementById('works_table');
    var t2 = document.getElementById('works_table_2');
    if(t1){ clearRowsBelowHeader(t1); t1.classList.remove('is-empty'); }
    if(t2){ clearRowsBelowHeader(t2); t2.classList.remove('is-empty'); }
    $("#listing").empty();
    $("#loading").remove();
    $("#info p").not(':first').remove();   // enleve les compteurs, garde le <p> d'origine
}

// Construit le menu "Country" a partir de php/retrieve_countries.php
// (pays de la phonotheque courante _catId).
function buildCountryMenu(){
    $.ajax({ url: 'php/retrieve_countries.php', type: "POST", data: { cat: _catId } })
     .done(function(str){
        var ul = $("#countries ul");
        ul.empty();

        // bouton : "All works" -> tableau complet (+ SMA sur tout en Phono B).
        // Actif par defaut (etat de depart de la page).
        var allLi = $('<li class="all-works">All works (full table)</li>')
                      .css("text-decoration", "underline")
                      .css("font-weight", "bold");
        allLi.on("click", showFullTable);
        ul.append(allLi);

        if(!str) return;
        var arr = str.split("%");
        for(var k = 0; k + 2 < arr.length; k += 3){
            var cid = arr[k], cname = arr[k+1], cnt = arr[k+2];
            var li = $('<li></li>')
                       .attr("data-cid", cid)
                       .text(cname + " (" + cnt + ")")
                       .css("text-decoration", "underline");
            (function(id, nm, el){
                el.on("click", function(){ selectCountry(id, nm, el); });
            })(cid, cname, li);
            ul.append(li);
        }
     })
     .fail(function(){
        $("#countries ul").empty().append('<li>countries: loading failed</li>');
     });
}

// Clic sur un pays : reset SMA + table, puis chargement de la portion.
// La visibilite du canvas est decidee dans retrieveData (seuil SMA_MIN_WORKS en
// Phono A ; toujours affiche en Phono B).
function selectCountry(cid, name, liEl){
    resetSMAForPortion();
    clearCatalogTable();
    $("#countries ul li").css("font-weight", "normal");
    if(liEl) liEl.css("font-weight", "bold");
    $("#cookies").empty().append('<p>country: ' + name + '</p>');
    retrieveData(_catId, 11, cid); // filtre la table + (selon la phono) alimente le SMA
}

// Bouton "All works" : tableau complet. Phono A -> canvas masque (retrieveData) ;
// Phono B -> SMA sur tout (retrieveData montre le canvas).
function showFullTable(){
    resetSMAForPortion();
    clearCatalogTable();
    $("#countries ul li").css("font-weight", "normal");
    $("#countries ul li.all-works").css("font-weight", "bold");
    retrieveData(_catId, 11, 0);  // country=0 -> Phono A: pas de SMA ; Phono B: SMA sur tout
}
