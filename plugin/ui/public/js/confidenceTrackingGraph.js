export const setupConfidenceGraph = (width, height, margin) => {
  const svg = d3.select("#graph")
    .attr("width", width)
    .attr("height", height);

  const xScale = d3.scaleTime()
    .domain([Date.now() - 60000, Date.now()])
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([-3, 3])
    .range([height - margin.bottom, margin.top]);

  const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%H:%M:%S"));
  const yAxis = d3.axisRight(yScale).ticks(5).tickFormat(d3.format(".1f")); // Use d3.axisRight for the right-side y-axis

  const xAxisGroup = svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);

  const yAxisGroup = svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${width - margin.right},0)`) // Move y-axis to the right
    .call(yAxis);

  // Adjust the y-axis labels for proper alignment
  yAxisGroup.selectAll("text")
    .style("text-anchor", "start") // Align text to the start (right side)
    .attr("dx", "0.5em"); // Add spacing between the axis and the labels

  return { svg, xScale, yScale, xAxis, yAxis, xAxisGroup, yAxisGroup };
};

export const updateConfidenceGraph = (svg, xScale, yScale, xAxis, yAxis, confidenceData) => {
  const now = Date.now();
  xScale.domain([now - 60000, now]);

  svg.select(".x-axis").transition().duration(200).call(xAxis);
  svg.select(".y-axis").transition().duration(200).call(yAxis);

  const line = svg.selectAll(".line").data([confidenceData]);

  line.enter()
    .append("path")
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", "blue")
    .attr("stroke-width", 2)
    .merge(line)
    .transition()
    .duration(200)
    .attr("d", d3.line()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.value))
    );

  line.exit().remove();
};