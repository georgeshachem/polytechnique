var ctx = {
    w: 1600,
    h: 800,
    margin: { top: 10, right: 30, bottom: 30, left: 40 },
    data: null,
    x: null,
    y: null,
    yAxis: null,
};

var createViz = function () {
    console.log("Using D3 v" + d3.version);
    var svg = d3.select("#main").append("svg").attr("id", "svg_histogram");
    svg.attr("width", ctx.w + ctx.margin.left + ctx.margin.right);
    svg.attr("height", ctx.h + ctx.margin.top + ctx.margin.bottom);
    svg = svg
        .append("g")
        .attr("id", "histogram")
        .attr(
            "transform",
            "translate(" + ctx.margin.left + "," + ctx.margin.top + ")"
        );
    loadData(svg);
};

const quantile = (arr, q) => {
    arr = arr.map((elt) => elt.price);
    const asc = (arr) => arr.sort((a, b) => a - b);
    const sorted = asc(arr);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
        return sorted[base];
    }
};

var loadData = function (svg) {
    d3.csv("../data/paris/listings-min.csv").then(function (data) {
        ctx.data = data.map((item) => {
            return {
                price: item.price,
            };
        });

        ctx.x = d3
            .scaleLinear()
            .domain([
                0,
                d3.max(data, function (d) {
                    return d.price;
                }),
            ])
            .range([0, ctx.w]);
        svg.append("g")
            .attr("transform", "translate(0," + ctx.h + ")")
            .call(d3.axisBottom(ctx.x));

        ctx.y = d3.scaleLinear().range([ctx.h, 0]);
        ctx.yAxis = svg.append("g");

        d3.select("#nBin").on("input", function () {
            update(this.value);
        });

        update(20);
    });
};

function update(nBin) {
    var svg = d3.select("#histogram");

    var histogram = d3
        .histogram()
        .value(function (d) {
            return d.price;
        })
        .domain(ctx.x.domain())
        .thresholds(ctx.x.ticks(nBin));

    var bins = histogram(ctx.data);

    ctx.y.domain([
        0,
        d3.max(bins, function (d) {
            return d.length;
        }),
    ]);
    ctx.yAxis.transition().duration(1000).call(d3.axisLeft(ctx.y));

    var u = svg.selectAll("rect").data(bins);

    let percentile_value = quantile(ctx.data, 0.01);

    u.enter()
        .append("rect")
        .merge(u)
        .transition()
        .duration(1000)
        .attr("x", 1)
        .attr("transform", function (d) {
            return "translate(" + ctx.x(d.x0) + "," + ctx.y(d.length) + ")";
        })
        .attr("width", function (d) {
            return ctx.x(d.x1) - ctx.x(d.x0) - 1;
        })
        .attr("height", function (d) {
            return ctx.h - ctx.y(d.length);
        })
        .style("fill", function (d) {
            if (d.x0 < percentile_value) {
                return "orange";
            } else {
                return "#69b3a2";
            }
        });

    u.exit().remove();
}
