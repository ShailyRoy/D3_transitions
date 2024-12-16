let currentDataset = '/data/penguins_cleaned.csv';
let currentData = [];
let selectedPoints = [];

const margin = { top: 20, right: 30, bottom: 50, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

function loadDataset(dataset) {
    d3.csv(dataset)
        .then(data => {
            currentData = data;
            updateAttributeOptions(data);
            drawScatterPlot(data);
            drawBoxPlot([]);
        })
        .catch(error => {
            console.error("Failed to load dataset:", error);
            currentData = [];
            clearPlots();
        });
}

function updateAttributeOptions(data) {
    const columns = Object.keys(data[0]);
    const ignoredColumns = ['#', 'Name', 'Type 2'];
    const validColumns = columns.filter(column => !ignoredColumns.includes(column));
    const numericColumns = validColumns.filter(key => data.every(d => !isNaN(d[key]) && d[key] !== ""));
    const categoricalColumns = validColumns.filter(key => !numericColumns.includes(key));

    d3.select("#x-attribute-select").selectAll("option").remove();
    d3.select("#x-attribute-select").selectAll("option")
        .data(numericColumns)
        .enter()
        .append("option")
        .text(d => d);

    d3.select("#y-attribute-select").selectAll("option").remove();
    d3.select("#y-attribute-select").selectAll("option")
        .data(numericColumns)
        .enter()
        .append("option")
        .text(d => d);

    d3.select("#color-select").selectAll("option").remove();
    d3.select("#color-select").selectAll("option")
        .data(categoricalColumns)
        .enter()
        .append("option")
        .text(d => d);

    d3.select("#boxplot-attribute-select").selectAll("option").remove();
    d3.select("#boxplot-attribute-select").selectAll("option")
        .data(numericColumns)
        .enter()
        .append("option")
        .text(d => d);
}

function drawScatterPlot(data) {
    d3.select("#scatter-plot-panel").html("");
    const width = 700;
    const height = 400;
    const svg = d3.select("#scatter-plot-panel").append("svg")
        .attr("width", width)
        .attr("height", height);

    const xAttr = d3.select("#x-attribute-select").property("value");
    const yAttr = d3.select("#y-attribute-select").property("value");
    const colorAttr = d3.select("#color-select").property("value");
    const xExtent = d3.extent(data, d => +d[xAttr]);
    const xMin = xExtent[0] - 1;
    const xMax = xExtent[1] + 1;
    const yExtent = d3.extent(data, d => +d[yAttr]);
    const yMin = yExtent[0] - 1;
    const yMax = yExtent[1] + 1;
    const xScale = d3.scaleLinear()
        .domain([xMin, xMax]).nice()
        .range([40, width]);
    const yScale = d3.scaleLinear()
        .domain([yMin, yMax]).nice()
        .range([height - 20, 60]);
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    svg.append("g")
        .attr("transform", `translate(0, ${height - 20})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("transform", "translate(40, 0)")
        .call(d3.axisLeft(yScale));
    
    svg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScale(+d[xAttr]))
        .attr("cy", d => yScale(+d[yAttr]))
        .attr("r", 5)
        .attr("fill", d => colorScale(d[colorAttr]))
        .attr("stroke", "black");

    addLassoInteraction(svg, data, xScale, yScale, xAttr, yAttr);
}

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

function drawBoxPlot(selectedData) {
    d3.select("#box-plot-panel").html("");
    const width = 680;
    const height = 420;
    const attr = d3.select("#boxplot-attribute-select").property("value");
    const filteredData = selectedData.filter(d => !isNaN(d[attr]) && d[attr] !== "");

    if (filteredData.length === 0) {
        const svg = d3.select("#box-plot-panel").append("svg")
            .attr("width", width)
            .attr("height", height);
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .text("No data selected");
        return;
    }

    const svg = d3.select("#box-plot-panel").append("svg")
        .attr("width", width)
        .attr("height", height);

    const groupedData = d3.group(filteredData, d => d[d3.select("#color-select").property("value")]);
    const stats = Array.from(groupedData, ([key, values]) => {
        const numbers = values.map(d => +d[attr]).sort(d3.ascending);
        const min = d3.min(numbers);
        const max = d3.max(numbers);
        const q1 = d3.quantile(numbers, 0.25);
        const median = d3.quantile(numbers, 0.5);
        const q3 = d3.quantile(numbers, 0.75);
        return { key, min, q1, median, q3, max };
    });

    drawVerticalBoxPlot(svg, stats, width, height);
}

function drawBoxPlot(selectedData) {
    d3.select("#box-plot-panel").html("");
    const width = 680;
    const height = 420;
    const margin = { top: 20, right: 50, bottom: 10, left: 20 };
    const attr = d3.select("#boxplot-attribute-select").property("value");
    const filteredData = selectedData.filter(d => !isNaN(d[attr]) && d[attr] !== "");

    if (filteredData.length === 0) {
        clearBoxPlot();
        return;
    }

    const svg = d3.select("#box-plot-panel").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
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
        return { key, min, q1, median, q3, max, values: numbers };
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

    stats.forEach(stat => {
        if (stat.values.length <= 4) {
            svg.selectAll(`.point-${stat.key}`)
                .data(stat.values)
                .enter()
                .append("circle")
                .attr("cx", xScale(stat.key) + xScale.bandwidth() / 2)
                .attr("cy", d => yScale(d))
                .attr("r", 4)
                .attr("fill", colorScale(stat.key))
                .attr("class", `point-${stat.key}`);
        } else {
            const boxWidth = Math.min(20, xScale.bandwidth());
            svg.append("rect")
                .attr("x", xScale(stat.key) + (xScale.bandwidth() - boxWidth) / 2)
                .attr("y", yScale(stat.q3))
                .attr("width", boxWidth)
                .attr("height", yScale(stat.q1) - yScale(stat.q3))
                .attr("fill", colorScale(stat.key))
                .attr("class", "box");
            svg.append("line")
                .attr("x1", xScale(stat.key) + (xScale.bandwidth() - boxWidth) / 2)
                .attr("x2", xScale(stat.key) + (xScale.bandwidth() - boxWidth) / 2 + boxWidth)
                .attr("y1", yScale(stat.median))
                .attr("y2", yScale(stat.median))
                .attr("stroke", "black")
                .attr("class", "median-line");
            svg.append("line")
                .attr("x1", xScale(stat.key) + xScale.bandwidth() / 2)
                .attr("x2", xScale(stat.key) + xScale.bandwidth() / 2)
                .attr("y1", yScale(stat.min))
                .attr("y2", yScale(stat.q1))
                .attr("stroke", "black")
                .attr("class", "whisker-line");
            svg.append("line")
                .attr("x1", xScale(stat.key) + xScale.bandwidth() / 2)
                .attr("x2", xScale(stat.key) + xScale.bandwidth() / 2)
                .attr("y1", yScale(stat.q3))
                .attr("y2", yScale(stat.max))
                .attr("stroke", "black")
                .attr("class", "whisker-line");
        }
    });

    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    if (stats.length > 5) {
        xAxis.selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.8em")
            .attr("dy", "0.15em")
            .attr("transform", "rotate(-45)");
    }

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));
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

loadDataset(currentDataset);
