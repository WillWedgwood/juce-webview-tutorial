import { useRef } from 'react';
import { useD3Graph } from '../../../hooks/useD3Graph';
import './styles.css';

export const ClassificationGraph = ({ data = [], labels = [], removedLabels = [], config = {} }) => {
  const svgRef = useRef();
  
  useD3Graph(svgRef, {
    data,
    labels, 
    removedLabels,
    config
  });

  return (
    <div className="classification-graph">
      <h2>Audio Classification</h2>
      <svg 
        ref={svgRef} 
        width={config.width || 800} 
        height={config.height || 400} 
      />
    </div>
  );
};