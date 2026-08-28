"use strict";

importScripts("shared.js");

const A = BingAssistant;
const KEYS = A.KEYS;

async function readStore() {
  return chrome.storage.local.get(null);
}

async function readSchedule() {
  const values = await chrome.storage.local.get([KEYS.autoStartHour, KEYS.autoStartMin]);
  return A.parseHourMinute(values[KEYS.autoStartHour], values[KEYS.autoStartMin]);
}

async function scheduleNextAlarm() {
  await chrome.alarms.clear(A.ALARM_NAME);
  const schedule = await readSchedule();
  if (!schedule.enabled) return;
  const when = A.nextScheduledTime(schedule.hour, schedule.minute).getTime();
  await chrome.alarms.create(A.ALARM_NAME, { when });
}

async function openOrWakeSearchTab() {
  const tabs = await chrome.tabs.query({ url: ["*://*.bing.com/search*"] });
  const usableTab = tabs.find((tab) => typeof tab.id === "number");
  if (usableTab) {
    await chrome.tabs.update(usableTab.id, { active: true, url: A.SEARCH_URL });
    if (typeof usableTab.windowId === "number") {
      await chrome.windows.update(usableTab.windowId, { focused: true });
    }
    return usableTab.id;
  }
  const created = await chrome.tabs.create({ url: A.SEARCH_URL, active: true });
  return created.id;
}

async function notify(id, message) {
  const store = await readStore();
  if (store[KEYS.notifyEnabled] === false) return;
  try {
    await chrome.notifications.create(id, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: A.PRODUCT_NAME_ZH,
      message
    });
  } catch (error) {
    console.warn("[BingAssistant] notification failed", error);
  }
}

async function updateBadge() {
  const model = A.buildViewModel(await readStore());
  let text = "";
  let color = "#0078D4";
  if (model.state === "running") {
    text = String(model.count);
  } else if (model.state === "complete") {
    text = "✓";
    color = "#107C10";
  } else if (model.state === "failed" || model.state === "logged_out") {
    text = "!";
    color = "#D83B01";
  }
  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setBadgeText({ text });
}

async function applyDefaultsIfNeeded() {
  const store = await readStore();
  const patch = {};
  if (store[KEYS.limitSearchCount] === undefined) patch[KEYS.limitSearchCount] = A.DEFAULT_SEARCH_LIMIT;
  if (store[KEYS.maxNoGainLimit] === undefined) patch[KEYS.maxNoGainLimit] = A.DEFAULT_NO_GAIN_LIMIT;
  if (store[KEYS.dailyTaskMaxRetries] === undefined) patch[KEYS.dailyTaskMaxRetries] = A.DEFAULT_DAILY_RETRIES;
  if (store[KEYS.enableDailyTasks] === undefined) patch[KEYS.enableDailyTasks] = false;
  if (store[KEYS.notifyEnabled] === undefined) patch[KEYS.notifyEnabled] = true;
  if (store[KEYS.loginState] === undefined) patch[KEYS.loginState] = "unknown";
  if (store[KEYS.productState] === undefined) patch[KEYS.productState] = "ready";
  if (A.LEGACY_CHANNELS.includes(store[KEYS.selectedChannel])) {
    patch[KEYS.selectedChannel] = A.WORD_PACK_SHORT;
  } else if (!store[KEYS.selectedChannel]) {
    patch[KEYS.selectedChannel] = A.WORD_PACK_SHORT;
  }
  if (Object.keys(patch).length) await chrome.storage.local.set(patch);
}

async function startToday(reason = "manual") {
  const store = await readStore();
  if (store[KEYS.riskAccepted] !== true) {
    return { ok: false, error: "请先确认使用风险" };
  }
  const model = A.buildViewModel(store);
  if (model.count >= model.limit && (!model.dailyEnabled || model.dailyDone)) {
    await chrome.storage.local.set({ [KEYS.productState]: "complete" });
    await updateBadge();
    return { ok: false, error: "今天的任务已经完成" };
  }

  await chrome.storage.local.set({
    [KEYS.autoSearchLock]: "on",
    [KEYS.globalMasterTabId]: "",
    [KEYS.globalMasterStatus]: "IDLE",
    [KEYS.globalLastRunTime]: 0,
    [KEYS.consecutiveNoGain]: 0,
    [KEYS.jumpFailCount]: 0,
    [KEYS.jumpLastPoints]: -1,
    [KEYS.rewardsFailCount]: 0,
    [KEYS.autoSearchLockExpires]: 0,
    [KEYS.lastPoints]: null,
    [KEYS.lastError]: "",
    [KEYS.productState]: "running",
    [KEYS.runStartedAt]: Date.now(),
    [KEYS.lastStatusMessage]: reason === "alarm" ? "已到设定时间，正在开始今天的任务" : "正在开始今天的任务"
  });

  await openOrWakeSearchTab();
  await updateBadge();
  return { ok: true };
}

async function stopToday(message = "已停止") {
  await chrome.storage.local.set({
    [KEYS.autoSearchLock]: "off",
    [KEYS.productState]: "ready",
    [KEYS.lastStatusMessage]: message
  });
  await updateBadge();
  return { ok: true };
}

async function startDailyRun(reason = "alarm") {
  const now = new Date();
  const store = await chrome.storage.local.get([
    A.triggeredKey(now),
    A.dailyCountKey(now),
    KEYS.limitSearchCount,
    KEYS.riskAccepted
  ]);
  if (store[KEYS.riskAccepted] !== true) return;
  const alreadyTriggered = store[A.triggeredKey(now)] === "true" || store[A.triggeredKey(now)] === true;
  const count = Number(store[A.dailyCountKey(now)] ?? 0);
  const limit = Number(store[KEYS.limitSearchCount] ?? A.DEFAULT_SEARCH_LIMIT);
  if (alreadyTriggered || count >= limit) return;

  const result = await startToday(reason);
  if (result.ok) {
    await chrome.storage.local.set({ [A.triggeredKey(now)]: "true" });
  }
}

async function catchUpIfNeeded() {
  const schedule = await readSchedule();
  if (!schedule.enabled) return;
  const now = new Date();
  const scheduledToday = new Date(now);
  scheduledToday.setHours(schedule.hour, schedule.minute, 0, 0);
  if (now.getTime() >= scheduledToday.getTime()) {
    await startDailyRun("catchup");
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void applyDefaultsIfNeeded().then(scheduleNextAlarm).then(updateBadge);
});

chrome.runtime.onStartup.addListener(() => {
  void applyDefaultsIfNeeded().then(scheduleNextAlarm).then(catchUpIfNeeded).then(updateBadge);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== A.ALARM_NAME) return;
  void startDailyRun("alarm").finally(scheduleNextAlarm);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  if (changes[KEYS.autoStartHour] || changes[KEYS.autoStartMin]) {
    void scheduleNextAlarm();
  }
  void updateBadge();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const type = message && message.type;
  if (type === "ACCEPT_RISK") {
    chrome.storage.local.set({ [KEYS.riskAccepted]: true }).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (type === "OPEN_BING") {
    openOrWakeSearchTab().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (type === "START_TODAY") {
    startToday("manual").then(sendResponse);
    return true;
  }
  if (type === "STOP_TODAY") {
    stopToday("已停止").then(sendResponse);
    return true;
  }
  if (type === "RUN_FINISHED") {
    const reason = message.reason || "stopped";
    const count = Number(message.count || 0);
    const limit = Number(message.limit || A.DEFAULT_SEARCH_LIMIT);
    const startedAt = Number(message.startedAt || 0);
    const durationMs = startedAt > 0 ? Date.now() - startedAt : 0;
    const summary = { reason, count, limit, durationMs, at: Date.now() };
    const patch = {
      [KEYS.lastRunSummary]: summary,
      [KEYS.lastStatusMessage]: message.message || "",
      [KEYS.autoSearchLock]: "off"
    };
    if (reason === "complete") {
      patch[KEYS.productState] = "complete";
      void notify("bing-assistant-complete", `今日电脑搜索 ${count}/${limit}，用时 ${A.formatDuration(durationMs)}`);
    } else if (reason === "failed") {
      patch[KEYS.productState] = "failed";
      patch[KEYS.lastError] = message.message || "连续多次没有积分，已停止";
      void notify("bing-assistant-failed", message.message || "连续多次没有积分，已停止，可能已达上限或需要登录");
    } else {
      patch[KEYS.productState] = "ready";
    }
    chrome.storage.local.set(patch).then(updateBadge).then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});
