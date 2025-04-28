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

  // App.jsx (only modify the return section)
  return (
    <div className="app-container">
      <h1>Live Audio Classification</h1>
      <div className={`connection-status ${connectionStatus}`}>
        Status: {connectionStatus.toUpperCase()}
      </div>

      {/* View toggle buttons stay above */}
      <div className="view-toggle-container">
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

      {/* Graph area */}
      <div className="graph-area">
        {graphType === 'classification' ? (
          <div className="graph-container">
            <div className="slider-container-left">
              <ThresholdSlider 
                threshold={threshold} 
                setThreshold={setThreshold} 
                vertical={false} 
              />
            </div>
            <AudioClassificationGraph 
              data={classifications} 
              labels={labels} 
              removedLabels={removedLabels} 
              config={{/*...*/}}
            />
          </div>
        ) : (
          <div className="graph-container">
            <ConfidenceTrackingGraph 
              data={confidenceData} 
              labels={labels} 
              removedLabels={removedLabels} 
              config={{/*...*/}}
            />
          </div>
        )}
      </div>

      {/* Label dropdown moves below */}
      <div className="dropdown-container">
        <LabelDropdown 
          labels={labels} 
          removedLabels={removedLabels} 
          setRemovedLabels={setRemovedLabels} 
        />
      </div>
    </div>
  );
}

export default App;