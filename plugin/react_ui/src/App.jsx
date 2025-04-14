import { useEffect, useState } from 'react';
import { AudioClassificationGraph } from './components/AudioClassificationGraph';
import { ConfidenceTrackingGraph } from './components/ConfidenceTrackingGraph'; // Import the new graph
import { ClassificationLabels } from './constants/constants';
import { LabelDropdown } from './components/LabelDropdown';
import { convertScoresToClassifications } from './utils/dataHandler';
import * as Juce from "./juce/index.js";
import './styles/App.css';

function App() {
  const [data, setData] = useState([]);
  const [removedLabels, setRemovedLabels] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
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
        
        const classifications = convertScoresToClassifications(yamnetOutput.scores, 0.5);

        if (isMounted) {
          setData(prev => [
            ...prev.slice(-99),
            ...classifications.map(({ label, value }) => ({
              id: Date.now(),
              timestamp: Date.now(),
              label,
              value
            }))
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
  }, []);

  return (
    <div className="app-container">
      <h1>Live Audio Classification TEST</h1>
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

      {graphType === 'classification' ? (
        <AudioClassificationGraph 
          data={data} 
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
          data={data} 
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
  );
}

export default App;