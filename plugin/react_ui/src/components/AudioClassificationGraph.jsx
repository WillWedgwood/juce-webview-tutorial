import * as d3 from 'd3';
import { useRef, useMemo, useCallback } from 'react';
import { useD3Graph } from '../hooks/useD3Graph';
import '../styles/components/audio-classification.css';

export const AudioClassificationGraph = ({ 
  data = [], 
  labels = [], 
  removedLabels = [], 
  config = {} 
}) => {
  const svgRef = useRef();
  const fullConfig = {
    width: 800,
    height: 400,
    margin: { top: 20, right: 100, bottom: 40, left: 20 },
    circleRadius: 8,
    colorThreshold: 0.8,
    colors: { high: "red", normal: "orange" },
    timeWindow: 60000, // 1 minute
    ...config
  };

  // Filter labels
  const filteredLabels = useMemo(() => 
    labels.filter(label => !removedLabels.includes(label)), 
    [labels, removedLabels]
  );

  // Create scales
  const { xScale, yScale } = useMemo(() => {
    const now = Date.now();
    const minTime = now - fullConfig.timeWindow;

    const xScale = d3.scaleTime()
      .domain([minTime, now])
      .range([fullConfig.margin.left, fullConfig.width - fullConfig.margin.right]);

    const yScale = d3.scaleBand()
      .domain(filteredLabels)
      .range([fullConfig.margin.top, fullConfig.height - fullConfig.margin.bottom])
      .padding(0.1);

    return { xScale, yScale };
  }, [filteredLabels, fullConfig]);

  // Render logic specific to this graph type
  const renderUpdate = useCallback(({ svg, xScale, yScale, xAxisGroup, yAxisGroup }) => {
    const now = Date.now();
    const minTime = now - fullConfig.timeWindow;

    // Update scales
    xScale.domain([minTime, now]);
    yScale.domain(filteredLabels);

    // Filter data
    const filteredData = data.filter(d => 
      d.timestamp >= minTime && !removedLabels.includes(d.label)
    );

    // Update circles
    const circles = svg.selectAll("circle").data(filteredData, d => d.id);

    circles.enter()
      .append("circle")
      .attr("cx", d => xScale(d.timestamp))
      .attr("cy", d => yScale(d.label) + yScale.bandwidth() / 2)
      .attr("r", fullConfig.circleRadius)
      .attr("fill", d => d.value > fullConfig.colorThreshold 
        ? fullConfig.colors.high 
        : fullConfig.colors.normal)
      .merge(circles)
      .transition()
      .duration(200)
      .attr("cx", d => xScale(d.timestamp))
      .attr("cy", d => yScale(d.label) + yScale.bandwidth() / 2);

    circles.exit().remove();

    // Update axes
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%H:%M:%S"));
    const yAxis = d3.axisRight(yScale);

    xAxisGroup
      .attr("transform", `translate(0,${fullConfig.height - fullConfig.margin.bottom})`)
      .transition().duration(200).call(xAxis);

    yAxisGroup
      .attr("transform", `translate(${fullConfig.width - fullConfig.margin.right},0)`)
      .transition().duration(200).call(yAxis);
  }, [data, filteredLabels, removedLabels, fullConfig]);

  // Use the generic D3 hook
  useD3Graph(svgRef, {
    data,
    xScale,
    yScale,
    renderUpdate,
    config: fullConfig
  });

  return (
    <div className="audio-classification-graph">
      <h2>Audio Classification</h2>
      <svg 
        ref={svgRef} 
        width={fullConfig.width} 
        height={fullConfig.height} 
      />
    </div>
  );
};