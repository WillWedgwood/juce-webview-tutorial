import { ClassificationLabels } from "./constants.js";


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
    // Define the classification mappings
    const windNoiseIndices = new Set([36, 40, 190, 277, 278, 279, 453]);
    const rainNoiseIndices = new Set([282, 283, 284, 285, 286, 438, 439, 442, 443, 444, 445, 446]);
    const speechIndices = new Set([0, 1, 2, 3, 4]);
    const shoutIndices = new Set([6, 7, 9, 11]);
    const crowdIndices = new Set([27, 61, 62, 64]);
    const musicIndices = new Set([132]);
    const signalNoiseMap = new Map([
      [494, ClassificationLabels.SILENCE],    // Silence detected
      [506, ClassificationLabels.ECHO],       // Echo detected
      [509, ClassificationLabels.STATIC],     // Static detected
      [511, ClassificationLabels.DISTORTION], // Distortion detected
      [514, ClassificationLabels.WHITE_NOISE], // White noise detected
      [515, ClassificationLabels.PINK_NOISE],  // Pink noise detected
      [495, ClassificationLabels.SINE_WAVE],  // Sine wave detected
      [510, ClassificationLabels.HUM]  // Hum detected
    ]);

    console.log("Received value:", value);
  
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

    if (speechIndices.has(value)) {
      console.log("Mapping value to Speech")
      return ClassificationLabels.SPEECH;
    }

    if (shoutIndices.has(value)) {
      console.log("Mapping value to Shout")
      return ClassificationLabels.SHOUT;
    }

    if (crowdIndices.has(value)) {
      console.log("Mapping value to Crowd")
      return ClassificationLabels.CROWD;
    }

    if (musicIndices.has(value)) {
      console.log("Mapping value to Music (Tannoy)")
      return ClassificationLabels.MUSIC;
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

// ==== Confidence Tracking Mode ==== //
// Store historical confidence data (global variable)
let confidenceHistory = [];

export const convertScoresToConfidence = (scores) => {
  if (!scores || scores.length === 0) {
    console.error("Invalid or empty scores array.");
    return [];
  }

  const windNoiseIndices = [36, 40, 190, 277, 278, 279, 453];
  const rainNoiseIndices = [282, 283, 284, 285, 286, 438, 439, 442, 443, 444, 445, 446];
  const speechIndices = [0, 1, 2, 3, 4];
  const shoutIndices = [6, 7, 9, 11];
  const crowdIndices = [27, 61, 62, 64];
  const musicIndices = [132];
  const signalNoiseMap = new Map([
    [494, ClassificationLabels.SILENCE],
    [506, ClassificationLabels.ECHO],
    [509, ClassificationLabels.STATIC],
    [511, ClassificationLabels.DISTORTION],
    [514, ClassificationLabels.WHITE_NOISE],
    [515, ClassificationLabels.PINK_NOISE],
    [495, ClassificationLabels.SINE_WAVE],  // Sine wave detected
    [510, ClassificationLabels.HUM]  // Hum detected
  ]);

  // Log the index of the maximum score
  const maxIndex = scores.reduce((maxIdx, score, idx) => (score > scores[maxIdx] ? idx : maxIdx), 0);
  console.log("Max index of scores:", maxIndex, "with value:", scores[maxIndex]);

  const getHighestScore = (indices) => Math.max(...indices.map(index => scores[index] || 0));
  const clampValue = (value) => Math.max(0, Math.min(1, value));
  const roundValue = (value) => parseFloat(value.toFixed(3)); // Round to 3 decimal places

  const now = Date.now();

  const newConfidenceData = [
    { timestamp: now, label: ClassificationLabels.WIND, value: roundValue(clampValue(getHighestScore(windNoiseIndices))) },
    { timestamp: now, label: ClassificationLabels.RAIN, value: roundValue(clampValue(getHighestScore(rainNoiseIndices))) },
    { timestamp: now, label: ClassificationLabels.SPEECH, value: roundValue(clampValue(getHighestScore(speechIndices))) },
    { timestamp: now, label: ClassificationLabels.SHOUT, value: roundValue(clampValue(getHighestScore(shoutIndices))) },
    { timestamp: now, label: ClassificationLabels.CROWD, value: roundValue(clampValue(getHighestScore(crowdIndices))) },
    { timestamp: now, label: ClassificationLabels.MUSIC, value: roundValue(clampValue(getHighestScore(musicIndices))) },
    ...Array.from(signalNoiseMap, ([index, label]) => ({
      timestamp: now,
      label,
      value: roundValue(clampValue(scores[index] || 0))
    }))
  ];

  // Append new data to history
  confidenceHistory.push(...newConfidenceData);

  // Filter history to keep only the last 60 seconds
  confidenceHistory = confidenceHistory.filter(d => d.timestamp > now - 60000);

  console.log("Updated Confidence History:", confidenceHistory);

  return confidenceHistory;
};