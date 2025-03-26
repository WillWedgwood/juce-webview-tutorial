import * as Juce from "./juce/index.js";


import { ClassificationLabels } from "./constants.js";
import { setupGraph } from "./graphSetup.js";
import { setupContextMenu } from "./contextMenu.js";
import { addClassification, updateGraph, mapValueToClassification } from "./dataHandler.js";

// Initialize variables
const labels = Object.values(ClassificationLabels);
let removedLabels = [];
let data = [];

const width = 800;
const height = 400;
const margin = { top: 20, right: 100, bottom: 30, left: 50 };

// Setup the graph
const { svg, xScale, yScale, xAxis, yAxis, yAxisGroup } = setupGraph(width, height, margin, labels);

// Setup the context menu
setupContextMenu(yAxisGroup, labels, removedLabels, () => updateGraph(svg, xScale, yScale, xAxis, yAxis, data, labels, removedLabels), () => {});

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

      console.log("Classification Value is:", classificationLabel);

      // Add the classification to the graph
      if (classificationLabel) {
        data = addClassification(classificationLabel, data, labels, removedLabels);

        // Update the graph
        //updateGraph(svg, xScale, yScale, xAxis, yAxis, data, labels, removedLabels);
      }
    });
});

setInterval(() => {
  updateGraph(svg, xScale, yScale, xAxis, yAxis, data, labels, removedLabels);
}, 500);