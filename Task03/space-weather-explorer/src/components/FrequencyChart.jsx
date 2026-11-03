import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function FrequencyChart({ events, eventType }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!events || events.length === 0 || !svgRef.current) return;

    const width = 800;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 1. Agrupar eventos por semana
    const groupedData = d3.rollups(
      events,
      (v) => v.length,
      (d) => d3.timeWeek.floor(new Date(d.date))
    );

    // Ordenar cronológicamente
    groupedData.sort((a, b) => a[0] - b[0]);

    // 2. Escalas
    const xScale = d3
      .scaleBand()
      .domain(groupedData.map((d) => d[0]))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(groupedData, (d) => d[1]) * 1.1])
      .range([innerHeight, 0]);

    // 3. Ejes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %d")))
      .style("font-size", "12px");

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format("d")))
      .style("font-size", "12px");

    // 4. Dibujar las barras
    const colorScale = {
      FLR: "#f59e0b",
      GST: "#ef4444",
      CME: "#3b82f6"
    };

    g.selectAll("rect")
      .data(groupedData)
      .join("rect")
      .attr("x", (d) => xScale(d[0]))
      .attr("y", (d) => yScale(d[1]))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => innerHeight - yScale(d[1]))
      .attr("fill", colorScale[eventType] || "#333")
      .attr("opacity", 0.8)
      .style("cursor", "pointer")
      .append("title")
      .text((d) => `Week of ${d[0].toLocaleDateString()}\nEvents: ${d[1]}`);

    // Etiqueta Y
    g.append("text")
      .attr("x", -innerHeight / 2)
      .attr("y", -35)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Event Count");

  }, [events, eventType]);

  return (
    <div className="chart-container">
      <h3>Event Frequency per Week</h3>
      <svg ref={svgRef} width="100%" height="300px"></svg>
    </div>
  );
}