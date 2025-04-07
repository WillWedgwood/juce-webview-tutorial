import { ClassificationLabels, ClassificationIndices } from "./constants.js";

// ==== Classification Data Handling ==== //
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
  console.log("Received value:", value);

  // Iterate through the ClassificationIndices to find a match
  for (const [label, indices] of Object.entries(ClassificationIndices)) {
    if (indices.includes(value)) {
      console.log(`Mapping value ${value} to ${label}`);
      return label;
    }
  }

  // If no match, return null
  console.log(`Value ${value} does not match any classification.`);
  return null;
}

// ==== Confidence Tracking Mode ==== //
// Store historical confidence data (global variable)
let confidenceHistory = [];

export const convertScoresToConfidence = (scores) => {
  if (!scores || scores.length === 0) {
    console.error("Invalid or empty scores array.");
    return [];
  }

  const now = Date.now();

  const getHighestScore = (indices) => Math.max(...indices.map(index => scores[index] || 0));
  const clampValue = (value) => Math.max(0, Math.min(1, value));
  const roundValue = (value) => parseFloat(value.toFixed(3)); // Round to 3 decimal places

  const newConfidenceData = Object.entries(ClassificationIndices).map(([label, indices]) => ({
    timestamp: now,
    label,
    value: roundValue(clampValue(getHighestScore(indices)))
  }));

  // Append new data to history
  confidenceHistory.push(...newConfidenceData);

  // Filter history to keep only the last 60 seconds
  confidenceHistory = confidenceHistory.filter(d => d.timestamp > now - 60000);

  console.log("Updated Confidence History:", confidenceHistory);

  return confidenceHistory;
};