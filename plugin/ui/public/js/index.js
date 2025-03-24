import * as Juce from "./juce/index.js";

console.log("JUCE frontend library successfully imported");

// Define an enum-like object for classification labels
const ClassificationLabels = {
    RAIN: "Rain",
    WIND: "Wind",
    SILENCE: "Silence",
    ECHO: "Echo",
    STATIC: "Static",
    DISTORTION: "Distortion",
    WHITE_NOISE: "White Noise",
    PINK_NOISE: "Pink Noise"
};

// Generate the labels array dynamically from the enum
let labels = Object.values(ClassificationLabels);
let removedLabels = []; // Track removed classifications

// Define the color palette
const ColourPalette = {
    blue_0: "rgb(162, 229, 255)",
    blue_1: "rgb(95, 191, 246)",
    blue_2: "rgb(43, 194, 252)",
    blue_3: "rgb(7, 186, 255)",
    blue_4: "rgb(0, 173, 255)",
    blue_5: "rgb(0, 120, 166)",
    blue_6: "rgb(0, 93, 129)",
    blue_7: "rgb(3, 69, 96)",
    blue_8: "rgb(2, 46, 64)",
    blue_9: "rgb(1, 23, 32)",
    orange: "rgb(255, 179, 0)",
    compBlue: "rgb(0, 45, 228)",
    red: "rgb(255, 35, 0)",
    green: "rgb(0, 149, 55)"
};

// Set graph dimensions
const width = 800;
const height = 400;
const margin = { top: 20, right: 100, bottom: 30, left: 50 }; // Adjust margins

// Select the SVG element and set its dimensions
const svg = d3.select("#outputLevelPlot")
    .attr("width", width)
    .attr("height", height);

// Ensure the SVG is found
if (svg.empty()) {
    console.error("SVG element not found!");
}

// Define x-axis scale (time)
const xScale = d3.scaleTime()
    .domain([Date.now() - 60000, Date.now()]) // Last 60 seconds
    .range([margin.left, width - margin.right]);

// Define y-axis scale (classification categories)
let yScale = d3.scaleBand()
    .domain(labels)
    .range([height - margin.bottom, margin.top])
    .padding(0.3);

// Append x-axis
const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%H:%M:%S"));
svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);

// Append y-axis
let yAxis = d3.axisRight(yScale); // Change to `axisRight` to position labels on the right
const yAxisGroup = svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${width - margin.right},0)`) // Move y-axis to the right
    .call(yAxis);

// Data storage
let data = [];

// Function to update the graph
function updateGraph() {
    // Update x-axis domain (shifting time window)
    xScale.domain([Date.now() - 60000, Date.now()]);
    svg.select(".x-axis").call(xAxis);

    // Update y-axis domain and redraw it
    yScale.domain(labels);
    yAxisGroup
        .attr("transform", `translate(${width - margin.right},0)`) // Ensure y-axis stays on the right
        .call(yAxis);

    // Bind data to circles
    const circles = svg.selectAll("circle")
        .data(data.filter(d => labels.includes(d.label)), d => d.id); // Filter data to include only visible labels

    // Enter: Add new circles
    circles.enter()
        .append("circle")
        .attr("cx", d => xScale(d.timestamp))
        .attr("cy", d => yScale(d.label) + yScale.bandwidth() / 2)
        .attr("r", 8)
        .attr("fill", ColourPalette.red) // Use a color from the palette
        .merge(circles) // Merge with updates
        .transition().duration(500)
        .attr("cx", d => xScale(d.timestamp))
        .attr("cy", d => yScale(d.label) + yScale.bandwidth() / 2);

    // Remove old data points
    circles.exit().remove();
}

// Function to add new classification
function addClassification(label) {
    const newEntry = { 
        id: Date.now(), 
        timestamp: Date.now(), 
        label: label 
    };
    data.push(newEntry);

    // Keep only last 60 seconds of data
    data = data.filter(d => d.timestamp > Date.now() - 60000);
    updateGraph();
}

// Function to map specific values to classification labels
function mapValueToClassification(value) {
  // Check for specific values and return the corresponding classification
  if (value === 494) {
      return ClassificationLabels.SILENCE; // Map 494 to "Silence"
  }

  // Default behavior: Use the value to index into the labels array
  return labels[value % labels.length];
}

// Listen for the "outputLevel" event from the backend
window.__JUCE__.backend.addEventListener("outputLevel", () => {
  fetch(Juce.getBackendResourceAddress("outputLevel.json"))
      .then((response) => response.text())
      .then((outputLevel) => {
          const levelData = JSON.parse(outputLevel);

          // Use the first value of the array
          const leftValue = Array.isArray(levelData.left) ? levelData.left[0] : levelData.left;

          console.log("Received value of 'left':", levelData.left);

          // Map the leftValue to a classification label using the helper function
          const classificationLabel = mapValueToClassification(leftValue);
          addClassification(classificationLabel);
      });
});