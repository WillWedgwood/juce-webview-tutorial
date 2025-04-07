export const ClassificationLabels = {
  RAIN: "Rain",
  WIND: "Wind",
  CROWD: "Crowd",
  SPEECH: "Speech",
  SHOUT: "Shout",
  MUSIC: "Music (Tannoy)",
  SILENCE: "Silence",
  ECHO: "Echo",
  STATIC: "Static",
  DISTORTION: "Distortion",
  WHITE_NOISE: "White Noise",
  PINK_NOISE: "Pink Noise",
  SINE_WAVE: "Sine Wave",
  HUM: "Hum"
};

export const ClassificationIndices = {
  [ClassificationLabels.RAIN]: [282, 283, 284, 285, 286, 438, 439, 442, 443, 444, 445, 446],
  [ClassificationLabels.WIND]: [36, 40, 190, 277, 278, 279, 453],
  [ClassificationLabels.CROWD]: [27, 61, 62, 64],
  [ClassificationLabels.SPEECH]: [0, 1, 2, 3, 4],
  [ClassificationLabels.SHOUT]: [6, 7, 9, 11],
  [ClassificationLabels.MUSIC]: [132],
  [ClassificationLabels.SILENCE]: [494],
  [ClassificationLabels.ECHO]: [506],
  [ClassificationLabels.STATIC]: [509],
  [ClassificationLabels.DISTORTION]: [511],
  [ClassificationLabels.WHITE_NOISE]: [514],
  [ClassificationLabels.PINK_NOISE]: [515],
  [ClassificationLabels.SINE_WAVE]: [495],
  [ClassificationLabels.HUM]: [510]
};

export const ColourPalette = {
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
  green: "rgb(0, 149, 55)",
};