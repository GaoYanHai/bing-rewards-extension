(async function rebangExtensionMain() {
"use strict";

const rebangExtensionStore = await chrome.storage.local.get(null);

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    Object.entries(changes).forEach(([key, change]) => {
        if (typeof change.newValue === "undefined") delete rebangExtensionStore[key];
        else rebangExtensionStore[key] = change.newValue;
    });
    const shouldRefreshBar = Object.keys(changes).some((key) =>
        key === BingAssistant.KEYS.autoSearchLock ||
        key === BingAssistant.KEYS.limitSearchCount ||
        key === BingAssistant.KEYS.lastKeyword ||
        key === BingAssistant.KEYS.productState ||
        key === BingAssistant.KEYS.paused ||
        key === BingAssistant.KEYS.pauseReason ||
        key === BingAssistant.KEYS.waitingUserTask ||
        key === BingAssistant.KEYS.userTaskAction ||
        key === BingAssistant.KEYS.taskList ||
        key === BingAssistant.KEYS.dailyKeywordPlan ||
        key === BingAssistant.KEYS.blockedKeywords ||
        key === BingAssistant.KEYS.selectedChannel ||
        key === BingAssistant.KEYS.keywordShuffle ||
        key.indexOf("Rebang_AutoSearchCount_") === 0
    );
    if (changes[BingAssistant.KEYS.dailyKeywordPlan] || changes[BingAssistant.KEYS.blockedKeywords] || changes[BingAssistant.KEYS.selectedChannel] || changes[BingAssistant.KEYS.keywordShuffle]) {
        try { sessionStorage.removeItem(getCurrentChannelKeywordsCacheKey()); } catch (error) {}
        if (typeof initKeywords === "function" && $("#ext-keywords-list").length) initKeywords();
    }
    if (shouldRefreshBar && typeof updateMiniBar === "function") updateMiniBar();
    if (changes[BingAssistant.KEYS.taskList] && typeof renderTaskListFromStore === "function") renderTaskListFromStore();
    if ((changes[BingAssistant.KEYS.userTaskAction] || changes[BingAssistant.KEYS.paused]) && typeof handleRewardsPage === "function" && location.hostname === "rewards.bing.com") {
        handleRewardsPage();
    }
});

function GM_getValue(key, defaultValue) {
    return Object.prototype.hasOwnProperty.call(rebangExtensionStore, key)
        ? rebangExtensionStore[key]
        : defaultValue;
}

function GM_setValue(key, value) {
    rebangExtensionStore[key] = value;
    chrome.storage.local.set({ [key]: value }).catch((error) => {
        console.error(`[Rebang] 保存设置失败: ${key}`, error);
    });
}

function GM_addStyle(cssText) {
    const style = document.createElement("style");
    style.textContent = cssText;
    (document.head || document.documentElement).appendChild(style);
    return style;
}

// 测试模式开关
// 1: 开启测试模式。点击"开始"时，强制重置今日所有状态（用于调试）。
// 0: 正常模式。智能判断是否已完成，完成后不再重复运行。
const TEST_MODE = 0 // 0=正常模式, 1=测试模式(点击"开始"时强制重置今日所有状态)
// 跨天检测用：从持久存储读取上次检查日期，首次运行时初始化为今天
const SCRIPT_LOAD_DATE = GM_getValue("Rebang_LastCheckDate", getLocalDateStr());

// ==========================================
// 样式定义区 (UI)
// ==========================================
GM_addStyle(`
        #rebang-widget {
        position: fixed;
        width: 320px;
        background-color: rgba(255, 255, 255, 0.98);
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        border-radius: 12px;
        z-index: 99999;
        font-family: 'Segoe UI', Arial, sans-serif;
        border: 1px solid #e0e0e0;
                display: flex;
        flex-direction: column;
        overflow: hidden;
        color-scheme: light; /* 默认亮色 */

    }
    /* === 滚动条美化 === */
    #rebang-body::-webkit-scrollbar { width: 6px; }
    #rebang-body::-webkit-scrollbar-track { background: transparent; }
    #rebang-body::-webkit-scrollbar-thumb { background-color: #ccc; border-radius: 3px; }
    #rebang-body::-webkit-scrollbar-thumb:hover { background-color: #aaa; }

    /* === 自动设置行样式 (移除行内样式，改为Class控制) === */
    .auto-row {
        background: #f0f0f0;
        padding: 5px;
        border-radius: 4px;
        border: 1px solid transparent; /* 占位防止抖动 */
    }

    /* === 适配系统级深色模式 === */
    @media (prefers-color-scheme: dark) {
        #rebang-widget { background-color: #2b2b2b; border-color: #444; color: #eee; color-scheme: dark; }
        #rebang-header { background-color: #3a3a3a !important; border-bottom-color: #444 !important; }
        .keyword-link { color: #bbb !important; }
        .keyword-link:hover { color: #fff !important; }
        #rebang-widget select, #rebang-widget input { background-color: #444; color: #fff; border: 1px solid #555; }
        #rebang-widget select option { background-color: #444; color: #fff; }
        #rebang-body::-webkit-scrollbar-thumb { background-color: #555; }
        #rebang-body::-webkit-scrollbar-thumb:hover { background-color: #777; }

        /* 自动部分深色适配 */
        .auto-row { background-color: #3a3a3a; border-color: #444; }
        /* 进度条深色适配 */
        .search-progress-container { background: #444; }
        .search-progress-bar { background: linear-gradient(90deg, #0078d4, #00b4d8, #0078d4); }
        /* 当前高亮项深色适配 */
        .keyword-link-current {
            background: linear-gradient(90deg, rgba(217, 83, 79, 0.2), rgba(217, 83, 79, 0.1), rgba(217, 83, 79, 0.2)) !important;
        }
    }

    /* === 适配 Bing 网页版强制深色模式 (类名 .b_dark) === */
    .b_dark #rebang-widget {
        background-color: #2b2b2b;
        border-color: #444;
        color: #eee;
        color-scheme: dark;
    }
    .b_dark #rebang-header {
        background-color: #3a3a3a !important;
        border-bottom-color: #444 !important;
    }
    .b_dark #rebang-widget .keyword-link { color: #bbb !important; }
    .b_dark #rebang-widget .keyword-link:hover { color: #fff !important; }
    .b_dark #rebang-widget select,
    .b_dark #rebang-widget input {
        background-color: #444;
        color: #fff;
        border: 1px solid #555;
    }
    .b_dark #rebang-widget select option { background-color: #444; color: #fff; }
    .b_dark #rebang-body::-webkit-scrollbar-thumb { background-color: #555; }
    .b_dark #rebang-body::-webkit-scrollbar-thumb:hover { background-color: #777; }
    /* 进度条深色适配 */
    .b_dark .search-progress-container { background: #444; }
    .b_dark .keyword-link-current {
        background: linear-gradient(90deg, rgba(217, 83, 79, 0.2), rgba(217, 83, 79, 0.1), rgba(217, 83, 79, 0.2)) !important;
    }

    /* === 通用组件样式 === */
    #rebang-header {
        padding: 10px 15px;
        background-color: #f8f9fa;
        border-bottom: 1px solid #eee;
        cursor: move;
        display: flex;
        justify-content: space-between;
        align-items: center;
        user-select: none;
    }
    #rebang-title { font-weight: bold; font-size: 14px; color: #0078d4; }
    #rebang-controls { display: flex; gap: 8px; }
    .rebang-btn-icon { cursor: pointer; font-size: 16px; line-height: 1; opacity: 0.6; }
    .rebang-btn-icon:hover { opacity: 1; }
    #rebang-body { padding: 12px; max-height: 520px; display: flex; flex-direction: column; }
    #rebang-body.minimized { display: none; }
    #rebang-controls-fixed { flex-shrink: 0; }
    .control-row { display: flex; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 5px; font-size: 12px; }
    .form-select { padding: 2px 5px; border-radius: 4px; border: 1px solid #ccc; max-width: 100px; font-size: 12px; outline: none; }
    .time-select { width: 45px; text-align: center; }
    button.rebang-btn { background: #0078d4; color: white; border: none; padding: 3px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; }
    button.rebang-btn:hover { background: #006abc; }
    button.rebang-btn.stop { background: #d9534f; }
    button.rebang-btn.save { background: #107c10; margin-left: auto; }
    #ext-keywords-list {
        margin-top: 10px;
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        min-height: 0;
        scrollbar-width: thin;
        scrollbar-color: #ccc transparent;
    }
    #ext-keywords-list::-webkit-scrollbar { width: 6px; }
    #ext-keywords-list::-webkit-scrollbar-track { background: transparent; }
    #ext-keywords-list::-webkit-scrollbar-thumb { background-color: #ccc; border-radius: 3px; }
    #ext-keywords-list::-webkit-scrollbar-thumb:hover { background-color: #aaa; }
    .keyword-link { display: block; width: 100%; padding: 3px 0; text-decoration: none; color: #333; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .keyword-link:hover { color: #0078d4; background: rgba(0,0,0,0.03); }
    .keyword-link-current {
        font-weight: bold;
        color: #d9534f !important;
        background: linear-gradient(90deg, rgba(217, 83, 79, 0.1), rgba(217, 83, 79, 0.05), rgba(217, 83, 79, 0.1));
        animation: pulse-highlight 2s ease-in-out infinite;
        border-left: 3px solid #d9534f;
        padding-left: 8px;
        border-radius: 3px;
    }
    @keyframes pulse-highlight {
        0%, 100% { background-color: rgba(217, 83, 79, 0.05); }
        50% { background-color: rgba(217, 83, 79, 0.15); }
    }
    .keyword-link-searched {
        color: #888 !important;
        text-decoration: line-through;
        opacity: 0.6;
    }
    /* 搜索进度条 */
    .search-progress-container {
        margin: 8px 0;
        background: #f0f0f0;
        border-radius: 10px;
        height: 8px;
        overflow: hidden;
        position: relative;
    }
    .search-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #0078d4, #00b4d8, #0078d4);
        background-size: 200% 100%;
        border-radius: 10px;
        transition: width 0.5s ease;
        animation: shimmer 2s linear infinite;
    }
    @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
    /* 运行状态指示器 */
    .running-indicator {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #107c10;
        margin-right: 5px;
        animation: blink 1s ease-in-out infinite;
    }
    @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
    }
    .status-running { color: #107c10; font-weight: bold; }
    .status-idle { color: #888; }
    #ex-user-msg { font-size: 12px; color: #d9534f; margin-top: 5px; display: block; min-height: 18px; }
    .checkbox-wrapper { display: flex; align-items: center; gap: 4px; }
    input[type=checkbox] { accent-color: #0078d4; }
    #rebang-widget { width: min(420px, calc(100vw - 24px)); }
    #rebang-header { min-height: 48px; padding: 8px 12px; gap: 8px; flex-wrap: nowrap; }
    #rebang-title { font-size: 13px; }
    #rebang-mini-progress { margin-left: auto; font-size: 12px; color: #0078d4; font-weight: 600; white-space: nowrap; }
    #rebang-mini-current { font-size: 12px; color: #666; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #888; display: inline-block; flex-shrink: 0; }
    .status-dot.running { background: #107c10; }
    #ext-autosearch-lock { height: 32px; padding: 0 12px; }
    .rebang-pack-note { font-size: 12px; color: #666; margin: 8px 0; display: flex; justify-content: space-between; gap: 8px; align-items: center; }
    .rebang-log { font-size: 12px; color: #666; padding: 2px 0; }
    #ext-task-list { margin: 8px 0; max-height: 180px; overflow: auto; }
    .rebang-task { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; padding: 4px 0; border-bottom: 1px solid rgba(0,0,0,0.06); }
    .rebang-task span { color: #666; white-space: nowrap; }
    #ext-task-summary { font-size: 12px; color: #666; margin: 6px 0; }
    #ext-skip-user-task, #ext-confirm-user-task { margin: 6px 6px 10px 0; }
    .status-dot.paused { background: #c19c00; }
    #ext-user-task-actions { display: none; margin: 6px 0 10px; }
    #ex-user-msg { color: #605e5c; }
    .b_dark #rebang-mini-current, .b_dark .rebang-pack-note, .b_dark .rebang-log, .b_dark #ex-user-msg { color: #bbb; }
    @media (prefers-color-scheme: dark) {
        #rebang-mini-current, .rebang-pack-note, .rebang-log, #ex-user-msg { color: #bbb; }
    }
`);

// 修复：不使用 this（严格模式下 this 为 undefined 会崩溃）
// 将 $ 声明在顶层，确保所有函数都能访问
var $ = jQuery.noConflict(true);

// ==========================================
// 工具函数与状态管理
// ==========================================

// GM_getValue / GM_setValue 封装
function getVal(key, defaultValue) { return GM_getValue(key, defaultValue); }
function setVal(key, value) { GM_setValue(key, value); }

let simulatingTyping = false;
let searchInFlight = false;
let lastUserInputAt = 0;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRunPaused() {
    return getVal(BingAssistant.KEYS.paused, false) === true && getVal(autoSearchLockKey, "off") === "on";
}

function currentIntervalRange() {
    return BingAssistant.normalizeIntervalRange(
        getVal(BingAssistant.KEYS.searchIntervalMin, BingAssistant.DEFAULT_INTERVAL_MIN),
        getVal(BingAssistant.KEYS.searchIntervalMax, BingAssistant.DEFAULT_INTERVAL_MAX)
    );
}

function isEditableTarget(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    const tag = (el.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (el.isContentEditable) return true;
    return false;
}

function isFullscreenNow() {
    if (document.fullscreenElement) return true;
    return window.innerHeight >= screen.height - 2 && window.innerWidth >= screen.width - 2;
}

function isUserBusyNow() {
    if (simulatingTyping) return false;
    if (Number(getVal(BingAssistant.KEYS.ignoreBusyUntil, 0)) > Date.now()) return false;
    if (getVal(BingAssistant.KEYS.pauseWhenBusy, true) === false) return false;
    if (isFullscreenNow()) return true;
    const typingRecently = Date.now() - lastUserInputAt < 4000;
    return typingRecently && isEditableTarget(document.activeElement);
}

function rememberStartPoints(points) {
    if (points === null || points === undefined) return;
    const existing = BingAssistant.readablePoints(getVal(BingAssistant.KEYS.runStartPoints, null));
    if (existing === null) setVal(BingAssistant.KEYS.runStartPoints, Number(points));
}

function setUserTaskButtons(visible) {
    const box = $("#ext-user-task-actions");
    if (box.length) box.toggle(!!visible);
    $("#ext-confirm-user-task").toggle(!!visible);
    $("#ext-skip-user-task").toggle(!!visible);
}

document.addEventListener("keydown", (event) => {
    if (simulatingTyping) return;
    if (isEditableTarget(event.target) || isEditableTarget(document.activeElement)) {
        lastUserInputAt = Date.now();
    }
}, true);
document.addEventListener("input", (event) => {
    if (simulatingTyping) return;
    if (isEditableTarget(event.target)) lastUserInputAt = Date.now();
}, true);

// 常量定义
const prefix = "Rebang_";
const autoSearchLockKey = `${prefix}AutoSearchLock`; // 搜索开关锁
const enableDailyTasksKey = `${prefix}EnableDailyTasks`; // 是否启用每日任务
const maxNoGainLimitKey = `${prefix}MaxNoGainLimit`; // 连续无积分熔断阈值
const dailyTaskMaxRetriesKey = `${prefix}DailyTaskMaxRetries`; // 任务重试次数
const autoSearchLockExpiresKey = `${prefix}AutoSearchLockExpires`; // 搜索冷却时间
const consecutiveNoGainKey = `${prefix}ConsecutiveNoGainCount`; // 连续无积分计数
const lastPointsKey = `${prefix}LastPoints`; // 上次记录的积分
const autoStartHourKey = `${prefix}AutoStartHour`; // 自动开始小时
const autoStartMinKey = `${prefix}AutoStartMin`; // 自动开始分钟
const limitSearchCountKey = `${prefix}LimitSearchCount`; // 每日搜索限制

// ==========================================
// 多标签页互斥与协同逻辑常量
// ==========================================
const globalLockKey = `${prefix}GlobalLastRunTime`;   // 全局最后一次执行时间（所有标签页共享）
const globalMasterTabKey = `${prefix}GlobalMasterTabId`; // 当前主控标签页的ID
const globalMasterStatusKey = `${prefix}GlobalMasterStatus`; //主控运行状态标识: "RUNNING" 或 "IDLE"
// ==========================================
// 使用 sessionStorage 固定当前标签页 ID
// 这样即使搜索刷新页面，ID也不会变，主控权牢牢锁定在当前标签页
// ==========================================
let currentTabId = sessionStorage.getItem("Rebang_TabId");
if (!currentTabId) {
    currentTabId = Date.now() + "_" + Math.floor(Math.random() * 10000);
    sessionStorage.setItem("Rebang_TabId", currentTabId);
}



// ==========================================
// 标签页状态同步函数
// ==========================================
function syncTabStatus() {
    let now = Date.now();
    let lastRun = Number(getVal(globalLockKey, 0));
    let masterId = getVal(globalMasterTabKey, "");
    let masterStatus = getVal(globalMasterStatusKey, "IDLE");

    // 当前页面的搜索开关状态 ("on" 为正在跑, "off" 为停止/闲置)
    let mySwitchState = getVal(autoSearchLockKey, "off");

    // 判定主控是否"死掉" (超过15秒没更新心跳)
    let isMasterDead = (now - lastRun > 15000);

    let isMaster = false;

    // --- 场景 1: 我就是主控 ---
    if (masterId === currentTabId) {
        isMaster = true;
        // 更新心跳
        setVal(globalLockKey, now);

        // 【关键】: 把我当前的状态(忙碌还是闲置)广播出去
        if (mySwitchState === "on") {
            setVal(globalMasterStatusKey, "RUNNING");
        } else {
            // 我虽然是主控，但我没事做（搜完了或被手动停了），标记为 IDLE
            setVal(globalMasterStatusKey, "IDLE");
        }
    }
    // --- 场景 2: 别人是主控 ---
    else {
        // 核心抢夺逻辑：
        // 1. 主控死掉了 (isMasterDead) -> 抢
        // 2. 主控还活着，但是它处于闲置状态 (Status == IDLE) -> 抢
        if (masterId === "" || isMasterDead || masterStatus === "IDLE") {
            console.log(`[Rebang] 检测到主控空闲或失效 (Status:${masterStatus}, Dead:${isMasterDead})，正在接管...`);

            // 抢夺主控权
            setVal(globalMasterTabKey, currentTabId);
            setVal(globalLockKey, now);
            setVal(globalMasterStatusKey, mySwitchState === "on" ? "RUNNING" : "IDLE");

            // 立即刷新UI状态
            $("#ext-autosearch-lock").text("停止").addClass("stop");

            isMaster = true;
        } else {
            // 主控正在 RUNNING 且没死，我老实待机
            isMaster = false;
        }
    }

    // === UI 显示控制 ===
    if ($("#rebang-widget").length > 0) {
        $("#rebang-widget").show();
        if (isMaster) {
            const title = mySwitchState === "on" ? "Bing 积分助手" : "Bing 积分助手";
            $("#rebang-title").text(title);
            $("#rebang-widget").css("opacity", "1");
        } else {
            $("#rebang-title").text("其他标签页正在运行");
            $("#rebang-widget").css("opacity", "0.7");
        }
        updateMiniBar();
    }

    return isMaster;
}

// 状态 Key (用于跨标签页通信)
const rewardsFailCountKey = `${prefix}RewardsFailCount`; // 积分页：连续未涨分计数
const rewardsLastPointsKey = `${prefix}RewardsLastPoints`; // 积分页：上次点击时的积分
const jumpFailCountKey = `${prefix}JumpFailCount`; // 搜索页：连续跳转无收益计数
const jumpLastPointsKey = `${prefix}JumpLastPoints`; // 搜索页：上次跳转时的积分
const rewardsClickTimeKey = `${prefix}RewardsClickTime`; // 任务点击时间戳

const selectedChannelKey = `${prefix}SelectedChannel`; // 当前选中的榜单
const currentKeywordIndexKey = `${prefix}CurrentKeywordIndex`; // 当前搜索到第几个词
const channelListKey = `${prefix}Channels`; // 榜单列表缓存
const widgetPosKey = `${prefix}WidgetPosition`; // 悬浮窗位置
const widgetStateKey = `${prefix}WidgetState`; // 悬浮窗折叠状态
// ==========================================
// 本地关键词库（彻底摆脱外部 API 依赖）
// ==========================================
const LOCAL_KEYWORD_POOL = [
    // 科技数码
    "人工智能最新进展","ChatGPT使用技巧","智能手机推荐","笔记本电脑选购","平板电脑对比",
    "5G网络覆盖","智能家居设备","相机选购指南","耳机推荐","机械键盘评测",
    // 新闻时事
    "今日国内新闻","国际热点事件","经济形势分析","股市行情走势","房产政策解读",
    "教育改革最新","医疗健康新规","交通出行变化","天气预报查询","法律法规常识",
    // 生活百科
    "健康养生方法","美食菜谱推荐","旅游景点攻略","运动健身计划","减肥瘦身方法",
    "护肤美容技巧","服装穿搭推荐","家居装修设计","二手车选购","宠物养护知识",
    // 娱乐休闲
    "热门电影推荐","电视剧排行榜","综艺节目排名","音乐排行榜","游戏攻略秘籍",
    "小说推荐排行","动漫新番推荐","相声小品合集","综艺节目盘点","明星八卦新闻",
    // 体育赛事
    "足球比赛结果","NBA最新赛况","体育赛事直播","奥运会新闻","世界杯赛程",
    "羽毛球比赛","乒乓球赛事","游泳锦标赛","田径世界纪录","电竞比赛结果",
    // 学习教育
    "编程入门教程","英语学习方法","数学解题技巧","历史知识普及","物理科普文章",
    "化学实验视频","地理知识问答","文学名著赏析","哲学思想入门","心理学入门",
    // 汽车出行
    "新能源汽车推荐","汽车评测对比","二手车市场","驾照考试技巧","自驾游路线",
    // 财经理财
    "理财入门知识","基金投资技巧","股票分析方法","保险选购指南","储蓄理财方法",
    // 美食
    "家常菜做法","烘焙入门教程","地方特色小吃","健康饮食搭配","咖啡文化介绍",
    // 自然科学
    "宇宙探索发现","深海生物奥秘","恐龙化石研究","气候变化影响","新能源技术"
];

const SHORT_KEYWORD_POOL = [
    "天气预报","今日新闻","翻译","地图","汇率查询","股票行情","快递查询","家常菜谱",
    "电影票","火车票","今日油价","手机推荐","笔记本电脑","无线耳机","数码相机",
    "健身计划","减肥方法","护肤步骤","穿搭灵感","旅游攻略","酒店预订","机票查询",
    "世界杯","足球比分","NBA赛况","编程入门","英语单词","历史故事","物理科普",
    "基金入门","保险知识","理财方法","咖啡做法","新能源汽车","驾照考试","宠物护理",
    "小说推荐","音乐排行","手机游戏","动漫推荐","健康饮食","地方小吃","宇宙探索",
    "智能家居","机械键盘","相机镜头","二手车","自驾游","心理学","地理知识"
];

// 基于日期+频道名的伪随机数生成器（确保每天、每个榜单生成不同的排列）
function dailyRandomSeed(channelName) {
    let dateStr = getLocalDateStr() + "|" + (channelName || "");
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
        hash = hash & hash; // 转为32位整数
    }
    return Math.abs(hash);
}

function seededShuffle(arr, seed) {
    let shuffled = arr.slice();
    let m = shuffled.length;
    let s = seed;
    while (m > 0) {
        s = (s * 1103515245 + 12345) & 0x7fffffff; // LCG 线性同余
        let i = s % m;
        m--;
        [shuffled[m], shuffled[i]] = [shuffled[i], shuffled[m]];
    }
    return shuffled;
}

// 生成每日关键词列表（每天、每个榜单顺序不同）
function getKeywordPool(packName) {
    return packName === BingAssistant.WORD_PACK_LONG ? LOCAL_KEYWORD_POOL : SHORT_KEYWORD_POOL;
}

function generateDailyKeywords(count, channelName) {
    const plan = BingAssistant.buildKeywordPlan({
        ...rebangExtensionStore,
        [BingAssistant.KEYS.selectedChannel]: channelName || getCurrentChannel()
    }, count);
    setVal(BingAssistant.KEYS.dailyKeywordPlan, {
        date: plan.date,
        pack: plan.pack,
        words: plan.words,
        note: plan.note
    });
    return plan.items;
}

// 动态 Key 生成函数
const getDailyTaskRedirectTimeKey = () => `${prefix}DailyTaskRedirectTime`;

// 【重要】获取本地日期字符串 (YYYY-MM-DD)
// 解决了原版使用 UTC 时间导致早上 0-8 点判定为昨天的 bug
function getLocalDateStr() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 每日动态 Key
function getAutoSearchCountKey() {
  return `${prefix}AutoSearchCount_${getLocalDateStr()}`;
}

function getAutoStartTriggeredKey() {
  return `${prefix}AutoStartTriggered_${getLocalDateStr()}`;
}

function getDailyTasksDoneKey() {
  return `${prefix}DailyTasksDone_${getLocalDateStr()}`;
}

// ==========================================
// 【新增优化】防休眠与死页自动复活模块
// 解决浏览器后台冻结页面导致定时任务失效的问题
// ==========================================
var _antiSleepInitialized = false; // 修复：防止递归调用导致多个 setInterval 累加

function initAntiSleepProtection() {
    // 修复：如果已经初始化过，只重新申请唤醒锁，不再创建新的 setInterval
    if (_antiSleepInitialized) {
        // 唤醒锁被释放后，只需重新申请，不需要重建心跳
        if ('wakeLock' in navigator) {
            try {
                navigator.wakeLock.request('screen').then(lock => {
                    console.log("[Rebang] 唤醒锁已重新获取");
                    lock.addEventListener('release', () => {
                        console.log('[Rebang] 唤醒锁被释放，正在重新申请...');
                        initAntiSleepProtection();
                    });
                }).catch(e => {});
            } catch (e) {}
        }
        return;
    }
    _antiSleepInitialized = true;

    console.log("[Rebang] 启动防休眠保护系统...");

    // 1. 申请屏幕唤醒锁 (降低被浏览器判定为闲置的概率)
    if ('wakeLock' in navigator) {
        try {
            navigator.wakeLock.request('screen').then(lock => {
                console.log("[Rebang] 屏幕唤醒锁已获取 (Screen WakeLock Active)");
                lock.addEventListener('release', () => {
                    console.log('[Rebang] 唤醒锁被释放，正在重新申请...');
                    initAntiSleepProtection();
                });
            }).catch(e => console.log("[Rebang] 唤醒锁获取受阻:", e));
        } catch (e) {}
    }

    // 2. 强力心跳检测 (检测页面是否刚刚从"假死"中醒来)
    let lastHeartbeat = Date.now();
    const checkInterval = 2000; // 每2秒跳动一次
    const freezeThreshold = 15000; // 阈值：如果超过15秒没跳动，判定为曾被冻结

    setInterval(() => {
        const now = Date.now();
        const timeDiff = now - lastHeartbeat;

        // 检测是否发生过"时间跳跃"（即页面被挂起）
        if (timeDiff > freezeThreshold) {
            console.warn(`[Rebang] ⚠️ 检测到页面曾被冻结 ${timeDiff / 1000}秒！`);
            console.warn(`[Rebang] 正在执行"热重启"以恢复脚本活性...`);
            window.location.reload();
        }

        // 3. 动态标题微扰 (防止Chrome强行休眠后台Tab)
        if (document.hidden && getVal(autoSearchLockKey, "off") === "on") {
             const title = document.title;
             if (title.endsWith(".")) document.title = title.slice(0, -1);
             else document.title = title + ".";
        }

        lastHeartbeat = now;
    }, checkInterval);
}

// ==========================================
// 核心逻辑：获取积分 (深度修复版)
// ==========================================

// 辅助解析函数：安全解析积分文本
function parsePointsText(text) {
    if (!text) return null;
    // 1. 去除逗号 (例如 "17,036" -> "17036")
    let clean = text.replace(/,/g, '');
    // 2. 提取第一组连续数字，忽略后续干扰字符
    // 这一步能防止如果有漏网之鱼拼接到一起，只取前面的部分
    let match = clean.match(/(\d+)/);
    if (match) {
        return parseInt(match[1], 10);
    }
    return null;
}

// 【搜索页面】专用逻辑 (完全复刻脚本2)
function getSearchPagePoints() {
    // 优先级 1: 脚本2 验证最有效的选择器 (.points-container)
    let $pointsEl = $(".points-container");
    if ($pointsEl.length > 0) {
        // 必须使用 first() 防止多元素拼接
        return parsePointsText($pointsEl.first().text());
    }

    // 优先级 2: 移动端/侧边栏 (备用)
    let $sidebarPoints = $(".b_id_c .id_text");
    if ($sidebarPoints.length > 0) {
        return parsePointsText($sidebarPoints.first().text());
    }

    // 优先级 3: 旧版 ID (仅当确认为数字时返回)
    let $oldId = $("#id_rc");
    if ($oldId.length > 0) {
        let txt = $oldId.text().trim();
        if (txt && /\d/.test(txt)) return parsePointsText(txt);
    }

    return null;
}

// 【Rewards页面】专用逻辑 (针对你提供的 HTML 结构修复)
function getRewardsPagePoints() {
    // 优先级 1: 【精确匹配】用户提供的 HTML 结构 (#balanceToolTipDiv)
    // 结构: #balanceToolTipDiv -> .pointsValue -> span
    let $userTarget = $("#balanceToolTipDiv .pointsValue span");
    if ($userTarget.length > 0) {
        // 关键修复：使用 .first() 确保只获取第一个匹配项，防止数值超出
        return parsePointsText($userTarget.first().text());
    }

    // 优先级 2: 新版 Dashboard Header
    let $header = $("dashboard-header").find("span.title-m, span.headline-m, .mee-icon-text span");
    if ($header.length > 0) {
        return parsePointsText($header.first().text());
    }

    // 优先级 3: 动画计数器 (必须加 .first() !!!)
    // 之前的 bug 就是因为这里获取了页面所有计数器并拼接了
    let $anim = $("mee-rewards-counter-animation span");
    if ($anim.length > 0) {
        return parsePointsText($anim.first().text());
    }

    // 优先级 4: 余额卡片兜底
    let $balance = $("div[data-testid='balance-card'] h1, div[class*='balance'] span");
    if ($balance.length > 0) {
        return parsePointsText($balance.first().text());
    }

    return null;
}

// 主入口：严格分流，互不干扰
function getBingPoints() {
    if (window.location.hostname === "rewards.bing.com") {
        return getRewardsPagePoints();
    } else {
        return getSearchPagePoints();
    }
}

function stopAutoSearch(msg, reason, reasonCode, extra) {
    setVal(autoSearchLockKey, "off");
    setVal(BingAssistant.KEYS.waitingUserTask, null);
    $("#ext-autosearch-lock").text("开始").removeClass("stop");
    $("#ext-status-indicator").html('● <span class="status-idle">已停止</span>');
    $("#ext-current-keyword").text("-");
    if (msg) showUserMessage(msg);
    updateMiniBar();
    chrome.runtime.sendMessage({
        type: "RUN_FINISHED",
        reason: reason || "stopped",
        reasonCode: reasonCode || "",
        where: extra && extra.where,
        message: msg || "",
        count: Number(getVal(getAutoSearchCountKey(), 0)),
        limit: Number(getVal(limitSearchCountKey, BingAssistant.DEFAULT_SEARCH_LIMIT)),
        startedAt: Number(getVal(BingAssistant.KEYS.runStartedAt, 0))
    }).catch(() => {});
}

// 【关键逻辑】每天随机切换榜单并清理旧缓存
// 确保每天第一次运行时，或者挂机跨天时，自动换一个新榜单并获取最新数据
function checkAndRandomizeDailyChannel(channelList) {
    if (!channelList || channelList.length === 0) return;
    const todayStr = getLocalDateStr();
    const lastSelectDate = localStorage.getItem(`${prefix}LastAutoSelectDate`);
    if (lastSelectDate !== todayStr) {
        localStorage.setItem(currentKeywordIndexKey, 0);
        localStorage.setItem(`${prefix}LastAutoSelectDate`, todayStr);
        sessionStorage.removeItem(getCurrentChannelKeywordsCacheKey());
        showUserMessage("新的一天，已生成今日搜索词");
        initKeywords();
    }
}

// 切换到下一个榜单（关键词用完时循环）
function switchToNextChannel() {
    showUserMessage("这批搜索词用完了，正在换一批", { action: "这批搜索词用完了，正在换一批" });
    setVal(BingAssistant.KEYS.keywordShuffle, Number(getVal(BingAssistant.KEYS.keywordShuffle, 0)) + 1);
    sessionStorage.removeItem(getCurrentChannelKeywordsCacheKey());
    localStorage.setItem(currentKeywordIndexKey, 0);
    initKeywords();
}

function truncateText(str, maxlength) {
  return str.length > maxlength ? str.slice(0, maxlength - 1) + "…" : str;
}

// 修复：HTML 转义函数，防止 XSS 注入
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getCurrentChannelKeywordsCacheKey() {
  return `${prefix}${getCurrentChannel()}`;
}

function getCurrentChannel() {
  let value = getVal(selectedChannelKey, localStorage.getItem(selectedChannelKey) || BingAssistant.WORD_PACK_SHORT);
  if (!value || BingAssistant.LEGACY_CHANNELS.includes(value)) {
    value = BingAssistant.WORD_PACK_SHORT;
  }
  value = BingAssistant.normalizeWordPack(value);
  if (getVal(selectedChannelKey, "") !== value) setVal(selectedChannelKey, value);
  if (localStorage.getItem(selectedChannelKey) !== value) localStorage.setItem(selectedChannelKey, value);
  return value;
}

function detectLoginState() {
  const points = getBingPoints();
  if (points !== null) return "in";
  const name = ($("#id_n").text() || "").trim();
  if (name) return "in";
  const signIn = $("#id_s, #id_l, a[href*='login.live.com'], a[href*='signin']").filter(function() {
    const label = (($(this).text() || "") + " " + ($(this).attr("aria-label") || "")).trim();
    return /登录|sign in/i.test(label) || this.id === "id_s";
  });
  if (signIn.length > 0) return "out";
  const snippet = ((document.body && document.body.innerText) || "").slice(0, 2500);
  if (/请登录|sign in to microsoft|sign in with microsoft/i.test(snippet) && points === null) return "out";
  return "unknown";
}

function stopForLogin(duringRun) {
  const copy = BingAssistant.failCopy(BingAssistant.FAIL_CODES.LOGIN, { duringRun: !!duringRun });
  stopAutoSearch(copy.message, "failed", BingAssistant.FAIL_CODES.LOGIN);
}

function stopForReason(code, extra) {
  const copy = BingAssistant.failCopy(code, extra || {});
  stopAutoSearch(copy.message, "failed", code, extra);
}

let lastPublishedState = "";
function publishAssistantState() {
  const points = getBingPoints();
  const login = detectLoginState();
  const keyword = ($("#ext-current-keyword").text() || "").replace(/^-$/, "").trim();
  const snapshot = JSON.stringify({
    points,
    login,
    keyword,
    lock: getVal(autoSearchLockKey, "off"),
    msg: ($("#ex-user-msg").text() || "").trim()
  });
  if (snapshot === lastPublishedState) return;
  lastPublishedState = snapshot;
  const payload = {
    [BingAssistant.KEYS.loginState]: login,
    [BingAssistant.KEYS.lastKeyword]: keyword,
    [BingAssistant.KEYS.lastStatusMessage]: ($("#ex-user-msg").text() || "").trim()
  };
  if (points !== null) payload[BingAssistant.KEYS.pointsBalance] = points;
  chrome.storage.local.set(payload).catch(() => {});
}

function pushRunLog(event) {
  const logs = BingAssistant.appendRunLog(getVal(BingAssistant.KEYS.runLogs, []), event || {});
  setVal(BingAssistant.KEYS.runLogs, logs);
  const recent = logs.slice(0, 8).map((item) => ({ t: item.t, text: BingAssistant.formatLogLine(item) }));
  setVal(BingAssistant.KEYS.recentLogs, recent);
  renderRecentLogs();
}

function pushRecentLog(msg) {
  pushRunLog({ action: String(msg || "") });
}

function renderRecentLogs() {
  const box = $("#ext-recent-logs");
  if (!box.length) return;
  let logs = getVal(BingAssistant.KEYS.recentLogs, []);
  if (!Array.isArray(logs)) logs = [];
  box.empty();
  logs.forEach((item) => {
    box.append(`<div class="rebang-log">${escapeHtml(item.text || "")}</div>`);
  });
}

function updateMiniBar() {
  const count = Number(getVal(getAutoSearchCountKey(), 0));
  const limit = Number(getVal(limitSearchCountKey, BingAssistant.DEFAULT_SEARCH_LIMIT));
  const running = getVal(autoSearchLockKey, "off") === "on";
  const paused = isRunPaused();
  const model = BingAssistant.buildViewModel(rebangExtensionStore);
  $("#rebang-mini-progress").text(`电脑搜索 ${count}/${limit}`);
  $("#ext-task-summary").text(`每日活动 ${model.dailyProgress}`);
  $("#ext-current-count").text(count);
  $("#rebang-dot").toggleClass("running", running && !paused);
  $("#rebang-dot").toggleClass("paused", paused);
  if (paused) {
    $("#ext-autosearch-lock").text("继续").removeClass("stop");
  } else if (running) {
    $("#ext-autosearch-lock").text("停止").addClass("stop");
  } else {
    $("#ext-autosearch-lock").text("开始").removeClass("stop");
  }
  const keyword = ($("#ext-current-keyword").text() || "").trim();
  if (paused) $("#rebang-mini-current").text("已暂停");
  else $("#rebang-mini-current").text(running && keyword && keyword !== "-" ? keyword : "");
  publishAssistantState();
}

function showUserMessage(msg, logEvent) {
  $("#ex-user-msg").text(msg);
  if (logEvent === true) pushRunLog({ action: msg });
  else if (logEvent && typeof logEvent === "object") pushRunLog(logEvent);
  publishAssistantState();
}

function findSearchBox() {
    const $input = $("#sb_form_q");
    let $btn = $("#sb_form_go");
    if ($btn.length === 0) $btn = $("#sb_form_submit");
    if ($btn.length === 0) $btn = $(".search_icon, .b_searchboxSubmit");
    return { $input, $btn };
}

function nativeSetValue(el, value) {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) desc.set.call(el, value);
    else el.value = value;
}

function doSearch(keyword) {
    const box = findSearchBox();
    if (box.$input.length > 0 && box.$btn.length > 0) {
        box.$input.val(keyword);
        try {
            nativeSetValue(box.$input[0], keyword);
            box.$input[0].dispatchEvent(new Event("input", { bubbles: true }));
        } catch (e) {}
        box.$btn[0].click();
        return true;
    }
    pushRunLog({
        action: "找不到搜索框",
        result: "改用跳转搜索",
        reason: "页面改版",
        reasonCode: BingAssistant.FAIL_CODES.PAGE_CHANGED
    });
    window.location.href = "https://www.bing.com/search?q=" + encodeURIComponent(keyword) + "&form=QBRE&sp=-1&lq=0";
    return false;
}

async function typeKeywordLikeHuman(keyword) {
    const box = findSearchBox();
    if (box.$input.length === 0 || box.$btn.length === 0) return false;
    simulatingTyping = true;
    try {
        box.$input.trigger("focus");
        nativeSetValue(box.$input[0], "");
        box.$input[0].dispatchEvent(new Event("input", { bubbles: true }));
        for (let i = 0; i < keyword.length; i++) {
            if (getVal(autoSearchLockKey, "off") !== "on" || isRunPaused()) return false;
            nativeSetValue(box.$input[0], keyword.slice(0, i + 1));
            box.$input[0].dispatchEvent(new Event("input", { bubbles: true }));
            await sleep(70 + Math.floor(Math.random() * 110));
        }
        await sleep(180 + Math.floor(Math.random() * 220));
        if (getVal(autoSearchLockKey, "off") !== "on" || isRunPaused()) return false;
        box.$btn[0].click();
        return true;
    } catch (error) {
        return false;
    } finally {
        simulatingTyping = false;
    }
}

async function performSearch(keyword) {
    const simulate = getVal(BingAssistant.KEYS.simulateTyping, false) === true;
    if (simulate) {
        const typed = await typeKeywordLikeHuman(keyword);
        if (typed) return true;
        if (getVal(autoSearchLockKey, "off") !== "on" || isRunPaused()) return false;
    }
    return doSearch(keyword);
}

async function maybeHandleBusyPause() {
    if (getVal(autoSearchLockKey, "off") !== "on") return false;
    if (getVal(BingAssistant.KEYS.pauseReason, "") === BingAssistant.PAUSE_REASONS.USER) return true;
    if (isUserBusyNow()) {
        if (!isRunPaused()) {
            await chrome.runtime.sendMessage({
                type: "PAUSE_TODAY",
                reason: BingAssistant.PAUSE_REASONS.BUSY,
                message: "你正在用电脑，已暂时停下"
            }).catch(() => {});
            showUserMessage("你正在用电脑，已暂时停下");
            updateMiniBar();
        }
        return true;
    }
    if (isRunPaused() && getVal(BingAssistant.KEYS.pauseReason, "") === BingAssistant.PAUSE_REASONS.BUSY) {
        await chrome.runtime.sendMessage({
            type: "RESUME_TODAY",
            silent: true,
            ignoreBusyMs: 0
        }).catch(() => {});
        showUserMessage("已继续今天的任务");
        updateMiniBar();
        return false;
    }
    return isRunPaused();
}

// ==========================================
// 每日任务黑名单管理 (跳过卡住的任务)
// ==========================================
function getTaskBlacklistKey() {
    return `${prefix}TaskBlacklist_${getLocalDateStr()}`;
}

function getTaskBlacklist() {
    return JSON.parse(getVal(getTaskBlacklistKey(), "[]"));
}

function addTaskToBlacklist(url) {
    let list = getTaskBlacklist();
    if (url && !list.includes(url)) {
        list.push(url);
        setVal(getTaskBlacklistKey(), JSON.stringify(list));
    }
}

// ==========================================
// 页面逻辑：Rewards 任务页
// ==========================================

let pointsMissCount = 0;
let searchBoxMissCount = 0;
let rewardsCardMissCount = 0;

function goToRewardsPage(nowTime, currentPoints) {
    let lastRedirect = Number(getVal(getDailyTaskRedirectTimeKey(), 0));
    if (nowTime - lastRedirect < 60 * 1000) {
        let waitSec = Math.ceil((60000 - (nowTime - lastRedirect)) / 1000);
        showUserMessage(`正在等待每日活动页面准备好（还剩 ${waitSec} 秒）`);
        return;
    }
    setVal(globalLockKey, nowTime);
    setVal(globalMasterTabKey, currentTabId);
    showUserMessage("电脑搜索已完成，正在打开每日活动", { action: "电脑搜索已完成，正在打开每日活动" });
    if (currentPoints !== null) setVal(jumpLastPointsKey, currentPoints);
    setVal(getDailyTaskRedirectTimeKey(), nowTime);
    setVal(rewardsClickTimeKey, 0);
    setVal(rewardsLastPointsKey, -1);
    setVal(rewardsFailCountKey, 0);
    setTimeout(() => { window.location.href = BingAssistant.REWARDS_URL; }, 1000);
}

function currentGoal() {
    return BingAssistant.normalizeGoal(rebangExtensionStore);
}

function dailyTasksWanted() {
    return BingAssistant.goalEnablesDaily(currentGoal());
}

function cardTitle($card, fallback) {
    const selectors = BingAssistant.TASK_SELECTORS.title.split(",");
    for (const selector of selectors) {
        const text = $card.find(selector.trim()).first().text().replace(/\s+/g, " ").trim();
        if (text) return text;
    }
    const aria = ($card.find("a").first().attr("aria-label") || "").trim();
    if (aria) return aria;
    return fallback;
}

function scanRewardCards() {
    const selectors = BingAssistant.TASK_SELECTORS;
    let $cards = $(selectors.cards);
    if ($cards.length === 0) $cards = $("mee-card, .c-card-content");
    const previous = BingAssistant.readTaskList(rebangExtensionStore).cards;
    const prevByUrl = new Map(previous.map((card) => [card.url, card]));
    const cards = [];
    $cards.each(function(index) {
        const $card = $(this);
        const $link = $card.find(selectors.link).first();
        const url = ($link.attr("href") || "").trim();
        const name = cardTitle($card, $link.text().replace(/\s+/g, " ").trim() || ("活动" + (index + 1)));
        const completed = $card.find(selectors.completed).length > 0;
        const locked = $card.find(selectors.locked).length > 0;
        if (!url || url.indexOf("http") !== 0) return;
        const classified = BingAssistant.classifyTask(name, url);
        const prev = prevByUrl.get(url);
        let status = classified.status;
        let reason = classified.reason;
        if (completed) {
            status = BingAssistant.TASK_STATUS.DONE;
            reason = prev && prev.reason ? prev.reason : "已完成";
        } else if (locked) {
            status = BingAssistant.TASK_STATUS.SKIPPED;
            reason = "未解锁";
        } else if (prev && prev.status === BingAssistant.TASK_STATUS.DONE) {
            status = BingAssistant.TASK_STATUS.DONE;
            reason = prev.reason || reason;
        }
        cards.push({
            id: url,
            name,
            url,
            kind: classified.kind,
            status,
            reason,
            updatedAt: Date.now()
        });
    });
    return cards;
}

function saveTaskList(cards) {
    setVal(BingAssistant.KEYS.taskList, {
        date: getLocalDateStr(),
        cards
    });
}

function renderTaskList(cards) {
    const box = $("#ext-task-list");
    if (!box.length) return;
    const list = Array.isArray(cards) ? cards : [];
    const summary = BingAssistant.summarizeTasks(list);
    $("#ext-task-summary").text(`每日活动 ${BingAssistant.formatDailyProgress(summary, dailyTasksWanted(), getVal(getDailyTasksDoneKey(), false) === true)}`);
    if (!list.length) {
        box.html('<div class="rebang-log">还没有识别到活动卡片</div>');
        return;
    }
    box.empty();
    list.slice(0, 12).forEach((card) => {
        box.append(`<div class="rebang-task">${escapeHtml(truncateText(card.name, 16))}<span>${escapeHtml(BingAssistant.taskStatusLabel(card))}</span></div>`);
    });
}

function renderTaskListFromStore() {
    renderTaskList(BingAssistant.readTaskList(rebangExtensionStore).cards);
}

function markCard(cards, url, status, reason) {
    return cards.map((card) => card.url === url ? { ...card, status, reason, updatedAt: Date.now() } : card);
}

function pickNextTask(cards) {
    const goal = currentGoal();
    const blacklist = getTaskBlacklist();
    const sessionClicked = JSON.parse(sessionStorage.getItem("Rebang_SessionClicked") || "[]");
    const actionable = cards.filter((card) => {
        if (card.status === BingAssistant.TASK_STATUS.DONE) return false;
        if (blacklist.includes(card.url) || sessionClicked.includes(card.url)) return false;
        return true;
    });
    const autoCard = actionable.find((card) => card.kind === BingAssistant.TASK_KIND.EXPLORE && card.status === BingAssistant.TASK_STATUS.AUTO);
    if (autoCard) return { card: autoCard, mode: "auto" };
    if (goal === BingAssistant.GOALS.TRY_ALL) {
        const manualCard = actionable.find((card) => card.status === BingAssistant.TASK_STATUS.MANUAL);
        if (manualCard) return { card: manualCard, mode: "manual" };
    }
    return null;
}

function finishDailyAndReturn(msg, logEvent) {
    setVal(getDailyTasksDoneKey(), true);
    setVal(BingAssistant.KEYS.waitingUserTask, null);
    sessionStorage.removeItem("Rebang_SessionClicked");
    if (msg) showUserMessage(msg, logEvent || { action: msg });
    const count = Number(getVal(getAutoSearchCountKey(), 0));
    const limit = Number(getVal(limitSearchCountKey, BingAssistant.DEFAULT_SEARCH_LIMIT));
    setTimeout(() => {
        if (count >= limit) stopAutoSearch(msg || "今天的任务已完成", "complete");
        window.location.href = BingAssistant.SEARCH_URL;
    }, 1200);
}

async function handleRewardsPage() {
    let isLocked = getVal(autoSearchLockKey, "off");
    let currentPoints = getBingPoints();
    if (currentPoints !== null) {
        $("#ext-rewards-points").text(currentPoints);
        setVal(lastPointsKey, currentPoints);
    }
    publishAssistantState();

    const cards = scanRewardCards();
    if (cards.length) {
        rewardsCardMissCount = 0;
        saveTaskList(cards);
        renderTaskList(cards);
        const loggedSkipKey = "Rebang_LoggedSkip";
        let logged = JSON.parse(sessionStorage.getItem(loggedSkipKey) || "[]");
        cards.forEach((card) => {
            if ((card.status === BingAssistant.TASK_STATUS.SKIPPED || card.status === BingAssistant.TASK_STATUS.UNKNOWN) && !logged.includes(card.url)) {
                logged.push(card.url);
                pushRunLog({
                    action: `跳过「${card.name}」`,
                    result: "已跳过",
                    reason: card.reason || "识别失败"
                });
            }
        });
        sessionStorage.setItem(loggedSkipKey, JSON.stringify(logged));
    } else {
        renderTaskList(BingAssistant.readTaskList(rebangExtensionStore).cards);
    }

    if (isLocked !== "on") return;
    rememberStartPoints(currentPoints);
    if (isRunPaused()) {
        $("#rebang-mini-progress").text("已暂停");
        $("#rebang-dot").removeClass("running").addClass("paused");
    } else {
        $("#rebang-dot").addClass("running").removeClass("paused");
    }

    const login = detectLoginState();
    if (login === "out") {
        stopForLogin(true);
        return;
    }
    if (!navigator.onLine) {
        stopForReason(BingAssistant.FAIL_CODES.NETWORK);
        return;
    }
    if (!dailyTasksWanted()) {
        showUserMessage("安全模式已开，正在返回搜索", { action: "安全模式已开，正在返回搜索" });
        setTimeout(() => { window.location.href = BingAssistant.SEARCH_URL; }, 1000);
        return;
    }

    const userAction = getVal(BingAssistant.KEYS.userTaskAction, "");
    if (userAction === "skip") {
        setVal(BingAssistant.KEYS.userTaskAction, "");
        $("#ext-skip-user-task").click();
        return;
    }

    if (isRunPaused() && userAction !== "done") {
        const waitingNow = getVal(BingAssistant.KEYS.waitingUserTask, null);
        if (waitingNow && waitingNow.url) {
            showUserMessage(`需要你点一下：${waitingNow.name || "每日活动"}`);
            setUserTaskButtons(true);
        } else {
            showUserMessage(BingAssistant.pauseStatusText(getVal(BingAssistant.KEYS.pauseReason, "")));
            setUserTaskButtons(false);
        }
        return;
    }

    if (!cards.length) {
        rewardsCardMissCount += 1;
        if (document.readyState === "complete" && rewardsCardMissCount >= 8) {
            const copy = BingAssistant.failCopy(BingAssistant.FAIL_CODES.PAGE_CHANGED, { where: "rewards" });
            finishDailyAndReturn(copy.message, { action: "每日活动", result: "识别失败", reason: "页面改版", reasonCode: BingAssistant.FAIL_CODES.PAGE_CHANGED });
            return;
        }
        showUserMessage("正在读取每日活动...");
        return;
    }

    const waiting = getVal(BingAssistant.KEYS.waitingUserTask, null);
    if (waiting && waiting.url) {
        const current = cards.find((card) => card.url === waiting.url);
        if (current && current.status === BingAssistant.TASK_STATUS.DONE) {
            setVal(BingAssistant.KEYS.waitingUserTask, null);
            setVal(BingAssistant.KEYS.userTaskAction, "");
            setVal(BingAssistant.KEYS.userTaskConfirmTries, 0);
            setUserTaskButtons(false);
            showUserMessage(`“${truncateText(waiting.name, 10)}”已完成，继续处理`, { action: `“${waiting.name}”`, result: "已完成" });
        } else if (userAction === "done") {
            let tries = Number(getVal(BingAssistant.KEYS.userTaskConfirmTries, 0)) + 1;
            setVal(BingAssistant.KEYS.userTaskConfirmTries, tries);
            const lastPts = Number(getVal(rewardsLastPointsKey, -1));
            if (currentPoints !== null && lastPts !== -1 && currentPoints > lastPts) {
                const updated = markCard(cards, waiting.url, BingAssistant.TASK_STATUS.DONE, `积分 +${currentPoints - lastPts}`);
                saveTaskList(updated);
                renderTaskList(updated);
                setVal(BingAssistant.KEYS.waitingUserTask, null);
                setVal(BingAssistant.KEYS.userTaskAction, "");
                setVal(BingAssistant.KEYS.userTaskConfirmTries, 0);
                setUserTaskButtons(false);
                showUserMessage(`“${truncateText(waiting.name, 10)}”已得分`, { action: `“${waiting.name}”`, result: "已完成" });
            } else if (tries >= 3) {
                setVal(BingAssistant.KEYS.userTaskAction, "");
                showUserMessage("还没看到这张完成。确认点完后再试，或跳过这张。");
                setUserTaskButtons(true);
                return;
            } else {
                showUserMessage("正在确认你刚才点的活动是否完成...");
                setUserTaskButtons(true);
                return;
            }
        } else {
            showUserMessage(`需要你点一下：${waiting.name || "每日活动"}`);
            setUserTaskButtons(true);
            return;
        }
    }
    setUserTaskButtons(false);

    if (await maybeHandleBusyPause()) {
        if (waiting && waiting.url) setUserTaskButtons(true);
        return;
    }

    let lastClickTime = Number(getVal(rewardsClickTimeKey, 0));
    let now = new Date().getTime();
    if (now - lastClickTime < 5000) {
        let left = Math.ceil((5000 - (now - lastClickTime)) / 1000);
        showUserMessage(`正在确认刚才的活动是否加分（还剩 ${left} 秒）`);
        return;
    }

    let rewardsLastPoints = Number(getVal(rewardsLastPointsKey, -1));
    let failCount = Number(getVal(rewardsFailCountKey, 0));
    let maxRetries = Number(getVal(dailyTaskMaxRetriesKey, 3));
    const lastTarget = JSON.parse(sessionStorage.getItem("Rebang_LastTask") || "null");

    if (lastTarget && rewardsLastPoints !== -1 && currentPoints !== null) {
        if (currentPoints > rewardsLastPoints) {
            const gained = currentPoints - rewardsLastPoints;
            const updated = markCard(cards, lastTarget.url, BingAssistant.TASK_STATUS.DONE, `积分 +${gained}`);
            saveTaskList(updated);
            renderTaskList(updated);
            showUserMessage(`“${truncateText(lastTarget.name, 10)}”已得分`, { action: `打开「${lastTarget.name}」`, result: `积分 +${gained}` });
            setVal(rewardsFailCountKey, 0);
            sessionStorage.removeItem("Rebang_LastTask");
        } else {
            failCount += 1;
            setVal(rewardsFailCountKey, failCount);
            if (failCount >= maxRetries) {
                addTaskToBlacklist(lastTarget.url);
                const updated = markCard(cards, lastTarget.url, BingAssistant.TASK_STATUS.SKIPPED, "多次没有加分");
                saveTaskList(updated);
                renderTaskList(updated);
                showUserMessage(`“${truncateText(lastTarget.name, 8)}”多次没有加分，已跳过`, { action: `跳过「${lastTarget.name}」`, result: "已跳过", reason: "多次没有加分" });
                setVal(rewardsFailCountKey, 0);
                sessionStorage.removeItem("Rebang_LastTask");
            } else {
                showUserMessage(`正在确认「${truncateText(lastTarget.name, 10)}」是否加分（${failCount}/${maxRetries}）`);
                return;
            }
        }
    }

    const latestCards = BingAssistant.readTaskList(rebangExtensionStore).cards;
    const next = pickNextTask(latestCards);
    if (!next) {
        finishDailyAndReturn("每日活动已处理完，正在返回搜索");
        return;
    }

    const target = next.card;
    if (target.status === BingAssistant.TASK_STATUS.SKIPPED || target.status === BingAssistant.TASK_STATUS.UNKNOWN) {
        showUserMessage(`跳过「${truncateText(target.name, 10)}」（${target.reason || "识别失败"}）`, { action: `跳过「${target.name}」`, result: "已跳过", reason: target.reason || "识别失败" });
        const sessionClicked = JSON.parse(sessionStorage.getItem("Rebang_SessionClicked") || "[]");
        sessionClicked.push(target.url);
        sessionStorage.setItem("Rebang_SessionClicked", JSON.stringify(sessionClicked));
        return;
    }

    if (next.mode === "manual") {
        setVal(BingAssistant.KEYS.waitingUserTask, { name: target.name, url: target.url, kind: target.kind, reason: target.reason });
        if (currentPoints !== null) setVal(rewardsLastPointsKey, currentPoints);
        showUserMessage(`需要你点一下：${target.name}`, { action: `需要你点一下：${target.name}`, reason: target.reason });
        setUserTaskButtons(true);
        return;
    }

    const $link = $("a[href]").filter(function() { return (this.getAttribute("href") || "") === target.url; }).first();
    if (!$link.length) {
        const updated = markCard(latestCards, target.url, BingAssistant.TASK_STATUS.UNKNOWN, "页面改版");
        saveTaskList(updated);
        showUserMessage("找不到这张活动卡片，页面可能已改版", { action: `「${target.name}」`, result: "识别失败", reason: "页面改版", reasonCode: BingAssistant.FAIL_CODES.PAGE_CHANGED });
        return;
    }

    showUserMessage(`正在打开活动：${truncateText(target.name, 10)}`, { action: `打开「${target.name}」`, result: "可自动完成" });
    if (currentPoints !== null) setVal(rewardsLastPointsKey, currentPoints);
    setVal(rewardsClickTimeKey, now);
    const sessionClicked = JSON.parse(sessionStorage.getItem("Rebang_SessionClicked") || "[]");
    sessionClicked.push(target.url);
    sessionStorage.setItem("Rebang_SessionClicked", JSON.stringify(sessionClicked));
    sessionStorage.setItem("Rebang_LastTask", JSON.stringify({ name: target.name, url: target.url }));
    try {
        $link.attr("target", "_blank");
        $link[0].click();
    } catch (error) {
        window.open(target.url, "_blank");
    }
}

async function doAutoSearch() {
  if (searchInFlight) return;
  // --- 多标签页互斥检查 (要求1 & 4) ---
  // 每次执行搜索前，先同步状态。如果不是主控页，且有其他页面刚跑过，则跳过本次执行。
  let isMaster = syncTabStatus();
  let lastGlobalRun = Number(getVal(globalLockKey, 0));
  let nowTime = Date.now();
  const relayRetryKey = `${prefix}RelayRetryCount`; // 换页重试计数

  // 【核心修复逻辑】
  // 原代码是: if (!isMaster && (nowTime - lastGlobalRun < 8000)) { ... }
  // 这意味着如果主控休息了9秒（但他还在正常等待中），副页面就会抢走执行权。
  // 修改后：只要 isMaster 为 false，说明 syncTabStatus 认为主控还活着（没超过20秒），
  // 那么我就绝对不动，老老实实待机，实现"固定主控"。
  if (!isMaster) {
      console.log(`[Rebang] Slave tab standby. Waiting for Master.`);
      return;
  }
  if (await maybeHandleBusyPause()) {
      updateMiniBar();
      return;
  }
  // -----------------------------------

  // 【修复关键】：优先读取 UI 复选框的实时状态，防止存储延迟导致读取为 false
  let enableDaily = dailyTasksWanted();
  let dailyDone = getVal(getDailyTasksDoneKey(), false) === true || getVal(getDailyTasksDoneKey(), false) === "true";

  if (!navigator.onLine) {
      stopForReason(BingAssistant.FAIL_CODES.NETWORK);
      return;
  }
  const login = detectLoginState();
  if (login === "out") {
      stopForLogin(true);
      return;
  }
  if ($("#sb_form_q").length === 0 && document.readyState === "complete") {
      searchBoxMissCount += 1;
      if (searchBoxMissCount >= 8) {
          stopForReason(BingAssistant.FAIL_CODES.PAGE_CHANGED, { where: "search" });
          return;
      }
      showUserMessage("正在查找搜索框...");
      return;
  }
  searchBoxMissCount = 0;

  let currentPoints = getBingPoints();
  rememberStartPoints(currentPoints);
  if (currentPoints === null) {
      pointsMissCount += 1;
      if (document.readyState === "complete" && pointsMissCount >= 8) {
          if (login === "in") stopForReason(BingAssistant.FAIL_CODES.PAGE_CHANGED, { where: "search" });
          else stopForLogin(true);
          return;
      }
      showUserMessage("正在确认登录和积分...");
      return;
  }
  pointsMissCount = 0;

  const currentSearchCountNow = Number(getVal(getAutoSearchCountKey(), 0));
  const limitSearchCountNow = Number(getVal(limitSearchCountKey, BingAssistant.DEFAULT_SEARCH_LIMIT));
  if (currentSearchCountNow >= limitSearchCountNow) {
      if (enableDaily && !dailyDone) {
          goToRewardsPage(nowTime, currentPoints);
          return;
      }
      setVal(lastPointsKey, null);
      setVal(globalMasterStatusKey, "IDLE");
      stopAutoSearch("今天的电脑搜索已完成", "complete");
      return;
  }

  let jobLockExpires = Number(getVal(autoSearchLockExpiresKey, 0));
  let now = Date.now();

  if (jobLockExpires > now) {
      let secondsLeft = Math.ceil((jobLockExpires - now) / 1000);
      const range = currentIntervalRange();
      showUserMessage(`正在模拟常规搜索，间隔 ${range.min}-${range.max} 秒（还剩 ${secondsLeft} 秒）`);
      return;
  }

  let lastPoints = getVal(lastPointsKey, null);
  let currentSearchCount = Number(getVal(getAutoSearchCountKey(), 0));
  let isPointsIncreased = false;

  let maxNoGainLimit = Number(getVal(maxNoGainLimitKey, 10));
  let consecutiveNoGain = Number(getVal(consecutiveNoGainKey, 0));

  // 积分对比
  if (lastPoints !== null) {
      let lastP = Number(lastPoints);
      if (currentPoints > lastP) {
          currentSearchCount++;
          setVal(getAutoSearchCountKey(), currentSearchCount);
          isPointsIncreased = true;
          setVal(consecutiveNoGainKey, 0);

          // 【修复】积分涨了，说明当前页面正常，重置"换页重试计数"
          setVal(relayRetryKey, 0);

          console.log(`[Rebang] Points increased: ${lastP} -> ${currentPoints}.`);
      } else {
          consecutiveNoGain++;
          setVal(consecutiveNoGainKey, consecutiveNoGain);

          // 连续无积分保护逻辑
          if (consecutiveNoGain >= maxNoGainLimit) {
              const code = currentSearchCount === 0 ? BingAssistant.FAIL_CODES.RISK : BingAssistant.FAIL_CODES.NO_GAIN;
              stopForReason(code, { limit: maxNoGainLimit });
              return;
          }
      }
  }

  $("#ext-current-count").text(currentSearchCount);

  // 【新增】更新进度条和状态指示器
  let limitSearchCount = Number(getVal(limitSearchCountKey, BingAssistant.DEFAULT_SEARCH_LIMIT));
  let progressPercent = Math.min((currentSearchCount / limitSearchCount) * 100, 100);
  $("#search-progress-bar").css("width", progressPercent + "%");

  // 更新状态指示器
  $("#ext-status-indicator").html('<span class="running-indicator"></span> <span class="status-running">运行中</span>');

  // 每日搜索次数限制
  if (currentSearchCount >= limitSearchCount) {
      setVal(lastPointsKey, null);
      setVal(globalMasterStatusKey, "IDLE");
      if (enableDaily && !dailyDone) {
          goToRewardsPage(Date.now(), currentPoints);
          return;
      }
      stopAutoSearch("今天的电脑搜索已完成", "complete");
      return;
  }

  // --- 确认为有效搜索，更新全局锁 (核心) ---
  // 这会告诉其他标签页："我刚搜过，你们歇着"
  setVal(globalLockKey, Date.now());
  setVal(globalMasterTabKey, currentTabId);
  // -------------------------------------

  // 设置下次搜索的随机延迟 (8-14秒)，使用时间戳存储
  const range = currentIntervalRange();
  let randomDelay = BingAssistant.randomSearchDelayMs(range.min, range.max);
  setVal(autoSearchLockExpiresKey, Date.now() + randomDelay);

  // 获取关键词并执行搜索
  let currentKeywordIndex = Number(localStorage.getItem(currentKeywordIndexKey) ?? 0);
  var cacheKey = getCurrentChannelKeywordsCacheKey();
  var keywords = JSON.parse(sessionStorage.getItem(cacheKey));

  if (keywords && keywords.length > currentKeywordIndex) {
    setVal(lastPointsKey, currentPoints);

    currentKeywordIndex++;
    const blocked = new Set(BingAssistant.normalizeStringList(getVal(BingAssistant.KEYS.blockedKeywords, [])));
    while (currentKeywordIndex <= keywords.length && blocked.has(keywords[currentKeywordIndex - 1].title)) {
      currentKeywordIndex++;
    }
    if (currentKeywordIndex > keywords.length) {
      localStorage.setItem(currentKeywordIndexKey, currentKeywordIndex);
      switchToNextChannel();
      return;
    }
    localStorage.setItem(currentKeywordIndexKey, currentKeywordIndex);

    const word = keywords[currentKeywordIndex - 1].title;
    let result = isPointsIncreased
        ? `积分 +${currentPoints - Number(lastPoints)}`
        : (lastPoints !== null ? `这次没有加分（${consecutiveNoGain}/${maxNoGainLimit}）` : "");
    let msg = result ? `${result}。` : "";
    showUserMessage(`${msg}正在搜索：${truncateText(word, 15)}`, {
        action: `电脑搜索 ${currentSearchCount}/${limitSearchCount}  ${word}`,
        result
    });

    // 立即更新关键词列表的高亮位置（页面跳转前用户就能看到变化）
    renderKeywords(keywords);

    // 【新增】更新当前关键词显示
    let currentKw = truncateText(keywords[currentKeywordIndex - 1].title, 8);
    $("#ext-current-keyword").text(currentKw);
    updateMiniBar();

    searchInFlight = true;
    const startedIndex = currentKeywordIndex;
    try {
      const ok = await performSearch(word);
      if (!ok && isRunPaused()) {
        localStorage.setItem(currentKeywordIndexKey, String(startedIndex - 1));
      }
    } finally {
      searchInFlight = false;
    }
  } else {
    // 如果没有关键词或搜完了
    if (!keywords) {
        initKeywords();
    } else {
        switchToNextChannel();
    }
  }
}

// 初始化榜单下拉框
function initChannels(channels, selectedChannel) {
  $("#ext-channels").empty();
  channels?.forEach(function (element) {
    var opt = new Option(element, element);
    opt.selected = element == selectedChannel;
    $("#ext-channels").append(opt);
  });
  if (localStorage.getItem(selectedChannelKey) == null) {
    localStorage.setItem(selectedChannelKey, BingAssistant.WORD_PACK_SHORT);
  }
  initKeywords();
}

// 初始化/获取关键词（本地生成，不依赖外部 API）
function initKeywords() {
  var cacheKey = getCurrentChannelKeywordsCacheKey();
  var keywords = JSON.parse(sessionStorage.getItem(cacheKey));
  const plan = getVal(BingAssistant.KEYS.dailyKeywordPlan, null);
  const blocked = new Set(BingAssistant.normalizeStringList(getVal(BingAssistant.KEYS.blockedKeywords, [])));
  if (plan && plan.date === getLocalDateStr() && Array.isArray(plan.words) && plan.words.length) {
    keywords = plan.words.filter((word) => !blocked.has(word)).map((title) => ({
      title,
      url: "https://www.bing.com/search?q=" + encodeURIComponent(title)
    }));
    if (keywords.length) {
      sessionStorage.setItem(cacheKey, JSON.stringify(keywords));
      renderKeywords(keywords);
      return;
    }
  }
  if (keywords && keywords.length > 0) {
    renderKeywords(keywords);
  } else {
    var limit = Number(getVal(limitSearchCountKey, BingAssistant.DEFAULT_SEARCH_LIMIT));
    keywords = generateDailyKeywords(limit + 10, getCurrentChannel()).filter((item) => !blocked.has(item.title));
    sessionStorage.setItem(cacheKey, JSON.stringify(keywords));
    renderKeywords(keywords);
    showUserMessage(BingAssistant.KEYWORD_NOTE, { action: BingAssistant.KEYWORD_NOTE });
  }
}

// 渲染关键词列表到悬浮窗
function renderKeywords(keywords) {
  $("#ext-keywords-list").empty();
  let currentIndex = Number(localStorage.getItem(currentKeywordIndexKey) ?? 0);

  keywords.forEach(function (element, index) {
    let activeClass = (index + 1 === currentIndex) ? "keyword-link-current" : "";
    // 修复：对 title 和 href 进行 HTML 转义，防止 XSS
    let safeTitle = escapeHtml(element.title);
    let safeText = escapeHtml(truncateText(element.title, 20));
    let linkHtml = "";
    if ($("#ext-keywords-linktype").val() == "搜索") {
        linkHtml = `<a target='_self' class='keyword-link keyword-link-search ${activeClass}' title='${safeTitle}' href='#'>${index + 1}. ${safeText}</a>`;
    } else {
        let safeUrl = escapeHtml(element.url ?? element.mobileUrl);
        linkHtml = `<a target='_blank' class='keyword-link ${activeClass}' title='${safeTitle}' href='${safeUrl}'>${index + 1}. ${safeText}</a>`;
    }
    $("#ext-keywords-list").append(linkHtml);
  });


  // 【新增】自动滚动到当前高亮的关键词位置，显示在中间
  let $currentItem = $("#ext-keywords-list .keyword-link-current");
  if ($currentItem.length > 0) {
      // 滚动到中间位置，让用户能看到前后的关键词
      $currentItem[0].scrollIntoView({
          behavior: 'smooth',
          block: 'center',  // 显示在中间位置
          inline: 'nearest'
      });
  }

  // 【新增】给已搜索过的关键词添加删除线样式
  $("#ext-keywords-list .keyword-link-search").each(function(index) {
      if (index < currentIndex - 1) {
          $(this).addClass('keyword-link-searched');
      }
  });

  $("#ext-keywords-list .keyword-link-search").click(function (e) {
      e.preventDefault();
      // 点击时同步更新 index，使高亮与实际搜索位置一致
      let clickedTitle = $(this).attr("title");
      let clickedIdx = keywords.findIndex(k => k.title === clickedTitle);
      if (clickedIdx >= 0) {
          localStorage.setItem(currentKeywordIndexKey, clickedIdx + 1);
          renderKeywords(keywords);
      }
      doSearch(clickedTitle);
  });
}

// 恢复悬浮窗位置
function restoreWidgetPosition() {
    const pos = JSON.parse(localStorage.getItem(widgetPosKey));
    if (pos) { $("#rebang-widget").css({ top: pos.top, left: pos.left, right: "auto", bottom: "auto" }); }
    else { $("#rebang-widget").css({ top: "24px", right: "20px" }); }

    if (localStorage.getItem("Rebang_MiniBarMigrated") !== "1") {
        localStorage.setItem(widgetStateKey, "true");
        localStorage.setItem("Rebang_MiniBarMigrated", "1");
    }
    const saved = localStorage.getItem(widgetStateKey);
    const isMinimized = saved === null ? true : saved === "true";
    if (isMinimized) { $("#rebang-body").addClass("minimized"); $("#rebang-toggle-icon").text("+"); }
    else { $("#rebang-toggle-icon").text("−"); }
}

function bindMiniBarToggle() {
    $("#rebang-toggle-icon").off("click.rebang").on("click.rebang", function() {
        const body = $("#rebang-body");
        if (body.hasClass("minimized")) {
            body.removeClass("minimized");
            $(this).text("−");
            localStorage.setItem(widgetStateKey, "false");
            renderRecentLogs();
        } else {
            body.addClass("minimized");
            $(this).text("+");
            localStorage.setItem(widgetStateKey, "true");
        }
    });
}

// 拖拽功能实现
function makeDraggable(elementId, handleId) {
    const el = document.getElementById(elementId);
    if(!el) return;
    const handle = document.getElementById(handleId);
    let isDragging = false, startX, startY, initialLeft, initialTop;

    handle.addEventListener('mousedown', function(e) {
        isDragging = true; startX = e.clientX; startY = e.clientY;
        const rect = el.getBoundingClientRect(); initialLeft = rect.left; initialTop = rect.top;
        el.style.right = 'auto'; document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        el.style.left = `${initialLeft + (e.clientX - startX)}px`;
        el.style.top = `${initialTop + (e.clientY - startY)}px`;
    });
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false; document.body.style.userSelect = '';
            const rect = el.getBoundingClientRect();
            localStorage.setItem(widgetPosKey, JSON.stringify({ top: rect.top + 'px', left: rect.left + 'px' }));
        }
    });
}

// 定时检查是否需要自动开始 (优化版：包含跨天自动刷新)
function checkAutoStart() {
    let currentDate = getLocalDateStr();
    let lastCheckDate = GM_getValue("Rebang_LastCheckDate", currentDate);
    if (currentDate !== lastCheckDate) {
        console.log(`[Rebang] 检测到日期变更 (${lastCheckDate} -> ${currentDate})，执行跨天刷新...`);
        GM_setValue("Rebang_LastCheckDate", currentDate);
        location.reload();
        return;
    }

    let channelList = sessionStorage.getItem(channelListKey);
    if (channelList) {
        checkAndRandomizeDailyChannel(JSON.parse(channelList));
    }

    let startHourStr = getVal(autoStartHourKey, "-1");
    let startMinStr = getVal(autoStartMinKey, "-1");
    let startHour = parseInt(startHourStr, 10);
    let startMin = parseInt(startMinStr, 10);
    if (isNaN(startHour) || isNaN(startMin) || startHour === -1 || startMin === -1) return;
    if (!BingAssistant.isScheduledDay(new Date(), getVal(BingAssistant.KEYS.repeatRule, BingAssistant.REPEAT.DAILY))) return;

    let triggeredKey = getAutoStartTriggeredKey();
    if (getVal(triggeredKey, "false") === "true") return;

    let now = new Date();
    let isTimeReached = false;
    if (now.getHours() > startHour) {
        isTimeReached = true;
    } else if (now.getHours() === startHour && now.getMinutes() >= startMin) {
        isTimeReached = true;
    }

    if (isTimeReached) {
        let limit = Number(getVal(limitSearchCountKey, BingAssistant.DEFAULT_SEARCH_LIMIT));
        let current = Number(getVal(getAutoSearchCountKey(), 0));
        if (getVal(autoSearchLockKey, "off") !== "on" && current < limit) {
             console.log(`[Rebang] Auto-start triggered. Time: ${now.toLocaleTimeString()}`);
             setVal(triggeredKey, "true");
             $("#ext-autosearch-lock").click();
        } else if (current >= limit) {
             setVal(triggeredKey, "true");
        }
    }
}

function initRewardsControls() {
    if ($("#rebang-widget").length > 0) return;

    const widgetHtml = `
    <div id="rebang-widget">
        <div id="rebang-header">
            <span id="rebang-dot" class="status-dot running"></span>
            <span id="rebang-title">每日活动</span>
            <span id="rebang-mini-progress">每日活动</span>
            <button id="ext-stop-rewards" class="rebang-btn stop" type="button">停止</button>
            <span id="rebang-toggle-icon" class="rebang-btn-icon" title="展开">−</span>
        </div>
        <div id="rebang-body">
            <div class="control-row">当前积分：<span id="ext-rewards-points">--</span></div>
            <div id="ext-task-summary">每日活动 待识别</div>
            <label id="ex-user-msg">正在读取每日活动</label>
            <div id="ext-task-list"></div>
            <div id="ext-user-task-actions" style="display:none">
                <button id="ext-confirm-user-task" class="rebang-btn save" type="button">我点完了</button>
                <button id="ext-skip-user-task" class="rebang-btn" type="button">跳过这张</button>
            </div>
            <div id="ext-recent-logs"></div>
        </div>
    </div>`;

    $("body").append(widgetHtml);
    makeDraggable("rebang-widget", "rebang-header");
    restoreWidgetPosition();
    bindMiniBarToggle();
    renderRecentLogs();

    $("#ext-stop-rewards").click(function() {
        stopAutoSearch("已停止，正在返回搜索", "stopped");
        setTimeout(() => {
            window.location.href = BingAssistant.SEARCH_URL;
        }, 1000);
    });
    $("#ext-skip-user-task").click(function() {
        const waiting = getVal(BingAssistant.KEYS.waitingUserTask, null);
        if (!waiting || !waiting.url) return;
        const cards = markCard(BingAssistant.readTaskList(rebangExtensionStore).cards, waiting.url, BingAssistant.TASK_STATUS.SKIPPED, "你跳过了这张");
        saveTaskList(cards);
        renderTaskList(cards);
        const sessionClicked = JSON.parse(sessionStorage.getItem("Rebang_SessionClicked") || "[]");
        sessionClicked.push(waiting.url);
        sessionStorage.setItem("Rebang_SessionClicked", JSON.stringify(sessionClicked));
        setVal(BingAssistant.KEYS.waitingUserTask, null);
        setVal(BingAssistant.KEYS.userTaskAction, "");
        setVal(BingAssistant.KEYS.userTaskConfirmTries, 0);
        showUserMessage(`已跳过「${waiting.name}」`, { action: `跳过「${waiting.name}」`, result: "已跳过", reason: "你跳过了这张" });
        setUserTaskButtons(false);
    });
    $("#ext-confirm-user-task").click(function() {
        const waiting = getVal(BingAssistant.KEYS.waitingUserTask, null);
        if (!waiting || !waiting.url) return;
        chrome.runtime.sendMessage({ type: "USER_TASK_DONE" }).catch(() => {});
        showUserMessage("正在确认你刚才点的活动是否完成...");
    });
}

function initSearchControls() {
  if (window.top !== window.self) return;
  $("#rebang").remove(); $("#rebang-widget").remove();

  if ($("#rebang-widget").length == 0) {
    const savedLimit = Number(getVal(limitSearchCountKey, BingAssistant.DEFAULT_SEARCH_LIMIT));
    const widgetHtml = `
    <div id="rebang-widget">
        <div id="rebang-header">
            <span id="rebang-dot" class="status-dot"></span>
            <span id="rebang-title">Bing 积分助手</span>
            <span id="rebang-mini-progress">电脑搜索 0/${savedLimit}</span>
            <span id="rebang-mini-current"></span>
            <button id="ext-autosearch-lock" class="rebang-btn" type="button">开始</button>
            <span id="rebang-toggle-icon" class="rebang-btn-icon" title="展开">+</span>
        </div>
        <div id="rebang-body">
            <label id="ex-user-msg"></label>
            <div id="ext-task-summary">每日活动 未开启（安全模式）</div>
            <div class="rebang-pack-note">
                <span>今日词库已生成 · 基于本地词包 · 未使用热榜</span>
                <button id="ext-keywords-refresh" class="rebang-btn" type="button">换一批</button>
                <button id="ext-block-keyword" class="rebang-btn" type="button">拉黑当前词</button>
            </div>
            <div id="ext-recent-logs"></div>
            <div id="ext-keywords-list"></div>
            <div class="control-row"><button id="rebang-open-options" class="rebang-btn" type="button">打开设置</button></div>
            <input type="hidden" id="ext-autosearch-limit" value="${savedLimit}">
            <select id="ext-channels" hidden></select>
            <select id="ext-keywords-linktype" hidden><option value="搜索" selected>搜索</option></select>
            <span id="ext-current-count" hidden>0</span>
            <span id="ext-current-keyword" hidden>-</span>
            <span id="ext-status-indicator" hidden></span>
            <div class="search-progress-container" hidden><div id="search-progress-bar" class="search-progress-bar" style="width:0%"></div></div>
        </div>
    </div>`;

    $("body").append(widgetHtml);
    makeDraggable("rebang-widget", "rebang-header");
    restoreWidgetPosition();
    bindMiniBarToggle();

    const DEFAULT_CHANNELS = [BingAssistant.WORD_PACK_SHORT, BingAssistant.WORD_PACK_LONG, BingAssistant.WORD_PACK_CUSTOM];
    let channelList = sessionStorage.getItem(channelListKey);
    let listArr = DEFAULT_CHANNELS;
    if (channelList !== null) {
        try {
            const parsed = JSON.parse(channelList);
            if (Array.isArray(parsed) && parsed.some((name) => BingAssistant.LEGACY_CHANNELS.includes(name))) {
                listArr = DEFAULT_CHANNELS;
            } else if (Array.isArray(parsed) && parsed.length) {
                listArr = parsed;
            }
        } catch (error) {
            listArr = DEFAULT_CHANNELS;
        }
    }
    sessionStorage.setItem(channelListKey, JSON.stringify(listArr));
    initChannels(listArr, getCurrentChannel());
    checkAndRandomizeDailyChannel(listArr);
    renderRecentLogs();
  }

  if (getVal(autoSearchLockKey, "off") == "off") {
      setVal(jumpFailCountKey, 0);
      setVal(rewardsFailCountKey, 0);
  }

  let currentSearchCount = Number(getVal(getAutoSearchCountKey(), 0));
  let limitSearchCount = Number(getVal(limitSearchCountKey, BingAssistant.DEFAULT_SEARCH_LIMIT));

  $("#ext-current-count").text(currentSearchCount);
  $("#ext-autosearch-limit").val(limitSearchCount);
  updateMiniBar();

  if (currentSearchCount >= limitSearchCount) { setVal(autoSearchLockKey, "off"); }

  $("#ext-channels").off("change.rebang").on("change.rebang", function () {
      localStorage.setItem(selectedChannelKey, $(this).val());
      localStorage.setItem(currentKeywordIndexKey, 0);
      initKeywords();
  });
  $("#ext-keywords-refresh").off("click.rebang").on("click.rebang", function () {
      setVal(BingAssistant.KEYS.keywordShuffle, Number(getVal(BingAssistant.KEYS.keywordShuffle, 0)) + 1);
      setVal(BingAssistant.KEYS.dailyKeywordPlan, null);
      sessionStorage.removeItem(getCurrentChannelKeywordsCacheKey());
      localStorage.setItem(currentKeywordIndexKey, 0);
      initKeywords();
  });
  $("#ext-block-keyword").off("click.rebang").on("click.rebang", function () {
      const word = (getVal(BingAssistant.KEYS.lastKeyword, "") || $("#ext-current-keyword").text() || "").trim();
      if (!word || word === "-") {
          showUserMessage("还没有当前搜索词");
          return;
      }
      chrome.runtime.sendMessage({ type: "BLOCK_KEYWORD", word }).catch(() => {});
      showUserMessage(`已拉黑「${word}」，今天不再搜`);
  });
  $("#rebang-open-options").off("click.rebang").on("click.rebang", function () {
      chrome.runtime.openOptionsPage();
  });

  $("#ext-autosearch-lock").off("click.rebang").on("click.rebang", function () {
    if (getVal(autoSearchLockKey, "off") == "on") {
      if (isRunPaused()) {
        chrome.runtime.sendMessage({ type: "RESUME_TODAY" }).catch(() => {});
        showUserMessage("继续今天的任务");
        updateMiniBar();
        return;
      }
      stopAutoSearch("已停止", "stopped");
    } else {
        if (TEST_MODE === 1) {
            showUserMessage("测试模式：正在重置今天的状态");
            setVal(getDailyTasksDoneKey(), false);
            setVal(rewardsFailCountKey, 0);
            setVal(getDailyTaskRedirectTimeKey(), 0);
            setVal(jumpFailCountKey, 0);
            setVal(getAutoSearchCountKey(), 0);
        }

        let limit = Number(getVal(limitSearchCountKey, BingAssistant.DEFAULT_SEARCH_LIMIT));
        let current = Number(getVal(getAutoSearchCountKey(), 0));
        let dailyEnabled = dailyTasksWanted();
        let dailyDone = getVal(getDailyTasksDoneKey(), false);

        if (current >= limit && (!dailyEnabled || dailyDone)) {
            showUserMessage("今天的任务已经完成");
            return;
        }
        if (detectLoginState() === "out") {
            stopForLogin(false);
            return;
        }

        setVal(autoSearchLockKey, "on");
        setVal(consecutiveNoGainKey, 0);
        setVal(jumpFailCountKey, 0);
        setVal(jumpLastPointsKey, -1);
        setVal(rewardsFailCountKey, 0);
        setVal(globalMasterTabKey, currentTabId);
        setVal(globalLockKey, Date.now());
        setVal(BingAssistant.KEYS.productState, "running");
        setVal(BingAssistant.KEYS.runStartedAt, Date.now());
        setVal(BingAssistant.KEYS.paused, false);
        setVal(BingAssistant.KEYS.pauseReason, "");
        rememberStartPoints(getBingPoints());
        $(this).text("停止").addClass("stop");
        showUserMessage("正在开始今天的任务", { action: "开始今日任务" });
        setVal(autoSearchLockExpiresKey, 0);
        setVal(lastPointsKey, null);
        updateMiniBar();
        doAutoSearch();
    }
  });
}

// ==========================================
// 主入口
// ==========================================
(function () {
  "use strict";
  var intervalId = null; // 修复：不使用 this.intervalId（严格模式下 this 为 undefined）

  $(document).ready(function () {

    // 定时唤醒由扩展后台闹钟负责，不再让普通 Bing 页面长期持有屏幕唤醒锁。

    // 1. 如果是 Rewards 页面
    if (location.hostname === "rewards.bing.com") {
        if ($("#rebang-widget").length == 0) initRewardsControls();
        setInterval(handleRewardsPage, 3000);
    }
    // 2. 如果是 搜索 页面
    else {
        if (window.top === window.self) {
          intervalId = intervalId || setInterval(function () {
              // 初始化悬浮窗
              if ($("#rebang-widget").length == 0) { initSearchControls(); }

              // --- 周期性同步状态 (要求4) ---
              syncTabStatus();

              // 检查自动启动 (包含跨天检查)
              checkAutoStart();

              // 如果开关开启，执行搜索循环
              publishAssistantState();
              if (getVal(autoSearchLockKey, "off") == "on") {
                 doAutoSearch();
              }
            }, 1000); // 1秒心跳
        }
    }
  });
})();

})();
