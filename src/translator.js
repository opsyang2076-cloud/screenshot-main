/**
 * DSH 翻译 — 翻译核心
 * 两套引擎：
 *   online —— MyMemory 免费接口，不消耗 token，无需 API Key
 *   model  —— 任意 OpenAI Chat Completions 兼容端点（DeepSeek / Hermes / vLLM / Ollama）
 */
(function (root) {
  'use strict';

  var DEFAULTS = {
    engine: 'online',
    onlineEmail: '',
    apiKey: '',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    srcLang: 'auto',
    tgtLang: 'zh-CN',
    timeout: 60000
  };

  var RULES = [
    'You are a professional translator.',
    'Translate the user text into the target language.',
    'Preserve meaning, tone, register, formatting, line breaks, markdown, numbers and proper nouns.',
    'Keep code, URLs, and placeholders unchanged.',
    'Output the translation only — no explanations, no notes, no quotes, no "Translation:" prefix.'
  ].join(' ');

  function loadConfig() {
    return new Promise(function (resolve) {
      chrome.storage.local.get(DEFAULTS, function (s) { resolve(s); });
    });
  }

  function saveConfig(patch) {
    return new Promise(function (resolve) {
      chrome.storage.local.set(patch, resolve);
    });
  }

  function normalizeBase(url) {
    var u = (url || DEFAULTS.baseUrl).trim().replace(/\/+$/, '');
    if (!/\/chat\/completions$/.test(u)) u += '/chat/completions';
    return u;
  }

  /** 去掉模型偶尔加的前缀/引号包装（引号必须成对，避免误删正文首尾字符） */
  function tidy(text) {
    var out = String(text || '').trim();
    out = out.replace(/^(译文|翻译结果|翻译|Translation|Translated text)\s*[:：]\s*/i, '');
    var pairs = [['"', '"'], ['“', '”'], ['‘', '’']];
    for (var i = 0; i < pairs.length; i++) {
      if (out.length > 1 && out.charAt(0) === pairs[i][0] && out.charAt(out.length - 1) === pairs[i][1]) {
        out = out.slice(1, -1).trim();
        break;
      }
    }
    return out;
  }

  function buildMessages(text, srcCode, tgtCode) {
    var I18N = root.DSH_I18N;
    var tgt = I18N.nameOf(tgtCode);
    var src = srcCode === 'auto' ? null : I18N.nameOf(srcCode);
    var head = src
      ? 'Translate from ' + src + ' to ' + tgt + '.'
      : 'Detect the source language automatically and translate it to ' + tgt + '.';
    return [
      { role: 'system', content: RULES + ' ' + head },
      { role: 'user', content: text }
    ];
  }

  function mapError(status, payload) {
    var detail = '';
    if (payload && payload.error && payload.error.message) detail = payload.error.message;
    if (status === 401 || status === 403) return 'API Key 无效或没有权限，请到设置页检查（API key rejected）';
    if (status === 402) return '账户余额不足（insufficient balance）';
    if (status === 404) return '接口地址不存在，请检查 Base URL 是否包含 /v1（endpoint not found）';
    if (status === 429) return '请求过于频繁或超出限额，请稍后重试（rate limited）';
    if (status >= 500) return '服务端错误 ' + status + '，请稍后重试（server error）';
    return '请求失败（HTTP ' + status + '）' + (detail ? '：' + detail : '');
  }

  async function requestModel(cfg, text, srcCode, tgtCode, signal) {
    var res = await fetch(normalizeBase(cfg.baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + cfg.apiKey
      },
      body: JSON.stringify({
        model: cfg.model || DEFAULTS.model,
        messages: buildMessages(text, srcCode, tgtCode),
        temperature: 0.2,
        stream: false
      }),
      signal: signal
    });

    var payload = null;
    try { payload = await res.json(); } catch (_) { /* 非 JSON 响应 */ }

    if (!res.ok) {
      var err = new Error(mapError(res.status, payload));
      err.code = 'HTTP_' + res.status;
      throw err;
    }

    var content = payload && payload.choices && payload.choices[0] &&
      payload.choices[0].message && payload.choices[0].message.content;
    if (!content) throw new Error('返回内容为空，请换个模型或稍后重试（empty response）');
    return tidy(content);
  }

  /**
   * 翻译一段文本
   * @returns {Promise<{text: string, via: 'online'|'model', detected: string}>}
   */
  async function translate(text, srcCode, tgtCode) {
    var cfg = await loadConfig();
    var engine = cfg.engine === 'model' ? 'model' : 'online';

    if (engine === 'model' && !cfg.apiKey) {
      var keyErr = new Error('当前使用模型翻译，但尚未配置 API Key。请到设置页填写，或切换回在线翻译（API key not configured）');
      keyErr.code = 'NO_KEY';
      throw keyErr;
    }

    var controller = new AbortController();
    var timeout = cfg.timeout || DEFAULTS.timeout;
    var timer = setTimeout(function () { controller.abort(); }, timeout);

    try {
      if (engine === 'model') {
        var out = await requestModel(cfg, text, srcCode, tgtCode, controller.signal);
        return { text: out, via: 'model', detected: '', chunks: 1 };
      }

      var online = await root.DSH_ONLINE.translate(text, srcCode, tgtCode, controller.signal, cfg.onlineEmail);
      return { text: online.text, via: 'online', detected: online.detected || '', chunks: online.chunks || 0 };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('请求超时，请稍后重试（request timeout）');
      }
      if (err instanceof TypeError) {
        throw new Error(engine === 'model'
          ? '网络无法连接，请检查 Base URL 或代理设置（network error）'
          : '无法连接在线翻译服务，请检查网络（network error）');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  root.DSH_TRANSLATOR = {
    DEFAULTS: DEFAULTS,
    loadConfig: loadConfig,
    saveConfig: saveConfig,
    translate: translate,
    normalizeBase: normalizeBase
  };
})(typeof window !== 'undefined' ? window : globalThis);
