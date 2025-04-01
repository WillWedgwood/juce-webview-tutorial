export const setupClassificationGraph = (width, height, margin, labels) => {
  const svg = d3.select("#graph")
    .attr("width", width)
    .attr("height", height);

  const xScale = d3.scaleTime()
    .domain([Date.now() - 60000, Date.now()])
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleBand()
    .domain(labels)
    .range([margin.top, height - margin.bottom])
    .padding(0.1);

  const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%H:%M:%S"));
  const yAxis = d3.axisRight(yScale); // Use d3.axisRight for the right-side y-axis

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

export const updateClassificationGraph = (svg, xScale, yScale, xAxis, yAxis, data, labels, removedLabels) => {
  const now = Date.now();
  xScale.domain([now - 60000, now]);

  svg.select(".x-axis").transition().duration(200).call(xAxis);

  yScale.domain(labels.filter(label => !removedLabels.includes(label)));
  svg.select(".y-axis").transition().duration(200).call(yAxis);

  const filteredData = data.filter(d => !removedLabels.includes(d.label));

  const circles = svg.selectAll("circle").data(filteredData, d => d.id);

  circles.enter()
    .append("circle")
    .attr("cx", d => xScale(d.timestamp))
    .attr("cy", d => yScale(d.label) + yScale.bandwidth() / 2)
    .attr("r", 8)
    .attr("fill", "red")
    .merge(circles)
    .transition()
    .duration(200)
    .attr("cx", d => xScale(d.timestamp))
    .attr("cy", d => yScale(d.label) + yScale.bandwidth() / 2);

  circles.exit().remove();
};