/* table_sort.js — tri d'un tableau par clic sur ses en-tetes
   ---------------------------------------------------------------------------
   Les libelles de colonne etaient jusqu'ici de simples etiquettes. Ils
   deviennent des commandes : un clic trie sur la colonne, un second inverse le
   sens. Le tri se fait entierement dans le navigateur, sur les lignes deja
   dessinees — aucune requete n'est refaite, et les 35 lignes des Euphonies
   d'Or sont reordonnees instantanement.

   CONTRAT AVEC LA PAGE. Rien d'autre n'est attendu qu'un <table> dont la
   premiere ligne porte des <th> et les suivantes des <td>. Le <thead> n'est
   pas requis : la page peut l'avoir ou non, le script reconnait la ligne
   d'en-tete a ses <th>. Il ne fait rien si le tableau est absent ou vide, et
   la page reste utilisable sans JavaScript, dans l'ordre servi par le serveur.

   L'ORDRE D'ORIGINE N'EST JAMAIS PERDU. Chaque ligne retient son rang
   d'arrivee, et tout tri s'y ramene pour departager les ex aequo : trier par
   « category » laisse donc, a l'interieur d'une categorie, l'ordre editorial
   du serveur. Consequence utile sur euphonies.php, ou ce dernier est
   « edition decroissante, puis nom de famille » : cliquer deux fois sur
   « edition » redonne exactement l'etat d'arrivee de la page. Il n'y a donc
   pas de troisieme etat « remise a zero » a apprendre — la remise a zero est
   un tri comme un autre.

   LES CASES VIDES VONT TOUJOURS EN DERNIER, dans les deux sens. Une case vide
   n'est pas une petite valeur : c'est une absence d'information. La faire
   remonter en tete d'un tri croissant reviendrait a la classer avant les
   valeurs connues, ce qui n'a pas de sens dans une base patrimoniale ou les
   lacunes sont nombreuses et documentees comme telles (colonnes country,
   sub category et isni, notamment).

   COMPARAISON. Le type de chaque colonne est deduit de son contenu, non
   declare : duree « mm:ss » convertie en secondes, valeurs entierement
   numeriques comparees comme des nombres, tout le reste compare comme du
   texte, accents et casse ignores. La colonne « price » melange les deux —
   des rangs (1, 2, 3) et des libelles (Prix, Prix CIME) — et les nombres y
   passent alors avant les mots.

   Ecrit sans jQuery et sans dependance, comme js/legend_toggle.js : c'est un
   clic sur un en-tete. Le fichier est prevu pour servir aux autres tableaux du
   site (catalog.php, award-winning_works.php) sans modification — il suffira
   de l'inclure et de l'appeler. */
(function(){
	if(typeof document === 'undefined' || !document.querySelector) return;

	var DURATION = /^(\d{1,3}):([0-5]\d)$/;
	var NUMBER   = /^-?\d+(?:[.,]\d+)?$/;

	/* Valeur comparable d'une cellule. textContent et non innerHTML : la
	   colonne ISNI contient un <a>, et c'est le numero qui doit etre compare,
	   pas le balisage qui l'entoure. */
	function cellValue(td){

		var s = (td && (td.textContent || td.innerText) || '');
		s = s.replace(/\s+/g, ' ').replace(/^ | $/g, '');

		if(s === '') return {empty: true};

		var d = DURATION.exec(s);
		if(d) return {num: parseInt(d[1], 10) * 60 + parseInt(d[2], 10)};

		if(NUMBER.test(s)) return {num: parseFloat(s.replace(',', '.'))};

		return {txt: s};
	}

	/* Un nombre passe avant un texte : sur la colonne « price », les rangs
	   (1, 2, 3) precedent ainsi les libelles (Prix, Prix CIME). */
	function compare(a, b){

		if(a.empty || b.empty) return 0;          // traite en amont, jamais ici
		if('num' in a && 'num' in b) return a.num - b.num;
		if('num' in a) return -1;
		if('num' in b) return 1;

		return a.txt.localeCompare(b.txt, undefined, {sensitivity: 'base'});
	}

	function initTableSort(table, options){

		if(typeof table === 'string') table = document.querySelector(table);
		if(!table) return;

		var opt    = options || {};
		var ignore = opt.ignore || null;   // selecteur des lignes hors tri
		var zebra  = opt.zebra  || null;   // ex. ['even', 'odd'], reposees apres tri
		var before = opt.before || null;   // ex. refermer un accordeon ouvert

		var headRow = null, rows = table.rows, i;
		for(i = 0; i < rows.length; i++){
			if(rows[i].cells.length && rows[i].cells[0].tagName === 'TH'){ headRow = rows[i]; break; }
		}
		if(!headRow) return;

		var ths = headRow.cells;
		var sorted = -1, asc = true;

		/* Les lignes de donnees, relues a chaque tri : la page peut en avoir
		   insere (l'accordeon data.bnf.fr d'euphonies.php) ou en avoir retire
		   depuis le dernier appel. Le rang d'arrivee est pose une fois pour
		   toutes, a la premiere lecture. */
		var ordSeq = 0;
		function dataRows(){

			var out = [], r = table.rows, k;

			for(k = 0; k < r.length; k++){
				if(r[k] === headRow) continue;
				if(!r[k].cells.length || r[k].cells[0].tagName === 'TH') continue;
				if(ignore && r[k].className && r[k].className.indexOf(ignore) !== -1) continue;
				if(r[k].getAttribute('data-ord') === null) r[k].setAttribute('data-ord', ordSeq++);
				out.push(r[k]);
			}

			return out;
		}

		function sortBy(col){

			if(before) before();

			asc = (col === sorted) ? !asc : true;
			sorted = col;

			var list = dataRows();

			/* Le rang d'arrivee departage les ex aequo, et il le fait dans le
			   meme sens quel que soit celui du tri : deux lignes de meme
			   valeur gardent l'ordre du serveur, elles ne se renversent pas
			   avec le reste. */
			list.sort(function(x, y){

				var a = cellValue(x.cells[col]), b = cellValue(y.cells[col]);
				var ox = +x.getAttribute('data-ord'), oy = +y.getAttribute('data-ord');

				if(a.empty && b.empty) return ox - oy;
				if(a.empty) return 1;              // les vides en dernier,
				if(b.empty) return -1;             // dans les deux sens

				var c = compare(a, b);
				if(c === 0) return ox - oy;

				return asc ? c : -c;
			});

			var parent = list.length ? list[0].parentNode : null;
			for(var k = 0; k < list.length; k++){
				parent.appendChild(list[k]);
				if(zebra) list[k].className = zebra[k % zebra.length];
			}

			for(var t = 0; t < ths.length; t++){
				ths[t].setAttribute('aria-sort',
					t !== col ? 'none' : (asc ? 'ascending' : 'descending'));
				ths[t].className = (t !== col) ? 'sortable'
				                 : ('sortable is-sorted ' + (asc ? 'is-asc' : 'is-desc'));
			}
		}

		for(i = 0; i < ths.length; i++){
			(function(th, col){

				th.className = 'sortable';
				th.setAttribute('role', 'button');
				th.setAttribute('tabindex', '0');
				th.setAttribute('aria-sort', 'none');
				th.setAttribute('title', 'sort by ' + (th.textContent || th.innerText || ''));

				/* Le caret est ajoute ici et non dans le HTML : il n'a de sens
				   que si le tri fonctionne, donc que si ce script est charge. */
				var caret = document.createElement('span');
				caret.className = 'sort-caret';
				caret.setAttribute('aria-hidden', 'true');
				th.appendChild(caret);

				th.onclick = function(){ sortBy(col); };
				th.onkeydown = function(evt){
					var k = evt.keyCode || evt.which;
					if(k === 13 || k === 32){       // entree, espace
						if(evt.preventDefault) evt.preventDefault();
						sortBy(col);
					}
				};

			})(ths[i], i);
		}
	}

	window.initTableSort = initTableSort;

})();
