const BingAssistant = (() => {
  const PRODUCT_NAME_ZH = "Bing 积分助手";
  const PRODUCT_NAME_EN = "Bing Rewards Assistant";
  const SEARCH_URL = "https://www.bing.com/search?q=%E5%A4%A9%E6%B0%94%E9%A2%84%E6%8A%A5";
  const MOBILE_SEARCH_FLAG = "rebn";
  const REWARDS_URL = "https://rewards.bing.com/";
  const MOBILE_UA = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
  const MOBILE_SEC_CH_UA = '"Chromium";v="124", "Not.A/Brand";v="24", "Google Chrome";v="124"';
  const MOBILE_UA_RULE_ID = 24031;
  const ALARM_NAME = "rebang-daily-auto-start";
  const DEFAULT_SEARCH_LIMIT = 30;
  const DEFAULT_NO_GAIN_LIMIT = 10;
  const DEFAULT_DAILY_RETRIES = 3;
  const DEFAULT_MOBILE_LIMIT = 20;
  const SUGGESTED_HOUR = 21;
  const SUGGESTED_MINUTE = 30;
  const MIN_SEARCH_INTERVAL = 8;
  const MAX_SEARCH_INTERVAL = 60;
  const DEFAULT_INTERVAL_MIN = 8;
  const DEFAULT_INTERVAL_MAX = 14;
  const PRODUCT_VERSION = "2.5.0";
  const DAY_RECORD_KEEP_DAYS = 35;
  const DAY_RECORD_SHOW_DAYS = 7;
  const DAY_CHART_DAYS = 30;
  const WEEKEND_GOAL_SAME = "same";
  const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const WORD_PACK_SHORT = "日常短词";
  const WORD_PACK_LONG = "生活长尾";
  const WORD_PACK_CUSTOM = "自定义";
  const LEGACY_CHANNELS = ["微博", "知乎", "百度", "抖音", "今日头条", "哔哩哔哩", "网易新闻", "腾讯新闻", "新浪新闻", "IT之家"];
  const KEYWORD_NOTE = "今日词库已生成 · 基于本地词包 · 未使用热榜";

  const GOALS = {
    SEARCH_ONLY: "search_only",
    SEARCH_SAFE: "search_safe",
    TRY_ALL: "try_all"
  };

  const GOAL_LABELS = {
    search_only: "只搜满",
    search_safe: "搜满 + 安全任务",
    try_all: "尽量全做"
  };

  const REPEAT = {
    DAILY: "daily",
    WEEKDAYS: "weekdays",
    WEEKENDS: "weekends"
  };

  const REPEAT_LABELS = {
    daily: "每天",
    weekdays: "仅工作日",
    weekends: "仅周末"
  };

  const PAUSE_REASONS = {
    USER: "user",
    BUSY: "busy",
    MOBILE_TAB: "mobile_tab"
  };

  const FAIL_CODES = {
    LOGIN: "login",
    NO_GAIN: "no_gain",
    RISK: "risk",
    PAGE_CHANGED: "page_changed",
    NETWORK: "network",
    STOPPED: "stopped",
    MOBILE_NO_GAIN: "mobile_no_gain",
    MOBILE_POINTS: "mobile_points",
    MOBILE_HEADER: "mobile_header"
  };
  const QUIZ_ASSIST_MAX_HITS = 6;

  const TASK_STATUS = {
    AUTO: "auto",
    MANUAL: "manual",
    DONE: "done",
    SKIPPED: "skipped",
    UNKNOWN: "unknown"
  };

  const TASK_KIND = {
    EXPLORE: "explore",
    QUIZ: "quiz",
    VOTE: "vote",
    INSTALL: "install",
    SHOP: "shop",
    SURVEY: "survey",
    DOWNLOAD: "download",
    UNKNOWN: "unknown"
  };

  const TASK_SELECTORS = {
    cards: "mee-card, mee-rewards-daily-set-item-content, .c-card-content, .rewards-card",
    completed: ".mee-icon-SkypeCircleCheck, .c-glyph.glyph-check, i[class*='check'], [aria-label*='Completed'], [aria-label*='已完成']",
    locked: ".locked-card, .mee-icon-Lock, [aria-label*='Locked']",
    link: "a[href]",
    title: ".title, h3, .c-subheading, .ds-card-title, p.offer-title, .c-title",
    dashboard: "mee-rewards-daily-set-section, mee-card-group, #more-activities, .rewards-content",
    quizPage: "#rqStartQuiz, .rqQuestion, .rqQ, .wk_Circle, .TriviaOverlayData, mee-rewards-quiz, [data-bi-id*='quiz'], [data-bi-id*='trivia'], .quizContainer, #quizCompleteContainer",
    votePage: ".bt_poll, [data-bi-id*='poll'], [data-bi-id*='thisorthat']"
  };

  const QUOTA_SELECTORS = {
    cards: "mee-card, mee-rewards-daily-set-item-content, .c-card-content, .rewards-card, mee-rewards-point-breakdown, .pointsBreakdown, .pointsBreakdownCard, [class*='pointsBreakdown']",
    breakdown: "#pointsBreakdown, .pointsBreakdown, mee-rewards-points-breakdown, .points-breakdown, mee-rewards-user-status-banner, [class*='points-breakdown']",
    dailySection: "mee-rewards-daily-set-section, #daily-sets, .daily-set-section, [id*='dailySet'], [id*='daily-set']",
    labeled: "[aria-label*='search' i], [aria-label*='Search'], [aria-label*='搜索'], [aria-label*='Daily'], [aria-label*='每日']",
    quizCount: ".rqQ, .rqQuestion, .wk_Circle, .TriviaOverlayData li, [aria-label*='Question']"
  };

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
    catchUpPrompted: "Rebang_CatchUpPrompted",
    todayGoal: "Rebang_TodayGoal",
    customKeywords: "Rebang_CustomKeywords",
    blockedKeywords: "Rebang_BlockedKeywords",
    dailyKeywordPlan: "Rebang_DailyKeywordPlan",
    keywordShuffle: "Rebang_KeywordShuffle",
    runLogs: "Rebang_RunLogs",
    failReasonCode: "Rebang_FailReasonCode",
    taskList: "Rebang_TaskList",
    waitingUserTask: "Rebang_WaitingUserTask",
    mobileSearchEnabled: "Rebang_MobileSearchEnabled",
    mobileSearchLimit: "Rebang_MobileSearchLimit",
    catchUpEnabled: "Rebang_CatchUpEnabled",
    catchUpAsk: "Rebang_CatchUpAsk",
    quizAssistEnabled: "Rebang_QuizAssistEnabled",
    dangerEnabled: "Rebang_DangerEnabled",
    highRiskTasksEnabled: "Rebang_HighRiskTasksEnabled",
    paused: "Rebang_Paused",
    pauseReason: "Rebang_PauseReason",
    searchIntervalMin: "Rebang_SearchIntervalMin",
    searchIntervalMax: "Rebang_SearchIntervalMax",
    simulateTyping: "Rebang_SimulateTyping",
    pauseWhenBusy: "Rebang_PauseWhenBusy",
    repeatRule: "Rebang_RepeatRule",
    runStartPoints: "Rebang_RunStartPoints",
    userTaskAction: "Rebang_UserTaskAction",
    userTaskConfirmTries: "Rebang_UserTaskConfirmTries",
    ignoreBusyUntil: "Rebang_IgnoreBusyUntil",
    dayRecords: "Rebang_DayRecords",
    weekendGoal: "Rebang_WeekendGoal",
    weekendSearchLimit: "Rebang_WeekendSearchLimit",
    missedRemindEnabled: "Rebang_MissedRemindEnabled",
    missedReminded: "Rebang_MissedReminded",
    catchUpDismissed: "Rebang_CatchUpDismissed",
    whatsNewSeen: "Rebang_WhatsNewSeen",
    quotaSnapshot: "Rebang_QuotaSnapshot",
    mobileDoneDate: "Rebang_MobileDoneDate",
    searchPhase: "Rebang_SearchPhase",
    mobileSearchTabId: "Rebang_MobileSearchTabId",
    pointsHistory: "Rebang_PointsHistory"
  };

  const SHORT_KEYWORD_POOL = [
    "天气", "新闻", "外卖", "小说", "基金", "篮球", "足球",
    "天气预报", "今日新闻", "翻译", "地图", "汇率查询", "股票行情", "快递查询", "家常菜谱",
    "电影票", "火车票", "今日油价", "手机推荐", "笔记本电脑", "无线耳机", "数码相机",
    "健身计划", "减肥方法", "护肤步骤", "穿搭灵感", "旅游攻略", "酒店预订", "机票查询",
    "世界杯", "足球比分", "NBA赛况", "编程入门", "英语单词", "历史故事", "物理科普",
    "基金入门", "保险知识", "理财方法", "咖啡做法", "新能源汽车", "驾照考试", "宠物护理",
    "小说推荐", "音乐排行", "手机游戏", "动漫推荐", "健康饮食", "地方小吃", "宇宙探索",
    "智能家居", "机械键盘", "相机镜头", "二手车", "自驾游", "心理学", "地理知识"
  ];

  const LONG_KEYWORD_POOL = [
    "人工智能最新进展", "ChatGPT使用技巧", "智能手机推荐", "笔记本电脑选购", "平板电脑对比",
    "5G网络覆盖", "智能家居设备", "相机选购指南", "耳机推荐", "机械键盘评测",
    "今日国内新闻", "国际热点事件", "经济形势分析", "股市行情走势", "房产政策解读",
    "教育改革最新", "医疗健康新规", "交通出行变化", "天气预报查询", "法律法规常识",
    "健康养生方法", "美食菜谱推荐", "旅游景点攻略", "运动健身计划", "减肥瘦身方法",
    "护肤美容技巧", "服装穿搭推荐", "家居装修设计", "二手车选购", "宠物养护知识",
    "热门电影推荐", "电视剧排行榜", "综艺节目排名", "音乐排行榜", "游戏攻略秘籍",
    "小说推荐排行", "动漫新番推荐", "相声小品合集", "综艺节目盘点", "明星八卦新闻",
    "足球比赛结果", "NBA最新赛况", "体育赛事直播", "奥运会新闻", "世界杯赛程",
    "羽毛球比赛", "乒乓球赛事", "游泳锦标赛", "田径世界纪录", "电竞比赛结果",
    "编程入门教程", "英语学习方法", "数学解题技巧", "历史知识普及", "物理科普文章",
    "化学实验视频", "地理知识问答", "文学名著赏析", "哲学思想入门", "心理学入门",
    "新能源汽车推荐", "汽车评测对比", "二手车市场", "驾照考试技巧", "自驾游路线",
    "理财入门知识", "基金投资技巧", "股票分析方法", "保险选购指南", "储蓄理财方法",
    "家常菜做法", "烘焙入门教程", "地方特色小吃", "健康饮食搭配", "咖啡文化介绍",
    "宇宙探索发现", "深海生物奥秘", "恐龙化石研究", "气候变化影响", "新能源技术"
  ];

  function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dailyCountKey(date = new Date()) {
    return `Rebang_AutoSearchCount_${localDateString(date)}`;
  }

  function dailyMobileCountKey(date = new Date()) {
    return `Rebang_MobileSearchCount_${localDateString(date)}`;
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

  function nextScheduledTime(hour, minute, now = new Date(), rule = REPEAT.DAILY) {
    const next = new Date(now);
    next.setHours(hour, minute, 0, 0);
    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 1);
    }
    let guard = 0;
    while (!isScheduledDay(next, rule) && guard < 8) {
      next.setDate(next.getDate() + 1);
      guard += 1;
    }
    return next;
  }

  function formatClock(hour, minute) {
    return `${pad2(hour)}:${pad2(minute)}`;
  }

  function formatNextRunLabel(hour, minute, now = new Date(), rule = REPEAT.DAILY) {
    const schedule = parseHourMinute(hour, minute);
    if (!schedule.enabled) return "未设置";
    const next = nextScheduledTime(schedule.hour, schedule.minute, now, rule);
    const today = localDateString(now);
    const nextDay = localDateString(next);
    const clock = formatClock(schedule.hour, schedule.minute);
    if (nextDay === today) return `今天 ${clock}`;
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (nextDay === localDateString(tomorrow)) return `明天 ${clock}`;
    return `${WEEKDAY_NAMES[next.getDay()] || "下次"} ${clock}`;
  }

  function normalizeRepeatRule(value) {
    if (value === REPEAT.WEEKDAYS || value === REPEAT.WEEKENDS) return value;
    return REPEAT.DAILY;
  }

  function isScheduledDay(date = new Date(), rule = REPEAT.DAILY) {
    const day = date.getDay();
    const normalized = normalizeRepeatRule(rule);
    if (normalized === REPEAT.WEEKDAYS) return day >= 1 && day <= 5;
    if (normalized === REPEAT.WEEKENDS) return day === 0 || day === 6;
    return true;
  }

  function isWeekend(date = new Date()) {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  function shiftLocalDate(date, days) {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
    return next;
  }

  function weekdayShort(date) {
    return WEEKDAY_NAMES[date.getDay()] || "";
  }

  function normalizeWeekendGoal(value) {
    if (value === GOALS.SEARCH_ONLY || value === GOALS.SEARCH_SAFE || value === GOALS.TRY_ALL) return value;
    return WEEKEND_GOAL_SAME;
  }

  function weekendGoalLabel(value) {
    const goal = normalizeWeekendGoal(value);
    if (goal === WEEKEND_GOAL_SAME) return "与工作日相同";
    return goalLabel(goal);
  }

  function effectiveGoal(store, now = new Date()) {
    const weekdayGoal = normalizeGoal(store);
    if (!isWeekend(now)) return weekdayGoal;
    const weekendGoal = normalizeWeekendGoal(store && store[KEYS.weekendGoal]);
    return weekendGoal === WEEKEND_GOAL_SAME ? weekdayGoal : weekendGoal;
  }

  function effectiveSearchLimit(store, now = new Date()) {
    const weekdayLimit = Math.max(1, readNumber(store || {}, KEYS.limitSearchCount, DEFAULT_SEARCH_LIMIT));
    if (!isWeekend(now)) return weekdayLimit;
    const weekendLimit = Number(store && store[KEYS.weekendSearchLimit]);
    if (Number.isFinite(weekendLimit) && weekendLimit > 0) return Math.max(1, Math.round(weekendLimit));
    return weekdayLimit;
  }

  function readDayRecords(store) {
    const raw = store && store[KEYS.dayRecords];
    return Array.isArray(raw) ? raw.filter((item) => item && item.date) : [];
  }

  function pruneDayRecords(records, now = new Date()) {
    const cutoff = localDateString(shiftLocalDate(now, -(DAY_RECORD_KEEP_DAYS - 1)));
    const byDate = new Map();
    (Array.isArray(records) ? records : []).forEach((item) => {
      if (!item || !item.date || item.date < cutoff) return;
      byDate.set(item.date, item);
    });
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  function upsertDayRecord(records, record, now = new Date()) {
    if (!record || !record.date) return pruneDayRecords(records, now);
    const next = pruneDayRecords(records, now).filter((item) => item.date !== record.date);
    next.push(record);
    return pruneDayRecords(next, now);
  }

  function dayRecordMap(store) {
    const map = new Map();
    readDayRecords(store).forEach((item) => map.set(item.date, item));
    return map;
  }

  function recordStatusLabel(status) {
    if (status === "complete") return "已完成";
    if (status === "failed") return "失败";
    if (status === "today") return "今天";
    if (status === "empty") return "还没有记录";
    return "未做完";
  }

  function buildWeekCells(store, now = new Date()) {
    const records = dayRecordMap(store);
    const today = localDateString(now);
    const cells = [];
    for (let offset = DAY_RECORD_SHOW_DAYS - 1; offset >= 0; offset--) {
      const date = shiftLocalDate(now, -offset);
      const dateStr = localDateString(date);
      const record = records.get(dateStr);
      let status = "empty";
      if (dateStr === today) status = "today";
      else if (record && record.status === "complete") status = "complete";
      else if (record && record.status === "failed") status = "failed";
      else if (record) status = "incomplete";
      cells.push({
        date: dateStr,
        day: date.getDate(),
        weekday: weekdayShort(date).replace("周", ""),
        status,
        title: `${date.getMonth() + 1}月${date.getDate()}日 ${recordStatusLabel(status)}`
      });
    }
    return cells;
  }

  function consecutiveCompleteDays(store, now = new Date()) {
    const records = dayRecordMap(store);
    const rule = normalizeRepeatRule(store && store[KEYS.repeatRule]);
    let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = localDateString(cursor);
    if (isScheduledDay(cursor, rule)) {
      const todayRecord = records.get(todayStr);
      if (!(todayRecord && todayRecord.status === "complete")) {
        cursor = shiftLocalDate(cursor, -1);
      }
    }
    let count = 0;
    for (let i = 0; i < 60; i++) {
      if (!isScheduledDay(cursor, rule)) {
        cursor = shiftLocalDate(cursor, -1);
        continue;
      }
      const record = records.get(localDateString(cursor));
      if (record && record.status === "complete") {
        count += 1;
        cursor = shiftLocalDate(cursor, -1);
        continue;
      }
      break;
    }
    return count;
  }

  function yesterdayWasScheduled(store, now = new Date()) {
    const yesterday = shiftLocalDate(now, -1);
    return isScheduledDay(yesterday, store && store[KEYS.repeatRule]);
  }

  function hasHistoryBefore(store, dateStr) {
    if (readDayRecords(store).some((item) => item.date && item.date < dateStr)) return true;
    const summary = store && store[KEYS.lastRunSummary];
    if (summary && summary.at) {
      return localDateString(new Date(summary.at)) < dateStr;
    }
    return false;
  }

  function yesterdayMissed(store, now = new Date()) {
    if (!yesterdayWasScheduled(store, now)) return false;
    const yesterday = localDateString(shiftLocalDate(now, -1));
    const record = dayRecordMap(store).get(yesterday);
    if (record && record.status === "complete") return false;
    if (record) return true;
    return hasHistoryBefore(store, localDateString(now));
  }

  function streakLine(store, now = new Date()) {
    if (yesterdayMissed(store, now)) return "昨天还没做完";
    const days = consecutiveCompleteDays(store, now);
    if (days > 0) return `已连续完成 ${days} 天`;
    return "这几天还没有连续完成";
  }

  function shouldRemindMissed(store, now = new Date()) {
    if (!store || store[KEYS.missedRemindEnabled] === false) return false;
    if (!yesterdayMissed(store, now)) return false;
    const today = localDateString(now);
    if (store[KEYS.missedReminded] === today) return false;
    if (store[KEYS.catchUpPrompted] === today) return false;
    if (store[KEYS.catchUpDismissed] === today) return false;
    const count = readNumber(store, dailyCountKey(now), 0);
    const limit = effectiveSearchLimit(store, now);
    const dailyEnabled = goalEnablesDaily(effectiveGoal(store, now));
    const dailyDone = store[dailyTasksDoneKey(now)] === true || store[dailyTasksDoneKey(now)] === "true";
    if (count >= limit && (!dailyEnabled || dailyDone)) return false;
    return true;
  }

  function buildDayRecord(store, extra = {}, now = new Date()) {
    const count = extra.count != null ? Number(extra.count) : readNumber(store, dailyCountKey(now), 0);
    const limit = extra.limit != null ? Number(extra.limit) : effectiveSearchLimit(store, now);
    const reason = extra.reason || "stopped";
    const reasonCode = extra.reasonCode || "";
    const goal = extra.goal || effectiveGoal(store, now);
    const dailyEnabled = extra.dailyEnabled != null ? extra.dailyEnabled : goalEnablesDaily(goal);
    const dailyDone = extra.dailyDone != null
      ? extra.dailyDone
      : (store[dailyTasksDoneKey(now)] === true || store[dailyTasksDoneKey(now)] === "true");
    const dailySummary = extra.dailySummary || summarizeTasks(readTaskList(store, now).cards);
    let status = "incomplete";
    if (reason === "complete") status = "complete";
    else if (reason === "failed") status = "failed";
    const mobileCount = extra.mobileCount != null ? Number(extra.mobileCount) : readNumber(store, dailyMobileCountKey(now), 0);
    const points = extra.points != null ? extra.points : readablePoints(store[KEYS.pointsBalance]);
    const pointsGained = extra.pointsGained != null ? extra.pointsGained : pointsGainedFrom(store);
    const hasProgress = count > 0 || mobileCount > 0 || dailyDone || (dailySummary && dailySummary.done > 0);
    if (reason !== "complete" && reason !== "failed" && !hasProgress) return null;
    return {
      date: localDateString(now),
      status,
      count,
      limit,
      mobileCount,
      dailyEnabled,
      dailyDone,
      points,
      pointsGained,
      reasonCode,
      at: extra.at || Date.now()
    };
  }

  function isMobileFailCode(code) {
    return code === FAIL_CODES.MOBILE_NO_GAIN || code === FAIL_CODES.MOBILE_POINTS || code === FAIL_CODES.MOBILE_HEADER;
  }

  function continueHint(model) {
    if (!model) return "点继续会接着今天的进度，不会从头搜。";
    if (model.failReasonCode === FAIL_CODES.LOGIN) return model.failMessage || "请重新登录后再继续。";
    if (isMobileFailCode(model.failReasonCode)) {
      return model.failMessage || "可以用手机 Bing 做完，或点「我已用手机做完」。";
    }
    if (model.count >= model.limit && model.mobilePending) {
      return "电脑搜索已满，继续会去做移动搜索。";
    }
    if (model.count >= model.limit && model.dailyEnabled && !model.dailyDone) {
      return "电脑搜索已满，继续会去处理每日活动。";
    }
    if (model.count > 0) {
      return `已经完成 ${model.count}/${model.limit} 次搜索。点继续会接着做，不会从头搜。`;
    }
    return model.failMessage || "点继续会接着今天的进度，不会从头搜。";
  }

  function whatsNewCopy() {
    return {
      version: PRODUCT_VERSION,
      title: "2.5 失败会停下来，并告诉你下一步",
      points: [
        "移动搜索加不到分、标签页被关掉或没法改成手机样式时，会停并说人话",
        "测验自动作答同一题点几次仍在，会退回「我点完了 / 跳过」",
        "新用户的 30 天图是空的，不会看起来像已经失败一个月"
      ]
    };
  }

  function shouldShowWhatsNew(store) {
    return !store || store[KEYS.whatsNewSeen] !== PRODUCT_VERSION;
  }

  function normalizeIntervalRange(minValue, maxValue) {
    let min = Number(minValue);
    let max = Number(maxValue);
    if (!Number.isFinite(min)) min = DEFAULT_INTERVAL_MIN;
    if (!Number.isFinite(max)) max = DEFAULT_INTERVAL_MAX;
    min = Math.round(min);
    max = Math.round(max);
    min = Math.min(MAX_SEARCH_INTERVAL, Math.max(MIN_SEARCH_INTERVAL, min));
    max = Math.min(MAX_SEARCH_INTERVAL, Math.max(MIN_SEARCH_INTERVAL, max));
    if (min > max) {
      const swap = min;
      min = max;
      max = swap;
    }
    return { min, max };
  }

  function randomSearchDelayMs(minValue, maxValue) {
    const range = normalizeIntervalRange(minValue, maxValue);
    const minMs = range.min * 1000;
    const maxMs = range.max * 1000;
    return minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
  }

  function isPaused(store) {
    return store && store[KEYS.paused] === true && isLockOn(store);
  }

  function pauseStatusText(reason) {
    if (reason === PAUSE_REASONS.BUSY) return "你正在用电脑，已暂时停下";
    if (reason === PAUSE_REASONS.MOBILE_TAB) return "移动搜索页被关掉了";
    return "已暂停";
  }

  function readablePoints(value) {
    const points = Number(value);
    return Number.isFinite(points) ? points : null;
  }

  function pointsGainedFrom(store) {
    const start = readablePoints(store && store[KEYS.runStartPoints]);
    const end = readablePoints(store && store[KEYS.pointsBalance]);
    if (start === null || end === null) return null;
    const gained = end - start;
    return gained > 0 ? gained : null;
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
    if (value === WORD_PACK_CUSTOM) return WORD_PACK_CUSTOM;
    return WORD_PACK_SHORT;
  }

  function normalizeGoal(storeOrValue) {
    const raw = storeOrValue && typeof storeOrValue === "object"
      ? storeOrValue[KEYS.todayGoal]
      : storeOrValue;
    if (raw === GOALS.SEARCH_SAFE || raw === GOALS.TRY_ALL || raw === GOALS.SEARCH_ONLY) return raw;
    if (storeOrValue && typeof storeOrValue === "object" && storeOrValue[KEYS.enableDailyTasks] === true) {
      return GOALS.SEARCH_SAFE;
    }
    return GOALS.SEARCH_ONLY;
  }

  function goalEnablesDaily(goal) {
    return goal === GOALS.SEARCH_SAFE || goal === GOALS.TRY_ALL;
  }

  function goalLabel(goal) {
    return GOAL_LABELS[goal] || GOAL_LABELS.search_only;
  }

  function normalizeStringList(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || "").trim()).filter(Boolean);
    }
    if (typeof value === "string" && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return normalizeStringList(parsed);
      } catch (_error) {
        return parseKeywordText(value);
      }
    }
    return [];
  }

  function parseKeywordText(text) {
    return String(text || "")
      .split(/[\n,，;；]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  function keywordToItem(title) {
    return { title, url: "https://www.bing.com/search?q=" + encodeURIComponent(title) };
  }

  function dailyRandomSeed(source) {
    let hash = 0;
    const text = String(source || "");
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  function seededShuffle(arr, seed) {
    const shuffled = arr.slice();
    let m = shuffled.length;
    let s = seed;
    while (m > 0) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const i = s % m;
      m--;
      [shuffled[m], shuffled[i]] = [shuffled[i], shuffled[m]];
    }
    return shuffled;
  }

  function getKeywordPool(packName, customText) {
    if (packName === WORD_PACK_CUSTOM) return parseKeywordText(customText);
    if (packName === WORD_PACK_LONG) return LONG_KEYWORD_POOL.slice();
    return SHORT_KEYWORD_POOL.slice();
  }

  function buildKeywordPlan(store, count, now = new Date()) {
    const requestedPack = normalizeWordPack(store[KEYS.selectedChannel]);
    const blocked = new Set(normalizeStringList(store[KEYS.blockedKeywords]));
    let pack = requestedPack;
    let pool = getKeywordPool(pack, store[KEYS.customKeywords]).filter((word) => !blocked.has(word));
    if (!pool.length) {
      pack = WORD_PACK_SHORT;
      pool = SHORT_KEYWORD_POOL.filter((word) => !blocked.has(word));
    }
    if (!pool.length) pool = SHORT_KEYWORD_POOL.slice();
    const preferred = pool.filter((word) => word.length >= 2 && word.length <= 8);
    const source = preferred.length >= Math.min(8, count) ? preferred.concat(pool.filter((word) => !preferred.includes(word))) : pool;
    const shuffle = readNumber(store, KEYS.keywordShuffle, 0);
    let seed = dailyRandomSeed(`${localDateString(now)}|${pack}|${shuffle}`);
    let shuffled = seededShuffle(source, seed);
    const result = [];
    const target = Math.max(1, Number(count) || DEFAULT_SEARCH_LIMIT);
    while (result.length < target) {
      for (let i = 0; i < shuffled.length && result.length < target; i++) {
        result.push(keywordToItem(shuffled[i]));
      }
      seed += 1;
      shuffled = seededShuffle(source, seed);
    }
    const shorts = result.filter((item) => item.title.length === 2);
    if (target >= 10 && shorts.length) {
      const extra = shorts[seed % shorts.length];
      const pos = Math.min(result.length - 1, (seed % Math.max(2, result.length - 2)) + 1);
      result.splice(pos, 0, extra);
      if (result.length > target) result.pop();
    }
    return {
      date: localDateString(now),
      pack,
      requestedPack,
      words: result.map((item) => item.title),
      items: result,
      note: KEYWORD_NOTE,
      fallback: requestedPack === WORD_PACK_CUSTOM && pack !== WORD_PACK_CUSTOM
    };
  }

  function failCopy(code, extra = {}) {
    const limit = extra.limit || DEFAULT_NO_GAIN_LIMIT;
    if (code === FAIL_CODES.LOGIN) {
      return {
        short: "需要重新登录",
        next: "打开 Bing 并登录微软账号",
        message: extra.duringRun
          ? "登录状态已失效，已停止。请重新登录后再试。"
          : "没有检测到积分。请确认已登录微软账号，然后重试。"
      };
    }
    if (code === FAIL_CODES.NO_GAIN) {
      return {
        short: "连续没有加分",
        next: "今天可能已经满额，明天再试",
        message: `连续 ${limit} 次搜索没有加分，今天可能已经满额，或账号被限制。已停止。`
      };
    }
    if (code === FAIL_CODES.MOBILE_NO_GAIN) {
      return {
        short: "这次移动搜索没有加分",
        next: "可以用手机 Bing 做完，或点「我已用手机做完」",
        message: "这次移动搜索没有加分，已停止。可以用手机 Bing 做完，或点「我已用手机做完」。"
      };
    }
    if (code === FAIL_CODES.MOBILE_POINTS) {
      return {
        short: "读不到这次移动搜索的积分",
        next: "可以用手机 Bing 做完，或点「我已用手机做完」",
        message: "这次移动搜索读不到积分，已停止。可以用手机 Bing 做完，或点「我已用手机做完」。"
      };
    }
    if (code === FAIL_CODES.MOBILE_HEADER) {
      return {
        short: "没法做移动搜索",
        next: "请用手机 Bing 完成，或点「我已用手机做完」",
        message: "没法用手机样式做这次移动搜索，已停止。请用手机 Bing 完成，或点「我已用手机做完」。"
      };
    }
    if (code === FAIL_CODES.RISK) {
      return {
        short: "账号可能被限制",
        next: "先手动搜一次，确认还能加分",
        message: "登录后连续搜索都没有加分，账号可能已被限制。已停止。"
      };
    }
    if (code === FAIL_CODES.PAGE_CHANGED) {
      return {
        short: "页面改版",
        next: "请稍后重试，或改用手动搜索",
        message: extra.where === "rewards"
          ? "找不到每日活动卡片，页面可能已改版。已跳过自动处理。"
          : "找不到搜索框，页面可能已改版。已停止。"
      };
    }
    if (code === FAIL_CODES.NETWORK) {
      return {
        short: "网络失败",
        next: "检查网络后重试",
        message: "网络好像不通，已停止。请检查连接后重试。"
      };
    }
    return {
      short: "已停止",
      next: "可以继续今天的进度",
      message: extra.message || "已停止"
    };
  }

  function isDangerEnabled(store) {
    return !!(store && store[KEYS.dangerEnabled] === true);
  }

  function allowsHighRiskTasks(store) {
    return isDangerEnabled(store) && store[KEYS.highRiskTasksEnabled] === true;
  }

  function allowsQuizAssist(store) {
    return isDangerEnabled(store) && store[KEYS.quizAssistEnabled] === true;
  }

  function classifyTask(name, url, store) {
    const text = `${name || ""} ${url || ""}`;
    const lower = text.toLowerCase();
    if (/安装|购物|问卷|下载|注册账号|外部|app\s*store|google play|amazon|shop|install|survey|download/.test(text) ||
        /install|shop|survey|download|amazon|play\.google/.test(lower)) {
      let kind = TASK_KIND.INSTALL;
      if (/购物|shop|amazon|buy/.test(lower) || /购物/.test(text)) kind = TASK_KIND.SHOP;
      else if (/问卷|survey/.test(lower) || /问卷/.test(text)) kind = TASK_KIND.SURVEY;
      else if (/下载|download/.test(lower) || /下载/.test(text)) kind = TASK_KIND.DOWNLOAD;
      if (allowsHighRiskTasks(store)) {
        return { kind, status: TASK_STATUS.MANUAL, reason: "高风险，需要你点一下" };
      }
      return { kind, status: TASK_STATUS.SKIPPED, reason: "高风险" };
    }
    if (/测验|quiz|trivia|问答/.test(text) || /quiz|trivia/.test(lower)) {
      return { kind: TASK_KIND.QUIZ, status: TASK_STATUS.MANUAL, reason: "测验需要你点一下" };
    }
    if (/投票|poll|this or that|二选一/.test(text) || /poll|this or that/.test(lower)) {
      return { kind: TASK_KIND.VOTE, status: TASK_STATUS.MANUAL, reason: "投票需要你点一下" };
    }
    if (/探索|搜索|阅读|浏览|看一看|打开|visit|explore|search|read|check the news|daily/.test(text) ||
        /explore|search|visit|read/.test(lower)) {
      return { kind: TASK_KIND.EXPLORE, status: TASK_STATUS.AUTO, reason: "打开即可得分" };
    }
    return { kind: TASK_KIND.UNKNOWN, status: TASK_STATUS.UNKNOWN, reason: "页面改版" };
  }

  function isRewardsDashboardPath(pathname) {
    const path = String(pathname || "/").replace(/\/+$/, "") || "/";
    return path === "/" || path === "/dashboard" || path === "/welcome" || path === "/status";
  }

  function isQuizOrVotePage(loc, root) {
    const href = `${(loc && loc.pathname) || ""} ${(loc && loc.search) || ""} ${(loc && loc.href) || ""}`;
    if (/quiz|trivia|poll|thisorthat|rewardsquiz/i.test(href)) return true;
    try {
      if (root && root.querySelector && TASK_SELECTORS.quizPage && root.querySelector(TASK_SELECTORS.quizPage)) return true;
      if (root && root.querySelector && TASK_SELECTORS.votePage && root.querySelector(TASK_SELECTORS.votePage)) return true;
    } catch (_error) {}
    return false;
  }

  function classifyQuotaKind(text) {
    const t = String(text || "").toLowerCase();
    if (/microsoft edge|edge bonus|edge 奖励|通过\s*microsoft\s*edge|edge 上搜索/.test(t) && !/pc search|电脑/.test(t)) return "edge";
    if (/mobile search|移动(设备)?搜索|手机搜索|via mobile|bing mobile|search on mobile|在移动设备上搜索|在手机上搜索|移动端搜索/.test(t)) return "mobile";
    if (/pc search|desktop search|computer search|电脑搜索|电脑上搜索|在电脑上搜索|search on (the )?pc/.test(t)) return "pc";
    if (/search on bing/.test(t) && !/mobile|手机|移动|edge/.test(t)) return "pc";
    if (/daily set|每日任务|今日任务|daily check|每日活动|daily activities/.test(t)) return "daily";
    return "";
  }

  function normalizeQuotaPair(current, total, kind) {
    const cur = Number(current);
    const tot = Number(total);
    if (!Number.isFinite(cur) || !Number.isFinite(tot) || tot <= 0) return null;
    if (cur < 0 || cur > tot * 2) return null;
    const canSplit = (!kind || kind === "pc" || kind === "mobile") && tot >= 45 && tot <= 180 && tot % 3 === 0 && cur % 3 === 0;
    if (canSplit) {
      return {
        current: cur / 3,
        total: tot / 3,
        remaining: Math.max(0, (tot - cur) / 3)
      };
    }
    return {
      current: cur,
      total: tot,
      remaining: Math.max(0, tot - cur)
    };
  }

  function parseQuotaFraction(text, kind) {
    const raw = String(text || "").replace(/,/g, "");
    let match = raw.match(/(\d+)\s*(?:\/|of|／|out of)\s*(\d+)/i);
    if (match) return normalizeQuotaPair(match[1], match[2], kind);
    match = raw.match(/(\d+)\s*(?:points?|分)\s*(?:of|\/|共|out of)\s*(\d+)/i);
    if (match) return normalizeQuotaPair(match[1], match[2], kind);
    return null;
  }

  function collectQuotaChunks(cardTexts) {
    const chunks = [];
    (Array.isArray(cardTexts) ? cardTexts : [cardTexts]).forEach((text) => {
      String(text || "").split(/[\n\r]+/).forEach((line) => {
        const trimmed = line.replace(/\s+/g, " ").trim();
        if (trimmed) chunks.push(trimmed);
      });
      const compact = String(text || "").replace(/\s+/g, " ").trim();
      if (compact) chunks.push(compact);
    });
    return chunks;
  }

  function parseQuotaCards(cardTexts) {
    const result = { pc: null, mobile: null, daily: null, edge: null };
    const chunks = collectQuotaChunks(cardTexts);
    const assign = (kind, pair) => {
      if (!kind || !pair || result[kind]) return;
      result[kind] = pair;
    };
    chunks.forEach((chunk) => {
      const kind = classifyQuotaKind(chunk);
      assign(kind, parseQuotaFraction(chunk, kind));
    });
    for (let i = 0; i < chunks.length; i++) {
      const kind = classifyQuotaKind(chunks[i]);
      if (!kind || result[kind]) continue;
      assign(kind, parseQuotaFraction(chunks[i + 1] || "", kind) || parseQuotaFraction(chunks[i + 2] || "", kind));
    }
    const blob = chunks.join(" \n ");
    const labeled = [
      ["mobile", /(?:mobile search|移动(?:设备)?搜索|手机搜索|在移动设备上搜索|在手机上搜索)[^\d]{0,48}(\d+)\s*(?:\/|of|／|out of)\s*(\d+)/i],
      ["pc", /(?:pc search|desktop search|computer search|电脑搜索|在电脑上搜索|电脑上搜索)[^\d]{0,48}(\d+)\s*(?:\/|of|／|out of)\s*(\d+)/i],
      ["daily", /(?:daily set|每日任务|今日任务|每日活动|daily activities)[^\d]{0,48}(\d+)\s*(?:\/|of|／|out of)\s*(\d+)/i],
      ["edge", /(?:microsoft edge|edge bonus|edge 奖励|通过\s*microsoft\s*edge)[^\d]{0,48}(\d+)\s*(?:\/|of|／|out of)\s*(\d+)/i]
    ];
    labeled.forEach(([kind, re]) => {
      if (result[kind]) return;
      const match = re.exec(blob);
      if (match) assign(kind, normalizeQuotaPair(match[1], match[2], kind));
    });
    return result;
  }

  function readQuotaSnapshot(store, now = new Date()) {
    const raw = store && store[KEYS.quotaSnapshot];
    if (!raw || typeof raw !== "object") return null;
    if (raw.date !== localDateString(now)) return null;
    return raw;
  }

  function mergeQuotaSnapshot(prev, next, now = new Date()) {
    const date = localDateString(now);
    const base = prev && prev.date === date ? prev : {};
    return {
      date,
      pc: (next && next.pc) || base.pc || null,
      mobile: (next && next.mobile) || base.mobile || null,
      daily: (next && next.daily) || base.daily || null,
      edge: (next && next.edge) || base.edge || null,
      at: Date.now()
    };
  }

  function isMobileDoneToday(store, now = new Date()) {
    return String((store && store[KEYS.mobileDoneDate]) || "") === localDateString(now);
  }

  function allowsMobileSearch(store) {
    return isDangerEnabled(store) && store[KEYS.mobileSearchEnabled] === true;
  }

  function effectiveMobileLimit(store, now = new Date()) {
    const quota = readQuotaSnapshot(store, now);
    const done = readNumber(store, dailyMobileCountKey(now), 0);
    if (quota && quota.mobile && Number.isFinite(Number(quota.mobile.remaining))) {
      return Math.max(done, done + Math.max(0, Math.round(Number(quota.mobile.remaining))));
    }
    return Math.max(0, readNumber(store, KEYS.mobileSearchLimit, DEFAULT_MOBILE_LIMIT));
  }

  function shouldRunMobileSearch(store, now = new Date()) {
    if (!allowsMobileSearch(store)) return false;
    if (isMobileDoneToday(store, now)) return false;
    const limit = effectiveMobileLimit(store, now);
    if (limit <= 0) return false;
    return readNumber(store, dailyMobileCountKey(now), 0) < limit;
  }

  function formatPcQuotaHint(quota) {
    if (!quota || !quota.pc || quota.pc.remaining == null) return "";
    if (quota.pc.remaining <= 0) return "页面显示电脑搜索已满";
    return `页面显示还剩 ${quota.pc.remaining} 次`;
  }

  function formatMobileHint(quota, store, now = new Date()) {
    if (isMobileDoneToday(store, now)) {
      if (!quota || !quota.mobile) return "你已标记今天用手机做完。这里只是你自己的标记";
      return "你已标记今天用手机做完";
    }
    if (!quota || !quota.mobile || quota.mobile.remaining == null) return "";
    if (quota.mobile.remaining <= 0) return "移动搜索今日已满";
    if (allowsMobileSearch(store)) return `移动搜索还剩 ${quota.mobile.remaining} 次`;
    return `移动搜索还剩 ${quota.mobile.remaining} 次，请用手机 Bing 完成`;
  }

  function formatMobileQuotaLine(quota, store, now = new Date()) {
    if (isMobileDoneToday(store, now)) {
      if (!quota || !quota.mobile) return "你已标记今天用手机做完（只是你自己的标记）";
      return "你已标记今天用手机做完";
    }
    if (allowsMobileSearch(store) && shouldRunMobileSearch(store, now)) {
      const remain = Math.max(0, effectiveMobileLimit(store, now) - readNumber(store, dailyMobileCountKey(now), 0));
      return `将用手机样式再搜 ${remain} 次`;
    }
    if (!quota || !quota.mobile || quota.mobile.remaining == null) return "还没打开过 Rewards 读取配额";
    if (quota.mobile.remaining <= 0) return "今日已满（不自动执行）";
    return `页面显示还剩 ${quota.mobile.remaining} 次（不自动执行）`;
  }

  function formatEdgeHint(quota) {
    if (!quota || !quota.edge || quota.edge.remaining == null || quota.edge.remaining <= 0) return "";
    return `页面还显示 Edge 奖励剩余 ${quota.edge.remaining}`;
  }

  function formatQuotaHint(quota, store, now = new Date()) {
    return [formatPcQuotaHint(quota), formatMobileHint(quota, store, now), formatEdgeHint(quota)].filter(Boolean).join("。");
  }

  function buildSearchUrl(keyword, extra = {}) {
    const params = new URLSearchParams();
    params.set("q", keyword || "天气预报");
    params.set("form", extra.mobile ? "QBLH" : "QBRE");
    if (extra.mobile) params.set(MOBILE_SEARCH_FLAG, "m");
    return `https://www.bing.com/search?${params.toString()}`;
  }

  function isMobileSearchUrl(url) {
    try {
      return new URL(url, "https://www.bing.com").searchParams.get(MOBILE_SEARCH_FLAG) === "m";
    } catch (_error) {
      return false;
    }
  }

  function weekCompleteDays(store, now = new Date()) {
    const records = dayRecordMap(store);
    let count = 0;
    for (let offset = 0; offset < DAY_RECORD_SHOW_DAYS; offset++) {
      const record = records.get(localDateString(shiftLocalDate(now, -offset)));
      if (record && record.status === "complete") count += 1;
    }
    return count;
  }

  function weekCompleteLine(store, now = new Date()) {
    return `近 7 天完成了 ${weekCompleteDays(store, now)} 天`;
  }

  function readPointsHistory(store) {
    const raw = store && store[KEYS.pointsHistory];
    return Array.isArray(raw) ? raw.filter((item) => item && item.date && Number.isFinite(Number(item.points))) : [];
  }

  function upsertPointsHistory(history, points, now = new Date()) {
    const value = Number(points);
    if (!Number.isFinite(value)) return Array.isArray(history) ? history : [];
    const date = localDateString(now);
    const next = (Array.isArray(history) ? history : []).filter((item) => item && item.date && item.date !== date);
    next.push({ date, points: value });
    const cutoff = localDateString(shiftLocalDate(now, -(DAY_RECORD_KEEP_DAYS - 1)));
    return next.filter((item) => item.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
  }

  function cellStatusForDate(store, dateStr, now = new Date()) {
    const today = localDateString(now);
    const record = dayRecordMap(store).get(dateStr);
    if (dateStr === today) return "today";
    if (record && record.status === "complete") return "complete";
    if (record && record.status === "failed") return "failed";
    if (record) return "incomplete";
    return "empty";
  }

  function buildMonthChartModel(store, now = new Date()) {
    const records = dayRecordMap(store);
    const historyMap = new Map(readPointsHistory(store).map((item) => [item.date, item]));
    const days = [];
    for (let offset = DAY_CHART_DAYS - 1; offset >= 0; offset--) {
      const date = shiftLocalDate(now, -offset);
      const dateStr = localDateString(date);
      const record = records.get(dateStr);
      const snap = historyMap.get(dateStr);
      days.push({
        date: dateStr,
        day: date.getDate(),
        weekday: weekdayShort(date).replace("周", ""),
        status: cellStatusForDate(store, dateStr, now),
        title: `${date.getMonth() + 1}月${date.getDate()}日 ${recordStatusLabel(cellStatusForDate(store, dateStr, now))}`,
        points: snap ? Number(snap.points) : (record && record.points != null ? Number(record.points) : null),
        pointsGained: record && record.pointsGained != null ? Number(record.pointsGained) : null
      });
    }
    const completeDays = days.filter((item) => {
      if (item.status === "complete") return true;
      const record = records.get(item.date);
      return record && record.status === "complete";
    }).length;
    const gained = days.map((item) => Number.isFinite(item.pointsGained) ? item.pointsGained : 0);
    const pointsValues = days.map((item) => Number.isFinite(item.points) ? item.points : null);
    const hasPoints = pointsValues.filter((item) => item != null).length >= 2;
    const maxGained = Math.max(1, ...gained);
    const todayStr = localDateString(now);
    const todayGain = days.find((item) => item.date === todayStr);
    const hasTodayGain = !!(todayGain && Number.isFinite(todayGain.pointsGained) && todayGain.pointsGained > 0);
    return {
      days,
      completeDays,
      hasPoints,
      hasTodayGain,
      summary: completeDays > 0 ? `近 30 天完成了 ${completeDays} 天` : "还没有 30 天记录",
      bars: days.map((item, index) => ({
        date: item.date,
        day: item.day,
        status: item.status,
        value: gained[index],
        percent: Math.round((gained[index] / maxGained) * 100),
        points: pointsValues[index]
      }))
    };
  }

  function parseQuizQuestionTotal(text, nodeCount) {
    const raw = String(text || "");
    let match = raw.match(/(?:question|问题|第)\s*(\d+)\s*(?:of|\/|／|共)\s*(\d+)/i);
    if (match) return Math.max(1, Number(match[2]) || 0);
    match = raw.match(/(\d+)\s*\/\s*(\d+)\s*(?:题|questions?)/i);
    if (match) return Math.max(1, Number(match[2]) || 0);
    const count = Number(nodeCount) || 0;
    if (count >= 2 && count <= 15) return count;
    return 0;
  }

  function formatQuizAssistFallback() {
    return "这张需要你自己点。选完后点「我点完了」，或跳过这张";
  }

  function formatQuizNextStep(kind, questionTotal, name, extra = {}) {
    if (extra && extra.gaveUp) return formatQuizAssistFallback();
    const label = name ? `${name}。` : "";
    if (kind === "vote") return `${label}这是投票。请自己选完，然后点「我点完了」或「跳过这张」。`;
    if (questionTotal > 0) return `${label}这是测验，大约 ${questionTotal} 题。请自己选完，然后点「我点完了」或「跳过这张」。`;
    return `${label}这是测验。请自己选完，然后点「我点完了」或「跳过这张」。`;
  }

  function taskStatusLabel(card) {
    if (!card) return "识别失败";
    if (card.status === TASK_STATUS.DONE) return "已完成";
    if (card.status === TASK_STATUS.SKIPPED) return card.reason ? `已跳过（${card.reason}）` : "已跳过";
    if (card.status === TASK_STATUS.MANUAL) return "需要你点一下";
    if (card.status === TASK_STATUS.AUTO) return "可自动完成";
    return "识别失败";
  }

  function summarizeTasks(cards) {
    const list = Array.isArray(cards) ? cards : [];
    const autoCards = list.filter((card) => card.kind === TASK_KIND.EXPLORE);
    const autoDone = autoCards.filter((card) => card.status === TASK_STATUS.DONE).length;
    const autoPending = autoCards.filter((card) => card.status === TASK_STATUS.AUTO).length;
    const manual = list.filter((card) => card.status === TASK_STATUS.MANUAL || card.kind === TASK_KIND.QUIZ || card.kind === TASK_KIND.VOTE).length;
    const skipped = list.filter((card) => card.status === TASK_STATUS.SKIPPED).length;
    const unknown = list.filter((card) => card.status === TASK_STATUS.UNKNOWN).length;
    const done = list.filter((card) => card.status === TASK_STATUS.DONE).length;
    return {
      total: list.length,
      done,
      autoTotal: autoCards.length,
      autoDone,
      autoPending,
      manual,
      skipped,
      unknown
    };
  }

  function formatDailyProgress(summary, dailyEnabled, dailyDone, dailyQuota) {
    if (!dailyEnabled) return "未开启（安全模式）";
    if ((!summary || summary.total === 0) && dailyQuota && dailyQuota.remaining != null) {
      if (dailyQuota.remaining <= 0 || dailyDone) return "已完成";
      return `还剩 ${dailyQuota.remaining} 个活动`;
    }
    if (!summary || summary.total === 0) return dailyDone ? "已完成" : "待识别";
    const autoTotal = summary.autoTotal || 0;
    const autoDone = summary.autoDone || 0;
    const manual = summary.manual || 0;
    if (dailyDone && autoPendingSafe(summary) === 0) {
      return manual > 0 ? `${autoDone}/${autoTotal} 可自动 · ${manual} 需手动` : "已完成";
    }
    return `${autoDone}/${autoTotal} 可自动 · ${manual} 需手动`;
  }

  function formatDailyResult(summary, dailyEnabled) {
    if (!dailyEnabled) return "未开启（安全模式）";
    if (!summary || summary.total === 0) return "未识别到活动";
    const bits = [`已完成 ${summary.done || 0} 张`];
    if (summary.skipped) bits.push(`跳过 ${summary.skipped} 张`);
    if (summary.manual) bits.push(`还需手动 ${summary.manual} 张`);
    return bits.join(" · ");
  }

  function formatClosingLine(extra = {}) {
    if (!extra.dailyEnabled) return "安全模式已开，未处理每日活动";
    const summary = extra.dailySummary || {};
    const manual = summary.manual || 0;
    const skipped = summary.skipped || 0;
    if (manual > 0) return `还有 ${manual} 个活动需要你点一下`;
    if (extra.dailyDone || autoPendingSafe(summary) === 0) {
      return skipped > 0 ? `每日活动已处理，跳过 ${skipped} 张` : "每日活动已处理";
    }
    return "每日活动仍待处理";
  }

  function buildTodaySummary(store, extra = {}, now = new Date()) {
    const count = extra.count != null ? Number(extra.count) : readNumber(store, dailyCountKey(now), 0);
    const limit = extra.limit != null ? Number(extra.limit) : effectiveSearchLimit(store, now);
    const durationMs = extra.durationMs != null ? Number(extra.durationMs) : 0;
    const reason = extra.reason || "stopped";
    const reasonCode = extra.reasonCode || "";
    const dailySummary = extra.dailySummary || summarizeTasks(readTaskList(store, now).cards);
    const goal = extra.goal || effectiveGoal(store, now);
    const dailyEnabled = extra.dailyEnabled != null ? extra.dailyEnabled : goalEnablesDaily(goal);
    const dailyDone = extra.dailyDone != null
      ? extra.dailyDone
      : (store[dailyTasksDoneKey(now)] === true || store[dailyTasksDoneKey(now)] === "true");
    const pointsGained = extra.pointsGained != null ? extra.pointsGained : pointsGainedFrom(store);
    const mobileCount = extra.mobileCount != null ? Number(extra.mobileCount) : readNumber(store, dailyMobileCountKey(now), 0);
    const closingLine = extra.closingLine || formatClosingLine({
      dailyEnabled,
      dailyDone,
      dailySummary
    });
    return {
      reason,
      reasonCode,
      count,
      limit,
      mobileCount,
      durationMs,
      at: extra.at || Date.now(),
      dailyEnabled,
      dailyDone,
      dailySummary,
      pointsGained,
      closingLine
    };
  }

  function formatCompleteNotify(summary) {
    if (!summary) return "今天的任务已完成";
    const parts = [`今日电脑搜索 ${summary.count}/${summary.limit}`];
    if (summary.mobileCount) parts.push(`移动搜索 ${summary.mobileCount} 次`);
    if (summary.dailyEnabled && summary.dailySummary) {
      parts.push(`每日活动完成 ${summary.dailySummary.done || 0} 张、跳过 ${summary.dailySummary.skipped || 0} 张`);
    }
    if (summary.durationMs) parts.push(`用时 ${formatDuration(summary.durationMs)}`);
    if (summary.pointsGained) parts.push(`大约 +${summary.pointsGained}`);
    return parts.join("，");
  }

  function autoPendingSafe(summary) {
    return summary && Number(summary.autoPending) > 0 ? Number(summary.autoPending) : 0;
  }

  function appendRunLog(logs, event, now = new Date()) {
    const entry = {
      t: now.getTime(),
      date: localDateString(now),
      time: formatClock(now.getHours(), now.getMinutes()),
      action: event && event.action ? String(event.action) : "",
      result: event && event.result ? String(event.result) : "",
      reason: event && event.reason ? String(event.reason) : "",
      reasonCode: event && event.reasonCode ? String(event.reasonCode) : ""
    };
    const list = Array.isArray(logs) ? logs.slice() : [];
    list.unshift(entry);
    const cutoff = now.getTime() - 7 * 24 * 3600 * 1000;
    return list.filter((item) => Number(item.t) >= cutoff).slice(0, 400);
  }

  function formatLogLine(entry) {
    if (!entry) return "";
    return [entry.time, entry.action, entry.result, entry.reason].filter(Boolean).join("  ");
  }

  function todayLogs(logs, now = new Date()) {
    const today = localDateString(now);
    return (Array.isArray(logs) ? logs : []).filter((item) => item && item.date === today);
  }

  function exportLogsText(logs) {
    return (Array.isArray(logs) ? logs : []).map((entry) => {
      return [entry.date, formatLogLine(entry)].filter(Boolean).join("  ");
    }).join("\n");
  }

  const SETTINGS_EXPORT_KEYS = [
    KEYS.autoStartHour,
    KEYS.autoStartMin,
    KEYS.repeatRule,
    KEYS.todayGoal,
    KEYS.enableDailyTasks,
    KEYS.weekendGoal,
    KEYS.limitSearchCount,
    KEYS.weekendSearchLimit,
    KEYS.missedRemindEnabled,
    KEYS.notifyEnabled,
    KEYS.selectedChannel,
    KEYS.customKeywords,
    KEYS.blockedKeywords,
    KEYS.searchIntervalMin,
    KEYS.searchIntervalMax,
    KEYS.simulateTyping,
    KEYS.pauseWhenBusy,
    KEYS.maxNoGainLimit,
    KEYS.dailyTaskMaxRetries,
    KEYS.catchUpEnabled,
    KEYS.catchUpAsk,
    KEYS.dangerEnabled,
    KEYS.highRiskTasksEnabled,
    KEYS.quizAssistEnabled,
    KEYS.mobileSearchEnabled,
    KEYS.mobileSearchLimit
  ];

  function exportSettings(store) {
    const settings = {};
    SETTINGS_EXPORT_KEYS.forEach((key) => {
      if (store && Object.prototype.hasOwnProperty.call(store, key) && typeof store[key] !== "undefined") {
        settings[key] = store[key];
      }
    });
    return {
      product: PRODUCT_NAME_ZH,
      version: PRODUCT_VERSION,
      exportedAt: new Date().toISOString(),
      settings
    };
  }

  function readBooleanSetting(value) {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return null;
  }

  function importSettings(payload) {
    let data = payload;
    if (typeof payload === "string") {
      try {
        data = JSON.parse(payload);
      } catch (_error) {
        return { ok: false, error: "文件不是有效的 JSON。" };
      }
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ok: false, error: "备份文件格式不对。" };
    }
    const raw = data.settings && typeof data.settings === "object" && !Array.isArray(data.settings)
      ? data.settings
      : data;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { ok: false, error: "备份里没有找到设置。" };
    }
    const patch = {};
    const known = new Set(SETTINGS_EXPORT_KEYS);
    Object.keys(raw).forEach((key) => {
      if (!known.has(key)) return;
      const value = raw[key];
      if (typeof value === "undefined") return;
      patch[key] = value;
    });
    if (Object.prototype.hasOwnProperty.call(patch, KEYS.todayGoal) || Object.prototype.hasOwnProperty.call(patch, KEYS.enableDailyTasks)) {
      const goal = normalizeGoal(Object.prototype.hasOwnProperty.call(patch, KEYS.todayGoal) ? patch[KEYS.todayGoal] : { [KEYS.enableDailyTasks]: patch[KEYS.enableDailyTasks] });
      patch[KEYS.todayGoal] = goal;
      patch[KEYS.enableDailyTasks] = goalEnablesDaily(goal);
    }
    if (Object.prototype.hasOwnProperty.call(patch, KEYS.weekendGoal)) {
      patch[KEYS.weekendGoal] = normalizeWeekendGoal(patch[KEYS.weekendGoal]);
    }
    if (Object.prototype.hasOwnProperty.call(patch, KEYS.repeatRule)) {
      patch[KEYS.repeatRule] = normalizeRepeatRule(patch[KEYS.repeatRule]);
    }
    if (Object.prototype.hasOwnProperty.call(patch, KEYS.selectedChannel)) {
      patch[KEYS.selectedChannel] = normalizeWordPack(patch[KEYS.selectedChannel]);
    }
    if (Object.prototype.hasOwnProperty.call(patch, KEYS.customKeywords)) {
      patch[KEYS.customKeywords] = String(patch[KEYS.customKeywords] || "");
    }
    if (Object.prototype.hasOwnProperty.call(patch, KEYS.blockedKeywords)) {
      patch[KEYS.blockedKeywords] = normalizeStringList(patch[KEYS.blockedKeywords]);
    }
    if (Object.prototype.hasOwnProperty.call(patch, KEYS.limitSearchCount)) {
      const value = Math.max(1, Math.round(Number(patch[KEYS.limitSearchCount]) || DEFAULT_SEARCH_LIMIT));
      patch[KEYS.limitSearchCount] = value;
    }
    if (Object.prototype.hasOwnProperty.call(patch, KEYS.weekendSearchLimit)) {
      const rawLimit = String(patch[KEYS.weekendSearchLimit] == null ? "" : patch[KEYS.weekendSearchLimit]).trim();
      patch[KEYS.weekendSearchLimit] = rawLimit ? Math.max(1, Math.round(Number(rawLimit) || DEFAULT_SEARCH_LIMIT)) : "";
    }
    if (Object.prototype.hasOwnProperty.call(patch, KEYS.searchIntervalMin) || Object.prototype.hasOwnProperty.call(patch, KEYS.searchIntervalMax)) {
      const range = normalizeIntervalRange(patch[KEYS.searchIntervalMin], patch[KEYS.searchIntervalMax]);
      patch[KEYS.searchIntervalMin] = range.min;
      patch[KEYS.searchIntervalMax] = range.max;
    }
    if (Object.prototype.hasOwnProperty.call(patch, KEYS.maxNoGainLimit)) {
      patch[KEYS.maxNoGainLimit] = Math.max(3, Math.round(Number(patch[KEYS.maxNoGainLimit]) || DEFAULT_NO_GAIN_LIMIT));
    }
    if (Object.prototype.hasOwnProperty.call(patch, KEYS.dailyTaskMaxRetries)) {
      patch[KEYS.dailyTaskMaxRetries] = Math.max(1, Math.round(Number(patch[KEYS.dailyTaskMaxRetries]) || DEFAULT_DAILY_RETRIES));
    }
    if (Object.prototype.hasOwnProperty.call(patch, KEYS.mobileSearchLimit)) {
      patch[KEYS.mobileSearchLimit] = Math.max(0, Math.round(Number(patch[KEYS.mobileSearchLimit]) || DEFAULT_MOBILE_LIMIT));
    }
    [
      KEYS.missedRemindEnabled,
      KEYS.notifyEnabled,
      KEYS.simulateTyping,
      KEYS.pauseWhenBusy,
      KEYS.catchUpEnabled,
      KEYS.catchUpAsk,
      KEYS.dangerEnabled,
      KEYS.highRiskTasksEnabled,
      KEYS.quizAssistEnabled,
      KEYS.mobileSearchEnabled
    ].forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(patch, key)) return;
      const flag = readBooleanSetting(patch[key]);
      if (flag === null) delete patch[key];
      else patch[key] = flag;
    });
    if (Object.prototype.hasOwnProperty.call(patch, KEYS.dangerEnabled) && !isDangerEnabled(patch)) {
      patch[KEYS.dangerEnabled] = false;
      patch[KEYS.highRiskTasksEnabled] = false;
      patch[KEYS.quizAssistEnabled] = false;
      patch[KEYS.mobileSearchEnabled] = false;
    }
    if (!Object.keys(patch).length) return { ok: false, error: "备份里没有可用的设置。" };
    return { ok: true, patch };
  }

  function readTaskList(store, now = new Date()) {
    const raw = store[KEYS.taskList];
    if (!raw || typeof raw !== "object") return { date: localDateString(now), cards: [] };
    if (raw.date !== localDateString(now)) return { date: localDateString(now), cards: [] };
    return { date: raw.date, cards: Array.isArray(raw.cards) ? raw.cards : [] };
  }

  function buildViewModel(store, now = new Date()) {
    const count = readNumber(store, dailyCountKey(now), 0);
    const weekdayLimit = Math.max(1, readNumber(store, KEYS.limitSearchCount, DEFAULT_SEARCH_LIMIT));
    const weekdayGoal = normalizeGoal(store);
    const limit = effectiveSearchLimit(store, now);
    const goal = effectiveGoal(store, now);
    const dailyEnabled = goalEnablesDaily(goal);
    const dailyDone = store[dailyTasksDoneKey(now)] === true || store[dailyTasksDoneKey(now)] === "true";
    const loginState = store[KEYS.loginState] || "unknown";
    const running = isLockOn(store);
    const productState = store[KEYS.productState] || "";
    const riskAccepted = store[KEYS.riskAccepted] === true;
    const notifyEnabled = store[KEYS.notifyEnabled] !== false;
    const schedule = parseHourMinute(store[KEYS.autoStartHour], store[KEYS.autoStartMin]);
    const repeatRule = normalizeRepeatRule(store[KEYS.repeatRule]);
    const interval = normalizeIntervalRange(store[KEYS.searchIntervalMin], store[KEYS.searchIntervalMax]);
    const startedAt = readNumber(store, KEYS.runStartedAt, 0);
    const paused = isPaused(store);
    const pauseReason = store[KEYS.pauseReason] || "";
    const keyword = store[KEYS.lastKeyword] || "";
    const statusMessage = store[KEYS.lastStatusMessage] || "";
    const lastError = store[KEYS.lastError] || "";
    const failReasonCode = store[KEYS.failReasonCode] || "";
    const fail = failCopy(failReasonCode, {
      limit: readNumber(store, KEYS.maxNoGainLimit, DEFAULT_NO_GAIN_LIMIT),
      message: lastError
    });
    const points = store[KEYS.pointsBalance];
    const summary = store[KEYS.lastRunSummary] && typeof store[KEYS.lastRunSummary] === "object"
      ? store[KEYS.lastRunSummary]
      : null;
    const taskList = readTaskList(store, now);
    const dailySummary = summarizeTasks(taskList.cards);
    const waitingTask = store[KEYS.waitingUserTask] && typeof store[KEYS.waitingUserTask] === "object"
      ? store[KEYS.waitingUserTask]
      : null;
    const logs = todayLogs(store[KEYS.runLogs], now);
    const keywordPlan = store[KEYS.dailyKeywordPlan] && store[KEYS.dailyKeywordPlan].date === localDateString(now)
      ? store[KEYS.dailyKeywordPlan]
      : null;

    const mobilePending = shouldRunMobileSearch(store, now);
    const searchPhase = store[KEYS.searchPhase] || "";
    let state = "ready";
    if (!riskAccepted) state = "onboarding";
    else if (loginState === "out") state = "logged_out";
    else if (paused) state = "paused";
    else if (running) state = "running";
    else if (productState === "failed" && (count < limit || mobilePending || (dailyEnabled && !dailyDone))) state = "failed";
    else if (count >= limit && !mobilePending && (!dailyEnabled || dailyDone || (dailySummary.total > 0 && dailySummary.autoPending === 0))) state = "complete";
    else if (productState === "complete" && !mobilePending && (!dailyEnabled || dailyDone)) state = "complete";
    else state = "ready";

    const elapsedMs = running && startedAt > 0 ? Math.max(0, now.getTime() - startedAt) : (summary?.durationMs || 0);
    const quota = readQuotaSnapshot(store, now);

    return {
      state,
      riskAccepted,
      notifyEnabled,
      loginState,
      running,
      paused,
      pauseReason,
      pauseText: pauseStatusText(pauseReason),
      count,
      limit,
      weekdayLimit,
      weekdayGoal,
      weekdayGoalLabel: goalLabel(weekdayGoal),
      goal,
      goalLabel: goalLabel(goal),
      weekendGoal: normalizeWeekendGoal(store[KEYS.weekendGoal]),
      weekendGoalLabel: weekendGoalLabel(store[KEYS.weekendGoal]),
      weekendSearchLimit: Number(store[KEYS.weekendSearchLimit]) > 0 ? Math.round(Number(store[KEYS.weekendSearchLimit])) : "",
      dailyEnabled,
      dailyDone,
      dailySummary,
      quota,
      quotaHint: formatQuotaHint(quota, store, now),
      pcQuotaHint: formatPcQuotaHint(quota),
      mobileHint: formatMobileHint(quota, store, now),
      mobileQuotaLine: formatMobileQuotaLine(quota, store, now),
      mobilePending,
      mobileDoneToday: isMobileDoneToday(store, now),
      searchPhase,
      dailyProgress: formatDailyProgress(dailySummary, dailyEnabled, dailyDone, quota && quota.daily),
      dailyResult: formatDailyResult(dailySummary, dailyEnabled),
      taskCards: taskList.cards,
      waitingTask,
      schedule: { ...schedule, rule: repeatRule },
      repeatRule,
      repeatLabel: REPEAT_LABELS[repeatRule] || REPEAT_LABELS.daily,
      nextRunLabel: formatNextRunLabel(store[KEYS.autoStartHour], store[KEYS.autoStartMin], now, repeatRule),
      intervalMin: interval.min,
      intervalMax: interval.max,
      simulateTyping: store[KEYS.simulateTyping] === true,
      pauseWhenBusy: store[KEYS.pauseWhenBusy] !== false,
      pointsGained: summary && summary.pointsGained != null ? summary.pointsGained : pointsGainedFrom(store),
      closingLine: summary && summary.closingLine ? summary.closingLine : formatClosingLine({
        dailyEnabled,
        dailyDone,
        dailySummary
      }),
      keyword,
      statusMessage,
      lastError,
      failReasonCode,
      failShort: fail.short,
      failNext: fail.next,
      failMessage: lastError || fail.message,
      points: Number.isFinite(Number(points)) ? Number(points) : null,
      startedAt,
      elapsedMs,
      summary,
      wordPack: normalizeWordPack(store[KEYS.selectedChannel]),
      noGainLimit: readNumber(store, KEYS.maxNoGainLimit, DEFAULT_NO_GAIN_LIMIT),
      dailyRetries: readNumber(store, KEYS.dailyTaskMaxRetries, DEFAULT_DAILY_RETRIES),
      customKeywords: String(store[KEYS.customKeywords] || ""),
      blockedKeywords: normalizeStringList(store[KEYS.blockedKeywords]),
      keywordPlan,
      logs,
      recentLogs: Array.isArray(store[KEYS.recentLogs]) ? store[KEYS.recentLogs] : [],
      dangerEnabled: isDangerEnabled(store),
      highRiskTasksEnabled: allowsHighRiskTasks(store),
      mobileEnabled: allowsMobileSearch(store),
      mobileLimit: effectiveMobileLimit(store, now),
      mobileCount: readNumber(store, dailyMobileCountKey(now), 0),
      monthChart: buildMonthChartModel(store, now),
      weekCompleteDays: weekCompleteDays(store, now),
      weekCompleteLine: weekCompleteLine(store, now),
      catchUpEnabled: store[KEYS.catchUpEnabled] !== false,
      catchUpAsk: store[KEYS.catchUpAsk] === true,
      missedRemindEnabled: store[KEYS.missedRemindEnabled] !== false,
      quizAssistEnabled: allowsQuizAssist(store),
      weekCells: buildWeekCells(store, now),
      streakDays: consecutiveCompleteDays(store, now),
      streakLine: streakLine(store, now),
      missedYesterday: yesterdayMissed(store, now),
      continueHint: continueHint({
        count,
        limit,
        dailyEnabled,
        dailyDone,
        mobilePending,
        failReasonCode,
        failMessage: lastError || fail.message
      }),
      showWhatsNew: shouldShowWhatsNew(store),
      whatsNew: whatsNewCopy()
    };
  }

  function suggestedTimeLabel() {
    return `今晚 ${formatClock(SUGGESTED_HOUR, SUGGESTED_MINUTE)}`;
  }

  return {
    PRODUCT_NAME_ZH,
    PRODUCT_NAME_EN,
    SEARCH_URL,
    MOBILE_SEARCH_FLAG,
    REWARDS_URL,
    MOBILE_UA,
    MOBILE_SEC_CH_UA,
    MOBILE_UA_RULE_ID,
    ALARM_NAME,
    DEFAULT_SEARCH_LIMIT,
    DEFAULT_NO_GAIN_LIMIT,
    DEFAULT_DAILY_RETRIES,
    DEFAULT_MOBILE_LIMIT,
    SUGGESTED_HOUR,
    SUGGESTED_MINUTE,
    MIN_SEARCH_INTERVAL,
    MAX_SEARCH_INTERVAL,
    DEFAULT_INTERVAL_MIN,
    DEFAULT_INTERVAL_MAX,
    PRODUCT_VERSION,
    QUIZ_ASSIST_MAX_HITS,
    DAY_RECORD_KEEP_DAYS,
    DAY_RECORD_SHOW_DAYS,
    DAY_CHART_DAYS,
    WEEKEND_GOAL_SAME,
    WEEKDAY_NAMES,
    WORD_PACK_SHORT,
    WORD_PACK_LONG,
    WORD_PACK_CUSTOM,
    LEGACY_CHANNELS,
    KEYWORD_NOTE,
    GOALS,
    GOAL_LABELS,
    REPEAT,
    REPEAT_LABELS,
    PAUSE_REASONS,
    FAIL_CODES,
    TASK_STATUS,
    TASK_KIND,
    TASK_SELECTORS,
    QUOTA_SELECTORS,
    KEYS,
    SHORT_KEYWORD_POOL,
    LONG_KEYWORD_POOL,
    localDateString,
    dailyCountKey,
    dailyMobileCountKey,
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
    isPaused,
    normalizeRepeatRule,
    isScheduledDay,
    isWeekend,
    shiftLocalDate,
    normalizeWeekendGoal,
    weekendGoalLabel,
    effectiveGoal,
    effectiveSearchLimit,
    readDayRecords,
    pruneDayRecords,
    upsertDayRecord,
    buildWeekCells,
    consecutiveCompleteDays,
    yesterdayMissed,
    streakLine,
    shouldRemindMissed,
    buildDayRecord,
    continueHint,
    whatsNewCopy,
    shouldShowWhatsNew,
    normalizeIntervalRange,
    randomSearchDelayMs,
    pauseStatusText,
    readablePoints,
    pointsGainedFrom,
    normalizeWordPack,
    normalizeGoal,
    goalEnablesDaily,
    goalLabel,
    normalizeStringList,
    parseKeywordText,
    buildKeywordPlan,
    failCopy,
    isMobileFailCode,
    isDangerEnabled,
    allowsHighRiskTasks,
    allowsQuizAssist,
    allowsMobileSearch,
    isMobileDoneToday,
    effectiveMobileLimit,
    shouldRunMobileSearch,
    buildSearchUrl,
    isMobileSearchUrl,
    weekCompleteDays,
    weekCompleteLine,
    readPointsHistory,
    upsertPointsHistory,
    buildMonthChartModel,
    classifyTask,
    taskStatusLabel,
    summarizeTasks,
    formatDailyProgress,
    formatDailyResult,
    formatClosingLine,
    buildTodaySummary,
    formatCompleteNotify,
    appendRunLog,
    formatLogLine,
    todayLogs,
    exportLogsText,
    SETTINGS_EXPORT_KEYS,
    exportSettings,
    importSettings,
    isRewardsDashboardPath,
    isQuizOrVotePage,
    parseQuotaCards,
    readQuotaSnapshot,
    mergeQuotaSnapshot,
    formatPcQuotaHint,
    formatMobileHint,
    formatMobileQuotaLine,
    formatEdgeHint,
    formatQuotaHint,
    parseQuizQuestionTotal,
    formatQuizNextStep,
    formatQuizAssistFallback,
    readTaskList,
    buildViewModel,
    suggestedTimeLabel
  };
})();

if (typeof globalThis !== "undefined") {
  globalThis.BingAssistant = BingAssistant;
}
