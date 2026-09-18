"use strict";

const A = BingAssistant;
const scheduleEnabled = document.getElementById("schedule-enabled");
const scheduleTime = document.getElementById("schedule-time");
const nextRun = document.getElementById("next-run");
const todayGoal = document.getElementById("today-goal");
const weekendGoal = document.getElementById("weekend-goal");
const searchLimit = document.getElementById("search-limit");
const weekendSearchLimit = document.getElementById("weekend-search-limit");
const missedRemind = document.getElementById("missed-remind");
const notifyEnabled = document.getElementById("notify-enabled");
const wordPack = document.getElementById("word-pack");
const weekendWordPack = document.getElementById("weekend-word-pack");
const customKeywords = document.getElementById("custom-keywords");
const keywordNote = document.getElementById("keyword-note");
const todayWords = document.getElementById("today-words");
const blockWord = document.getElementById("block-word");
const blockedWords = document.getElementById("blocked-words");
const logList = document.getElementById("log-list");
const logDate = document.getElementById("log-date");
let selectedLogDate = "";
const noGainLimit = document.getElementById("no-gain-limit");
const dailyRetries = document.getElementById("daily-retries");
const catchupEnabled = document.getElementById("catchup-enabled");
const catchupAsk = document.getElementById("catchup-ask");
const mobileEnabled = document.getElementById("mobile-enabled");
const mobileLimit = document.getElementById("mobile-limit");
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
  return A.sendMessage(type, extra);
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

function isEditing(el) {
  return !!(el && document.activeElement === el);
}

function setIfIdle(el, value, asCheckbox) {
  if (!el || isEditing(el)) return;
  if (asCheckbox) {
    const next = !!value;
    if (el.checked !== next) el.checked = next;
    return;
  }
  const next = value == null ? "" : String(value);
  if (el.value !== next) el.value = next;
}

function commitNumber(el, key, min, max, fallback) {
  if (!el) return;
  const value = A.clampInt(el.value, min, max, fallback);
  el.value = String(value);
  return save({ [key]: value });
}

function renderMonthChart(model) {
  const chart = model.monthChart || A.buildMonthChartModel({});
  const summary = document.getElementById("chart-summary");
  const grid = document.getElementById("month-status");
  const bars = document.getElementById("month-chart");
  if (summary) summary.textContent = chart.summary || "还没有 30 天记录";
  if (grid) {
    grid.innerHTML = (chart.days || []).map((cell) => {
      return `<div class="month-cell ${escapeHtml(cell.status)}" title="${escapeHtml(cell.title)}"><span>${escapeHtml(String(cell.day))}</span></div>`;
    }).join("");
  }
  if (bars) {
    const hasGain = chart.hasTodayGain === true || (chart.bars || []).some((item) => item.date === A.localDateString() && Number(item.value) > 0);
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
  setIfIdle(scheduleEnabled, model.schedule.enabled, true);
  setIfIdle(
    scheduleTime,
    A.formatClock(model.schedule.rememberedHour, model.schedule.rememberedMinute)
  );
  nextRun.textContent = model.schedule.enabled
    ? `下次启动：${model.nextRunLabel}`
    : `下次启动：未设置，建议${A.suggestedTimeLabel()}`;
  setIfIdle(todayGoal, model.weekdayGoal || model.goal);
  setIfIdle(weekendGoal, model.weekendGoal || A.WEEKEND_GOAL_SAME);
  setIfIdle(searchLimit, model.weekdayLimit || model.limit);
  setIfIdle(weekendSearchLimit, model.weekendSearchLimit === "" || model.weekendSearchLimit == null ? "" : model.weekendSearchLimit);
  setIfIdle(missedRemind, model.missedRemindEnabled, true);
  setIfIdle(notifyEnabled, model.notifyEnabled, true);
  const copy = model.whatsNew || A.whatsNewCopy();
  const titleEl = document.getElementById("whats-new-title");
  const pointsEl = document.getElementById("whats-new-points");
  if (titleEl) titleEl.textContent = copy.title;
  if (pointsEl) pointsEl.innerHTML = (copy.points || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  setIfIdle(wordPack, model.wordPack);
  if (weekendWordPack) setIfIdle(weekendWordPack, model.weekendWordPack || A.WEEKEND_WORD_PACK_SAME);
  setIfIdle(customKeywords, model.customKeywords);
  setIfIdle(noGainLimit, model.noGainLimit);
  setIfIdle(dailyRetries, model.dailyRetries);
  setIfIdle(catchupEnabled, model.catchUpEnabled, true);
  setIfIdle(catchupAsk, model.catchUpAsk, true);
  setIfIdle(dangerEnabled, model.dangerEnabled, true);
  if (model.dangerEnabled) {
    dangerConfirm.hidden = true;
    dangerAck.checked = false;
    dangerConfirmBtn.disabled = true;
    dangerBody.hidden = false;
  } else if (dangerConfirm.hidden) {
    dangerBody.hidden = true;
  }
  setIfIdle(highRiskEnabled, model.highRiskTasksEnabled, true);
  setIfIdle(quizAssist, model.quizAssistEnabled, true);
  setIfIdle(mobileEnabled, model.mobileEnabled, true);
  setIfIdle(repeatRule, model.repeatRule);
  setIfIdle(intervalMin, model.intervalMin);
  setIfIdle(intervalMax, model.intervalMax);
  setIfIdle(simulateTyping, model.simulateTyping, true);
  setIfIdle(pauseWhenBusy, model.pauseWhenBusy, true);
  if (mobileLimit) setIfIdle(mobileLimit, A.readNumber(store, A.KEYS.mobileSearchLimit, A.DEFAULT_MOBILE_LIMIT));
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
  const today = A.localDateString();
  selectedLogDate = A.clampLogDate(selectedLogDate || today);
  if (logDate && !isEditing(logDate)) {
    const choices = A.logDateChoices();
    const html = choices.map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join("");
    if (logDate.innerHTML !== html) logDate.innerHTML = html;
    if (logDate.value !== selectedLogDate) logDate.value = selectedLogDate;
  }
  const logs = A.logsForDate(store[A.KEYS.runLogs], selectedLogDate);
  logList.innerHTML = logs.length
    ? logs.map((entry) => `<div>${escapeHtml(A.formatLogLine(entry))}</div>`).join("")
    : (selectedLogDate === today ? "还没有今天的日志。" : "这天还没有日志。");
}

async function save(partial) {
  await A.Storage.set(partial);
}

function readScheduleInput() {
  const [hour, minute] = String(scheduleTime.value || "").split(":");
  const parsed = A.parseHourMinute(hour, minute);
  if (parsed.enabled) return parsed;
  return { enabled: false, hour: A.SUGGESTED_HOUR, minute: A.SUGGESTED_MINUTE };
}

async function saveSchedulePatch(enabled, parsed) {
  let next = parsed;
  if (!parsed.enabled) {
    next = A.rememberedSchedule(await A.Storage.get([
      A.KEYS.autoStartHour,
      A.KEYS.autoStartMin,
      A.KEYS.lastAutoStartHour,
      A.KEYS.lastAutoStartMin
    ]));
  }
  const hour = String(next.hour);
  const minute = String(next.minute);
  const patch = {
    [A.triggeredKey()]: "false"
  };
  if (enabled) {
    patch[A.KEYS.autoStartHour] = hour;
    patch[A.KEYS.autoStartMin] = minute;
    patch[A.KEYS.lastAutoStartHour] = hour;
    patch[A.KEYS.lastAutoStartMin] = minute;
  } else {
    patch[A.KEYS.autoStartHour] = "-1";
    patch[A.KEYS.autoStartMin] = "-1";
    if (parsed.enabled || next.enabled) {
      patch[A.KEYS.lastAutoStartHour] = hour;
      patch[A.KEYS.lastAutoStartMin] = minute;
    }
  }
  return save(patch);
}

scheduleEnabled.addEventListener("change", async () => {
  await saveSchedulePatch(scheduleEnabled.checked, readScheduleInput());
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
  await saveSchedulePatch(true, readScheduleInput());
});

todayGoal.addEventListener("change", () => send("SET_TODAY_GOAL", { goal: todayGoal.value }));
weekendGoal.addEventListener("change", () => save({ [A.KEYS.weekendGoal]: A.normalizeWeekendGoal(weekendGoal.value) }));
searchLimit.addEventListener("change", () => {
  void commitNumber(searchLimit, A.KEYS.limitSearchCount, A.SEARCH_LIMIT_MIN, A.SEARCH_LIMIT_MAX, A.DEFAULT_SEARCH_LIMIT);
});
weekendSearchLimit.addEventListener("change", () => {
  const raw = String(weekendSearchLimit.value || "").trim();
  if (!raw) {
    weekendSearchLimit.value = "";
    void save({ [A.KEYS.weekendSearchLimit]: "" });
    return;
  }
  const num = Number(raw);
  const value = A.clampInt(num, A.SEARCH_LIMIT_MIN, A.SEARCH_LIMIT_MAX, A.DEFAULT_SEARCH_LIMIT);
  weekendSearchLimit.value = String(value);
  void save({ [A.KEYS.weekendSearchLimit]: value });
});
missedRemind.addEventListener("change", () => save({ [A.KEYS.missedRemindEnabled]: missedRemind.checked }));
notifyEnabled.addEventListener("change", () => save({ [A.KEYS.notifyEnabled]: notifyEnabled.checked }));
wordPack.addEventListener("change", async () => {
  await save({ [A.KEYS.selectedChannel]: wordPack.value });
  await send("REFRESH_KEYWORDS");
});
if (weekendWordPack) {
  weekendWordPack.addEventListener("change", async () => {
    await save({ [A.KEYS.weekendWordPack]: A.normalizeWeekendWordPack(weekendWordPack.value) });
    await send("REFRESH_KEYWORDS");
  });
}
noGainLimit.addEventListener("change", () => {
  void commitNumber(noGainLimit, A.KEYS.maxNoGainLimit, A.NO_GAIN_LIMIT_MIN, A.NO_GAIN_LIMIT_MAX, A.DEFAULT_NO_GAIN_LIMIT);
});
dailyRetries.addEventListener("change", () => {
  void commitNumber(dailyRetries, A.KEYS.dailyTaskMaxRetries, A.DAILY_RETRIES_MIN, A.DAILY_RETRIES_MAX, A.DEFAULT_DAILY_RETRIES);
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
    void commitNumber(mobileLimit, A.KEYS.mobileSearchLimit, A.MOBILE_LIMIT_MIN, A.MOBILE_LIMIT_MAX, A.DEFAULT_MOBILE_LIMIT);
  });
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
if (logDate) {
  logDate.addEventListener("change", () => {
    selectedLogDate = A.clampLogDate(logDate.value);
    return A.Storage.getAll().then(fill);
  });
}

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
  fill(await A.Storage.getAll());
});

const pageNav = document.querySelector(".page-nav");
const settingsSections = Array.from(document.querySelectorAll("main section[id]"));
const settingsLinks = Array.from(document.querySelectorAll(".page-nav a[href^='#']"));
const linkedSections = settingsSections.filter((section) => {
  return settingsLinks.some((link) => link.hash === `#${section.id}`);
});

let pinnedNavId = "";
let navTick = 0;
let programmaticNavScroll = false;

function navOffset() {
  const height = pageNav ? pageNav.getBoundingClientRect().height : 56;
  return Math.max(48, Math.ceil(height + 10));
}

function applyNavOffset() {
  const offset = navOffset();
  document.documentElement.style.scrollPaddingTop = "0px";
  document.documentElement.style.setProperty("--nav-offset", `${offset}px`);
  linkedSections.forEach((section) => {
    section.style.scrollMarginTop = `${offset}px`;
  });
  return offset;
}

function setActiveNav(id) {
  settingsLinks.forEach((link) => link.classList.toggle("active", link.hash === `#${id}`));
}

function currentSectionId() {
  const marker = applyNavOffset() + 32;
  let current = linkedSections[0];
  linkedSections.forEach((section) => {
    if (section.getBoundingClientRect().top <= marker) current = section;
  });
  return current && current.id;
}

function syncSettingsNav() {
  if (pinnedNavId) {
    setActiveNav(pinnedNavId);
    return;
  }
  setActiveNav(currentSectionId());
}

function requestNavSync() {
  if (navTick) return;
  navTick = window.requestAnimationFrame(() => {
    navTick = 0;
    syncSettingsNav();
  });
}

function releasePinnedNav() {
  if (!pinnedNavId) return;
  pinnedNavId = "";
  syncSettingsNav();
}

function pinNav(id) {
  pinnedNavId = id;
  setActiveNav(id);
}

function sectionScrollTop(id) {
  const section = document.getElementById(id);
  if (!section) return null;
  const offset = applyNavOffset();
  const scroller = document.scrollingElement || document.documentElement;
  return Math.max(0, Math.round(scroller.scrollTop + section.getBoundingClientRect().top - offset));
}

function scrollToSection(id, behavior) {
  const top = sectionScrollTop(id);
  if (top == null) return;
  const scroller = document.scrollingElement || document.documentElement;
  if (Math.abs(scroller.scrollTop - top) < 2) return;
  programmaticNavScroll = true;
  if (behavior === "instant") scroller.scrollTop = top;
  else scroller.scrollTo({ top, behavior: "smooth" });
}

function goToSection(id) {
  if (!id || !document.getElementById(id)) return false;
  pinNav(id);
  scrollToSection(id);
  return true;
}

settingsLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = (link.hash || "").replace("#", "");
    event.preventDefault();
    if (!goToSection(id)) return;
    if (history.replaceState) history.replaceState(null, "", `#${id}`);
  });
});
window.addEventListener("scroll", requestNavSync, { passive: true });
window.addEventListener("scrollend", () => {
  if (programmaticNavScroll) {
    programmaticNavScroll = false;
    if (pinnedNavId) scrollToSection(pinnedNavId, "instant");
    return;
  }
  releasePinnedNav();
}, { passive: true });
window.addEventListener("wheel", releasePinnedNav, { passive: true });
window.addEventListener("touchmove", releasePinnedNav, { passive: true });
window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) {
    releasePinnedNav();
  }
});
window.addEventListener("resize", () => {
  applyNavOffset();
  if (pinnedNavId) scrollToSection(pinnedNavId);
  else requestNavSync();
});
window.addEventListener("hashchange", () => {
  const id = (location.hash || "").replace("#", "");
  if (!goToSection(id)) syncSettingsNav();
});
applyNavOffset();
syncSettingsNav();
if (location.hash) {
  window.setTimeout(() => goToSection(location.hash.replace("#", "")), 0);
}

void A.Storage.getAll().then((store) => {
  fill(store);
  const id = pinnedNavId || (location.hash || "").replace("#", "");
  if (id) goToSection(id);
  else requestNavSync();
});
