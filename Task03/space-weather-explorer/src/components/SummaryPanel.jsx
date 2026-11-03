import { count, mean, max } from "../utils/metrics";

export default function SummaryPanel({ events, eventType }) {
  // Si no hay eventos, no mostramos nada
  if (!events || events.length === 0) return null;

  // Extraemos solo los valores numéricos para nuestras funciones matemáticas
  const values = events.map((e) => e.value);

  // Calculamos las métricas usando nuestras utilidades
  const totalEvents = count(events);
  const maxValue = max(values);
  const meanValue = mean(values);

  // Etiquetas dinámicas según el tipo de evento
  const labels = {
    FLR: { value: "Max Intensity", unit: "" },
    GST: { value: "Max Kp Index", unit: " Kp" },
    CME: { value: "Max Speed", unit: " km/s" },
  };

  const currentLabels = labels[eventType] || { value: "Max Value", unit: "" };

  return (
    <div className="summary-panel">
      <div className="summary-card">
        <h4>Total Events</h4>
        <p>{totalEvents}</p>
      </div>
      
      <div className="summary-card">
        <h4>{currentLabels.value}</h4>
        <p>{maxValue.toFixed(2)}{currentLabels.unit}</p>
      </div>
      
      <div className="summary-card">
        <h4>Average Value</h4>
        <p>{meanValue.toFixed(2)}{currentLabels.unit}</p>
      </div>
    </div>
  );
}