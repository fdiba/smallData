var graph = {};
var nodes = [];
var links = [];
var colors;
var svgWidth;

d3.csv("../data/smallData.csv", function(data){

  data.reverse();

  for(key in data) {
    setSankeyNodes(data, key);
  }

  createData();
  sankeyStuff();

  d3.select("svg")
  //.style('background', '#FDF6E3')
  .attr('width', svgWidth+150+'px');

  var max = links.length;
  
  colors = d3.scale.linear()
    .domain([0, max*.25, max*.5, max*.75, max])
    .range(['#5dbf8c', '#8ecb84', '#bad97a', '#dab470', '#f08f67']);

  d3.selectAll('.link').style('stroke', function(d, i){
    return colors(i);
  });
});

function addNode(node){
    var hasBeenIndexed = false;
    for(var i=0; i<nodes.length; i++){
      var pos = nodes[i].name.search(node);
      if(pos>-1) {
        hasBeenIndexed = true;
        break;
      }
    }
    if(!hasBeenIndexed)nodes.push({name: node});
}
function createLinkBetween(node1, node2){

  var hasFoundSourceAndTarget = false;

  var sourceId = -1;
  var targetId = -1;

  //search links: search source link

  for (var i=0; i<nodes.length; i++){

    if(nodes[i].name.search(node1)==0)sourceId=i;
    if(nodes[i].name.search(node2)==0)targetId=i;

    if(sourceId>=0 && targetId>=0){
      hasFoundSourceAndTarget = true;
      break;
    }

  }


  if (hasFoundSourceAndTarget){
    //search link

    var hasFoundLink = false;

    //if link founded edit value
    for (var m=0; m<links.length; m++){

      if(links[m].source == sourceId && links[m].target == targetId){
        links[m].value++;
        hasFoundLink = true;
        break;
      }


    }
    //if not create link
    if(!hasFoundLink)links.push({source: sourceId, target: targetId, value: 1});

  } else {
    console.log('this should never happen');
  }


}
function setSankeyNodes(data, key){

  //--------- add years ------------//
  var year = data[key].year;
  if(nodes.length>0) addNode(year);
  else nodes.push({name: year});


  //---- add categories --------//
  var category = data[key].category;
  if(category=='')category='None';
  addNode(category);

  //---- add names --------//
  var name = data[key].name;
  addNode(name);

  //------- setup link between year and category -----------//
  if(links.length>0)createLinkBetween(year, category);
  else links.push({source: 0, target: 1, value: 1});

  createLinkBetween(category, name);

  

}
function createData(){
  graph = {'nodes': nodes, 'links': links};
}
function sankeyStuff(){

  var max = graph.nodes.length;
  
  colors = d3.scale.linear()
    .domain([0, max*.25, max*.5, max*.75, max])
    .range(['#5dbf8c', '#8ecb84', '#bad97a', '#dab470', '#f08f67']);

  // Some setup stuff edit it to make a bigger image !!
  var margin = {top: 20, right: 1, bottom: 20, left: 41};
  svgWidth = 960 - margin.left - margin.right + 760;
  var height = 1500 - margin.top - margin.bottom + 5000;
  var color = d3.scale.category20();

  // SVG (group) to draw in.
  var svg = d3.select("#chart").append("svg")
    .attr({
      width: svgWidth + margin.left + margin.right,
      height: height + margin.top + margin.bottom
    })
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Set up Sankey object.
  var sankey = d3.sankey()
    .nodeWidth(20)
    .nodePadding(6)
    .size([svgWidth-150, height]) //-50 to display composers name fully on x axis
    .nodes(graph.nodes)
    .links(graph.links)
    .layout(32);

  // Path data generator.
  var path = sankey.link();

  // Draw the links.
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

  links.append("title")
    .text(function (d, i) {
      return d.value + " "+ d.target.name + " en " + d.source.name;
    });

  // Draw the nodes.
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
        //return d.color = color(d.name.replace(/ .*/, ""));

        return d.color = colors(i);
        
      }
    })
    .append("title")
    .text(function (d) {
      return "d.name";
    });

  nodes.append("text")
    .attr({
      x: sankey.nodeWidth() / 2,
      y: function (d) {
        return d.dy / 2;
      },
      dx: function(d){

        if(d.name.search('19') == 0 || d.name.search('20') == 0){
          return '-3em';
        } else {
          return '2em'; //text offset
        }
      },
      dy: ".35em",
      "text-anchor": function (d){

        if(d.name.search('19') == 0 || d.name.search('20') == 0){
          return 'middle';
        } else {
          return 'left';
        }

      },
      transform: null
    })
    .text(function (d) {
      return d.name;
    });
}
