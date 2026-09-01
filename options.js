"use strict";

const A = BingAssistant;
const scheduleEnabled = document.getElementById("schedule-enabled");
const scheduleTime = document.getElementById("schedule-time");
const nextRun = document.getElementById("next-run");
const todayGoal = document.getElementById("today-goal");
const searchLimit = document.getElementById("search-limit");
const mobileQuota = document.getElementById("mobile-quota");
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

function fill(store) {
  const model = A.buildViewModel(store);
  scheduleEnabled.checked = model.schedule.enabled;
  scheduleTime.value = model.schedule.enabled
    ? A.formatClock(model.schedule.hour, model.schedule.minute)
    : `${A.pad2(A.SUGGESTED_HOUR)}:${A.pad2(A.SUGGESTED_MINUTE)}`;
  nextRun.textContent = model.schedule.enabled
    ? `下次启动：${model.nextRunLabel}`
    : `下次启动：未设置，建议${A.suggestedTimeLabel()}`;
  todayGoal.value = model.goal;
  searchLimit.value = String(model.limit);
  notifyEnabled.checked = model.notifyEnabled;
  wordPack.value = model.wordPack;
  customKeywords.value = model.customKeywords;
  noGainLimit.value = String(model.noGainLimit);
  dailyRetries.value = String(model.dailyRetries);
  catchupEnabled.checked = model.catchUpEnabled;
  catchupAsk.checked = model.catchUpAsk;
  mobileEnabled.checked = model.mobileEnabled;
  repeatRule.value = model.repeatRule;
  intervalMin.value = String(model.intervalMin);
  intervalMax.value = String(model.intervalMax);
  simulateTyping.checked = model.simulateTyping;
  pauseWhenBusy.checked = model.pauseWhenBusy;
  mobileQuota.textContent = model.mobileEnabled
    ? `${model.mobileCount}/${model.mobileLimit}（执行未启用）`
    : "未启用";
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
searchLimit.addEventListener("change", () => {
  const value = Math.max(1, Number(searchLimit.value) || A.DEFAULT_SEARCH_LIMIT);
  searchLimit.value = String(value);
  void save({ [A.KEYS.limitSearchCount]: value });
});
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
mobileEnabled.addEventListener("change", () => save({ [A.KEYS.mobileSearchEnabled]: mobileEnabled.checked }));

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

chrome.storage.onChanged.addListener(async (_changes, area) => {
  if (area !== "local") return;
  fill(await chrome.storage.local.get(null));
});

void chrome.storage.local.get(null).then(fill);
