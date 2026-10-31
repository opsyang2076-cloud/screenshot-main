// splitText / runPool 单元测试 —— 运行：node tests/split.test.js
const fs = require('fs');
const path = require('path');
const code = fs.readFileSync(path.join(__dirname, '..', 'src', 'online.js'), 'utf8');
const g = {};
new Function('globalThis', code)(g);

const split = g.DSH_ONLINE.splitText;
const pool = g.DSH_ONLINE.runPool;
const MAX = g.DSH_ONLINE.MAX_CHUNK;

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name, extra || ''); }
}

// 1. 长英文
const en = 'The quick brown fox jumps over the lazy dog. '.repeat(40);
const c1 = split(en, MAX);
check('每段不超限(英文)', c1.every(s => s.length <= MAX), JSON.stringify(c1.map(s => s.length)));
check('无损还原(英文)', c1.join('') === en);

// 2. 中文（无空格，靠句号切分）
const zh = '这是一个用于测试分段逻辑的中文句子，长度适中。'.repeat(40);
const c2 = split(zh, MAX);
check('每段不超限(中文)', c2.every(s => s.length <= MAX), JSON.stringify(c2.map(s => s.length)));
check('无损还原(中文)', c2.join('') === zh);

// 3. 无任何标点的超长串（硬切）
const raw = 'x'.repeat(1200);
const c3 = split(raw, MAX);
check('硬切不超限', c3.every(s => s.length <= MAX), JSON.stringify(c3.map(s => s.length)));
check('硬切无损', c3.join('') === raw);

// 4. 短文本不切
const c4 = split('hello world', MAX);
check('短文本单段', c4.length === 1 && c4[0] === 'hello world');

// 5. 含换行
const multi = ('line one\nline two\n').repeat(50);
const c5 = split(multi, MAX);
check('含换行不超限', c5.every(s => s.length <= MAX));
check('含换行无损', c5.join('') === multi);

// 6-8. 并发池：顺序保持、并发上限、错误传播
(async function () {
  let concurrent = 0, peak = 0;
  const tasks = Array.from({ length: 9 }, (_, i) => async () => {
    concurrent++; peak = Math.max(peak, concurrent);
    await new Promise(r => setTimeout(r, 20));
    concurrent--;
    return i * 2;
  });

  const res = await pool(tasks, 3);
  check('runPool 顺序保持', res.join(',') === '0,2,4,6,8,10,12,14,16', JSON.stringify(res));
  check('runPool 并发上限(3)', peak <= 3, 'peak=' + peak);

  try {
    await pool([async () => 1, async () => { throw new Error('boom'); }, async () => 3], 3);
    check('runPool 错误传播', false, '未抛出错误');
  } catch (e) {
    check('runPool 错误传播', e.message === 'boom', e.message);
  }

  const empty = await pool([], 3);
  check('runPool 空任务表', Array.isArray(empty) && empty.length === 0);

  console.log('\n结果:', pass, 'passed,', fail, 'failed');
  process.exit(fail ? 1 : 0);
})().catch(function (e) {
  console.error('测试执行异常:', e);
  process.exit(1);
});
