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
    onlineEmail: document.getElementById('onlineEmail'),
    tgtLang: document.getElementById('tgtLang'),
    form: document.getElementById('form'),
    msg: document.getElementById('msg'),
    btnTest: document.getElementById('btnTest'),
    btnReset: document.getElementById('btnReset'),
    toggleKey: document.getElementById('toggleKey'),
    langCount: document.getElementById('langCount'),
    engineRow: document.querySelector('.engine-row'),
    engineHint: document.getElementById('engineHint'),
    onlineGroup: document.getElementById('onlineGroup'),
    modelGroup: document.getElementById('modelGroup')
  };

  var HINTS = {
    online: '在线翻译走 MyMemory 公开接口，无需任何配置，装好插件即可使用。',
    model: '走你自己配置的模型端点，翻译质量更好，按 token 计费。'
  };

  var state = { engine: 'online' };

  f.langCount.textContent = I18N.list.length;

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

  function applyEngine(engine, persist) {
    state.engine = engine === 'model' ? 'model' : 'online';
    var isModel = state.engine === 'model';

    Array.prototype.forEach.call(f.engineRow.querySelectorAll('.engine-card'), function (card) {
      var on = card.dataset.engine === state.engine;
      card.classList.toggle('is-active', on);
      card.setAttribute('aria-checked', String(on));
    });

    f.modelGroup.hidden = !isModel;
    f.onlineGroup.hidden = isModel;
    f.engineHint.textContent = HINTS[state.engine];

    if (persist) chrome.storage.local.set({ engine: state.engine });
  }

  function collect() {
    var timeout = parseInt(f.timeout.value, 10);
    if (!timeout || timeout < 5) timeout = 60;
    if (timeout > 300) timeout = 300;
    return {
      engine: state.engine,
      onlineEmail: f.onlineEmail.value.trim(),
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

  f.engineRow.addEventListener('click', function (e) {
    var card = e.target.closest('.engine-card');
    if (!card) return;
    applyEngine(card.dataset.engine, true);
    setMsg('', '');
  });

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

    if (cfg.engine === 'model' && !cfg.apiKey) {
      setMsg('请先填写 API Key，或切换到在线翻译', 'err');
      return;
    }

    f.btnTest.disabled = true;
    setMsg(cfg.engine === 'model' ? '正在请求模型…' : '正在请求在线接口…', 'run');
    try {
      var res = await API.translate('Hello, world.', 'en', 'zh-CN');
      setMsg((res.via === 'model' ? '模型连接成功 · ' : '在线接口可用 · ') + res.text, 'ok');
    } catch (err) {
      setMsg(err.message || '连接失败', 'err');
    } finally {
      f.btnTest.disabled = false;
    }
  });

  f.btnReset.addEventListener('click', async function () {
    if (!confirm('清空全部设置并恢复默认（含 API Key）？')) return;
    await chrome.storage.local.clear();
    await API.saveConfig({});
    f.apiKey.value = '';
    f.onlineEmail.value = '';
    f.baseUrl.value = API.DEFAULTS.baseUrl;
    f.model.value = API.DEFAULTS.model;
    f.timeout.value = API.DEFAULTS.timeout / 1000;
    f.tgtLang.value = API.DEFAULTS.tgtLang;
    applyEngine(API.DEFAULTS.engine, false);
    setMsg('已恢复默认', 'ok');
  });

  (async function init() {
    var cfg = await API.loadConfig();
    applyEngine(cfg.engine || API.DEFAULTS.engine, false);
    f.apiKey.value = cfg.apiKey || '';
    f.onlineEmail.value = cfg.onlineEmail || '';
    f.baseUrl.value = cfg.baseUrl || API.DEFAULTS.baseUrl;
    f.model.value = cfg.model || API.DEFAULTS.model;
    f.timeout.value = (cfg.timeout || API.DEFAULTS.timeout) / 1000;
    f.tgtLang.value = cfg.tgtLang || API.DEFAULTS.tgtLang;
  })();
})();
