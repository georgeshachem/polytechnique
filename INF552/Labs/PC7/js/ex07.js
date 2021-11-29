var ctx = {
    w: 800,
    h: 800,
    mapMode: false,
    MIN_COUNT: 3000,
    ANIM_DURATION: 600, // ms
    NODE_SIZE_NL: 5,
    NODE_SIZE_MAP: 3,
    LINK_ALPHA: 0.2,
    nodes: [],
    links: [],
};

var ALBERS_PROJ = d3
    .geoAlbersUsa()
    .translate([ctx.w / 2, ctx.h / 2])
    .scale([1000]);

// https://github.com/d3/d3-force
var simulation = d3
    .forceSimulation()
    .force(
        "link",
        d3
            .forceLink()
            .id(function (d) {
                return d.id;
            })
            .distance(5)
            .strength(0.08)
    )
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(ctx.w / 2, ctx.h / 2));

// https://github.com/d3/d3-scale-chromatic
var color = d3.scaleOrdinal(d3.schemeAccent);

function simStep() {
    // code run at each iteration of the simulation
    // updating the position of nodes and links
    d3.selectAll("#links line")
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
    d3.selectAll("#nodes circle")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .append("title")
        .text(function (d) {
            return `${d.city} (${d.id})`;
        });
}

var createGraphLayout = function (svg) {
    var lines = svg
        .append("g")
        .attr("id", "links")
        .selectAll("line")
        .data(ctx.links)
        .enter()
        .append("line")
        .attr("opacity", ctx.LINK_ALPHA);

    var circles = svg
        .append("g")
        .attr("id", "nodes")
        .selectAll("circle")
        .data(ctx.nodes)
        .enter()
        .append("circle")
        .attr("r", 5)
        .style("fill", (d) => color(d.group));

    simulation.nodes(ctx.nodes).on("tick", simStep);
    simulation.force("link").links(ctx.links);

    circles.call(
        d3
            .drag()
            .on("start", (event, d) => startDragging(event, d))
            .on("drag", (event, d) => dragging(event, d))
            .on("end", (event, d) => endDragging(event, d))
    );
};

var switchVis = function (showMap) {
    if (showMap) {
        // show network on map
        //...
    } else {
        // show NL diagram
        //...
    }
};

var createViz = function () {
    console.log("Using D3 v" + d3.version);
    d3.select("body").on("keydown", function (event, d) {
        handleKeyEvent(event);
    });
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

var loadData = function (svgEl) {
    let airports_json = d3.json("airports.json");
    let flights_json = d3.json("flights.json");
    let states_tz_csv = d3.csv("states_tz.csv");
    let us_states_json = d3.json("us-states.geojson");

    Promise.all([
        airports_json,
        flights_json,
        states_tz_csv,
        us_states_json,
    ]).then((values) => {
        ctx.airports = values[0];
        ctx.flights = values[1];
        ctx.states_tz = values[2];

        ctx.links = ctx.flights.map(
            ({ origin: source, destination: target, count: value }) => ({
                source,
                target,
                value,
            })
        );
        ctx.links = ctx.links.filter((link) => link.value >= 3000);
        let source_airports = ctx.links.map((elt) => elt.source);
        let target_airports = ctx.links.map((elt) => elt.target);
        let connected_airports = source_airports.concat(
            target_airports.filter((item) => source_airports.indexOf(item) < 0)
        );

        ctx.nodes = [];
        for (const airport of ctx.airports) {
            if (airport.iata.match(/^\d/)) {
                continue;
            }
            if (connected_airports.indexOf(airport.iata) == -1) {
                continue;
            }

            var airport_group = ctx.states_tz.find((obj) => {
                return obj.State === airport.state;
            });

            // maybe we don't have the airport's timezone
            airport_group = airport_group ? airport_group : "";

            ctx.nodes.push({
                id: airport.iata,
                group: airport_group.TimeZone,
                state: airport.state,
                city: airport.city,
            });
        }

        let airports_nodes = ctx.nodes.map((elt) => elt.id);
        ctx.links = ctx.links.filter(function (obj) {
            return (
                airports_nodes.indexOf(obj.source) != -1 &&
                airports_nodes.indexOf(obj.target) != -1
            );
        });

        // Let's draw...
        createGraphLayout(svgEl);
    });
};

function startDragging(event, node) {
    if (ctx.mapMode) {
        return;
    }
    if (!event.active) {
        simulation.alphaTarget(0.3).restart();
    }
    node.fx = node.x;
    node.fy = node.y;
}

function dragging(event, node) {
    if (ctx.mapMode) {
        return;
    }
    node.fx = event.x;
    node.fy = event.y;
}

function endDragging(event, node) {
    if (ctx.mapMode) {
        return;
    }
    if (!event.active) {
        simulation.alphaTarget(0);
    }
    // commenting the following lines out will keep the
    // dragged node at its current location, permanently
    // unless moved again manually
    node.fx = null;
    node.fy = null;
}

var handleKeyEvent = function (e) {
    if (e.keyCode === 84) {
        // hit T
        toggleMap();
    }
};

var toggleMap = function () {
    ctx.mapMode = !ctx.mapMode;
    switchVis(ctx.mapMode);
};
