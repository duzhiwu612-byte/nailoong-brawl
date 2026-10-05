/* 奶龙大乱斗 - 冒烟测试 v3：7 角色全招式 + 虚步/平台/相机/远程重击 + AI 长跑 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const failures = [];

function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else {
    fail++; failures.push(name);
    console.log('  FAIL  ' + name + (extra ? '   => ' + extra : ''));
  }
}

function absorber() {
  const target = function () {};
  const A = new Proxy(target, {
    get(t, k) {
      if (k === 'canvas') return { width: 1280, height: 720 };
      if (k === 'measureText') return function () { return { width: 10 }; };
      return A;
    },
    set() { return true; },
    apply() { return A; },
    has() { return true; }
  });
  return A;
}

const listeners = {};
const sandbox = {
  console, Math, JSON, Date, Object, Array, String, Number, Boolean,
  Error, TypeError, RangeError, Function, RegExp, Map, Set, Symbol, Uint8Array,
  isNaN, isFinite, parseInt, parseFloat, Infinity, NaN
};
sandbox.performance = { now: () => Date.now() };
sandbox.requestAnimationFrame = () => 0;
sandbox.cancelAnimationFrame = () => {};
sandbox.setTimeout = () => 0;
sandbox.clearTimeout = () => {};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.self = sandbox;
sandbox.addEventListener = (type, fn) => { (listeners[type] = listeners[type] || []).push(fn); };
sandbox.removeEventListener = () => {};
sandbox.document = {
  readyState: 'complete',
  getElementById: () => null,
  addEventListener: () => {},
  createElement: () => ({ style: {}, getContext: () => absorber() })
};
vm.createContext(sandbox);

console.log('== 脚本加载 ==');
const FILES = ['util', 'audio', 'input', 'effects', 'render', 'characters', 'fighter', 'ai', 'stage', 'battle', 'main'];
let loadErr = null;
for (const f of FILES) {
  try {
    if (f === 'main') vm.runInContext('NL.__HEADLESS__ = true;', sandbox);
    const code = fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8');
    vm.runInContext(code, sandbox, { filename: f + '.js' });
  } catch (e) {
    loadErr = f + '.js: ' + e.message;
    break;
  }
}
check('全部 11 个脚本加载无异常', !loadErr, loadErr || '');
if (loadErr) { console.log('\n加载失败，终止测试。'); process.exit(1); }

const NL = sandbox.NL;
const actx = absorber();

function fire(type, code) {
  (listeners[type] || []).forEach(fn => fn({ code, repeat: false, preventDefault() {} }));
}
function FakeSource(fn) { this.fn = fn; }
FakeSource.prototype.getState = function (f, opp) { return this.fn(f, opp); };
function idleInput(extra) { return Object.assign({}, NL.EMPTY_INPUT, extra || {}); }

const MOVE_KEYS = ['light1', 'light2', 'light3', 'light4', 'light5', 'heavy', 'air',
  'upLight', 'upHeavy', 'guardLight', 'guardHeavy', 'skill1', 'skill2', 'super'];

// ============ 1. 角色 & 招式数据 ============
console.log('\n== 角色 & 招式数据 ==');
check('共 9 种奶娃形态，全部可玩', NL.charOrder.length === 9 && NL.charOrder.every(id => NL.chars[id].playable));
check('九形态齐备（慈爱/暗黑/愤怒/战斗/奶龙/空虚/温柔/神龙/忧郁）',
  NL.charOrder.join(',') === 'loving,dark,rage,war,nailoong,void,tender,divine,sad' && !!NL.chars.sad.moves.super);

let moveCount = 0, dataErr = [];
for (const id of NL.charOrder) {
  const ch = NL.chars[id];
  const mv = ch.moves;
  if (!mv) { dataErr.push(id + ': 无招式表'); continue; }
  for (const k of MOVE_KEYS) {
    if (k.indexOf('light') === 0) continue;
    if (!mv[k]) dataErr.push(id + ' 缺招式 ' + k);
  }
  let guard = 0, cur = 'light1';
  while (cur && guard < 10) { if (!mv[cur]) { dataErr.push(id + ' 连段缺 ' + cur); break; } cur = mv[cur].next; guard++; }
  for (const k in mv) {
    moveCount++;
    if (!NL.draw._anims[mv[k].anim]) dataErr.push(id + '.' + k + ' anim=' + mv[k].anim + ' 未定义');
    if (typeof mv[k].damage !== 'number') dataErr.push(id + '.' + k + ' 缺伤害');
    if (!mv[k].hitbox) dataErr.push(id + '.' + k + ' 缺判定框');
  }
}
check('每只角色招式齐全（' + MOVE_KEYS.length + ' 类）', dataErr.length === 0, dataErr.slice(0, 6).join(' | '));
check('全角色招式总数 > 80（实际 ' + moveCount + '）', moveCount > 80);
check('全员血量 ≥ 1350（更耐打）', NL.charOrder.every(id => NL.chars[id].stats.maxHp >= 1350));
check('J 轻击伤害已下调（每段 ≤ 55）', NL.charOrder.every(id => {
  for (let i = 1; i <= 5; i++) { const m = NL.chars[id].moves['light' + i]; if (m && m.damage > 55) return false; }
  return true;
}));

// ============ 2. 键盘输入 ============
console.log('\n== 键盘输入 ==');
NL.Input.init();
fire('keydown', 'KeyD');
NL.Input.poll();
check('P1 按 D → right=true 且边沿触发', NL.Input.pstate[0].right === true && NL.Input.pstate[0].pRight === true);
fire('keyup', 'KeyD');
NL.Input.poll();
check('松开 D → right=false', NL.Input.pstate[0].right === false);
NL.Input.clearEdges();
fire('keydown', 'KeyA'); NL.Input.poll();
fire('keyup', 'KeyA'); NL.Input.poll();
fire('keydown', 'KeyA'); NL.Input.poll();
check('双击 A → 虚步信号', NL.Input.pstate[0].pDash === -1);
fire('keyup', 'KeyA'); NL.Input.poll();
NL.Input.clearEdges();

// ============ 3. 跳跃物理 ============
console.log('\n== 跳跃物理 ==');
const dummy = new NL.Fighter({ charId: 'nailoong', source: new FakeSource(() => idleInput()), x: 700 });
const jf = new NL.Fighter({ charId: 'nailoong', source: new FakeSource(() => idleInput()), x: 400 });
for (let i = 0; i < 90; i++) jf.update(dummy, NL.EMPTY_INPUT);
jf.update(dummy, idleInput({ pUp: true, up: true }));
check('按跳后离地且向上', !jf.onGround && jf.vy < 0);
let maxRise = 0;
for (let i = 0; i < 140; i++) {
  jf.update(dummy, i < 20 ? idleInput({ up: true }) : NL.EMPTY_INPUT);
  maxRise = Math.min(maxRise, jf.y - NL.GROUND);
}
check('长按跳高度 >180px 且能落地（' + Math.round(-maxRise) + 'px）', maxRise < -180 && jf.onGround);

const jf2 = new NL.Fighter({ charId: 'nailoong', source: new FakeSource(() => idleInput()), x: 400 });
for (let i = 0; i < 90; i++) jf2.update(dummy, NL.EMPTY_INPUT);
jf2.update(dummy, idleInput({ pUp: true }));
let maxRise2 = 0;
for (let i = 0; i < 140; i++) {
  jf2.update(dummy, NL.EMPTY_INPUT);
  maxRise2 = Math.min(maxRise2, jf2.y - NL.GROUND);
}
check('轻点跳 = 短跳（' + Math.round(-maxRise2) + 'px < 170）', maxRise2 > -170);

// ============ 4. 虚步冲刺 / z轴平台 / 相机 ============
console.log('\n== 虚步冲刺 / z轴平台 / 相机 ==');
(function () {
  const sp = new NL.Fighter({ charId: 'nailoong', source: new FakeSource(() => idleInput()), x: 700 });
  const d2 = new NL.Fighter({ charId: 'nailoong', source: new FakeSource(() => idleInput()), x: 400 });
  for (let i = 0; i < 90; i++) sp.update(d2, NL.EMPTY_INPUT);
  const x0 = sp.x;
  sp.update(d2, idleInput({ pDash: 1 }));
  let invulnDuringDash = false, dashFrames = 0;
  for (let i = 0; i < 30; i++) {
    sp.update(d2, NL.EMPTY_INPUT);
    if (sp.state === 'dash') { dashFrames++; if (!sp.canBeHit()) invulnDuringDash = true; }
  }
  const dist = sp.x - x0;
  check('虚步：位移长（' + Math.round(dist) + 'px ≥ 250）', dist >= 250);
  check('虚步：冲刺期间无敌 + 残影帧数（' + dashFrames + ' 帧）', invulnDuringDash && dashFrames >= 12);
  check('虚步：带残影', sp.ghosts !== undefined);
})();
// 虚步穿人：从对手身前闪到身后
(function () {
  const bb = new NL.Battle({ mode: '2p', p1: 'nailoong', p2: 'nailoong' });
  for (let i = 0; i < 120; i++) bb.update();
  bb.p1.x = 500; bb.p2.x = 566;
  bb.p1.startDash(1);
  for (let i = 0; i < 40; i++) bb.update();
  check('虚步穿人：从身前闪到身后（p1.x=' + Math.round(bb.p1.x) + ' > p2.x=' + Math.round(bb.p2.x) + '）',
    bb.p1.x > bb.p2.x + 60);
})();
(function () {
  const pf = new NL.Fighter({ charId: 'nailoong', source: new FakeSource(() => idleInput()), x: 640 });
  const d3 = new NL.Fighter({ charId: 'nailoong', source: new FakeSource(() => idleInput()), x: 400 });
  for (let i = 0; i < 90; i++) pf.update(d3, NL.EMPTY_INPUT);
  pf.y = 200; pf.vy = 0; pf.onGround = false; pf.x = 640;
  for (let i = 0; i < 120 && !pf.onGround; i++) pf.update(d3, NL.EMPTY_INPUT);
  const plat = (NL.PLATFORMS || []).find(p => p.x === 640);
  check('z轴平台：从空中落到中央平台上（y=' + Math.round(pf.y) + '）', pf.onGround && plat && Math.abs(pf.y - plat.y) < 3);
  // 走出平台边缘 → 掉下去
  for (let i = 0; i < 200; i++) pf.update(d3, idleInput({ right: true }));
  check('平台边缘：走出后会掉落回地面', Math.abs(pf.y - NL.GROUND) < 3 || pf.y > 380);
})();
(function () {
  const bb = new NL.Battle({ mode: '2p', p1: 'nailoong', p2: 'nailoong' });
  for (let i = 0; i < 120; i++) bb.update();
  const cx0 = bb.cam.x;
  bb.p1.x = 1500; bb.p2.x = 1620;
  for (let i = 0; i < 90; i++) bb.update();
  check('相机跟随角色（' + Math.round(cx0) + ' → ' + Math.round(bb.cam.x) + '）', bb.cam.x > cx0 + 300);
})();

// ============ 5. 基础战斗 ============
console.log('\n== 基础战斗 ==');
const b = new NL.Battle({ mode: '2p', p1: 'nailoong', p2: 'nailoong' });
for (let i = 0; i < 120; i++) b.update();
b.p1.x = 500; b.p2.x = 570;
let n4 = 0;
b.p1.source = new FakeSource(() => { n4++; return idleInput(n4 === 1 ? { pLight: true } : {}); });
const hpA = b.p2.hp;
for (let i = 0; i < 45; i++) b.update();
check('轻击命中扣血 26', hpA - b.p2.hp === 26, 'dmg=' + (hpA - b.p2.hp));

const b7 = new NL.Battle({ mode: '2p', p1: 'nailoong', p2: 'nailoong' });
for (let i = 0; i < 120; i++) b7.update();
b7.p1.x = 495; b7.p2.x = 560;
let n7 = 0;
b7.p1.source = new FakeSource(() => { n7++; return idleInput({ pLight: (n7 % 7 === 1) }); });
const hp7 = b7.p2.hp;
for (let i = 0; i < 100; i++) b7.update();
check('连打 J 打出 ≥2 段', (hp7 - b7.p2.hp) >= 50, 'dmg=' + (hp7 - b7.p2.hp));

const b2 = new NL.Battle({ mode: '2p', p1: 'nailoong', p2: 'nailoong' });
for (let i = 0; i < 120; i++) b2.update();
b2.p1.x = 500; b2.p2.x = 570;
let n2 = 0;
b2.p1.source = new FakeSource(() => { n2++; return idleInput(n2 === 1 ? { pLight: true } : {}); });
b2.p2.source = new FakeSource(() => idleInput({ down: true }));
const hpb = b2.p2.hp;
for (let i = 0; i < 45; i++) b2.update();
check('防御时仅受削减伤害', (hpb - b2.p2.hp) > 0 && (hpb - b2.p2.hp) <= 20);

const b3 = new NL.Battle({ mode: '2p', p1: 'nailoong', p2: 'nailoong' });
for (let i = 0; i < 120; i++) b3.update();
b3.p2.hp = 20;
b3.p1.x = 500; b3.p2.x = 570;
let n3 = 0;
b3.p1.source = new FakeSource(() => { n3++; return idleInput(n3 === 1 ? { pLight: true } : {}); });
let sawRound2 = false;
for (let i = 0; i < 3000; i++) { b3.update(); if (b3.round === 2) { sawRound2 = true; break; } }
check('KO 后回合推进到第 2 回合', sawRound2 && b3.wins[0] === 1, 'round=' + b3.round);

// ============ 6. 组合键（防反/投技/上挑/跃击） ============
console.log('\n== 组合键 ==');
function comboTest(name, extra, expectMove) {
  const bb = new NL.Battle({ mode: '2p', p1: 'nailoong', p2: 'nailoong' });
  for (let i = 0; i < 120; i++) bb.update();
  let nn = 0;
  bb.p1.source = new FakeSource(() => { nn++; return idleInput(nn === 1 ? extra : (extra.down ? { down: true } : (extra.up ? { up: true } : {}))); });
  bb.update();
  const ok = bb.p1.state === 'attack' && bb.p1.move && bb.p1.move.name === expectMove;
  check(name, ok, bb.p1.move ? bb.p1.move.name : bb.p1.state);
}
comboTest('S+J → 防反(guardLight)', { down: true, pLight: true }, 'guardLight');
comboTest('S+K → 投技(guardHeavy)', { down: true, pHeavy: true }, 'guardHeavy');
comboTest('W+J → 上挑(upLight)', { up: true, pLight: true }, 'upLight');
comboTest('W+K → 跃击(upHeavy)', { up: true, pHeavy: true }, 'upHeavy');

const b8 = new NL.Battle({ mode: '2p', p1: 'nailoong', p2: 'nailoong' });
for (let i = 0; i < 120; i++) b8.update();
let n8 = 0;
b8.p1.source = new FakeSource(() => { n8++; return idleInput(n8 < 6 ? { down: true } : { down: true, pLight: n8 === 6 }); });
for (let i = 0; i < 10; i++) b8.update();
check('按住防御再按 J → 防反', b8.p1.state === 'attack' && b8.p1.move && b8.p1.move.name === 'guardLight',
  b8.p1.state + '/' + (b8.p1.move ? b8.p1.move.name : '-'));

// ============ 7. 角色特色机制 ============
console.log('\n== 角色特色机制 ==');
// 投技：背摔把对手甩到身后
(function () {
  const bb = new NL.Battle({ mode: '2p', p1: 'nailoong', p2: 'nailoong' });
  for (let i = 0; i < 120; i++) bb.update();
  bb.p1.x = 480; bb.p2.x = 565;
  bb.p1.startAttack('guardHeavy');
  for (let i = 0; i < 80; i++) bb.update();
  check('投技·背摔：对手被甩到身后', bb.p2.x < bb.p1.x, 'p1.x=' + Math.round(bb.p1.x) + ' p2.x=' + Math.round(bb.p2.x));
  check('投技造成 105 伤害', 1400 - bb.p2.hp === 105, 'dmg=' + (1400 - bb.p2.hp));
})();
// U 技能：治愈之心（回血 + 爱心投射）
(function () {
  const bb = new NL.Battle({ mode: '2p', p1: 'loving', p2: 'nailoong' });
  for (let i = 0; i < 120; i++) bb.update();
  bb.p1.hp = 500; bb.p1.energy = 50;
  let spawnCount = 0;
  const origSpawn = bb.spawnProjectile.bind(bb);
  bb.spawnProjectile = function (o) { spawnCount++; return origSpawn(o); };
  bb.p1.startAttack('skill2');
  for (let i = 0; i < 60; i++) bb.update();
  check('U·治愈之心：回血 +55', bb.p1.hp === 555, 'hp=' + bb.p1.hp);
  check('U·治愈之心：同时飞出爱心（远程）', spawnCount >= 1, 'spawn=' + spawnCount);
})();
// U 技能弹幕（战斗模式·三连飞刀）
(function () {
  const bb = new NL.Battle({ mode: '2p', p1: 'war', p2: 'nailoong' });
  for (let i = 0; i < 120; i++) bb.update();
  bb.p1.x = 420; bb.p2.x = 640;
  bb.p1.energy = 100;
  bb.p1.startAttack('skill2');
  let maxProj = 0, hp0 = bb.p2.hp;
  for (let i = 0; i < 160; i++) { bb.update(); maxProj = Math.max(maxProj, bb.projectiles.length); }
  check('三连飞刀弹幕生成（≥3 个）', maxProj >= 3, 'max=' + maxProj);
  check('飞刀命中远距离对手', bb.p2.hp < hp0, 'dmg=' + (hp0 - bb.p2.hp));
})();
// 防反无敌帧
(function () {
  const bb = new NL.Battle({ mode: '2p', p1: 'nailoong', p2: 'nailoong' });
  for (let i = 0; i < 120; i++) bb.update();
  bb.p1.x = 480; bb.p2.x = 570;
  bb.p1.startAttack('light4');     // 起手 7 帧
  bb.p2.startAttack('guardLight'); // 起手 4 帧 + 无敌
  for (let i = 0; i < 60; i++) bb.update();
  check('防反无敌帧：防反方不掉血', bb.p2.hp === 1400, 'hp=' + bb.p2.hp);
  check('防反反击命中对方', bb.p1.hp < 1400, 'hp=' + bb.p1.hp);
})();
// 必杀技（愤怒模式·怒火燎原）
(function () {
  const bb = new NL.Battle({ mode: '2p', p1: 'rage', p2: 'loving' });
  for (let i = 0; i < 120; i++) bb.update();
  bb.p1.x = 420; bb.p2.x = 660;
  bb.p1.energy = 100;
  bb.p1.startAttack('super');
  let maxProj = 0, err = null;
  try {
    for (let i = 0; i < 240; i++) { bb.update(); maxProj = Math.max(maxProj, bb.projectiles.length); }
  } catch (e) { err = e.message; }
  check('必杀·怒火燎原：喷出火焰弹幕（≥6 发）', !err && maxProj >= 6, 'max=' + maxProj + ' err=' + (err || ''));
  check('必杀命中对手', !err && bb.p2.hp < bb.p2.maxHp, 'hp=' + bb.p2.hp);
})();

// ============ 8. 远程重击（K）与远程技能（U） ============
console.log('\n== 远程重击（K）/ 远程技能（U） ==');
(function () {
  const bb = new NL.Battle({ mode: '2p', p1: 'nailoong', p2: 'loving' });
  for (let i = 0; i < 120; i++) bb.update();
  bb.p1.x = 300; bb.p2.x = 750;
  const hp0 = bb.p2.hp;
  bb.p1.startAttack('heavy');
  let maxProj = 0;
  for (let i = 0; i < 120; i++) { bb.update(); maxProj = Math.max(maxProj, bb.projectiles.length); }
  check('K 重击 = 远程：生成奶瓶投射物', maxProj >= 1);
  check('远程重击命中远处对手（56 伤害）', hp0 - bb.p2.hp === 56, 'dmg=' + (hp0 - bb.p2.hp));
})();
(function () {
  let bad = [];
  for (const id of NL.charOrder) {
    const m = NL.chars[id].moves;
    if (!(m.heavy && m.heavy.nohit && m.heavy.spawn)) bad.push(id + '.K');
    if (!(m.skill2 && m.skill2.nohit && m.skill2.spawn)) bad.push(id + '.U');
  }
  check('9 种形态 K/U 全部为远程投射', bad.length === 0, bad.join(','));
})();
(function () {
  // 每个角色的远程重击在中距离（380px）都能命中对手
  let bad = [];
  for (const id of NL.charOrder) {
    const bb = new NL.Battle({ mode: '2p', p1: id, p2: 'nailoong' });
    for (let i = 0; i < 120; i++) bb.update();
    bb.p1.x = 300; bb.p2.x = 680;
    const hp0 = bb.p2.hp;
    bb.p1.startAttack('heavy');
    for (let i = 0; i < 150; i++) bb.update();
    if (bb.p2.hp >= hp0) bad.push(id);
  }
  check('9 种形态 K 远程重击 380px 距离均能命中', bad.length === 0, bad.join(','));
})();
(function () {
  // 每个形态的专属弹道都能生成、飞行并绘制
  const pairs = [['loving', 'heart'], ['dark', 'darkorb'], ['rage', 'flame'], ['war', 'blade'],
    ['nailoong', 'milkbottle'], ['nailoong', 'pacifier'], ['void', 'voidorb'], ['tender', 'petal'],
    ['divine', 'goldwave'], ['sad', 'tear']];
  let errs = [];
  for (const [cid, type] of pairs) {
    try {
      const bb = new NL.Battle({ mode: '2p', p1: cid, p2: 'nailoong' });
      for (let i = 0; i < 120; i++) bb.update();
      bb.p1.x = 400; bb.p2.x = 900;
      bb.spawnProjectile({ type: type, x: 450, y: NL.GROUND - 80, dir: 1, vy: 0, owner: bb.p1 });
      for (let i = 0; i < 160; i++) { bb.update(); if (i % 20 === 0) bb.draw(actx); }
    } catch (e) { errs.push(type + ':' + e.message); }
  }
  check('10 种形态专属弹道生成/飞行/绘制无异常', errs.length === 0, errs.join(' | '));
})();

// ============ 9. 全角色 × 全招式 冒烟 ============
console.log('\n== 全角色全招式冒烟 ==');
let smokeErr = [];
let testedMoves = 0;
for (const id of NL.charOrder) {
  const ch = NL.chars[id];
  for (const key in ch.moves) {
    testedMoves++;
    const bb = new NL.Battle({ mode: '2p', p1: id, p2: 'nailoong' });
    for (let i = 0; i < 120; i++) bb.update();
    bb.p1.x = 470; bb.p2.x = 575;
    bb.p1.energy = 100;
    try {
      let spawnCount = 0;
      const origSpawn = bb.spawnProjectile.bind(bb);
      bb.spawnProjectile = function (o) { spawnCount++; return origSpawn(o); };
      bb.p1.startAttack(key);
      for (let i = 0; i < 180; i++) { bb.update(); if (i % 30 === 0) bb.draw(actx); }
      const m = ch.moves[key];
      if (m.spawn && spawnCount < 1) smokeErr.push(id + '.' + key + ' 未生成投射物');
    } catch (e) {
      smokeErr.push(id + '.' + key + ': ' + e.message);
    }
  }
}
check('全角色全招式执行无异常（共 ' + testedMoves + ' 招）', smokeErr.length === 0, smokeErr.slice(0, 5).join(' | '));

// ============ 10. AI 长跑 ============
console.log('\n== AI 长跑 ==');
function fuzz(p1, p2, diff, capTicks) {
  const bb = new NL.Battle({ mode: 'ai', difficulty: diff, p1: p1, p2: p2 });
  let err = null, ticks = 0;
  try {
    for (ticks = 0; ticks < capTicks; ticks++) {
      bb.update();
      if (ticks % 60 === 0) bb.draw(actx);
      if (bb.matchOver) break;
    }
  } catch (e) { err = e.message + ' @' + (e.stack || '').split('\n')[1]; }
  return {
    err: err, ticks: ticks,
    over: bb.matchOver,
    dmgDone: bb.p1.hp < bb.p1.maxHp || bb.p2.hp < bb.p2.maxHp,
    round: bb.round, wins: JSON.stringify(bb.wins)
  };
}
const f1 = fuzz('nailoong', 'war', 2, 60 * 480);
check('AI 对打(奶龙模式 vs 战斗模式)无异常', !f1.err, f1.err || '');
check('AI 对打有战果（掉血/' + f1.round + '回合/' + f1.wins + '）', f1.dmgDone && f1.round >= 2, 'ticks=' + f1.ticks);
const f2 = fuzz('loving', 'dark', 1, 60 * 300);
check('AI 对打(慈爱 vs 暗黑)无异常', !f2.err, f2.err || '');
const f3 = fuzz('divine', 'sad', 2, 60 * 300);
check('AI 对打(神龙 vs 忧郁)无异常', !f3.err, f3.err || '');

// ============ 11. 渲染冒烟 ============
console.log('\n== 渲染冒烟 ==');
let drawErr = null;
try {
  const bb = new NL.Battle({ mode: 'ai', difficulty: 0, p1: 'nailoong', p2: 'rage' });
  for (let i = 0; i < 160; i++) bb.update();
  bb.draw(actx);
  const states = ['idle', 'walk', 'jump', 'block', 'hurt', 'hurtAir', 'downed', 'getup', 'ko', 'win', 'intro', 'dash'];
  for (const s of states) {
    const ff = bb.p1;
    ff.state = s; ff.stateTime = 10;
    NL.draw.fighter(actx, ff, 123);
  }
  for (const id of NL.charOrder) {
    const ch = NL.chars[id];
    for (const key in ch.moves) {
      const ff = bb.p1;
      ff.char = ch;
      ff.state = 'attack';
      ff.move = ch.moves[key];
      ff.moveFrame = 20;
      ff.stateTime = 5;
      NL.draw.fighter(actx, ff, 300);
    }
    NL.draw.fighter(actx, {
      char: ch, x: 200, y: 620, facing: 1,
      state: 'idle', stateTime: 0, vy: -1, onGround: true,
      squash: { x: 1, y: 1 }, flash: 0, seed: 3
    }, 50);
    NL.draw.miniFace(actx, 100, 100, 26, ch, 'happy', 5);
  }
  NL.draw.ghost(actx, bb.p1, { x: 300, y: 620, facing: 1, a: 0.3 });
  NL.camApply(actx, bb.cam);
} catch (e) {
  drawErr = e.message + ' @' + (e.stack || '').split('\n')[1];
}
check('全部状态 + 全角色全招式渲染无异常', !drawErr, drawErr || '');

// ============ 12. 主程序 ============
console.log('\n== 主程序 ==');
check('NL.game / NL.boot 已注册', !!sandbox.NL.game && typeof sandbox.NL.boot === 'function');

console.log('\n========================================');
console.log('  通过 ' + pass + ' 项 / 失败 ' + fail + ' 项');
if (fail > 0) {
  console.log('  失败清单:');
  failures.forEach(f => console.log('   - ' + f));
}
console.log('========================================');
process.exit(fail > 0 ? 1 : 0);
