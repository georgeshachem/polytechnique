const MAP_W = 960;
const MAP_H = 484;

const PROJECTIONS = {
    ER: d3.geoEquirectangular().scale(MAP_H / Math.PI),
    IM: d3.geoInterrupt(d3.geoMollweideRaw,
        [[ // northern hemisphere
            [[-180, 0], [-100, 90], [-40, 0]],
            [[-40, 0], [30, 90], [180, 0]]
        ], [ // southern hemisphere
            [[-180, 0], [-160, -90], [-100, 0]],
            [[-100, 0], [-60, -90], [-20, 0]],
            [[-20, 0], [20, -90], [80, 0]],
            [[80, 0], [140, -90], [180, 0]]
        ]])
        .scale(165)
        .translate([MAP_W / 2, MAP_H / 2])
        .precision(.1),
};

var ctx = {
    currentProj: PROJECTIONS.ER,
    undefinedColor: "#AAA",
    YEAR: "2015",
    panZoomMode: true,
    TRANSITION_DURATION: 3000,
    rivers: [],
    lakes: [],
    countries: [],
};

var makeMap = function (svgEl) {
    ctx.mapG = svgEl.append("g")
        .attr("id", "map")
        .attr("clip-path", "url(#clip)");
    // bind and draw geographical features to <path> elements
    addCountries();
    fadeWaterIn();
    // panning and zooming
    svgEl.append("rect")
        .attr("id", "pz")
        .attr("width", MAP_W)
        .attr("height", MAP_H)
        .style("fill", "none")
        .style("pointer-events", "all")
        .call(d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", zoomed)
        );
    function zoomed(event, d) {
        if (ctx.panZoomMode) {
            ctx.mapG.attr("transform", event.transform);
        }
    }
};

var addCountries = function () {
    var geoPathGen = d3.geoPath().projection(ctx.currentProj);

    let dw_min = ctx.countries.reduce(function (prev, current) {
        return prev.properties.dw < current.properties.dw ? prev : current;
    }).properties.dw;
    let dw_max = ctx.countries.reduce(function (prev, current) {
        return (prev.properties.dw > current.properties.dw) ? prev : current
    }).properties.dw;

    let color_scale = d3.scaleLinear()
        .domain([dw_min, dw_max])
        .range(['red', 'white']);

    let country_svg = d3.select("g#map")
        .append("g")
        .attr("id", "country");

    country_svg.selectAll("path")
        .data(ctx.countries)
        .enter()
        .append("path")
        .attr("d", geoPathGen)
        .attr("class", "country")
        .style("fill", (d) => (d.properties.dw == null) ? "#787878" : color_scale(d.properties.dw));
};

var fadeWaterIn = function () {
    var path4proj = d3.geoPath()
        .projection(ctx.currentProj);
    // clipping
    var defs = d3.select("svg").insert("defs", "#map");
    defs.append("path")
        .datum({ type: "Sphere" })
        .attr("id", "sphere")
        .attr("d", path4proj);
    defs.append("path")
        .datum({ type: "Sphere" })
        .attr("id", "clipSphere")
        .attr("d", path4proj);
    defs.append("clipPath")
        .attr("id", "clip")
        .append("use")
        .attr("xlink:href", "#clipSphere");
    d3.select("svg")
        .insert("use", "#map")
        .attr("class", "sphereBounds")
        .attr("xlink:href", "#sphere")
        .attr("opacity", 1);

    let rivers_svg = d3.select("g#map")
        .append("g")
        .attr("id", "rivers");
    rivers_svg.selectAll("path")
        .data(ctx.rivers)
        .enter()
        .append("path")
        .attr("d", path4proj)
        .attr("class", "river");

    let lakes_svg = d3.select("g#map")
        .append("g")
        .attr("id", "lakes");
    lakes_svg.selectAll("path")
        .data(ctx.lakes)
        .enter()
        .append("path")
        .attr("d", path4proj)
        .attr("class", "lake");
};

var fadeWaterOutBeforeProjSwitch = function (sourceProj, targetProj) {
    d3.select("g#rivers").remove();
    d3.select("g#lakes").remove();
    d3.selectAll("defs").remove();
    d3.selectAll("use").remove();
    animateProjection(sourceProj, targetProj);
};

var getGlobalView = function () {
    // ...
};

var switchProjection = function (toER) {
    // toER = true => enabling pan-zoom => moving to EquiRectangular proj
    // toER = false => disabling pan-zoom => moving to Interrupted Mollweide proj
    if (toER) {
        ctx.currentProj = PROJECTIONS.ER;
        d3.select("#pz").call(d3.zoom().transform, d3.zoomIdentity);
        fadeWaterOutBeforeProjSwitch(PROJECTIONS.IM, PROJECTIONS.ER);
    }
    else {
        // toIM
        ctx.currentProj = PROJECTIONS.IM;
        fadeWaterOutBeforeProjSwitch(PROJECTIONS.ER, PROJECTIONS.IM);
    }
}

var animateProjection = function (sourceProj, targetProj) {
    var transCount = 0;
    getGlobalView();
    d3.select("svg").selectAll("path").transition()
        .duration(ctx.TRANSITION_DURATION)
        .attrTween("d", projectionTween(sourceProj, targetProj))
        .on("start", function () { transCount++; })
        .on("end", function (d) {
            if (--transCount === 0) { fadeWaterIn(); }
        });
};

var projectionTween = function (sourceProj, targetProj) {
    return function (d) {
        var t = 0;
        var h_offset = (sourceProj == PROJECTIONS.ER) ? 8 : 0;
        var projection = d3.geoProjection(project)
            .scale(1)
            .translate([MAP_W / 2, MAP_H / 2 + h_offset]);
        var path = d3.geoPath()
            .projection(projection);
        function project(λ, φ) {
            λ *= 180 / Math.PI;
            φ *= 180 / Math.PI;
            var p0 = sourceProj([λ, φ]);
            var p1 = targetProj([λ, φ]);
            return [(1 - t) * p0[0] + t * p1[0], (1 - t) * -p0[1] + t * -p1[1]];
        }
        return function (_) {
            t = _;
            return path(d);
        };
    };
}

var createViz = function () {
    console.log("Using D3 v" + d3.version);
    Object.keys(PROJECTIONS).forEach(function (k) {
        PROJECTIONS[k].rotate([0, 0]).center([0, 0]);
    });
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", MAP_W);
    svgEl.attr("height", MAP_H);
    loadData(svgEl);
};

var loadData = function (svgEl) {
    // ... load data, transform it, store it in ctx
    // ... then call makeMap(svgEl)

    let admin_json = d3.json("ne_50m_admin_0_countries.geojson");
    let lakes_json = d3.json("ne_50m_lakes.geojson");
    let rivers_json = d3.json("ne_50m_rivers_lake_centerlines.geojson");
    let water_csv = d3.csv("drinking_water.csv");


    Promise.all([admin_json, lakes_json, rivers_json, water_csv]).then((values) => {
        ctx.countries = values[0].features;
        ctx.lakes = values[1].features;
        ctx.rivers = values[2].features;

        water_values = values[3];

        for (const element of ctx.countries) {
            let cc = element.properties.iso_a3;
            let water_elt = water_values.find(x => ((x.Code === cc) && (x.Year === ctx.YEAR)));
            if (water_elt !== undefined) {
                let iwspc = water_elt.ImprovedWaterSourcePC;
                element.properties.dw = iwspc;
            }
        }

        makeMap(svgEl);
    });
};

var togglePZMode = function () {
    ctx.panZoomMode = !ctx.panZoomMode;
    switchProjection(ctx.panZoomMode);
};