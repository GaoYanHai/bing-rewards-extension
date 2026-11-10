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

Requires Node.js 24 and Python 3.10+. PowerShell 7 is optional for Windows wrappers.

```sh
npm ci
npm run lint
npm test
npm run test:publish
npx playwright install chromium
npm run test:browser
npm run pack
```

Browser tests use a temporary profile, isolated Bing fixtures and a dead local proxy. They do not use a personal account or submit live Bing searches. On Windows, set `EDGE_EXECUTABLE` to your installed Edge executable to test with Edge. Tests cannot establish compatibility with every live Microsoft page or regional rewards rule.

## Publishing

Build **one bilingual ZIP**. Never upload a second package for English. Configure local API credentials as described in [store/README.md](store/README.md); secrets and publisher state must stay outside Git.

```powershell
pwsh -File store/pack.ps1
pwsh -File store/publish.ps1 -Status
# After checking Partner Center has no pending submission:
pwsh -File store/publish.ps1 .\bing-rewards-extension-3.4.4.zip -ConfirmStoreReady -UploadOnly
python store/prepare_listing.py --locale en-US
# Save the English store listing and screenshots in Partner Center, then:
pwsh -File store/publish.ps1 .\bing-rewards-extension-3.4.4.zip
```

The upload-only step leaves the draft ready. The final command submits that draft without reuploading its package. Package locales are validated before upload. Certification notes default to [the English notes file](store/listings/certification-notes.txt); use `-NotesFile` to override them.

The public Edge update API handles package upload and review submission, but cannot edit localized store descriptions or screenshots. Prepare those assets with `store/prepare_listing.py`, then edit the matching language page in Partner Center. Saved operation IDs, a product lock and version/hash checks prevent automatic request replay. Keep `.edge-publish-state/` when retrying. A successful submission does not mean certification has completed.
