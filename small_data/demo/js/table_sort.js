(function(){
	if(typeof document === 'undefined' || !document.querySelector) return;

	var DURATION = /^(\d{1,3}):([0-5]\d)$/;
	var NUMBER   = /^-?\d+(?:[.,]\d+)?$/;

	function cellValue(td){

		var k = td && td.getAttribute && td.getAttribute('data-sort');
		var s = (k !== null && k !== undefined && k !== '')
		      ? k
		      : (td && (td.textContent || td.innerText) || '');
		s = s.replace(/\s+/g, ' ').replace(/^ | $/g, '');

		if(s === '') return {empty: true};

		var d = DURATION.exec(s);
		if(d) return {num: parseInt(d[1], 10) * 60 + parseInt(d[2], 10)};

		if(NUMBER.test(s)) return {num: parseFloat(s.replace(',', '.'))};

		return {txt: s};
	}

	function compare(a, b){

		if(a.empty || b.empty) return 0;
		if('num' in a && 'num' in b) return a.num - b.num;
		if('num' in a) return -1;
		if('num' in b) return 1;

		return a.txt.localeCompare(b.txt, undefined, {sensitivity: 'base'});
	}

	function initTableSort(table, options){

		if(typeof table === 'string') table = document.querySelector(table);
		if(!table) return;

		var opt    = options || {};
		var ignore = opt.ignore || null;
		var zebra  = opt.zebra  || null;
		var before = opt.before || null;

		var headRow = null, rows = table.rows, i;
		for(i = 0; i < rows.length; i++){
			if(rows[i].cells.length && rows[i].cells[0].tagName === 'TH'){ headRow = rows[i]; break; }
		}
		if(!headRow) return;

		var ths = headRow.cells;
		var sorted = -1, asc = true;

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

			list.sort(function(x, y){

				var a = cellValue(x.cells[col]), b = cellValue(y.cells[col]);
				var ox = +x.getAttribute('data-ord'), oy = +y.getAttribute('data-ord');

				if(a.empty && b.empty) return ox - oy;
				if(a.empty) return 1;
				if(b.empty) return -1;

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

				var caret = document.createElement('span');
				caret.className = 'sort-caret';
				caret.setAttribute('aria-hidden', 'true');
				th.appendChild(caret);

				th.onclick = function(){ sortBy(col); };
				th.onkeydown = function(evt){
					var k = evt.keyCode || evt.which;
					if(k === 13 || k === 32){
						if(evt.preventDefault) evt.preventDefault();
						sortBy(col);
					}
				};

			})(ths[i], i);
		}
	}

	window.initTableSort = initTableSort;

})();
