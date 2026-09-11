import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const code = readFileSync(new URL("../shared.js", import.meta.url), "utf8");
new Function(code)();
const BingAssistant = globalThis.BingAssistant;

describe("parseHourMinute", () => {
  it("parses valid hour/minute", () => {
    const r = BingAssistant.parseHourMinute(21, 30);
    expect(r.enabled).toBe(true);
    expect(r.hour).toBe(21);
    expect(r.minute).toBe(30);
  });

  it("rejects invalid hour/minute", () => {
    expect(BingAssistant.parseHourMinute(25, 0).enabled).toBe(false);
    expect(BingAssistant.parseHourMinute(0, 60).enabled).toBe(false);
    expect(BingAssistant.parseHourMinute(-1, 0).enabled).toBe(false);
    expect(BingAssistant.parseHourMinute(undefined, undefined).enabled).toBe(false);
  });
});

describe("nextScheduledTime", () => {
  it("returns today if time is in the future", () => {
    const now = new Date(2026, 0, 15, 10, 0);
    const next = BingAssistant.nextScheduledTime(21, 30, now);
    expect(next.getDate()).toBe(15);
    expect(next.getHours()).toBe(21);
  });

  it("returns tomorrow if time is in the past", () => {
    const now = new Date(2026, 0, 15, 22, 0);
    const next = BingAssistant.nextScheduledTime(21, 30, now);
    expect(next.getDate()).toBe(16);
  });
});

describe("normalizeRepeatRule", () => {
  it("returns valid rules unchanged", () => {
    expect(BingAssistant.normalizeRepeatRule("daily")).toBe("daily");
    expect(BingAssistant.normalizeRepeatRule("weekdays")).toBe("weekdays");
    expect(BingAssistant.normalizeRepeatRule("weekends")).toBe("weekends");
  });

  it("defaults invalid rules to daily", () => {
    expect(BingAssistant.normalizeRepeatRule("invalid")).toBe("daily");
    expect(BingAssistant.normalizeRepeatRule(undefined)).toBe("daily");
  });
});

describe("formatClock", () => {
  it("pads single digits", () => {
    expect(BingAssistant.formatClock(9, 5)).toBe("09:05");
    expect(BingAssistant.formatClock(21, 30)).toBe("21:30");
  });
});
