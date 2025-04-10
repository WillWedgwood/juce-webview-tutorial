import { useRef } from 'react';
import { useAudioClassificationGraph } from '../../hooks/useD3Graph';
import '../../styles/graphs/classification.css';

export const AudioClassificationGraph = ({ 
  data, 
  labels, 
  removedLabels, 
  config 
}) => {
  const svgRef = useRef();
  
  useAudioClassificationGraph(svgRef, {
    data,
    labels,
    removedLabels,
    config
  });

  return (
    <div className="audio-classification-graph">
      <h2>Audio Classification</h2>
      <svg 
        ref={svgRef} 
        width={config?.width || 800} 
        height={config?.height || 400} 
      />
    </div>
  );
};