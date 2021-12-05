var ctx = {
    w: 1600,
    h: 800,
    projection: "",
    ordered_reviews: {},
    one_km: 1 / ((2 * Math.PI * 6378.16) / 360),
};

var createViz = function () {
    console.log("Using D3 v" + d3.version);
    var svg = d3.select("#main").append("svg").attr("id", "map");
    svg.attr("width", ctx.w);
    svg.attr("height", ctx.h);
    loadData(svg);
};

var loadData = function (svg) {
    d3.csv("../data/paris/listings-min.csv").then(function (listings_data) {
        let listings_lat_lng = [];
        for (const elt of listings_data) {
            listings_lat_lng[elt.id] = {
                latitude: elt.latitude,
                longitude: elt.longitude,
            };
        }

        d3.csv("../data/paris/reviews-min.csv").then(function (reviews_data) {
            let reviews = {};
            for (const elt of reviews_data) {
                if (reviews.hasOwnProperty(elt.date)) {
                    reviews[elt.date].push(listings_lat_lng[elt.listing_id]);
                } else {
                    reviews[elt.date] = [listings_lat_lng[elt.listing_id]];
                }
            }

            Object.keys(reviews)
                .sort(function (a, b) {
                    return (
                        moment(a, "YYYY/MM/DD").toDate() -
                        moment(b, "YYYY/MM/DD").toDate()
                    );
                })
                .forEach(function (key) {
                    ctx.ordered_reviews[key] = reviews[key];
                });

            d3.json("../data/paris/neighbourhoods.geojson").then(function (
                geodata
            ) {
                ctx.projection = d3
                    .geoMercator()
                    .center([2.3356417923502804, 48.85840820160359])
                    .scale(340000)
                    .translate([ctx.w / 2, ctx.h / 2]);

                let path = d3.geoPath().projection(ctx.projection);

                svg.append("g")
                    .selectAll("path")
                    .data(geodata.features)
                    .enter()
                    .append("path")
                    .attr("fill", "#D3D3D3")
                    .attr("d", d3.geoPath().projection(ctx.projection))
                    .style("stroke", "black");

                svg.append("g")
                    .selectAll("text")
                    .data(geodata.features)
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
            });
        });
    });
};

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

async function drawPoints() {
    let svg = d3.select("#points");
    let date = d3.select("#date");
    let progress = d3.select("#progress");
    let removeOld = d3.select("#removeOld");
    console.log(removeOld);

    progress.style("visibility", "visible");
    progress.attr("max", Object.keys(ctx.ordered_reviews).length);

    let r = 2;
    let i = 0;
    for (const [key, value] of Object.entries(ctx.ordered_reviews)) {
        date.text(`${key} - ${value.length} reviews`);
        var u = svg.selectAll("circle").data(value);
        u.enter()
            .append("circle")
            .attr("r", r)
            .attr("transform", function (d) {
                return (
                    "translate(" +
                    ctx.projection([jitter(d.longitude), jitter(d.latitude)]) +
                    ")"
                );
            })
            .attr("fill", getRandomColor());

        if (removeOld.node().checked) {
            u.merge(u);
            u.exit().remove();
        }

        await timer(1);

        progress.attr("value", i++);
    }
}

function randomInRange(from, to, fixed) {
    return (Math.random() * (to - from) + from).toFixed(fixed) * 1;
}

function jitter(pos, kms = 0.1, fixed = 10) {
    pos = parseFloat(pos);
    return randomInRange(pos - kms * ctx.one_km, pos + kms * ctx.one_km, fixed);
}

function getRandomColor() {
    var letters = "0123456789ABCDEF";
    var color = "#";
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
