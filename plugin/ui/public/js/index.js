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
//let confidenceGraph = setupConfidenceGraph(width, height, margin);
let confidenceGraph = null; // Will be initialized when toggled

let currentGraph = classificationGraph;

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
    updateConfidenceGraph(confidenceGraph.svg, confidenceGraph.xScale, confidenceGraph.yScale, confidenceGraph.xAxis, confidenceGraph.yAxis, confidenceData);
  } else {
    updateClassificationGraph(classificationGraph.svg, classificationGraph.xScale, classificationGraph.yScale, classificationGraph.xAxis, classificationGraph.yAxis, data, labels, removedLabels);
  }
}, 480);