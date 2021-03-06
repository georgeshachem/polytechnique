var ctx = {
    w: 1600,
    h: 800,
    color: "",
};

var createViz = function () {
    console.log("Using D3 v" + d3.version);
    var svg = d3.select("#main").append("svg").attr("id", "map");
    svg.attr("width", ctx.w);
    svg.attr("height", ctx.h);
    loadData(svg);
};

const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

var loadData = function (svg) {
    var prices_per_neighbourhood = {};
    d3.csv("../data/paris/listings-min.csv").then(function (data) {
        for (const elt of data) {
            let neighbourhood = elt.neighbourhood;
            if (prices_per_neighbourhood.hasOwnProperty(neighbourhood)) {
                prices_per_neighbourhood[neighbourhood].push(
                    parseInt(elt.price)
                );
            } else {
                prices_per_neighbourhood[neighbourhood] = [parseInt(elt.price)];
            }
        }

        let neighbourhoods_rank = [];
        for (let [key, value] of Object.entries(prices_per_neighbourhood)) {
            let neighbourhood_avg = average(value);
            prices_per_neighbourhood[key] = neighbourhood_avg;
            neighbourhoods_rank.push({
                neighbourhood: key,
                val: neighbourhood_avg,
            });
        }
        neighbourhoods_rank = neighbourhoods_rank.sort((a, b) => a.val - b.val);

        let values = Object.values(prices_per_neighbourhood);
        let min_value = Math.min(...values);
        let max_value = Math.max(...values);
        let mean_value = average(values);

        color = d3
            .scaleLinear()
            .domain([min_value, mean_value, max_value])
            .range(["#fee8c8", "#fdbb84", "#e34a33"]);

        // var neighbourhoods_rank = Object.values(prices_per_neighbourhood).map(
        //     function (elt) {
        //         return parseInt(elt);
        //     }
        // );
        // neighbourhoods_rank = neighbourhoods_rank.sort(function (a, b) {
        //     return a - b;
        // });
        // console.log(neighbourhoods_rank);

        var projection = d3
            .geoMercator()
            .center([2.3356417923502804, 48.85840820160359])
            .scale(340000)
            .translate([ctx.w / 2, ctx.h / 2]);

        var path = d3.geoPath().projection(projection);

        var tooltip = d3
            .select("#main")
            .append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("padding-top", "3px")
            .style("padding-bottom", "3px")
            .style("padding-left", "3px")
            .style("padding-right", "3px")
            .style("border-style", "solid")
            .style("background", "white")
            .style("white-space", "pre-line");

        // Load external data and boot
        d3.json("../data/paris/neighbourhoods.geojson").then(function (data) {
            // Draw the map
            svg.append("g")
                .selectAll("path")
                .data(data.features)
                .enter()
                .append("path")
                .attr("fill", (d) =>
                    color(prices_per_neighbourhood[d.properties.neighbourhood])
                )
                .attr("d", d3.geoPath().projection(projection))
                .style("stroke", "black")
                .on("mouseover", function (event, d) {
                    let neighbourhood = d.properties.neighbourhood;
                    let rank =
                        neighbourhoods_rank
                            .map(function (e) {
                                return e.neighbourhood;
                            })
                            .indexOf(neighbourhood) + 1;
                    let avg = parseInt(prices_per_neighbourhood[neighbourhood]);

                    tooltip.style("visibility", "visible");
                    tooltip.text(
                        `${neighbourhood} \n Rank: #${rank} \n Average: ${avg}???`
                    );
                })
                .on("mouseout", function () {
                    tooltip.style("visibility", "hidden");
                })
                .on("mousemove", function (event) {
                    tooltip
                        .style("top", event.pageY + 25 + "px")
                        .style("left", event.pageX + 25 + "px");
                });

            svg.append("g")
                .selectAll("text")
                .data(data.features)
                .enter()
                .append("svg:text")
                .text(function (d) {
                    return d.properties.neighbourhood;
                })
                .attr("x", function (d) {
                    return path.centroid(d)[0];
                })
                .attr("y", function (d) {
                    return path.centroid(d)[1];
                })
                .attr("text-anchor", "middle")
                .attr("fill", "black");
        });
    });
};
