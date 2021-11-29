var ctx = {
    w: 1200,
    h: 1200,
};

var createRadialTree = function(data, svg){
    //...
};

var createViz = function(){
    console.log("Using D3 v"+d3.version);
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

var loadData = function(svgEl){
    // load cofog.csv
    // and call createRadialTree(...) passing this data and svgEL
};
