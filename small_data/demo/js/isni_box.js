var isniCache = {};
var isniAnchor = null;

var isniDock = null;

var ISNI_LOADING_RE = /^\s*\d+\s+nodes\s+\d+\s*%\s*$/;

function setIsniDock(el){
    isniDock = el || null;
}

function enableIsniPanel(opt){

    opt = opt || {};

    var dockId    = opt.dockId    || 'isniPanel';
    var into      = opt.into      || '';
    var anchors   = opt.anchors   || [];
    var clickable = opt.clickable || '';
    var watch     = opt.watch     || '';

    var panel;
    var inflow = false;

    if(into){
        panel = document.getElementById(into);

        if(panel){
            inflow = true;
            panel.className += (panel.className ? ' ' : '') + 'isni-inflow';
            setIsniDock('#' + into);
        }
    } else {

        panel = document.getElementById(dockId);
        if(!panel){
            panel = document.createElement('div');
            panel.id = dockId;
            document.body.appendChild(panel);
        }
        setIsniDock('#' + dockId);
    }

    function place(){
        if(inflow || !panel) return;
        var right = 0;
        for(var i = 0; i < anchors.length; i++){
            var e = document.getElementById(anchors[i]);
            if(!e || e.offsetParent === null) continue;
            var r = e.getBoundingClientRect();
            if(r.width > 0 && r.right > right) right = r.right;
        }
        if(right <= 0) return;

        var w    = panel.offsetWidth || 340;
        var left = right + 10;
        if(left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8);
        panel.style.left = Math.round(left) + 'px';
    }

    if(!inflow){
        place();
        $(window).on('resize.isnipanel scroll.isnipanel', place);
    }

    if(watch && window.MutationObserver){
        var box = document.getElementById(watch);
        if(box){
            new MutationObserver(function(records){

                if(isniRerenderGuard) return;

                var onlyCounter = true;
                var onlyFiche   = true;
                for(var i = 0; i < records.length; i++){
                    var t  = records[i].target;
                    var el = (t.nodeType === 1) ? t : t.parentNode;
                    if(!el || !el.closest){ onlyCounter = false; onlyFiche = false; break; }
                    if(!el.closest('#cookies'))     onlyCounter = false;
                    if(!el.closest('.isni-inflow')) onlyFiche   = false;
                    if(!onlyCounter && !onlyFiche) break;
                }

                if(onlyCounter && ISNI_LOADING_RE.test($('#cookies').text())) return;

                if(onlyFiche) return;

                closeIsniBox();
            }).observe(box, {childList: true, subtree: true, characterData: true});
        }
    }

    if(clickable){
        $(document).on('click', clickable, function(evt){
            evt.stopPropagation();
            place();
            openIsniBox($(this));
        });
        $(document).on('keydown', clickable, function(evt){
            if(evt.key !== 'Enter' && evt.key !== ' ' && evt.key !== 'Spacebar') return;
            evt.preventDefault();
            evt.stopPropagation();
            place();
            openIsniBox($(this));
        });
    }

    return place;
}

function esc(s){
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function ensureIsniBox(){

    var box = $('#isniBox');
    if(box.length) return box;

    box = $('<div id="isniBox" class="isni-box" role="dialog" aria-label="ISNI record">'
          + '<div class="isni-hd"><span class="isni-hd-t"></span>'
          + '<span class="isni-close" title="close">&times;</span></div>'
          + '<div class="isni-bd"></div></div>').appendTo(isniDock || 'body');

    if(isniDock) box.addClass('isni-docked');

    box.on('click', '.isni-close', function(){ closeIsniBox(); });

    box.on('click', function(evt){ evt.stopPropagation(); });

    box.on('click', '.isni-toggle', function(evt){
        evt.preventDefault();
        evt.stopPropagation();
        toggleIsniBox();
    });

    $(document).on('keydown.isni', function(evt){ if(evt.key === 'Escape') closeIsniBox(); });
    if(!isniDock) $(document).on('click.isni', function(){ closeIsniBox(); });
    $(window).on('resize.isni scroll.isni', function(){ if(isniAnchor) placeIsniBox(isniAnchor); });

    return box;
}

function closeIsniBox(){
    $('#isniBox').removeClass('open');
    isniAnchor = null;
}

var isniShown = '';
var isniShownLoaded = false;

function showIsniBox(isni, label){

    var id = String(isni || '').replace(/\s+/g, '');
    if(!id){ hideIsniBox(); return false; }

    var box = ensureIsniBox();

    box.addClass('isni-foldable');

    if(id !== isniShown){
        isniShown = id;
        isniShownLoaded = false;
        box.find('.isni-bd').empty();
    }

    var head = 'ISNI ' + id.replace(/(.{4})(?=.)/g, '$1 ');
    var lbl  = String(label || '').trim();

    box.find('.isni-hd-t').html(
        '<button type="button" class="isni-toggle" aria-expanded="false">'
        + esc(lbl ? lbl + ' — ' + head : head)
        + '<span class="isni-caret" aria-hidden="true"></span></button>');

    box.addClass('open').addClass('is-folded');
    isniAnchor = null;
    return true;
}

function hideIsniBox(){
    $('#isniBox').removeClass('open is-folded');
    isniShown = '';
    isniShownLoaded = false;
}

function toggleIsniBox(){

    var box = $('#isniBox');
    if(!box.length) return;

    var folded = box.hasClass('is-folded');
    box.toggleClass('is-folded', !folded);
    box.find('.isni-toggle').attr('aria-expanded', folded ? 'true' : 'false');

    if(!folded || isniShownLoaded || !isniShown) return;

    isniShownLoaded = true;

    if(isniCache[isniShown]){ renderIsniBox(isniCache[isniShown]); return; }

    var id = isniShown;
    box.find('.isni-bd').html('<p class="isni-wait">Querying ISNI&hellip;</p>');

    $.ajax({url: 'php/retrieve_isni.php', type: 'POST', dataType: 'json', data: {isni: id}})

        .done(function(data){
            isniCache[id] = data;
            if(isniShown === id) renderIsniBox(data);
        })

        .fail(function(){

            isniShownLoaded = false;
            if(isniShown !== id) return;
            renderIsniBox({status: 'error', isni: id, links: {
                isni_org:  'https://isni.org/isni/' + id,
                isni_oclc: 'https://isni.oclc.org/cbs/DB=1.2//CMD?ACT=SRCH&IKT=8006&TRM=ISN%3A'
                           + id + '&TERMS_OF_USE_AGREED=Y&terms_of_use_agree=send'
            }});
        });
}

var isniRerenderGuard = false;

function isniBeginRerender(){
    isniRerenderGuard = true;
    setTimeout(function(){ isniRerenderGuard = false; }, 0);
}

function isniOpenFor(){
    return isniAnchor
         ? String(isniAnchor.data('isni') || '').replace(/\s+/g, '')
         : '';
}

function reanchorIsniBox(anchor){
    if(!anchor || !anchor.length) return false;
    isniAnchor = anchor;
    placeIsniBox(anchor);
    return true;
}

function placeIsniBox(anchor){

    if(isniDock) return;

    var box = $('#isniBox');
    if(!box.length || !anchor || !anchor.length) return;

    var r  = anchor[0].getBoundingClientRect();
    var bw = box.outerWidth();
    var bh = box.outerHeight();
    var vw = $(window).width();
    var vh = $(window).height();
    var m  = 8;

    var barH = ($('#ctrl_bar').outerHeight() || 0) + m;

    var left = r.left;
    if(left + bw > vw - m) left = vw - bw - m;
    if(left < m) left = m;

    var top = r.bottom + 6;
    if(top + bh > vh - m){
        var above = r.top - bh - 6;
        if(above >= barH) top = above;
        else              top = Math.max(barH, vh - m - bh);
    }
    if(top < barH) top = barH;

    box.css({left: Math.round(left + window.pageXOffset) + 'px',
             top:  Math.round(top  + window.pageYOffset) + 'px'});
}

function openIsniBox(anchor){

    var isni = String(anchor.data('isni') || '').replace(/\s+/g, '');
    if(!isni) return;

    var box = ensureIsniBox();
    isniAnchor = anchor;

    box.removeClass('isni-foldable is-folded');
    isniShown = '';
    isniShownLoaded = false;

    var label = String(anchor.attr('data-label') || '').trim();
    var head  = 'ISNI ' + isni.replace(/(.{4})(?=.)/g, '$1 ');
    box.find('.isni-hd-t').text(label ? label + ' — ' + head : head);
    box.addClass('open');

    if(isniCache[isni]){
        renderIsniBox(isniCache[isni]);
        placeIsniBox(anchor);
        return;
    }

    box.find('.isni-bd').html('<p class="isni-wait">Querying ISNI&hellip;</p>');
    placeIsniBox(anchor);

    $.ajax({url: 'php/retrieve_isni.php', type: 'POST', dataType: 'json', data: {isni: isni}})

        .done(function(data){
            isniCache[isni] = data;
            renderIsniBox(data);
            placeIsniBox(anchor);
        })

        .fail(function(){

            renderIsniBox({status: 'error', isni: isni, links: {
                isni_org:  'https://isni.org/isni/' + isni,
                isni_oclc: 'https://isni.oclc.org/cbs/DB=1.2//CMD?ACT=SRCH&IKT=8006&TRM=ISN%3A'
                           + isni + '&TERMS_OF_USE_AGREED=Y&terms_of_use_agree=send'
            }});
            placeIsniBox(anchor);
        });
}

function isniBodyHtml(d){

    var h = [];
    var lnk = function(url, label){
        return '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(label) + '</a>';
    };

    var who = [];
    if(d.names && d.names.length){
        for (var i = 0; i < d.names.length && i < 4; i++) {
            var n = d.names[i];
            var s = $.trim((n.forename || '') + ' ' + (n.surname || ''));
            if(n.dates) s += ' (' + n.dates + ')';
            if(s) who.push(esc(s));
        }
    }
    if(who.length) h.push('<p class="isni-name">' + who.join('<br>') + '</p>');
    if(d.wikidata && d.wikidata.description){
        h.push('<p class="isni-desc">' + esc(d.wikidata.description) + '</p>');
    }

    if(d.links){
        h.push('<p class="isni-sec">Record</p><ul class="isni-list">');
        if(d.links.isni_org)  h.push('<li>' + lnk(d.links.isni_org, 'isni.org — public record') + '</li>');
        if(d.links.isni_oclc) h.push('<li>' + lnk(d.links.isni_oclc, 'isni.oclc.org — full data') + '</li>');
        h.push('</ul>');
    }

    if(d.external && d.external.length){
        h.push('<p class="isni-sec">External links</p><ul class="isni-list">');
        for (var k = 0; k < d.external.length && k < 20; k++) {
            h.push('<li>' + lnk(d.external[k].url, d.external[k].label) + '</li>');
        }
        if(d.external.length > 20) h.push('<li class="isni-more">and ' + (d.external.length - 20) + ' more</li>');
        h.push('</ul>');
    }

    if(d.notes && d.notes.length){
        h.push('<p class="isni-sec">Notes</p><ul class="isni-list isni-notes">');
        for (var m = 0; m < d.notes.length && m < 8; m++) h.push('<li>' + esc(d.notes[m]) + '</li>');
        h.push('</ul>');
    }

    if(d.titles && d.titles.length){
        h.push('<p class="isni-sec">Works listed</p><ul class="isni-list isni-titles">');
        for (var t = 0; t < d.titles.length; t++) h.push('<li>' + esc(d.titles[t]) + '</li>');
        if(d.titlesMore) h.push('<li class="isni-more">and ' + d.titlesMore + ' more</li>');
        h.push('</ul>');
    }

    if(d.sources && d.sources.length){
        var codes = [];
        for (var s = 0; s < d.sources.length; s++) {
            if(d.sources[s].code && codes.indexOf(d.sources[s].code) === -1) codes.push(d.sources[s].code);
        }
        if(codes.length) h.push('<p class="isni-sec">Contributing databases</p>'
                              + '<p class="isni-codes">' + esc(codes.join(', ')) + '</p>');
    }

    if(d.status === 'empty'){
        h.push('<p class="isni-warn">No detailed data retrieved: the record is still available through the links above.</p>');
    } else if(d.status === 'error'){
        h.push('<p class="isni-warn">The server could not query ISNI: the links above remain valid.</p>');
    } else if(d.status === 'invalid'){
        h.push('<p class="isni-warn">Invalid ISNI.</p>');
    }

    return h.join('');
}

function renderIsniBox(d){
    $('#isniBox .isni-bd').html(isniBodyHtml(d));
}

var isniFiche = null;

function enableIsniInflowFiche(opt){

    opt = opt || {};
    var host = document.getElementById(opt.into || 'isniColumn');
    if(!host) return false;

    if(isniFiche && isniFiche.host === host) return true;

    if((' ' + host.className + ' ').indexOf(' isni-inflow ') === -1){
        host.className += (host.className ? ' ' : '') + 'isni-inflow';
    }

    var box = $('<div class="isni-box isni-foldable" role="region" aria-label="ISNI record">'
              + '<div class="isni-hd"><span class="isni-hd-t"></span></div>'
              + '<div class="isni-bd"></div></div>').appendTo(host);

    box.on('click', '.isni-toggle', function(evt){
        evt.preventDefault();
        evt.stopPropagation();
        toggleIsniFiche();
    });

    box.on('click', function(evt){ evt.stopPropagation(); });

    isniFiche = {host: host, box: box, shown: '', loaded: false};
    return true;
}

function showIsniFiche(isni, label){

    if(!isniFiche) return false;

    var id = String(isni || '').replace(/\s+/g, '');
    if(!id){ hideIsniFiche(); return false; }

    if(id !== isniFiche.shown){
        isniFiche.shown  = id;
        isniFiche.loaded = false;
        isniFiche.box.find('.isni-bd').empty();
    }

    var head = 'ISNI ' + id.replace(/(.{4})(?=.)/g, '$1 ');
    var lbl  = String(label || '').trim();

    isniFiche.box.find('.isni-hd-t').html(
        '<button type="button" class="isni-toggle" aria-expanded="false">'
        + esc(lbl ? lbl + ' — ' + head : head)
        + '<span class="isni-caret" aria-hidden="true"></span></button>');

    isniFiche.box.addClass('open').addClass('is-folded');
    return true;
}

function hideIsniFiche(){
    if(!isniFiche) return;
    isniFiche.box.removeClass('open is-folded');
    isniFiche.shown  = '';
    isniFiche.loaded = false;
}

function toggleIsniFiche(){

    if(!isniFiche) return;

    var box    = isniFiche.box;
    var folded = box.hasClass('is-folded');

    box.toggleClass('is-folded', !folded);
    box.find('.isni-toggle').attr('aria-expanded', folded ? 'true' : 'false');

    if(!folded || isniFiche.loaded || !isniFiche.shown) return;

    isniFiche.loaded = true;

    var id = isniFiche.shown;

    if(isniCache[id]){ box.find('.isni-bd').html(isniBodyHtml(isniCache[id])); return; }

    box.find('.isni-bd').html('<p class="isni-wait">Querying ISNI&hellip;</p>');

    $.ajax({url: 'php/retrieve_isni.php', type: 'POST', dataType: 'json', data: {isni: id}})

        .done(function(data){
            isniCache[id] = data;
            if(isniFiche.shown === id) box.find('.isni-bd').html(isniBodyHtml(data));
        })

        .fail(function(){

            isniFiche.loaded = false;
            if(isniFiche.shown !== id) return;
            box.find('.isni-bd').html(isniBodyHtml({status: 'error', isni: id, links: {
                isni_org:  'https://isni.org/isni/' + id,
                isni_oclc: 'https://isni.oclc.org/cbs/DB=1.2//CMD?ACT=SRCH&IKT=8006&TRM=ISN%3A'
                           + id + '&TERMS_OF_USE_AGREED=Y&terms_of_use_agree=send'
            }}));
        });
}
