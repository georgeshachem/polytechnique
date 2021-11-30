var ctx = {
    w: 1600,
    h: 500,
    margin: { top: 30, right: 30, bottom: 100, left: 60 },
    room_type_data: [],
    neighbourhood_data: [],
    x: null,
    xAxis: null,
    y: null,
    yAxis: null,
};

var createViz = function () {
    console.log("Using D3 v" + d3.version);
    var svg = d3.select("#main").append("svg").attr("id", "bar_svg");
    svg.attr("width", ctx.w + ctx.margin.left + ctx.margin.right);
    svg.attr("height", ctx.h + ctx.margin.top + ctx.margin.bottom);
    svg = svg
        .append("g")
        .attr("id", "bar_plot")
        .attr(
            "transform",
            "translate(" + ctx.margin.left + "," + ctx.margin.top + ")"
        );
    loadData(svg);
};

function getFormattedData(data) {
    let new_data = [];
    for (var i in data) {
        new_data.push({
            group: i,
            value: data[i],
        });
    }
    return new_data.sort((a, b) => b.value - a.value);
}

function update(data) {
    let svg = d3.select("#bar_plot");

    ctx.x.domain(
        data.map(function (d) {
            return d.group;
        })
    );
    ctx.xAxis
        .call(d3.axisBottom(ctx.x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    ctx.y.domain([
        0,
        d3.max(data, function (d) {
            return d.value;
        }),
    ]);
    ctx.yAxis.transition().duration(1000).call(d3.axisLeft(ctx.y));

    var u = svg.selectAll("rect").data(data);

    u.enter()
        .append("rect")
        .merge(u)
        .transition()
        .duration(1000)
        .attr("x", function (d) {
            return ctx.x(d.group);
        })
        .attr("y", function (d) {
            return ctx.y(d.value);
        })
        .attr("width", ctx.x.bandwidth())
        .attr("height", function (d) {
            return ctx.h - ctx.y(d.value);
        })
        .attr("fill", "#69b3a2");

    u.exit().remove();
}

var loadData = function (svg) {
    d3.csv("../data/paris/listings-min.csv").then(function (data) {
        for (const elt of data) {
            let room_type = elt.room_type;
            if (ctx.room_type_data.hasOwnProperty(room_type)) {
                ctx.room_type_data[room_type] += 1;
            } else {
                ctx.room_type_data[room_type] = 1;
            }

            let neighbourhood = elt.neighbourhood;
            if (ctx.neighbourhood_data.hasOwnProperty(neighbourhood)) {
                ctx.neighbourhood_data[neighbourhood] += 1;
            } else {
                ctx.neighbourhood_data[neighbourhood] = 1;
            }
        }

        ctx.room_type_data = getFormattedData(ctx.room_type_data);
        ctx.neighbourhood_data = getFormattedData(ctx.neighbourhood_data);

        ctx.x = d3.scaleBand().range([0, ctx.w]).padding(0.2);
        ctx.xAxis = svg
            .append("g")
            .attr("transform", "translate(0," + ctx.h + ")");

        ctx.y = d3.scaleLinear().range([ctx.h, 0]);
        ctx.yAxis = svg.append("g");

        update(ctx.room_type_data);
    });
};
