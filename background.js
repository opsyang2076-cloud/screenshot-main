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

chrome.runtime.onInstalled.addListener(async function (details) {
  buildMenu();
  if (details.reason === 'install') {
    const cfg = await chrome.storage.local.get({ apiKey: '' });
    if (!cfg.apiKey) chrome.runtime.openOptionsPage();
  }
});

chrome.runtime.onStartup.addListener(buildMenu);

chrome.contextMenus.onClicked.addListener(async function (info) {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;

  await chrome.storage.session.set({ pendingText: info.selectionText });

  try {
    // Chrome 127+ 允许在用户手势中直接打开 popup
    await chrome.action.openPopup();
  } catch (_) {
    await chrome.action.setBadgeBackgroundColor({ color: '#4D6BFE' });
    await chrome.action.setBadgeText({ text: '1' });
  }
});
