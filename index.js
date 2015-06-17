var d3 = require('d3');
var taxonomyGetter = require('gramene-taxonomy-with-genomes');
var search = require('gramene-search-client').client;
var Q = require('q');

// Example query object.
// This is usually generated in code by gramoogle.
// This query:
//   1. asks for all genes with a particular InterPro domain
//   2. requests binned results that will match the bin configuration
//      of the taxonomy object
//   3. requests also to get taxonomy facet.
var exampleQuery = {
  "q": "",
  "filters": {
    "interpro_ancestors:2347": {
      "fq": "interpro_ancestors:2347"
    }
  },
  "resultTypes": {
    "taxon_id": {"facet.field": "{!facet.limit='50' facet.mincount='0' key='taxon_id'}taxon_id"},
    "fixed_200_bin": {"facet.field": "{!facet.limit='-1' facet.mincount='1' key='fixed_200_bin'}fixed_200_bin"}
  }
};

var height = 2000, width = 960;

var tree = d3.layout.tree()
  .size([height, width - 160])
  .separation(function (a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

var diagonal = d3.svg.diagonal()
  .projection(function (d) { return [d.y, d.x]; });

var svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g");

Q.all([
  taxonomyGetter.get(true), // FOR NOW, use local data
  search.geneSearch(exampleQuery)
]).spread(function (taxonomy, results) {
  taxonomy.setBinType('fixed', 200);
  taxonomy.setResults(results.fixed_200_bin);

  var nodes = tree.nodes(taxonomy),
    links = tree.links(nodes);

  var link = svg.selectAll(".link")
    .data(links)
    .enter().append("path")
    .attr("class", "link")
    .attr("d", diagonal);

  var node = svg.selectAll(".node")
    .data(nodes)
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", function (d) { return "translate(" + d.y + ", " + d.x + ")"; })
    .on("mouseover", function(d) { console.log(d) });

  node.append("circle")
    .attr("r", 4.5);

  node.append("text")
    .attr("dy", ".31em")
    .attr("dx", ".6em")
    .attr("text-anchor", "start")
    .text(function (d) {
      var name = d.model.name;
      if(d.model.genome) {
        name += ' (' + d.model.genome.results.count +
          ' results in ' + d.model.genome.results.bins +
          ' bins)';
      }
      return name;
    });
}).catch(function (err) {
  console.error(err);
});

d3.select(self.frameElement).style("height", height + "px");