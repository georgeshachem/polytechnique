var ctx = {
    w: 1600,
    h: 800,
    margin: { top: 10, right: 20, bottom: 30, left: 50 },
};

var createViz = function () {
    console.log("Using D3 v" + d3.version);
    var svg = d3.select("#main").append("svg").attr("id", "bubble_chart");
    svg.attr("width", ctx.w);
    svg.attr("height", ctx.h);
    svg = svg
        .append("g")
        .attr(
            "transform",
            "translate(" + ctx.margin.left + "," + ctx.margin.top + ")"
        );
    loadData(svg);
};

const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

var loadData = function (svg) {
    var availability_per_neighbourhood = {};
    var count_per_neighbourhood = {};
    var minimum_night_per_neighbourhood = {};
    d3.csv("../data/paris/listings-min.csv").then(function (data) {
        for (const elt of data) {
            let neighbourhood = elt.neighbourhood;
            if (availability_per_neighbourhood.hasOwnProperty(neighbourhood)) {
                availability_per_neighbourhood[neighbourhood].push(
                    parseInt(elt.availability_365)
                );
                minimum_night_per_neighbourhood[neighbourhood].push(
                    parseInt(elt.minimum_nights)
                );
            } else {
                availability_per_neighbourhood[neighbourhood] = [
                    parseInt(elt.availability_365),
                ];
                minimum_night_per_neighbourhood[neighbourhood] = [
                    parseInt(elt.minimum_nights),
                ];
            }
        }

        for (let [key, value] of Object.entries(
            availability_per_neighbourhood
        )) {
            let neighbourhood_avg = average(value);
            count_per_neighbourhood[key] = value.length;
            availability_per_neighbourhood[key] = neighbourhood_avg;
        }

        for (let [key, value] of Object.entries(
            minimum_night_per_neighbourhood
        )) {
            let minimum_night_avg = average(value);
            minimum_night_per_neighbourhood[key] = minimum_night_avg;
        }

        let neighbourhoods = Object.keys(availability_per_neighbourhood);
        let values = Object.values(count_per_neighbourhood);
        let min_value = Math.min(...values);
        let max_value = Math.max(...values);
        let values_minimum_nights = Object.values(
            minimum_night_per_neighbourhood
        );
        let min_value_nights = Math.min(...values_minimum_nights);
        let max_value_nights = Math.max(...values_minimum_nights);

        width = ctx.w - ctx.margin.left - ctx.margin.right - 200;
        height = ctx.h - ctx.margin.top - ctx.margin.bottom - 50;

        var x = d3
            .scaleLinear()
            .domain([min_value_nights - 1, max_value_nights + 1])
            .range([0, width]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        var y = d3.scaleLinear().domain([0, 365]).range([height, 0]);
        svg.append("g").call(d3.axisLeft(y));

        var z = d3.scaleLinear().domain([min_value, max_value]).range([4, 40]);

        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + ctx.margin.top + 20)
            .text("Average minimum nights required");

        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", -ctx.margin.left + 15)
            .attr("x", -height / 2)
            .text("Average availibility");

        var myColor = d3
            .scaleOrdinal()
            .domain(neighbourhoods)
            .range([
                "#e6194b",
                "#3cb44b",
                "#ffe119",
                "#4363d8",
                "#f58231",
                "#911eb4",
                "#46f0f0",
                "#f032e6",
                "#bcf60c",
                "#fabebe",
                "#008080",
                "#e6beff",
                "#9a6324",
                "#fffac8",
                "#800000",
                "#aaffc3",
                "#808000",
                "#ffd8b1",
                "#000075",
                "#808080",
                "#ffffff",
                "#000000",
            ]);

        var tooltip = d3
            .select("#main")
            .append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "black")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("color", "white")
            .style("white-space", "pre-line");

        var showTooltip = function (d) {
            tooltip.transition().duration(200);
            tooltip
                .style("opacity", 1)
                .text(
                    `Neighbourhood: ${
                        d.neighbourhood
                    } \n Availability: ${parseInt(
                        availability_per_neighbourhood[d.neighbourhood]
                    )} \n Minimum nights: ${parseInt(
                        minimum_night_per_neighbourhood[d.neighbourhood]
                    )} \n Count: ${count_per_neighbourhood[d.neighbourhood]}`
                )
                .style("visibility", "visible")
                .style("left", event.pageX + 30 + "px")
                .style("top", event.pageY + 30 + "px");
        };
        var moveTooltip = function (d) {
            tooltip
                .style("left", event.pageX + 30 + "px")
                .style("top", event.pageY + 30 + "px");
        };
        var hideTooltip = function (d) {
            tooltip.transition().duration(200).style("opacity", 0);
        };

        svg.append("g")
            .selectAll("dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", function (d) {
                return "bubbles " + d.neighbourhood.replace(/ /g, "");
            })
            .attr("cx", function (d) {
                return x(minimum_night_per_neighbourhood[d.neighbourhood]);
            })
            .attr("cy", function (d) {
                return y(availability_per_neighbourhood[d.neighbourhood]);
            })
            .attr("r", function (d) {
                return z(count_per_neighbourhood[d.neighbourhood]);
            })
            .style("fill", function (d) {
                return myColor(d.neighbourhood);
            })
            .on("mouseover", function (event, d) {
                showTooltip(d);
            })
            .on("mousemove", moveTooltip)
            .on("mouseleave", hideTooltip);

        var highlight = function (d) {
            d3.selectAll(".bubbles").style("opacity", 0);
            d3.selectAll("." + d.path[0].__data__.replace(/ /g, "")).style(
                "opacity",
                1
            );
        };

        var noHighlight = function (d) {
            d3.selectAll(".bubbles").style("opacity", 1);
        };

        svg = svg.append("g").attr("id", "legend");

        var size = 20;
        var allgroups = Object.keys(availability_per_neighbourhood);
        svg.append("g")
            .selectAll("myrect")
            .data(allgroups)
            .enter()
            .append("circle")
            .attr("cx", ctx.w - ctx.margin.right - 200)
            .attr("cy", function (d, i) {
                return 10 + i * (size + 5);
            })
            .attr("r", 7)
            .style("fill", function (d) {
                return myColor(d);
            })
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight);

        svg.append("g")
            .selectAll("mylabels")
            .data(allgroups)
            .enter()
            .append("text")
            .attr("x", ctx.w - ctx.margin.right - 200 + size * 0.8)
            .attr("y", function (d, i) {
                return i * (size + 5) + size / 2;
            })
            .style("fill", function (d) {
                return myColor(d);
            })
            .text(function (d) {
                return d;
            })
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight);
    });
};
