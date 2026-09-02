"use strict";

const A = BingAssistant;
const scheduleEnabled = document.getElementById("schedule-enabled");
const scheduleTime = document.getElementById("schedule-time");
const nextRun = document.getElementById("next-run");
const todayGoal = document.getElementById("today-goal");
const weekendGoal = document.getElementById("weekend-goal");
const searchLimit = document.getElementById("search-limit");
const weekendSearchLimit = document.getElementById("weekend-search-limit");
const mobileQuota = document.getElementById("mobile-quota");
const missedRemind = document.getElementById("missed-remind");
const notifyEnabled = document.getElementById("notify-enabled");
const wordPack = document.getElementById("word-pack");
const customKeywords = document.getElementById("custom-keywords");
const keywordNote = document.getElementById("keyword-note");
const todayWords = document.getElementById("today-words");
const blockWord = document.getElementById("block-word");
const blockedWords = document.getElementById("blocked-words");
const logList = document.getElementById("log-list");
const noGainLimit = document.getElementById("no-gain-limit");
const dailyRetries = document.getElementById("daily-retries");
const catchupEnabled = document.getElementById("catchup-enabled");
const catchupAsk = document.getElementById("catchup-ask");
const mobileEnabled = document.getElementById("mobile-enabled");
const mobileLimit = document.getElementById("mobile-limit");
const mobileDoneBtn = document.getElementById("mobile-done-btn");
const mobileUndoneBtn = document.getElementById("mobile-undone-btn");
const dangerEnabled = document.getElementById("danger-enabled");
const dangerConfirm = document.getElementById("danger-confirm");
const dangerAck = document.getElementById("danger-ack");
const dangerConfirmBtn = document.getElementById("danger-confirm-btn");
const dangerBody = document.getElementById("danger-body");
const highRiskEnabled = document.getElementById("high-risk-enabled");
const quizAssist = document.getElementById("quiz-assist");
const repeatRule = document.getElementById("repeat-rule");
const intervalMin = document.getElementById("interval-min");
const intervalMax = document.getElementById("interval-max");
const simulateTyping = document.getElementById("simulate-typing");
const pauseWhenBusy = document.getElementById("pause-when-busy");

function send(type, extra = {}) {
  return chrome.runtime.sendMessage({ type, ...extra });
}

function renderChips(container, items, emptyText, onRemove) {
  if (!items.length) {
    container.innerHTML = `<span class="help">${emptyText}</span>`;
    return;
  }
  container.innerHTML = items.map((item) => {
    const safe = escapeHtml(item);
    const button = onRemove ? `<button type="button" data-word="${safe}">去掉</button>` : "";
    return `<span class="chip">${safe}${button}</span>`;
  }).join("");
  if (!onRemove) return;
  container.querySelectorAll("button[data-word]").forEach((btn) => {
    btn.addEventListener("click", () => onRemove(btn.getAttribute("data-word") || ""));
  });
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMonthChart(model) {
  const chart = model.monthChart || A.buildMonthChartModel({});
  const summary = document.getElementById("chart-summary");
  const grid = document.getElementById("month-status");
  const bars = document.getElementById("month-chart");
  if (summary) summary.textContent = chart.summary || "还没有足够的记录";
  if (grid) {
    grid.innerHTML = (chart.days || []).map((cell) => {
      return `<div class="month-cell ${escapeHtml(cell.status)}" title="${escapeHtml(cell.title)}"><span>${escapeHtml(String(cell.day))}</span></div>`;
    }).join("");
  }
  if (bars) {
    const hasGain = (chart.bars || []).some((item) => Number(item.value) > 0);
    bars.hidden = !hasGain;
    if (hasGain) {
      bars.innerHTML = chart.bars.map((item) => {
        const height = Math.max(4, Number(item.percent) || 0);
        return `<i class="month-bar ${escapeHtml(item.status)}" title="${escapeHtml(item.date)} +${item.value || 0}" style="height:${height}%"></i>`;
      }).join("");
    } else {
      bars.innerHTML = "";
    }
  }
}

function fill(store) {
  const model = A.buildViewModel(store);
  scheduleEnabled.checked = model.schedule.enabled;
  scheduleTime.value = model.schedule.enabled
    ? A.formatClock(model.schedule.hour, model.schedule.minute)
    : `${A.pad2(A.SUGGESTED_HOUR)}:${A.pad2(A.SUGGESTED_MINUTE)}`;
  nextRun.textContent = model.schedule.enabled
    ? `下次启动：${model.nextRunLabel}`
    : `下次启动：未设置，建议${A.suggestedTimeLabel()}`;
  todayGoal.value = model.weekdayGoal || model.goal;
  weekendGoal.value = model.weekendGoal || A.WEEKEND_GOAL_SAME;
  searchLimit.value = String(model.weekdayLimit || model.limit);
  weekendSearchLimit.value = model.weekendSearchLimit === "" || model.weekendSearchLimit == null ? "" : String(model.weekendSearchLimit);
  missedRemind.checked = model.missedRemindEnabled;
  notifyEnabled.checked = model.notifyEnabled;
  const copy = model.whatsNew || A.whatsNewCopy();
  const titleEl = document.getElementById("whats-new-title");
  const pointsEl = document.getElementById("whats-new-points");
  if (titleEl) titleEl.textContent = copy.title;
  if (pointsEl) pointsEl.innerHTML = (copy.points || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  wordPack.value = model.wordPack;
  customKeywords.value = model.customKeywords;
  noGainLimit.value = String(model.noGainLimit);
  dailyRetries.value = String(model.dailyRetries);
  catchupEnabled.checked = model.catchUpEnabled;
  catchupAsk.checked = model.catchUpAsk;
  dangerEnabled.checked = model.dangerEnabled;
  if (model.dangerEnabled) {
    dangerConfirm.hidden = true;
    dangerAck.checked = false;
    dangerConfirmBtn.disabled = true;
    dangerBody.hidden = false;
  } else if (dangerConfirm.hidden) {
    dangerBody.hidden = true;
  }
  highRiskEnabled.checked = model.highRiskTasksEnabled;
  quizAssist.checked = model.quizAssistEnabled;
  mobileEnabled.checked = model.mobileEnabled;
  repeatRule.value = model.repeatRule;
  intervalMin.value = String(model.intervalMin);
  intervalMax.value = String(model.intervalMax);
  simulateTyping.checked = model.simulateTyping;
  pauseWhenBusy.checked = model.pauseWhenBusy;
  const mobileLine = model.mobileQuotaLine || "还没打开过 Rewards 读取配额";
  if (mobileQuota) mobileQuota.textContent = mobileLine;
  const mobileBasic = document.getElementById("mobile-quota-basic");
  if (mobileBasic) mobileBasic.textContent = mobileLine;
  if (mobileLimit) mobileLimit.value = String(A.readNumber(store, A.KEYS.mobileSearchLimit, A.DEFAULT_MOBILE_LIMIT));
  if (mobileDoneBtn) mobileDoneBtn.hidden = !!model.mobileDoneToday;
  if (mobileUndoneBtn) mobileUndoneBtn.hidden = !model.mobileDoneToday;
  renderMonthChart(model);
  keywordNote.textContent = model.keywordPlan?.note || A.KEYWORD_NOTE;
  if (model.keywordPlan?.fallback) {
    keywordNote.textContent = "自定义词库是空的，已改用日常短词。";
  }
  renderChips(todayWords, model.keywordPlan?.words || [], "还没有今日搜索词。保存词库或点换一批后会生成。");
  renderChips(blockedWords, model.blockedKeywords, "还没有拉黑词。", async (word) => {
    const next = model.blockedKeywords.filter((item) => item !== word);
    await save({ [A.KEYS.blockedKeywords]: next });
    await send("REFRESH_KEYWORDS");
  });
  const logs = model.logs || [];
  logList.innerHTML = logs.length
    ? logs.map((entry) => `<div>${escapeHtml(A.formatLogLine(entry))}</div>`).join("")
    : "还没有今天的日志。";
}

async function save(partial) {
  await chrome.storage.local.set(partial);
}

scheduleEnabled.addEventListener("change", async () => {
  if (!scheduleEnabled.checked) {
    await save({
      [A.KEYS.autoStartHour]: "-1",
      [A.KEYS.autoStartMin]: "-1",
      [A.triggeredKey()]: "false"
    });
    return;
  }
  const [hour, minute] = (scheduleTime.value || "21:30").split(":");
  await save({
    [A.KEYS.autoStartHour]: String(Number(hour)),
    [A.KEYS.autoStartMin]: String(Number(minute)),
    [A.triggeredKey()]: "false"
  });
});

repeatRule.addEventListener("change", () => save({ [A.KEYS.repeatRule]: A.normalizeRepeatRule(repeatRule.value) }));

function saveIntervalRange() {
  const range = A.normalizeIntervalRange(intervalMin.value, intervalMax.value);
  intervalMin.value = String(range.min);
  intervalMax.value = String(range.max);
  return save({
    [A.KEYS.searchIntervalMin]: range.min,
    [A.KEYS.searchIntervalMax]: range.max
  });
}
intervalMin.addEventListener("change", () => void saveIntervalRange());
intervalMax.addEventListener("change", () => void saveIntervalRange());
simulateTyping.addEventListener("change", () => save({ [A.KEYS.simulateTyping]: simulateTyping.checked }));
pauseWhenBusy.addEventListener("change", () => save({ [A.KEYS.pauseWhenBusy]: pauseWhenBusy.checked }));

scheduleTime.addEventListener("change", async () => {
  if (!scheduleEnabled.checked) {
    scheduleEnabled.checked = true;
  }
  const [hour, minute] = (scheduleTime.value || "21:30").split(":");
  await save({
    [A.KEYS.autoStartHour]: String(Number(hour)),
    [A.KEYS.autoStartMin]: String(Number(minute)),
    [A.triggeredKey()]: "false"
  });
});

todayGoal.addEventListener("change", () => send("SET_TODAY_GOAL", { goal: todayGoal.value }));
weekendGoal.addEventListener("change", () => save({ [A.KEYS.weekendGoal]: A.normalizeWeekendGoal(weekendGoal.value) }));
searchLimit.addEventListener("change", () => {
  const value = Math.max(1, Number(searchLimit.value) || A.DEFAULT_SEARCH_LIMIT);
  searchLimit.value = String(value);
  void save({ [A.KEYS.limitSearchCount]: value });
});
weekendSearchLimit.addEventListener("change", () => {
  const raw = String(weekendSearchLimit.value || "").trim();
  if (!raw) {
    weekendSearchLimit.value = "";
    void save({ [A.KEYS.weekendSearchLimit]: "" });
    return;
  }
  const value = Math.max(1, Number(raw) || A.DEFAULT_SEARCH_LIMIT);
  weekendSearchLimit.value = String(value);
  void save({ [A.KEYS.weekendSearchLimit]: value });
});
missedRemind.addEventListener("change", () => save({ [A.KEYS.missedRemindEnabled]: missedRemind.checked }));
notifyEnabled.addEventListener("change", () => save({ [A.KEYS.notifyEnabled]: notifyEnabled.checked }));
wordPack.addEventListener("change", async () => {
  await save({ [A.KEYS.selectedChannel]: wordPack.value });
  await send("REFRESH_KEYWORDS");
});
noGainLimit.addEventListener("change", () => {
  const value = Math.max(3, Number(noGainLimit.value) || A.DEFAULT_NO_GAIN_LIMIT);
  noGainLimit.value = String(value);
  void save({ [A.KEYS.maxNoGainLimit]: value });
});
dailyRetries.addEventListener("change", () => {
  const value = Math.max(1, Number(dailyRetries.value) || A.DEFAULT_DAILY_RETRIES);
  dailyRetries.value = String(value);
  void save({ [A.KEYS.dailyTaskMaxRetries]: value });
});
catchupEnabled.addEventListener("change", () => save({ [A.KEYS.catchUpEnabled]: catchupEnabled.checked }));
catchupAsk.addEventListener("change", () => save({ [A.KEYS.catchUpAsk]: catchupAsk.checked }));
function disableDangerSettings() {
  return save({
    [A.KEYS.dangerEnabled]: false,
    [A.KEYS.highRiskTasksEnabled]: false,
    [A.KEYS.quizAssistEnabled]: false,
    [A.KEYS.mobileSearchEnabled]: false
  });
}

dangerEnabled.addEventListener("change", async () => {
  if (dangerEnabled.checked) {
    dangerEnabled.checked = false;
    dangerConfirm.hidden = false;
    dangerBody.hidden = true;
    dangerAck.checked = false;
    dangerConfirmBtn.disabled = true;
    return;
  }
  dangerConfirm.hidden = true;
  dangerBody.hidden = true;
  await disableDangerSettings();
});
dangerAck.addEventListener("change", () => {
  dangerConfirmBtn.disabled = !dangerAck.checked;
});
dangerConfirmBtn.addEventListener("click", async () => {
  if (!dangerAck.checked) return;
  await save({ [A.KEYS.dangerEnabled]: true });
  dangerConfirm.hidden = true;
  dangerBody.hidden = false;
  dangerEnabled.checked = true;
});
document.getElementById("danger-cancel-btn").addEventListener("click", () => {
  dangerEnabled.checked = false;
  dangerAck.checked = false;
  dangerConfirmBtn.disabled = true;
  dangerConfirm.hidden = true;
  dangerBody.hidden = true;
});
highRiskEnabled.addEventListener("change", () => {
  if (!dangerEnabled.checked) {
    highRiskEnabled.checked = false;
    return;
  }
  void save({ [A.KEYS.highRiskTasksEnabled]: highRiskEnabled.checked });
});
quizAssist.addEventListener("change", () => {
  if (!dangerEnabled.checked) {
    quizAssist.checked = false;
    return;
  }
  void save({ [A.KEYS.quizAssistEnabled]: quizAssist.checked });
});
mobileEnabled.addEventListener("change", () => {
  if (!dangerEnabled.checked) {
    mobileEnabled.checked = false;
    return;
  }
  void save({ [A.KEYS.mobileSearchEnabled]: mobileEnabled.checked });
});
if (mobileLimit) {
  mobileLimit.addEventListener("change", () => {
    const value = Math.max(0, Math.round(Number(mobileLimit.value) || A.DEFAULT_MOBILE_LIMIT));
    mobileLimit.value = String(value);
    void save({ [A.KEYS.mobileSearchLimit]: value });
  });
}
if (mobileDoneBtn) {
  mobileDoneBtn.addEventListener("click", () => send("MARK_MOBILE_DONE"));
}
if (mobileUndoneBtn) {
  mobileUndoneBtn.addEventListener("click", () => send("UNMARK_MOBILE_DONE"));
}

document.getElementById("save-custom").addEventListener("click", async () => {
  await save({
    [A.KEYS.customKeywords]: customKeywords.value,
    [A.KEYS.selectedChannel]: A.WORD_PACK_CUSTOM
  });
  wordPack.value = A.WORD_PACK_CUSTOM;
  await send("REFRESH_KEYWORDS");
});
document.getElementById("refresh-keywords").addEventListener("click", () => send("REFRESH_KEYWORDS"));
document.getElementById("block-word-btn").addEventListener("click", async () => {
  const word = blockWord.value.trim();
  if (!word) return;
  await send("BLOCK_KEYWORD", { word });
  blockWord.value = "";
});
document.getElementById("export-logs").addEventListener("click", async () => {
  const result = await send("EXPORT_LOGS");
  const text = result && result.text ? result.text : "";
  const blob = new Blob([text || "还没有日志"], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bing-assistant-log-${A.localDateString()}.txt`;
  link.click();
  URL.revokeObjectURL(url);
});

function setBackupStatus(text) {
  const el = document.getElementById("backup-status");
  if (el) el.textContent = text || "";
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

document.getElementById("export-settings").addEventListener("click", async () => {
  try {
    const result = await send("EXPORT_SETTINGS");
    if (!result || !result.ok || !result.data) {
      setBackupStatus("导出失败，当前设置没有改动。");
      return;
    }
    downloadJson(`bing-assistant-settings-${A.localDateString()}.json`, result.data);
    setBackupStatus("已导出设置和词库。");
  } catch (_error) {
    setBackupStatus("导出失败，当前设置没有改动。");
  }
});

document.getElementById("import-settings").addEventListener("click", () => {
  document.getElementById("import-settings-file").click();
});

document.getElementById("import-settings-file").addEventListener("change", async (event) => {
  const input = event.target;
  const file = input.files && input.files[0];
  input.value = "";
  if (!file) return;
  if (!window.confirm("导入会覆盖当前设置和词库，积分和运行状态不会改。确定导入吗？")) {
    setBackupStatus("已取消导入，当前设置保持不变。");
    return;
  }
  try {
    const text = await file.text();
    const result = await send("IMPORT_SETTINGS", { payload: text });
    if (!result || !result.ok) {
      setBackupStatus((result && result.error) || "导入失败，当前设置没有改动。");
      return;
    }
    setBackupStatus("设置已导入。");
  } catch (_error) {
    setBackupStatus("导入失败，当前设置没有改动。");
  }
});

chrome.storage.onChanged.addListener(async (_changes, area) => {
  if (area !== "local") return;
  fill(await chrome.storage.local.get(null));
});

void chrome.storage.local.get(null).then(fill);
