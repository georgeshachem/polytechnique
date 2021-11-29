var ctx = {
    w: 1280,
    h: 720,
};

// clipping
var clipText = function (svg) {
    svg.selectAll(".leaf")
        .append("clipPath")
        .attr("id", (d) => "clip-" + d.data.id)
        .append("use")
        .attr("xlink:href", (d) => "#" + d.data.id);

    d3.selectAll(".leaf text").attr(
        "clip-path",
        (d) => "url(#clip-" + d.data.id + ")"
    );
};

function sumByCount(d) {
    return d.Amount;
}

var createTreemap = function (data, svg) {
    // ...

    var root = d3
        .stratify()
        .id((d) => d.Code)
        .parentId((d) =>
            d.Code == "COFOG"
                ? null
                : d.Code.length == 4
                ? "COFOG"
                : d.Code.substring(0, d.Code.length - 2)
        )(data);

    root.eachBefore((d) => (d.data.id = d.data.Code));
    root.sum(sumByCount);

    var treemap = d3
        .treemap()
        .tile(d3.treemapBinary)
        .size([ctx.w, ctx.h])
        .paddingInner(3)
        .paddingOuter(3);

    treemap(root);

    /* draw */
    var color_line = d3.scaleOrdinal(d3.schemeCategory10);
    var color_rect;
    var fader = function (c) {
            return d3.interpolateRgb(c, "#fff")(0.6);
        },
        color_rect = d3.scaleOrdinal(d3.schemeCategory10.map(fader));

    var nodes = svg
        .selectAll("g")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
        .classed("leaf", (d) => d.children == null);

    nodes
        .append("rect")
        .attr("id", (d) => d.data.id)
        .attr("width", (d) => d.x1 - d.x0)
        .attr("height", (d) => d.y1 - d.y0)
        .attr("fill", (d) => color_rect(d.data.Code.substring(0, 4)))
        .attr("fill-opacity", 1)
        .attr("stroke", (d) => color_line(d.data.Code.substring(0, 4)))
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 1);

    d3.selectAll(".leaf")
        .append("text")
        .style("fill", (d) =>
            tinycolor(color_rect(d.data.Code.substring(0, 4))).darken(50)
        )
        .selectAll("tspan")
        .data((d) => d.data.Description.split(" "))
        .enter()
        .append("tspan")
        .attr("x", 4)
        .attr("y", (d, i) => 13 + i * 10)
        .text((d) => d);

    clipText(svg);
};

var createViz = function () {
    console.log("Using D3 v" + d3.version);
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

var loadData = function (svgEl) {
    // load cofog.csv
    // and call createTreemap(...) passing this data and svgEL
    d3.csv("cofog.csv").then(function (data) {
        data.push({
            Amount: "0",
            Code: "COFOG",
            Description: "COFOG",
            Level: "0",
        });

        createTreemap(data, svgEl);
    });
};
