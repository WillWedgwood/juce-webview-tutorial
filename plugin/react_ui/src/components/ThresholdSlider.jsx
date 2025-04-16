import React from 'react';
import '../styles/components/threshold-slider.css'; // Import the CSS file

const ThresholdSlider = ({ threshold, setThreshold }) => {
  return (
    <div className="threshold-slider">
      <label htmlFor="threshold" className="block text-sm font-medium text-gray-700">
        Threshold: <span className="font-bold">{threshold.toFixed(2)}</span>
      </label>
      <input
        id="threshold"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={threshold}
        onChange={(e) => setThreshold(parseFloat(e.target.value))}
        className="slider mt-2 w-full"
      />
    </div>
  );
};

export default ThresholdSlider;