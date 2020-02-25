"use-strict";

let data = "";
let svgContainer = "";
let popChartContainer = "";
let xScale = "";
let yXcale = "";
const msm = {
    width: 1000,
    height: 800,
    marginAll: 50,
    marginLeft: 50,
}
const small_msm = {
    width: 500,
    height: 500,
    marginAll: 50,
    marginLeft: 80
}

window.onload = function () {
    svgContainer = d3.select("#chart")
        .append('svg')
        .attr('width', msm.width)
        .attr('height', msm.height);
    popChartContainer = d3.select("#popChart")
        .append('svg')
        .attr('width', msm.width)
        .attr('height', msm.height);
    d3.csv("gapminder.csv")
        .then((d) => makeScatterPlot(d))
}

function makeScatterPlot(csvData) {
    data = csvData.filter((data) => {return data.fertility != "NA" && data.life_expectancy != "NA"})
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);
    let mapFunctions = drawAxes(axesLimits, "fertility", "life_expectancy", svgContainer, msm);
    plotData(mapFunctions);
    makeLabels(svgContainer, msm, "Fertility vs Life Expectancy (1980)",'Fertility Rates','Life Expectancy');
    labels(svgContainer, data);
}

function labels(svgContainer, data) {
    let pop = data.filter(function(d) { return +d["population"] > 100000000 && +d["year"] == 1980})
    svgContainer.selectAll('.text')
    .data(pop)
    .enter()
    .append('text')
        .attr('x', function(d) { return xScale(+d['fertility'] +0.2)})
        .attr('y', function(d) { return yScale(+d['life_expectancy'])})
        .text(function(d){ return d["country"]})
        .attr('font-size', '20pt')
}


function makeLabels(svgContainer, msm, title, x, y) {
    svgContainer.append('text')
        .attr('x', (msm.width - 2 * msm.marginAll) / 2 - 90)
        .attr('y', msm.marginAll / 2 + 10)
        .style('font-size', '10pt')
        .text(title);

    svgContainer.append('text')
        .attr('x', (msm.width - 2 * msm.marginAll) / 2 - 30)
        .attr('y', msm.height - 10)
        .style('font-size', '10pt')
        .text(x);

    svgContainer.append('text')
        .attr('transform', 'translate( 15,' + (msm.height / 2 + 30) + ') rotate(-90)')
        .style('font-size', '10pt')
        .text(y);
}

function plotData(map) {
    curData = data.filter((row) => {
        return row["year"] == 1980 
    })
    let pop_data = data.map((row) => +row["population"]);
    let pop_limits = d3.extent(pop_data);
    let pop_map_func = d3.scaleSqrt()
        .domain([pop_limits[0], pop_limits[1]])
        .range([3, 20]);

    let xMap = map.x;
    let yMap = map.y;
    let div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    let toolChart = div.append('svg')
        .attr('width', small_msm.width)
        .attr('height', small_msm.height)
    svgContainer.selectAll('.dot')
        .data(data.filter( function (row){ return row["year"] == 1980}))
        .enter()
        .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => pop_map_func(d["population"]))
        .attr('stroke', "#003366")
        .attr('stroke-width', 2)
        .attr('fill', 'white')
        .on("mouseover", (d) => {
            toolChart.selectAll("*").remove()
            div.transition()
                .duration(200)
                .style("opacity", .9);
            plotPopulation(d.country, toolChart)
            div//.html("Fertility:       " + d.fertility + "<br/>" +
                    // "Life Expectancy: " + d.life_expectancy + "<br/>" +
                    // "Population:      " + numberWithCommas(d["population"]) + "<br/>" +
                    // "Year:            " + d.year + "<br/>" +
                    // "Country:         " + d.country)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            
        })
        .on("mouseout", (d) => {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });

    
}

function plotPopulation(country, toolChart) {
    let countryData = data.filter((row) => {return row.country == country})
    let population = countryData.map((row) => parseInt(row["population"]));
    let year = countryData.map((row) => parseInt(row["year"]));

    let axesLimits = findMinMax(year, population);
    let mapFunctions = drawAxes(axesLimits, "year", "population", toolChart, small_msm);
    toolChart.append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
                    .x(function(d) { return mapFunctions.xScale(d.year) })
                    .y(function(d) { return mapFunctions.yScale(d.population) }))
    makeLabels(toolChart, small_msm, "Population Over Time For " + country, "Year", "Population (in Millions)");
}

function drawAxes(limits, x, y, svgContainer, msm) {
    let xValue = function (d) {
        return +d[x];
    }

     xScale = d3.scaleLinear()
        .domain([limits.xMin - 0.5, limits.xMax + 0.5]) 
        .range([0 + msm.marginAll, msm.width - msm.marginAll])

    let xMap = function (d) {
        return xScale(xValue(d));
    };

    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
        .attr('transform', 'translate(0, ' + (msm.height - msm.marginAll) + ')')
        .call(xAxis);

    let yValue = function (d) {
        return +d[y]
    }

    yScale = d3.scaleLinear()
        .domain([limits.yMax + 5, limits.yMin - 5])
        .range([0 + msm.marginAll, msm.height - msm.marginAll])

    let yMap = function (d) {
        return yScale(yValue(d));
    };

    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
        .attr('transform', 'translate(' + msm.marginAll + ', 0)')
        .call(yAxis);

    return {
        x: xMap,
        y: yMap,
        xScale: xScale,
        yScale: yScale
    };
}

function findMinMax(x, y) {
    let xMin = d3.min(x);
    let xMax = d3.max(x);
    let yMin = d3.min(y);
    let yMax = d3.max(y);
    return {
        xMin: xMin,
        xMax: xMax,
        yMin: yMin,
        yMax: yMax
    }
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}