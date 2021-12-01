var ctx = {
    w: 1600,
    h: 800,
    margin: { top: 10, right: 30, bottom: 30, left: 40 },
};

var createViz = function () {
    console.log("Using D3 v" + d3.version);
    var svg = d3.select("#main").append("svg").attr("id", "histogram");
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

function median(values) {
    if (values.length === 0) throw new Error("No inputs");

    values.sort(function (a, b) {
        return a - b;
    });

    var half = Math.floor(values.length / 2);

    if (values.length % 2) return values[half];

    return (values[half - 1] + values[half]) / 2.0;
}

var loadData = function (svg) {
    d3.csv("../data/paris/listings-min.csv").then(function (data) {
        var prices = [];
        data = data.map((item) => {
            prices.push(item.price);
            return {
                price: item.price,
            };
        });

        console.log(d3.max(prices));

        var x = d3
            .scaleLinear()
            .domain([d3.min(prices), d3.max(prices)])
            .range([0, ctx.w]);
        svg.append("g")
            .attr("transform", "translate(0," + ctx.h + ")")
            .call(d3.axisBottom(x));

        var histogram = d3
            .histogram()
            .value(function (d) {
                return d.price;
            })
            .domain(x.domain())
            .thresholds(x.ticks(70));

        var bins = histogram(data);

        var y = d3.scaleLinear().range([ctx.h, 0]);
        y.domain([
            0,
            d3.max(bins, function (d) {
                return d.length;
            }),
        ]);
        svg.append("g").call(d3.axisLeft(y));

        let median_value = median(prices);

        svg.selectAll("rect")
            .data(bins)
            .enter()
            .append("rect")
            .attr("x", 1)
            .attr("transform", function (d) {
                return "translate(" + x(d.x0) + "," + y(d.length) + ")";
            })
            .attr("width", function (d) {
                return x(d.x1) - x(d.x0) - 1;
            })
            .attr("height", function (d) {
                return ctx.h - y(d.length);
            })
            .style("fill", function (d) {
                if (d.x0 < median_value) {
                    return "orange";
                } else {
                    return "#69b3a2";
                }
            });

        // svg.append("line")
        //     .attr("x1", x(140))
        //     .attr("x2", x(140))
        //     .attr("y1", y(0))
        //     .attr("y2", y(5000))
        //     .attr("stroke", "grey")
        //     .attr("stroke-dasharray", "4");
        // svg.append("text")
        //     .attr("x", x(140))
        //     .attr("y", y(5000))
        //     .text("threshold: 140")
        //     .style("font-size", "15px");
    });
};
