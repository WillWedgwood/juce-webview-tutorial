export const setupGraph = (width, height, margin, labels) => {
  const svg = d3.select("#graph")
    .attr("width", width)
    .attr("height", height);

  if (svg.empty()) {
    console.error("SVG element not found!");
  }

  const xScale = d3.scaleTime()
    .domain([Date.now() - 60000, Date.now()])
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleBand()
    .domain(labels)
    .range([height - margin.bottom, margin.top])
    .padding(0.3);

  const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%H:%M:%S"));
  const yAxis = d3.axisRight(yScale);

  const xAxisGroup = svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);

  const yAxisGroup = svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${width - margin.right},0)`)
    .call(yAxis);

  return { svg, xScale, yScale, xAxis, yAxis, xAxisGroup, yAxisGroup };
};