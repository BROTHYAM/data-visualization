import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function TimelineChart({ events, eventType }) {
  const svgRef = useRef(null);

  useEffect(() => {
    // Si no hay eventos o el SVG no está montado, no hacemos nada
    if (!events || events.length === 0 || !svgRef.current) return;

    // 1. Configuración de dimensiones y márgenes
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // 2. Limpiar el SVG en cada re-render (patrón D3)
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // 3. Crear el grupo principal (G) que contendrá el gráfico, respetando los márgenes
    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 4. Definir las escalas
    // X: Tiempo (fechas)
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(events, (d) => new Date(d.date)))
      .range([0, innerWidth]);

    // Y: Valor de intensidad (depende del tipo de evento)
    // Para FLR es un número, para GST es Kp, para CME es velocidad
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(events, (d) => d.value) * 1.1]) // Un 10% extra arriba
      .range([innerHeight, 0])
      .nice();

    // 5. Dibujar los ejes
    // Eje X
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%b %d")))
      .style("font-size", "12px");

    // Eje Y
    g.append("g")
      .call(d3.axisLeft(yScale))
      .style("font-size", "12px");

    // 6. Dibujar los puntos (círculos)
    // El color depende del tipo de evento
    const colorScale = {
      FLR: "#f59e0b", // Naranja (Flare)
      GST: "#ef4444", // Rojo (Storm)
      CME: "#3b82f6"  // Azul (CME)
    };

    g.selectAll("circle")
      .data(events)
      .join("circle")
      .attr("cx", (d) => xScale(new Date(d.date)))
      .attr("cy", (d) => yScale(d.value))
      .attr("r", 6)
      .attr("fill", colorScale[eventType] || "#333")
      .attr("opacity", 0.7)
      .style("cursor", "pointer")
      // Tooltip básico nativo usando el título del SVG
      .append("title")
      .text((d) => `${new Date(d.date).toLocaleDateString()}\nValue: ${d.value.toFixed(2)}`);

    // Etiqueta del eje Y
    const yLabels = { FLR: "Intensity", GST: "Kp Index", CME: "Speed (km/s)" };
    g.append("text")
      .attr("x", -innerHeight / 2)
      .attr("y", -35)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text(yLabels[eventType] || "Value");

  }, [events, eventType]); // Se vuelve a dibujar si cambian los eventos o el tipo

  return (
    <div className="chart-container">
      <h3>Event Timeline</h3>
      <svg ref={svgRef} width="100%" height="400px"></svg>
    </div>
  );
}