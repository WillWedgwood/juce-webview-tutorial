import * as d3 from 'd3';
import { useRef, useMemo, useCallback } from 'react';
import { useD3Graph } from '../hooks/useD3Graph';
import '../styles/components/graph-base.css';

// Persistent color map outside component to maintain color consistency
const colorMap = new Map();

export const ConfidenceTrackingGraph = ({ 
  data = [], 
  labels = [], 
  removedLabels = [], 
  config = {} 
}) => {
  const svgRef = useRef();
  const fullConfig = {
    width: 800,
    height: 400,
    margin: { top: 20, right: 100, bottom: 40, left: 100 },
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

    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([fullConfig.height - fullConfig.margin.bottom, fullConfig.margin.top]);

    return { xScale, yScale };
  }, [filteredLabels, fullConfig]);

  // Render logic specific to this graph type
  const renderUpdate = useCallback(({ svg, xScale, yScale, xAxisGroup, yAxisGroup }) => {
    const now = Date.now();
    const minTime = now - fullConfig.timeWindow;

    // Update scales
    xScale.domain([minTime, now]);
    yScale.domain([0, 1]);

    // Filter data
    const filteredData = data.filter(d => 
      d.timestamp >= minTime && !removedLabels.includes(d.label)
    );

    // Group data by label
    const groupedData = d3.group(filteredData, d => d.label);

    // Ensure color consistency
    const allLabels = Array.from(new Set([...colorMap.keys(), ...groupedData.keys()]));
    const colorScale = d3.scaleOrdinal()
      .domain(allLabels)
      .range(d3.schemeCategory10);

    // Assign colors to labels persistently
    allLabels.forEach(label => {
      if (!colorMap.has(label)) {
        colorMap.set(label, colorScale(label));
      }
    });

    // ==== Update Lines ====
    const lines = svg.selectAll(".line")
      .data(Array.from(groupedData), ([label]) => label);

    // Enter + Update lines
    lines.enter()
      .append("path")
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", ([label]) => colorMap.get(label))
      .attr("stroke-width", 2)
      .merge(lines)
      .attr("transform", null)
      .attr("d", ([, values]) =>
        d3.line()
          .x(d => xScale(d.timestamp))
          .y(d => yScale(d.value))
          (values)
      );

    lines.exit().remove();

    // ==== Update Legend ====
    let legendGroup = svg.select(".legend");
    if (legendGroup.empty()) {
      legendGroup = svg.append("g").attr("class", "legend");
    }

    // Bind filtered labels to legend items
    const legendItems = legendGroup.selectAll(".legend-item")
      .data(Array.from(groupedData.keys()), d => d);

    // Enter: Add new legend items
    const legendEnter = legendItems.enter()
      .append("g")
      .attr("class", "legend-item");

    legendEnter.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", d => colorScale(d));

    legendEnter.append("text")
      .attr("x", 18)
      .attr("y", 10)
      .style("font-size", "10px")
      .style("fill", "white")
      .text(d => d);

    // Update: Position and style legend items
    legendItems.merge(legendEnter)
      .transition()
      .duration(200)
      .attr("transform", (d, i) => `translate(${xScale.range()[0] - 80}, ${20 + i * 20})`);

    legendItems.merge(legendEnter).select("rect")
      .attr("fill", d => colorScale(d));

    legendItems.merge(legendEnter).select("text")
      .text(d => d);

    // Exit: Remove old legend items
    legendItems.exit().remove();

    // Update axes
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%H:%M:%S"));
    const yAxis = d3.axisRight(yScale).ticks(5).tickFormat(d3.format(".1f"));

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
    <div className="confidence-tracking-graph">
      <h2>Confidence Tracking</h2>
      <svg 
        ref={svgRef} 
        width={fullConfig.width} 
        height={fullConfig.height} 
      />
    </div>
  );
};