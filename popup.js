"use strict";

const A = BingAssistant;

const viewRisk = document.getElementById("view-risk");
const viewMain = document.getElementById("view-main");
const riskCheck = document.getElementById("risk-check");
const riskAccept = document.getElementById("risk-accept");
const accountLine = document.getElementById("account-line");
const stateLine = document.getElementById("state-line");
const stat1Label = document.getElementById("stat-1-label");
const stat1Value = document.getElementById("stat-1-value");
const stat2Label = document.getElementById("stat-2-label");
const stat2Value = document.getElementById("stat-2-value");
const stat3Label = document.getElementById("stat-3-label");
const stat3Value = document.getElementById("stat-3-value");
const progressBar = document.getElementById("progress-bar");
const primaryBtn = document.getElementById("primary-btn");
const hint = document.getElementById("hint");
const logBox = document.getElementById("log-box");

function send(type, extra = {}) {
  return chrome.runtime.sendMessage({ type, ...extra });
}

function renderLogs(model) {
  const logs = (model.logs || []).slice(0, 6);
  if (!logs.length) {
    logBox.hidden = true;
    logBox.innerHTML = "";
    return;
  }
  logBox.hidden = false;
  logBox.innerHTML = logs.map((entry) => `<div>${escapeHtml(A.formatLogLine(entry))}</div>`).join("");
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function render(store) {
  const model = A.buildViewModel(store);
  const showRisk = !model.riskAccepted;
  viewRisk.hidden = !showRisk;
  viewMain.hidden = showRisk;
  if (showRisk) return;

  if (model.points !== null) {
    accountLine.textContent = model.loginState === "out"
      ? "还没有检测到微软账号"
      : `当前积分 ${model.points}`;
  } else if (model.loginState === "out") {
    accountLine.textContent = "还没有检测到微软账号";
  } else {
    accountLine.textContent = "打开 Bing 后会显示账号积分";
  }

  stat1Label.textContent = "电脑搜索";
  stat1Value.textContent = `${model.count}/${model.limit}`;
  stat2Label.textContent = "每日活动";
  stat2Value.textContent = model.dailyProgress;

  const percent = Math.min(100, Math.round((model.count / model.limit) * 100));
  progressBar.style.width = `${percent}%`;
  primaryBtn.classList.toggle("stop", model.state === "running");
  primaryBtn.disabled = false;
  renderLogs(model);

  if (model.state === "logged_out") {
    stateLine.textContent = "还没有检测到微软账号";
    stat3Label.textContent = "下一步";
    stat3Value.textContent = "登录后才能记录积分";
    primaryBtn.textContent = "打开 Bing 并登录";
    hint.textContent = "登录微软账号后，再回来开始今天的任务。";
    primaryBtn.dataset.action = "login";
    return;
  }

  if (model.state === "running") {
    if (model.count >= model.limit && model.dailyEnabled) {
      stateLine.textContent = model.waitingTask
        ? `需要你点一下：${model.waitingTask.name || "每日活动"}`
        : "正在处理每日活动";
      stat3Label.textContent = "当前活动";
      stat3Value.textContent = model.waitingTask?.name || model.keyword || "读取任务清单";
    } else {
      stateLine.textContent = `正在搜索 ${model.count}/${model.limit}`;
      stat3Label.textContent = "当前搜索";
      stat3Value.textContent = model.keyword || "准备中";
    }
    primaryBtn.textContent = "停止";
    hint.textContent = model.statusMessage || "正在模拟常规搜索，间隔 8-14 秒。";
    if (model.elapsedMs > 0) {
      hint.textContent = `已用时 ${A.formatDuration(model.elapsedMs)}。${hint.textContent}`;
    }
    primaryBtn.dataset.action = "stop";
    return;
  }

  if (model.state === "complete") {
    const duration = model.summary?.durationMs || model.elapsedMs;
    stateLine.textContent = model.dailyEnabled ? "今天的任务已完成" : "今天的电脑搜索已完成";
    stat3Label.textContent = "用时";
    stat3Value.textContent = duration ? A.formatDuration(duration) : "已完成";
    primaryBtn.textContent = "打开 Bing";
    hint.textContent = model.dailyEnabled
      ? (model.dailyDone || model.dailySummary.autoPending === 0
        ? (model.dailySummary.manual > 0 ? `还有 ${model.dailySummary.manual} 个活动需要你点一下。` : "每日活动已处理。")
        : "每日活动仍待处理。")
      : "未处理每日活动（安全模式已开）";
    primaryBtn.dataset.action = "open";
    return;
  }

  if (model.state === "failed") {
    stateLine.textContent = "这次没有完成，已停止";
    stat3Label.textContent = "原因";
    stat3Value.textContent = model.failShort || "已停止";
    primaryBtn.textContent = model.failReasonCode === A.FAIL_CODES.LOGIN ? "打开 Bing 并登录" : "重试";
    hint.textContent = model.failMessage || model.failNext || "请确认已登录微软账号，然后重试。";
    primaryBtn.dataset.action = model.failReasonCode === A.FAIL_CODES.LOGIN ? "login" : "start";
    return;
  }

  stateLine.textContent = model.count > 0 ? "今天还没做完" : "今天还没开始";
  stat3Label.textContent = "下次自动开始";
  stat3Value.textContent = model.schedule.enabled ? model.nextRunLabel : `未设置，建议${A.suggestedTimeLabel()}`;
  primaryBtn.textContent = "开始今日任务";
  hint.textContent = model.dailyEnabled
    ? `今日目标：${model.goalLabel}。完整电脑搜索大约 6-10 分钟。`
    : "完整电脑搜索大约 6-10 分钟，期间请保持浏览器运行。";
  primaryBtn.dataset.action = "start";
}

async function refresh() {
  const store = await chrome.storage.local.get(null);
  render(store);
}

riskCheck.addEventListener("change", () => {
  riskAccept.disabled = !riskCheck.checked;
});

riskAccept.addEventListener("click", async () => {
  if (!riskCheck.checked) return;
  await send("ACCEPT_RISK");
  await refresh();
});

primaryBtn.addEventListener("click", async () => {
  const action = primaryBtn.dataset.action;
  if (action === "stop") await send("STOP_TODAY");
  else if (action === "login" || action === "open") await send("OPEN_BING");
  else await send("START_TODAY");
  await refresh();
});

document.getElementById("open-options").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
document.getElementById("open-bing").addEventListener("click", () => send("OPEN_BING"));
document.getElementById("open-help").addEventListener("click", () => chrome.runtime.openOptionsPage());

chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "local") void refresh();
});

void refresh();
