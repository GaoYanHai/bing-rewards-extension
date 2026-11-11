# Bing Rewards Assistant

[简体中文](README.md) · [Install from Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/bblfidpemgicndppkjeihkldadnllgjj) · [Releases](https://github.com/GaoYanHai/bing-rewards-extension/releases)

A Manifest V3 extension for Edge and Chrome, with Bing PC search assistance, optional daily activities, schedules and local progress records. Source version: **3.4.4**. The store version depends on certification.

## Get started

Install from the Edge store, or clone this repository and load its root directory as an unpacked extension from `edge://extensions/` or `chrome://extensions/`. Reload the extension and existing Bing pages after replacing source files.

Open the toolbar popup and acknowledge the usage notice. Sign in to Bing with your Microsoft account, then choose **Start today's task**. Use the popup to pause, resume, stop and review recent progress. Configure targets, intervals, keywords and schedules in Settings.

In **Settings → Basics → Interface language**, choose English, Simplified Chinese or the browser language. Chinese browser locales use Chinese by default; other locales use English. Language selection covers the popup, settings, Bing status bar, notifications and log exports. Existing settings and history remain compatible. Built-in keyword lists retain their original terms; enter your own English terms under Keywords if preferred. User-entered terms are never translated.

## Features and limits

- PC searches are the default. The first manual run respects your search target; starting again after completion can continue searching.
- Search intervals default to 8–14 seconds, with a minimum of 8 seconds. Pausing or interrupting simulated typing cancels that submission.
- Schedules support every day, weekdays or weekends. Optional catch-up applies to today. The browser must be running; the extension cannot wake your computer.
- Use local or custom keywords, refresh the list, block terms, and back up settings locally.
- View recent history and points changes, filter logs by date and export them.
- Daily activity assistance depends on the selected goal and current page layout. Quizzes and polls normally require manual input. Higher risk features are off by default and need separate confirmation.
- A run may stop after consecutive searches without points. This is a local estimate, not confirmation that Microsoft considers the quota complete.

Automated searches and clicks may conflict with Microsoft Rewards rules and can result in invalid points or account restrictions. Points and completion are not guaranteed. This independent project is not affiliated with Microsoft.

Settings, keywords, logs and progress stay in local browser storage. Searches go to Bing through normal browser navigation. There is no project analytics or account server. See [privacy details](PRIVACY.md) and [permission explanations](README.md#权限与隐私).

## Development

Requires Node.js 24.

```sh
npm ci
npm run lint
npm test
npx playwright install chromium
npm run test:browser
```

Browser tests use a temporary profile, isolated Bing fixtures and a dead local proxy. They do not use a personal account or submit live Bing searches. On Windows, set `EDGE_EXECUTABLE` to your installed Edge executable to test with Edge. Tests cannot establish compatibility with every live Microsoft page or regional rewards rule.
