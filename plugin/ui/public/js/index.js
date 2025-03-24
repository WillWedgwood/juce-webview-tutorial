import * as Juce from "./juce/index.js";

console.log("JUCE frontend library successfully imported change");

const data = window.__JUCE__.initialisationData;

const nativeFunction = Juce.getNativeFunction("nativeFunction");

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("nativeFunctionButton");
  button.addEventListener("click", () => {
    nativeFunction("one", 2, null).then((result) => {
      console.log(result);
    });
  });


  // Plot with Plotly
  const base = -60;
  Plotly.newPlot("outputLevelPlot", {
    data: [
      {
        x: ["left"],
        y: [base],
        base: [base],
        type: "bar",
      },
    ],
    layout: { width: 200, height: 400, yaxis: { range: [-60, 500] } },
  });

  window.__JUCE__.backend.addEventListener("outputLevel", () => {
    fetch(Juce.getBackendResourceAddress("outputLevel.json"))
      .then((response) => response.text())
      .then((outputLevel) => {
        const levelData = JSON.parse(outputLevel);

          // Use the first value of the array
        const leftValue = Array.isArray(levelData.left) ? levelData.left[0] : levelData.left;

        console.log("Received value of 'left':", levelData.left);

        Plotly.animate(
          "outputLevelPlot",
          {
            data: [
              {
                y: [leftValue - base],
              },
            ],
            traces: [0],
            layout: {},
          },
          {
            transition: {
              duration: 20,
              easing: "cubic-in-out",
            },
            frame: {
              duration: 20,
            },
          }
        );
      });
  });
});
