import { useEffect, useState } from 'react';
import { AudioClassificationGraph } from './components/AudioClassificationGraph';
import { ClassificationLabels } from './constants/constants';
import { LabelDropdown } from './components/LabelDropdown';
import { convertScoresToClassifications } from './utils/dataHandler';
import * as Juce from "./juce/index.js"; // This imports all named exports
import './styles/App.css';

function App() {
  const [data, setData] = useState([]);
  const [removedLabels, setRemovedLabels] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const labels = Object.values(ClassificationLabels);

  useEffect(() => {
    let isMounted = true;
    let juceEventListener = null;

    const handleYamnetData = async () => {
      try {
        // Use the imported Juce.getBackendResourceAddress instead of window.Juce
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

    // Start with a small timeout to ensure JUCE is loaded
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

      <LabelDropdown 
        labels={labels} 
        removedLabels={removedLabels} 
        setRemovedLabels={setRemovedLabels} 
      />

      <AudioClassificationGraph 
        data={data} 
        labels={labels} 
        removedLabels={removedLabels} 
        config={{
          colors: { 
            high: "#ff0000", 
            normal: "#ffa500",
            disconnected: "#888888" // Gray when disconnected
          },
          circleRadius: 8,
          width: 900,
          height: 500,
          connectionStatus // Pass status to graph
        }}
      />
    </div>
  );
}

export default App;