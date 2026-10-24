// splitText 单元测试
const fs = require('fs');
const code = fs.readFileSync('src/online.js', 'utf8');
const g = {};
new Function('globalThis', code)(g);

const split = g.DSH_ONLINE.splitText;
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

console.log('\n结果:', pass, 'passed,', fail, 'failed');
process.exit(fail ? 1 : 0);
