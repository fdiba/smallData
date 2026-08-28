window.onload = function() {

    initSMA(1210, 300);

    retrieveEuphonies(3, 19);

};
function retrieveEuphonies(cat, numOfElements){

    $.ajax({
        url: 'php/retrieve_cat.php',
        type: "POST",
        data: {cat: cat}

    }).done(function(str) {

        var arr=str.split("|");

        for (var i = 0; i < arr.length; i+=numOfElements) {

            var tr_class = (i / numOfElements % 2 === 0) ? "even" : "odd";

            var obj = {edition: arr[i], year:arr[i+1], price:arr[i+2], imeb_id:arr[i+3],
                        fn:arr[i+4], name:arr[i+5], title:arr[i+6], duration:arr[i+7],
                        minutes:minutesGN(arr[i+7]), id:arr[i+8],
                        degree:arr[i+13], category:arr[i+10], isni:arr[i+11],
                        ctry:arr[i+12],
                        composed:arr[i+14], annees:arr[i+15], prov:arr[i+16],
                        ne:arr[i+17], mo:arr[i+18]};

            records.push(obj);

            $('#euphonies_table').append('<tr></tr>');
            var tr = $('#euphonies_table tr:last');
            tr.attr('class', tr_class);

            var colOrder = [0, 1, 10, 2, 4, 12, 6, 7, 11];
            for (var j = 0; j < colOrder.length; j++) {

                var idx = colOrder[j];
                var value = arr[i+idx];

                if(idx == 4){
                    var pre = $.trim(arr[i+4] || ''), nom = $.trim(arr[i+5] || '');
                    var cle = clePatronyme(nom, pre);
                    var mis = $.trim(arr[i+3] || '');
                    var infoMisam = (mis && mis !== '0')
                                  ? ' title="MISAM ' + mis.replace(/"/g, '&quot;') + '"' : '';
                    tr.append('<td data-sort="' + cle.replace(/"/g, '&quot;') + '"' + infoMisam + '>'
                              + $.trim(pre + ' ' + nom) + '</td>');
                    continue;
                }

                if(idx==11){
                    var isniVal = $.trim(value || '');
                    if(/^[0-9]{15}[0-9Xx]$/.test(isniVal.replace(/\s+/g, ''))){
                        value = '<a class="isni-link" title="ISNI record" '
                              + 'href="https://isni.org/isni/' + isniVal + '" '
                              + 'data-isni="' + isniVal + '">' + isniVal + '</a>';
                    } else {
                        value = isniVal;
                    }
                }

                tr.append('<td>'+ value + '</td>');
            }

            tr.find('a.isni-link').on('click', function(evt){
                if(evt.ctrlKey || evt.metaKey || evt.shiftKey || evt.which === 2) return;
                evt.preventDefault();
                evt.stopPropagation();
                openIsniBox($(this));
            });

            var isniRaw = $.trim(arr[i+11] || '').replace(/\s+/g, '');

            tr.data('isni',  /^[0-9]{15}[0-9Xx]$/.test(isniRaw) ? isniRaw : '')
              .data('who',   $.trim(arr[i+4] + ' ' + arr[i+5]))
              .data('title', $.trim(arr[i+6]));

            tr.css("cursor", "pointer").on('click', function(){ toggleBnfRow($(this)); });
        }

        if(window.initTableSort){
            initTableSort('#euphonies_table', {
                ignore: 'bnf-row',
                zebra:  ['even', 'odd'],
                before: closeBnfRow
            });
        }

        $("#info").append("<p>" + (arr.length / numOfElements) + " works</p>");

    });

    startSMA();

}

function clePatronyme(nom, pre){
    var s = (String(nom || '') + ' ' + String(pre || '')).replace(/^\s+|\s+$/g, '');
    if(s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.toLowerCase().replace(/\s+/g, ' ');
}
$(function(){
    if(typeof enableIsniInflowFiche === 'function'){
        enableIsniInflowFiche({ into: 'isniColumn' });
    }
});

var bnfCache = {};

function bnfNorm(s){
    s = String(s == null ? '' : s).toLowerCase();
    if(s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.replace(/[^a-z0-9]+/g, '');
}

function bnfArk(uri){
    return String(uri || '').replace(/^http:\/\//, 'https://').replace(/#about$/, '');
}

function bnfQueryUrl(isni){

    var q = 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>\n'
      + 'PREFIX rdarelationships: <http://rdvocab.info/RDARelationshipsWEMI/>\n'
      + 'PREFIX dcterms: <http://purl.org/dc/terms/>\n'
      + 'PREFIX bnf-onto: <http://data.bnf.fr/ontology/bnf-onto/>\n'
      + 'PREFIX isni: <http://isni.org/ontology#>\n'
      + 'SELECT DISTINCT ?auteur ?work ?titreOeuvre ?anneeOeuvre ?edition ?titreEdition ?dateEdition WHERE {\n'
      + '  ?concept isni:identifierValid "' + isni + '" ; foaf:focus ?auteur .\n'
      + '  ?work dcterms:creator ?auteur ; dcterms:title ?titreOeuvre .\n'
      + '  OPTIONAL { ?work bnf-onto:firstYear ?anneeOeuvre }\n'
      + '  OPTIONAL { ?edition rdarelationships:workManifested ?work ; dcterms:title ?titreEdition .\n'
      + '             OPTIONAL { ?edition bnf-onto:firstYear ?dateEdition } }\n'
      + '} ORDER BY ?titreOeuvre ?dateEdition LIMIT 400';

    return 'https://data.bnf.fr/sparql?default-graph-uri=&format=application%2Fsparql-results%2Bjson'
         + '&timeout=0&query=' + encodeURIComponent(q);
}

function bnfParse(json){

    var out = {author: null, works: []}, byWork = {};
    var b = (json && json.results && json.results.bindings) ? json.results.bindings : [];

    for (var i = 0; i < b.length; i++) {

        var x = b[i];
        if(!out.author && x.auteur) out.author = bnfArk(x.auteur.value);
        if(!x.work || !x.titreOeuvre) continue;

        var k = x.work.value, w = byWork[k];
        if(!w){
            w = byWork[k] = {uri: bnfArk(k), title: $.trim(x.titreOeuvre.value),
                             year: x.anneeOeuvre ? x.anneeOeuvre.value : '', eds: {}, edList: []};
            out.works.push(w);
        }

        if(x.edition){
            var ek = x.edition.value;
            if(!w.eds[ek]){
                w.eds[ek] = 1;
                w.edList.push({uri: bnfArk(ek), title: x.titreEdition ? $.trim(x.titreEdition.value) : '',
                               year: x.dateEdition ? x.dateEdition.value : ''});
            }
        }
    }

    for (var j = 0; j < out.works.length; j++) {

        var wk = out.works[j], plain = [], named = [];

        for (var e = 0; e < wk.edList.length; e++) {
            var ed = wk.edList[e];

            var same = bnfNorm(ed.title) === bnfNorm(wk.title)
                    || bnfNorm(ed.title.split(/\s+:\s+/)[0]) === bnfNorm(wk.title);
            if(same || !ed.title) plain.push(ed); else named.push(ed);
        }

        wk.plain = plain; wk.named = named;
    }

    out.works.sort(function(a, c){
        var ya = parseInt(a.year, 10) || 0, yc = parseInt(c.year, 10) || 0;
        if(ya !== yc) return yc - ya;
        return a.title.localeCompare(c.title);
    });

    return out;
}

function bnfRender(d, who, rowTitle){

    var h = [], n = d.works.length;

    h.push('<div class="bnf-panel"><div class="bnf-hd">'
         + '<span class="bnf-hd-t">data.bnf.fr records for <span class="bnf-hd-n">' + esc(who) + '</span></span>');
    if(d.author) h.push('<a href="' + esc(d.author) + '" target="_blank" rel="noopener">authority record</a>');
    h.push('<span class="bnf-count">' + n + (n > 1 ? ' works listed' : ' work listed') + '</span>');
    h.push('<span class="bnf-close" title="close">&times;</span></div>');

    if(!n){
        h.push('<p class="bnf-warn">No work listed in data.bnf.fr for this composer.</p></div>');
        return h.join('');
    }

    h.push('<div class="bnf-bd"><ul class="bnf-works">');

    var rt = bnfNorm(rowTitle);

    for (var i = 0; i < n; i++) {

        var w = d.works[i];
        var match = rt && bnfNorm(w.title) === rt;

        h.push('<li class="bnf-work' + (match ? ' is-match' : '') + '">'
             + '<span class="bnf-y">' + esc(w.year || '') + '</span>'
             + '<a class="bnf-t" href="' + esc(w.uri) + '" target="_blank" rel="noopener">' + esc(w.title) + '</a>');

        var years = [];
        for (var p = 0; p < w.plain.length; p++) if(w.plain[p].year) years.push(w.plain[p].year);
        years = years.filter(function(y, k2, a2){ return a2.indexOf(y) === k2 && y !== w.year; });

        if(years.length || w.named.length){

            h.push('<ul class="bnf-eds">');

            if(years.length) h.push('<li><span class="bnf-y2">' + esc(years.join(', ')) + '</span>'
                                  + (years.length > 1 ? 'editions' : 'edition') + '</li>');

            for (var q = 0; q < w.named.length; q++) {
                h.push('<li><span class="bnf-y2">' + esc(w.named[q].year || '') + '</span>'
                     + '<a href="' + esc(w.named[q].uri) + '" target="_blank" rel="noopener">'
                     + esc(w.named[q].title) + '</a></li>');
            }

            h.push('</ul>');
        }

        h.push('</li>');
    }

    h.push('</ul></div></div>');
    return h.join('');
}

function closeBnfRow(){
    $('#euphonies_table tr.bnf-row').remove();
    $('#euphonies_table tr.bnf-open').removeClass('bnf-open');
}

function toggleBnfRow(tr){

    var isni  = String(tr.data('isni')  || '');
    var who   = String(tr.data('who')   || '');
    var title = String(tr.data('title') || '');

    var wasOpen = tr.hasClass('bnf-open');
    closeBnfRow();
    if(wasOpen) return;

    tr.addClass('bnf-open');

    var cols = tr.children('td').length;
    var row  = $('<tr class="bnf-row"><td colspan="' + cols + '"></td></tr>').insertAfter(tr);
    var cell = row.children('td');

    cell.on('click', '.bnf-close', function(){ closeBnfRow(); });

    if(!isni){
        cell.html('<div class="bnf-panel"><p class="bnf-warn">No ISNI for this composer: data.bnf.fr cannot be queried.</p></div>');
        return;
    }

    if(bnfCache[isni]){ cell.html(bnfRender(bnfCache[isni], who, title)); return; }

    cell.html('<div class="bnf-panel"><p class="bnf-wait">Querying data.bnf.fr&hellip;</p></div>');

    $.ajax({url: bnfQueryUrl(isni), dataType: 'json'})

        .done(function(json){
            var d = bnfParse(json);
            bnfCache[isni] = d;

            if(row.parent().length) cell.html(bnfRender(d, who, title));
        })

        .fail(function(){
            if(row.parent().length) cell.html('<div class="bnf-panel"><p class="bnf-warn">data.bnf.fr did not respond.</p></div>');
        });
}

$(document).on('keydown.bnf', function(evt){ if(evt.key === 'Escape') closeBnfRow(); });
