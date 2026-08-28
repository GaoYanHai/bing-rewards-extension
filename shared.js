const BingAssistant = (() => {
  const PRODUCT_NAME_ZH = "Bing 积分助手";
  const PRODUCT_NAME_EN = "Bing Rewards Assistant";
  const SEARCH_URL = "https://www.bing.com/search?q=%E5%A4%A9%E6%B0%94%E9%A2%84%E6%8A%A5";
  const REWARDS_URL = "https://rewards.bing.com/";
  const ALARM_NAME = "rebang-daily-auto-start";
  const DEFAULT_SEARCH_LIMIT = 30;
  const DEFAULT_NO_GAIN_LIMIT = 10;
  const DEFAULT_DAILY_RETRIES = 3;
  const SUGGESTED_HOUR = 21;
  const SUGGESTED_MINUTE = 30;
  const WORD_PACK_SHORT = "日常短词";
  const WORD_PACK_LONG = "生活长尾";
  const LEGACY_CHANNELS = ["微博", "知乎", "百度", "抖音", "今日头条", "哔哩哔哩", "网易新闻", "腾讯新闻", "新浪新闻", "IT之家"];

  const KEYS = {
    autoSearchLock: "Rebang_AutoSearchLock",
    enableDailyTasks: "Rebang_EnableDailyTasks",
    maxNoGainLimit: "Rebang_MaxNoGainLimit",
    dailyTaskMaxRetries: "Rebang_DailyTaskMaxRetries",
    autoSearchLockExpires: "Rebang_AutoSearchLockExpires",
    consecutiveNoGain: "Rebang_ConsecutiveNoGainCount",
    lastPoints: "Rebang_LastPoints",
    autoStartHour: "Rebang_AutoStartHour",
    autoStartMin: "Rebang_AutoStartMin",
    limitSearchCount: "Rebang_LimitSearchCount",
    globalLastRunTime: "Rebang_GlobalLastRunTime",
    globalMasterTabId: "Rebang_GlobalMasterTabId",
    globalMasterStatus: "Rebang_GlobalMasterStatus",
    rewardsFailCount: "Rebang_RewardsFailCount",
    rewardsLastPoints: "Rebang_RewardsLastPoints",
    jumpFailCount: "Rebang_JumpFailCount",
    jumpLastPoints: "Rebang_JumpLastPoints",
    rewardsClickTime: "Rebang_RewardsClickTime",
    selectedChannel: "Rebang_SelectedChannel",
    currentKeywordIndex: "Rebang_CurrentKeywordIndex",
    lastCheckDate: "Rebang_LastCheckDate",
    riskAccepted: "Rebang_RiskAccepted",
    notifyEnabled: "Rebang_NotifyEnabled",
    runStartedAt: "Rebang_RunStartedAt",
    lastRunSummary: "Rebang_LastRunSummary",
    lastStatusMessage: "Rebang_LastStatusMessage",
    lastKeyword: "Rebang_LastKeyword",
    pointsBalance: "Rebang_PointsBalance",
    loginState: "Rebang_LoginState",
    productState: "Rebang_ProductState",
    lastError: "Rebang_LastError",
    recentLogs: "Rebang_RecentLogs",
    catchUpPrompted: "Rebang_CatchUpPrompted"
  };

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

  function dailyTasksDoneKey(date = new Date()) {
    return `Rebang_DailyTasksDone_${localDateString(date)}`;
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function parseHourMinute(hourValue, minuteValue) {
    const hour = Number.parseInt(hourValue, 10);
    const minute = Number.parseInt(minuteValue, 10);
    const enabled = Number.isInteger(hour) && hour >= 0 && hour <= 23 &&
      Number.isInteger(minute) && minute >= 0 && minute <= 59;
    return { enabled, hour: enabled ? hour : -1, minute: enabled ? minute : -1 };
  }

  function nextScheduledTime(hour, minute, now = new Date()) {
    const next = new Date(now);
    next.setHours(hour, minute, 0, 0);
    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  function formatClock(hour, minute) {
    return `${pad2(hour)}:${pad2(minute)}`;
  }

  function formatNextRunLabel(hour, minute, now = new Date()) {
    const schedule = parseHourMinute(hour, minute);
    if (!schedule.enabled) return "未设置";
    const next = nextScheduledTime(schedule.hour, schedule.minute, now);
    const today = localDateString(now);
    const nextDay = localDateString(next);
    const when = nextDay === today ? "今天" : "明天";
    return `${when} ${formatClock(schedule.hour, schedule.minute)}`;
  }

  function formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.round(Number(ms) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes <= 0) return `${seconds} 秒`;
    return `${minutes} 分 ${pad2(seconds)} 秒`;
  }

  function readNumber(store, key, fallback) {
    const value = Number(store[key]);
    return Number.isFinite(value) ? value : fallback;
  }

  function isLockOn(store) {
    return store[KEYS.autoSearchLock] === "on";
  }

  function normalizeWordPack(value) {
    if (value === WORD_PACK_LONG) return WORD_PACK_LONG;
    return WORD_PACK_SHORT;
  }

  function buildViewModel(store, now = new Date()) {
    const count = readNumber(store, dailyCountKey(now), 0);
    const limit = Math.max(1, readNumber(store, KEYS.limitSearchCount, DEFAULT_SEARCH_LIMIT));
    const dailyEnabled = store[KEYS.enableDailyTasks] === true;
    const dailyDone = store[dailyTasksDoneKey(now)] === true || store[dailyTasksDoneKey(now)] === "true";
    const loginState = store[KEYS.loginState] || "unknown";
    const running = isLockOn(store);
    const productState = store[KEYS.productState] || "";
    const riskAccepted = store[KEYS.riskAccepted] === true;
    const notifyEnabled = store[KEYS.notifyEnabled] !== false;
    const schedule = parseHourMinute(store[KEYS.autoStartHour], store[KEYS.autoStartMin]);
    const startedAt = readNumber(store, KEYS.runStartedAt, 0);
    const keyword = store[KEYS.lastKeyword] || "";
    const statusMessage = store[KEYS.lastStatusMessage] || "";
    const lastError = store[KEYS.lastError] || "";
    const points = store[KEYS.pointsBalance];
    const summary = store[KEYS.lastRunSummary] && typeof store[KEYS.lastRunSummary] === "object"
      ? store[KEYS.lastRunSummary]
      : null;

    let state = "ready";
    if (!riskAccepted) state = "onboarding";
    else if (loginState === "out") state = "logged_out";
    else if (running) state = "running";
    else if (productState === "failed" && count < limit) state = "failed";
    else if (count >= limit) state = "complete";
    else if (productState === "complete") state = "complete";
    else state = "ready";

    const elapsedMs = running && startedAt > 0 ? Math.max(0, now.getTime() - startedAt) : (summary?.durationMs || 0);

    return {
      state,
      riskAccepted,
      notifyEnabled,
      loginState,
      running,
      count,
      limit,
      dailyEnabled,
      dailyDone,
      schedule,
      nextRunLabel: formatNextRunLabel(store[KEYS.autoStartHour], store[KEYS.autoStartMin], now),
      keyword,
      statusMessage,
      lastError,
      points: Number.isFinite(Number(points)) ? Number(points) : null,
      startedAt,
      elapsedMs,
      summary,
      wordPack: normalizeWordPack(store[KEYS.selectedChannel]),
      noGainLimit: readNumber(store, KEYS.maxNoGainLimit, DEFAULT_NO_GAIN_LIMIT),
      dailyRetries: readNumber(store, KEYS.dailyTaskMaxRetries, DEFAULT_DAILY_RETRIES)
    };
  }

  function suggestedTimeLabel() {
    return `今晚 ${formatClock(SUGGESTED_HOUR, SUGGESTED_MINUTE)}`;
  }

  return {
    PRODUCT_NAME_ZH,
    PRODUCT_NAME_EN,
    SEARCH_URL,
    REWARDS_URL,
    ALARM_NAME,
    DEFAULT_SEARCH_LIMIT,
    DEFAULT_NO_GAIN_LIMIT,
    DEFAULT_DAILY_RETRIES,
    SUGGESTED_HOUR,
    SUGGESTED_MINUTE,
    WORD_PACK_SHORT,
    WORD_PACK_LONG,
    LEGACY_CHANNELS,
    KEYS,
    localDateString,
    dailyCountKey,
    triggeredKey,
    dailyTasksDoneKey,
    pad2,
    parseHourMinute,
    nextScheduledTime,
    formatClock,
    formatNextRunLabel,
    formatDuration,
    readNumber,
    isLockOn,
    normalizeWordPack,
    buildViewModel,
    suggestedTimeLabel
  };
})();

if (typeof globalThis !== "undefined") {
  globalThis.BingAssistant = BingAssistant;
}
