import React from 'react';
import '../styles/components/threshold-slider.css';

const ThresholdSlider = ({ threshold, setThreshold, vertical = false }) => {
  return (
    <div className={`threshold-slider ${vertical ? 'vertical' : ''}`}>
      <label>
        Threshold: <span className="value">{threshold.toFixed(2)}</span>
      </label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={threshold}
        onChange={(e) => setThreshold(parseFloat(e.target.value))}
        className="slider"
        orient={vertical ? "vertical" : "horizontal"}
      />
    </div>
  );
};

export default ThresholdSlider;