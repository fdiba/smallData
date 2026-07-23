# Le système multi-agents (SMA) de *small Data*

Document de référence pour comprendre et continuer à améliorer l'animation à
agents (les « cercles ») utilisée dans les visualisations IMEB.

Dernière mise à jour : 2026-07-22.

---

## 1. Où ça tourne

Le SMA anime un `<canvas>` où chaque **agent** (cercle) porte une ou plusieurs
œuvres de la base. Il est présent sur :

- **`catalog.php?id=2`** — Phonothèque B (IMEB Sound Archives). C'est la page
  de référence, avec `particles_catalog.js` + `childs_catalog.js`.
- `catalog.php?id=1` — Phonothèque A : le canvas est **masqué** (`$("#myCanvas").hide()`
  dans `catalog.js`), seule la table s'affiche. Le SMA ne tourne pas.
- Autres pages avec le **même moteur** : `award-winning_works.php`
  (`particles_award.js`), `euphonies.php` (`particles_euphonies.js`),
  `network.php` (`particles.js`), et l'index interactif
  (`particles_interactive_index.js`).

> **État du portage (2026-07-22)** : tous les réglages de §7 ont été reportés sur
> `particles_award.js` et `particles_euphonies.js` (copies quasi identiques de
> catalog) **et** sur `particles.js` (network — variante : `ids`/`label` au lieu
> de `records`/`targetedAttr`, boucle propre dans `network.js`). `avoidGroupsAhead`
> y est actif, et network est **aligné sur catalog** : `GREY_NOISE = .35`, bruit de
> phase 1 = `10` et phase 2 = `5` (dans `network.js`). Le **coussin de bord**
> (groupes) et l'**hystérésis du wrap** (gris) sont désormais sur les **quatre**
> fichiers. **Non porté** : `particles_interactive_index.js` (modèle différent, à
> « range », sans fusion/séparation classique — les réglages ne s'y appliquent pas).

---

## 2. Carte des fichiers

| Fichier | Rôle |
|---|---|
| `js/sma_core.js` | Noyau partagé : état global, boucle d'animation, deux phases, interactions (clic, reset, pause, touche `p`). |
| `js/particles_catalog.js` | Classe `Particle` = un agent (cercle gris/vert/jaune). Toute la physique de déplacement, de fusion et d'ouverture. |
| `js/childs_catalog.js` | Classe `Child` = un membre (cercle bleu) affiché **à l'intérieur** d'un groupe ouvert (jaune). |
| `js/functions.js` | Utilitaires (dont `dist(x1,x2,y1,y2)`, `$.urlParam`). |
| `lib/perlin.js` | Bruit de Perlin (`noise.perlin2`, `noise.perlin3`, `noise.seed`) — mouvement organique. |
| `js/variables.js` | Constantes globales : `COLORS`, `ENGLISH`. |
| `php/retrieve_cat.php` | Renvoie les œuvres de la phonothèque, sérialisées en une chaîne séparée par `%`. |

Chargement (dans `catalog.php`) : jQuery → perlin → variables → functions →
**sma_core** → childs_catalog → particles_catalog → catalog.js.

---

## 3. Du côté données

`catalog.js` (pour `id==2`) appelle `initSMA(1200,800)` puis `startSMA()`.
`retrieveData` récupère la chaîne de `retrieve_cat.php`, la découpe par `%` en
enregistrements de 7 champs (`misam, fn, ln, id_artist, title, duration, id`) et
remplit le tableau global **`records`**.

`sma_animation()` (30 images/s, via `setInterval`) crée **progressivement** un
agent par enregistrement (`addParticleUsing` → `createNewParticle`), tant que
`particles.length < numberOfNodesOnDisplayMax` (surchargé à **400** dans
`catalog.js`).

---

## 4. La boucle d'animation : deux phases

`sma_animation()` bascule selon `sl_attribute` (la propriété choisie dans le
menu « Group by ») :

### Phase 1 — partage d'information (`sl_attribute` vide) → `shareInformation()`
Les agents errent (champ de bruit), et pour chaque paire proche on cherche des
**attributs communs** (`SearchCommonsAttrAndGetAwayFrom`). Les attributs
suffisamment fréquents remontent dans le menu (`checkAttributes` →
`attr_treshold`). C'est la phase « exploratoire ».

### Phase 2 — regroupement (`sl_attribute` renseigné) → `allowGrouping()`
Une fois une propriété choisie (ex. `ln`, le nom de compositeur), les agents
sont **activés progressivement** (`on = true`, `targetedAttr = sl_attribute`) et
`update(i, particles)` fait le vrai travail : rapprochement des mêmes valeurs,
**fusion**, évitement des autres, ouverture au clic.

`breakConnections()` (changement de propriété dans le menu) casse tous les
groupes et réinitialise chaque agent (`resetIt`).

---

## 5. États d'un agent et code couleur

Un `Particle` change d'apparence selon son contenu (`records.length`) et son état
(`open`). Couleurs dans `this.colors` :

| Couleur | Constante | Signification |
|---|---|---|
| **Gris** `#bdc3c7` | `colors[0]` | Agent isolé (`records.length===1`), cherche encore des semblables. |
| **Vert** `#2ecc71` | `colors[1]` | Regroupement **fermé** (`records.length>1`, `!open`). |
| **Jaune** `#f1c40f` | `colors[2]` | Regroupement **ouvert** (`open`), montre ses membres. |
| **Bleu** `#3498db` | `Child.colors[0]` | Un **membre** (une œuvre) à l'intérieur d'un jaune. |
| **Sombre** `#2C3E50` | `colors[4]` | Élément sélectionné (dernier cliqué). |

Interactions (`sma_core.js`) : **simple clic** = ouvre un groupe / affiche les
infos d'un isolé ; **double clic** = referme un groupe ouvert ; menu **reset**
= tout réinitialiser ; **pause** / touche **`p`** = gèle le champ de bruit
(`noiseField`).

---

## 6. Les forces, méthode par méthode

Tout se joue dans `Particle.update()` (phase 2) et dans les forces appelées
depuis `sma_core`. Chaque force **ajoute à `this.velocity`** ; à la fin de
`update()` la vitesse est divisée par `records.length` (les gros groupes bougent
moins), bornée à `maxSpeed` (4), appliquée à la position, puis amortie (`×0.9`).
La **masse de collision** (`collMass`, cf. §7) ne freine **que la propulsion**
(bruit/dérive), pas les forces de séparation — sinon un agent coincé ne pourrait
plus se dégager (voir le bug corrigé en §7).

**Mouvement de base**
- `addNoiseField(coef)` (appelée depuis `sma_core`) — champ de bruit de Perlin
  3D qui dérive lentement dans le temps : courants organiques. C'est la **seule
  propulsion des gris** (sans lui, un gris ne bouge plus). Force inversement
  proportionnelle à la taille du cercle (`coef/sizeFactor`), avec un **plancher à
  1** pour ne pas sur-propulser les petits (gris), et une réduction dédiée aux
  gris via `GREY_NOISE`. Voir §7.
- Dérive Perlin des **groupes** (dans `update`, `records.length>1`) : ils ne sont
  jamais parfaitement immobiles.

**Rapprochement / fusion** (quand `on`)
- `mergeNodesAndFindTarget` — cœur du regroupement. Pour un agent partageant la
  **même valeur** de propriété ciblée : s'il est plus « gros », il **absorbe**
  l'autre (`records` fusionnés, l'autre devient `alive=false`) ; sinon il **suit**
  la cible (`getCloserFrom`, attraction ×0.3). Fusion aussi par **recouvrement
  total** (`engulfed`).
- `getCloserFrom(target)` — attraction douce vers une cible compatible.

**Évitement**
- `getAwayFrom(index, particles)` — répulsion **réactive**, réservée aux **gris** :
  quand `on` mais sans cible compatible, s'écarte du plus gros voisin non
  compatible **déjà proche**. Poussée **douce, proportionnelle au chevauchement**
  (réglable via `GREY_REPULSION` ; auparavant `distance×0.3`, trop brutale — elle
  éjectait le gris). Voir §7.
- `getAwayFromGroups` — appelée par **tout regroupement** (vert **et** jaune) :
  il s'écarte des autres regroupements avec lesquels il ne partage pas la valeur
  ciblée (laisse approcher les candidats à la fusion). *(depuis 2026-07, s'applique
  aussi aux verts fermés, pas seulement aux jaunes ouverts.)*
- `separateFromLoners` — séparation entre gris non compatibles *(renforcée en
  2026-07 : marge et poussée augmentées).*
- **`avoidGroupsAhead`** *(ajout 2026-07)* — évitement **anticipé** : un gris qui
  se dirige vers un groupe (vert/jaune) **non compatible** est repoussé
  radialement (à l'opposé du groupe) *avant* le contact, d'autant plus qu'il fonce
  dessus. Ignore les candidats à la fusion. Version stable (voir §7). Voir §7.

**Ouverture d'un groupe**
- `openOrCloseIt`, puis dans `update` : croissance progressive du rayon
  (`extra_rad`), et `tryAddChild` ajoute les membres bleus **un par un, seulement
  s'il y a de la place** (capacité du disque + emplacement libre).

**Membres (cercles bleus, `childs_catalog.js`)**
- `getAwayFrom` (entre membres), `getCloseTo` (restent dans le disque),
  `getAwayFromCenter`, `reduceVelocityAndUseIt` (inertie + micro-dérive Perlin),
  `display` (fondu d'apparition + « respiration »).

**Bords**
- `checkEdgesV2` : les **groupes** rencontrent un **coussin doux** (mur invisible
  élastique) près du bord — répulsion perpendiculaire proportionnelle à
  l'enfoncement, ils longent la bordure au lieu d'être renvoyés au centre (voir
  §7 g). Les **gris** isolés, eux, ne « wrappent » plus : sortis d'une certaine
  distance, ils **réapparaissent en fondu à un endroit libre au hasard** (voir §7 h).

---

## 7. Améliorations récentes (juillet 2026)

Réglages de « ressenti » dans `particles_catalog.js`.

> **Note :** un ralentissement des gris cernés (`computeConfinement`) avait été
> ajouté puis **retiré** — il n'était pas jugé nécessaire. Si besoin un jour, la
> logique était : mesurer l'enfermement [0..1] (somme des chevauchements ; proche
> de 1 quand les poussées s'annulent, aucune issue) et l'utiliser pour réduire
> vitesse et bruit. Historique conservé ici, mais **absent du code actuel**.

### a) Évitement anticipé des groupes (`avoidGroupsAhead`)
Objectif : ne plus « boxer » ni **plonger** à travers un groupe non compatible —
y compris quand un agent file en ligne droite vers sa cible de fusion.
- **S'applique à TOUS les agents** (gris ET groupes ; auparavant gris seulement).
  La poussée est **prémultipliée par la masse** (`records.length` / `ids.length`)
  pour qu'un gros groupe esquive vraiment (sinon la division par la masse dans
  `update()` l'annulerait).
- Regarde `ahead = 85px` devant. Si un groupe **non compatible** est dans cette
  portée et qu'on se dirige vers lui (`align = cos(angle) > 0`), on applique une
  poussée **radiale (s'écarter) + tangentielle (contourner)**, dosée par
  `proximité × align × AVOID_STRENGTH × masse`. La tangentielle permet de **passer
  autour** quand la cible est droit derrière l'obstacle (le radial seul ne faisait
  que freiner). Le côté de contournement est choisi par rapport à la direction de
  l'obstacle (pas au signe brut de la vitesse) → **pas d'oscillation** (vérifié :
  taux d'inversion inchangé).
- La **cible de fusion est ignorée** (même valeur), donc les regroupements se font
  toujours. Mesuré : un agent qui fonçait à ~4 px du centre d'un obstacle passe
  désormais à ~21 px (le contourne) ; 12/12 fusions préservées sur les 4 SMA.
- **N'agit jamais** sur un candidat à la fusion (même valeur ciblée) → les
  regroupements se font toujours.
- ⚠️ **Version corrigée** : la première version poussait *perpendiculairement*
  au cap (`nx=-vy, ny=vx`) — une force qui **dépend du signe de la vitesse** et
  fait tourner le vecteur vitesse, ce qui pouvait créer une **oscillation
  auto-entretenue** (l'agent vibre sur place, même avec de l'espace, sans réussir
  à sortir). La version radiale est stable (direction fixe = à l'opposé du
  groupe), et comme la poussée s'annule dès que `align ≤ 0`, un agent qui se
  détourne n'est **jamais** retenu → il se dégage toujours.
- Mesuré : **−84 %** de temps passé à proximité d'un vert non compatible ; taux
  d'oscillation **inférieur** à celui sans évitement du tout ; fusions préservées.

### b) Séparation entre regroupements (verts ET jaunes)
Objectif : les groupes qui ne partagent pas la propriété gardent leurs distances.
- `getAwayFromGroups` est désormais appelée par **tous** les regroupements (avant :
  seulement les jaunes ouverts), avec une marge de respiration élargie (`+28`).
- Les groupes de **même** valeur ne sont pas repoussés (ils fusionnent).
- Coût faible : une seule passe supplémentaire, réservée aux groupes.
- Mesuré : deux verts non compatibles qui se chevauchent s'écartent (30→64px) puis
  se stabilisent ; deux verts compatibles fusionnent toujours.

### c) Séparation renforcée entre gris (`separateFromLoners`)
Objectif : les gris ne se collent pas les uns aux autres.
- Poussée portée de `.04` à `.08`, marge de `+6` à `+12`.
- Les gris de même valeur (candidats à fusionner entre eux) ne sont pas séparés.
- Mesuré (scène réaliste, bruit activé) : ~0,3 chevauchement gris/gris par image
  (négligeable).
- **Appelée aussi en PHASE 1** (dans `sma_core.js`, `shareInformation`) : sans ça,
  tant qu'aucun groupement n'est choisi (cas par défaut d'award), les gris
  restaient agglutinés. Corrige l'agglutination sur catalog/award/euphonies
  (chevauchements 10,4 → 0,4). Network a sa propre boucle (`network.js`) : à
  reporter là-bas si on veut le même effet en phase 1.

### d) Nervosité des gris en phase 2 : le champ de bruit
Diagnostic : en phase 2, chaque agent non ouvert reçoit
`addNoiseField(strength_noise_field*.5)` **à chaque image** (`sma_core.js`).
C'est la **seule propulsion** des gris — bruit coupé, ils s'immobilisent. La
force était de plus **amplifiée pour les petits cercles** (`coef/sizeFactor`,
plancher `.5` → jusqu'à ×2), donc les gris étaient les plus secoués.

Deux corrections :
- **Plancher `sizeFactor` porté à 1** : plus d'amplification des petits ; les gros
  restent atténués.
- **`GREY_NOISE`** (constante en tête de `particles_catalog.js`, défaut `0.35`) :
  réduit l'agitation des seuls gris. Mesuré (gris seul) : `0.5`→vitesse ~2,2 ;
  `0.35`→~1,6 ; `0.25`→~1,1. `1` = comme avant.
- Les **fusions ne sont pas affectées** : un gris compatible est attiré vers son
  groupe par `getCloserFrom`, indépendant du bruit.

### e) Masse de collision : ralentissement cumulatif et temporaire (`updateMass`)
Objectif : un gris qui percute (ou reste dans une zone encombrée) ralentit
progressivement, puis repart quand il se dégage.
- Chaque image, on compte les voisins **en contact/proche** (marge `COLL_MARGIN`).
  Chaque voisin ajoute `COLL_GAIN` à `this.collMass` (**cumulatif**), plafonné à
  `COLL_MAX`. Sans contact, la masse **se résorbe** (`×COLL_DECAY`, **temporaire**).
- `collMass` **freine la propulsion** (bruit dans `addNoiseField`, dérive des
  groupes) via un facteur `1/(1+collMass)` — c'est le modèle `a = F/masse`. Il ne
  divise **pas** la vitesse totale : les forces de séparation restent pleines.
- **S'applique aux gris ET aux groupes** (verts/jaunes) — un groupe qui percute
  ralentit aussi (mesuré : un vert en collision monte à ~2,3 de masse puis se pose).
- ⚠️ `updateMass` doit tourner pour **tous** (pas seulement les gris) : sinon un
  groupe hérite d'une `collMass` **figée** (jamais résorbée) et devient
  **immobile**. Bug rencontré puis corrigé sur network (portage manuel).
- **Uniquement en phase 2** : `update()` (et donc `updateMass`) n'est jamais appelé
  en phase 1, la masse n'y est donc pas modifiée.
- ⚠️ **Bug corrigé** : une première version divisait *toute* la vitesse par la
  masse. Au passage phase 1→2, les agents encore agglutinés voyaient leur masse
  grimper → ils ne pouvaient plus se séparer → **verrou** (~53 % de gris
  immobiles). En ne freinant que la propulsion, la séparation reste efficace et le
  verrou disparaît (~2 % d'immobiles après correctif).
- Mesuré (même scène) : un gris en contact (masse>1,5) va **~65 % moins vite**
  qu'un gris libre ; vitesse moyenne des gris en phase 2 ~1,9 (contre ~3,1 à
  l'origine) ; **12/12 gris compatibles fusionnent** toujours.

**Réglages** : `COLL_GAIN` (`0.4`, force d'accumulation), `COLL_DECAY` (`0.94`,
persistance — plus haut = la masse s'attarde), `COLL_MAX` (`6`, plafond anti-gel),
`COLL_MARGIN` (`10`, portée de détection). Tous en tête de `particles_catalog.js`.

### g) Coussin de bord pour les groupes (`checkEdgesV2`)
Objectif : supprimer le mouvement saccadé des groupes (verts/jaunes) en bordure
de cadre.
- Ancien comportement : dès qu'un groupe entrait dans la bande de bord, on lui
  ajoutait une vitesse **vers le centre** d'intensité = distance au centre
  (des centaines de px) → écrêtée à `maxSpeed`, elle le **catapultait** au centre,
  il repartait vers le bord, etc. → rebond saccadé (mesuré : ~100 inversions de
  cap sur 270 images, pointes de vitesse à 3,6).
- Nouveau : un **ressort perpendiculaire au mur** le plus proche, proportionnel à
  l'enfoncement dans la marge (0 au bord de la marge, croissant vers le mur),
  sommé sur les 4 murs. Le groupe **longe** la bordure et glisse. Prémultiplié par
  `records.length` (car `update()` divise par la masse). Réglage : `BORDER_PUSH`
  (`.03`, raideur ; monter = bord plus ferme).
- Mesuré : pointes de vitesse 3,6 → 0,12 ; inversions de cap 100 → 4 ; le groupe
  reste dans le cadre. **Appliqué à catalog, award, euphonies et network** (pour
  network, `k = BORDER_PUSH * this.ids.length`).

### h) Réapparition des gris en fondu (`checkEdgesV2`, branche gris)
Objectif : supprimer **entièrement** les téléportations d'un bord à l'autre (et le
« pop » brutal), tout en gardant des gris qui vont et viennent sur le canvas.
- **Abandon du wrap toroïdal.** Le wrap reposait le gris près du bord opposé ; le
  champ de bruit n'étant pas continu à la « couture », il re-franchissait aussitôt
  → allers-retours `LRLRLR`. Les correctifs successifs (hystérésis, bruit torique)
  n'éliminaient pas totalement le problème.
- **Nouveau (proposé par l'auteur) :** quand un gris est sorti d'une certaine
  distance (`WRAP_MARGIN`), il **réapparaît à un endroit LIBRE au hasard** sur le
  canvas (recherche d'un point sans voisin, jusqu'à 25 essais), vitesse remise à
  zéro, et **`fillAlpha` remis à 0** → il **réapparaît en fondu** (l'opacité ET la
  taille des gris sont pilotées par `fillAlpha` dans `display`). Plus de couture,
  plus de pop, et cela redistribue les gris (moins d'agglutination).
- Mesuré : réapparitions toujours **à l'intérieur** (0 près du bord → plus aucun
  ping-pong possible), **0 chevauchement** au spawn, toutes en fondu ; ~12–32
  réapparitions / plusieurs centaines d'images (occasionnel). 12/12 fusions, aucune
  erreur. **Appliqué aux quatre SMA.**
- Réglage : `WRAP_MARGIN` (`30` px = distance parcourue hors-champ avant de
  réapparaître). Le fondu dépend de `display()` (appelé par la boucle d'animation).

**Réglages rapides** (dans `particles_catalog.js`) :

| Constante | Rôle | Défaut |
|---|---|---|
| `ahead` (`avoidGroupsAhead`) | distance de regard pour l'évitement | `85` |
| `AVOID_STRENGTH` | force d'évitement radial des verts | `1.4` |
| `minDistance = …+28` (`getAwayFromGroups`) | respiration entre groupes | `+28` |
| `push = …*.05` (`getAwayFromGroups`) | force de répulsion entre groupes | `.05` |
| `push = …*.08` (`separateFromLoners`) | force de séparation entre gris | `.08` |
| `minDistance = …+12` (`separateFromLoners`) | respiration entre gris | `+12` |
| `GREY_NOISE` (haut de `particles_catalog.js`) | agitation/vitesse des gris | `.35` |
| `if(sizeFactor<1)` (`addNoiseField`) | plancher anti-amplification des petits | `1` |
| `COLL_GAIN` | accumulation de masse par collision | `.4` |
| `COLL_DECAY` | persistance de la masse de collision | `.94` |
| `COLL_MAX` | plafond de masse de collision (anti-gel) | `6` |
| `COLL_MARGIN` | portée de détection d'une collision | `10` |
| `GREY_REPULSION` | force de répulsion gris↔groupe (douceur) | `.1` |
| `BORDER_PUSH` | raideur du coussin de bord des groupes | `.03` |
| `WRAP_MARGIN` | distance hors-champ avant réapparition d'un gris (px) | `30` |
| `maxSpeed` (constructeur) | vitesse max d'un agent | `4.` |
| `numberOfNodesOnDisplayMax` (`catalog.js`) | nb max d'agents affichés | `400` |
| `strength_noise_field` (`sma_core.js`) | force du champ de bruit | `10` |
| `attr_treshold` (`sma_core.js`) | seuil pour proposer un attribut au menu | `150` |

---

## 8. Points d'attention / pistes

- **Duplication** : `particles_catalog/award/euphonies.js` sont désormais
  synchronisés ; `particles.js` (network) l'est aussi, avec les mêmes valeurs que
  catalog (`GREY_NOISE=.35`, bruit phase 2 = 5) mais ses spécificités de modèle
  (`ids`/`label`). Tout futur changement de comportement doit être reporté sur ces
  quatre fichiers (+ `network.js` pour le bruit de phase 2, qui vit dans sa boucle
  propre, pas dans `sma_core.js`). `particles_interactive_index.js` suit un autre
  modèle. À terme, envisager de **factoriser** un cœur commun paramétré.
- **Bug latent — CORRIGÉ (2026-07)** : dans `update()`, bloc `if(this.opening){…}`,
  la branche de fin d'ouverture testait `else if(this.extra_radius==this.max_extra_radius)`
  (champs avec un « i » qui n'existent pas ; les vrais sont `extra_rad`/`max_extra_rad`).
  Les deux valaient `undefined`, et `undefined==undefined` vaut `true`, donc ça
  « marchait » par accident. Remplacé par un simple **`} else {`** sur catalog,
  award et euphonies. `particles.js` (network) utilisait déjà `extra_radius`/
  `max_extra_radius` de façon cohérente et un `else` simple : rien à changer.
  Rappel pour l'avenir : ne pas écrire `extra_rad==max_extra_rad` (jamais égal
  exactement car `extra_rad` dépasse `max_extra_rad` par pas de `open_step`).
- **Coût** : plusieurs passes en O(n²) par image (fusion, séparation, évitement,
  confinement). À 400 agents ça tient, mais pour aller plus haut il faudrait une
  **grille spatiale** (n'examiner que les voisins d'une cellule) au lieu de tout
  parcourir.
- **Idées de ressenti** : freinage progressif (et non seulement latéral) à
  l'approche d'un vert ; « personal space » léger autour de tous les verts, pas
  seulement ceux droit devant ; amortir davantage juste après une fusion.

---

## 9. Comment tester sans base de données

Un **harnais autoportant** peut charger les vrais `sma_core.js` +
`particles_catalog.js` en simulant `retrieve_cat.php` : stubber `$.ajax` pour
renvoyer une chaîne `%`, fixer une graine (`Math.random`, `noise.seed`), piloter
les images à la main (`sma_animation()` en boucle) et mesurer positions /
vitesses / contacts. C'est ainsi qu'ont été validés les réglages du §7 (avant /
après, graines identiques, en Chromium *headless*).
