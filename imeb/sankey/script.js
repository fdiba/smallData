var data = {};
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


function setSankeyNodes(data, key){

  //--------- nodes years ------------//
  var year = data[key].year;
  
  if(nodes.length>0){

    var hasBeenIndexed = false;

    for(var i=0; i<nodes.length; i++){

      var pos = nodes[i].name.search(year);

      if(pos>-1) {
        hasBeenIndexed = true;
        break;
      }
    }

    if(!hasBeenIndexed)nodes.push({name: year});

  } else {
    nodes.push({name: year});
  }

  //---- nodes category --------//

  var cat = data[key].category;
  if(cat=='')cat='Inconnue';

  hasBeenIndexed = false;

  for(var j=0; j<nodes.length; j++){

    var pos = nodes[j].name.search(cat);

    if(pos>-1) {
      hasBeenIndexed = true;
      break;
    }
  }

  if(!hasBeenIndexed)nodes.push({name: cat});


  //------- setup link -----------//
  if(links.length>0){


    var hasFoundSourceAndTarget = false;

    var sourceId = 999; //year
    var targetId = 999; //cat

    //search links: search source link

    for (var k=0; k<nodes.length; k++){

      var sPos = nodes[k].name.search(year);
      if(sPos==0)sourceId=k;

      var tPos = nodes[k].name.search(cat);
      if(tPos==0)targetId=k;

      if(sourceId!=999 && targetId!=999){

        hasFoundSourceAndTarget = true;
        break;

      }

    }


    if (hasFoundSourceAndTarget){
      //search link

      var hasFoundLink = false;

      for (var m=0; m<links.length; m++){

        if(links[m].source == sourceId && links[m].target == targetId){
          links[m].value++;
          hasFoundLink = true;
          break;
        }


      }

      if(!hasFoundLink)links.push({source: sourceId, target: targetId, value: 1});

      //if link founded edit value

      //if not create link
    } else {
      console.log('never used');
    }

  } else {
    links.push({source: 0, target: 1, value: 1});
  }

}
function createData(){
  data = {'nodes': nodes, 'links': links};
}
function sankeyStuff(){

  var max = data.nodes.length;
  
  colors = d3.scale.linear()
    .domain([0, max*.25, max*.5, max*.75, max])
    .range(['#5dbf8c', '#8ecb84', '#bad97a', '#dab470', '#f08f67']);

  // Some setup stuff.
  var margin = {top: 20, right: 1, bottom: 20, left: 41};
  svgWidth = 960 - margin.left - margin.right;
  var height = 1500 - margin.top - margin.bottom;
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
    .size([svgWidth, height])
    .nodes(data.nodes)
    .links(data.links)
    .layout(32);

  // Path data generator.
  var path = sankey.link();

  // Draw the links.
  var links = svg.append("g").selectAll(".link")
    .data(data.links)
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
    .data(data.nodes)
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

        if(d.name.search('19') == 0 || d.name.search('20') == 0){
          return sankey.nodeWidth();
        } else {
          return 20;
        }

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
      return d.name;
    });

  nodes.append("text")
    .attr({
      x: sankey.nodeWidth() / 2,
      y: function (d) {
        return d.dy / 2;
      },
      dx: function(d){

        if(d.name.search('19') == 0 || d.name.search('20') == 0){
          return '-2.5em';
        } else {
          return '1.5em';
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
