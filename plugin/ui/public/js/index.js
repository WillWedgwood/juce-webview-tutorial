import * as Juce from "./juce/index.js";

import { ClassificationLabels } from "./constants.js";
import { setupContextMenu } from "./contextMenu.js";
import { addClassification, mapValueToClassification, convertScoresToConfidence } from "./dataHandler.js";

import { setupClassificationGraph, updateClassificationGraph } from "./classificationGraph.js";
import { setupConfidenceGraph, updateConfidenceGraph } from "./confidenceTrackingGraph.js";

// Initialize variables
const labels = Object.values(ClassificationLabels);
let removedLabels = [];
let data = [];
let confidenceData = [];
let isConfidenceTracking = false; // Initial state: Outright Classification

const width = 800;
const height = 400;
const margin = { top: 20, right: 100, bottom: 30, left: 100};

let classificationGraph = setupClassificationGraph(width, height, margin, labels);
let confidenceGraph = null; // Will be initialized when toggled

let currentGraph = classificationGraph;

// Populate the dropdown with classification labels
const dropdownMenu = document.getElementById("dropdown-menu");

labels.forEach((label) => {
  // Create a container for each checkbox and label
  const checkboxContainer = document.createElement("div");
  checkboxContainer.className = "dropdown-item";

  // Create the checkbox input
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = `checkbox-${label}`;
  checkbox.checked = !removedLabels.includes(label); // Check if the label is not in removedLabels
  checkbox.addEventListener("change", (event) => {
    if (event.target.checked) {
      // Remove the label from removedLabels
      removedLabels = removedLabels.filter((removedLabel) => removedLabel !== label);
    } else {
      // Add the label to removedLabels
      removedLabels.push(label);
    }

    // Update the graph dynamically
    if (!isConfidenceTracking) {
      updateClassificationGraph(
        classificationGraph.svg,
        classificationGraph.xScale,
        classificationGraph.yScale,
        classificationGraph.xAxis,
        classificationGraph.yAxis,
        data,
        labels,
        removedLabels
      );
    }
  });

  // Create the label for the checkbox
  const labelElement = document.createElement("label");
  labelElement.htmlFor = `checkbox-${label}`;
  labelElement.textContent = label;

  // Append the checkbox and label to the container
  checkboxContainer.appendChild(checkbox);
  checkboxContainer.appendChild(labelElement);

  // Append the container to the dropdown menu
  dropdownMenu.appendChild(checkboxContainer);
});

// Add event listener to toggle button
const toggleButton = document.getElementById("toggle-mode-btn");

toggleButton.addEventListener("click", () => {
  isConfidenceTracking = !isConfidenceTracking;

  toggleButton.textContent = isConfidenceTracking
    ? "Outright Classification"
    : "Confidence Tracking";

  currentGraph.svg.selectAll("*").remove();

  // Reinitialize the graph for the selected mode
  if (isConfidenceTracking) {
    confidenceGraph = setupConfidenceGraph(width, height, margin);
    currentGraph = confidenceGraph;
  } else {
    classificationGraph = setupClassificationGraph(width, height, margin, labels);
    currentGraph = classificationGraph;
  }
});

// Listen for the "outputLevel" event from the backend
window.__JUCE__.backend.addEventListener("outputLevel", () => {
  fetch(Juce.getBackendResourceAddress("outputLevel.json"))
    .then((response) => response.text())
    .then((outputLevel) => {
      // Parse the JSON data
      const levelData = JSON.parse(outputLevel);

      // ==== Classification Data Handling ==== //

      // Use the first value of the array
      const leftValue = Array.isArray(levelData.left) ? levelData.left[0] : levelData.left;
      //console.log("Received value of 'left':", leftValue);

      // Map the leftValue to a classification label using the helper function
      const classificationLabel = mapValueToClassification(leftValue);

      //console.log("Classification Value is:", classificationLabel);

      // Add the classification to the graph
      if (classificationLabel) {
        data = addClassification(classificationLabel, data, labels, removedLabels);
      }

      // ==== Confidence Data Handling ==== //
      const scores = levelData.scores;
      //console.log("Received value of 'scores':", scores);

      // Convert scores to confidence values
      confidenceData = convertScoresToConfidence(scores);
      //console.log("Confidence Data:", confidenceData);
    });
});

setInterval(() => {
  if (isConfidenceTracking) {
    updateConfidenceGraph(
      confidenceGraph.svg,
      confidenceGraph.xScale,
      confidenceGraph.yScale,
      confidenceGraph.xAxis,
      confidenceGraph.yAxis,
      confidenceData,
      removedLabels // Pass the removedLabels array
    );
  } else {
    updateClassificationGraph(
      classificationGraph.svg,
      classificationGraph.xScale,
      classificationGraph.yScale,
      classificationGraph.xAxis,
      classificationGraph.yAxis,
      data,
      labels,
      removedLabels
    );
  }
}, 480);