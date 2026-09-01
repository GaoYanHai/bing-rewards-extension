"use strict";

importScripts("shared.js");

const A = BingAssistant;
const KEYS = A.KEYS;

async function readStore() {
  return chrome.storage.local.get(null);
}

async function readSchedule() {
  const values = await chrome.storage.local.get([KEYS.autoStartHour, KEYS.autoStartMin, KEYS.repeatRule]);
  const parsed = A.parseHourMinute(values[KEYS.autoStartHour], values[KEYS.autoStartMin]);
  return { ...parsed, rule: A.normalizeRepeatRule(values[KEYS.repeatRule]) };
}

async function scheduleNextAlarm() {
  await chrome.alarms.clear(A.ALARM_NAME);
  const schedule = await readSchedule();
  if (!schedule.enabled) return;
  const when = A.nextScheduledTime(schedule.hour, schedule.minute, new Date(), schedule.rule).getTime();
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

async function openOrWakeRewardsTab() {
  const tabs = await chrome.tabs.query({ url: ["https://rewards.bing.com/*"] });
  const usableTab = tabs.find((tab) => typeof tab.id === "number");
  if (usableTab) {
    await chrome.tabs.update(usableTab.id, { active: true });
    if (typeof usableTab.windowId === "number") {
      await chrome.windows.update(usableTab.windowId, { focused: true });
    }
    return usableTab.id;
  }
  const created = await chrome.tabs.create({ url: A.REWARDS_URL, active: true });
  return created.id;
}

const CATCHUP_NOTE_ID = "bing-assistant-catchup";
const MISSED_NOTE_ID = "bing-assistant-missed";
const CATCHUP_BUTTONS = [{ title: "现在补做" }, { title: "今天算了" }];

async function notify(id, message, extra = {}) {
  const store = await readStore();
  if (extra.force !== true && store[KEYS.notifyEnabled] === false) return;
  const options = {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: A.PRODUCT_NAME_ZH,
    message
  };
  if (extra.buttons) {
    options.buttons = extra.buttons;
    options.requireInteraction = true;
  }
  try {
    await chrome.notifications.create(id, options);
  } catch (error) {
    if (extra.buttons) {
      try {
        delete options.buttons;
        delete options.requireInteraction;
        await chrome.notifications.create(id, options);
      } catch (fallbackError) {
        console.warn("[BingAssistant] notification failed", fallbackError);
      }
    } else {
      console.warn("[BingAssistant] notification failed", error);
    }
  }
}

function dayRecordPatch(store, extra = {}) {
  const record = A.buildDayRecord(store, extra);
  if (!record) return {};
  return { [KEYS.dayRecords]: A.upsertDayRecord(store[KEYS.dayRecords], record) };
}

async function markPromptedToday(now = new Date()) {
  const today = A.localDateString(now);
  await chrome.storage.local.set({
    [KEYS.catchUpPrompted]: today,
    [KEYS.missedReminded]: today
  });
}

async function dismissToday(now = new Date()) {
  const today = A.localDateString(now);
  await chrome.storage.local.set({
    [KEYS.catchUpPrompted]: today,
    [KEYS.catchUpDismissed]: today,
    [KEYS.missedReminded]: today
  });
}

async function startFromPrompt(reason = "catchup") {
  const now = new Date();
  await markPromptedToday(now);
  const result = await startToday(reason);
  if (result.ok) {
    await chrome.storage.local.set({ [A.triggeredKey(now)]: "true" });
  }
  return result;
}

function withLog(store, event) {
  return A.appendRunLog(store[KEYS.runLogs], event);
}

function clearRunFlags() {
  return {
    [KEYS.paused]: false,
    [KEYS.pauseReason]: "",
    [KEYS.userTaskAction]: "",
    [KEYS.userTaskConfirmTries]: 0,
    [KEYS.ignoreBusyUntil]: 0
  };
}

async function updateBadge() {
  const model = A.buildViewModel(await readStore());
  let text = "";
  let color = "#0078D4";
  if (model.state === "running" || model.state === "paused") {
    text = String(model.count);
    if (model.state === "paused") color = "#C19C00";
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
  if (store[KEYS.dangerEnabled] === undefined) patch[KEYS.dangerEnabled] = false;
  if (store[KEYS.highRiskTasksEnabled] === undefined) patch[KEYS.highRiskTasksEnabled] = false;
  if (store[KEYS.keywordShuffle] === undefined) patch[KEYS.keywordShuffle] = 0;
  if (store[KEYS.paused] === undefined) patch[KEYS.paused] = false;
  if (store[KEYS.pauseReason] === undefined) patch[KEYS.pauseReason] = "";
  if (store[KEYS.searchIntervalMin] === undefined) patch[KEYS.searchIntervalMin] = A.DEFAULT_INTERVAL_MIN;
  if (store[KEYS.searchIntervalMax] === undefined) patch[KEYS.searchIntervalMax] = A.DEFAULT_INTERVAL_MAX;
  if (store[KEYS.simulateTyping] === undefined) patch[KEYS.simulateTyping] = false;
  if (store[KEYS.pauseWhenBusy] === undefined) patch[KEYS.pauseWhenBusy] = true;
  if (store[KEYS.repeatRule] === undefined) patch[KEYS.repeatRule] = A.REPEAT.DAILY;
  if (store[KEYS.userTaskAction] === undefined) patch[KEYS.userTaskAction] = "";
  if (store[KEYS.dayRecords] === undefined) patch[KEYS.dayRecords] = [];
  if (store[KEYS.weekendGoal] === undefined) patch[KEYS.weekendGoal] = A.WEEKEND_GOAL_SAME;
  if (store[KEYS.weekendSearchLimit] === undefined) patch[KEYS.weekendSearchLimit] = "";
  if (store[KEYS.missedRemindEnabled] === undefined) patch[KEYS.missedRemindEnabled] = true;
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
    : (reason === "catchup"
      ? "正在补做今天的任务"
      : (reason === "missed" ? "昨天还没做完，正在开始今天的任务" : "开始今日任务"));
  const startPoints = A.readablePoints(store[KEYS.pointsBalance]);
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
    [KEYS.runStartPoints]: startPoints,
    [KEYS.lastStatusMessage]: action,
    [KEYS.runLogs]: withLog(store, { action }),
    ...clearRunFlags()
  });

  if (model.count >= model.limit && model.dailyEnabled && !model.dailyDone) {
    await openOrWakeRewardsTab();
  } else {
    await openOrWakeSearchTab();
  }
  await updateBadge();
  return { ok: true };
}

async function stopToday(message = "已停止") {
  const store = await readStore();
  const model = A.buildViewModel(store);
  await chrome.storage.local.set({
    [KEYS.autoSearchLock]: "off",
    [KEYS.productState]: "ready",
    [KEYS.waitingUserTask]: null,
    [KEYS.lastStatusMessage]: message,
    [KEYS.runLogs]: withLog(store, { action: "已停止", result: message }),
    ...dayRecordPatch(store, { reason: "stopped", count: model.count, limit: model.limit }),
    ...clearRunFlags()
  });
  await updateBadge();
  return { ok: true };
}

async function pauseToday(reason = A.PAUSE_REASONS.USER, message) {
  const store = await readStore();
  if (!A.isLockOn(store)) {
    return { ok: false, error: "还没有开始今天的任务" };
  }
  const pauseReason = reason === A.PAUSE_REASONS.BUSY ? A.PAUSE_REASONS.BUSY : A.PAUSE_REASONS.USER;
  if (store[KEYS.paused] === true && store[KEYS.pauseReason] === pauseReason) {
    return { ok: true };
  }
  if (pauseReason === A.PAUSE_REASONS.BUSY && store[KEYS.paused] === true && store[KEYS.pauseReason] === A.PAUSE_REASONS.USER) {
    return { ok: true };
  }
  const status = message || A.pauseStatusText(pauseReason);
  const patch = {
    [KEYS.paused]: true,
    [KEYS.pauseReason]: pauseReason,
    [KEYS.productState]: "paused",
    [KEYS.lastStatusMessage]: status
  };
  if (pauseReason === A.PAUSE_REASONS.USER) {
    patch[KEYS.runLogs] = withLog(store, { action: "已暂停", result: status });
  }
  await chrome.storage.local.set(patch);
  await updateBadge();
  return { ok: true };
}

async function resumeToday(options = {}) {
  const store = await readStore();
  if (!A.isLockOn(store)) {
    return startToday("manual");
  }
  const ignoreBusyMs = options.ignoreBusyMs != null ? Number(options.ignoreBusyMs) : 8000;
  await chrome.storage.local.set({
    [KEYS.paused]: false,
    [KEYS.pauseReason]: "",
    [KEYS.productState]: "running",
    [KEYS.ignoreBusyUntil]: Date.now() + Math.max(0, ignoreBusyMs),
    [KEYS.lastStatusMessage]: "继续今天的任务",
    [KEYS.runLogs]: options.silent ? store[KEYS.runLogs] : withLog(store, { action: "继续今天的任务" })
  });
  await updateBadge();
  return { ok: true };
}

async function skipWaitingTask() {
  const store = await readStore();
  const waiting = store[KEYS.waitingUserTask];
  if (!waiting || !waiting.url) return { ok: false, error: "现在没有需要你点的活动" };
  const taskList = A.readTaskList(store);
  const cards = taskList.cards.map((card) => (
    card.url === waiting.url
      ? { ...card, status: A.TASK_STATUS.SKIPPED, reason: "你跳过了这张", updatedAt: Date.now() }
      : card
  ));
  await chrome.storage.local.set({
    [KEYS.taskList]: { date: taskList.date, cards },
    [KEYS.waitingUserTask]: null,
    [KEYS.userTaskAction]: "",
    [KEYS.userTaskConfirmTries]: 0,
    [KEYS.lastStatusMessage]: `已跳过「${waiting.name || "这张活动"}」`,
    [KEYS.runLogs]: withLog(store, {
      action: `跳过「${waiting.name || "这张活动"}」`,
      result: "已跳过",
      reason: "你跳过了这张"
    })
  });
  return { ok: true };
}

async function confirmWaitingTask() {
  const store = await readStore();
  const waiting = store[KEYS.waitingUserTask];
  if (!waiting || !waiting.url) return { ok: false, error: "现在没有需要你点的活动" };
  await chrome.storage.local.set({
    [KEYS.userTaskAction]: "done",
    [KEYS.userTaskConfirmTries]: 0,
    [KEYS.lastStatusMessage]: `正在确认「${waiting.name || "这张活动"}」是否完成`
  });
  await openOrWakeRewardsTab();
  return { ok: true };
}

async function startDailyRun(reason = "alarm") {
  const now = new Date();
  const store = await readStore();
  if (store[KEYS.riskAccepted] !== true) return;
  if (!A.isScheduledDay(now, store[KEYS.repeatRule])) return;
  if (reason === "catchup" && store[KEYS.catchUpDismissed] === A.localDateString(now)) return;
  const alreadyTriggered = store[A.triggeredKey(now)] === "true" || store[A.triggeredKey(now)] === true;
  const model = A.buildViewModel(store, now);
  if (alreadyTriggered) return;
  if (model.count >= model.limit && (!model.dailyEnabled || model.dailyDone)) return;
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
  if (!A.isScheduledDay(now, schedule.rule)) return;
  const scheduledToday = new Date(now);
  scheduledToday.setHours(schedule.hour, schedule.minute, 0, 0);
  if (now.getTime() < scheduledToday.getTime()) return;
  const store = await readStore();
  if (store[KEYS.catchUpEnabled] === false) return;
  const today = A.localDateString(now);
  if (store[KEYS.catchUpDismissed] === today) return;
  if (store[KEYS.catchUpAsk] === true && store[KEYS.notifyEnabled] !== false) {
    if (store[KEYS.catchUpPrompted] === today) return;
    await markPromptedToday(now);
    await notify(CATCHUP_NOTE_ID, "现在补做今天的任务吗？", { buttons: CATCHUP_BUTTONS });
    return;
  }
  await startDailyRun("catchup");
}

async function maybeRemindMissed() {
  const store = await readStore();
  if (!A.shouldRemindMissed(store)) return false;
  await markPromptedToday();
  await notify(MISSED_NOTE_ID, "昨天的电脑搜索还没做完，要现在补做吗？", {
    force: true,
    buttons: CATCHUP_BUTTONS
  });
  return true;
}

function refreshKeywordPlan(store) {
  const limit = Math.max(1, A.effectiveSearchLimit(store));
  return A.buildKeywordPlan(store, limit + 10);
}

chrome.runtime.onInstalled.addListener(() => {
  void applyDefaultsIfNeeded().then(scheduleNextAlarm).then(updateBadge);
});

chrome.runtime.onStartup.addListener(() => {
  void applyDefaultsIfNeeded()
    .then(scheduleNextAlarm)
    .then(async () => {
      const reminded = await maybeRemindMissed();
      if (!reminded) await catchUpIfNeeded();
    })
    .then(updateBadge);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== A.ALARM_NAME) return;
  void startDailyRun("alarm").finally(scheduleNextAlarm);
});

chrome.notifications.onClicked.addListener((id) => {
  if (id !== CATCHUP_NOTE_ID && id !== MISSED_NOTE_ID) return;
  void startFromPrompt(id === MISSED_NOTE_ID ? "missed" : "catchup");
});

chrome.notifications.onButtonClicked.addListener((id, buttonIndex) => {
  if (id !== CATCHUP_NOTE_ID && id !== MISSED_NOTE_ID) return;
  if (buttonIndex === 0) void startFromPrompt(id === MISSED_NOTE_ID ? "missed" : "catchup");
  else void dismissToday();
});

chrome.notifications.onClosed.addListener((id, byUser) => {
  if (!byUser) return;
  if (id !== CATCHUP_NOTE_ID && id !== MISSED_NOTE_ID) return;
  void dismissToday();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  if (changes[KEYS.autoStartHour] || changes[KEYS.autoStartMin] || changes[KEYS.repeatRule]) {
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
  if (type === "OPEN_REWARDS") {
    openOrWakeRewardsTab().then(() => sendResponse({ ok: true }));
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
  if (type === "PAUSE_TODAY") {
    pauseToday(message.reason || A.PAUSE_REASONS.USER, message.message).then(sendResponse);
    return true;
  }
  if (type === "RESUME_TODAY") {
    resumeToday({ silent: message.silent === true, ignoreBusyMs: message.ignoreBusyMs }).then(sendResponse);
    return true;
  }
  if (type === "USER_TASK_SKIP") {
    skipWaitingTask().then(sendResponse);
    return true;
  }
  if (type === "USER_TASK_DONE") {
    confirmWaitingTask().then(sendResponse);
    return true;
  }
  if (type === "SET_TODAY_GOAL") {
    chrome.storage.local.set(syncGoalPatch(message.goal)).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (type === "DISMISS_WHATS_NEW") {
    chrome.storage.local.set({ [KEYS.whatsNewSeen]: A.PRODUCT_VERSION }).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (type === "SHOW_WHATS_NEW") {
    chrome.storage.local.set({ [KEYS.whatsNewSeen]: "" }).then(() => sendResponse({ ok: true }));
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
    readStore().then((store) => {
      const copy = A.failCopy(reasonCode, {
        limit: A.readNumber(store, KEYS.maxNoGainLimit, A.DEFAULT_NO_GAIN_LIMIT),
        message: message.message || "",
        duringRun: reasonCode === A.FAIL_CODES.LOGIN,
        where: message.where
      });
      const summary = A.buildTodaySummary(store, {
        reason,
        reasonCode,
        count,
        limit,
        durationMs,
        at: Date.now()
      });
      const patch = {
        [KEYS.lastRunSummary]: summary,
        [KEYS.lastStatusMessage]: message.message || copy.message,
        [KEYS.autoSearchLock]: "off",
        [KEYS.waitingUserTask]: null,
        [KEYS.runLogs]: withLog(store, {
          action: reason === "complete" ? "今天的任务已完成" : "已停止",
          result: message.message || copy.message || summary.closingLine,
          reasonCode
        }),
        ...dayRecordPatch(store, {
          reason,
          reasonCode,
          count,
          limit,
          at: Date.now()
        }),
        ...clearRunFlags()
      };
      if (reason === "complete") {
        patch[KEYS.productState] = "complete";
        patch[KEYS.failReasonCode] = "";
        void notify("bing-assistant-complete", A.formatCompleteNotify(summary));
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
