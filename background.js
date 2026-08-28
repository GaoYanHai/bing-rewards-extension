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

function withLog(store, event) {
  return A.appendRunLog(store[KEYS.runLogs], event);
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
  if (store[KEYS.todayGoal] === undefined) {
    patch[KEYS.todayGoal] = store[KEYS.enableDailyTasks] === true ? A.GOALS.SEARCH_SAFE : A.GOALS.SEARCH_ONLY;
  }
  if (store[KEYS.customKeywords] === undefined) patch[KEYS.customKeywords] = "";
  if (store[KEYS.blockedKeywords] === undefined) patch[KEYS.blockedKeywords] = [];
  if (store[KEYS.runLogs] === undefined) patch[KEYS.runLogs] = [];
  if (store[KEYS.mobileSearchEnabled] === undefined) patch[KEYS.mobileSearchEnabled] = false;
  if (store[KEYS.mobileSearchLimit] === undefined) patch[KEYS.mobileSearchLimit] = A.DEFAULT_MOBILE_LIMIT;
  if (store[KEYS.catchUpEnabled] === undefined) patch[KEYS.catchUpEnabled] = true;
  if (store[KEYS.catchUpAsk] === undefined) patch[KEYS.catchUpAsk] = false;
  if (store[KEYS.quizAssistEnabled] === undefined) patch[KEYS.quizAssistEnabled] = false;
  if (store[KEYS.keywordShuffle] === undefined) patch[KEYS.keywordShuffle] = 0;
  if (A.LEGACY_CHANNELS.includes(store[KEYS.selectedChannel])) {
    patch[KEYS.selectedChannel] = A.WORD_PACK_SHORT;
  } else if (!store[KEYS.selectedChannel]) {
    patch[KEYS.selectedChannel] = A.WORD_PACK_SHORT;
  }
  if (Object.keys(patch).length) await chrome.storage.local.set(patch);
}

function syncGoalPatch(goal) {
  const normalized = A.normalizeGoal(goal);
  return {
    [KEYS.todayGoal]: normalized,
    [KEYS.enableDailyTasks]: A.goalEnablesDaily(normalized)
  };
}

async function startToday(reason = "manual") {
  const store = await readStore();
  if (store[KEYS.riskAccepted] !== true) {
    return { ok: false, error: "请先确认使用风险" };
  }
  if (store[KEYS.loginState] === "out") {
    await openOrWakeSearchTab();
    return { ok: false, error: "请先登录微软账号" };
  }
  const model = A.buildViewModel(store);
  if (model.count >= model.limit && (!model.dailyEnabled || model.dailyDone)) {
    await chrome.storage.local.set({ [KEYS.productState]: "complete" });
    await updateBadge();
    return { ok: false, error: "今天的任务已经完成" };
  }

  const action = reason === "alarm"
    ? "已到设定时间，正在开始今天的任务"
    : (reason === "catchup" ? "正在补做今天的任务" : "开始今日任务");
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
    [KEYS.failReasonCode]: "",
    [KEYS.waitingUserTask]: null,
    [KEYS.productState]: "running",
    [KEYS.runStartedAt]: Date.now(),
    [KEYS.lastStatusMessage]: action,
    [KEYS.runLogs]: withLog(store, { action })
  });

  await openOrWakeSearchTab();
  await updateBadge();
  return { ok: true };
}

async function stopToday(message = "已停止") {
  const store = await readStore();
  await chrome.storage.local.set({
    [KEYS.autoSearchLock]: "off",
    [KEYS.productState]: "ready",
    [KEYS.waitingUserTask]: null,
    [KEYS.lastStatusMessage]: message,
    [KEYS.runLogs]: withLog(store, { action: "已停止", result: message })
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
    KEYS.riskAccepted,
    KEYS.loginState,
    KEYS.enableDailyTasks,
    KEYS.todayGoal,
    A.dailyTasksDoneKey(now)
  ]);
  if (store[KEYS.riskAccepted] !== true) return;
  const alreadyTriggered = store[A.triggeredKey(now)] === "true" || store[A.triggeredKey(now)] === true;
  const count = Number(store[A.dailyCountKey(now)] ?? 0);
  const limit = Number(store[KEYS.limitSearchCount] ?? A.DEFAULT_SEARCH_LIMIT);
  const goal = A.normalizeGoal(store);
  const dailyDone = store[A.dailyTasksDoneKey(now)] === true || store[A.dailyTasksDoneKey(now)] === "true";
  if (alreadyTriggered) return;
  if (count >= limit && (!A.goalEnablesDaily(goal) || dailyDone)) return;
  if (store[KEYS.loginState] === "out") {
    await openOrWakeSearchTab();
    await notify("bing-assistant-login", "还没有登录微软账号，今天的任务还没开始。");
    return;
  }

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
  if (now.getTime() < scheduledToday.getTime()) return;
  const store = await readStore();
  if (store[KEYS.catchUpEnabled] === false) return;
  if (store[KEYS.catchUpAsk] === true) {
    const today = A.localDateString(now);
    if (store[KEYS.catchUpPrompted] === today) return;
    await chrome.storage.local.set({ [KEYS.catchUpPrompted]: today });
    await notify("bing-assistant-catchup", "现在补做今天的任务吗？点这里开始。");
    return;
  }
  await startDailyRun("catchup");
}

function refreshKeywordPlan(store) {
  const limit = Math.max(1, A.readNumber(store, KEYS.limitSearchCount, A.DEFAULT_SEARCH_LIMIT));
  return A.buildKeywordPlan(store, limit + 10);
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

chrome.notifications.onClicked.addListener((id) => {
  if (id !== "bing-assistant-catchup") return;
  void startToday("catchup").then((result) => {
    if (result.ok) {
      const now = new Date();
      return chrome.storage.local.set({ [A.triggeredKey(now)]: "true" });
    }
    return undefined;
  });
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
  if (type === "SET_TODAY_GOAL") {
    chrome.storage.local.set(syncGoalPatch(message.goal)).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (type === "REFRESH_KEYWORDS") {
    readStore().then((store) => {
      const nextStore = {
        ...store,
        [KEYS.keywordShuffle]: A.readNumber(store, KEYS.keywordShuffle, 0) + 1
      };
      const plan = refreshKeywordPlan(nextStore);
      return chrome.storage.local.set({
        [KEYS.keywordShuffle]: nextStore[KEYS.keywordShuffle],
        [KEYS.dailyKeywordPlan]: {
          date: plan.date,
          pack: plan.pack,
          words: plan.words,
          note: plan.note
        }
      }).then(() => ({ ok: true, plan }));
    }).then(sendResponse);
    return true;
  }
  if (type === "BLOCK_KEYWORD") {
    const word = String(message.word || "").trim();
    readStore().then((store) => {
      const blocked = A.normalizeStringList(store[KEYS.blockedKeywords]);
      if (word && !blocked.includes(word)) blocked.push(word);
      const nextStore = { ...store, [KEYS.blockedKeywords]: blocked };
      const plan = refreshKeywordPlan(nextStore);
      return chrome.storage.local.set({
        [KEYS.blockedKeywords]: blocked,
        [KEYS.dailyKeywordPlan]: {
          date: plan.date,
          pack: plan.pack,
          words: plan.words,
          note: plan.note
        },
        [KEYS.runLogs]: withLog(store, { action: `已拉黑「${word}」`, result: "今天不再搜" })
      });
    }).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (type === "EXPORT_LOGS") {
    readStore().then((store) => sendResponse({ ok: true, text: A.exportLogsText(store[KEYS.runLogs]) }));
    return true;
  }
  if (type === "RUN_FINISHED") {
    const reason = message.reason || "stopped";
    const reasonCode = message.reasonCode || (reason === "failed" ? A.FAIL_CODES.NO_GAIN : "");
    const count = Number(message.count || 0);
    const limit = Number(message.limit || A.DEFAULT_SEARCH_LIMIT);
    const startedAt = Number(message.startedAt || 0);
    const durationMs = startedAt > 0 ? Date.now() - startedAt : 0;
    const summary = { reason, reasonCode, count, limit, durationMs, at: Date.now() };
    readStore().then((store) => {
      const copy = A.failCopy(reasonCode, {
        limit: A.readNumber(store, KEYS.maxNoGainLimit, A.DEFAULT_NO_GAIN_LIMIT),
        message: message.message || "",
        duringRun: reasonCode === A.FAIL_CODES.LOGIN,
        where: message.where
      });
      const patch = {
        [KEYS.lastRunSummary]: summary,
        [KEYS.lastStatusMessage]: message.message || copy.message,
        [KEYS.autoSearchLock]: "off",
        [KEYS.waitingUserTask]: null,
        [KEYS.runLogs]: withLog(store, {
          action: reason === "complete" ? "今天的任务已完成" : "已停止",
          result: message.message || copy.message,
          reasonCode
        })
      };
      if (reason === "complete") {
        patch[KEYS.productState] = "complete";
        patch[KEYS.failReasonCode] = "";
        void notify("bing-assistant-complete", `今日电脑搜索 ${count}/${limit}，用时 ${A.formatDuration(durationMs)}`);
      } else if (reason === "failed") {
        patch[KEYS.productState] = "failed";
        patch[KEYS.failReasonCode] = reasonCode;
        patch[KEYS.lastError] = message.message || copy.message;
        void notify("bing-assistant-failed", message.message || copy.message);
      } else {
        patch[KEYS.productState] = "ready";
      }
      return chrome.storage.local.set(patch).then(updateBadge);
    }).then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});
