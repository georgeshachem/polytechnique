var ctx = {
    w: 1200,
    h: 400,
    timeParser: d3.timeParse("%Y-%m-%d"),
};

var createViz = function () {
    console.log("Using D3 v" + d3.version);
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

var loadData = function (svgEl) {
    d3.json("house_prices.json")
        .then(function (data) {
            // 1
            let cities = Object.keys(data[0]).filter(elt => elt.localeCompare('Date'));

            formatted_data = {};
            formatted_data['dates'] = [];

            temp_data = {};
            for (const elt of data) {
                formatted_data['dates'].push(elt['Date']);
                for (const [key, value] of Object.entries(elt)) {
                    if (cities.includes(key)) {
                        if (!(key in temp_data)) {
                            temp_data[key] = [];
                        }
                        temp_data[key].push(value);
                    }
                }
            }

            var temp_data = Object.keys(temp_data).map(d => {
                return {
                    "name": d,
                    "values": temp_data[d]
                }
            });

            formatted_data['series'] = temp_data;

            // 2.1
            data_min = d3.min(formatted_data.series, function (d) {
                return d3.min(d.values);
            });

            data_max = d3.max(formatted_data.series, function (d) {
                return d3.max(d.values);
            });

            var color_scale = d3.scaleLinear()
                .domain([data_min, 100, data_max])
                .range(["red", "white", "blue"]);

            let h = 5;
            for (const elt of formatted_data.series) {
                let g = svgEl.append("g")
                    .attr("transform", "translate(0, " + h + ")");
                values = elt.values;
                i = 0;
                for (const value of values) {
                    if (value == null) {
                        color = "lightgrey";
                    } else {
                        color = color_scale(value);
                    }
                    g.append('line')
                        .style("stroke-width", 10) // 1px was very small
                        .attr("x1", 0)
                        .attr("y1", 0)
                        .attr("x2", 1)
                        .attr("y2", 0)
                        .attr("stroke", color)
                        .attr("transform", `translate(${i}, 0)`);
                    i += 1;
                }

                // 2.2
                g.append("text")
                    .attr("x", i + 5)
                    .attr("y", ".30em") // just to align text and line because g is bigger than line
                    .text(elt.name);
                h += 13;
            }

            // 2.3
            let scale_time = d3.scaleTime()
                .domain(d3.extent(formatted_data.dates, d => ctx.timeParser(d)))
                .range([0, formatted_data.dates.length]);
            svgEl.append("g")
                .attr("transform", "translate(0," + h + ")")
                .call(d3.axisBottom(scale_time).ticks(5));

            // 2.4
            temp_array = [];
            for (const elt of formatted_data.series) {
                temp_array = temp_array.concat(elt.values);
            }
            // temp_array = temp_array.filter(d => d);
            temp_range = d3.range(d3.min(temp_array), d3.max(temp_array));
            temp_range.sort(function (a, b) { return b - a });

            let g = svgEl.append("g")
                .attr("width", '10')
                .attr("height", '1px')
                .attr("transform", `translate(500, -300)`)

            i += 1;
            for (const elt of temp_range) {
                g.append('line')
                    .style("stroke-width", 10) // 1px was very small
                    .attr("x1", 0)
                    .attr("y1", 0)
                    .attr("x2", 0)
                    .attr("y2", 1)
                    .attr("stroke", color_scale(elt))
                    .attr("transform", `translate(0, ${i})`);
                i += 1;
            }

            let scale_values = d3.scaleLinear()
                .domain(d3.extent(temp_range))
                .range([temp_range.length, 0]);
            g.append("g") // nested but easier for positions and better because it's 1 group now
                .attr("transform", 'translate(11, 350)')
                .call(d3.axisRight(scale_values).ticks(5));
            g.append("text")
                .attr("x", -5)
                .attr("y", 605)
                .text("Case-shiller index");
            h += 13;

        })
        .catch(function (error) {
            console.log(error);
        });
};