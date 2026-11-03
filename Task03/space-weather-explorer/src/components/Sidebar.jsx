import { EVENT_TYPES, DATE_RANGES } from '../data/datasets';

export default function Sidebar({ eventType, range, onEventTypeChange, onRangeChange }) {
  return (
    <aside className="sidebar">
      <h2>Space Weather</h2>
      
      <div className="control-group">
        <label htmlFor="event-type">Event Type</label>
        <select 
          id="event-type"
          value={eventType} 
          onChange={(e) => onEventTypeChange(e.target.value)}
        >
          {EVENT_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
        <p className="help-text">
          {EVENT_TYPES.find((t) => t.id === eventType)?.description}
        </p>
      </div>

      <div className="control-group">
        <label htmlFor="date-range">Time Range</label>
        <select 
          id="date-range"
          value={range} 
          onChange={(e) => onRangeChange(e.target.value)}
        >
          {DATE_RANGES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}