import { useEffect, useState } from 'react';
import { AudioClassificationGraph } from './components/AudioClassificationGraph';
import { ConfidenceTrackingGraph } from './components/ConfidenceTrackingGraph';
import { ClassificationLabels } from './constants/constants';
import { LabelDropdown } from './components/LabelDropdown';
import { convertScoresToClassifications, convertScoresToConfidence } from './utils/dataHandler';
import ThresholdSlider from './components/ThresholdSlider';
import * as Juce from "./juce/index.js";
import './styles/App.css';

function App() {
  // ----------------------------
  // State Management
  // ----------------------------
  const [classifications, setClassifications] = useState([]);        // Classification data points
  const [confidenceData, setConfidenceData] = useState([]);          // Confidence tracking data
  const [removedLabels, setRemovedLabels] = useState([]);            // Labels to hide from graphs
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [threshold, setThreshold] = useState(0.5);                   // Classification threshold
  const [graphType, setGraphType] = useState('confidence');          // Active graph view type
  
  // Available classification labels
  const labels = Object.values(ClassificationLabels);

  // ----------------------------
  // Data Processing & Connection
  // ----------------------------
  useEffect(() => {
    let isMounted = true;
    let juceEventListener = null;

    // Handle incoming YAMNet data
    const handleYamnetData = async () => {
      try {
        const response = await fetch(Juce.getBackendResourceAddress("yamnetOut.json"));
        if (!response.ok) throw new Error('Network response was not ok');
        
        const yamnetOut = await response.text();
        const yamnetOutput = JSON.parse(yamnetOut);
        const currentTime = Date.now();

        // Process classification data with current threshold
        const newClassifications = convertScoresToClassifications(yamnetOutput.scores, threshold)
          .map(({ label, value }) => ({
            id: `${currentTime}-${label}`,
            timestamp: currentTime,
            label,
            value
          }));

        // Update confidence tracking data with 60-second window
        setConfidenceData(prevConfidenceData =>
          convertScoresToConfidence(yamnetOutput.scores, prevConfidenceData, 60000)
        );

        if (isMounted) {
          // Update classifications with 60-second window
          setClassifications(prev => [
            ...prev.filter(d => d.timestamp >= currentTime - 60000),
            ...newClassifications
          ]);
          setConnectionStatus('connected');
        }
      } catch (error) {
        console.error("Data processing error:", error);
        if (isMounted) setConnectionStatus('disconnected');
      }
    };

    // Initialize JUCE connection
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

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(connectionTimeout);
      if (juceEventListener && window.__JUCE__?.backend) {
        window.__JUCE__.backend.removeEventListener("yamnetOut", juceEventListener);
      }
    };
  }, [threshold]);

  // ----------------------------
  // UI Components
  // ----------------------------
  return (
    <div className="app-container">
      {/* Header Section */}
      <h1>Live Audio Classification</h1>
      <div className={`connection-status ${connectionStatus}`}>
        Status: {connectionStatus.toUpperCase()}
      </div>
  
      {/* Combined Graph Controls Section */}
      <div className="graph-controls-section">
        {/* Enabled Classifications (Left) */}
        <div className="enabled-classifications">
          <LabelDropdown 
            labels={labels} 
            removedLabels={removedLabels} 
            setRemovedLabels={setRemovedLabels} 
          />
        </div>
  
        {/* Graph View Controls (Right) */}
        <div className="graph-view-controls">
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
      </div>
  
      {/* Main Graph Area */}
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
    </div>
  );
}

export default App;