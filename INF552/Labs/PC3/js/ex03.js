var ctx = {
    sampleSize: "*",
    scaleTypeSP: "log",
    MIN_YEAR: 1987,
    DETECTION_METHODS_RVPT: ["Radial Velocity", "Primary Transit"],
    DETECTION_METHODS_ALL4: [
        "Radial Velocity",
        "Primary Transit",
        "Microlensing",
        "Imaging",
    ],
    DM_COLORS: ["#cab2d6", "#fdbf6f", "#b2df8a", "#fb9a99"],
};

var createMassScatterPlot = function (scaleType, sampleSize) {
    /* scatterplot: planet mass vs. star mass
         showing year of discovery using color,
         and detection method using shape,
         to be sync'ed with line bar chart below (brushing and linking) */
    // var vlSpec = {
    //     "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    //     "data": {
    //         //...
    //     },
    //     //...
    // };
    // // see options at https://github.com/vega/vega-embed/blob/master/README.md
    // var vlOpts = {width:700, height:700, actions:false};
    // vegaEmbed("#massScat", vlSpec, vlOpts);

    console.log("Sample");

    var vlSpec = {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        data: {
            url: "exoplanet.eu_catalog.20210927.csv",
            format: "csv",
        },
        vconcat: [
            {
                width: 700,
                height: 700,
                mark: {
                    type: "point",
                },
                encoding: {
                    x: {
                        field: "star_mass",
                        type: "quantitative",
                        scale: { type: scaleType },
                        title: "Star Mass (Msun)",
                    },
                    y: {
                        field: "mass",
                        type: "quantitative",
                        scale: { type: scaleType },
                        title: "Mass (Mjup)",
                    },
                    color: {
                        condition: {
                            param: "brush",
                            field: "discovered",
                            type: "temporal",
                            timeUnit: "years",
                            scale: { scheme: "blues" },
                            legend: { title: "Year Discovered" },
                        },
                        value: "lightgray",
                    },
                    shape: {
                        field: "detection_type",
                        type: "nominal",
                        legend: { title: "Detection Method" },
                    },
                    tooltip: [
                        { field: "name", type: "nominal", title: "# name" },
                        {
                            field: "discovered",
                            type: "temporal",
                            timeUnit: "years",
                            title: "discovered (year)",
                        },
                    ],
                },
                params: [
                    {
                        name: "brush",
                        select: { type: "interval" },
                    },
                ],
                transform: [
                    { filter: { param: "click" } },
                    { filter: "datum.mass > 0" },
                    { filter: "datum.star_mass > 0" },
                    {
                        filter: {
                            or: [
                                {
                                    field: "detection_type",
                                    equal: "Radial Velocity",
                                },
                                {
                                    field: "detection_type",
                                    equal: "Primary Transit",
                                },
                            ],
                        },
                    },
                    { sample: sampleSize == "*" ? 1000 : sampleSize },
                ],
            },
            {
                width: 700,
                height: 50,
                mark: "bar",
                encoding: {
                    x: {
                        aggregate: "count",
                        title: "Count",
                    },
                    y: {
                        field: "detection_type",
                        type: "nominal",
                        title: "Detection Method",
                    },
                    color: {
                        condition: {
                            param: "click",
                            field: "detection_type",
                            type: "nominal",
                            scale: { scheme: "accent" },
                            legend: { disable: true },
                        },
                        value: "lightgray",
                    },
                },
                transform: [
                    { filter: { param: "brush" } },
                    {
                        filter: {
                            or: [
                                {
                                    field: "detection_type",
                                    equal: "Radial Velocity",
                                },
                                {
                                    field: "detection_type",
                                    equal: "Primary Transit",
                                },
                            ],
                        },
                    },
                    { sample: sampleSize == "*" ? 1000 : sampleSize },
                ],
                params: [
                    {
                        name: "click",
                        select: { type: "point", encodings: ["color"] },
                    },
                ],
            },
        ],
    };

    var vlOpts = { width: 700, height: 750, actions: false };
    vegaEmbed("#massScat", vlSpec, vlOpts);
};

var createMagV2DHisto = function () {
    /* 2D histogram in the bottom-right cell,
          showing V-magnitude distribution (binned)
         for each detection_method */

    vlSpec = {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        data: {
            url: "exoplanet.eu_catalog.20210927.csv",
            format: "csv",
        },
        mark: "rect",
        encoding: {
            x: {
                field: "detection_type",
                type: "nominal",
                title: "Detection method",
            },
            y: {
                bin: { maxbins: 45 },
                field: "mag_v",
                type: "quantitative",
                title: "Magnitude (V band)",
            },
            color: {
                aggregate: "count",
                type: "nominal",
                scale: { scheme: "greys" },
                legend: { title: "Count" },
            },
        },
        transform: [
            {
                filter: {
                    or: [
                        { field: "detection_type", equal: "Radial Velocity" },
                        { field: "detection_type", equal: "Primary Transit" },
                        { field: "detection_type", equal: "Microlensing" },
                        { field: "detection_type", equal: "Imaging" },
                    ],
                },
            },
        ],
    };
    vlOpts = { width: 300, height: 300, actions: false };
    vegaEmbed("#vmagHist", vlSpec, vlOpts);
};

var createDetectionMethodLinePlot = function () {
    // line plot: planet discovery count vs. year
    // vlSpec = {
    //     "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    //     "data": {
    //         //...
    //     },
    //     //...
    // };
    // vlOpts = {width:300, height:300, actions:false};
    // vegaEmbed("#discPlot", vlSpec, vlOpts);
};

var createViz = function () {
    vega.scheme("dmcolors", ctx.DM_COLORS);
    createMassScatterPlot(ctx.scaleTypeSP, "*");
    createMagV2DHisto();
    createDetectionMethodLinePlot();
};

var handleKeyEvent = function (e) {
    if (e.keyCode === 13) {
        // enter
        e.preventDefault();
        setSample();
    }
};

var updateScatterPlot = function () {
    createMassScatterPlot(ctx.scaleTypeSP, ctx.sampleSize);
};

var setScaleSP = function () {
    ctx.scaleTypeSP = document.querySelector("#scaleSelSP").value;
    updateScatterPlot();
};

var setSample = function () {
    var sampleVal = document.querySelector("#sampleTf").value;
    if (sampleVal.trim() === "") {
        return;
    }
    ctx.sampleSize = sampleVal;
    updateScatterPlot();
};
