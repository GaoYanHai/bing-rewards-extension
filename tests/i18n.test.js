import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const code = readFileSync(new URL("../i18n.js", import.meta.url), "utf8");
async function load(browser = "en-US", saved = "auto") {
  let changed;
  const sandbox = vm.createContext({
    chrome: {
      i18n: { getUILanguage: () => browser },
      storage: { local: { get: async () => ({ Rebang_UiLanguage: saved }) }, onChanged: { addListener: fn => { changed = fn; } } }
    }
  });
  vm.runInContext(code, sandbox);
  const api = sandbox.BingI18n;
  await api.ready;
  return { api, change: value => changed({ Rebang_UiLanguage: { newValue: value } }, "local") };
}

describe("bilingual interface", () => {
  it("follows browser language and persists an explicit override through storage events", async () => {
    const { api, change } = await load("en-US");
    expect(api.language()).toBe("en");
    expect(api.t("基础设置")).toBe("Basic settings");
    change("zh_CN");
    expect(api.t("基础设置")).toBe("基础设置");
    change("en");
    expect(api.t("基础设置")).toBe("Basic settings");
    expect((await load("zh-TW")).api.language()).toBe("zh_CN");
    expect((await load("zh-CN", "en")).api.language()).toBe("en");
    expect((await load("de-DE")).api.language()).toBe("en");
  });
  it("translates every source message and preserves substituted values", async () => {
    const { api } = await load();
    for (const [source, target] of Object.entries(api.messages)) {
      if (source.startsWith("input[")) continue; // Bing DOM selector, never UI text.
      expect(target, source).not.toMatch(/[\u3400-\u9fff]/);
      const filled = source.replace(/\{(\d+)\}/g, (_, index) => `VALUE${index}`);
      expect(api.t(filled), source).not.toMatch(/[\u3400-\u9fff]/);
      for (const match of source.matchAll(/\{(\d+)\}/g)) expect(api.t(filled), source).toContain(`VALUE${match[1]}`);
    }
  });
  it("keeps user keywords and English text intact, translates nested statuses", async () => {
    const { api } = await load();
    expect(api.t("电脑搜索 2/10")).toBe("PC searches 2/10");
    expect(api.t("任意自定义搜索词")).toBe("任意自定义搜索词");
    expect(api.t("custom search query")).toBe("custom search query");
    expect(api.t("12:30  已完成")).toBe("12:30  Completed");
    expect(api.t("大约 +3。安全模式已开，未处理每日活动。已连续完成 2 天。自动开始不会再跑。想继续搜，点再开始。")).not.toMatch(/[\u3400-\u9fff]/);
  });
});
