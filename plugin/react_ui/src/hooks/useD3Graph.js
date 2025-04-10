import * as d3 from 'd3';
import { useRef, useEffect } from 'react';

export const useD3Graph = (svgRef, { 
  data, 
  xScale, 
  yScale, 
  renderUpdate,
  config = {}
}) => {
  const animationRef = useRef();
  const elementsRef = useRef({});

  // Initialize graph
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    
    // Store scales
    elementsRef.current.xScale = xScale;
    elementsRef.current.yScale = yScale;
    
    // Create axis groups if they don't exist
    if (!elementsRef.current.xAxisGroup) {
      elementsRef.current.xAxisGroup = svg.append("g")
        .attr("class", "d3-x-axis");
    }
    if (!elementsRef.current.yAxisGroup) {
      elementsRef.current.yAxisGroup = svg.append("g")
        .attr("class", "d3-y-axis");
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [svgRef, xScale, yScale]);

  // Update graph
  useEffect(() => {
    const update = () => {
      if (!elementsRef.current.xScale || !elementsRef.current.yScale) return;
      
      // Let the component handle the specific rendering
      renderUpdate({
        svg: d3.select(svgRef.current),
        xScale: elementsRef.current.xScale,
        yScale: elementsRef.current.yScale,
        xAxisGroup: elementsRef.current.xAxisGroup,
        yAxisGroup: elementsRef.current.yAxisGroup,
        config
      });

      animationRef.current = requestAnimationFrame(update);
    };

    animationRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationRef.current);
  }, [svgRef, data, renderUpdate, config]);
};