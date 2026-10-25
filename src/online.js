/**
 * DSH 翻译 — 在线引擎（免费，无需 API Key）
 * 后端：MyMemory 公开翻译 API（单次上限 500 字符，自动分段）
 * v1.1.0：分段请求改为并发池（默认 3 路），单段失败自动重试一次，长文明显提速
 */
(function (root) {
  'use strict';

  var ENDPOINT = 'https://api.mymemory.translated.net/get';
  var MAX_CHUNK = 460;   // 官方上限 500 字符，留出安全余量
  var MAX_TOTAL = 5000;
  var CONCURRENCY = 3;   // 并发分段数
  var RETRY_DELAY = 300; // 重试前等待（毫秒）

  /** 按句末标点切分，保证每段不超过 limit */
  function splitText(text, limit) {
    var chunks = [];
    var rest = text;

    while (rest.length > limit) {
      var head = rest.slice(0, limit);
      var cut = -1;

      var sentence = head.match(/[\s\S]*[.。!！?？;；\n]/);
      if (sentence && sentence[0].length > limit * 0.35) {
        cut = sentence[0].length;
      }
      if (cut < 0) {
        var space = head.lastIndexOf(' ');
        var comma = Math.max(head.lastIndexOf('，'), head.lastIndexOf(','), head.lastIndexOf('、'));
        cut = Math.max(space, comma);
      }
      if (cut <= 0) cut = limit;

      chunks.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }

    if (rest.length) chunks.push(rest);
    return chunks;
  }

  /**
   * 并发池：按 limit 个并发执行异步任务工厂，结果按提交顺序返回。
   * 任一任务失败后不再派发新任务，待在途任务结算后抛出首个错误。
   * @param {Array<() => Promise>} factories 异步任务工厂
   * @param {number} limit 最大并发数
   * @returns {Promise<Array>} 与 factories 顺序一致的结果数组
   */
  function runPool(factories, limit) {
    return new Promise(function (resolve, reject) {
      var results = new Array(factories.length);
      var next = 0;
      var active = 0;
      var failed = false;
      var lim = Math.max(1, Math.min(limit || 1, factories.length));

      function settle() {
        if (active === 0) {
          if (failed) reject(results.error);
          else resolve(results);
        }
      }

      function launch() {
        if (failed || next >= factories.length) return settle();
        var i = next++;
        active++;
        Promise.resolve().then(factories[i]).then(function (value) {
          if (!failed) results[i] = value;
        }, function (err) {
          if (!failed) {
            failed = true;
            results.error = err;
          }
        }).then(function () {
          active--;
          launch();
          settle();
        });
      }

      for (var k = 0; k < lim; k++) launch();
    });
  }

  function fail(message, code) {
    var e = new Error(message);
    if (code) e.code = code;
    return e;
  }

  /** MyMemory 用 200 包着错误，需要拆出来 */
  function inspect(payload) {
    var status = String((payload && payload.responseStatus) || '200');
    var details = String((payload && payload.responseDetails) || '');
    var text = String((payload && payload.responseData && payload.responseData.translatedText) || '');

    if (status === '200' && !/INVALID (SOURCE|TARGET) LANGUAGE|QUERY LENGTH LIMIT|PLEASE SELECT TWO DISTINCT|MYMEMORY WARNING/i.test(text)) {
      return { ok: true, text: text };
    }

    var msg = details || text;
    if (/INVALID SOURCE LANGUAGE/i.test(msg)) return { ok: false, msg: '在线引擎不支持该源语言，请改用模型翻译', code: 'LANG' };
    if (/INVALID TARGET LANGUAGE/i.test(msg)) return { ok: false, msg: '在线引擎不支持该目标语言，请改用模型翻译', code: 'LANG' };
    if (/PLEASE SELECT TWO DISTINCT/i.test(msg)) return { ok: false, msg: '源语言与目标语言相同', code: 'SAME' };
    if (/QUERY LENGTH LIMIT/i.test(msg)) return { ok: false, msg: '单段文本超过 500 字符，请缩短后重试', code: 'LENGTH' };
    if (/MYMEMORY WARNING/i.test(msg)) return { ok: false, msg: '今日免费额度已用完，可在设置里填写联系邮箱提升额度，或改用模型翻译', code: 'QUOTA' };
    return { ok: false, msg: '在线翻译失败：' + (msg || 'HTTP ' + status).slice(0, 140), code: 'ONLINE' };
  }

  async function requestChunk(text, from, to, email, signal) {
    var url = ENDPOINT + '?q=' + encodeURIComponent(text) +
      '&langpair=' + encodeURIComponent(from + '|' + to);
    if (email) url += '&de=' + encodeURIComponent(email);

    var res = await fetch(url, { method: 'GET', signal: signal });
    if (!res.ok) throw fail('在线翻译服务返回 HTTP ' + res.status + '，请稍后重试', 'ONLINE');

    var payload;
    try {
      payload = await res.json();
    } catch (_) {
      throw fail('在线翻译返回格式异常', 'ONLINE');
    }

    var result = inspect(payload);
    if (!result.ok) throw fail(result.msg, result.code);

    var detected = payload && payload.responseData && payload.responseData.detectedLanguage;
    return { text: result.text, detected: detected || '' };
  }

  /**
   * 单段请求 + 失败重试一次。
   * 语言/额度/长度这类确定性错误不重试；网络抖动、HTTP 5xx 等瞬时错误才重试。
   */
  async function chunkWithRetry(text, from, to, email, signal) {
    var attempt = 0;
    while (true) {
      try {
        return await requestChunk(text, from, to, email, signal);
      } catch (err) {
        attempt++;
        var aborted = (signal && signal.aborted) || err.name === 'AbortError';
        var deterministic = err.code && err.code !== 'ONLINE';
        if (attempt >= 2 || aborted || deterministic) throw err;
        await new Promise(function (resolve) { setTimeout(resolve, RETRY_DELAY); });
      }
    }
  }

  /**
   * @param {string} text 原文
   * @param {string} srcCode 源语言，'auto' 表示自动检测
   * @param {string} tgtCode 目标语言
   * @param {AbortSignal} signal
   * @param {string} email 可选，MyMemory 的联系邮箱（提升免费额度）
   * @returns {Promise<{text: string, detected: string, chunks: number}>}
   */
  async function translate(text, srcCode, tgtCode, signal, email) {
    if (!text) return { text: '', detected: '', chunks: 0 };
    if (text.length > MAX_TOTAL) {
      throw fail('在线翻译单次上限 ' + MAX_TOTAL + ' 字符，请分段翻译', 'LENGTH');
    }

    var from = !srcCode || srcCode === 'auto' ? 'Autodetect' : srcCode;
    if (from === tgtCode) return { text: text, detected: tgtCode, chunks: 1 };

    var chunks = splitText(text, MAX_CHUNK);
    var results = await runPool(chunks.map(function (chunk) {
      return function () {
        if (!chunk.trim()) return Promise.resolve({ text: chunk, detected: '' });
        return chunkWithRetry(chunk, from, tgtCode, email, signal);
      };
    }), CONCURRENCY);

    var out = [];
    var detected = '';
    for (var i = 0; i < results.length; i++) {
      if (results[i].detected) detected = results[i].detected;
      out.push(results[i].text);
    }

    return { text: out.join(''), detected: detected, chunks: chunks.length };
  }

  root.DSH_ONLINE = {
    MAX_CHUNK: MAX_CHUNK,
    MAX_TOTAL: MAX_TOTAL,
    CONCURRENCY: CONCURRENCY,
    splitText: splitText,
    runPool: runPool,
    translate: translate
  };
})(typeof window !== 'undefined' ? window : globalThis);
