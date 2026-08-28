"use strict";

const A = BingAssistant;
const scheduleEnabled = document.getElementById("schedule-enabled");
const scheduleTime = document.getElementById("schedule-time");
const nextRun = document.getElementById("next-run");
const searchLimit = document.getElementById("search-limit");
const dailyTasks = document.getElementById("daily-tasks");
const notifyEnabled = document.getElementById("notify-enabled");
const wordPack = document.getElementById("word-pack");
const noGainLimit = document.getElementById("no-gain-limit");
const dailyRetries = document.getElementById("daily-retries");

function fill(store) {
  const model = A.buildViewModel(store);
  scheduleEnabled.checked = model.schedule.enabled;
  scheduleTime.value = model.schedule.enabled
    ? A.formatClock(model.schedule.hour, model.schedule.minute)
    : `${A.pad2(A.SUGGESTED_HOUR)}:${A.pad2(A.SUGGESTED_MINUTE)}`;
  nextRun.textContent = model.schedule.enabled
    ? `下次启动：${model.nextRunLabel}`
    : `下次启动：未设置，建议${A.suggestedTimeLabel()}`;
  searchLimit.value = String(model.limit);
  dailyTasks.checked = model.dailyEnabled;
  notifyEnabled.checked = model.notifyEnabled;
  wordPack.value = model.wordPack;
  noGainLimit.value = String(model.noGainLimit);
  dailyRetries.value = String(model.dailyRetries);
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

searchLimit.addEventListener("change", () => {
  const value = Math.max(1, Number(searchLimit.value) || A.DEFAULT_SEARCH_LIMIT);
  searchLimit.value = String(value);
  void save({ [A.KEYS.limitSearchCount]: value });
});
dailyTasks.addEventListener("change", () => save({ [A.KEYS.enableDailyTasks]: dailyTasks.checked }));
notifyEnabled.addEventListener("change", () => save({ [A.KEYS.notifyEnabled]: notifyEnabled.checked }));
wordPack.addEventListener("change", () => save({ [A.KEYS.selectedChannel]: wordPack.value }));
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

chrome.storage.onChanged.addListener(async (_changes, area) => {
  if (area !== "local") return;
  fill(await chrome.storage.local.get(null));
});

void chrome.storage.local.get(null).then(fill);
