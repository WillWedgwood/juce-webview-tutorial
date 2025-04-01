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

  // Update the axes
  svg.select(".x-axis").transition().duration(200).call(xAxis);
  svg.select(".y-axis").transition().duration(200).call(yAxis);

  // Group the data by label
  const groupedData = d3.group(confidenceData, d => d.label);

  // Create a color scale for the labels
  const colorScale = d3.scaleOrdinal()
    .domain(Array.from(groupedData.keys()))
    .range(d3.schemeCategory10); // Use D3's built-in color scheme

  // Bind the grouped data to the lines
  const lines = svg.selectAll(".line")
    .data(Array.from(groupedData), ([label, values]) => label); // Use label as the key

  // Enter: Add new lines
  lines.enter()
    .append("path")
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", ([label]) => colorScale(label)) // Assign a unique color to each label
    .attr("stroke-width", 2)
    .merge(lines) // Merge with existing lines
    .transition()
    .duration(200)
    .attr("d", ([, values]) => d3.line()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.value))
      (values) // Pass the values (data points) for this label
    );

  // Exit: Remove old lines
  lines.exit().remove();

  // ==== Add Legend ====

  // Select or create the legend group
  let legendGroup = svg.select(".legend");
  if (legendGroup.empty()) {
    legendGroup = svg.append("g").attr("class", "legend");
  }

  // Bind labels to legend items
  const legendItems = legendGroup.selectAll(".legend-item")
    .data(Array.from(groupedData.keys()), d => d); // Use label as the key

  // Enter: Add new legend items
  const legendEnter = legendItems.enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(${xScale.range()[0] - 20}, ${20 + i * 20})`); // Position legend items

  legendEnter.append("rect")
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", d => colorScale(d));

  legendEnter.append("text")
    .attr("x", 18)
    .attr("y", 10)
    .style("font-size", "12px")
    .text(d => d);

  // Update: Update existing legend items
  legendItems.select("rect").attr("fill", d => colorScale(d));
  legendItems.select("text").text(d => d);

  // Exit: Remove old legend items
  legendItems.exit().remove();
};