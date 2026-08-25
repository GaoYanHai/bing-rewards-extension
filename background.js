"use strict";

const ALARM_NAME = "rebang-daily-auto-start";
const SEARCH_URL = "https://www.bing.com/search?q=Bing+Rewards+Auto+Start&rebang_autostart=1";
const HOUR_KEY = "Rebang_AutoStartHour";
const MINUTE_KEY = "Rebang_AutoStartMin";
const SEARCH_LOCK_KEY = "Rebang_AutoSearchLock";
const SEARCH_LIMIT_KEY = "Rebang_LimitSearchCount";

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dailyCountKey(date = new Date()) {
  return `Rebang_AutoSearchCount_${localDateString(date)}`;
}

function triggeredKey(date = new Date()) {
  return `Rebang_AutoStartTriggered_${localDateString(date)}`;
}

function nextScheduledTime(hour, minute, now = new Date()) {
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

async function readSchedule() {
  const values = await chrome.storage.local.get([HOUR_KEY, MINUTE_KEY]);
  const hour = Number.parseInt(values[HOUR_KEY], 10);
  const minute = Number.parseInt(values[MINUTE_KEY], 10);
  const enabled = Number.isInteger(hour) && hour >= 0 && hour <= 23 &&
    Number.isInteger(minute) && minute >= 0 && minute <= 59;
  return { enabled, hour, minute };
}

async function scheduleNextAlarm() {
  await chrome.alarms.clear(ALARM_NAME);
  const schedule = await readSchedule();
  if (!schedule.enabled) return;

  const when = nextScheduledTime(schedule.hour, schedule.minute).getTime();
  await chrome.alarms.create(ALARM_NAME, { when });
}

async function openOrWakeSearchTab() {
  const tabs = await chrome.tabs.query({ url: ["*://*.bing.com/search*"] });
  const usableTab = tabs.find((tab) => typeof tab.id === "number");

  if (usableTab) {
    await chrome.tabs.update(usableTab.id, { active: true, url: SEARCH_URL });
    if (typeof usableTab.windowId === "number") {
      await chrome.windows.update(usableTab.windowId, { focused: true });
    }
    return;
  }

  await chrome.tabs.create({ url: SEARCH_URL, active: true });
}

async function startDailyRun() {
  const now = new Date();
  const todayTriggeredKey = triggeredKey(now);
  const todayCountKey = dailyCountKey(now);
  const values = await chrome.storage.local.get([
    todayTriggeredKey,
    todayCountKey,
    SEARCH_LIMIT_KEY
  ]);

  const alreadyTriggered = values[todayTriggeredKey] === "true" || values[todayTriggeredKey] === true;
  const count = Number(values[todayCountKey] ?? 0);
  const limit = Number(values[SEARCH_LIMIT_KEY] ?? 50);
  if (alreadyTriggered || count >= limit) return;

  await chrome.storage.local.set({
    [SEARCH_LOCK_KEY]: "on",
    Rebang_GlobalMasterTabId: "",
    Rebang_GlobalMasterStatus: "IDLE",
    Rebang_GlobalLastRunTime: 0
  });

  try {
    await openOrWakeSearchTab();
    await chrome.storage.local.set({ [todayTriggeredKey]: "true" });
  } catch (error) {
    await chrome.storage.local.set({ [SEARCH_LOCK_KEY]: "off" });
    throw error;
  }
}

async function catchUpIfNeeded() {
  const schedule = await readSchedule();
  if (!schedule.enabled) return;

  const now = new Date();
  const scheduledToday = new Date(now);
  scheduledToday.setHours(schedule.hour, schedule.minute, 0, 0);
  if (now.getTime() >= scheduledToday.getTime()) {
    await startDailyRun();
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void scheduleNextAlarm();
  void catchUpIfNeeded();
});

chrome.runtime.onStartup.addListener(() => {
  void scheduleNextAlarm();
  void catchUpIfNeeded();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  void startDailyRun().finally(scheduleNextAlarm);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  if (changes[HOUR_KEY] || changes[MINUTE_KEY]) {
    void scheduleNextAlarm().then(catchUpIfNeeded);
  }
});

chrome.action.onClicked.addListener(() => {
  void openOrWakeSearchTab();
});
