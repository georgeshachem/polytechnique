var ctx = {
    w: 800,
    h: 400,
    LA_MIN: 41.31,
    LA_MAX: 51.16,
    LO_MIN: -4.93,
    LO_MAX: 7.72,
    TRANSITION_DURATION: 1000,
    scale: 1,
    currentFlights: [],
    planeUpdater: null,
};

const PROJECTIONS = {
    ER: d3
        .geoEquirectangular()
        .center([0, 0])
        .scale(128)
        .translate([ctx.w / 2, ctx.h / 2]),
};

function getRandomColor() {
    var letters = "0123456789ABCDEF";
    var color = "#";
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

var path4proj = d3.geoPath().projection(PROJECTIONS.ER);

var drawMap = function (countries, lakes, rivers, svgEl) {
    ctx.mapG = svgEl.append("g").attr("id", "map");
    // bind and draw geographical features to <path> elements
    var path4proj = d3.geoPath().projection(PROJECTIONS.ER);
    var countryG = ctx.mapG.append("g").attr("id", "countries");
    countryG
        .selectAll("path.country")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("d", path4proj)
        .attr("class", "country");
    var lakeG = ctx.mapG.append("g").attr("id", "lakes");
    lakeG
        .selectAll("path.lakes")
        .data(lakes.features)
        .enter()
        .append("path")
        .attr("d", path4proj)
        .attr("class", "lake");
    var riverG = ctx.mapG.append("g").attr("id", "rivers");
    riverG
        .selectAll("path.rivers")
        .data(rivers.features)
        .enter()
        .append("path")
        .attr("d", path4proj)
        .attr("class", "river");
    ctx.mapG.append("g").attr("id", "planes");
    // pan & zoom
    function zoomed(event, d) {
        ctx.mapG.attr("transform", event.transform);
        var scale = ctx.mapG.attr("transform");
        scale = scale.substring(scale.indexOf("scale(") + 6);
        scale = parseFloat(scale.substring(0, scale.indexOf(")")));
        ctx.scale = 1 / scale;
        if (ctx.scale != 1) {
            d3.selectAll("image").attr("transform", (d) =>
                getPlaneTransform(d)
            );
        }
    }
    var zoom = d3.zoom().scaleExtent([1, 40]).on("zoom", zoomed);
    svgEl.call(zoom);
};

var getPlaneTransform = function (d) {
    var xy = PROJECTIONS.ER([d.lon, d.lat]);
    var sc = 4 * ctx.scale;
    var x = xy[0] - sc;
    var y = xy[1] - sc;
    if (d.bearing != null && d.bearing != 0) {
        var t = `translate(${x},${y}) rotate(${d.bearing} ${sc} ${sc})`;
        return ctx.scale == 1 ? t : t + ` scale(${ctx.scale})`;
    } else {
        var t = `translate(${x},${y})`;
        return ctx.scale == 1 ? t : t + ` scale(${ctx.scale})`;
    }
};

var createViz = function () {
    d3.select("body").on("keydown", (event, d) => handleKeyEvent(event));
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    svgEl
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "#bcd1f1");
    loadGeo(svgEl);
};

/* data fetching and transforming */
var loadGeo = function (svgEl) {
    var promises = [
        d3.json("ne_50m_admin_0_countries.geojson"),
        d3.json("ne_50m_lakes.geojson"),
        d3.json("ne_50m_rivers_lake_centerlines.geojson"),
    ];
    Promise.all(promises)
        .then(function (data) {
            drawMap(data[0], data[1], data[2], svgEl);
        })
        .catch(function (error) {
            console.log(error);
        });
};

var toggleUpdate = function () {
    if (d3.select("#updateBt").attr("value") == "On") {
        d3.select("#updateBt").attr("value", "Off");
        clearInterval(ctx.planeUpdater);
    } else {
        d3.select("#updateBt").attr("value", "On");
        ctx.planeUpdater = setInterval(updateFlights, 5000);
    }
};

function updateFlights() {
    console.log("Update");
    // reset flights
    ctx.currentFlights = [];
    var url = "https://opensky-network.org/api/states/all";
    // var url = `https://opensky-network.org/api/states/all?lamin=${ctx.LA_MIN}&lomin=${ctx.LO_MIN}&lamax=${ctx.LA_MAX}&lomax=${ctx.LO_MAX}`;
    d3.json(url).then((data) => {
        for (const flight of data.states) {
            if (flight[5] && flight[6]) {
                ctx.currentFlights.push({
                    id: flight[0],
                    callsign: flight[1],
                    lon: flight[5],
                    lat: flight[6],
                    bearing: flight[10],
                    alt: flight[13],
                    on_groud: flight[8],
                    origin_country: flight[2],
                });
            }
        }

        var myFlights = d3
            .select("g#planes")
            .selectAll("image")
            .data(ctx.currentFlights, (d) => d.id);

        myFlights
            .transition()
            .duration(ctx.TRANSITION_DURATION)
            .attr("transform", (d) => getPlaneTransform(d));
        myFlights
            .enter()
            .append("image")
            .attr("transform", (d) => getPlaneTransform(d))
            .attr("width", 8)
            .attr("height", 8)
            .attr("xlink:href", "plane_icon.png")
            .on("mouseover", function (event, d) {
                d3.select("div#info").text(d.id.toUpperCase());
            })
            .on("mouseout", function (event, d) {
                d3.select("div#info").text("");
            });
        myFlights.exit().remove();

        drawGroundSkyBarPlot();
        drawCountryPlot();
    });
}

function drowBarPlot(svg, data, domain_max, elt_key, width, height) {
    var x = d3
        .scaleBand()
        .range([0, width])
        .domain(
            data.map(function (d) {
                return d[elt_key];
            })
        )
        .padding(0.2);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    var y = d3.scaleLinear().domain([0, domain_max]).range([height, 0]);
    svg.append("g").call(d3.axisLeft(y));

    svg.selectAll("mybar")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", function (d) {
            return x(d[elt_key]);
        })
        .attr("width", x.bandwidth())
        .attr("fill", getRandomColor())
        .attr("height", function (d) {
            return height - y(0);
        }) // always equal to 0
        .attr("y", function (d) {
            return y(0);
        });

    svg.selectAll("rect")
        .transition()
        .duration(800)
        .attr("y", function (d) {
            return y(d.value);
        })
        .attr("height", function (d) {
            return height - y(d.value);
        })
        .delay(function (d, i) {
            return i * 100;
        });
}

function drawGroundSkyBarPlot() {
    var data = {
        ground: 0,
        sky: 0,
    };

    for (const flight of ctx.currentFlights) {
        if (flight.on_groud) {
            data.ground += 1;
        } else {
            data.sky += 1;
        }
    }

    let domain_max = Math.max(data.ground, data.sky);

    data = [
        {
            name: "Ground",
            value: data.ground,
        },
        {
            name: "Sky",
            value: data.sky,
        },
    ];

    data.sort((a, b) => (a.value > b.value ? -1 : b.value > a.value ? 1 : 0));

    var margin = { top: 40, right: 30, bottom: 40, left: 60 },
        width = 300 - margin.left - margin.right,
        height = 250 - margin.top - margin.bottom;

    d3.select("#groundskyplot").remove();
    var svg = d3
        .select("#footer")
        .append("svg")
        .attr("id", "groundskyplot")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text("Number of flights in sky or ground");

    drowBarPlot(svg, data, domain_max, "name", width, height);
}

function drawCountryPlot() {
    let origin_countries = [
        ...new Set(
            ctx.currentFlights
                .map((x) => x.origin_country)
                .filter(function (x) {
                    return x != null;
                })
        ),
    ];
    var data = [];
    for (const country of origin_countries) {
        data.push({
            origin_country: country,
            value: 0,
        });
    }
    for (const flight of ctx.currentFlights) {
        data.find((x) => x.origin_country === flight.origin_country).value += 1;
    }

    data.sort((a, b) => (a.value > b.value ? -1 : b.value > a.value ? 1 : 0));

    let domain_max = Math.max.apply(
        Math,
        data.map(function (x) {
            return x.value;
        })
    );

    var margin = { top: 20, right: 30, bottom: 120, left: 60 },
        width = 1500 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    d3.select("#countryplot").remove();
    var svg = d3
        .select("#footer")
        .append("svg")
        .attr("id", "countryplot")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 10 - margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text("Number of flights per country");

    drowBarPlot(svg, data, domain_max, "origin_country", width, height);
}

/* Input events */
var handleKeyEvent = function (e) {
    if (e.keyCode === 85) {
        updateFlights();
        // updateStats();
    }
};
