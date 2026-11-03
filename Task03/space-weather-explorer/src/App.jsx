import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { fetchEvents } from './api/api';
import { EVENT_TYPES } from './data/datasets';
import TimelineChart from './components/TimelineChart';
import SummaryPanel from './components/SummaryPanel';
import FrequencyChart from './components/FrequencyChart';
import '../../../shared/header.js';
import './App.css';

export default function App() {
  const [eventType, setEventType] = useState('FLR'); // Solar Flares por defecto
  const [range, setRange] = useState('30d');         // 30 días por defecto
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // useEffect se dispara cuando cambia el tipo de evento o el rango
  useEffect(() => {
    // 1. Creamos el AbortController para cancelar peticiones viejas
    const controller = new AbortController();
    const signal = controller.signal;

    async function loadData() {
      setLoading(true);
      setError(null);
      
      try {
        // 2. Llamamos a la API pasando la señal
        const data = await fetchEvents(eventType, range, signal);
        setEvents(data);
      } catch (err) {
        // Ignoramos el error si fue porque abortamos la petición a propósito
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        // Si no fue abortado, quitamos el loading
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadData();

    // 3. Función de limpieza: si el usuario cambia de opción, abortamos la petición anterior
    return () => {
      controller.abort();
    };
  }, [eventType, range]); // Dependencias

  return (
    <>
      <assignment-header><a href="/">Back to main menu</a></assignment-header>
      <div className="app-container">
        <Sidebar 
          eventType={eventType} 
          range={range} 
          onEventTypeChange={setEventType} 
          onRangeChange={setRange} 
        />
        <main className="dashboard">
          <header>
            <h1>{EVENT_TYPES.find(t => t.id === eventType)?.label}</h1>
            <p>Showing data for the {range}</p>
          </header>

          {loading && <div className="status">Loading data...</div>}
          {error && <div className="status error">Error: {error}</div>}
          
          {!loading && !error && (
            <div className="charts-area">
              {/* Panel de resumen con las métricas computacionales */}
              <SummaryPanel events={events} eventType={eventType} />
            
              {/* Gráfico de dispersión D3 */}
              <TimelineChart events={events} eventType={eventType} />
            
              {/* Nuevo gráfico de barras */}
              <FrequencyChart events={events} eventType={eventType} />
            </div>
          )}
        </main>
      </div>
    </>
  );
}