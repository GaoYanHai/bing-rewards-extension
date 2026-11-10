import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const profile = await mkdtemp(path.join(tmpdir(), "bing-assistant-smoke-"));
async function waitForStore(worker, predicate, timeout = 40000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const store = await worker.evaluate(() => chrome.storage.local.get(null));
    if (predicate(store)) return store;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.error("Extension state at timeout:", JSON.stringify(await worker.evaluate(() => chrome.storage.local.get(null))));
  console.error("Tabs at timeout:", JSON.stringify(await worker.evaluate(() => chrome.tabs.query({}))));
  throw new Error("Timed out waiting for extension state");
}
const errors = [];
let context;
let searchRequests = 0;
try {
  context = await chromium.launchPersistentContext(profile, {
    ...(process.env.EDGE_EXECUTABLE ? { executablePath: process.env.EDGE_EXECUTABLE } : { channel: "chromium" }),
    headless: true,
    args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`, "--no-first-run"]
  });
  // Only fixture HTML reaches content scripts. No Bing account or live searches are used.
  await context.route(/^https?:\/\//, async route => {
    const url = new URL(route.request().url());
    if (url.hostname.endsWith(".bing.com") && url.pathname === "/search") {
      searchRequests++;
      const points = 100 + (searchRequests - 1) * 3;
      await route.fulfill({ contentType: "text/html", body: `<!doctype html><html><head><title>Search fixture</title></head><body>
        <header id="b_header"><button id="id_a" aria-label="Microsoft account">Test account</button><span id="id_rc">${points}</span></header>
        <form action="/search" method="get"><input id="sb_form_q" name="q"><button id="sb_form_go" type="submit">Search</button></form>
        <div id="b_results">Offline test fixture</div></body></html>` });
    } else {
      await route.abort();
    }
  });
  context.on("page", page => page.on("pageerror", error => errors.push(error.message)));
  const worker = context.serviceWorkers()[0] || await context.waitForEvent("serviceworker", { timeout: 15000 });
  const id = new URL(worker.url()).hostname;
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${id}/popup.html`);
  await popup.locator("#view-risk").waitFor({ state: "visible" });
  await popup.locator("#risk-check").check();
  await popup.locator("#risk-accept").click();
  await popup.locator("#view-main").waitFor({ state: "visible" });

  const options = await context.newPage();
  await options.goto(`chrome-extension://${id}/options.html`);
  await options.locator("#search-limit").fill("1");
  await options.locator("#search-limit").blur();
  await options.locator("#simulate-typing").uncheck();
  await options.locator("#pause-when-busy").uncheck();
  await options.locator("#custom-keywords").fill("weather\nrecipes\nbooks");
  await options.locator("#save-custom").click();
  await waitForStore(worker, s => s.Rebang_LimitSearchCount === 1 && s.Rebang_DailyKeywordPlan?.words?.includes("weather"));
  await options.locator("#block-word").fill("weather");
  await options.locator("#block-word-btn").click();
  await waitForStore(worker, s => s.Rebang_BlockedKeywords?.includes("weather") && !s.Rebang_DailyKeywordPlan?.words?.includes("weather"));
  await options.locator('#blocked-words button[data-word="weather"]').click();
  await waitForStore(worker, s => !s.Rebang_BlockedKeywords?.includes("weather"));
  await worker.evaluate(() => {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const date = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,"0")}-${String(yesterday.getDate()).padStart(2,"0")}`;
    return chrome.storage.local.set({ Rebang_DayRecords: [{date, status: "complete", pointsGained: 6}] });
  });
  await options.locator("#month-chart").waitFor({ state: "visible" });
  await options.locator("#schedule-time").fill("23:59");
  await options.locator("#schedule-time").blur();
  await waitForStore(worker, s => s.Rebang_AutoStartHour === "23");
  await options.locator("#schedule-enabled").uncheck();
  await options.locator("#schedule-enabled").check();
  await waitForStore(worker, s => s.Rebang_AutoStartHour === "23");
  assert.equal(await options.locator("#schedule-time").inputValue(), "23:59");
  await options.locator("#schedule-enabled").uncheck();

  await options.locator("#danger-enabled").click();
  await options.locator("#danger-confirm").waitFor({ state: "visible" });
  assert.equal(await options.locator("#danger-enabled").isChecked(), false);
  await options.locator("#danger-cancel-btn").click();
  const store = await worker.evaluate(() => chrome.storage.local.get(null));
  assert.equal(store.Rebang_DangerEnabled, false);

  await popup.bringToFront();
  await popup.locator("#primary-btn").click();
  await waitForStore(worker, s => s.Rebang_AutoSearchLock === "on");
  await popup.locator("#primary-btn[data-action=pause]").click();
  await waitForStore(worker, s => s.Rebang_Paused === true);
  await popup.locator("#primary-btn[data-action=resume]").click();
  await waitForStore(worker, s => s.Rebang_ProductState === "complete" && s.Rebang_AutoSearchLock === "off");
  const final = await worker.evaluate(() => chrome.storage.local.get(null));
  const countKey = Object.keys(final).find(key => key.startsWith("Rebang_AutoSearchCount_"));
  assert.equal(final[countKey], 1, "first manual run must stop at configured count");
  assert.equal(final.Rebang_ManualContinue, false);
  assert.ok(searchRequests >= 2, "content script must navigate and count the result");
  assert.deepEqual(errors, [], "extension pages should not raise uncaught errors");
  console.log("Browser smoke passed: onboarding, settings, schedule memory, danger confirmation, search navigation, pause/resume and completion.");
} finally {
  await context?.close();
  await rm(profile, { recursive: true, force: true });
}
