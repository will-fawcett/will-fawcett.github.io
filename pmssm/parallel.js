//
//  parallel.js
//
//  Created by William Fawcett. 
//  Copyright © 2017 William Fawcett. All rights reserved.
//

var keys = ["LSP", 
    "Excluded", 
    "tanbeta", 
    "mtR", 
    "mqL3", 
    "m(h)", 
    "cos2_t", 
    "cos2_b", 
    "mu",
    "m(~t_1)", 
    "m(~b_1)", 
    "m(~t_2)", 
    "m(~b_2)", 
    "Xt",
    "log(Omegah^2)",
    "finetuning",
    "m(~g)",
    "m(~chi_10)",
    "m(NLSP)-m(LSP)",
    "hue",
    /*"saturation", "lightness"*/
    ]


// shim layer with setTimeout fallback
window.requestAnimFrame = window.requestAnimationFrame       ||
                          window.webkitRequestAnimationFrame ||
                          window.mozRequestAnimationFrame    ||
                          window.oRequestAnimationFrame      ||
                          window.msRequestAnimationFrame     ||
                          function( callback ){
                            window.setTimeout(callback, 1000 / 60);
                          };

d3.select("#hide-ticks")
    .on("click", function() {
      d3.selectAll(".axis g").style("display", "none");
      d3.selectAll(".axis path").style("display", "none");
    });

d3.select("#show-ticks")
    .on("click", function() {
      d3.selectAll(".axis g").style("display", "block");
      d3.selectAll(".axis path").style("display", "block");
    });

var width = document.body.offsetWidth,
    height = document.body.offsetHeight;

var m = [30, 0, 10, 0],
    w = width - m[1] - m[3],
    h = 290 - m[0] - m[2];

var xscale = d3.scale.ordinal().rangePoints([0, w], 1),
    yscale = {};

var line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),
    foreground,
    scatter,
    dimensions,
    n_dimensions,
    brush_count = 0;

d3.select("#chart")
    .style("width", (w + m[1] + m[3]) + "px")
    .style("height", (h + m[0] + m[2]) + "px")

d3.selectAll("#chart canvas")
    .attr("width", w)
    .attr("height", h)
    .style("padding", m.join("px ") + "px");

foreground = document.getElementById('foreground').getContext('2d');
/*scatterplot = document.getElementById('scatterplot').getContext('2d');*/

foreground.strokeStyle = "rgba(0,100,160,0.1)";
foreground.lineWidth = 1.3;    // avoid weird subpixel effects
foreground.globalCompositeOperation = "lighter";
/*scatterplot.globalCompositeOperation = "lighter";*/

foreground.fillText("Loading...",w/2,h/2);

var svg = d3.select("svg")
    .attr("width", w + m[1] + m[3])
    .attr("height", h + m[0] + m[2])
  .append("svg:g")
    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

d3.csv("pmssm_10.csv", function(data) {

  // Convert quantitative scales to floats
  data = data.map(function(d) {
    for (var k in d) {
      d[k] = parseFloat(d[k]) || 0;
    };
    return d;
  });

  // Extract the list of dimensions and create a scale for each.
  xscale.domain(dimensions = keys.filter(function(d) {
    var scale = (yscale[d] = d3.scale.linear()
        .domain(d3.extent(data, function(p) { return +p[d]; })));
    if (d == "Excluded") return scale.range([0, h]);
    return scale.range([h, 0]);
  }));

  n_dimensions = dimensions.length;

  // Render full foreground
  paths(data, foreground, brush_count);

  // Add a group element for each dimension.
  var g = svg.selectAll(".dimension")
      .data(dimensions)
    .enter().append("svg:g")
      .attr("class", "dimension")
      .attr("transform", function(d) { return "translate(" + xscale(d) + ")"; });

  // Add an axis and title.
  g.append("svg:g")
      .attr("class", "axis")
      .each(function(d) { d3.select(this).call(axis.scale(yscale[d])); })
    .append("svg:text")
      .attr("text-anchor", "left")
      .attr("y", -8)
      .attr("x", -4)
      .attr("transform", "rotate(-19)")
      .attr("class", "label")
      .text(String);

  // Add and store a brush for each axis.
  g.append("svg:g")
      .attr("class", "brush")
      .each(function(d) { d3.select(this).call(yscale[d].brush = d3.svg.brush().y(yscale[d]).on("brush", brush)); })
    .selectAll("rect")
      .attr("x", -16)
      .attr("width", 32)
      .attr("rx", 3)
      .attr("ry", 3);

  // Handles a brush event, toggling the display of foreground lines.
  function brush() {
    brush_count++;
    var actives = dimensions.filter(function(p) { return !yscale[p].brush.empty(); }),
        extents = actives.map(function(p) { return yscale[p].brush.extent(); });

    // Get lines within extents
    var selected = [];
    data.map(function(d) {
      return actives.every(function(p, i) {
        return extents[i][0] <= d[p] && d[p] <= extents[i][1];
      }) ? selected.push(d) : null;
    });

    // Render selected lines
    paths(selected, foreground, brush_count);
  }

  function paths(data, ctx, count) {
    var n = data.length,
        i = 0,
        opacity = d3.min([1.5/Math.pow(n,0.5),1]);
    d3.select("#selected-count").text(n);
    d3.select("#opacity").text((""+opacity).slice(0,6));

    data = _.shuffle(data);

    // Extra text to show LSP type 
    var foodText = "";
    data.slice(0,10).forEach(function(d) {
      foodText += "<span style='background:" + color(d,0.85) + "'></span>LSP " + d.LSP + "<br/>";
    });
    d3.select("#food-list").html(foodText);

    ctx.clearRect(0,0,w+1,h+1);
    //scatterplot.clearRect(0,0,290,290);
    function render() {
      var max = d3.min([i+12, n]);
      data.slice(i,max).forEach(function(d) {
        path(d, foreground, color(d,opacity));
        //circle(d, scatterplot, color(d,0.5));
      });
      i = max;
      d3.select("#rendered-count").text(i);
    };

    // render all lines until finished or a new brush event
    (function animloop(){
      if (i >= n || count < brush_count) return;
      requestAnimFrame(animloop);
      render();
    })();
  };
});


function path(d, ctx, color) {
  if (color) ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(xscale(0),yscale[dimensions[0]](d[dimensions[0]]));
  dimensions.map(function(p,i) {
    ctx.lineTo(xscale(p),yscale[p](d[p]));
  });
  ctx.stroke();
};

function circle(d,ctx,color) {
  if (color) ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(290-yscale['tanbeta'](d['tanbeta']),yscale['mtR'](d['mtR']),1,0,2*Math.PI)
  ctx.closePath();
  ctx.fill();
};

function color(d,a) {
  return "hsla(" + d['hue'] + ",100%,50%," + a + ")";
  /*return "hsla(" + d['hue'] + "," + d['saturation'] + "," + d['lightness'] + "%," + a + ")";*/
  /*return "hsla(" + (Math.max(100-50*d['tanbeta'],0)) +*/
  /*"," + (65*d['tanbeta']) +*/
  /*"%," + 50 +"%," + a + ")";*/
};
