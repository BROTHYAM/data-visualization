import test from "node:test";
import assert from "node:assert/strict";
import { fetchEvents, normalizeEvents } from "./api.js";

test("normalizes flare classes as peak flux and keeps missing measurements", () => {
  const events = normalizeEvents([
    { flrID: "second", beginTime: "2026-01-02T00:00Z", classType: null },
    { flrID: "first", beginTime: "2026-01-01T00:00Z", classType: "M1.2" },
  ], "FLR");
  assert.deepEqual(events.map((event) => event.id), ["first", "second"]);
  assert.ok(Math.abs(events[0].value - 1.2e-5) < 1e-12);
  assert.equal(events[1].value, null);
});

test("normalizes storm Kp indices and CME speeds", () => {
  const storms = normalizeEvents([
    { gstID: "storm", startTime: "2026-01-01T00:00Z", allKpIndex: [{ kpIndex: 5 }, { kpIndex: 7 }] },
    { gstID: "missing", startTime: "2026-01-02T00:00Z", allKpIndex: null },
  ], "GST");
  assert.deepEqual(storms.map((event) => event.value), [7, null]);

  const cmes = normalizeEvents([
    { activityID: "cme", startTime: "2026-01-01T00:00Z", cmeAnalyses: [
      { speed: 500, isMostAccurate: false }, { speed: 800, isMostAccurate: true },
    ] },
    { activityID: "missing", startTime: "2026-01-02T00:00Z", cmeAnalyses: [] },
  ], "CME");
  assert.deepEqual(cmes.map((event) => event.value), [800, null]);
});

test("rejects malformed NASA events", () => {
  assert.throws(() => normalizeEvents({}, "FLR"), /invalid event list/);
  assert.throws(() => normalizeEvents([{ flrID: "a", beginTime: "invalid" }], "FLR"), /valid ID or date/);
  assert.throws(() => normalizeEvents([], "unknown"), /Invalid event type/);
});

test("fetches events from the local proxy and surfaces errors", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      assert.equal(url, "/api/events?type=FLR&range=7d");
      return new Response(JSON.stringify([{ flrID: "a", beginTime: "2026-01-01T00:00Z", classType: "C1.0" }]));
    };
    assert.equal((await fetchEvents("FLR", "7d"))[0].value, 1e-6);
    globalThis.fetch = async () => new Response("NASA API key is not configured on the server.", { status: 503 });
    await assert.rejects(fetchEvents("FLR", "7d"), /NASA API key is not configured/);
    await assert.rejects(fetchEvents("FLR", "invalid"), /Invalid event type or date range/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
