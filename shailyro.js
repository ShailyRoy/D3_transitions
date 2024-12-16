let currentDataset = '/data/penguins_cleaned.csv';
let currentData = [];
let selectedPoints = [];
let showViolinPlot = false; 
let colorMap;
const margin = { top: 20, right: 30, bottom: 50, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

function loadDataset(dataset) {
    d3.csv(dataset)
        .then(data => {
            if (data.length === 0) {
                console.warn("Dataset is empty.");
                clearPlots();  // Clears graphs and dropdowns
                return;
            }
            currentData = data;
            updateAttributeOptions(data);
            if (d3.select("#x-attribute-select").select("option").empty() || d3.select("#y-attribute-select").select("option").empty()) {
                console.warn("No valid x or y attribute available.");
                clearPlots();  // Clears graphs and dropdowns
            } else {
                drawScatterPlot(data);
                drawBoxPlot([]);
            }
        })
        .catch(error => {
            console.error("Failed to load dataset:", error);
            currentData = [];
            clearPlots();
        });
}


function updateAttributeOptions(data) {
    // Clear all existing options in the dropdowns
    d3.select("#x-attribute-select").selectAll("option").remove();
    d3.select("#y-attribute-select").selectAll("option").remove();
    d3.select("#color-select").selectAll("option").remove();
    d3.select("#boxplot-attribute-select").selectAll("option").remove();

    if (data.length === 0) {
  
        ["#x-attribute-select", "#y-attribute-select", "#color-select", "#boxplot-attribute-select"].forEach(selectId => {
            d3.select(selectId)
                .append("option")
                .text("No valid options")
                .attr("disabled", true);
        });
        return;
    }

    const columns = Object.keys(data[0]);
    const ignoredColumns = ['#', 'Name', 'Type 2'];
    const validColumns = columns.filter(column => !ignoredColumns.includes(column));


    const numericColumns = validColumns.filter(key => data.every(d => !isNaN(d[key]) && d[key] !== ""));
    const categoricalColumns = validColumns.filter(key => !numericColumns.includes(key));


    if (numericColumns.length > 0) {
        d3.select("#x-attribute-select").selectAll("option")
            .data(numericColumns)
            .enter()
            .append("option")
            .text(d => d);

        d3.select("#y-attribute-select").selectAll("option")
            .data(numericColumns)
            .enter()
            .append("option")
            .text(d => d);

        d3.select("#boxplot-attribute-select").selectAll("option")
            .data(numericColumns)
            .enter()
            .append("option")
            .text(d => d);
    } else {

        ["#x-attribute-select", "#y-attribute-select", "#boxplot-attribute-select"].forEach(selectId => {
            d3.select(selectId)
                .append("option")
                .text("No valid options")
                .attr("disabled", true);
        });
    }


    if (categoricalColumns.length > 0) {
        d3.select("#color-select").selectAll("option")
            .data(categoricalColumns)
            .enter()
            .append("option")
            .text(d => d);
    } else {

        d3.select("#color-select")
            .append("option")
            .text("No valid options")
            .attr("disabled", true);
    }
}
function setColorMap(data) {
    const colorAttr = d3.select("#color-select").property("value");
    const uniqueCategories = Array.from(new Set(data.map(d => d[colorAttr])));
    const combinedColors = [
        ...d3.schemeCategory10,
        ...d3.schemeSet3,
        ...d3.schemePaired,
        ...d3.schemeDark2,
        ...d3.schemeAccent,
    ];

    if (uniqueCategories.length <= combinedColors.length) {
        colorMap = new Map(uniqueCategories.map((d, i) => [d, combinedColors[i]]));
    } else {
        const colorScale = d3.scaleSequential(d3.interpolateRainbow).domain([0, uniqueCategories.length - 1]);
        colorMap = new Map(uniqueCategories.map((d, i) => [d, colorScale(i / (uniqueCategories.length - 1))]));
    }
}


function drawScatterPlot(data) {
    setColorMap(data);
    const width = 800; 
    const height = 400;
    const margin = { top: 20, right: 150, bottom: 40, left: 40 }; 
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const svg = d3.select("#scatter-plot-panel").selectAll("svg")
        .data([null])
        .join("svg")
        .attr("width", width)
        .attr("height", height);

    const xAttr = d3.select("#x-attribute-select").property("value");
    const yAttr = d3.select("#y-attribute-select").property("value");
    const colorAttr = d3.select("#color-select").property("value");
    const xExtent = d3.extent(data, d => +d[xAttr]);
    const yExtent = d3.extent(data, d => +d[yAttr]);
    const xScale = d3.scaleLinear().domain([xExtent[0] - 1, xExtent[1] + 1]).nice().range([margin.left, plotWidth]);
    const yScale = d3.scaleLinear().domain([yExtent[0] - 1, yExtent[1] + 1]).nice().range([plotHeight, margin.top]);


    const uniqueCategories = Array.from(new Set(data.map(d => d[colorAttr])));

 
    const combinedColors = [
        ...d3.schemeCategory10,
        ...d3.schemeSet3,
        ...d3.schemePaired,
        ...d3.schemeDark2,
        ...d3.schemeAccent,
    ];
    

    if (uniqueCategories.length <= combinedColors.length) {
        colorMap = new Map(uniqueCategories.map((d, i) => [d, combinedColors[i]]));
    } else {
        // Fall back to interpolateRainbow if categories exceed combinedColors length
        const colorScale = d3.scaleSequential(d3.interpolateRainbow).domain([0, uniqueCategories.length - 1]);
        colorMap = new Map(uniqueCategories.map((d, i) => [d, colorScale(i / (uniqueCategories.length - 1))]));
    }

    if (!xAttr || !yAttr) {
        console.warn("No valid x or y attribute selected for scatter plot.");
        d3.select("#scatter-plot-panel").selectAll("svg").remove();
        return;
    }


    svg.selectAll(".x-axis")
        .data([null])
        .join("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${plotHeight})`)
        .transition().duration(1000)
        .call(d3.axisBottom(xScale));

    svg.selectAll(".y-axis")
        .data([null])
        .join("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left}, 0)`)
        .transition().duration(1000)
        .call(d3.axisLeft(yScale));

   
    const circles = svg.selectAll("circle")
        .data(data, d => d.id || d);

    circles.enter().append("circle")
        .attr("cx", plotWidth / 2)
        .attr("cy", plotHeight / 2)
        .attr("r", 0)
        .attr("fill", d => colorMap.get(d[colorAttr]))
        .attr("stroke", "black")
        .merge(circles)
        .attr("cx", d => xScale(+d[xAttr]))
        .attr("cy", d => yScale(+d[yAttr]))
        .attr("r", 5);

    circles.exit()
        .transition().duration(1000)
        .attr("r", 0)
        .remove();


    addLassoInteraction(svg, data, xScale, yScale, xAttr, yAttr);

    svg.selectAll(".legend").remove();


    const legend = svg.selectAll(".legend")
        .data(uniqueCategories)
        .join("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${plotWidth + 20}, ${i * 20 + margin.top})`);

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", d => colorMap.get(d));

    legend.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .text(d => d)
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
}


// function drawScatterPlot(data) {
//     d3.select("#scatter-plot-panel").html("");
//     const width = 700;
//     const height = 400;
//     const svg = d3.select("#scatter-plot-panel").append("svg")
//         .attr("width", width)
//         .attr("height", height);

//     const xAttr = d3.select("#x-attribute-select").property("value");
//     const yAttr = d3.select("#y-attribute-select").property("value");
//     const colorAttr = d3.select("#color-select").property("value");
//     const xExtent = d3.extent(data, d => +d[xAttr]);
//     const xMin = xExtent[0] - 1;
//     const xMax = xExtent[1] + 1;
//     const yExtent = d3.extent(data, d => +d[yAttr]);
//     const yMin = yExtent[0] - 1;
//     const yMax = yExtent[1] + 1;
//     const xScale = d3.scaleLinear()
//         .domain([xMin, xMax]).nice()
//         .range([40, width]);
//     const yScale = d3.scaleLinear()
//         .domain([yMin, yMax]).nice()
//         .range([height - 20, 60]);
//     const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

//     svg.append("g")
//         .attr("transform", translate(0, ${height - 20}))
//         .call(d3.axisBottom(xScale));

//     svg.append("g")
//         .attr("transform", "translate(40, 0)")
//         .call(d3.axisLeft(yScale));
    
//     svg.selectAll("circle")
//         .data(data)
//         .enter().append("circle")
//         .attr("cx", d => xScale(+d[xAttr]))
//         .attr("cy", d => yScale(+d[yAttr]))
//         .attr("r", 5)
//         .attr("fill", d => colorScale(d[colorAttr]))
//         .attr("stroke", "black");

//     addLassoInteraction(svg, data, xScale, yScale, xAttr, yAttr);
// }

function addLassoInteraction(svg, data, xScale, yScale, xAttr, yAttr) {
    let lassoBox;
    svg.on("mousedown", function(event) {
        const [x, y] = d3.pointer(event);
        lassoBox = svg.append("rect")
            .attr("x", x)
            .attr("y", y)
            .attr("width", 0)
            .attr("height", 0)
            .attr("stroke", "dodgerblue")
            .attr("stroke-width", 2)
            .attr("fill", "rgba(30, 144, 255, 0.3)")
            .attr("stroke-dasharray", "4");

        svg.on("mousemove", function(event) {
            const [newX, newY] = d3.pointer(event);
            lassoBox
                .attr("width", Math.abs(newX - x))
                .attr("height", Math.abs(newY - y))
                .attr("x", Math.min(x, newX))
                .attr("y", Math.min(y, newY));
        });

        svg.on("mouseup", function() {
            selectedPoints = data.filter(d => {
                const cx = xScale(+d[xAttr]);
                const cy = yScale(+d[yAttr]);
                return cx >= parseFloat(lassoBox.attr("x")) &&
                       cx <= parseFloat(lassoBox.attr("x")) + parseFloat(lassoBox.attr("width")) &&
                       cy >= parseFloat(lassoBox.attr("y")) &&
                       cy <= parseFloat(lassoBox.attr("y")) + parseFloat(lassoBox.attr("height"));
            });

            svg.selectAll("circle")
                .attr("stroke", d => selectedPoints.includes(d) ? "orange" : "black")
                .attr("stroke-width", d => selectedPoints.includes(d) ? 2 : 1)
                .attr("fill-opacity", d => selectedPoints.includes(d) ? 1 : 0.5);

            drawBoxPlot(selectedPoints);
            lassoBox.remove();
            svg.on("mousemove", null);
            svg.on("mouseup", null);
        });
    });
}



let previousPlotType = false; 

function drawBoxPlot(selectedData) {

    if (showViolinPlot !== previousPlotType) {
        d3.select("#box-plot-panel").selectAll("svg").remove();
    }

    if (showViolinPlot) {
        drawViolinPlot(selectedData);
    } else {
        drawRegularBoxPlot(selectedData);
    }

    previousPlotType = showViolinPlot;
}


function drawRegularBoxPlot(selectedData) {
    //setColorMap(selectedData);
    

    const width = 680;
    const height = 420;
    const margin = { top: 20, right: 60, bottom: 50, left: 20 };
    const attr = d3.select("#boxplot-attribute-select").property("value");

    const filteredData = selectedData.filter(d => !isNaN(d[attr]) && d[attr] !== "");

   
    if (filteredData.length <= 5) {
        drawCirclePlot(filteredData, width, height, margin, attr);
        return;
    }
    d3.select("#box-plot-panel").selectAll("circle").transition().duration(500).attr("opacity", 0).remove();

    const svg = d3.select("#box-plot-panel").selectAll("svg")
        .data([null])
        .join("svg")
        .attr("width", width)
        .attr("height", height + margin.top + margin.bottom)
        .selectAll("g")
        .data([null])
        .join("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const colorAttr = d3.select("#color-select").property("value");
    const groupedData = d3.group(filteredData, d => d[colorAttr]);

    const stats = Array.from(groupedData, ([key, values]) => {
        const numbers = values.map(d => +d[attr]).sort(d3.ascending);
        const min = d3.min(numbers);
        const max = d3.max(numbers);
        const q1 = d3.quantile(numbers, 0.25);
        const median = d3.quantile(numbers, 0.5);
        const q3 = d3.quantile(numbers, 0.75);
        const iqr = q3 - q1;
        const lowerWhisker = Math.max(min, q1 - 1.5 * iqr);
        const upperWhisker = Math.min(max, q3 + 1.5 * iqr);
        const outliers = numbers.filter(d => d < lowerWhisker || d > upperWhisker);
        return { key, min, q1, median, q3, max, lowerWhisker, upperWhisker, outliers };
    });

    let minValue = d3.min(stats, d => d.min);
    let maxValue = d3.max(stats, d => d.max);
    if (minValue === maxValue) {
        minValue -= 1;
        maxValue += 1;
    }

    const yScale = d3.scaleLinear()
        .domain([minValue, maxValue])
        .range([height - margin.bottom, margin.top]);

    const xScale = d3.scaleBand()
        .domain(stats.map(d => d.key))
        .range([margin.left, width - margin.right])
        .padding(0.2);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

   
    const duration = 1000;
    const delayStep = 100;

    svg.selectAll(".box")
        .data(stats, d => d.key)
        .attr("fill", d => colorMap.get(d.key) )
        .attr("stroke", d => colorMap.get(d.key) )
        .join(
            enter => enter.append("rect")
                .attr("class", "box")
                .attr("x", d => xScale(d.key) + (xScale.bandwidth() - 20) / 2)
                .attr("width", 20)
                .attr("y", yScale(minValue))  
                .attr("height", 0)
                .attr("stroke", d => colorMap.get(d.key))
                .attr("fill", d => colorMap.get(d.key))
                .call(enter => enter.transition().duration(duration)
                    .attr("y", d => yScale(d.q3))
                    .attr("height", d => yScale(d.q1) - yScale(d.q3)))
                    .on("end", function() {  // Apply color after transition ends
                        d3.select(this)
                            .attr("fill", d => colorMap.get(d.key) )
                            .attr("stroke", d => colorMap.get(d.key) );
                    }),
            update => update.transition().duration(duration)
                .attr("x", d => xScale(d.key) + (xScale.bandwidth() - 20) / 2)
                .attr("y", d => yScale(d.q3))
                .attr("stroke", d => colorMap.get(d.key))
                .attr("fill", d => colorMap.get(d.key))
                .attr("height", d => yScale(d.q1) - yScale(d.q3)),
            exit => exit.transition().duration(duration)
                .attr("height", 0)
                .attr("y", yScale(minValue))
                .attr("stroke", d => colorMap.get(d.key))
                .attr("fill", d => colorMap.get(d.key))
                .remove()
        );


    const medians = svg.selectAll(".median-line")
        .data(stats, d => d.key);

    medians.enter()
        .append("line")
        .attr("class", "median-line")
        .attr("x1", d => xScale(d.key) + (xScale.bandwidth() - 20) / 2)
        .attr("x2", d => xScale(d.key) + (xScale.bandwidth() - 20) / 2 + 20)
        .attr("y1", yScale(minValue))
        .attr("y2", yScale(minValue))
        .attr("stroke", "black")
        .attr("fill", d => colorMap.get(d.key))
        .merge(medians)
        .transition()
        .delay((d, i) => i * delayStep + duration / 2)
        .duration(duration)
        .attr("x1", d => xScale(d.key) + (xScale.bandwidth() - 20) / 2)
        .attr("x2", d => xScale(d.key) + (xScale.bandwidth() - 20) / 2 + 20)
        .attr("y1", d => yScale(d.median))
        .attr("y2", d => yScale(d.median));

    medians.exit()
        .transition()
        .duration(duration)
        .attr("y1", yScale(minValue))
        .attr("y2", yScale(minValue))
        .remove();


    const whiskers = svg.selectAll(".whisker-line")
        .data(stats, d => d.key);

    whiskers.enter()
        .append("line")
        .attr("class", "whisker-line")
        .attr("x1", d => xScale(d.key) + xScale.bandwidth() / 2)
        .attr("x2", d => xScale(d.key) + xScale.bandwidth() / 2)
        .attr("y1", yScale(minValue))
        .attr("y2", yScale(minValue))
        .attr("stroke", "black")
        .attr("fill", d => colorMap.get(d.key))
        .merge(whiskers)
        .transition()
        .delay((d, i) => i * delayStep + duration / 2)
        .duration(duration)
        .attr("x1", d => xScale(d.key) + xScale.bandwidth() / 2)
        .attr("x2", d => xScale(d.key) + xScale.bandwidth() / 2)
        .attr("y1", d => yScale(d.lowerWhisker))
        .attr("y2", d => yScale(d.upperWhisker));

    whiskers.exit()
        .transition()
        .duration(duration)
        .attr("y1", yScale(minValue))
        .attr("y2", yScale(minValue))
        .remove();
    

    const outliers = svg.selectAll(".outlier")
        .data(stats.flatMap(d => d.outliers.map(out => ({ key: d.key, value: out }))), d => d.key + '-' + d.value);

    outliers.enter()
        .append("circle")
        .attr("class", "outlier")
        .attr("cx", d => xScale(d.key) + xScale.bandwidth() / 2)
        .attr("cy", yScale(minValue))
        .attr("r", 3)
        .attr("fill", d => colorMap.get(d.key))
        .attr("opacity", 0)
        .merge(outliers)
        .transition()
        .delay((d, i) => (i % stats.length) * delayStep + duration)
        .duration(duration / 2)
        .attr("cy", d => yScale(d.value))
        .attr("opacity", 1);

    outliers.exit()
        .transition()
        .duration(duration / 2)
        .attr("cy", yScale(minValue))
        .attr("opacity", 0)
        .remove();

    const xAxis = svg.selectAll(".x-axis")
        .data([null])
        .join("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    if (xScale.domain().length > 5) {
        xAxis.selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.8em")
            .attr("dy", "0.15em")
            .attr("transform", "rotate(-45)");
    }


    svg.selectAll(".y-axis")
        .data([null])
        .join("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale));
}
function drawCirclePlot(data, width, height, margin, attr) {
    d3.select("#box-plot-panel").selectAll("svg").remove();
    const svg = d3.select("#box-plot-panel").selectAll("svg")
        .data([null])
        .join("svg")
        .attr("width", width)
        .attr("height", height + margin.top + margin.bottom)
        .selectAll("g")
        .data([null])
        .join("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const colorAttr = d3.select("#color-select").property("value");

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => +d[attr])).nice()
        .range([height - margin.bottom, margin.top]);

    const uniqueCategories = Array.from(new Set(data.map(d => d[colorAttr])));
    const xScale = d3.scalePoint()
        .domain(uniqueCategories)
        .range([margin.left, width - margin.right])
        .padding(0.5);

    svg.selectAll(".x-axis")
        .data([null])
        .join("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .transition()
        .duration(1000)
        .call(d3.axisBottom(xScale));

    svg.selectAll(".y-axis")
        .data([null])
        .join("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left}, 0)`)
        .transition()
        .duration(1000)
        .call(d3.axisLeft(yScale));

    const circles = svg.selectAll("circle")
        .data(data, d => d.id || d[colorAttr]);

    circles.join(
        enter => enter.append("circle")
            .attr("cx", d => xScale(d[colorAttr]))
            .attr("cy", height - margin.bottom)
            .attr("r", 5)
            .attr("fill", d => colorMap.get(d[colorAttr]))
            .attr("stroke", "black")
            .attr("stroke-width", 1.5)
            .attr("opacity", 0)
            .transition()
            .duration(1000)
            .attr("cy", d => yScale(d[attr])) 
            .attr("opacity", 1),
        update => update.transition()
            .duration(1000)
            .attr("cx", d => xScale(d[colorAttr]))
            .attr("cy", d => yScale(d[attr]))
            .attr("fill", d => colorMap.get(d[colorAttr])),
        exit => exit.transition()
            .duration(500)
            .attr("opacity", 0)
            .remove()
    );
}

function drawViolinPlot(selectedData) {
    const width = 650;
    const height = 380;
    const margin = { top: 20, right: 50, bottom: 50, left: 30 };
    const attr = d3.select("#boxplot-attribute-select").property("value");

    const filteredData = selectedData.filter(d => !isNaN(d[attr]) && d[attr] !== "");


    const svg = d3.select("#box-plot-panel").selectAll("svg")
        .data([null])
        .join("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .selectAll("g")
        .data([null])
        .join("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    svg.selectAll(".violin").remove();

    const colorAttr = d3.select("#color-select").property("value");
    const groupedData = d3.group(filteredData, d => d[colorAttr]);


    const xScale = d3.scaleBand()
        .domain(Array.from(groupedData.keys()))
        .range([0, width])
        .padding(0.03);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(filteredData, d => +d[attr])).nice()
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);


    function kernelDensityEstimator(kernel, X) {
        return function(V) {
            return X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
        };
    }

    function kernelEpanechnikov(k) {
        return v => Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    }

    const density = Array.from(groupedData, ([key, values]) => {
        const numbers = values.map(d => +d[attr]);
        const densityData = kernelDensityEstimator(kernelEpanechnikov(7), yScale.ticks(40))(numbers);
        return { key, densityData };
    });


    svg.selectAll(".violin")
        .data(density, d => d.key)
        .join(
            enter => enter.append("path")
                .attr("class", "violin")
                .attr("transform", d => `translate(${xScale(d.key) + xScale.bandwidth() / 2},0)`)
                .attr("fill", d => colorMap.get(d.key))
                .attr("opacity", 0.7)
                .attr("d", d3.area()
                    .x0(() => 0)
                    .x1(() => 0)
                    .y(d => yScale(d[0]))
                    .curve(d3.curveCatmullRom))
                .call(enter => enter.transition().duration(1000)
                    .attr("d", d => d3.area()
                        .x0(d => -xScale.bandwidth() / 2 * d[1]) 
                        .x1(d => xScale.bandwidth() / 2 * d[1])  
                        .y(d => yScale(d[0]))                    
                        .curve(d3.curveCatmullRom)(d.densityData))),
            update => update.transition().duration(1000)
                .attr("d", d => d3.area()
                    .x0(d => -xScale.bandwidth() / 2 * d[1])
                    .x1(d => xScale.bandwidth() / 2 * d[1])
                    .y(d => yScale(d[0]))
                    .curve(d3.curveCatmullRom)(d.densityData)),
            exit => exit.transition().duration(1000)
                .attr("d", d3.area()
                    .x0(() => 0)
                    .x1(() => 0)
                    .y(d => yScale(d[0]))
                    .curve(d3.curveCatmullRom))
                .remove()
        );


    svg.selectAll(".x-axis").remove();
    const xAxis = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .style("font-size", "10px")
        .call(d3.axisBottom(xScale));

    if (xScale.domain().length > 5) {
        xAxis.selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.8em")
            .attr("dy", "0.15em")
            .style("font-size", "10px")
            .attr("transform", "rotate(-45)");
    }

    svg.selectAll(".y-axis").remove();
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));
}


function clearPlots() {
    d3.select("#scatter-plot-panel").selectAll("svg").remove();
    d3.select("#box-plot-panel").selectAll("svg").remove();

    ["#x-attribute-select", "#y-attribute-select", "#color-select", "#boxplot-attribute-select"].forEach(selectId => {
        d3.select(selectId).selectAll("option").remove();
        d3.select(selectId)
            .append("option")
            .text("No valid options")
            .attr("disabled", true);
    });
}

function clearBoxPlot() {
    d3.select("#box-plot-panel").html(""); 
    const svg = d3.select("#box-plot-panel").append("svg")
        .attr("width", 680)
        .attr("height", 420);
    svg.append("text")
        .attr("x", 340)
        .attr("y", 210)
        .attr("text-anchor", "middle")
        .text("No data selected");
}

window.addEventListener("resize", () => {
    if (currentData.length > 0) {
        drawScatterPlot(currentData);
        drawBoxPlot(selectedPoints);
    } else {
        clearPlots();
    }
});

d3.select("#dataset-select").on("change", function() {
    currentDataset = this.value;
    loadDataset(currentDataset);
});

d3.select("#x-attribute-select").on("change", () => drawScatterPlot(currentData));
d3.select("#y-attribute-select").on("change", () => drawScatterPlot(currentData));
d3.select("#color-select").on("change", () => {
    drawScatterPlot(currentData);
    drawBoxPlot(selectedPoints);
});
d3.select("#boxplot-attribute-select").on("change", () => drawBoxPlot(selectedPoints));


d3.select("#toggle-plot-type").on("click", () => {
    showViolinPlot = !showViolinPlot;
    drawBoxPlot(selectedPoints);
});

loadDataset(currentDataset);
