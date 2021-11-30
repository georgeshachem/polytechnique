var ctx = {
    w: 1600,
    h: 800,
    room_types_checkbox: {},
    projection: "",
    filtered_data: {},
};

var createViz = function () {
    console.log("Using D3 v" + d3.version);
    var svg = d3.select("#main").append("svg").attr("id", "map");
    svg.attr("width", ctx.w);
    svg.attr("height", ctx.h);
    loadData(svg);
};

var loadData = function (svg) {
    d3.csv("../data/paris/listings-min.csv").then(function (data) {
        for (const elt of data) {
            let room_type = elt.room_type;
            if (ctx.filtered_data.hasOwnProperty(room_type)) {
                ctx.filtered_data[room_type].push({
                    name: elt.name,
                    id: elt.id,
                    latitude: elt.latitude,
                    longitude: elt.longitude,
                    room_type: elt.room_type,
                });
            } else {
                ctx.filtered_data[room_type] = [
                    {
                        name: elt.name,
                        id: elt.id,
                        latitude: elt.latitude,
                        longitude: elt.longitude,
                        room_type: elt.room_type,
                    },
                ];
            }
        }

        let room_types = Object.keys(ctx.filtered_data);
        var control = document.getElementById("control");
        for (const elt of room_types) {
            ctx.room_types_checkbox[elt] = false;

            let elt_id = elt.replace(/ /g, "");
            var checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = elt_id;
            checkbox.name = elt;
            checkbox.value = elt;
            checkbox.checked = false;
            checkbox.setAttribute("onchange", "updateCheckbox(this)");

            var label = document.createElement("label");
            label.htmlFor = elt_id;
            label.appendChild(document.createTextNode(elt));

            control.appendChild(checkbox);
            control.appendChild(label);
        }

        ctx.projection = d3
            .geoMercator()
            .center([2.3356417923502804, 48.85840820160359])
            .scale(340000)
            .translate([ctx.w / 2, ctx.h / 2]);

        var path = d3.geoPath().projection(ctx.projection);

        // Load external data and boot
        d3.json("../data/paris/neighbourhoods.geojson").then(function (data) {
            // Draw the map
            svg.append("g")
                .selectAll("path")
                .data(data.features)
                .enter()
                .append("path")
                .attr("fill", "#D3D3D3")
                .attr("d", d3.geoPath().projection(ctx.projection))
                .style("stroke", "black");

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
            drawPoints();
        });
    });
};

function drawPoints() {
    let svg = d3.select("#points");

    let r = 1.5;

    if (ctx.room_types_checkbox["Entire home/apt"]) {
        console.log("a");
        console.log(document.getElementById("g_entire_home"));
        if (!document.getElementById("g_entire_home")) {
            console.log("b");
            svg.append("g")
                .attr("id", "g_entire_home")
                .selectAll("circle")
                .data(ctx.filtered_data["Entire home/apt"])
                .enter()
                .append("circle")
                .attr("r", r)
                .attr("transform", function (d) {
                    return (
                        "translate(" +
                        ctx.projection([d.longitude, d.latitude]) +
                        ")"
                    );
                })
                .on("mouseover", function (event, d) {
                    d3.select("div#info").text(
                        `${d.name} (${d.id.toUpperCase()}) - ${d.room_type}`
                    );
                })
                .on("mouseout", function (event, d) {
                    d3.select("div#info").text("");
                })
                .attr("fill", "red");
        }
    } else {
        console.log("c");
        d3.select("#g_entire_home").remove();
    }

    if (ctx.room_types_checkbox["Private room"]) {
        console.log(1);
        if (!document.getElementById("g_private_room")) {
            console.log(2);
            svg.append("g")
                .attr("id", "g_private_room")
                .selectAll("circle")
                .data(ctx.filtered_data["Private room"])
                .enter()
                .append("circle")
                .attr("r", r)
                .attr("transform", function (d) {
                    return (
                        "translate(" +
                        ctx.projection([d.longitude, d.latitude]) +
                        ")"
                    );
                })
                .attr("fill", "blue");
        }
    } else {
        console.log(3);
        d3.select("#g_private_room").remove();
    }

    if (ctx.room_types_checkbox["Hotel room"]) {
        if (!document.getElementById("g_hotel_room")) {
            svg.append("g")
                .attr("id", "g_hotel_room")
                .selectAll("circle")
                .data(ctx.filtered_data["Hotel room"])
                .enter()
                .append("circle")
                .attr("r", r)
                .attr("transform", function (d) {
                    return (
                        "translate(" +
                        ctx.projection([d.longitude, d.latitude]) +
                        ")"
                    );
                })
                .attr("fill", "yellow");
        }
    } else {
        d3.select("#g_hotel_room").remove();
    }

    if (ctx.room_types_checkbox["Shared room"]) {
        if (!document.getElementById("g_shared_room")) {
            svg.append("g")
                .attr("id", "g_shared_room")
                .selectAll("rect")
                .data(ctx.filtered_data["Shared room"])
                .enter()
                .append("rect")
                .attr("width", r * 3)
                .attr("height", r * 3)
                .attr("transform", function (d) {
                    return (
                        "translate(" +
                        ctx.projection([d.longitude, d.latitude]) +
                        ")"
                    );
                })
                .attr("fill", "green");
        }
    } else {
        d3.select("#g_shared_room").remove();
    }
}

function updateCheckbox(checkbox) {
    ctx.room_types_checkbox[checkbox.name] = checkbox.checked;
    drawPoints();
}
