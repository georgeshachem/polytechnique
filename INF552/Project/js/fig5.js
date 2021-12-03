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
    svg = svg.append("g")
        .attr("transform",
            "translate(" + ctx.margin.left + "," + ctx.margin.top + ")");
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
                availability_per_neighbourhood[neighbourhood] = [parseInt(elt.availability_365)];
                minimum_night_per_neighbourhood[neighbourhood] = [parseInt(elt.minimum_nights)];
            }
        }

        for (let [key, value] of Object.entries(availability_per_neighbourhood)) {
            let neighbourhood_avg = average(value);
            count_per_neighbourhood[key] = value.length;
            availability_per_neighbourhood[key] = neighbourhood_avg;
        }

        for (let [key, value] of Object.entries(minimum_night_per_neighbourhood)) {
            let minimum_night_avg = average(value);
            minimum_night_per_neighbourhood[key] = minimum_night_avg;
        }

        let neighbourhoods = Object.keys(availability_per_neighbourhood);
        let values = Object.values(count_per_neighbourhood);
        let min_value = Math.min(...values);
        let max_value = Math.max(...values);
        let values_minimum_nights = Object.values(minimum_night_per_neighbourhood);
        let min_value_nights = Math.min(...values_minimum_nights);
        let max_value_nights = Math.max(...values_minimum_nights);

        width = ctx.w - ctx.margin.left - ctx.margin.right;
        height = ctx.h - ctx.margin.top - ctx.margin.bottom;

        var x = d3.scaleLinear()
            .domain([min_value_nights - 1, max_value_nights + 1])
            .range([0, width]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        var y = d3.scaleLinear()
            .domain([0, 365])
            .range([height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y));

        var z = d3.scaleLinear()
            .domain([min_value, max_value])
            .range([4, 40]);

        var myColor = d3.scaleOrdinal()
            .domain(neighbourhoods)
            .range(d3.schemeSet2);

        var tooltip = d3.select("#main")
            .append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "black")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("color", "white")

        var showTooltip = function (d) {
            tooltip
                .transition()
                .duration(200)
            tooltip
                .style("opacity", 1)
                .text(`Neighbourhood: ${d.neighbourhood} \n Availability: ${availability_per_neighbourhood[d.neighbourhood]} \n Count: ${count_per_neighbourhood[d.neighbourhood]}`)
                .style("visibility", "visible")

                .style("left", (event.pageX + 30) + "px")
                .style("top", (event.pageY + 30) + "px")
        }
        var moveTooltip = function (d) {
            tooltip
                .style("left", (event.pageX + 30) + "px")
                .style("top", (event.pageY + 30) + "px")
        }
        var hideTooltip = function (d) {
            tooltip
                .transition()
                .duration(200)
                .style("opacity", 0)
        }

        svg.append('g')
            .selectAll("dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "bubbles")
            .attr("cx", function (d) { return x(minimum_night_per_neighbourhood[d.neighbourhood]); })
            .attr("cy", function (d) { return y(availability_per_neighbourhood[d.neighbourhood]); })
            .attr("r", function (d) { return z(count_per_neighbourhood[d.neighbourhood]); })
            .style("fill", function (d) { return myColor(d.neighbourhood); })
            .on("mouseover", function (event, d) { showTooltip(d); })
            .on("mousemove", moveTooltip)
            .on("mouseleave", hideTooltip);

    });
};
