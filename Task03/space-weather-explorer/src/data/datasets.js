// src/data/datasets.js
// Static definitions for the Space Weather Explorer.
// Mirrors the role of cities.js in the class 3 example.

export const EVENT_TYPES = [
  {
    id: "FLR",
    label: "Solar Flares",
    description: "Solar flares (C, M, X classes) from NASA DONKI",
  },
  {
    id: "GST",
    label: "Geomagnetic Storms",
    description: "Geomagnetic storms (Kp index) from NASA DONKI",
  },
  {
    id: "CME",
    label: "Coronal Mass Ejections",
    description: "CMEs (speed, direction) from NASA DONKI",
  },
];

export const DATE_RANGES = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
  { id: "1y", label: "Last year", days: 365 },
];

// Helper: compute startDate string (YYYY-MM-DD) for a given range id.
export function rangeToStartDate(rangeId) {
  const range = DATE_RANGES.find((r) => r.id === rangeId);
  const days = range ? range.days : 30;
  const start = new Date();
  start.setDate(start.getDate() - days);
  return start.toISOString().slice(0, 10);
}