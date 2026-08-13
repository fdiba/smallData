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
        // Les deux phonotheques ont le menu "Country" + le bouton "All works",
        // ET DEPUIS LE 2026-08-11 ELLES SE COMPORTENT PAREIL : "All works"
        // affiche le SMA dans les deux, un pays le filtre, il n'est jamais
        // masque. En dessous de SMA_MIN_WORKS oeuvres, une portion-pays reste
        // sans SMA — trop peu d'agents pour un regroupement parlant.
        //
        // CE QUI ETAIT ECRIT ICI, ET POURQUOI CE N'ETAIT PAS UN OBSTACLE :
        //    « Phono A : trop d'oeuvres (~4380) pour un seul SMA (SMA.md §11)
        //      -> All works = tableau complet SANS SMA ». La crainte etait un
        //    nuage d'agents ingerable. Or LE NOMBRE D'AGENTS A L'ECRAN EST
        //    DEJA BORNE, et depuis toujours : sma_animation() n'ajoute une
        //    particule que tant que `particles.length < numberOfNodesOnDisplayMax`
        //    (js/sma_core.js), valeur que cette page-ci porte a 400 des sa
        //    quatrieme ligne. Les 4 380 oeuvres ne font donc pas 4 380 agents :
        //    elles se repartissent sur QUATRE CENTS, chacun portant plusieurs
        //    enregistrements qu'il defile (`particles[i].records.pop()`).
        //    *La borne existait ; c'est la regle qui l'ignorait.*
        //
        // CE QUE CA COUTE QUAND MEME, et qui reste vrai : la reponse AJAX
        //    porte les 4 380 oeuvres, le tableau les insere par lots de 200, et
        //    le regroupement par propriete travaille sur cette masse. La page
        //    est plus lente a s'etablir en Phono A "All works" qu'en Phono B.
        //    C'est un cout de CONSTRUCTION, pas d'animation.
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

    //  2026-08-11 : les deux phonotheques construisent le SMA, y compris
    //     Phono A en "All works" (voir le commentaire de window.onload).
    //     Auparavant : `(cat == 2) || (cat == 1 && (+country) > 0)`.
    var doSMA  = (cat == 1 || cat == 2);
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
        //  LA BRANCHE QUI MASQUAIT LE CANVAS EN PHONO A "All works" EST
        //     RETIREE — 2026-08-11. Les deux phonotheques passent desormais par
        //     la meme regle : le SMA s'affiche des que la portion compte au
        //     moins SMA_MIN_WORKS oeuvres, et "All works" en compte toujours
        //     assez. Le nombre d'agents a l'ecran reste borne par
        //     numberOfNodesOnDisplayMax (400), qui est ce qui rendait la
        //     precaution inutile.
        if(cat == 1 || cat == 2){
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
                /* « (provisionnal count) » RETIRE LE 2026-08-08, et le
                   nombre porte desormais son unite. Deux raisons :

                     - la mention ne paraissait que sur la branche
                       `cat != null`, c'est-a-dire TOUJOURS : catalog.php ne
                       s'ouvre qu'avec un id de phonotheque, 1 ou 2, et
                       l'autre branche n'a jamais servi. Une reserve affichee
                       dans tous les cas ne distingue plus rien ;
                     - un nombre nu ne dit pas de quoi il est le nombre.
                       js/aww.js ecrit deja « N works » (§23.13) ; c'est
                       cette forme qui est reprise ici et sur euphonies.js,
                       pour que les quatre pages comptent de la meme facon. */
                $("#info").append("<p>" + total + " works</p>");
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

/* Le panneau lateral, ses gestionnaires et sa regle de fermeture sont
   fournis par js/isni_box.js (enableIsniPanel) : ce bloc y etait ecrit en
   entier, et award-winning_works.php en aurait fait une seconde copie. Ne
   restent ici que les parametres propres a cette page.

     anchors   les deux tableaux et la legende — le panneau se cale a droite
               du plus a droite d'entre eux, soit le bord de la bande de
               1210 px, sans recouvrir un pixel du contenu
     clickable les noms de compositeurs du tableau (span.composer-isni, pose
               par renderChunk pour les seuls artistes dont l'ISNI est
               renseigne)
     watch     #infos, qui porte les boites verte, orange et violette du SMA :
               le panneau les recouvre, il se referme donc quand elles
               changent — sauf quand seul le compteur de chargement du SMA
               bouge (« 58 nodes 77% »), cf. js/isni_box.js */
$(function(){
    if(typeof enableIsniPanel !== 'function') return;   // isni_box.js absent
    enableIsniPanel({
        anchors:   ['works_table', 'works_table_2', 'legend'],
        clickable: '#main_table .composer-isni',
        watch:     'infos'
    });

    /* LA FICHE DU SMA — une SECONDE fiche, et non un second point d'entree
       vers le panneau ci-dessus (2026-08-05). Meme changement que sur
       award-winning_works.php, pour la meme raison : le panneau recouvre les
       boites d'information et devait donc se refermer des qu'elles bougent,
       c'est-a-dire au clic meme qui l'ouvrait depuis le SMA.

       La fiche du SMA est desormais rendue EN FLUX dans la colonne, entre la
       boite orange et la boite violette — dispositif d'Overview, Network et
       Line Charts : elle s'affiche seule des qu'un agent porte un ISNI,
       repliee sur l'identifiant, et rien n'est demande au proxy avant le
       depliage. Le panneau du tableau, lui, ne change pas : deux objets, deux
       etats, un seul cache de session en commun.

       La div est posee sans condition dans le HTML, y compris pour les fonds
       sans SMA : vide, elle ne mesure rien. */
    if(typeof enableIsniInflowFiche === 'function'){
        enableIsniInflowFiche({ into: 'isniColumn' });
    }
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
        /* PAS DE QUATRE DEPUIS LE 2026-08-12 — php/retrieve_countries.php
           transporte desormais `iso3` en quatrieme champ, pour `?ctry=FRA`.
           Un pas reste a trois decalerait la lecture des le deuxieme pays,
           silencieusement. C'est le defaut du `case 0` de retrieve_data.php,
           dont le pas est passe de 4 a 5 puis a 6. */
        var arr = str.split("%");
        for(var k = 0; k + 3 < arr.length; k += 4){
            var cid = arr[k], cname = arr[k+1], cnt = arr[k+2], ciso = arr[k+3];
            var li = $('<li></li>')
                       .attr("data-cid", cid)
                       .attr("data-iso", (ciso || '').toUpperCase())
                       .text(cname + " (" + cnt + ")")
                       .css("text-decoration", "underline");
            (function(id, nm, el){
                el.on("click", function(){ selectCountry(id, nm, el); });
            })(cid, cname, li);
            ul.append(li);
        }
        /* Le menu existe : l'adresse peut etre appliquee. Pas avant — la
           liste blanche est le menu lui-meme. */
        appliquerPaysDeLUrl();
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
    ecrirePaysDansLUrl(liEl ? liEl.attr('data-iso') : isoDuCid(cid));
}

//------------------------------------------------------------------
// LE PAYS DANS L'ADRESSE — `?ctry=FRA`
//------------------------------------------------------------------
/* LE CODE DE L'URL N'ATTEINT JAMAIS LA BASE. `?ctry=` est cherche dans
   le MENU deja construit, et ce qui part vers php/retrieve_data.php est
   l'IDENTIFIANT NUMERIQUE du pays trouve la — jamais la chaine de l'adresse.
   Il n'y a donc rien a echapper : la valeur etrangere s'arrete au menu.
   *La donnee la mieux protegee d'une injection est celle qui n'atteint pas le
   SQL.*

   Deux barrieres quand meme :
        1. la FORME — exactement trois lettres, `^[A-Za-z]{3}$` ;
        2. la LISTE BLANCHE — le code doit etre l'`iso3` d'un pays du menu,
           donc de la phonotheque courante. `?ctry=XXX`, `?ctry=<script>` et
           `?ctry=FRA` sur une phono ou la France n'a rien tombent pareil : sur
           « All works ».
      Deux pays du referentiel n'ont pas d'iso3 : ils ne sont pas
         adressables, et l'URL ne s'ecrit pas pour eux plutot que d'inventer un
         code.

   ET `?id=` EST PRESERVE. catalog.php porte deja la phonotheque dans son
      adresse ; ecrire `?ctry=` en l'ecrasant renverrait le lecteur sur l'autre
      catalogue au premier rechargement. Les deux parametres cohabitent.

   `replaceState` et non `pushState` : choisir un pays est un filtre, pas
      une navigation (meme raison que sur award-winning_works.php). */
function isoDuCid(cid){
    var el = $("#countries ul li[data-cid='" + String(cid).replace(/'/g, "") + "']");
    return el.length ? el.attr('data-iso') : '';
}
function paysDemande(){
    var m = /[?&]ctry=([^&#]*)/.exec(window.location.search || '');
    if(!m) return null;
    var brut;
    try{ brut = decodeURIComponent(m[1]); }catch(e){ return null; }
    if(!/^[A-Za-z]{3}$/.test(brut)) return null;          // barriere 1 : la forme
    var iso = brut.toUpperCase(), trouve = null;
    $("#countries ul li[data-iso]").each(function(){       // barriere 2 : le menu
        if(!trouve && $(this).attr('data-iso') === iso) trouve = $(this);
    });
    return trouve;
}
function ecrirePaysDansLUrl(iso){
    if(!window.history || !window.history.replaceState) return;   // vieux moteur : on ne casse rien
    var q = [];
    var mid = /[?&]id=(\d+)/.exec(window.location.search || '');
    if(mid) q.push('id=' + mid[1]);                                // la phonotheque d'abord
    if(iso) q.push('ctry=' + encodeURIComponent(String(iso).toUpperCase()));
    var url = window.location.pathname + (q.length ? '?' + q.join('&') : '');
    if(url === window.location.pathname + window.location.search) return;
    try{ window.history.replaceState({ctry: iso || null}, '', url); }catch(e){}
}
function appliquerPaysDeLUrl(){
    var li = paysDemande();
    if(!li) return;                    // rien a faire : la page est deja sur "All works"
    selectCountry(li.attr('data-cid'), li.text().replace(/\s*\(\d+\)\s*$/, ''), li);
}
window.onpopstate = function(){
    if($("#countries ul li[data-iso]").length){
        var li = paysDemande();
        if(li) appliquerPaysDeLUrl(); else showFullTable();
    }
};

// Bouton "All works" : tableau complet. Phono A -> canvas masque (retrieveData) ;
// Phono B -> SMA sur tout (retrieveData montre le canvas).
function showFullTable(){
    resetSMAForPortion();
    clearCatalogTable();
    $("#countries ul li").css("font-weight", "normal");
    $("#countries ul li.all-works").css("font-weight", "bold");
    retrieveData(_catId, 11, 0);  // country=0 -> Phono A: pas de SMA ; Phono B: SMA sur tout
    ecrirePaysDansLUrl(null);
}
