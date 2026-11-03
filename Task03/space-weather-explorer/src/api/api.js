// src/api/api.js
// Fetch layer for the Space Weather Explorer.
// Mirrors the role of api.js in the class 3 example.
// For now, returns mock data so the UI can be built without hitting API limits.

const MOCK_DELAY_MS = 300;

// Generate a random date within the last N days.
function randomDateInLastDays(days) {
  const now = Date.now();
  const past = now - Math.floor(Math.random() * days) * 24 * 60 * 60 * 1000;
  return new Date(past).toISOString();
}

// Mock event generator.
function generateMockEvents(type, days) {
  const count = 10 + Math.floor(Math.random() * 30);
  const events = [];
  for (let i = 0; i < count; i++) {
    const date = randomDateInLastDays(days);
    if (type === "FLR") {
      events.push({
        id: `flr-${i}`,
        date,
        intensity: Math.random() < 0.7 ? "C" : Math.random() < 0.6 ? "M" : "X",
        value: Math.random() * 10,
      });
    } else if (type === "GST") {
      events.push({
        id: `gst-${i}`,
        date,
        intensity: (Math.random() * 9).toFixed(1), // Kp index
        value: Math.random() * 9,
      });
    } else if (type === "CME") {
      events.push({
        id: `cme-${i}`,
        date,
        speed: 200 + Math.random() * 1500,
        value: Math.random() * 1500,
      });
    }
  }
  return events.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Main fetch function. Signature matches the pattern from class 3:
//   fetchEvents(type, range, signal)
// Returns a promise that resolves to an array of events.
// Supports AbortSignal to cancel stale requests.
export async function fetchEvents(type, range, signal) {
  // Simulate network delay.
  await new Promise((resolve, reject) => {
    const t = setTimeout(resolve, MOCK_DELAY_MS);
    if (signal) {
      signal.addEventListener("abort", () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      });
    }
  });

  const days = parseInt(range.replace("d", "").replace("y", ""), 10) || 30;
  const finalDays = range === "1y" ? 365 : days;
  return generateMockEvents(type, finalDays);
}