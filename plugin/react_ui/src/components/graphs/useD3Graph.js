import * as d3 from "d3";
import { useRef, useEffect, useMemo } from "react";

// Default configuration
const defaultConfig = {
  width: 800,
  height: 400,
  margin: { top: 20, right: 100, bottom: 40, left: 20 },
  xDomain: [Date.now() - 60000, Date.now()], // 1 minute window
  yPadding: 0.1,
  circleRadius: 8,
  colorThreshold: 0.8,
  colors: { high: "red", normal: "orange" }
};

export function useD3Graph(svgRef, { data = [], labels = [], removedLabels = [], config = {} }) {
  const fullConfig = { ...defaultConfig, ...config };
  const axesRef = useRef({});
  const animationRef = useRef();

  const filteredLabels = useMemo(() => 
    (labels || []).filter(label => !removedLabels.includes(label)), 
    [labels, removedLabels]
  );

  // Initialize graph
  useEffect(() => {
    const svg = d3.select(svgRef.current);

    const now = Date.now();
    const timeWindow = 60000; // 1 minute in ms
    const minTime = now - timeWindow;

    const xScale = d3.scaleTime()
      .domain([minTime, now])
      .range([fullConfig.margin.left, fullConfig.width - fullConfig.margin.right]);

    const yScale = d3.scaleBand()
      .domain(filteredLabels)
      .range([fullConfig.margin.top, fullConfig.height - fullConfig.margin.bottom])
      .padding(fullConfig.yPadding);

    // Create/memoize axis groups
    if (!axesRef.current.xAxisGroup) {
      axesRef.current.xAxisGroup = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${fullConfig.height - fullConfig.margin.bottom})`);
    }

    if (!axesRef.current.yAxisGroup) {
      axesRef.current.yAxisGroup = svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${fullConfig.width - fullConfig.margin.right},0)`);
    }

    // Store scales and axes
    axesRef.current.xScale = xScale;
    axesRef.current.yScale = yScale;
    axesRef.current.xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%H:%M:%S"));
    axesRef.current.yAxis = d3.axisRight(yScale);

    // Initial render
    axesRef.current.xAxisGroup.call(axesRef.current.xAxis);
    axesRef.current.yAxisGroup.call(axesRef.current.yAxis);

    return () => cancelAnimationFrame(animationRef.current);
  }, [svgRef, filteredLabels, fullConfig]);

  // Update the graph update function
useEffect(() => {
  const update = () => {
    if (!axesRef.current.xScale || !axesRef.current.yScale) return;

    const now = Date.now();
    const timeWindow = 60000; // 1 minute window
    const minTime = now - timeWindow;

    // Update scales
    axesRef.current.xScale.domain([minTime, now]);
    axesRef.current.yScale.domain(filteredLabels);

    // Filter data to only include points within time window AND not removed
    const filteredData = (data || []).filter(d => 
      d && 
      d.timestamp >= minTime && 
      !removedLabels.includes(d.label)
    );

    // Update circles
    const circles = d3.select(svgRef.current)
      .selectAll("circle")
      .data(filteredData, d => d.id);

    circles.enter()
      .append("circle")
      .attr("cx", d => axesRef.current.xScale(d.timestamp))
      .attr("cy", d => axesRef.current.yScale(d.label) + axesRef.current.yScale.bandwidth() / 2)
      .attr("r", fullConfig.circleRadius)
      .attr("fill", d => d.value > fullConfig.colorThreshold 
        ? fullConfig.colors.high 
        : fullConfig.colors.normal)
      .merge(circles)
      .transition()
      .duration(200)
      .attr("cx", d => axesRef.current.xScale(d.timestamp))
      .attr("cy", d => axesRef.current.yScale(d.label) + axesRef.current.yScale.bandwidth() / 2);

    circles.exit().remove();

    // Update axes
    axesRef.current.xAxisGroup.transition().duration(200).call(axesRef.current.xAxis);
    axesRef.current.yAxisGroup.transition().duration(200).call(axesRef.current.yAxis);

    animationRef.current = requestAnimationFrame(update);
  };

  animationRef.current = requestAnimationFrame(update);
  return () => cancelAnimationFrame(animationRef.current);
}, [svgRef, data, filteredLabels, removedLabels, fullConfig]);
}