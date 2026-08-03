/* legend_toggle.js — repli de la legende "How to read this page"
   ---------------------------------------------------------------------------
   Sept pages portent un bloc <div id="legend"> : index.php, network.php,
   animated_data.php, catalog.php, award-winning_works.php, euphonies.php et
   categories.php. Toutes recoivent desormais le meme repli, et ce fichier en
   est l'unique exemplaire — le comportement etait ne dans js/categories.js, il
   en a ete extrait plutot que recopie six fois (meme raison qu'au §K pour la
   fiche ISNI : une correction faite une fois vaut mieux que sept corrections
   identiques a ne pas oublier).

   CONTRAT AVEC LA PAGE — trois identifiants et une classe :
     - #legend    le panneau entier ;
     - #lg_toggle le titre, qui EST le bouton : la bande de titre reste ainsi
                  visible une fois la legende fermee, et se rouvre sans avoir a
                  remonter en haut de page ;
     - #lg_body   tout le contenu sous le titre, masque au repli ;
     - is-collapsed, posee sur #legend, porte l'etat.
   Rien d'autre n'est attendu, et le script ne fait rien si l'un des deux
   elements manque : une page sans legende peut le charger sans dommage.

   L'ETAT D'ARRIVEE EST ECRIT DANS LE HTML, PAS ICI. Six pages arrivent
   ouvertes ; seule categories.php arrive repliee, parce que sa legende ouverte
   couvre pres de la moitie de la hauteur utile et que le diagramme est ce
   qu'on vient voir. La classe est donc posee dans le HTML de cette page-la :
   aucune page ne s'ouvre sur un panneau qui se refermerait sous les yeux, et
   une page sans JavaScript garde sa legende dans l'etat ou le serveur l'a
   envoyee.

   Ecrit sans jQuery — c'est un clic sur un bouton — et sans dependance : les
   six premieres pages le chargent depuis <head>, categories.php en fin de
   <body>, chacune suivant sa propre convention. D'ou l'attente de
   DOMContentLoaded quand le document est encore en cours d'analyse. */
(function(){
	if(typeof document === 'undefined' || !document.getElementById) return;

	function init(){
		var box = document.getElementById('legend');
		var btn = document.getElementById('lg_toggle');
		if(!box || !btn) return;

		/* Repliee, la bande de titre s'arrete au bord droit de "The Project"
		   (#help, dernier bloc de la barre) au lieu de barrer toute la fenetre
		   pour trois mots : elle se cale ainsi sur la fin du menu, juste
		   au-dessus. Ouverte, elle reprend toute la largeur — ses deux
		   colonnes en ont besoin.
		   Cette mesure ne vaut QUE pour une legende posee en fixe, c'est-a-dire
		   categories.php : elle seule est hors du flux et flotte sous la barre,
		   les six autres etant dans le flux, a la largeur de leur contenu ou de
		   leur tableau. Le test porte donc sur la position CALCULEE et non sur
		   le nom de la page : la feuille de style reste seule juge de qui est
		   fixe, et une page qui le deviendrait un jour heriterait du reglage
		   sans qu'on ait a revenir ici.
		   La largeur est MESUREE a chaque repli plutot qu'ecrite en dur : elle
		   depend des libelles du menu et de la police effectivement chargee, et
		   change si la barre se reorganise dans une fenetre etroite. Elle est
		   transmise a la feuille de style par une propriete personnalisee, dont
		   la valeur de repli (auto) redonne la pleine largeur si la mesure
		   echoue. */
		function isFixed(){
			if(!window.getComputedStyle) return false;
			return window.getComputedStyle(box).position === 'fixed';
		}

		function fitCollapsedWidth(){
			if(!isFixed()) return;
			var help = document.getElementById('help');
			if(!help) return;
			var w = Math.round(help.getBoundingClientRect().right -
			                   box.getBoundingClientRect().left);
			if(w > 0) box.style.setProperty('--lg-collapsed-w', w + 'px');
		}

		btn.addEventListener('click', function(){
			var collapsed = box.classList.toggle('is-collapsed');
			btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
			if(collapsed) fitCollapsedWidth();
		});

		// Une page peut arriver repliee (categories.php) : la largeur doit
		// alors etre calee sans attendre un clic.
		if(box.classList.contains('is-collapsed')) fitCollapsedWidth();

		if(typeof window !== 'undefined' && window.addEventListener){
			window.addEventListener('resize', function(){
				if(box.classList.contains('is-collapsed')) fitCollapsedWidth();
			});
			// Les libelles du menu sont composes en Exo 2, chargee depuis le
			// reseau : la mesure faite avant l'arrivee de la police porterait
			// sur la police de substitution et serait fausse de quelques
			// pixels. On la refait donc quand la page est complete, et quand
			// les polices sont pretes la ou le navigateur sait le dire.
			window.addEventListener('load', function(){
				if(box.classList.contains('is-collapsed')) fitCollapsedWidth();
			});
			if(document.fonts && document.fonts.ready && document.fonts.ready.then){
				document.fonts.ready.then(function(){
					if(box.classList.contains('is-collapsed')) fitCollapsedWidth();
				});
			}
		}
	}

	if(document.readyState === 'loading'){
		document.addEventListener('DOMContentLoaded', init);
	}else{
		init();
	}
})();
