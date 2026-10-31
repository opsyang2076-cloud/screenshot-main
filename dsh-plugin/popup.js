/* DSH 在线翻译 — 交互逻辑 */
(function () {
  'use strict';

  var I18N = window.DSH_I18N;
  var API = window.DSH_TRANSLATOR;
  var MAX_CHARS = 5000;

  var el = {
    source: document.getElementById('source'),
    result: document.getElementById('result'),
    placeholder: document.getElementById('placeholder'),
    charCount: document.getElementById('charCount'),
    btnClear: document.getElementById('btnClear'),
    btnTranslate: document.getElementById('btnTranslate'),
    btnSwap: document.getElementById('btnSwap'),
    btnSettings: document.getElementById('btnSettings'),
    errorBar: document.getElementById('errorBar'),
    errorText: document.getElementById('errorText'),
    btnErrorClose: document.getElementById('btnErrorClose'),
    status: document.getElementById('status'),
    quickbar: document.querySelector('.quickbar')
  };

  var state = { src: 'auto', tgt: 'zh-CN', lastSource: 'en', busy: false, result: '' };

  /* ---------------- 语言下拉 ---------------- */

  function createSelect(rootEl, options) {
    var trigger = rootEl.querySelector('.select-trigger');
    var label = rootEl.querySelector('.select-label');
    var panel = rootEl.querySelector('.select-panel');
    var search = rootEl.querySelector('.select-search');
    var list = rootEl.querySelector('.select-list');
    var empty = rootEl.querySelector('.select-empty');
    var value = options.value;
    var activeIndex = -1;

    var items = I18N.list.slice();
    if (options.includeAuto) items.unshift(I18N.auto);

    function matches(item, kw) {
      if (!kw) return true;
      var k = kw.toLowerCase();
      return item.zh.indexOf(kw) > -1 ||
        item.en.toLowerCase().indexOf(k) > -1 ||
        item.code.toLowerCase().indexOf(k) > -1;
    }

    function render(kw) {
      list.innerHTML = '';
      activeIndex = -1;
      var shown = 0;
      items.forEach(function (item) {
        if (!matches(item, kw)) return;
        shown++;
        var li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.code = item.code;
        li.setAttribute('aria-selected', String(item.code === value));
        var name = document.createElement('span');
        name.textContent = item.zh;
        li.appendChild(name);
        var en = document.createElement('span');
        en.className = 'en';
        en.textContent = item.en;
        li.appendChild(en);
        list.appendChild(li);
      });
      empty.hidden = shown > 0;
    }

    function open() {
      closeAll(rootEl);
      rootEl.classList.add('open');
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      search.value = '';
      render('');
      search.focus();
      var sel = list.querySelector('[aria-selected="true"]');
      if (sel) sel.scrollIntoView({ block: 'nearest' });
    }

    function close() {
      rootEl.classList.remove('open');
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }

    function pick(code) {
      value = code;
      var item = I18N.byCode[code] || I18N.list[0];
      label.textContent = item.zh;
      close();
      trigger.focus();
      chrome.storage.local.set(options.includeAuto ? { srcLang: code } : { tgtLang: code });
      if (options.onChange) options.onChange(code);
    }

    trigger.addEventListener('click', function () {
      if (panel.hidden) open(); else close();
    });

    search.addEventListener('input', function () { render(search.value.trim()); });

    search.addEventListener('keydown', function (e) {
      var nodes = [].slice.call(list.children);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!nodes.length) return;
        activeIndex += e.key === 'ArrowDown' ? 1 : -1;
        if (activeIndex < 0) activeIndex = nodes.length - 1;
        if (activeIndex > nodes.length - 1) activeIndex = 0;
        nodes.forEach(function (n) { n.classList.remove('active'); });
        nodes[activeIndex].classList.add('active');
        nodes[activeIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        var target = nodes[activeIndex] || nodes[0];
        if (target) pick(target.dataset.code);
      } else if (e.key === 'Escape') {
        close();
        trigger.focus();
      }
    });

    list.addEventListener('click', function (e) {
      var li = e.target.closest('li');
      if (li) pick(li.dataset.code);
    });

    document.addEventListener('click', function (e) {
      if (!rootEl.contains(e.target)) close();
    });

    return {
      el: rootEl,
      close: close,
      get: function () { return value; },
      set: function (code) {
        value = code;
        var item = I18N.byCode[code] || I18N.list[0];
        label.textContent = item.zh;
      }
    };
  }

  function closeAll(except) {
    document.querySelectorAll('.select').forEach(function (s) {
      if (s === except) return;
      s.classList.remove('open');
      s.querySelector('.select-panel').hidden = true;
      s.querySelector('.select-trigger').setAttribute('aria-expanded', 'false');
    });
  }

  var srcSelect = createSelect(document.querySelector('[data-role="src"]'), {
    includeAuto: true,
    value: 'auto',
    onChange: function (code) { state.src = code; }
  });

  var tgtSelect = createSelect(document.querySelector('[data-role="tgt"]'), {
    includeAuto: false,
    value: 'zh-CN',
    onChange: function (code) { state.tgt = code; }
  });

  /* ---------------- 提示 ---------------- */

  function showError(msg) {
    el.errorText.textContent = msg;
    el.errorBar.hidden = false;
  }

  function clearError() {
    el.errorBar.hidden = true;
    el.errorText.textContent = '';
  }

  function setLoading(on) {
    state.busy = on;
    el.btnTranslate.disabled = on;
    el.btnTranslate.classList.toggle('loading', on);
    el.btnTranslate.querySelector('.spinner').hidden = !on;
  }

  /** 剪贴板写入，带 execCommand 降级（权限受限或无焦点时仍可复制） */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy') ? resolve() : reject(new Error('copy rejected'));
      } finally {
        ta.remove();
      }
    });
  }

  function stopSpeaking() {
    try { speechSynthesis.cancel(); } catch (_) { /* 忽略 */ }
  }

  /* ---------------- 翻译 ---------------- */

  async function doTranslate() {
    if (state.busy) return;
    var text = el.source.value.trim();
    clearError();

    if (!text) {
      showError('请输入需要翻译的内容');
      el.source.focus();
      return;
    }
    if (text.length > MAX_CHARS) {
      showError('超出 ' + MAX_CHARS + ' 字符上限，请分段翻译');
      return;
    }

    var started = Date.now();
    setLoading(true);
    el.status.textContent = '翻译中…';

    try {
      if (state.src !== 'auto') state.lastSource = state.src;
      var res = await API.translate(text, state.src, state.tgt);
      state.result = res.text;
      el.result.textContent = res.text;
      el.placeholder.hidden = true;

      var srcName = state.src === 'auto'
        ? (res.detected ? '检测到 ' + (I18N.byCode[res.detected] ? I18N.byCode[res.detected].zh : res.detected) : '自动检测')
        : (I18N.byCode[state.src] ? I18N.byCode[state.src].zh : state.src);
      var tgtName = I18N.byCode[state.tgt] ? I18N.byCode[state.tgt].zh : state.tgt;
      var seg = res.via === 'online' && res.chunks > 1 ? ' · ' + res.chunks + ' 段并发' : '';
      el.status.textContent = ((Date.now() - started) / 1000).toFixed(1) + 's · ' +
        (res.via === 'model' ? '模型' : '在线') + seg + ' · ' + srcName + ' → ' + tgtName;
    } catch (err) {
      el.status.textContent = '';
      showError(err.message || '翻译失败，请重试');
      if (err.code === 'NO_KEY') {
        chrome.runtime.openOptionsPage();
      }
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- 交互绑定 ---------------- */

  el.btnTranslate.addEventListener('click', doTranslate);

  el.source.addEventListener('input', function () {
    var len = el.source.value.length;
    el.charCount.textContent = len;
    el.charCount.parentElement.classList.toggle('limit', len >= MAX_CHARS);
  });

  el.source.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      doTranslate();
    }
  });

  el.btnClear.addEventListener('click', function () {
    el.source.value = '';
    el.charCount.textContent = '0';
    el.charCount.parentElement.classList.remove('limit');
    el.result.textContent = '';
    state.result = '';
    el.placeholder.hidden = false;
    el.status.textContent = '';
    stopSpeaking();
    clearError();
    el.source.focus();
  });

  el.btnSwap.addEventListener('click', function () {
    var src = srcSelect.get();
    var tgt = tgtSelect.get();
    el.btnSwap.classList.add('spin');
    setTimeout(function () { el.btnSwap.classList.remove('spin'); }, 260);

    if (src === 'auto') {
      srcSelect.set(tgt);
      tgtSelect.set(state.lastSource);
      chrome.storage.local.set({ srcLang: tgt, tgtLang: state.lastSource });
    } else {
      srcSelect.set(tgt);
      tgtSelect.set(src);
      chrome.storage.local.set({ srcLang: tgt, tgtLang: src });
    }
    state.src = srcSelect.get();
    state.tgt = tgtSelect.get();

    // 已有译文时，交换后把译文移回输入区，方便反向再译
    if (state.result) {
      el.source.value = state.result;
      el.source.dispatchEvent(new Event('input'));
      el.result.textContent = '';
      state.result = '';
      el.placeholder.hidden = false;
    }
  });

  el.btnSettings.addEventListener('click', function () { chrome.runtime.openOptionsPage(); });

  el.btnErrorClose.addEventListener('click', clearError);

  el.quickbar.addEventListener('click', function (e) {
    var btn = e.target.closest('.chip');
    if (!btn) return;
    var action = btn.dataset.action;

    if (action === 'settings') {
      chrome.runtime.openOptionsPage();
      return;
    }

    if (!state.result) {
      showError('还没有译文');
      return;
    }

    if (action === 'copy') {
      copyText(state.result).then(function () {
        flash(btn, '已复制');
      }).catch(function () { showError('复制失败，请手动选择译文'); });
    }

    if (action === 'speak') {
      try {
        // 开关式朗读：正在播放时再点一次即停止
        if (speechSynthesis.speaking || speechSynthesis.pending) {
          stopSpeaking();
          flash(btn, '已停止');
        } else {
          var utter = new SpeechSynthesisUtterance(state.result);
          utter.lang = tgtSelect.get();
          utter.rate = 1;
          speechSynthesis.speak(utter);
          flash(btn, '朗读中');
        }
      } catch (_) {
        showError('当前环境不支持语音朗读');
      }
    }

    if (action === 'save') {
      var stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      var blob = new Blob([state.result], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'dsh-translation-' + stamp + '.txt';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      flash(btn, '已保存');
    }
  });

  function flash(btn, text) {
    var label = btn.querySelector('.chip-label');
    if (!label) return;
    if (!btn.dataset.original) btn.dataset.original = label.textContent;
    label.textContent = text;
    btn.classList.add('done');
    setTimeout(function () {
      label.textContent = btn.dataset.original;
      btn.classList.remove('done');
    }, 1400);
  }

  /* ---------------- 初始化 ---------------- */

  (async function init() {
    var cfg = await API.loadConfig();
    state.src = cfg.srcLang || 'auto';
    state.tgt = cfg.tgtLang || 'zh-CN';
    srcSelect.set(state.src);
    tgtSelect.set(state.tgt);
    if (state.src !== 'auto') state.lastSource = state.src;

    document.getElementById('brandSub').textContent = cfg.engine === 'model'
      ? I18N.list.length + ' 种语言 · 模型翻译 · ' + (cfg.model || 'deepseek-chat')
      : I18N.list.length + ' 种语言 · 在线翻译（免 Key）';

    // 打开面板后清除右键菜单留下的角标
    try { await chrome.action.setBadgeText({ text: '' }); } catch (_) { /* 忽略 */ }

    // 右键菜单带入的文本
    try {
      var pending = await chrome.storage.session.get('pendingText');
      if (pending && pending.pendingText) {
        el.source.value = pending.pendingText.slice(0, MAX_CHARS);
        el.source.dispatchEvent(new Event('input'));
        await chrome.storage.session.remove('pendingText');
        doTranslate();
      }
    } catch (_) { /* 忽略 */ }

    el.source.focus();
  })();
})();
