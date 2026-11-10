(() => {
  "use strict";
  const messages = {
  "Bing 积分助手": "Bing Rewards Assistant",
  "周日": "Sun",
  "周一": "Mon",
  "周二": "Tue",
  "周三": "Wed",
  "周四": "Thu",
  "周五": "Fri",
  "周六": "Sat",
  "日常短词": "Daily short terms",
  "生活长尾": "Everyday topics",
  "自定义": "Custom",
  "周末生活词": "Weekend topics",
  "今日词库已生成 · 基于本地词包 · 未使用热榜": "Today's keywords are ready · Local word lists · No trending feeds",
  "只搜满": "Search only",
  "搜满 + 安全任务": "Search + safe activities",
  "尽量全做": "Try all activities",
  "每天开始": "Every day",
  "仅工作日": "Weekdays only",
  "仅周六周日": "Weekends only",
  "日志": "Logs",
  "{0}月{1}日": "{0}/{1}",
  "{0}（今天）": "{0} (today)",
  "{0}（昨天）": "{0} (yesterday)",
  "未设置": "Not set",
  "今天 {0}": "Today {0}",
  "明天 {0}": "Tomorrow {0}",
  "下次": "Next",
  "与工作日相同": "Same as weekdays",
  "已完成": "Completed",
  "失败": "Failed",
  "今天": "Today",
  "还没有记录": "No records yet",
  "未做完": "Incomplete",
  "周": "Week",
  "电脑搜索 {0}/{1}": "PC searches {0}/{1}",
  "移动搜索 {0} 次": "Mobile searches: {0}",
  "大约 +{0}": "About +{0}",
  "这次没有加到分": "No points earned this time",
  "积分 {0}": "Points: {0}",
  "这天还没有记录。": "No record for this day.",
  "{0}月{1}日 {2}": "{0}/{1} {2}",
  "今天还没开始。": "Not started today.",
  "昨天还没做完": "Yesterday's task was not completed",
  "已连续完成 {0} 天": "Completed {0} days in a row",
  "这几天还没有连续完成": "No completion streak yet",
  "点继续会接着今天的进度，不会从头搜。": "Resume continues today's progress without starting over.",
  "已经完成 {0}/{1} 次搜索": "Completed {0}/{1} searches",
  "已经完成 {0} 次搜索": "Completed {0} searches",
  "登录状态看起来变了，也可能是网络波动。": "The sign-in status may have changed, or the connection may be unstable.",
  "请确认微软账号后继续今天的进度。": "Check your Microsoft account, then resume today's progress.",
  "可以用手机 Bing 做完。": "You can finish using Bing on your phone.",
  "{0}电脑搜索已满，继续会去做移动搜索。": "{0}PC searches are complete. Resume to continue with mobile searches.",
  "{0}电脑搜索已满，继续会去处理每日活动。": "{0}PC searches are complete. Resume to continue with daily activities.",
  "3.4.3 搜索控制与定时修复": "3.4.3 Search controls and scheduling fixes",
  "首次手动开始会遵守搜索目标，完成后可手动再搜": "Your first manual start follows the search target; you can search again after completion",
  "输入中暂停或操作页面会取消本次搜索": "Pausing or interacting with the page while typing cancels that search",
  "补做开关和补做前询问对搜索页同样生效": "Catch-up settings and prompts also apply on search pages",
  "默认仍是安全模式，只做电脑搜索；权限和产品名不变": "Safe mode remains the default: PC searches only; permissions and product name are unchanged",
  "你正在用电脑，已暂时停下": "Paused while you are using the page",
  "移动搜索页被关掉了": "The mobile search tab was closed",
  "已暂停": "Paused",
  "{0} 秒": "{0} sec",
  "{0} 分 {1} 秒": "{0} min {1} sec",
  "今日词库已生成 · 周末生活词 · 未使用热榜": "Today's keywords are ready · Weekend topics · No trending feeds",
  "登录状态变了": "Sign-in status changed",
  "需要重新登录": "Sign in again",
  "请确认微软账号后继续今天的进度": "Check your Microsoft account, then resume today's progress",
  "打开 Bing 并登录微软账号": "Open Bing and sign in to your Microsoft account",
  "登录状态看起来变了，已停止。如果账号其实还在，可能是网络波动。点继续会接着今天的进度。": "The sign-in status changed, so the task stopped. If you are still signed in, this may be a connection issue. Resume continues today's progress.",
  "没有检测到积分。请确认已登录微软账号，然后重试。": "Could not read your points. Make sure you are signed in to your Microsoft account, then retry.",
  "连续没有加分": "No points earned repeatedly",
  "今天可能已经满额，明天再试": "Today's quota may be full; try again tomorrow",
  "连续 {0} 次搜索没有加分，今天可能已经满额，或账号被限制。已停止。": "No points were earned in {0} consecutive searches. Your quota may be full or your account may be restricted. The task stopped.",
  "这次移动搜索没有加分": "No points earned from mobile search",
  "可以用手机 Bing 做完": "You can finish using Bing on your phone",
  "这次移动搜索没有加分，已停止。可以用手机 Bing 做完。": "No points were earned from mobile search, so the task stopped. You can finish using Bing on your phone.",
  "读不到这次移动搜索的积分": "Could not read mobile search points",
  "这次移动搜索读不到积分，已停止。可以用手机 Bing 做完。": "Could not read points from mobile search, so the task stopped. You can finish using Bing on your phone.",
  "没法做移动搜索": "Mobile search is unavailable",
  "请用手机 Bing 完成": "Finish using Bing on your phone",
  "没法用手机样式做这次移动搜索，已停止。请用手机 Bing 完成。": "Could not run this search with a mobile profile, so the task stopped. Finish using Bing on your phone.",
  "账号可能被限制": "Your account may be restricted",
  "先手动搜一次，确认还能加分": "Try a manual search first to check whether points are still awarded",
  "登录后连续搜索都没有加分，账号可能已被限制。已停止。": "Searches after sign-in did not earn points. Your account may be restricted. The task stopped.",
  "页面改版": "The page layout changed",
  "请稍后重试，或改用手动搜索": "Try again later or search manually",
  "找不到每日活动卡片，页面可能已改版。已跳过自动处理。": "Could not find the daily activity cards. The page may have changed. Automatic handling was skipped.",
  "找不到搜索框，页面可能已改版。已停止。": "Could not find the search box. The page may have changed. The task stopped.",
  "搜索页没有反应": "The search page is not responding",
  "点继续会再开一页接着搜": "Resume opens a page and continues searching",
  "搜索页崩溃或长时间没有反应。已停止。点继续会再开一页接着今天的进度。": "The search page crashed or stopped responding. The task stopped. Resume opens a page and continues today's progress.",
  "网络失败": "Connection failed",
  "检查网络后点继续": "Check your connection, then resume",
  "网络多次连不上，已停止。请检查连接后点继续，会接着今天的进度。": "Repeated connection failures stopped the task. Check your connection, then resume today's progress.",
  "已停止": "Stopped",
  "可以继续今天的进度": "You can resume today's progress",
  "移动搜索连续未加分": "Mobile searches stopped earning points",
  "连续 {0} 次移动搜索没有加分，已按设置结束；是否已满请以 Rewards 页面为准。": "No points were earned in {0} consecutive mobile searches, so this run ended as configured. Check Rewards to confirm the quota.",
  "电脑搜索连续未加分": "PC searches stopped earning points",
  "连续 {0} 次搜索没有加分，已按设置结束；是否已满请以 Rewards 页面为准。": "No points were earned in {0} consecutive searches, so this run ended as configured. Check Rewards to confirm the quota.",
  "高风险，需要你点一下": "Higher risk: your action is needed",
  "高风险": "Higher risk",
  "测验需要你点一下": "This quiz needs your input",
  "投票需要你点一下": "This poll needs your input",
  "打开即可得分": "Open to earn points",
  "页面显示电脑搜索已满": "The page shows PC searches are complete",
  "页面显示还剩 {0} 次": "The page shows {0} searches remaining",
  "还将用手机样式再搜 {0} 次": "{0} more searches will use a mobile profile",
  "每日活动还剩 {0} 张": "{0} daily activities remaining",
  "天气预报": "Weather forecast",
  "近 7 天完成了 {0} 天": "Completed {0} of the last 7 days",
  "近 30 天完成了 {0} 天": "Completed {0} of the last 30 days",
  "还没有 30 天记录": "No 30-day history yet",
  "这张需要你自己点。选完后点「我点完了」，或跳过这张": "Complete this activity yourself, then choose \"I've finished\" or \"Skip this\".",
  "{0}这是投票。请自己选完，然后点「我点完了」或「跳过这张」。": "{0}This is a poll. Make your selection, then choose \"I've finished\" or \"Skip this\".",
  "{0}这是测验，大约 {1} 题。请自己选完，然后点「我点完了」或「跳过这张」。": "{0}This is a quiz with about {1} questions. Complete it, then choose \"I've finished\" or \"Skip this\".",
  "{0}这是测验。请自己选完，然后点「我点完了」或「跳过这张」。": "{0}This is a quiz. Complete it, then choose \"I've finished\" or \"Skip this\".",
  "识别失败": "Could not identify the activity",
  "已跳过（{0}）": "Skipped ({0})",
  "已跳过": "Skipped",
  "需要你点一下": "Your action is needed",
  "可自动完成": "Can be completed automatically",
  "未开启（安全模式）": "Off (safe mode)",
  "还剩 {0} 个活动": "{0} activities remaining",
  "待识别": "Not identified yet",
  "{0}/{1} 可自动 · {2} 需手动": "{0}/{1} automatic · {2} manual",
  "未识别到活动": "No activities found",
  "已完成 {0} 张": "Completed {0}",
  "跳过 {0} 张": "Skipped {0}",
  "还需手动 {0} 张": "{0} still need manual input",
  "安全模式已开，未处理每日活动": "Safe mode is on; daily activities were not handled",
  "还有 {0} 个活动需要你点一下": "{0} activities still need your input",
  "每日活动已处理，跳过 {0} 张": "Daily activities handled; skipped {0}",
  "每日活动已处理": "Daily activities handled",
  "每日活动仍待处理": "Daily activities are still pending",
  "今天的任务已完成": "Today's task is complete",
  "今日电脑搜索 {0}/{1}": "Today's PC searches: {0}/{1}",
  "每日活动完成 {0} 张、跳过 {1} 张": "Daily activities: {0} completed, {1} skipped",
  "用时 {0}": "Time: {0}",
  "文件不是有效的 JSON。": "The file is not valid JSON.",
  "备份文件格式不对。": "The backup format is invalid.",
  "备份里没有找到设置。": "No settings were found in the backup.",
  "备份里没有可用的设置。": "The backup contains no supported settings.",
  "今晚 {0}": "Tonight {0}",
  "[Bing助手] {0}": "[Bing Assistant] {0}",
  "扩展还没准备好": "The extension is not ready yet",
  "暂时没法完成这个操作，请再试一次。": "Could not complete this action. Please retry.",
  "Storage.get 失败": "Storage.get failed",
  "Storage.getAll 失败": "Storage.getAll failed",
  "Storage.set 失败": "Storage.set failed",
  "无法保存扩展状态": "Could not save the extension state",
  "搜索页没有反应，已刷新": "The search page stopped responding and was refreshed",
  "页面已崩溃": "The page crashed",
  "搜索页长时间没动静": "The search page has been inactive for too long",
  "搜索页没有反应，已新开一页": "The search page stopped responding; a new tab was opened",
  "原页面已崩溃": "The original page crashed",
  "没找到可用搜索页": "No usable search page was found",
  "今天不用做移动搜索": "Mobile searches are not needed today",
  "正在做移动搜索": "Running mobile searches",
  "开始移动搜索": "Start mobile searches",
  "正在打开每日活动": "Opening daily activities",
  "移动搜索已完成": "Mobile searches completed",
  "移动搜索已完成，正在打开每日活动": "Mobile searches completed; opening daily activities",
  "移动搜索页被关掉了。点继续会重新打开": "The mobile search tab was closed. Resume will reopen it",
  "点继续会重新打开": "Resume will reopen the tab",
  "现在补做": "Catch up now",
  "今天算了": "Skip today",
  "错过的搜索不能补做": "Missed searches cannot be credited to a previous day",
  "请先确认使用风险": "Please acknowledge the usage risks first",
  "请先登录微软账号": "Please sign in to your Microsoft account first",
  "今天的任务已经完成": "Today's task is already complete",
  "已到设定时间，正在开始今天的任务": "The scheduled time has arrived; starting today's task",
  "正在补做今天的任务": "Catching up on today's task",
  "昨天还没做完，正在开始今天的任务": "Yesterday's task was incomplete; starting today's task",
  "开始今日任务": "Start today's task",
  "无法打开任务页面，请检查浏览器后重试。": "Could not open the task page. Check your browser, then retry.",
  "还没有开始今天的任务": "Today's task has not started yet",
  "继续今天的任务": "Resume today's task",
  "现在没有需要你点的活动": "No activity currently needs your input",
  "你跳过了这张": "You skipped this activity",
  "已跳过「{0}」": "Skipped \"{0}\"",
  "这张活动": "this activity",
  "跳过「{0}」": "Skip \"{0}\"",
  "正在确认「{0}」是否完成": "Checking whether \"{0}\" is complete",
  "还没有登录微软账号，今天的任务还没开始。": "You are not signed in to your Microsoft account. Today's task has not started.",
  "现在补做今天的任务吗？": "Catch up on today's task now?",
  "昨天的计划还没完成。昨天的积分无法补记，今天可按原计划继续。": "Yesterday's task was incomplete. Points cannot be credited to yesterday; today's schedule is unchanged.",
  "已拉黑「{0}」": "Blocked \"{0}\"",
  "今天不再搜": "Will not search this today",
  "导入失败，当前设置没有改动。": "Import failed. Your settings were not changed.",
  "未知操作": "Unknown action",
  "操作失败，请重试；详情可在扩展后台查看。": "The action failed. Please retry; details are available in the extension service worker console.",
  "保存设置失败: {0}": "Failed to save settings: {0}",
  "停止": "Stop",
  "其他标签页正在运行": "Another tab is running the task",
  "开始": "Start",
  "新的一天，已生成今日搜索词": "A new day: today's search terms are ready",
  "这批搜索词用完了，正在换一批": "This keyword batch is finished; preparing another batch",
  "等待重试": "Waiting to retry",
  "网络好像不稳，正在等待后继续搜索。": "The connection appears unstable. Waiting before continuing.",
  "暂时读不到登录状态，继续按已登录搜索。": "Could not read sign-in status temporarily; continuing with the known signed-in state.",
  "积分读数突然对不上，正在再确认一次。": "The points balance changed unexpectedly. Checking again.",
  "每日活动": "Daily activities",
  "每日活动 {0}": "Daily activities: {0}",
  "继续": "Resume",
  "今天已完成": "Completed today",
  "无法保存搜索进度，已取消这次搜索。请检查扩展存储后重试。": "Could not save search progress. This search was cancelled. Check extension storage, then retry.",
  "找不到搜索框": "Search box not found",
  "改用跳转搜索": "Using a search URL instead",
  "已继续今天的任务": "Today's task has resumed",
  "正在等待每日活动页面准备好（还剩 {0} 秒）": "Waiting for the daily activities page ({0} sec remaining)",
  "电脑搜索已完成，正在打开每日活动": "PC searches completed; opening daily activities",
  "移动搜索": "Mobile searches",
  "电脑搜索": "PC searches",
  "今天的电脑搜索已完成": "Today's PC searches are complete",
  "活动": "Activity",
  "未解锁": "Locked",
  "还没有识别到活动卡片": "No activity cards have been identified yet",
  "input[value='开始测验']": "input[value='开始测验']",
  "测验看起来已完成，正在返回清单": "The quiz appears complete; returning to the activity list",
  "测验已完成": "Quiz completed",
  "正在返回清单": "Returning to the activity list",
  "测验已完成，正在返回清单": "Quiz completed; returning to the activity list",
  "正在作答：{0}": "Answering: {0}",
  "正在作答测验": "Answering the quiz",
  "已退回你自己点": "Switched back to manual input",
  "安全模式已开，正在返回搜索": "Safe mode is on; returning to search",
  "测验": "Quiz",
  "积分 +{0}": "Points +{0}",
  "“{0}”已得分，正在返回清单": "\"{0}\" earned points; returning to the activity list",
  "还没看到这张完成。确认点完后再试，或跳过这张。": "This activity is not marked complete yet. Finish it and retry, or skip it.",
  "正在确认你刚才点的活动是否完成...": "Checking whether the activity you selected is complete...",
  "这是测验或投票页。开始今日任务后，可以在这里确认或跳过。": "This is a quiz or poll page. Start today's task to confirm or skip it here.",
  "需要你点一下：{0}": "Your action is needed: {0}",
  "正在返回每日活动清单": "Returning to the daily activity list",
  "正在读取每日活动...": "Reading daily activities...",
  "“{0}”已完成，继续处理": "\"{0}\" is complete; continuing",
  "“{0}”已得分": "\"{0}\" earned points",
  "正在确认刚才的活动是否加分（还剩 {0} 秒）": "Checking points from the last activity ({0} sec remaining)",
  "打开「{0}」": "Open \"{0}\"",
  "多次没有加分": "No points earned after several attempts",
  "“{0}”多次没有加分，已跳过": "\"{0}\" did not earn points after several attempts and was skipped",
  "正在确认「{0}」是否加分（{1}/{2}）": "Checking points from \"{0}\" ({1}/{2})",
  "每日活动已处理完，正在返回搜索": "Daily activities handled; returning to search",
  "跳过「{0}」（{1}）": "Skip \"{0}\" ({1})",
  "找不到这张活动卡片，页面可能已改版": "Could not find this activity card; the page may have changed",
  "正在打开活动：{0}": "Opening activity: {0}",
  "正在查找搜索框...": "Looking for the search box...",
  "正在确认这次移动搜索的积分...": "Checking points from this mobile search...",
  "暂时读不到积分，继续按已登录搜索。": "Could not read points temporarily; continuing with the known signed-in state.",
  "正在模拟常规搜索，间隔 {0}-{1} 秒（还剩 {2} 秒）": "Search interval: {0}-{1} sec ({2} sec remaining)",
  "已重新开始计算加分": "Points tracking restarted",
  "重新计分": "Restart points tracking",
  "空转不计入连续没有加分": "Unverified attempts do not count as searches without points",
  "这次没有加分（{0}/{1}）": "No points this time ({0}/{1})",
  "{0}正在搜索：{1}": "{0}Searching: {1}",
  "今日搜索词已准备好": "Today's search terms are ready",
  "展开": "Expand",
  "正在读取每日活动": "Reading daily activities",
  "每日活动 待识别": "Daily activities: not identified yet",
  "今日活动": "Today's activities",
  "我点完了": "I've finished",
  "跳过这张": "Skip this",
  "已停止，正在返回搜索": "Stopped; returning to search",
  "电脑搜索 0/{0}": "PC searches 0/{0}",
  "每日活动 未开启（安全模式）": "Daily activities: off (safe mode)",
  "今日搜索词": "Today's search terms",
  "换一批": "Refresh terms",
  "拉黑当前": "Block current term",
  "基于本地词包 · 未使用热榜": "Local word lists · No trending feeds",
  "还没有当前搜索词": "No current search term",
  "已拉黑「{0}」，今天不再搜": "Blocked \"{0}\"; it will not be searched today",
  "正在开始今天的任务": "Starting today's task",
  "暂时没法开始，请再点一次": "Could not start right now. Please retry",
  "版本 {0}": "Version {0}",
  "还没有检测到微软账号": "No Microsoft account detected",
  "当前积分 {0}": "Current points: {0}",
  "打开 Bing 后会显示账号积分": "Open Bing to see your account points",
  "下一步": "Next step",
  "登录后才能记录积分": "Sign in to track points",
  "打开 Bing 并登录": "Open Bing and sign in",
  "登录微软账号后，再回来开始今天的任务。": "Sign in to your Microsoft account, then return to start today's task.",
  "当前搜索": "Current search",
  "正在做移动搜索 {0}/{1}": "Running mobile searches {0}/{1}",
  "准备中": "Preparing",
  "正在处理每日活动": "Handling daily activities",
  "当前活动": "Current activity",
  "读取任务清单": "Reading the activity list",
  "正在搜索 {0}/{1}": "Searching {0}/{1}",
  "你正在用电脑，已暂时停下。条件消失后会自动继续。": "Paused while you are using the page. The task resumes when you are no longer busy.",
  "已暂停，进度还在。点继续即可接着做。": "Paused. Your progress is saved. Choose Resume to continue.",
  "暂停": "Pause",
  "正在模拟常规搜索，间隔 {0}-{1} 秒。": "Search interval: {0}-{1} sec.",
  "已用时 {0}。{1}": "Elapsed: {0}. {1}",
  "需要你点一下：{0}。点完后回来确认，或跳过这张。": "Your action is needed: {0}. Return to confirm when finished, or skip this activity.",
  "用时": "Elapsed",
  "再开始": "Start again",
  "自动开始不会再跑。想继续搜，点再开始。": "Automatic start will not run again today. To keep searching, choose Start again.",
  "这次没有完成，已停止": "This run did not finish and has stopped",
  "这次加分": "Points earned",
  "原因": "Reason",
  "今天还没做完": "Today's task is incomplete",
  "今天还没开始": "Not started today",
  "下次自动开始": "Next automatic start",
  "未设置，建议{0}": "Not set; suggested time: {0}",
  "今日目标：{0}。完整电脑搜索大约 6-10 分钟。": "Today's goal: {0}. A full PC search run takes about 6-10 minutes.",
  "完整电脑搜索大约 6-10 分钟，期间请保持浏览器运行。": "A full PC search run takes about 6-10 minutes. Keep your browser open.",
  "操作失败，请重试。": "The action failed. Please retry.",
  "去掉": "Remove",
  "下次启动：{0}": "Next start: {0}",
  "下次启动：未设置，建议{0}": "Next start: not set; suggested time: {0}",
  "自定义词库是空的，已改用日常短词。": "The custom list is empty. Daily short terms will be used instead.",
  "还没有今日搜索词。保存词库或点换一批后会生成。": "No search terms yet. Save a list or choose Refresh terms to generate them.",
  "还没有拉黑词。": "No blocked terms yet.",
  "还没有今天的日志。": "No logs for today yet.",
  "这天还没有日志。": "No logs for this day.",
  "保存失败，请重试。当前修改尚未保存。": "Save failed. Please retry. Your changes have not been saved.",
  "还没有日志": "No logs yet",
  "导出失败，当前设置没有改动。": "Export failed. Your settings were not changed.",
  "已导出设置和词库。": "Settings and keywords exported.",
  "导入会覆盖当前设置和词库，积分和运行状态不会改。确定导入吗？": "Import will replace your settings and keywords. Points and run state will not change. Continue?",
  "已取消导入，当前设置保持不变。": "Import cancelled. Your settings were not changed.",
  "设置已导入。": "Settings imported.",
  "使用前请先了解风险": "Understand the risks before using this extension",
  "自动搜索和自动点击可能不符合 Microsoft Rewards 使用规则，存在积分无效或账号受限的风险。请自行判断是否使用。": "Automated searches and clicks may violate Microsoft Rewards rules. Points may be invalidated or your account restricted. Decide whether to use this extension at your own risk.",
  "本扩展只会在浏览器开着时工作。电脑关机、睡眠，或浏览器完全退出时，无法自己启动。": "This extension only works while the browser is running. It cannot start itself when your computer is off or asleep, or the browser is fully closed.",
  "我已了解风险，并自行承担使用后果": "I understand the risks and accept responsibility for using this extension",
  "开始使用": "Get started",
  "尚未检测账号": "No account detected yet",
  "看看": "Details",
  "知道了": "Got it",
  "收起": "Collapse",
  "去处理": "Open activity",
  "设置": "Settings",
  "打开 Bing": "Open Bing",
  "说明": "Help",
  "版本 3.4.2": "Version 3.4.2",
  "使用时请记住": "Keep in mind",
  "浏览器开着时才会运行。到点会自动开始；当时没开，下次打开会补做今天。": "Runs only while the browser is open. Starts at the scheduled time; if missed, it can catch up on today's task the next time the browser opens.",
  "电脑关机、睡眠，或浏览器完全退出时，无法自己启动。": "Cannot start itself when your computer is off or asleep, or the browser is fully closed.",
  "自动搜索可能不符合 Microsoft Rewards 使用规则，请自行判断是否使用。": "Automated searches may violate Microsoft Rewards rules. Decide whether to use this extension at your own risk.",
  "返回": "Back",
  "Bing 积分助手设置": "Bing Rewards Assistant settings",
  "常用设置放在上面。词库、日志和危险选项往下翻即可。": "Common settings are at the top. Scroll down for keywords, logs, and higher risk options.",
  "设置快速导航": "Settings navigation",
  "基础": "Basics",
  "记录": "History",
  "词库": "Keywords",
  "高级": "Advanced",
  "风险": "Risks",
  "基础设置": "Basic settings",
  "自动开始": "Automatic start",
  "下次启动：未设置": "Next start: not set",
  "可选每天开始、仅工作日，或仅周六周日（工作日不开始）。": "Choose every day, weekdays only, or weekends only.",
  "浏览器开着，到点会启动。": "Starts at the scheduled time while the browser is running.",
  "当时没开，下次打开浏览器会补做今天。": "If the browser was closed, it can catch up on today's task when reopened.",
  "电脑关机或睡眠时，无法自己开机。": "Cannot wake your computer when it is off or asleep.",
  "今日目标": "Today's goal",
  "只搜满（安全模式）": "Search only (safe mode)",
  "默认只做电脑搜索。安全任务只自动打开即可得分的探索活动，测验和投票会提醒你自己点。": "PC searches only by default. Safe activities only open exploration cards that can earn points; quizzes and polls need your input.",
  "周末目标": "Weekend goal",
  "只覆盖周末的目标和搜索次数。词库可在下面单独设置，默认仍与工作日相同。": "Overrides the weekend goal and search count only. Configure weekend keywords separately below; they match weekdays by default.",
  "电脑搜索目标次数": "PC search target",
  "周末电脑搜索次数": "Weekend PC search target",
  "沿用工作日": "Use weekday setting",
  "留空则沿用工作日次数。": "Leave blank to use the weekday target.",
  "漏做时提醒我": "Remind me about missed days",
  "昨天是计划日却还没做完时，打开浏览器后最多提醒一次。": "If yesterday was scheduled but incomplete, show at most one reminder when the browser opens.",
  "完成后通知我": "Notify me when finished",
  "近 30 天": "Last 30 days",
  "每日搜索词": "Daily search terms",
  "日常短词（推荐）": "Daily short terms (recommended)",
  "周末词库": "Weekend keywords",
  "周末可以用更生活化的搜索词。默认仍与工作日相同。自定义词库不会被覆盖。": "Use more everyday topics on weekends if you want. Weekday terms are used by default. Custom keywords are preserved.",
  "自定义词，每行一个，也可用逗号分隔": "Custom keywords: one per line, or separated by commas",
  "天气预报\n今日新闻\n家常菜谱": "weather forecast\ntoday's news\neasy recipes",
  "保存自定义词": "Save custom terms",
  "今日词库还没生成。打开 Bing 后会按本地词包生成。": "Today's keywords have not been generated yet. Open Bing to generate them from a local list.",
  "拉黑词，今天不会再搜": "Blocked terms will not be searched today",
  "输入要拉黑的词": "Enter a term to block",
  "拉黑": "Block",
  "运行日志": "Run logs",
  "日期": "Date",
  "导出日志": "Export logs",
  "高级设置": "Advanced settings",
  "本地备份": "Local backup",
  "导出设置": "Export settings",
  "导入设置": "Import settings",
  "只备份设置和词库，不含积分和运行状态。导入前会再确认一次；失败则保持现在的设置。": "Backs up settings and keywords only, excluding points and run state. Import asks for confirmation; a failed import preserves existing settings.",
  "搜索间隔（秒）": "Search interval (seconds)",
  "到": "to",
  "默认 8-14 秒。不能短于 8 秒。每次间隔不会完全一样。": "Default: 8-14 seconds. Minimum: 8 seconds. Each interval varies.",
  "模拟输入": "Type search terms gradually",
  "新安装默认打开。打开后会在搜索框里逐字输入再搜索。找不到搜索框时才会跳转链接。": "On by default for new installations. Types each character into the search box before submitting. Uses a search URL if the box is unavailable.",
  "我在用电脑时先暂停": "Pause while I am using the page",
  "全屏、正在输入，或正在用这个必应页面（包括翻译框）时会先停下。大约 1 分钟没有操作后才会自动继续。": "Pauses in fullscreen, while typing, or while interacting with this Bing page, including the translation box. Resumes after about one minute without input.",
  "连续没有积分时视为已满": "Treat consecutive searches without points as complete",
  "连续几次搜索都没有加分，会按搜索已满结束本次任务；这是本机推断，不代表微软已确认配额已满。刷新页面或暂时读不到登录时不计入。": "Ends the run after the configured number of searches without points. This is a local estimate, not confirmation from Microsoft. Refreshes and unreadable sign-in states do not count.",
  "每日活动重试次数": "Daily activity retry limit",
  "允许错过时间后补做": "Allow catch-up after a missed start time",
  "补做前先问我一声": "Ask before catching up",
  "危险设置": "Higher risk settings",
  "启用危险设置": "Enable higher risk settings",
  "默认关闭。打开后才能使用下面这些更高风险的选项，且仍需你逐项打开。": "Off by default. Enables access to the options below; each option must also be enabled separately.",
  "这些选项可能增加积分无效或账号受限的风险。请确认你了解后再启用。": "These options may increase the risk of invalid points or account restrictions. Enable them only if you understand the risks.",
  "我已了解风险，仍要启用": "I understand the risks and still want to enable these options",
  "确认启用": "Confirm enable",
  "取消": "Cancel",
  "允许高风险活动": "Allow higher risk activities",
  "默认跳过安装、购物、问卷等卡片。打开后会停下来让你自己点，不会自动完成。需把今日目标设成“尽量全做”。": "Skips installation, shopping, and survey cards by default. When enabled, pauses for you to complete them manually. Requires the \"Try all activities\" goal.",
  "自动点开并作答测验": "Open and attempt quizzes automatically",
  "打开后会自动点开测验和投票，并尝试作答。同一题点几次还在，会停下来让你自己点。不保证能做完。需把今日目标设成“尽量全做”。": "Opens quizzes and polls and attempts answers. If the same question persists, switches back to manual input. Completion is not guaranteed. Requires the \"Try all activities\" goal.",
  "执行移动搜索": "Run mobile searches",
  "打开后，电脑搜索做完会另开一个标签页，用手机样式继续搜。加不到分、标签页被关掉或没法改成手机样式时会停下来。可能增加账号风险，也容易被页面识破。": "After PC searches, opens another tab using a mobile profile. Stops if points are unavailable, the tab is closed, or the mobile profile cannot be applied. This may increase account risk and may not be recognized as mobile search.",
  "移动搜索次数": "Mobile search target",
  "电脑搜索做完后，会按这个次数用手机样式再搜。": "After PC searches finish, runs this many searches with a mobile profile.",
  "这个版本": "About this version",
  "搜索间隔等待时不再当成卡住，也不会反复刷新搜索页": "Waiting between searches no longer triggers an unnecessary page refresh",
  "今天完成后不会再自动开始，但手动点开始仍会继续搜": "Automatic start stays off after completion; a manual start can search again",
  "刷新后重新计分，空转不计入连续没有加分": "Points tracking restarts after a refresh; unverified attempts do not count as searches without points",
  "风险说明": "Usage risks",
  "界面语言": "Interface language",
  "跟随浏览器": "Use browser language",
  "简体中文": "Simplified Chinese",
  "英文": "English",
  "日": "Sun",
  "一": "Mon",
  "二": "Tue",
  "三": "Wed",
  "四": "Thu",
  "五": "Fri",
  "六": "Sat",
  "3.4.4 中英文界面": "3.4.4 English and Chinese interface",
  "界面支持中文和英语，可跟随浏览器或手动切换": "Use English or Chinese, following your browser or a manual choice",
  "保留已有设置、词库和运行记录，切换语言无需重新配置": "Switch languages while keeping your settings, keywords, and run history",
  "日志、通知、设置和搜索页状态条同步使用界面语言": "Logs, notifications, settings, and the search status bar use your interface language"
};
  const LANGUAGE_KEY = "Rebang_UiLanguage";
  let preference = "auto";
  const originals = new WeakMap();
  const attributes = new WeakMap();
  const api = typeof chrome !== "undefined" ? chrome : null;
  const browserLanguage = () => api?.i18n?.getUILanguage?.() || (typeof navigator !== "undefined" ? navigator.language : "zh-CN");
  const language = () => preference === "auto" ? (/^zh\b/i.test(browserLanguage()) ? "zh_CN" : "en") : preference;
  const normalize = value => ["en", "zh_CN"].includes(value) ? value : "auto";
  const escapePattern = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = Object.entries(messages).filter(([source]) => /\{\d+\}/.test(source)).map(([source, target]) => {
    const slots = [];
    const parts = source.split(/(\{\d+\})/g).map(part => {
      if (/^\{\d+\}$/.test(part)) { slots.push(Number(part.slice(1, -1))); return "([\\s\\S]*?)"; }
      return escapePattern(part);
    });
    return { regex: new RegExp(`^${parts.join("")}$`), target, slots, weight: source.replace(/\{\d+\}/g, "").length };
  }).sort((a, b) => b.weight - a.weight);
  const phrases = Object.entries(messages).filter(([source]) => source.length > 1 && !/\{\d+\}/.test(source))
    .sort((a, b) => b[0].length - a[0].length);

  function translate(source, depth = 0) {
    const text = String(source ?? "");
    if (language() !== "en" || !/[\u3400-\u9fff]/.test(text) || depth > 24) return text;
    if (Object.prototype.hasOwnProperty.call(messages, text)) return messages[text];
    for (const entry of patterns) {
      const match = entry.regex.exec(text);
      if (!match) continue;
      const values = {};
      entry.slots.forEach((slot, index) => { values[slot] = match[index + 1]; });
      return entry.target.replace(/\{(\d+)\}/g, (_, slot) => translate(values[slot], depth + 1));
    }
    // Preserve complete phrases when summaries concatenate several messages.
    // Boundaries keep matches away from arbitrary words or user-provided terms.
    for (const [source, target] of phrases) {
      const index = text.indexOf(source);
      if (index < 0) continue;
      const before = text.slice(0, index), after = text.slice(index + source.length);
      if (before && !/[\s，。；·：:]$/.test(before)) continue;
      if (after && !/^[\s，。；·：:]/.test(after) && !/[。；]$/.test(source)) continue;
      return translate(before, depth + 1) + target + translate(after, depth + 1);
    }
    const trimmed = text.trim();
    if (trimmed !== text) return text.replace(trimmed, translate(trimmed, depth + 1));
    // Summaries and log lines join independently localized fragments.
    const fragments = text.split(/(\s{2,}|[，。；·\n])/g);
    if (fragments.length > 1) return fragments.map(part => ({ "，": ", ", "。": ". ", "；": "; " }[part] || translate(part, depth + 1))).join("");
    const prefixed = /^(\d{2}:\d{2}\s+)([\s\S]+)$/.exec(text);
    if (prefixed) return prefixed[1] + translate(prefixed[2], depth + 1);
    return text;
  }

  function skipText(node) {
    const parent = node.parentElement;
    if (!parent || parent.closest("script, style, textarea, [data-i18n-skip]")) return true;
    if (parent.closest("#today-words, #blocked-words") && !parent.closest("button, .help")) return true;
    return Boolean(parent.closest(".keyword-link span"));
  }

  function localize(root) {
    if (!root || typeof document === "undefined") return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (skipText(node)) continue;
      const previous = originals.get(node);
      const source = previous && node.nodeValue === previous.translated ? previous.source : node.nodeValue;
      const translated = translate(source);
      originals.set(node, { source, translated });
      if (node.nodeValue !== translated) node.nodeValue = translated;
    }
    for (const el of [root, ...root.querySelectorAll("[title], [placeholder], [aria-label], [alt]")]) {
      if (!el.getAttribute || el.closest("[data-i18n-skip]")) continue;
      let map = attributes.get(el);
      if (!map) { map = new Map(); attributes.set(el, map); }
      for (const name of ["title", "placeholder", "aria-label", "alt"]) {
        const current = el.getAttribute(name);
        if (current == null) continue;
        const previous = map.get(name);
        const source = previous && current === previous.translated ? previous.source : current;
        const translated = translate(source);
        map.set(name, { source, translated });
        if (current !== translated) el.setAttribute(name, translated);
      }
    }
  }

  let scheduled = false;
  function refresh() {
    if (typeof document === "undefined") return;
    const extensionPage = location.protocol === "chrome-extension:" || location.protocol === "moz-extension:";
    const root = extensionPage ? document.documentElement : document.getElementById("rebang-widget");
    if (extensionPage) document.documentElement.lang = language() === "en" ? "en" : "zh-CN";
    localize(root);
  }
  function scheduleRefresh() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; refresh(); });
  }
  function setLanguage(value) { preference = normalize(value); refresh(); }
  const ready = (async () => {
    try { if (api?.storage?.local) setLanguage((await api.storage.local.get(LANGUAGE_KEY))[LANGUAGE_KEY]); }
    catch (_error) { /* Browser language remains available if storage is temporarily unavailable. */ }
  })();
  api?.storage?.onChanged?.addListener((changes, area) => {
    if (area === "local" && changes[LANGUAGE_KEY]) setLanguage(changes[LANGUAGE_KEY].newValue);
  });
  if (typeof document !== "undefined") {
    const observe = () => {
      refresh();
      new MutationObserver(scheduleRefresh).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["title", "placeholder", "aria-label", "alt"] });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe, { once: true });
    else observe();
  }
  globalThis.BingI18n = { t: translate, language, setLanguage, normalize, localize, refresh, ready, messages };
})();
