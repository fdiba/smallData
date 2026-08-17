var graph = {};
var nodes = [];
var links = [];
var colors;
var SD_PALETTE = ['#00a57d', '#4299dc', '#ce7a3b'];
function sdColor(i){
  return SD_PALETTE[((i % SD_PALETTE.length) + SD_PALETTE.length) % SD_PALETTE.length];
}
var svgWidth;

var nodeIndex = {};

var VIEW_FULL  = 'full';
var VIEW_LIGHT = 'light';
var mode    = VIEW_LIGHT;
var records = null;

var catComposers = {};

var catPeriode = {};

var DISTINCTIONS_HORS_AXE = {500: 'Magistère', 600: 'Résidence'};

d3.text("php/retrieve_categories.php", function(error, text){

  if(error || !text){ console.log('categories: aucune donnee'); return; }

  var raw = text.split("%");
  var data = [];

  for(var i=0; i+10 < raw.length; i+=11){
    data.push({ year: raw[i], category: raw[i+1], name: raw[i+2],
                firstName: raw[i+3], isni: raw[i+4], artistId: raw[i+5],
                editions: raw[i+6], catDebut: raw[i+7], catFin: raw[i+8],
                subCat: raw[i+9], awardPrice: raw[i+10] });
  }

  data.reverse();

  records = data;
  countComposersByCategory();
  collectCategoryPeriods();
  bindViewSwitch();
  build();
});

function build(){

  nodes = [];
  links = [];
  nodeIndex = {};
  graph = {};

  var host = document.getElementById('chart');
  if(host) host.innerHTML = '';

  for(var k = 0; k < records.length; k++){
    setSankeyNodes(records, k);
  }

  createData();
  sankeyStuff();

  d3.select("#chart svg")

  .attr('width', svgWidth+150+'px');

  colors = sdColor;

  d3.selectAll('.link').style('stroke', function(d, i){
    return colors(i);
  });
}

function libelleCategorie(d){

  if(d.subCat) return d.subCat;

  if(d.category){
    var m = /^Degré [IVX]+ - (.+)$/.exec(d.category);
    if(m) return m[1];
  }

  return 'None';
}

function countComposersByCategory(){

  var seen = {}, k, d, cat, pair;

  catComposers = {};

  for(k = 0; k < records.length; k++){
    d = records[k];
    cat = libelleCategorie(d);
    pair = cat + '' + d.artistId;
    if(seen[pair]) continue;
    seen[pair] = true;
    catComposers[cat] = (catComposers[cat] || 0) + 1;
  }
}

function collectCategoryPeriods(){

  var k, d, cat;

  catPeriode = {};

  for(k = 0; k < records.length; k++){
    d = records[k];

    cat = libelleCategorie(d);
    if(catPeriode.hasOwnProperty(cat)) continue;
    if(!d.catDebut || !d.catFin) continue;
    catPeriode[cat] = (d.catDebut === d.catFin) ? d.catDebut
                                                : d.catDebut + '-' + d.catFin;
  }
}

function bindViewSwitch(){

  var box = document.getElementById('view');
  if(!box) return;

  var defaut = box.getAttribute('data-view-default');
  if(defaut === VIEW_FULL || defaut === VIEW_LIGHT) mode = defaut;

  var items = box.getElementsByTagName('li');

  function majAdresse(){
    if(!window.history || !window.history.replaceState) return;
    var d = (mode === VIEW_FULL) ? '2' : '1';
    window.history.replaceState(null, '', window.location.pathname + '?d=' + d);
  }

  function paint(){
    for(var p = 0; p < items.length; p++){
      var on = items[p].getAttribute('data-view') === mode;
      items[p].className = on ? 'b_on' : 'b_off';
      items[p].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function choose(el){
    var m = el.getAttribute('data-view');
    if(!m || m === mode) return;
    mode = m;
    paint();
    majAdresse();
    hideFlowTip();
    build();

    if(typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0);
  }

  for(var i = 0; i < items.length; i++){
    (function(el){
      el.onclick = function(){ choose(el); };
      el.onkeydown = function(evt){
        var k = evt.keyCode || evt.which;
        if(k === 13 || k === 32){
          if(evt.preventDefault) evt.preventDefault();
          choose(el);
        }
      };
    })(items[i]);
  }

  paint();
}

function addNode(key, node){
    if(nodeIndex.hasOwnProperty(key)) return nodeIndex[key];
    nodeIndex[key] = nodes.length;
    nodes.push(node);
    return nodeIndex[key];
}

function addToSet(set, value){
  value = String(value === undefined || value === null ? '' : value)
            .replace(/^\s+|\s+$/g, '');
  if(value) set[value] = true;
}
function sortedKeys(set){
  var out = [];
  for(var k in set){ if(set.hasOwnProperty(k)) out.push(k); }
  out.sort(function(a, b){ return a - b; });
  return out;
}

var flowTip = null;

function ensureFlowTip(){
  if(flowTip) return flowTip;
  flowTip = document.createElement('div');
  flowTip.id = 'flow_tip';
  document.body.appendChild(flowTip);
  return flowTip;
}

function moveFlowTip(evt){

  if(!flowTip || !evt) return;

  var m  = 14;
  var w  = flowTip.offsetWidth;
  var h  = flowTip.offsetHeight;
  var vw = document.documentElement.clientWidth;
  var vh = document.documentElement.clientHeight;

  var x = evt.clientX + m;
  var y = evt.clientY + m;
  if(x + w > vw - 8) x = evt.clientX - w - m;
  if(y + h > vh - 8) y = evt.clientY - h - m;
  if(x < 8) x = 8;
  if(y < 8) y = 8;

  flowTip.style.left = Math.round(x + window.pageXOffset) + 'px';
  flowTip.style.top  = Math.round(y + window.pageYOffset) + 'px';
}

function showFlowTip(text, evt){
  var t = ensureFlowTip();
  t.textContent = text;
  t.className = 'open';
  moveFlowTip(evt);
}

function hideFlowTip(){
  if(flowTip) flowTip.className = '';
}

function plural(n, word){
  if(n === 1) return n + " " + word;
  if(/[^aeiou]y$/.test(word)) return n + " " + word.slice(0, -1) + "ies";
  return n + " " + word + "s";
}

function linkTitle(d){

  if(d.target.type !== 'composer'){
    return d.target.name + ", " + d.source.name + " — " + plural(d.value, "award");
  }

  var txt = d.target.fullName + " — " + plural(d.value, "award") +
            " in " + d.source.name;

  var parts = [];
  var yrs = sortedKeys(d.years || {});
  var eds = sortedKeys(d.editions || {});

  var autres = [];
  for(var k = 0; k < eds.length; k++){
    if(yrs.indexOf(eds[k]) < 0) autres.push(eds[k]);
  }

  if(yrs.length)    parts.push("awarded " + yrs.join(", "));
  if(autres.length) parts.push("also entered " + autres.join(", "));
  if(parts.length) txt += " (" + parts.join(" · ") + ")";

  return txt;
}

function nodeTitle(d){

  var out  = plural(d.value || 0, "award");
  var from = d.targetLinks ? d.targetLinks.length : 0;
  var to   = d.sourceLinks ? d.sourceLinks.length : 0;

  if(d.type === 'year'){
    out += " in " + plural(to, "category");
  } else if(d.type === 'category' && d.distinction){

    var dcomp = catComposers.hasOwnProperty(d.name) ? catComposers[d.name] : to;
    out = "✦ a DISTINCTION, not a category — awarded across categories · "
        + out + " to " + plural(dcomp, "composer")
        + ", across " + plural(from, "edition");
    if(catPeriode[d.name]){ out = catPeriode[d.name] + " — " + out; }
  } else if(d.type === 'category'){

    var comp = catComposers.hasOwnProperty(d.name) ? catComposers[d.name] : to;
    out += " to " + plural(comp, "composer") +
           ", across " + plural(from, "edition");
    if(catPeriode[d.name]){ out = catPeriode[d.name] + " — " + out; }
  } else {
    out += " in " + plural(from, "category");
  }

  return out;
}

function createLinkBetween(sourceId, targetId, rec){

  var link = null;

  for (var m=0; m<links.length; m++){

    if(links[m].source == sourceId && links[m].target == targetId){
      links[m].value++;
      link = links[m];
      break;
    }

  }

  if(!link){
    link = {source: sourceId, target: targetId, value: 1};
    links.push(link);
  }

  if(rec){
    if(!link.years){ link.years = {}; link.editions = {}; }
    addToSet(link.years, rec.year);
    if(rec.editions){
      var eds = rec.editions.split(',');
      for(var e=0; e<eds.length; e++){ addToSet(link.editions, eds[e]); }
    }
  }

}
function setSankeyNodes(data, key){

  var d = data[key];

  var yearId = addNode('y' + d.year, {name: d.year, type: 'year'});

  var category = libelleCategorie(d);

  var estDistinction = (DISTINCTIONS_HORS_AXE[+d.awardPrice] === category);
  var catId = addNode('c' + category,
                      {name: category, type: 'category',
                       distinction: estDistinction});

  createLinkBetween(yearId, catId);

  if(mode !== VIEW_FULL) return;

  var label = d.firstName ? (d.name + ', ' + d.firstName) : d.name;

  var fullName = d.firstName ? (d.firstName + ' ' + d.name) : d.name;
  var compId = addNode('a' + d.artistId,
                       {name: label, fullName: fullName,
                        type: 'composer', isni: d.isni});

  createLinkBetween(catId, compId, d);

}
function createData(){
  graph = {'nodes': nodes, 'links': links};
}

function columnStats(){

  var i, vin = [], vout = [], cols = {};

  for(i = 0; i < graph.nodes.length; i++){ vin[i] = 0; vout[i] = 0; }

  for(i = 0; i < graph.links.length; i++){
    vout[graph.links[i].source] += graph.links[i].value;
    vin[graph.links[i].target]  += graph.links[i].value;
  }

  for(i = 0; i < graph.nodes.length; i++){
    var t = graph.nodes[i].type;
    var v = Math.max(vin[i], vout[i]);
    if(!cols[t]) cols[t] = {count: 0, flow: 0, v1: Infinity, v2: Infinity};
    var c = cols[t];
    c.count++;
    c.flow += v;
    if(v < c.v1){ c.v2 = c.v1; c.v1 = v; }
    else if(v < c.v2){ c.v2 = v; }
  }

  return cols;
}

function chartHeight(pad, pitch){

  var cols = columnStats(), t, c, ky = 0, h = 0;

  for(t in cols){
    if(!cols.hasOwnProperty(t)) continue;
    c = cols[t];
    if(c.count < 2) continue;
    var mean = (c.v1 + (isFinite(c.v2) ? c.v2 : c.v1)) / 2;
    if(mean > 0) ky = Math.max(ky, (pitch - pad) / mean);
  }

  if(ky <= 0) return 1500;

  for(t in cols){
    if(!cols.hasOwnProperty(t)) continue;
    c = cols[t];
    h = Math.max(h, ky * c.flow + (c.count - 1) * pad);
  }

  return Math.round(h);
}

function sankeyStuff(){

  colors = sdColor;

  var margin = {top: 20, right: 1, bottom: 20, left: 41};

  svgWidth = 960 - margin.left - margin.right
           + (mode === VIEW_FULL ? 760 : 280);

  var NODE_PADDING = (mode === VIEW_FULL) ? 12 : 16;
  var LABEL_PITCH  = 18;
  var height = chartHeight(NODE_PADDING, LABEL_PITCH);

  var svg = d3.select("#chart").append("svg")
    .attr({
      width: svgWidth + margin.left + margin.right,
      height: height + margin.top + margin.bottom
    })
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var sankey = d3.sankey()
    .nodeWidth(20)
    .sinksRight(true)
    .nodePadding(NODE_PADDING)

    .size([svgWidth - (mode === VIEW_FULL ? 150 : 330), height])
    .nodes(graph.nodes)
    .links(graph.links)
    .layout(32);

  var path = sankey.link();

  var links = svg.append("g").selectAll(".link")
    .data(graph.links)
    .enter()
    .append("path")
      .attr({
        "class": "link",
        d: path
      })
      .style("stroke-width", function (d) {
        return Math.max(1, d.dy);
      })

  links
    .on('mouseover', function (d) { showFlowTip(linkTitle(d), d3.event); })
    .on('mousemove', function ()  { moveFlowTip(d3.event); })
    .on('mouseout',  function ()  { hideFlowTip(); });

  var nodes = svg.append("g").selectAll(".node")
    .data(graph.nodes)
    .enter()
    .append("g")
    .attr({
      "class": "node",
      transform: function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      }
    });

  nodes.append("rect")
    .attr({
      height: function (d) {
        return d.dy;
      },
      width: function(d){
        return sankey.nodeWidth();
      }
    })
    .style({
      fill: function (d, i) {

        return d.color = colors(i);

      }
    })

    .on('mouseover', function (d) { showFlowTip(nodeTitle(d), d3.event); })
    .on('mousemove', function ()  { moveFlowTip(d3.event); })
    .on('mouseout',  function ()  { hideFlowTip(); });

  var labels = nodes.append("text")
    .attr({
      x: sankey.nodeWidth() / 2,
      y: function (d) {
        return d.dy / 2;
      },
      dx: function(d){

        if(d.type === 'year'){
          return '-3em';
        } else {
          return '2em';
        }
      },
      dy: ".35em",
      "text-anchor": function (d){

        if(d.type === 'year'){
          return 'middle';
        } else {
          return 'left';
        }

      },
      transform: null
    })
    .text(function (d) {

      return d.distinction ? (d.name + ' ✦') : d.name;
    });

  labels.filter(function(d){ return d.type === 'composer' && d.isni; })
    .attr('class', 'isni-node')
    .attr('data-isni', function(d){ return d.isni; })
    .on('click', function(){
      d3.event.stopPropagation();
      openIsniBox($(this));
    });
}

