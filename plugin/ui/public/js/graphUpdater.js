export const updateGraph = (svg, xScale, yScale, xAxis, yAxis, data, confidenceData, labels, removedLabels, isConfidenceTracking) => {
    if (isConfidenceTracking) {
      updateConfidenceGraph(svg, xScale, yScale, xAxis, yAxis, confidenceData, labels, removedLabels);
    } else {
      updateClassificationGraph(svg, xScale, yScale, xAxis, yAxis, data, labels, removedLabels);
    }
  };
  
  export const updateConfidenceGraph = (svg, xScale, yScale, xAxis, yAxis, confidenceData, labels, removedLabels) => {
    console.log("yScale Function:", yScale);
    console.log("yScale Domain:", yScale.domain());
    console.log("yScale Range:", yScale.range());
    console.log("yScale(3):", yScale(3));
    console.log("yScale(-3):", yScale(-3));
    
    const now = Date.now();
    xScale.domain([now - 60000, now]); // Show the last 60 seconds
    yScale.domain([-3, 3]); // Confidence values range from -3 to 3

    console.log("xScale Domain:", xScale.domain());
    console.log("yScale Domain:", yScale.domain());
    console.log("yScale Range:", yScale.range());
  
    // Update axes
    svg.select(".x-axis").transition().duration(200).call(xAxis);
    svg.select(".y-axis").transition().duration(200).call(yAxis);
  
    // Hardcode a specific label to plot (e.g., "Rain")
    const targetLabel = "Rain";
  
    // Filter data for the target label
    const lineData = confidenceData.filter(d => d.label === targetLabel);
    //console.log(`Line Data for ${targetLabel}:`, lineData);

    lineData.forEach(d => {
      console.log(`Raw Value: ${d.value}, Type: ${typeof d.value}`);
      const clampedValue = Math.max(-3, Math.min(3, d.value));
      console.log(`Clamped Value: ${clampedValue}, Type: ${typeof clampedValue}`);
      const scaledY = yScale(clampedValue);
      console.log(`Scaled Y: ${scaledY}`);
    });
  
    // Define a color scale for the target label
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(labels);
  
    // Bind data to the line
    const line = svg.selectAll(".line").data([lineData]); // Bind the filtered data as an array
  
    // Enter new line
    line.enter()
      .append("path")
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", colorScale(targetLabel)) // Assign color to the line
      .attr("stroke-width", 2)
      .merge(line) // Merge with existing line
      .transition()
      .duration(200)
      .attr("d", d3.line()
        .x(d => xScale(d.timestamp)) // Map timestamp to x-axis
        .y(d => yScale(d.value))     // Map confidence value to y-axis
      );
  
    // Remove old lines
    line.exit().remove();
  };
  
  export const updateClassificationGraph = (svg, xScale, yScale, xAxis, yAxis, data, labels, removedLabels) => {
    const now = Date.now();
    xScale.domain([now - 60000, now]);
  
    svg.select(".x-axis")
      .transition()
      .duration(200)
      .call(xAxis);
  
    yScale.domain(labels.filter(label => !removedLabels.includes(label)));
    svg.select(".y-axis")
      .transition()
      .duration(200)
      .call(yAxis);
  
    const filteredData = data.filter(d => !removedLabels.includes(d.label));
  
    const circles = svg.selectAll("circle")
      .data(filteredData, d => d.id);
  
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