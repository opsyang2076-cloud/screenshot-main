/* DSH 在线翻译 — 后台服务：右键菜单、安装引导 */
'use strict';

const MENU_ID = 'dsh-translate-selection';

function buildMenu() {
  chrome.contextMenus.removeAll(function () {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: '用 DSH 翻译选中内容',
      contexts: ['selection']
    });
  });
}

chrome.runtime.onInstalled.addListener(function () {
  buildMenu();
});

chrome.runtime.onStartup.addListener(buildMenu);

chrome.contextMenus.onClicked.addListener(async function (info) {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;

  try {
    await chrome.storage.session.set({ pendingText: info.selectionText });
  } catch (_) { /* 会话存储不可用时，仅退回角标提醒 */ }

  // Chrome 127+ 允许在用户手势中直接打开 popup；不可用或失败则显示角标
  if (typeof chrome.action.openPopup === 'function') {
    try {
      await chrome.action.openPopup();
      return;
    } catch (_) { /* 继续走角标 */ }
  }

  try {
    await chrome.action.setBadgeBackgroundColor({ color: '#4d6bfe' });
    await chrome.action.setBadgeText({ text: '1' });
  } catch (_) { /* 忽略 */ }
});
