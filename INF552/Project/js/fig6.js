var ctx = {
    w: 1600,
    h: 600,
    margin: { top: 30, right: 30, bottom: 100, left: 60 },
    points_opacity: 0,
};

var createViz = function () {
    console.log("Using D3 v" + d3.version);
    var svg = d3.select("#main").append("svg").attr("id", "svg_boxplot");
    svg.attr("width", ctx.w + ctx.margin.left + ctx.margin.right);
    svg.attr("height", ctx.h + ctx.margin.top + ctx.margin.bottom);
    svg = svg
        .append("g")
        .attr("id", "boxplot")
        .attr(
            "transform",
            "translate(" + ctx.margin.left + "," + ctx.margin.top + ")"
        );
    loadData(svg);
};

const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

var loadData = function (svg) {
    d3.csv("../data/paris/listings-min.csv").then(function (data) {
        var sumstat = d3.rollup(
            data,
            function (d) {
                q1 = d3.quantile(
                    d
                        .map(function (g) {
                            return g.minimum_nights;
                        })
                        .sort(d3.ascending),
                    0.25
                );
                median = d3.quantile(
                    d
                        .map(function (g) {
                            return g.minimum_nights;
                        })
                        .sort(d3.ascending),
                    0.5
                );
                q3 = d3.quantile(
                    d
                        .map(function (g) {
                            return g.minimum_nights;
                        })
                        .sort(d3.ascending),
                    0.75
                );
                interQuantileRange = q3 - q1;
                min = q1 - 1.5 * interQuantileRange;
                max = q3 + 1.5 * interQuantileRange;
                return {
                    q1: q1,
                    median: median,
                    q3: q3,
                    interQuantileRange: interQuantileRange,
                    min: min,
                    max: max,
                };
            },
            (d) => d.neighbourhood
        );

        let minimum_nights = [];
        for (const elt of data) {
            minimum_nights.push(elt.minimum_nights);
        }
        let neighbourhoods = Array.from(sumstat.keys());

        var x = d3
            .scaleBand()
            .range([0, ctx.w])
            .domain(neighbourhoods)
            .paddingInner(1)
            .paddingOuter(0.5);
        svg.append("g")
            .attr("transform", "translate(0," + ctx.h + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        var y = d3.scaleLinear().domain([-700, 1500]).range([ctx.h, 0]);
        svg.append("g").call(d3.axisLeft(y));

        svg.append("text")
            .attr("x", ctx.w / 2)
            .attr("y", 0 + ctx.margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .text("Minimum nights stay box plot");

        svg.selectAll("vertLines")
            .data(sumstat)
            .enter()
            .append("line")
            .attr("x1", function (d) {
                return x(d[0]);
            })
            .attr("x2", function (d) {
                return x(d[0]);
            })
            .attr("y1", function (d) {
                return y(d[1].min);
            })
            .attr("y2", function (d) {
                return y(d[1].max);
            })
            .attr("stroke", "black")
            .style("width", 40);

        var boxWidth = ctx.w / neighbourhoods.length - 50;
        svg.selectAll("boxes")
            .data(sumstat)
            .enter()
            .append("rect")
            .attr("x", function (d) {
                return x(d[0]) - boxWidth / 2;
            })
            .attr("y", function (d) {
                return y(d[1].q3);
            })
            .attr("height", function (d) {
                return y(d[1].q1) - y(d[1].q3);
            })
            .attr("width", boxWidth)
            .attr("stroke", "black")
            .style("fill", "#69b3a2");

        svg.selectAll("medianLines")
            .data(sumstat)
            .enter()
            .append("line")
            .attr("x1", function (d) {
                return x(d[0]) - boxWidth / 2;
            })
            .attr("x2", function (d) {
                return x(d[0]) + boxWidth / 2;
            })
            .attr("y1", function (d) {
                return y(d[1].median);
            })
            .attr("y2", function (d) {
                return y(d[1].median);
            })
            .attr("stroke", "black")
            .style("width", 80);

        var jitterWidth = 50;
        svg.selectAll(".indPoints")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                return (
                    x(d.neighbourhood) -
                    jitterWidth / 2 +
                    Math.random() * jitterWidth
                );
            })
            .attr("cy", function (d) {
                return y(d.minimum_nights);
            })
            .attr("r", 4)
            .style("fill", "white")
            .style("opacity", ctx.points_opacity.toString())
            .attr("stroke", "black");
    });
};

function togglePoints() {
    ctx.points_opacity = 1 - ctx.points_opacity;
    console.log(ctx.points_opacity);
    d3.selectAll("circle").style("opacity", ctx.points_opacity.toString());
}
