import { DATE_RANGES, EVENT_TYPES } from "../data/datasets.js";

const FLARE_MULTIPLIERS = { A: 1e-8, B: 1e-7, C: 1e-6, M: 1e-5, X: 1e-4 };

function flareValue(classType) {
  const match = typeof classType === "string" && /^([ABCMX])(\d+(?:\.\d+)?)$/i.exec(classType.trim());
  if (!match) return null;
  const value = Number(match[2]) * FLARE_MULTIPLIERS[match[1].toUpperCase()];
  return Number.isFinite(value) ? value : null;
}

function numericValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stormValue(indices) {
  if (!Array.isArray(indices)) return null;
  const values = indices.map((index) => numericValue(index?.kpIndex))
    .filter((value) => value !== null && value >= 0 && value <= 9);
  return values.length ? Math.max(...values) : null;
}

function cmeValue(analyses) {
  if (!Array.isArray(analyses)) return null;
  const valid = analyses.filter((analysis) => {
    const speed = numericValue(analysis?.speed);
    return speed !== null && speed >= 0;
  });
  const analysis = valid.find((item) => item.isMostAccurate) || valid[0];
  return analysis ? analysis.speed : null;
}

export function normalizeEvents(data, type) {
  if (!Array.isArray(data)) throw new Error("NASA returned an invalid event list.");
  if (!EVENT_TYPES.some((item) => item.id === type)) throw new Error("Invalid event type.");

  return data.map((item) => {
    const id = type === "FLR" ? item?.flrID : type === "GST" ? item?.gstID : item?.activityID;
    const date = type === "FLR" ? item?.beginTime : item?.startTime;
    if (typeof id !== "string" || !id || typeof date !== "string" || !Number.isFinite(Date.parse(date))) {
      throw new Error("NASA returned an event without a valid ID or date.");
    }

    return {
      id,
      date,
      value: type === "FLR" ? flareValue(item.classType)
        : type === "GST" ? stormValue(item.allKpIndex)
          : cmeValue(item.cmeAnalyses),
    };
  }).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

export async function fetchEvents(type, range, signal) {
  if (!EVENT_TYPES.some((item) => item.id === type) || !DATE_RANGES.some((item) => item.id === range)) {
    throw new Error("Invalid event type or date range.");
  }
  const params = new URLSearchParams({ type, range });
  const response = await fetch(`/api/events?${params}`, { signal });
  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    const message = contentType.startsWith("text/plain") ? (await response.text()).trim() : "";
    throw new Error(message || `Unable to load NASA events (HTTP ${response.status}).`);
  }
  return normalizeEvents(await response.json(), type);
}
