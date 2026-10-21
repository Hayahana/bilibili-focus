/* 点击工具栏图标 → 通知当前标签页切换专注模式 */
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'bfm:toggle' });
  } catch (e) {
    // 当前页不是 B 站（没有 content script），忽略即可
  }
});
