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

function compareTitres(a, b){
    var ta = (a && a.t != null) ? String(a.t) : '';
    var tb = (b && b.t != null) ? String(b.t) : '';
    if(''.localeCompare){
        try{
            return ta.localeCompare(tb, 'fr', {sensitivity:'base', numeric:true});
        }catch(e){  }
    }
    return ta < tb ? -1 : (ta > tb ? 1 : 0);
}
function displayTitlesInfosGN(arr){

    var box = $("#titles");

    arr = (arr || []).slice().sort(compareTitres);

    bindTitlesFold();
    box.empty();

    box.addClass('t-boxed');

    if(arr.length>0){

        var label = arr.length + ' archived work' + (arr.length>1 ? 's' : '');

        box.addClass('is-folded t-hd-on').append(
            '<li class="t-hd"><button type="button" class="t-toggle" aria-expanded="false">'
            + label + '<span class="t-caret" aria-hidden="true"></span></button></li>');

        for (var i=0; i<arr.length; i++) {
            var obj=arr[i];

            var misam = (obj.m == null) ? '' : String(obj.m).replace(/^\s+|\s+$/g, '');
            var tip = misam ? ' title="MISAM ' + misam.replace(/"/g, '&quot;') + '"' : '';

            var tete = [escGN(obj.t)];
            if(obj.d) tete.push(escGN(obj.d));
            if(obj.y) tete.push(escGN(obj.y));

            var div = '<li class="' + (i%2===0 ? 't-a' : 't-b') + '">'
                    + '<span class="t-work"' + tip + '>' + tete.join(' · ') + '</span>';

            var eds = workYearsHtml(obj.ed, obj.pv);
            if(eds) div += ' | ' + eds;

            div += '</li>';
            box.append(div);
        }

    } else {

        box.removeClass('is-folded t-hd-on').append('<li>no archived work for this composer</li>');
    }

}

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

function escGN(s){
    if(typeof esc === 'function') return esc(s);
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

var WORK_MARQUE = {'1':'', '2':'+', '3':'°', '4':'*'};
var WORK_CLASSE = {'1':'ed-comp', '2':'ed-both', '3':'ed-fest', '4':'ed-loose'};

var WORK_ETAT = {
    '1': 'competition',
    '2': 'competition + festival',
    '3': 'festival only',
    '4': 'competition, no document'
};
var WORK_PIECE = {
    'a': 'prize awarded',
    'r': 'Phonothèque A repertoire',
    'g': 'Phonothèque B register',
    'd': 'both phonothèque inventories',
    'n': 'no document names it'
};

function workYearsHtml(annees, provenance){

    var cls = {};
    var brut = ('' + (provenance || '')).replace(/^\s+|\s+$/g, '');
    if(brut){
        var l = brut.split(',');
        for(var k=0; k<l.length; k++){
            var p = l[k].split('=');
            if(p.length === 2) cls[p[0].replace(/^\s+|\s+$/g, '')]
                             = p[1].replace(/^\s+|\s+$/g, '');
        }
    }

    var out = [];
    var ans = editionYears(annees);

    for(var i=0; i<ans.length; i++){

        var a = ans[i];
        var code = cls[a] || '4n';
        var c = code.charAt(0), q = code.charAt(1) || 'n';
        if(!WORK_MARQUE.hasOwnProperty(c)) c = '1';
        if(!WORK_PIECE.hasOwnProperty(q))  q = 'n';

        var redite = (c === '4' && q === 'n');
        var titre  = WORK_ETAT[c] + (redite ? '' : ' · ' + WORK_PIECE[q]);

        out.push('<span class="' + WORK_CLASSE[c] + '" title="' + escGN(titre) + '">'
                 + escGN(a) + WORK_MARQUE[c] + '</span>');
    }

    return out.join(', ');
}

var titlesFoldBound = false;

function bindTitlesFold(){

    if(titlesFoldBound) return;
    titlesFoldBound = true;

    $('#titles').on('click', '.t-toggle', function(){
        var ouvert = !$('#titles').toggleClass('is-folded').hasClass('is-folded');
        $(this).attr('aria-expanded', ouvert ? 'true' : 'false');
    });
}

function displayFirstnameAndNameGN(obj){

    var txt = obj.fn+' '+obj.n;
    var isni = obj.isni ? $.trim(obj.isni) : '';

    $("#selection").empty().append('<p>');
    $("#selection p").text(txt);
    $("#selection").append(countryLineHtml(obj.origin, obj.ctry));

    syncIsniBoxGN(isni);
}

function syncIsniBoxGN(isni){

    if(typeof showIsniBox !== 'function') return false;

    var id = isni ? $.trim('' + isni) : '';
    if(id) return showIsniBox(id);

    if(typeof hideIsniBox === 'function') hideIsniBox();
    return false;
}

function syncIsniFicheGN(isni, label){

    if(typeof showIsniFiche !== 'function') return false;

    var id = isni ? $.trim('' + isni).replace(/\s+/g, '') : '';

    if(id && /^[0-9]{15}[0-9Xx]$/.test(id)) return showIsniFiche(id, label);

    if(typeof hideIsniFiche === 'function') hideIsniFiche();
    return false;
}

function minutesGN(duration){

    var d = (duration == null ? '' : String(duration)).trim();
    if(!d) return '';

    var m = /^(?:(\d{1,2}):)?(\d{1,3}):(\d{2})$/.exec(d);
    if(!m) return d;

    var sec = (m[1] ? parseInt(m[1], 10) * 3600 : 0)
            + parseInt(m[2], 10) * 60
            + parseInt(m[3], 10);

    var min = Math.round(sec / 60);
    return min < 1 ? '< 1 min' : min + ' min';
}

function displaySmaIdentityGN(target){

    if(!target) return;

    var t   = function(v){ return $.trim(v == null ? '' : String(v)); };

    var who = $.trim(t(target.fn) + ' ' + t(target.name));

    $("#selection").empty().append('<p>');
    $("#selection p").text(who);

    if(typeof countryLineHtml === 'function'){
        $("#selection").append(countryLineHtml('', target.ctry));
    }

    syncIsniFicheGN(target.isni);
}

function hideIsniAllGN(){
    if(typeof hideIsniBox   === 'function') hideIsniBox();
    if(typeof hideIsniFiche === 'function') hideIsniFiche();
}

function setSelectionTextGN(txt){
    $("#selection").empty().append('<p>');
    $("#selection p").text(txt);
    hideIsniAllGN();
}

function clearIdentityBoxGN(){
    $("#selection").empty();
    hideIsniAllGN();
}

function countryLineHtml(origin, ctry){

    var o = origin ? ('' + origin).replace(/^\s+|\s+$/g, '') : '';
    var c = ctry   ? ('' + ctry).replace(/^\s+|\s+$/g, '')   : '';

    if(!o && !c) return '';
    if(typeof esc !== 'function') return '';

    var txt = (o && c) ? (o + ' / ' + c) : (o || c);

    return '<p class="sd-country">' + esc(txt) + '</p>';
}

var SHOW_ALL_NAMES = /(^|[?&])v=all([&#]|$)/.test(window.location.search || '');

function maskName(txt){
    return String(txt == null ? '' : txt)
        .split(/\s+/)
        .filter(function(mot){ return mot.length > 0; })
        .map(function(mot){
            return mot.charAt(0) + new Array(mot.length).join('*');
        })
        .join(' ');
}

function dist(x1, x2, y1, y2){
	var a = x1 - x2;
	var b = y1 - y2;
	var c = Math.sqrt(a*a + b*b);
	return c;
}
function map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}
