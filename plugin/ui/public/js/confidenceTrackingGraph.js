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

// Persistent color map to ensure colors remain consistent
const colorMap = new Map();

export const updateConfidenceGraph = (svg, xScale, yScale, xAxis, yAxis, confidenceData, removedLabels) => {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Filter the data to include only the last 1 minute and exclude removed labels
  const filteredData = confidenceData.filter(
    (d) => d.timestamp >= oneMinuteAgo && !removedLabels.includes(d.label)
  );

  // Update the x-axis domain to maintain a rolling 1-minute window
  xScale.domain([oneMinuteAgo, now]);

  // Update the axes
  svg.select(".x-axis").transition().duration(200).call(xAxis);
  svg.select(".y-axis").transition().duration(200).call(yAxis);

  // Group the filtered data by label
  const groupedData = d3.group(filteredData, (d) => d.label);

  // Ensure color consistency by storing a persistent color map
  const allLabels = Array.from(new Set([...colorMap.keys(), ...groupedData.keys()]));
  const colorScale = d3.scaleOrdinal()
    .domain(allLabels)
    .range(d3.schemeCategory10);

  // Assign colors to labels persistently
  allLabels.forEach(label => {
    if (!colorMap.has(label)) {
      colorMap.set(label, colorScale(label));
    }
  });

  // ==== Update Lines ====
  const lines = svg.selectAll(".line")
    .data(Array.from(groupedData), ([label]) => label);

  // Enter: Add new lines
  lines.enter()
    .append("path")
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", ([label]) => colorMap.get(label))
    .attr("stroke-width", 2)
    .merge(lines)
    .transition()
    .duration(200)
    .attr("d", ([, values]) =>
      d3.line()
        .x(d => xScale(d.timestamp))
        .y(d => yScale(d.value))
        (values)
    );

  // Exit: Remove old lines
  lines.exit().remove();

  // ==== Update Legend ====
  let legendGroup = svg.select(".legend");
  if (legendGroup.empty()) {
    legendGroup = svg.append("g").attr("class", "legend");
  }

  // Bind filtered labels to legend items
  const legendItems = legendGroup.selectAll(".legend-item")
    .data(Array.from(groupedData.keys()), (d) => d); // Use label as the key

  // Enter: Add new legend items
  const legendEnter = legendItems.enter()
    .append("g")
    .attr("class", "legend-item");

  legendEnter.append("rect")
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", (d) => colorScale(d));

  legendEnter.append("text")
    .attr("x", 18)
    .attr("y", 10)
    .style("font-size", "10px")
    .style("fill", "white")
    .text((d) => d);

  // Update: Ensure all legend items (new + existing) are positioned correctly
  legendItems.merge(legendEnter)
    .transition()
    .duration(200)
    .attr("transform", (d, i) => `translate(${xScale.range()[0] - 80}, ${20 + i * 20})`);

  // Ensure color is updated correctly
  legendItems.merge(legendEnter).select("rect")
    .attr("fill", (d) => colorScale(d));

  legendItems.merge(legendEnter).select("text")
    .text((d) => d);

  // Exit: Remove old legend items
  legendItems.exit().remove();
};
