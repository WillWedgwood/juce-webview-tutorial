import { ClassificationLabels } from "./constants.js";

export const addClassification = (label, data, labels, removedLabels) => {
  if (!label || removedLabels.includes(label)) {
    console.log(`Skipping classification: ${label || "Unmatched"}`);
    return data;
  }

  const newEntry = { id: Date.now(), timestamp: Date.now(), label };
  data.push(newEntry);

  return data.filter(d => d.timestamp > Date.now() - 60000);
};

export function mapValueToClassification(value) {
    // Define the classification mappings
    const windNoiseIndices = new Set([36, 40, 190, 277, 278, 279, 453]);
    const rainNoiseIndices = new Set([282, 283, 284, 285, 286, 438, 439, 442, 443, 444, 445, 446, 447]);
    const signalNoiseMap = new Map([
      [494, ClassificationLabels.SILENCE],    // Silence detected
      [506, ClassificationLabels.ECHO],       // Echo detected
      [509, ClassificationLabels.STATIC],     // Static detected
      [511, ClassificationLabels.DISTORTION], // Distortion detected
      [514, ClassificationLabels.WHITE_NOISE], // White noise detected
      [515, ClassificationLabels.PINK_NOISE]  // Pink noise detected
    ]);
  
    // Check for wind noise
    if (windNoiseIndices.has(value)) {
      console.log("Mapping value to Wind");
      return ClassificationLabels.WIND;
    }
  
    // Check for rain noise
    if (rainNoiseIndices.has(value)) {
      console.log("Mapping value to Rain");
      return ClassificationLabels.RAIN;
    }
  
    // Check for specific signal noise
    if (signalNoiseMap.has(value)) {
      const mappedLabel = signalNoiseMap.get(value);
      console.log(`Mapping value ${value} to ${mappedLabel}`);
      return mappedLabel;
    }
  
    // If no match, return null
    console.log(`Value ${value} does not match any classification.`);
    return null;
};

export const updateGraph = (svg, xScale, yScale, xAxis, yAxis, data, labels, removedLabels) => {
  if (!svg || !xScale || !yScale || !xAxis || !yAxis) {
    console.error("Graph setup is incomplete. Ensure setupGraph is called correctly.");
    return;
    }

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

  const circles = svg.selectAll("circle")
    .data(data.filter(d => !removedLabels.includes(d.label)), d => d.id);

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