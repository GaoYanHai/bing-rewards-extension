# Bing Rewards 积分助手扩展

这是一个面向 Edge/Chrome 的 Manifest V3 扩展，由原油猴脚本改造而来。扩展在 Bing 搜索页显示操作悬浮窗，并使用浏览器后台闹钟处理每日定时启动。

## 功能

- Bing 搜索页悬浮控制面板
- 本地每日关键词与搜索进度记录
- 可选 Rewards 每日任务处理
- 每日定时启动和错过时间后的补执行
- 多标签页执行互斥
- Bing 搜索页与 Rewards 页面共享扩展状态
- 深色模式和悬浮窗位置记忆

## 安装

1. 下载或克隆本仓库。
2. 打开 Edge 的 `edge://extensions/` 或 Chrome 的 `chrome://extensions/`。
3. 打开“开发人员模式”。
4. 选择“加载解压缩的扩展”，然后选择本仓库目录。
5. 登录 Bing，刷新任意 Bing 搜索页。
6. 在右侧悬浮窗中设置自动启动时间并点击“设置”。

点击浏览器工具栏中的扩展按钮可以直接打开 Bing 搜索页。

## 定时行为

扩展使用 `chrome.alarms`，不再依赖后台网页中的 `setInterval`：

- 浏览器运行时，时间到达后会打开或唤醒 Bing 搜索标签页。
- 浏览器在设定时间没有运行时，下次启动后会补执行当天尚未触发的任务。
- 电脑睡眠时无法准点运行，唤醒后由浏览器补执行。
- 浏览器完全退出且没有后台进程时，扩展无法自行启动浏览器。

## 权限

- `alarms`：保存每日后台闹钟。
- `storage`：跨页面保存设置与运行状态。
- `tabs`：打开或唤醒 Bing 搜索标签页。
- `https://*.bing.com/*`：在 Bing 搜索和 Rewards 页面运行内容脚本。

## 注意

自动搜索或自动点击可能受到 Microsoft Rewards 使用规则限制，并可能导致积分无效或账号受限。请自行评估并承担使用风险。

## 项目结构

```text
.
├─ manifest.json
├─ background.js
├─ content.js
└─ vendor/
   └─ jquery-3.7.1.min.js
```

## 许可证

本项目按照 GNU General Public License v3.0 or later 发布。jQuery 按其原 MIT License 发布。
