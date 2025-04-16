import { useEffect, useState } from 'react';
import { AudioClassificationGraph } from './components/AudioClassificationGraph';
import { ConfidenceTrackingGraph } from './components/ConfidenceTrackingGraph';
import { ClassificationLabels } from './constants/constants';
import { LabelDropdown } from './components/LabelDropdown';
import { convertScoresToClassifications, convertScoresToConfidence } from './utils/dataHandler';
import ThresholdSlider from './components/ThresholdSlider'; // Import the ThresholdSlider component
import * as Juce from "./juce/index.js";
import './styles/App.css';

function App() {
  const [classifications, setClassifications] = useState([]); // For classification data
  const [confidenceData, setConfidenceData] = useState([]); // For confidence data
  const [removedLabels, setRemovedLabels] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [threshold, setThreshold] = useState(0.5); // Threshold for classification
  const [graphType, setGraphType] = useState('confidence'); // 'classification' or 'confidence'
  const labels = Object.values(ClassificationLabels);

  useEffect(() => {
    let isMounted = true;
    let juceEventListener = null;

    const handleYamnetData = async () => {
      try {
        const response = await fetch(Juce.getBackendResourceAddress("yamnetOut.json"));
        if (!response.ok) throw new Error('Network response was not ok');
        
        const yamnetOut = await response.text();
        const yamnetOutput = JSON.parse(yamnetOut);

        const currentTime = Date.now();

        // Process classifications
        const newClassifications = convertScoresToClassifications(yamnetOutput.scores, threshold).map(({ label, value }) => ({
          id: `${currentTime}-${label}`,
          timestamp: currentTime,
          label,
          value
        }));

        // Process confidence data
        setConfidenceData(prevConfidenceData =>
          convertScoresToConfidence(yamnetOutput.scores, prevConfidenceData, 60000) // 60-second time window
        );

        if (isMounted) {
          // Update classifications
          setClassifications(prev => [
            ...prev.filter(d => d.timestamp >= currentTime - 60000), // Keep points within the timeWindow
            ...newClassifications
          ]);

          setConnectionStatus('connected');
        }
      } catch (error) {
        console.error("Data processing error:", error);
        if (isMounted) setConnectionStatus('disconnected');
      }
    };

    const initJuceConnection = () => {
      if (window.__JUCE__?.backend) {
        try {
          juceEventListener = window.__JUCE__.backend.addEventListener(
            "yamnetOut",
            handleYamnetData
          );
          setConnectionStatus('connected');
        } catch (e) {
          console.error("JUCE event listener error:", e);
          setConnectionStatus('disconnected');
        }
      } else {
        setConnectionStatus('disconnected');
      }
    };

    const connectionTimeout = setTimeout(initJuceConnection, 300);

    return () => {
      isMounted = false;
      clearTimeout(connectionTimeout);
      if (juceEventListener && window.__JUCE__?.backend) {
        window.__JUCE__.backend.removeEventListener("yamnetOut", juceEventListener);
      }
    };
  }, [threshold]);

  return (
    <div className="app-container">
      <h1>Live Audio Classification</h1>
      <div className={`connection-status ${connectionStatus}`}>
        Status: {connectionStatus.toUpperCase()}
      </div>

      <div className="graph-controls">
        <LabelDropdown 
          labels={labels} 
          removedLabels={removedLabels} 
          setRemovedLabels={setRemovedLabels} 
        />
        
        <div className="graph-toggle">
          <button 
            className={graphType === 'classification' ? 'active' : ''}
            onClick={() => setGraphType('classification')}
          >
            Classification View
          </button>
          <button 
            className={graphType === 'confidence' ? 'active' : ''}
            onClick={() => setGraphType('confidence')}
          >
            Confidence View
          </button>
        </div>
      </div>

      <div className="graph-container">
        {/* Render the slider only for the Classification Graph */}
        {graphType === 'classification' && (
          <div className="vertical-slider-container">
            <ThresholdSlider threshold={threshold} setThreshold={setThreshold} vertical={true} />
          </div>
        )}

        {/* Render the appropriate graph */}
        {graphType === 'classification' ? (
          <AudioClassificationGraph 
            data={classifications} 
            labels={labels} 
            removedLabels={removedLabels} 
            config={{
              colors: { 
                high: "#ff0000", 
                normal: "#ffa500",
                disconnected: "#888888"
              },
              circleRadius: 8,
              width: 900,
              height: 500,
              connectionStatus
            }}
          />
        ) : (
          <ConfidenceTrackingGraph 
            data={confidenceData} 
            labels={labels} 
            removedLabels={removedLabels} 
            config={{
              width: 900,
              height: 500,
              connectionStatus
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;