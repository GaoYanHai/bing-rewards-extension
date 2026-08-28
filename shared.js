const BingAssistant = (() => {
  const PRODUCT_NAME_ZH = "Bing 积分助手";
  const PRODUCT_NAME_EN = "Bing Rewards Assistant";
  const SEARCH_URL = "https://www.bing.com/search?q=%E5%A4%A9%E6%B0%94%E9%A2%84%E6%8A%A5";
  const REWARDS_URL = "https://rewards.bing.com/";
  const ALARM_NAME = "rebang-daily-auto-start";
  const DEFAULT_SEARCH_LIMIT = 30;
  const DEFAULT_NO_GAIN_LIMIT = 10;
  const DEFAULT_DAILY_RETRIES = 3;
  const DEFAULT_MOBILE_LIMIT = 20;
  const SUGGESTED_HOUR = 21;
  const SUGGESTED_MINUTE = 30;
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

  const FAIL_CODES = {
    LOGIN: "login",
    NO_GAIN: "no_gain",
    RISK: "risk",
    PAGE_CHANGED: "page_changed",
    NETWORK: "network",
    STOPPED: "stopped"
  };

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
    title: ".title, h3, .c-subheading, .ds-card-title, p.offer-title, .c-title"
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
    quizAssistEnabled: "Rebang_QuizAssistEnabled"
  };

  const SHORT_KEYWORD_POOL = [
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
      next: "可以重新开始",
      message: extra.message || "已停止"
    };
  }

  function classifyTask(name, url) {
    const text = `${name || ""} ${url || ""}`;
    const lower = text.toLowerCase();
    if (/安装|购物|问卷|下载|注册账号|外部|app\s*store|google play|amazon|shop|install|survey|download/.test(text) ||
        /install|shop|survey|download|amazon|play\.google/.test(lower)) {
      let kind = TASK_KIND.INSTALL;
      if (/购物|shop|amazon|buy/.test(lower) || /购物/.test(text)) kind = TASK_KIND.SHOP;
      else if (/问卷|survey/.test(lower) || /问卷/.test(text)) kind = TASK_KIND.SURVEY;
      else if (/下载|download/.test(lower) || /下载/.test(text)) kind = TASK_KIND.DOWNLOAD;
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
    return { kind: TASK_KIND.UNKNOWN, status: TASK_STATUS.UNKNOWN, reason: "识别失败" };
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

  function formatDailyProgress(summary, dailyEnabled, dailyDone) {
    if (!dailyEnabled) return "未开启（安全模式）";
    if (!summary || summary.total === 0) return dailyDone ? "已完成" : "待识别";
    const autoTotal = summary.autoTotal || 0;
    const autoDone = summary.autoDone || 0;
    const manual = summary.manual || 0;
    if (dailyDone && autoPendingSafe(summary) === 0) {
      return manual > 0 ? `${autoDone}/${autoTotal} 可自动 · ${manual} 需手动` : "已完成";
    }
    return `${autoDone}/${autoTotal} 可自动 · ${manual} 需手动`;
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

  function readTaskList(store, now = new Date()) {
    const raw = store[KEYS.taskList];
    if (!raw || typeof raw !== "object") return { date: localDateString(now), cards: [] };
    if (raw.date !== localDateString(now)) return { date: localDateString(now), cards: [] };
    return { date: raw.date, cards: Array.isArray(raw.cards) ? raw.cards : [] };
  }

  function buildViewModel(store, now = new Date()) {
    const count = readNumber(store, dailyCountKey(now), 0);
    const limit = Math.max(1, readNumber(store, KEYS.limitSearchCount, DEFAULT_SEARCH_LIMIT));
    const goal = normalizeGoal(store);
    const dailyEnabled = goalEnablesDaily(goal);
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

    let state = "ready";
    if (!riskAccepted) state = "onboarding";
    else if (loginState === "out") state = "logged_out";
    else if (running) state = "running";
    else if (productState === "failed" && (count < limit || (dailyEnabled && !dailyDone))) state = "failed";
    else if (count >= limit && (!dailyEnabled || dailyDone || (dailySummary.total > 0 && dailySummary.autoPending === 0))) state = "complete";
    else if (productState === "complete" && (!dailyEnabled || dailyDone)) state = "complete";
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
      goal,
      goalLabel: goalLabel(goal),
      dailyEnabled,
      dailyDone,
      dailySummary,
      dailyProgress: formatDailyProgress(dailySummary, dailyEnabled, dailyDone),
      taskCards: taskList.cards,
      waitingTask,
      schedule,
      nextRunLabel: formatNextRunLabel(store[KEYS.autoStartHour], store[KEYS.autoStartMin], now),
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
      mobileEnabled: store[KEYS.mobileSearchEnabled] === true,
      mobileLimit: Math.max(0, readNumber(store, KEYS.mobileSearchLimit, DEFAULT_MOBILE_LIMIT)),
      mobileCount: readNumber(store, dailyMobileCountKey(now), 0),
      catchUpEnabled: store[KEYS.catchUpEnabled] !== false,
      catchUpAsk: store[KEYS.catchUpAsk] === true,
      quizAssistEnabled: store[KEYS.quizAssistEnabled] === true
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
    DEFAULT_MOBILE_LIMIT,
    SUGGESTED_HOUR,
    SUGGESTED_MINUTE,
    WORD_PACK_SHORT,
    WORD_PACK_LONG,
    WORD_PACK_CUSTOM,
    LEGACY_CHANNELS,
    KEYWORD_NOTE,
    GOALS,
    GOAL_LABELS,
    FAIL_CODES,
    TASK_STATUS,
    TASK_KIND,
    TASK_SELECTORS,
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
    normalizeWordPack,
    normalizeGoal,
    goalEnablesDaily,
    goalLabel,
    normalizeStringList,
    parseKeywordText,
    buildKeywordPlan,
    failCopy,
    classifyTask,
    taskStatusLabel,
    summarizeTasks,
    formatDailyProgress,
    appendRunLog,
    formatLogLine,
    todayLogs,
    exportLogsText,
    readTaskList,
    buildViewModel,
    suggestedTimeLabel
  };
})();

if (typeof globalThis !== "undefined") {
  globalThis.BingAssistant = BingAssistant;
}
