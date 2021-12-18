var ctx = {
    w: 1600,
    h: 800,
};

var createViz = function () {
    console.log("Using D3 v" + d3.version);
    var svg = d3.select("#main").append("svg").attr("id", "map");
    svg.attr("width", ctx.w);
    svg.attr("height", ctx.h);
    svg = svg.append("g").attr("id", "map_g");
    loadData(svg);
};

var loadData = function (svg) {
    d3.csv("../data/paris/listings-min.csv").then(function (data) {
        let preload_data = {};
        for (const elt of data) {
            if (preload_data.hasOwnProperty(elt.host_id)) {
                preload_data[elt.host_id].push({
                    id: elt.id,
                    latitude: elt.latitude,
                    longitude: elt.longitude,
                    host_name: elt.host_name,
                });
            } else {
                preload_data[elt.host_id] = [
                    {
                        id: elt.id,
                        latitude: elt.latitude,
                        longitude: elt.longitude,
                        host_name: elt.host_name,
                    },
                ];
            }
        }

        let data_points = [];
        let formatted_data = {};
        for (let [key, value] of Object.entries(preload_data)) {
            if (value.length > 65) {
                formatted_data[key] = value;

                for (const elt of value) {
                    data_points.push({
                        latitude: elt.latitude,
                        longitude: elt.longitude,
                        host_id: key,
                        host_name: elt.host_name,
                    });
                }
            }
        }

        var color = d3
            .scaleOrdinal()
            .domain(Object.keys(formatted_data))
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

        d3.json("../data/paris/neighbourhoods.geojson").then(function (data) {
            projection = d3
                .geoMercator()
                .center([2.3356417923502804, 48.85840820160359])
                .scale(340000)
                .translate([ctx.w / 2, ctx.h / 2]);

            var path = d3.geoPath().projection(projection);

            svg.append("g")
                .selectAll("path")
                .data(data.features)
                .enter()
                .append("path")
                .attr("fill", "#D3D3D3")
                .attr("d", d3.geoPath().projection(projection))
                .style("stroke", "black");

            var zoom = d3
                .zoom()
                .scaleExtent([0.5, 8])
                .on("zoom", function (event) {
                    svg.attr("transform", event.transform);
                    d3.selectAll("circle")
                        .attr("d", path.projection(projection))
                        .attr("r", 4 / event.transform.k);
                });
            d3.select("#map").call(zoom);

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

            svg.append("g").attr("id", "points");

            // points

            var highlight = function (d) {
                host_id = d.path[0].__data__.host_id;
                let host_name = d.path[0].__data__.host_name;
                d3.selectAll("circle").style("opacity", 0);
                d3.selectAll(".c" + host_id).style("opacity", 1);
                d3.select("#info").text(
                    "Host " +
                        host_name +
                        " has " +
                        formatted_data[host_id].length +
                        " listings"
                );
            };

            var noHighlight = function (d) {
                d3.selectAll("circle").style("opacity", 1);
                d3.select("#info").text("");
            };

            svg.append("g")
                .attr("id", "listings")
                .selectAll("circle")
                .data(data_points)
                .enter()
                .append("circle")
                .attr("r", 4)
                .attr("transform", function (d) {
                    return (
                        "translate(" +
                        projection([d.longitude, d.latitude]) +
                        ")"
                    );
                })
                .attr("fill", function (d) {
                    return color(d.host_id);
                })
                .style("stroke", "black")
                .style("stroke-width", 0.1)
                .attr("class", function (d) {
                    return "c" + d.host_id;
                })
                .on("mouseover", highlight)
                .on("mouseleave", noHighlight);
        });
    });
};
