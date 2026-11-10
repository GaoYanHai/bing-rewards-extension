import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const code = readFileSync(new URL("../shared.js", import.meta.url), "utf8");
new Function(code)();
const BingAssistant = globalThis.BingAssistant;

describe("unavailable points and stale summaries", () => {
  it("does not turn absent points into a zero balance or a known login", () => {
    for (const value of [null, undefined, "", " ", false, -1]) {
      expect(BingAssistant.readablePoints(value)).toBeNull();
    }
    expect(BingAssistant.readablePoints(0)).toBe(0);
    expect(BingAssistant.readablePoints("123")).toBe(123);
    expect(BingAssistant.hadLoginHistory({ [BingAssistant.KEYS.pointsBalance]: null })).toBe(false);
  });
  it("does not carry yesterday's failure or gained points into today", () => {
    const now = new Date(2026, 10, 10, 12);
    const model = BingAssistant.buildViewModel({
      [BingAssistant.KEYS.riskAccepted]: true,
      [BingAssistant.KEYS.productState]: "failed",
      [BingAssistant.KEYS.lastRunSummary]: { date: "2026-11-09", reason: "failed", pointsGained: 99, durationMs: 5000 },
      [BingAssistant.KEYS.pointsBalance]: 199,
      [BingAssistant.KEYS.runStartPoints]: 100
    }, now);
    expect(model.state).toBe("ready");
    expect(model.summary).toBeNull();
    expect(model.pointsGained).toBeNull();
    expect(model.points).toBe(199);
    expect(model.elapsedMs).toBe(0);
  });
});

describe("parseHourMinute", () => {
  it("parses valid hour/minute", () => {
    const r = BingAssistant.parseHourMinute(21, 30);
    expect(r.enabled).toBe(true);
    expect(r.hour).toBe(21);
    expect(r.minute).toBe(30);
  });

  it("rejects invalid hour/minute", () => {
    expect(BingAssistant.parseHourMinute(25, 0).enabled).toBe(false);
    expect(BingAssistant.parseHourMinute(0, 60).enabled).toBe(false);
    expect(BingAssistant.parseHourMinute(-1, 0).enabled).toBe(false);
    expect(BingAssistant.parseHourMinute(undefined, undefined).enabled).toBe(false);
  });
});

describe("rememberedSchedule", () => {
  const KEYS = BingAssistant.KEYS;

  it("uses the current schedule when enabled", () => {
    const remembered = BingAssistant.rememberedSchedule({
      [KEYS.autoStartHour]: "8",
      [KEYS.autoStartMin]: "5",
      [KEYS.lastAutoStartHour]: "21",
      [KEYS.lastAutoStartMin]: "30"
    });
    expect(remembered.enabled).toBe(true);
    expect(remembered.hour).toBe(8);
    expect(remembered.minute).toBe(5);
  });

  it("keeps the last time after auto-start is turned off", () => {
    const remembered = BingAssistant.rememberedSchedule({
      [KEYS.autoStartHour]: "-1",
      [KEYS.autoStartMin]: "-1",
      [KEYS.lastAutoStartHour]: "8",
      [KEYS.lastAutoStartMin]: "5"
    });
    expect(remembered.enabled).toBe(true);
    expect(remembered.hour).toBe(8);
    expect(remembered.minute).toBe(5);
  });

  it("falls back to the suggested time when nothing was saved", () => {
    const remembered = BingAssistant.rememberedSchedule({});
    expect(remembered.enabled).toBe(false);
    expect(remembered.hour).toBe(BingAssistant.SUGGESTED_HOUR);
    expect(remembered.minute).toBe(BingAssistant.SUGGESTED_MINUTE);
  });
});

describe("nextScheduledTime", () => {
  it("returns today if time is in the future", () => {
    const now = new Date(2026, 0, 15, 10, 0);
    const next = BingAssistant.nextScheduledTime(21, 30, now);
    expect(next.getDate()).toBe(15);
    expect(next.getHours()).toBe(21);
  });

  it("returns tomorrow if time is in the past", () => {
    const now = new Date(2026, 0, 15, 22, 0);
    const next = BingAssistant.nextScheduledTime(21, 30, now);
    expect(next.getDate()).toBe(16);
  });
});

describe("normalizeRepeatRule", () => {
  it("returns valid rules unchanged", () => {
    expect(BingAssistant.normalizeRepeatRule("daily")).toBe("daily");
    expect(BingAssistant.normalizeRepeatRule("weekdays")).toBe("weekdays");
    expect(BingAssistant.normalizeRepeatRule("weekends")).toBe("weekends");
  });

  it("defaults invalid rules to daily", () => {
    expect(BingAssistant.normalizeRepeatRule("invalid")).toBe("daily");
    expect(BingAssistant.normalizeRepeatRule(undefined)).toBe("daily");
  });
});

describe("formatClock", () => {
  it("pads single digits", () => {
    expect(BingAssistant.formatClock(9, 5)).toBe("09:05");
    expect(BingAssistant.formatClock(21, 30)).toBe("21:30");
  });
});


describe("whatsNewCopy", () => {
  it("returns a non-empty points list", () => {
    const copy = BingAssistant.whatsNewCopy();
    expect(Array.isArray(copy.points)).toBe(true);
    expect(copy.points.length).toBeGreaterThan(0);
    copy.points.forEach((item) => expect(typeof item).toBe("string"));
  });
});

describe("buildViewModel complete state", () => {
  const now = new Date(2026, 8, 14, 12, 0);
  const today = BingAssistant.localDateString(now);
  const yesterday = BingAssistant.localDateString(BingAssistant.shiftLocalDate(now, -1));

  function baseStore(extra = {}) {
    return {
      [BingAssistant.KEYS.riskAccepted]: true,
      [BingAssistant.KEYS.loginState]: "in",
      [BingAssistant.KEYS.autoSearchLock]: "off",
      [BingAssistant.KEYS.limitSearchCount]: 30,
      ...extra
    };
  }

  it("keeps popup complete after a page-started run writes today's summary", () => {
    const model = BingAssistant.buildViewModel(baseStore({
      [BingAssistant.KEYS.productState]: "running",
      [BingAssistant.dailyCountKey(now)]: 30,
      [BingAssistant.KEYS.lastRunSummary]: {
        reason: "complete",
        date: today,
        at: now.getTime(),
        count: 30,
        limit: 30
      },
      [BingAssistant.KEYS.dayRecords]: [{ date: today, status: "complete", count: 30, limit: 30 }]
    }), now);
    expect(model.state).toBe("complete");
  });

  it("does not reuse yesterday's complete productState", () => {
    const model = BingAssistant.buildViewModel(baseStore({
      [BingAssistant.KEYS.productState]: "complete",
      [BingAssistant.KEYS.lastRunSummary]: {
        reason: "complete",
        date: yesterday,
        at: BingAssistant.shiftLocalDate(now, -1).getTime(),
        count: 30,
        limit: 30
      }
    }), now);
    expect(model.state).toBe("ready");
  });

  it("treats count at limit as complete when daily tasks are off", () => {
    const model = BingAssistant.buildViewModel(baseStore({
      [BingAssistant.KEYS.productState]: "ready",
      [BingAssistant.dailyCountKey(now)]: 30
    }), now);
    expect(model.state).toBe("complete");
  });

  it("treats filled no-gain count as complete", () => {
    const filled = BingAssistant.fillSearchCountWhenQuotaFull(8, 30);
    const model = BingAssistant.buildViewModel(baseStore({
      [BingAssistant.KEYS.productState]: "complete",
      [BingAssistant.dailyCountKey(now)]: filled,
      [BingAssistant.KEYS.lastRunSummary]: {
        reason: "complete",
        date: today,
        at: now.getTime(),
        count: filled,
        limit: 30
      },
      [BingAssistant.KEYS.dayRecords]: [{ date: today, status: "complete", count: filled, limit: 30 }]
    }), now);
    expect(filled).toBe(30);
    expect(model.state).toBe("complete");
  });
});

describe("no-gain search full", () => {
  it("detects consecutive no-gain as quota full", () => {
    expect(BingAssistant.isNoGainQuotaFull(9, 10)).toBe(false);
    expect(BingAssistant.isNoGainQuotaFull(10, 10)).toBe(true);
    expect(BingAssistant.isNoGainQuotaFull(0, 10)).toBe(false);
  });

  it("fills remaining search count when quota is already full", () => {
    expect(BingAssistant.fillSearchCountWhenQuotaFull(0, 30)).toBe(30);
    expect(BingAssistant.fillSearchCountWhenQuotaFull(8, 30)).toBe(30);
    expect(BingAssistant.fillSearchCountWhenQuotaFull(30, 30)).toBe(30);
  });

  it("explains no-gain as a local stop decision, not confirmed quota", () => {
    const copy = BingAssistant.searchFullCopy("pc", { limit: 10 });
    expect(copy.short).toBe("电脑搜索连续未加分");
    expect(copy.message).toContain("连续 10 次搜索没有加分");
    expect(copy.message).toContain("以 Rewards 页面为准");
    expect(copy.message).not.toContain("已停止");
  });
});

describe("buildWeekCells", () => {
  it("marks today complete when today's record is complete", () => {
    const now = new Date(2026, 8, 14, 12, 0);
    const today = BingAssistant.localDateString(now);
    const cells = BingAssistant.buildWeekCells({
      [BingAssistant.KEYS.dayRecords]: [{ date: today, status: "complete", count: 30, limit: 30 }]
    }, now);
    const cell = cells.find((item) => item.date === today);
    expect(cell.status).toContain("complete");
    expect(cell.title).toContain("已完成");
  });
});


describe("isRewardsPage", () => {
  it("treats rewards host and bing.com/rewards as rewards pages", () => {
    expect(BingAssistant.isRewardsPage({ hostname: "rewards.bing.com", pathname: "/" })).toBe(true);
    expect(BingAssistant.isRewardsPage({ hostname: "www.bing.com", pathname: "/rewards" })).toBe(true);
    expect(BingAssistant.isRewardsPage({ hostname: "www.bing.com", pathname: "/rewards/dashboard" })).toBe(true);
    expect(BingAssistant.isRewardsPage({ hostname: "www.bing.com", pathname: "/search" })).toBe(false);
  });
});

describe("parseQuotaCards", () => {
  it("parses a compact mobile search fraction", () => {
    const parsed = BingAssistant.parseQuotaCards("Mobile search 12/60");
    expect(parsed.mobile).toEqual({ current: 4, total: 20, remaining: 16 });
  });

  it("parses Chinese mobile search labels", () => {
    const parsed = BingAssistant.parseQuotaCards("移动搜索 30/60");
    expect(parsed.mobile).toEqual({ current: 10, total: 20, remaining: 10 });
  });

  it("combines adjacent PC search numbers", () => {
    const parsed = BingAssistant.parseQuotaCards(["PC search", "90", "90"]);
    expect(parsed.pc).toEqual({ current: 30, total: 30, remaining: 0 });
  });

  it("reads PC and mobile from one breakdown blob", () => {
    const parsed = BingAssistant.parseQuotaCards("PC search 90/90\nMobile search 12/60");
    expect(parsed.pc.remaining).toBe(0);
    expect(parsed.mobile.remaining).toBe(16);
  });
});

describe("effectiveMobileLimit", () => {
  it("uses the danger-setting count, not page remaining", () => {
    const now = new Date(2026, 8, 14, 12, 0);
    const store = {
      [BingAssistant.KEYS.mobileSearchLimit]: 8,
      [BingAssistant.KEYS.quotaSnapshot]: {
        date: BingAssistant.localDateString(now),
        seen: true,
        mobile: { remaining: 16 }
      }
    };
    expect(BingAssistant.effectiveMobileLimit(store, now)).toBe(8);
  });
});

describe("formatMobileHint", () => {
  it("stays empty when mobile search is off", () => {
    const now = new Date(2026, 8, 14, 12, 0);
    expect(BingAssistant.formatMobileHint({}, now)).toBe("");
  });

  it("uses the danger-setting count when mobile search will run", () => {
    const now = new Date(2026, 8, 14, 12, 0);
    const store = {
      [BingAssistant.KEYS.dangerEnabled]: true,
      [BingAssistant.KEYS.mobileSearchEnabled]: true,
      [BingAssistant.KEYS.mobileSearchLimit]: 8
    };
    expect(BingAssistant.formatMobileHint(store, now)).toBe("还将用手机样式再搜 8 次");
  });
});

describe("formatCompleteQuotaHint", () => {
  it("does not mention Edge remaining or page mobile remaining", () => {
    const now = new Date(2026, 8, 14, 12, 0);
    const hint = BingAssistant.formatCompleteQuotaHint({
      pc: { remaining: 0 },
      mobile: { remaining: 16 },
      edge: { remaining: 5 },
      daily: { remaining: 2 }
    }, {}, now);
    expect(hint).toBe("每日活动还剩 2 张");
  });
});

describe("mergeQuotaSnapshot", () => {
  it("marks the dashboard as seen even when mobile is missing", () => {
    const now = new Date(2026, 8, 14, 12, 0);
    const merged = BingAssistant.mergeQuotaSnapshot(null, { pc: { remaining: 3 } }, now);
    expect(merged.seen).toBe(true);
    expect(merged.pc.remaining).toBe(3);
    expect(merged.mobile).toBe(null);
  });
});


describe("isQuizOrVotePage", () => {
  it("does not treat the dashboard as a quiz just because a daily-set quiz card exists", () => {
    const root = {
      querySelector(selector) {
        return String(selector).includes("quiz") ? { id: "daily-quiz-card" } : null;
      }
    };
    expect(BingAssistant.isQuizOrVotePage({
      hostname: "rewards.bing.com",
      pathname: "/",
      search: "",
      href: "https://rewards.bing.com/"
    }, root)).toBe(false);
  });
});

describe("isRewardsVisitUrl", () => {
  it("recognizes bing and microsoft rewards URLs", () => {
    expect(BingAssistant.isRewardsVisitUrl("https://rewards.bing.com/")).toBe(true);
    expect(BingAssistant.isRewardsVisitUrl("https://www.bing.com/rewards")).toBe(true);
    expect(BingAssistant.isRewardsVisitUrl("https://account.microsoft.com/rewards")).toBe(true);
    expect(BingAssistant.isRewardsVisitUrl("https://www.bing.com/search?q=weather")).toBe(false);
  });
});


describe("parseRewardsDashboardData", () => {
  it("reads the new pointsCounters payload", () => {
    const parsed = BingAssistant.parseRewardsDashboardData({
      pointsCounters: {
        pc: { progress: 90, max: 90, originalMax: 90 },
        mobile: { progress: 12, max: 60, originalMax: 60 },
        dailyOffer: 10,
        totalPoints: 40
      }
    });
    expect(parsed.pc).toEqual({ current: 30, total: 30, remaining: 0 });
    expect(parsed.mobile).toEqual({ current: 4, total: 20, remaining: 16 });
    expect(parsed.mobileUnavailable).toBe(false);
  });

  it("marks mobile unavailable when the account has no mobile counter", () => {
    const parsed = BingAssistant.parseRewardsDashboardData({
      pointsCounters: {
        pc: { progress: 90, max: 90 },
        mobile: null,
        totalPoints: 30
      }
    });
    expect(parsed.pc.remaining).toBe(0);
    expect(parsed.mobile).toBe(null);
    expect(parsed.mobileUnavailable).toBe(true);
  });

  it("still reads classic userStatus counters", () => {
    const parsed = BingAssistant.parseRewardsDashboardData({
      userStatus: {
        counters: {
          pcSearch: [{ pointProgress: 90, pointProgressMax: 90 }],
          mobileSearch: [{ pointProgress: 12, pointProgressMax: 60 }]
        }
      }
    });
    expect(parsed.pc.remaining).toBe(0);
    expect(parsed.mobile.remaining).toBe(16);
  });
});


describe("parseRewardsDashboardData activities", () => {
  it("reads activities array from the points panel", () => {
    const parsed = BingAssistant.parseRewardsDashboardData({
      activities: [
        { activity: "必应搜索", points: 90, maxPoints: 90 },
        { activity: "移动搜索", points: 12, maxPoints: 60 }
      ]
    });
    expect(parsed.pc.remaining).toBe(0);
    expect(parsed.mobile.remaining).toBe(16);
  });
});


describe("parseRewardsDashboardData earn cards", () => {
  it("reads earn page progressCurrent cards", () => {
    const parsed = BingAssistant.parseRewardsDashboardData({
      items: [
        { title: "电脑搜索", progressCurrent: 90, progressMax: 90, points: 5 },
        { title: "移动搜索", progressCurrent: 12, progressMax: 60, points: 5 }
      ]
    });
    expect(parsed.pc.remaining).toBe(0);
    expect(parsed.mobile.remaining).toBe(16);
  });

  it("reads grouped quest activities", () => {
    const parsed = BingAssistant.parseRewardsDashboardData({
      quest: {
        title: "搜索",
        activities: [
          { title: "电脑搜索", progressCurrent: 30, progressMax: 90 },
          { title: "移动搜索", progressCurrent: 0, progressMax: 60 }
        ]
      }
    });
    expect(parsed.pc.remaining).toBe(20);
    expect(parsed.mobile.remaining).toBe(20);
  });
});


describe("version", () => {
  it("matches manifest and package.json", () => {
    const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    expect(BingAssistant.PRODUCT_VERSION).toBe(manifest.version);
    expect(pkg.version).toBe(manifest.version);
  });
});

describe("clampInt and search limits", () => {
  const weekday = new Date(2026, 8, 14, 12, 0);

  it("caps weekday and weekend search limits", () => {
    expect(BingAssistant.effectiveSearchLimit({
      [BingAssistant.KEYS.limitSearchCount]: 9999
    }, weekday)).toBe(BingAssistant.SEARCH_LIMIT_MAX);
    expect(BingAssistant.effectiveSearchLimit({
      [BingAssistant.KEYS.limitSearchCount]: 30,
      [BingAssistant.KEYS.weekendSearchLimit]: 400
    }, new Date(2026, 8, 12, 12, 0))).toBe(BingAssistant.SEARCH_LIMIT_MAX);
  });

  it("caps mobile search limit", () => {
    expect(BingAssistant.effectiveMobileLimit({
      [BingAssistant.KEYS.mobileSearchLimit]: 500
    })).toBe(BingAssistant.MOBILE_LIMIT_MAX);
  });
});

describe("importSettings", () => {
  const KEYS = BingAssistant.KEYS;

  it("clamps imported numeric limits to the options-page range", () => {
    const parsed = BingAssistant.importSettings({
      settings: {
        [KEYS.limitSearchCount]: 9999,
        [KEYS.weekendSearchLimit]: 800,
        [KEYS.mobileSearchLimit]: 500,
        [KEYS.maxNoGainLimit]: 1,
        [KEYS.dailyTaskMaxRetries]: 99
      }
    });
    expect(parsed.ok).toBe(true);
    expect(parsed.patch[KEYS.limitSearchCount]).toBe(BingAssistant.SEARCH_LIMIT_MAX);
    expect(parsed.patch[KEYS.weekendSearchLimit]).toBe(BingAssistant.SEARCH_LIMIT_MAX);
    expect(parsed.patch[KEYS.mobileSearchLimit]).toBe(BingAssistant.MOBILE_LIMIT_MAX);
    expect(parsed.patch[KEYS.maxNoGainLimit]).toBe(BingAssistant.NO_GAIN_LIMIT_MIN);
    expect(parsed.patch[KEYS.dailyTaskMaxRetries]).toBe(BingAssistant.DAILY_RETRIES_MAX);
  });

  it("drops invalid schedule times without touching other settings", () => {
    const parsed = BingAssistant.importSettings({
      settings: {
        [KEYS.autoStartHour]: 25,
        [KEYS.autoStartMin]: 0,
        [KEYS.notifyEnabled]: true
      }
    });
    expect(parsed.ok).toBe(true);
    expect(parsed.patch[KEYS.autoStartHour]).toBeUndefined();
    expect(parsed.patch[KEYS.autoStartMin]).toBeUndefined();
    expect(parsed.patch[KEYS.notifyEnabled]).toBe(true);
  });

  it("keeps a valid schedule", () => {
    const parsed = BingAssistant.importSettings({
      settings: {
        [KEYS.autoStartHour]: "21",
        [KEYS.autoStartMin]: "30"
      }
    });
    expect(parsed.ok).toBe(true);
    expect(parsed.patch[KEYS.autoStartHour]).toBe("21");
    expect(parsed.patch[KEYS.autoStartMin]).toBe("30");
    expect(parsed.patch[KEYS.lastAutoStartHour]).toBe("21");
    expect(parsed.patch[KEYS.lastAutoStartMin]).toBe("30");
  });
});


describe("shouldShowWhatsNew", () => {
  it("hides after the current version is marked seen", () => {
    expect(BingAssistant.shouldShowWhatsNew({})).toBe(true);
    expect(BingAssistant.shouldShowWhatsNew({
      [BingAssistant.KEYS.whatsNewSeen]: BingAssistant.PRODUCT_VERSION
    })).toBe(false);
  });
});


describe("loginLooksLost", () => {
  it("does not treat a missing login reading as a hard logout", () => {
    expect(BingAssistant.loginLooksLost("out")).toBe(false);
    expect(BingAssistant.loginLooksLost("out", { wasLoggedIn: true })).toBe(false);
    expect(BingAssistant.loginLooksLost("out", { giveUp: true })).toBe(false);
    expect(BingAssistant.loginLooksLost("unknown", {
      giveUp: true,
      wasLoggedIn: true,
      points: null
    })).toBe(false);
  });
});

describe("isUncertainLoginRead", () => {
  it("treats missing points or login as an empty spin", () => {
    expect(BingAssistant.isUncertainLoginRead("in", 1200)).toBe(false);
    expect(BingAssistant.isUncertainLoginRead("in", null)).toBe(true);
    expect(BingAssistant.isUncertainLoginRead("out", null)).toBe(true);
    expect(BingAssistant.isUncertainLoginRead("unknown", 1200)).toBe(true);
  });
});

describe("identityLoginState", () => {
  it("treats a header avatar as logged in even without points", () => {
    expect(BingAssistant.identityLoginState({ hasAvatar: true, points: null })).toBe("in");
  });

  it("treats account manager label as logged in", () => {
    expect(BingAssistant.identityLoginState({ accountLabel: "Account manager for Amy" })).toBe("in");
  });

  it("does not let leftover sign-in controls override an avatar", () => {
    expect(BingAssistant.identityLoginState({
      hasAvatar: true,
      headerSignInVisible: true
    })).toBe("in");
  });

  it("returns out only when the header sign-in is actually visible", () => {
    expect(BingAssistant.identityLoginState({ headerSignInVisible: true })).toBe("out");
    expect(BingAssistant.identityLoginState({})).toBe("unknown");
  });

  it("ignores placeholder usernames and keeps real names", () => {
    expect(BingAssistant.identityLoginState({ name: "..." })).toBe("unknown");
    expect(BingAssistant.identityLoginState({ name: "小明" })).toBe("in");
  });

  it("treats the header account button as logged in", () => {
    expect(BingAssistant.identityLoginState({ hasAccountButton: true, points: null })).toBe("in");
  });

  it("keeps a previously confirmed login when the header has no sign-in button", () => {
    expect(BingAssistant.identityLoginState({ knownSignedIn: true, points: null })).toBe("in");
    expect(BingAssistant.identityLoginState({
      knownSignedIn: true,
      headerSignInVisible: true
    })).toBe("out");
  });
});

describe("hadLoginHistory", () => {
  it("remembers a previous in-state so auto-start can continue", () => {
    expect(BingAssistant.hadLoginHistory({
      [BingAssistant.KEYS.loginState]: "out",
      [BingAssistant.KEYS.pointsBalance]: 1200
    })).toBe(true);
    expect(BingAssistant.hadLoginHistory({
      [BingAssistant.KEYS.loginState]: "out"
    })).toBe(false);
  });
});

describe("shouldConfirmTransientFail", () => {
  it("waits for the default number of misses", () => {
    expect(BingAssistant.shouldConfirmTransientFail(1)).toBe(false);
    expect(BingAssistant.shouldConfirmTransientFail(BingAssistant.TRANSIENT_FAIL_CONFIRM_MISSES)).toBe(true);
    expect(BingAssistant.shouldConfirmTransientFail(3, BingAssistant.ACCOUNT_CHANGE_CONFIRM_MISSES)).toBe(true);
  });
});

describe("continueHint", () => {
  it("keeps search and points progress after a login fail", () => {
    const hint = BingAssistant.continueHint({
      count: 12,
      limit: 30,
      pointsGained: 36,
      failReasonCode: BingAssistant.FAIL_CODES.LOGIN,
      failShort: "登录状态变了",
      failMessage: "登录状态看起来变了，已停止。"
    });
    expect(hint).toContain("12/30");
    expect(hint).toContain("+36");
  });
});

describe("logsForDate and clampLogDate", () => {
  const now = new Date(2026, 8, 16, 12, 0);
  const today = BingAssistant.localDateString(now);
  const yesterday = BingAssistant.localDateString(BingAssistant.shiftLocalDate(now, -1));

  it("filters logs by local date", () => {
    const logs = [
      { date: today, action: "today" },
      { date: yesterday, action: "yesterday" }
    ];
    expect(BingAssistant.logsForDate(logs, yesterday).map((item) => item.action)).toEqual(["yesterday"]);
    expect(BingAssistant.todayLogs(logs, now)).toHaveLength(1);
  });

  it("clamps log dates to the recent week", () => {
    expect(BingAssistant.clampLogDate("1999-01-01", now)).toBe(BingAssistant.localDateString(BingAssistant.shiftLocalDate(now, -6)));
    expect(BingAssistant.clampLogDate("2099-01-01", now)).toBe(today);
    expect(BingAssistant.formatLogDateLabel(today, now)).toContain("9月16日");
  });

  it("lists recent dates for the log selector", () => {
    const choices = BingAssistant.logDateChoices(now);
    expect(choices).toHaveLength(7);
    expect(choices[0].value).toBe(today);
    expect(choices[0].label).toContain("9月16日");
    expect(choices[1].label).toContain("9月15日");
  });
});

describe("auto-start login false stop replay", () => {
  it("keeps searching after auto-start if login cannot be read", () => {
    expect(BingAssistant.loginLooksLost("out", {
      giveUp: true,
      wasLoggedIn: true,
      points: null
    })).toBe(false);
    expect(BingAssistant.isUncertainLoginRead("out", null)).toBe(true);
    expect(BingAssistant.hadLoginHistory({
      [BingAssistant.KEYS.loginState]: "out",
      [BingAssistant.KEYS.pointsBalance]: 800
    })).toBe(true);
  });
});

describe("buildDayDetail", () => {
  const now = new Date(2026, 8, 16, 12, 0);
  const today = BingAssistant.localDateString(now);

  it("shows search count and points after a failed run", () => {
    const detail = BingAssistant.buildDayDetail({
      [BingAssistant.KEYS.dayRecords]: [{
        date: today,
        status: "failed",
        count: 12,
        limit: 30,
        pointsGained: 36,
        points: 1234,
        reasonCode: BingAssistant.FAIL_CODES.LOGIN
      }],
      [BingAssistant.dailyCountKey(now)]: 12,
      [BingAssistant.KEYS.limitSearchCount]: 30,
      [BingAssistant.KEYS.runStartPoints]: 1198,
      [BingAssistant.KEYS.pointsBalance]: 1234,
      [BingAssistant.KEYS.failReasonCode]: BingAssistant.FAIL_CODES.LOGIN,
      [BingAssistant.KEYS.runLogs]: [{ date: today, time: "21:30", action: "已停止", result: "登录状态变了" }]
    }, today, now);
    expect(detail.status).toBe("failed");
    expect(detail.body).toContain("12/30");
    expect(detail.body).toContain("+36");
    expect(detail.logs).toHaveLength(1);
  });
});

describe("isScheduledDay", () => {
  it("skips weekdays when only Saturday and Sunday should start", () => {
    expect(BingAssistant.isScheduledDay(new Date(2026, 8, 16, 12, 0), "weekends")).toBe(false);
    expect(BingAssistant.isScheduledDay(new Date(2026, 8, 19, 12, 0), "weekends")).toBe(true);
    expect(BingAssistant.isScheduledDay(new Date(2026, 8, 16, 12, 0), "daily")).toBe(true);
  });
});

describe("buildWeekCells detail", () => {
  it("puts search progress into the hover title", () => {
    const now = new Date(2026, 8, 16, 12, 0);
    const today = BingAssistant.localDateString(now);
    const cells = BingAssistant.buildWeekCells({
      [BingAssistant.KEYS.dayRecords]: [{
        date: today,
        status: "failed",
        count: 8,
        limit: 30,
        pointsGained: 24
      }],
      [BingAssistant.dailyCountKey(now)]: 8,
      [BingAssistant.KEYS.limitSearchCount]: 30
    }, now);
    const cell = cells.find((item) => item.date === today);
    expect(cell.title).toContain("8/30");
    expect(cell.summary).toContain("+24");
  });
});


describe("queryLooksLikeUserSearch", () => {
  it("treats a different Bing query as the user owning the page", () => {
    expect(BingAssistant.queryLooksLikeUserSearch("hello", "world")).toBe(true);
    expect(BingAssistant.queryLooksLikeUserSearch("world", "world")).toBe(false);
    expect(BingAssistant.queryLooksLikeUserSearch("", "world")).toBe(false);
    expect(BingAssistant.queryLooksLikeUserSearch("世界杯预选赛程", "世界杯预选")).toBe(false);
  });
});

describe("shouldIgnoreActivityEvent", () => {
  it("ignores focus, wheel, and our search box typing", () => {
    expect(BingAssistant.shouldIgnoreActivityEvent("focusin", false)).toBe(true);
    expect(BingAssistant.shouldIgnoreActivityEvent("wheel", false)).toBe(true);
    expect(BingAssistant.shouldIgnoreActivityEvent("keydown", true)).toBe(true);
    expect(BingAssistant.shouldIgnoreActivityEvent("input", true)).toBe(true);
    expect(BingAssistant.shouldIgnoreActivityEvent("keydown", false)).toBe(false);
    expect(BingAssistant.shouldIgnoreActivityEvent("pointerdown", false)).toBe(false);
  });
});

describe("catchUpNoteAction", () => {
  it("starts when the user clicks the catch-up notice", () => {
    expect(BingAssistant.catchUpNoteAction("click", false)).toBe("start");
    expect(BingAssistant.catchUpNoteAction("button0", false)).toBe("start");
    expect(BingAssistant.catchUpNoteAction("close", false)).toBe("start");
  });

  it("dismisses only the explicit no button", () => {
    expect(BingAssistant.catchUpNoteAction("button1", false)).toBe("dismiss");
  });

  it("ignores a second event after the notice was handled", () => {
    expect(BingAssistant.catchUpNoteAction("close", true)).toBe("ignore");
    expect(BingAssistant.catchUpNoteAction("click", true)).toBe("ignore");
  });
});

describe("shouldSkipAutoStart", () => {
  const now = new Date(2026, 8, 16, 15, 0);
  const today = BingAssistant.localDateString(now);

  it("skips after today already failed or stopped", () => {
    expect(BingAssistant.shouldSkipAutoStart({
      [BingAssistant.KEYS.lastRunSummary]: { date: today, reason: "failed" }
    }, now)).toBe(true);
    expect(BingAssistant.shouldSkipAutoStart({
      [BingAssistant.KEYS.lastRunSummary]: { date: today, reason: "stopped" }
    }, now)).toBe(true);
  });

  it("does not skip a fresh day after yesterday failed", () => {
    expect(BingAssistant.shouldSkipAutoStart({
      [BingAssistant.KEYS.lastRunSummary]: { date: "2026-09-15", reason: "failed" }
    }, now)).toBe(false);
  });

  it("skips when today's scheduled start already triggered", () => {
    expect(BingAssistant.shouldSkipAutoStart({
      [BingAssistant.triggeredKey(now)]: "true"
    }, now)).toBe(true);
  });

  it("skips auto-start after today completed, without blocking a later manual start", () => {
    expect(BingAssistant.shouldSkipAutoStart({
      [BingAssistant.KEYS.lastRunSummary]: { date: today, reason: "complete" }
    }, now)).toBe(true);
    expect(BingAssistant.isAutoStartReason("alarm")).toBe(true);
    expect(BingAssistant.isAutoStartReason("manual")).toBe(false);
  });
});

describe("crash page helpers", () => {
  it("recognizes Edge crash titles and error URLs", () => {
    expect(BingAssistant.isCrashPageTitle("此网页出现问题")).toBe(true);
    expect(BingAssistant.isCrashPageTitle("This page is having a problem")).toBe(true);
    expect(BingAssistant.isCrashPageTitle("天气 - 搜索")).toBe(false);
    expect(BingAssistant.isUnusableTabUrl("chrome-error://chromewebdata/")).toBe(true);
    expect(BingAssistant.isUnusableTabUrl("https://www.bing.com/search?q=weather")).toBe(false);
  });
});

describe("failCopy page_unresponsive", () => {
  it("tells the user the search page crashed", () => {
    const copy = BingAssistant.failCopy(BingAssistant.FAIL_CODES.PAGE_UNRESPONSIVE);
    expect(copy.short).toBe("搜索页没有反应");
    expect(copy.message).toContain("崩溃");
  });
});

describe("planSearchTabWake", () => {
  const liveTab = { id: 7, url: "https://cn.bing.com/search?q=hello", title: "hello", discarded: false, status: "complete" };

  it("reuses a live tab when starting in the foreground", () => {
    expect(BingAssistant.planSearchTabWake(liveTab, { foreground: true, active: true })).toEqual({
      action: "reuse",
      replaceUrl: false
    });
  });

  it("reloads a sleeping tab instead of navigating it", () => {
    const sleeping = { ...liveTab, discarded: true, status: "unloaded" };
    expect(BingAssistant.planSearchTabWake(sleeping, { foreground: false, active: false })).toEqual({
      action: "reload",
      replaceUrl: false
    });
  });

  it("reloads a background tab on quiet auto-start so a frozen renderer is not navigated", () => {
    expect(BingAssistant.planSearchTabWake(liveTab, { foreground: false, active: false })).toEqual({
      action: "reload",
      replaceUrl: false
    });
  });

  it("opens a new tab if the existing one is an Edge crash page", () => {
    const crashed = { ...liveTab, title: "此网页出现问题" };
    expect(BingAssistant.planSearchTabWake(crashed, { foreground: false, active: false }).action).toBe("create");
  });
});

describe("quietWatchdogPlan", () => {
  const KEYS = BingAssistant.KEYS;
  const now = 1_000_000;
  function runningStore(extra = {}) {
    return {
      [KEYS.autoSearchLock]: "on",
      [KEYS.paused]: false,
      [KEYS.productState]: "running",
      [KEYS.waitingUserTask]: null,
      [KEYS.autoSearchLockExpires]: 0,
      [KEYS.globalLastRunTime]: 0,
      [KEYS.runStartedAt]: now - 60_000,
      ...extra
    };
  }

  it("idles when the run is not active", () => {
    expect(BingAssistant.quietWatchdogPlan({ [KEYS.autoSearchLock]: "off" }, now).action).toBe("idle");
    expect(BingAssistant.quietWatchdogPlan(runningStore({ [KEYS.paused]: true }), now).action).toBe("idle");
  });

  it("waits through the search interval instead of treating it as stuck", () => {
    const plan = BingAssistant.quietWatchdogPlan(runningStore({
      [KEYS.autoSearchLockExpires]: now + 12_000,
      [KEYS.globalLastRunTime]: now - 30_000
    }), now);
    expect(plan.action).toBe("wait");
    expect(plan.reason).toBe("cooldown");
  });

  it("waits while the content script heartbeat is fresh", () => {
    const plan = BingAssistant.quietWatchdogPlan(runningStore({
      [KEYS.globalLastRunTime]: now - 5_000
    }), now);
    expect(plan.action).toBe("wait");
    expect(plan.reason).toBe("heartbeat");
  });

  it("nudges after the interval has expired and the heartbeat is stale", () => {
    const plan = BingAssistant.quietWatchdogPlan(runningStore({
      [KEYS.autoSearchLockExpires]: now - 25_000,
      [KEYS.globalLastRunTime]: now - 40_000
    }), now);
    expect(plan.action).toBe("nudge");
  });

  it("reloads only after the search is overdue long enough", () => {
    const plan = BingAssistant.quietWatchdogPlan(runningStore({
      [KEYS.autoSearchLockExpires]: now - 70_000,
      [KEYS.globalLastRunTime]: now - 80_000
    }), now);
    expect(plan.action).toBe("reload");
  });

  it("fails if the page stays unresponsive", () => {
    const plan = BingAssistant.quietWatchdogPlan(runningStore({
      [KEYS.runStartedAt]: now - 250_000,
      [KEYS.autoSearchLockExpires]: now - 200_000,
      [KEYS.globalLastRunTime]: now - 210_000
    }), now);
    expect(plan.action).toBe("fail");
  });
});

describe("shouldCountSearchResult", () => {
  it("ignores retries that never landed on the submitted query", () => {
    expect(BingAssistant.shouldCountSearchResult("足球比分", "天气预报", "")).toBe(false);
    expect(BingAssistant.shouldCountSearchResult("足球比分", "", "")).toBe(false);
    expect(BingAssistant.shouldCountSearchResult("", "足球比分", "")).toBe(false);
  });

  it("counts a landed search once, not the same query again", () => {
    expect(BingAssistant.shouldCountSearchResult("足球比分", "足球比分", "")).toBe(true);
    expect(BingAssistant.shouldCountSearchResult("足球比分", "足球比分", "足球比分")).toBe(false);
  });
});
