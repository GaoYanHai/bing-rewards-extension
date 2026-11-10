import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const shared = readFileSync(new URL("../shared.js", import.meta.url), "utf8");
const background = readFileSync(new URL("../background.js", import.meta.url), "utf8");
const i18n = readFileSync(new URL("../i18n.js", import.meta.url), "utf8");

function setup(patch = {}) {
  const store = {};
  const tabs = [];
  const listener = () => ({ addListener: vi.fn() });
  const chrome = {
    i18n: { getUILanguage: () => "zh-CN" },
    storage: { local: {
      get: vi.fn(async () => ({ ...store })),
      set: vi.fn(async (values) => Object.assign(store, values))
    }, onChanged: listener() },
    runtime: { onMessage: listener(), onInstalled: listener(), onStartup: listener() },
    alarms: { clear: vi.fn(async () => true), create: vi.fn(async () => {}), onAlarm: listener() },
    tabs: {
      query: vi.fn(async () => tabs), create: vi.fn(async (props) => { const tab = { ...props, id: 10, windowId: 1 }; tabs.push(tab); return tab; }),
      update: vi.fn(async () => ({ id: 10, windowId: 1 })),
      get: vi.fn(async () => ({ id: 10, windowId: 1 })), onRemoved: listener()
    },
    windows: { getLastFocused: vi.fn(async () => ({ id: 1, focused: true })), update: vi.fn(async () => {}) },
    action: { setBadgeText: vi.fn(async () => {}), setBadgeBackgroundColor: vi.fn(async () => {}) },
    notifications: { create: vi.fn(async () => {}), clear: vi.fn(async () => true), onClicked: listener(), onButtonClicked: listener(), onClosed: listener() },
    declarativeNetRequest: { updateSessionRules: vi.fn(async () => {}) }
  };
  const context = vm.createContext({ chrome, console: { warn: vi.fn() }, URL, URLSearchParams, setTimeout, clearTimeout, importScripts: () => {} });
  vm.runInContext(i18n, context);
  vm.runInContext(shared, context);
  const A = context.BingAssistant;
  Object.assign(store, { [A.KEYS.riskAccepted]: true, [A.KEYS.loginState]: "in", [A.KEYS.limitSearchCount]: 3, [A.KEYS.notifyEnabled]: false }, patch);
  vm.runInContext(background, context);
  const call = (name, ...args) => { context.args = args; return vm.runInContext(`${name}(...args)`, context); };
  return { store, A, chrome, call };
}

describe("background workflows", () => {
  it("uses the selected language for native notification titles, text, buttons and log exports", async () => {
    const { store, A, call, chrome } = setup({ Rebang_UiLanguage: "en", Rebang_NotifyEnabled: true });
    await call("notify", "test", "现在补做今天的任务吗？", { force: true, buttons: [{ title: "现在补做" }, { title: "今天算了" }] });
    const options = chrome.notifications.create.mock.calls.at(-1)[1];
    expect(options.title).toBe("Bing Rewards Assistant");
    expect(JSON.stringify(options)).not.toMatch(/[\u3400-\u9fff]/);
    store[A.KEYS.runLogs] = [{ time: "12:30", action: "已完成", result: "今天的电脑搜索已完成" }];
    const respond = vi.fn();
    await call("handleMessage", { type: "EXPORT_LOGS" }, {}, respond);
    expect(respond.mock.calls.at(-1)[0].text).not.toMatch(/[\u3400-\u9fff]/);
    expect(store[A.KEYS.runLogs][0].action).toBe("已完成");
  });
  it("a first manual start respects the limit and pause/resume preserves progress", async () => {
    const { store, A, call } = setup();
    store[A.dailyCountKey()] = 1;
    expect(await call("startToday")).toEqual({ ok: true });
    expect(store[A.KEYS.manualContinue]).toBe(false);
    expect((await call("pauseToday")).ok).toBe(true);
    expect(store[A.KEYS.paused]).toBe(true);
    expect((await call("resumeToday")).ok).toBe(true);
    expect(store[A.dailyCountKey()]).toBe(1);
    await call("stopToday");
    expect(store[A.KEYS.autoSearchLock]).toBe("off");
  });

  it("an explicit manual restart after completion can continue searching", async () => {
    const { store, A, call } = setup();
    store[A.dailyCountKey()] = 3;
    expect((await call("startToday")).ok).toBe(true);
    expect(store[A.KEYS.manualContinue]).toBe(true);
  });

  it("serializes rapid repeated starts into one new tab", async () => {
    const { call, chrome } = setup();
    await Promise.all([call("startToday"), call("startToday"), call("startToday")]);
    expect(chrome.tabs.create).toHaveBeenCalledTimes(1);
  });

  it("completed days do not produce catch-up prompts", async () => {
    const { store, A, call, chrome } = setup();
    Object.assign(store, {
      [A.KEYS.autoStartHour]: "0", [A.KEYS.autoStartMin]: "0",
      [A.KEYS.catchUpAsk]: true, [A.KEYS.notifyEnabled]: true,
      [A.KEYS.lastRunSummary]: { date: A.localDateString(), reason: "complete" }
    });
    await call("catchUpIfNeeded");
    expect(chrome.notifications.create).not.toHaveBeenCalled();
    expect(chrome.tabs.create).not.toHaveBeenCalled();
  });

  it("page-triggered checks respect the catch-up opt-out", async () => {
    const { store, A, call, chrome } = setup();
    Object.assign(store, { [A.KEYS.autoStartHour]: "0", [A.KEYS.autoStartMin]: "0", [A.KEYS.catchUpEnabled]: false });
    const respond = vi.fn();
    await call("handleMessage", { type: "CHECK_AUTO_START" }, {}, respond);
    expect(respond).toHaveBeenCalledWith({ ok: true });
    expect(chrome.tabs.create).not.toHaveBeenCalled();
  });

  it("page-triggered checks ask before catch-up", async () => {
    const { store, A, call, chrome } = setup();
    Object.assign(store, { [A.KEYS.autoStartHour]: "0", [A.KEYS.autoStartMin]: "0", [A.KEYS.catchUpAsk]: true, [A.KEYS.notifyEnabled]: true });
    await call("handleMessage", { type: "CHECK_AUTO_START" }, {}, vi.fn());
    expect(chrome.notifications.create).toHaveBeenCalledTimes(1);
    expect(chrome.tabs.create).not.toHaveBeenCalled();
  });

  it("a completed PC phase does not suppress pending mobile work", async () => {
    const { store, A, call, chrome } = setup();
    Object.assign(store, { [A.dailyCountKey()]: 3, [A.KEYS.dangerEnabled]: true, [A.KEYS.mobileSearchEnabled]: true });
    await call("startDailyRun", "alarm");
    expect(chrome.tabs.create).toHaveBeenCalledTimes(1);
    expect(store[A.KEYS.searchPhase]).toBe("mobile");
  });

  it("clears the running flag if the browser cannot open a task tab", async () => {
    const { chrome, store, A, call } = setup();
    chrome.tabs.create.mockRejectedValue(new Error("tab unavailable"));
    expect((await call("startToday")).ok).toBe(false);
    expect(store[A.KEYS.autoSearchLock]).toBe("off");
    expect(store[A.KEYS.productState]).toBe("failed");
  });

  it("storage and tab errors return a visible message instead of hanging", async () => {
    const { chrome, store, A } = setup();
    const handle = chrome.runtime.onMessage.addListener.mock.calls[0][0];
    chrome.storage.local.set.mockRejectedValue(new Error("disk full"));
    const reply = await new Promise(resolve => handle({ type: "ACCEPT_RISK" }, {}, resolve));
    expect(reply.ok).toBe(false);
    expect(reply.error).toContain("操作失败");
    expect(store[A.KEYS.autoSearchLock]).not.toBe("on");
    chrome.tabs.create.mockRejectedValue(new Error("tab unavailable"));
    const openReply = await new Promise(resolve => handle({ type: "OPEN_BING" }, {}, resolve));
    expect(openReply.ok).toBe(false);
  });
});
