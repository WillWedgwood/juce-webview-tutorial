import { useEffect, useState } from 'react';
import { AudioClassificationGraph } from './components/AudioClassificationGraph';
import { ClassificationLabels } from './constants/constants';
import './styles/App.css';

function App() {
  const [data, setData] = useState([]);

  const labels = Object.values(ClassificationLabels);
  const removedLabels = [];

  useEffect(() => {
    const interval = setInterval(() => {
      const randomLabel = labels[Math.floor(Math.random() * labels.length)];
      setData(prev => {
        // Keep only the last 100 data points for better performance
        const newData = [
          ...prev,
          {
            id: Date.now(),
            timestamp: Date.now(),
            label: randomLabel,
            value: Math.random()
          }
        ];
        return newData.slice(-100); // Limit to 100 data points
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <h1>Live Audio Classification</h1>
      <AudioClassificationGraph 
        data={data} 
        labels={labels} 
        removedLabels={removedLabels} 
        config={{
          colors: { high: "#ff0000", normal: "#ffa500" },
          circleRadius: 8,
          width: 900,
          height: 500
        }}
      />
    </div>
  );
}

export default App;