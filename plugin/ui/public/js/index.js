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
const svg = d3.select("#graph")
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

// Create a custom context menu container
const contextMenu = d3.select("body")
  .append("div")
  .attr("class", "context-menu")
  .style("position", "absolute")
  .style("display", "none")
  .style("background-color", "white")
  .style("border", "1px solid #ccc")
  .style("padding", "5px")
  .style("box-shadow", "0px 2px 5px rgba(0, 0, 0, 0.2)");

// Add right-click functionality to y-axis labels
yAxisGroup.selectAll(".tick text")
  .on("contextmenu", function (event, label) {
      event.preventDefault(); // Prevent the default context menu

      // Show the custom context menu
      contextMenu
          .style("display", "block")
          .style("left", `${event.pageX}px`)
          .style("top", `${event.pageY}px`)
          .html(`<div class="menu-item" data-label="${label}">Remove from plot</div>`);

      // Add click event to the menu item
      contextMenu.select(".menu-item").on("click", function () {
          const labelToRemove = d3.select(this).attr("data-label");
          console.log("Removing label:", labelToRemove);

          // Remove the label from the labels array and add it to removedLabels
          labels = labels.filter(l => l !== labelToRemove);
          removedLabels.push(labelToRemove);

          // Hide the context menu and update the graph
          contextMenu.style("display", "none");
          updateGraph();
          updateRemovedLabelsUI();
      });
  });

// Hide the context menu when clicking elsewhere
d3.select("body").on("click", () => {
  contextMenu.style("display", "none");
});

// Data storage
let data = [];

function updateGraph() {
  console.log("Updating graph..."); // ✅ Debugging: Ensure function is running

  // Update x-axis domain (shifting time window)
  xScale.domain([Date.now() - 60000, Date.now()]);
  svg.select(".x-axis").call(xAxis);

  // Update y-axis domain and redraw it
  yScale.domain(labels);
  yAxisGroup
      .attr("transform", `translate(${width - margin.right},0)`) // Ensure y-axis stays on the right
      .call(yAxis);

  // Reapply right-click functionality to updated y-axis labels
  yAxisGroup.selectAll(".tick text")
      .on("contextmenu", function (event, label) {
          event.preventDefault();
          contextMenu
              .style("display", "block")
              .style("left", `${event.pageX}px`)
              .style("top", `${event.pageY}px`)
              .html(`<div class="menu-item" data-label="${label}">Remove from plot</div>`);

          contextMenu.select(".menu-item").on("click", function () {
              const labelToRemove = d3.select(this).attr("data-label");
              console.log("Removing label:", labelToRemove);

              // Remove the label from the labels array and add it to removedLabels
              labels = labels.filter(l => l !== labelToRemove);
              removedLabels.push(labelToRemove);

              // Hide the context menu and update the graph
              contextMenu.style("display", "none");
              updateGraph();
              updateRemovedLabelsUI();
          });
      });

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
  console.log("Adding classification:", label); // ✅ Debugging
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

// Function to update the UI for removed labels
function updateRemovedLabelsUI() {
  const container = d3.select("#removed-labels");
  container.html(""); // Clear existing buttons

  removedLabels.forEach(label => {
      container.append("button")
          .text(`Add ${label} back`)
          .on("click", () => {
              console.log("Adding label back:", label);

              // Add the label back to the labels array
              labels.push(label);
              removedLabels = removedLabels.filter(l => l !== label);

              // Update the graph and UI
              updateGraph();
              updateRemovedLabelsUI();
          });
  });
}

// Add event listener for the "Add Classification" button
const addClassificationBtn = d3.select("#add-classification-btn");
const classificationDropdown = d3.select("#classification-dropdown");

addClassificationBtn.on("click", function (event) {
  // Prevent the dropdown from being hidden immediately
  event.stopPropagation();

  // Clear the dropdown content
  classificationDropdown.html("");

  // Check if there are any removed classifications
  if (removedLabels.length === 0) {
      classificationDropdown
          .style("display", "block")
          .style("left", `${addClassificationBtn.node().getBoundingClientRect().left}px`)
          .style("top", `${addClassificationBtn.node().getBoundingClientRect().bottom + window.scrollY}px`)
          .html("<div style='padding: 5px;'>All classifications are already in use</div>");
      return;
  }

  // Populate the dropdown with removed classifications
  removedLabels.forEach(label => {
      classificationDropdown
          .append("div")
          .attr("class", "dropdown-item")
          .style("padding", "5px")
          .style("cursor", "pointer")
          .style("border-bottom", "1px solid #ccc")
          .text(label)
          .on("click", () => {
              console.log("Adding label back:", label);

              // Add the label back to the labels array
              labels.push(label);
              removedLabels = removedLabels.filter(l => l !== label);

              // Update the graph and UI
              updateGraph();
              classificationDropdown.style("display", "none");
          });
  });

  // Show the dropdown
  classificationDropdown
      .style("display", "block")
      .style("left", `${addClassificationBtn.node().getBoundingClientRect().left}px`)
      .style("top", `${addClassificationBtn.node().getBoundingClientRect().bottom + window.scrollY}px`);
});

// Hide the dropdown when clicking elsewhere
d3.select("body").on("click", () => {
  classificationDropdown.style("display", "none");
});

// Function to map specific values to classification labels
function mapValueToClassification(value) {
  // Check for specific values and return the corresponding classification
  if (value === 494) {
      console.log("Mapping value 494 to Silence");
      return ClassificationLabels.SILENCE; // Map 494 to "Silence"
  }

  else {
    console.log("Mapping value 494 to Silence");
    return ClassificationLabels.WIND; // Map 494 to "Silence"
  }

  // Default behavior: Use the value to index into the labels array
  const mappedLabel = labels[value % labels.length];
  console.log(`Mapping value ${value} to ${mappedLabel}`);
  return mappedLabel;
}

// Listen for the "outputLevel" event from the backend
window.__JUCE__.backend.addEventListener("outputLevel", () => {
  fetch(Juce.getBackendResourceAddress("outputLevel.json"))
      .then((response) => response.text())
      .then((outputLevel) => {
          const levelData = JSON.parse(outputLevel);

          // Use the first value of the array
          const leftValue = Array.isArray(levelData.left) ? levelData.left[0] : levelData.left;

          console.log("Received value of 'left':", leftValue);

          // Map the leftValue to a classification label using the helper function
          const classificationLabel = mapValueToClassification(leftValue);

          console.log("Classification Value is:", leftValue);
  
          addClassification(classificationLabel);
      });
});