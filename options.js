/* DSH 在线翻译 — 设置页逻辑 */
(function () {
  'use strict';

  var API = window.DSH_TRANSLATOR;
  var I18N = window.DSH_I18N;

  var f = {
    apiKey: document.getElementById('apiKey'),
    baseUrl: document.getElementById('baseUrl'),
    model: document.getElementById('model'),
    timeout: document.getElementById('timeout'),
    tgtLang: document.getElementById('tgtLang'),
    form: document.getElementById('form'),
    msg: document.getElementById('msg'),
    btnTest: document.getElementById('btnTest'),
    btnReset: document.getElementById('btnReset'),
    toggleKey: document.getElementById('toggleKey'),
    langCount: document.getElementById('langCount')
  };

  f.langCount.textContent = I18N.list.length;

  // 填充默认目标语言下拉
  I18N.list.forEach(function (item) {
    var opt = document.createElement('option');
    opt.value = item.code;
    opt.textContent = item.zh + ' / ' + item.en;
    f.tgtLang.appendChild(opt);
  });

  function setMsg(text, type) {
    f.msg.textContent = text;
    f.msg.className = 'msg ' + (type || '');
  }

  function collect() {
    var timeout = parseInt(f.timeout.value, 10);
    if (!timeout || timeout < 5) timeout = 60;
    if (timeout > 300) timeout = 300;
    return {
      apiKey: f.apiKey.value.trim(),
      baseUrl: f.baseUrl.value.trim() || API.DEFAULTS.baseUrl,
      model: f.model.value.trim() || API.DEFAULTS.model,
      timeout: timeout * 1000,
      tgtLang: f.tgtLang.value || 'zh-CN'
    };
  }

  async function save() {
    var cfg = collect();
    await API.saveConfig(cfg);
    f.timeout.value = cfg.timeout / 1000;
    setMsg('已保存', 'ok');
    setTimeout(function () { if (f.msg.textContent === '已保存') setMsg('', ''); }, 2000);
    return cfg;
  }

  f.form.addEventListener('submit', function (e) {
    e.preventDefault();
    save();
  });

  f.toggleKey.addEventListener('click', function () {
    var shown = f.apiKey.type === 'text';
    f.apiKey.type = shown ? 'password' : 'text';
    f.toggleKey.textContent = shown ? '显示' : '隐藏';
  });

  f.btnTest.addEventListener('click', async function () {
    var cfg = await save();
    if (!cfg.apiKey) {
      setMsg('请先填写 API Key', 'err');
      return;
    }
    f.btnTest.disabled = true;
    setMsg('正在请求模型…', 'run');
    try {
      var out = await API.translate('Hello, world.', 'en', 'zh-CN');
      setMsg('连接成功 · ' + out, 'ok');
    } catch (err) {
      setMsg(err.message || '连接失败', 'err');
    } finally {
      f.btnTest.disabled = false;
    }
  });

  f.btnReset.addEventListener('click', async function () {
    if (!confirm('清空 API Key 并恢复默认设置？')) return;
    await chrome.storage.local.clear();
    await API.saveConfig({});
    f.apiKey.value = '';
    f.baseUrl.value = API.DEFAULTS.baseUrl;
    f.model.value = API.DEFAULTS.model;
    f.timeout.value = API.DEFAULTS.timeout / 1000;
    f.tgtLang.value = API.DEFAULTS.tgtLang;
    setMsg('已恢复默认', 'ok');
  });

  (async function init() {
    var cfg = await API.loadConfig();
    f.apiKey.value = cfg.apiKey || '';
    f.baseUrl.value = cfg.baseUrl || API.DEFAULTS.baseUrl;
    f.model.value = cfg.model || API.DEFAULTS.model;
    f.timeout.value = (cfg.timeout || API.DEFAULTS.timeout) / 1000;
    f.tgtLang.value = cfg.tgtLang || API.DEFAULTS.tgtLang;
  })();
})();
