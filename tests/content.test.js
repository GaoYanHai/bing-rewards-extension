import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";

const code = readFileSync(new URL("../content.js", import.meta.url), "utf8");
// Run the actual navigation functions with browser APIs replaced by controlled fixtures.
const navigation = code.slice(code.indexOf("async function submitSearch("), code.indexOf("async function maybeHandleBusyPause("));

function fixture({ input = true, simulate = false, interrupt = false, failSave = false, pauseDuringSave = false } = {}) {
  const events = [];
  const store = { lock: "on", simulate };
  let paused = false;
  const element = { dispatchEvent() {}, click() { events.push("navigate"); }, value: "" };
  const box = { $input: { length: input ? 1 : 0, 0: element, val() {}, trigger() {} }, $btn: { length: input ? 1 : 0, 0: element } };
  const A = {
    KEYS: { searchSubmitted: "submitted", ignoreBusyUntil: "ignore", simulateTyping: "simulate" },
    IGNORE_BUSY_AFTER_SEARCH_MS: 20000,
    FAIL_CODES: { PAGE_CHANGED: "changed" },
    buildSearchUrl: word => `https://www.bing.com/search?q=${word}`,
    warn() {}, Storage: { set: async patch => { events.push("save-start"); await Promise.resolve(); if (pauseDuringSave) paused = true; events.push("saved"); Object.assign(store, patch); return !failSave; } }
  };
  const env = {
    BingAssistant: A, rebangExtensionStore: store, autoSearchLockKey: "lock", findSearchBox: () => box,
    getVal: (key, fallback) => store[key] ?? fallback,
    setVal: async (key, value) => { store[key] = value; },
    isRunPaused: () => paused, isUserBusyNow: () => false, isMobileSearchMode: () => false,
    nativeSetValue: (el, value) => { el.value = value; }, Event: class {},
    sleep: async () => { if (interrupt) abort(); },
    maybeHandleBusyPause: async () => { paused = true; },
    showUserMessage: vi.fn(), pushRunLog() {},
    window: { location: { set href(value) { events.push("navigate:" + value); } } }
  };
  let abort;
  const make = new Function(...Object.keys(env), `let abortSearchForUser = false; let simulatingTyping = false; ${navigation}; return {performSearch, interrupt: () => {abortSearchForUser = true;}};`);
  const functions = make(...Object.values(env));
  abort = functions.interrupt;
  return { ...functions, events, store };
}

describe("content search navigation", () => {
  it("persists the counting marker BEFORE clicking, with typing on or off", async () => {
    for (const simulate of [false, true]) {
      const f = fixture({ simulate });
      expect(await f.performSearch("weather")).toBe(true);
      expect(f.events).toEqual(["save-start", "saved", "navigate"]);
      expect(f.store.submitted).toBe("weather");
    }
  });
  it("counts fallback URL navigation as a submitted search", async () => {
    const f = fixture({ input: false });
    expect(await f.performSearch("weather")).toBe(true);
    expect(f.events[2]).toContain("navigate:https://www.bing.com/search?q=weather");
    expect(f.store.submitted).toBe("weather");
  });
  it("does not fall back to clicking after the user interrupts typing", async () => {
    const f = fixture({ simulate: true, interrupt: true });
    expect(await f.performSearch("weather")).toBe(false);
    expect(f.events).toEqual([]);
  });
  it("does not navigate if persistence fails or pause arrives during persistence", async () => {
    for (const scenario of [{ failSave: true }, { pauseDuringSave: true }]) {
      const f = fixture(scenario);
      expect(await f.performSearch("weather")).toBe(false);
      expect(f.events.some(event => event.startsWith("navigate"))).toBe(false);
    }
  });
});
