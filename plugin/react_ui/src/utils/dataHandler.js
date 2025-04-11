import { ClassificationIndices } from "../constants/constants.js";

// ==== Classification Data Handling ==== //
export const convertScoresToClassifications = (scores, threshold) => {
  if (!scores || scores.length === 0) {
    console.error("Invalid or empty scores array.");
    return [];
  }

  const now = Date.now();

  // Helper function to check if a score exceeds the threshold
  const isAboveThreshold = (score) => score > threshold;

  // Iterate through ClassificationIndices to find classifications above the threshold
  const classifications = Object.entries(ClassificationIndices).flatMap(([label, indices]) => {
    const highestScore = Math.max(...indices.map(index => scores[index] || 0));

    if (isAboveThreshold(highestScore)) {
      return { timestamp: now, label, value: highestScore };
    }

    return [];
  });

  console.log("Classifications above threshold:", classifications);
  return classifications;
};

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