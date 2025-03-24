import * as Juce from "./juce/index.js";

console.log("JUCE frontend library successfully imported change");

window.__JUCE__.backend.addEventListener(
  "exampleEvent",
  (objectFromBackend) => {
    console.log(objectFromBackend);
  }
);

const data = window.__JUCE__.initialisationData;

document.getElementById("vendor").innerText = data.vendor;
document.getElementById("pluginName").innerText = data.pluginName;
document.getElementById("pluginVersion").innerText = data.pluginVersion;

const nativeFunction = Juce.getNativeFunction("nativeFunction");

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("nativeFunctionButton");
  button.addEventListener("click", () => {
    nativeFunction("one", 2, null).then((result) => {
      console.log(result);
    });
  });

  const emitEventButton = document.getElementById("emitEventButton");
  let emittedCount = 0;
  emitEventButton.addEventListener("click", () => {
    emittedCount++;
    window.__JUCE__.backend.emitEvent("exampleJavaScriptEvent", {
      emittedCount: emittedCount,
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
