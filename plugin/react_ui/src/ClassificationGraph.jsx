import * as d3 from "d3";
import { useRef, useEffect, useMemo } from "react";

const margin = { top: 20, right: 100, bottom: 40, left: 20 };
const width = 800;
const height = 400;

export default function ClassificationGraph({ data, labels, removedLabels }) {
  const svgRef = useRef();
  const axesRef = useRef({});
  const animationRef = useRef();

  const filteredLabels = useMemo(() => 
    labels.filter(label => !removedLabels.includes(label)), 
    [labels, removedLabels]
  );

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    
    // Initialize scales
    const now = Date.now();
    const xScale = d3.scaleTime()
      .domain([now - 60000, now])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleBand()
      .domain(filteredLabels)
      .range([margin.top, height - margin.bottom])
      .padding(0.1);

    // Create axis groups if they don't exist
    if (!axesRef.current.xAxisGroup) {
      axesRef.current.xAxisGroup = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height - margin.bottom})`);
    }

    if (!axesRef.current.yAxisGroup) {
      axesRef.current.yAxisGroup = svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${width - margin.right},0)`);
      
      axesRef.current.yAxisGroup.selectAll("text")
        .style("text-anchor", "start")
        .attr("dx", "0.5em");
    }

    // Store scales and axes in ref
    axesRef.current.xScale = xScale;
    axesRef.current.yScale = yScale;
    axesRef.current.xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%H:%M:%S"));
    axesRef.current.yAxis = d3.axisRight(yScale);

    // Initial axis render
    axesRef.current.xAxisGroup.call(axesRef.current.xAxis);
    axesRef.current.yAxisGroup.call(axesRef.current.yAxis);

    return () => {
      // Clean up animation frame on unmount
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [filteredLabels]);

  useEffect(() => {
    const update = () => {
      if (!axesRef.current.xScale || !axesRef.current.yScale) return;

      const now = Date.now();
      axesRef.current.xScale.domain([now - 60000, now]);
      axesRef.current.yScale.domain(filteredLabels);

      // Update axes
      axesRef.current.xAxisGroup.transition().duration(200).call(axesRef.current.xAxis);
      axesRef.current.yAxisGroup.transition().duration(200).call(axesRef.current.yAxis);

      // Filter data
      const filteredData = data.filter(d => !removedLabels.includes(d.label));

      // Update circles
      const circles = svgRef.current 
        ? d3.select(svgRef.current).selectAll("circle").data(filteredData, d => d.id)
        : null;

      if (circles) {
        circles.enter()
          .append("circle")
          .attr("cx", d => axesRef.current.xScale(d.timestamp))
          .attr("cy", d => axesRef.current.yScale(d.label) + axesRef.current.yScale.bandwidth() / 2)
          .attr("r", 8)
          .attr("fill", d => d.value > 0.8 ? "red" : "orange")
          .merge(circles)
          .transition()
          .duration(200)
          .attr("cx", d => axesRef.current.xScale(d.timestamp))
          .attr("cy", d => axesRef.current.yScale(d.label) + axesRef.current.yScale.bandwidth() / 2);

        circles.exit().remove();
      }

      // Request next animation frame
      animationRef.current = requestAnimationFrame(update);
    };

    // Start the animation loop
    animationRef.current = requestAnimationFrame(update);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, filteredLabels, removedLabels]);

  return (
    <div className="rounded-xl shadow-md bg-slate-800 p-4">
      <h2 className="text-white text-xl font-semibold mb-2">Audio Classification</h2>
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
}