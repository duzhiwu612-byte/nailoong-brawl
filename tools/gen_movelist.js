/* 生成角色招式表 markdown（写入 tools/movelist.md） */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const sb = { console: console };
sb.window = sb;
vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'characters.js'), 'utf8'), sb);
const NL = sb.NL;

const SPAWN_NAME = {
  note: '魔性音波', coffee: '泼咖啡', laser: '激光', goldbeam: '点金光线', coin: '金币', minion: '小紫兵',
  riceball: '饭团', bubble: '饱嗝泡泡', chopstick: '飞筷', nunchaku: '回旋双截棍',
  laughball: '狂笑气团', laughwave: '笑传染波', keyboard: '键盘', wok: '铁锅',
  rocketfist: '火箭飞拳', rocket: '火箭弹', shell: '蛋壳炮弹', goldwave: '金色光波'
};

const KEYS = [
  ['light1', 'J 轻击'], ['light2', 'J'], ['light3', 'J'], ['light4', 'J'], ['light5', 'J'],
  ['heavy', 'K 远程重击'], ['air', '空中 J'], ['upLight', 'W+J 上挑'], ['upHeavy', 'W+K 跃击'],
  ['guardLight', 'S+J 防反'], ['guardHeavy', 'S+K 投技'], ['skill1', 'L 技能①'], ['skill2', 'U 远程技能'], ['super', 'I 必杀']
];

/* 从 battle.js 解析各弹道伤害（K/U 远程技的数据源） */
const battleSrc = fs.readFileSync(path.join(ROOT, 'js', 'battle.js'), 'utf8');
const PROJ_DMG = {};
{
  const re = /(\w+): \{ r: \d+[^}]*?damage: (\d+)/g;
  let mm;
  while ((mm = re.exec(battleSrc))) PROJ_DMG[mm[1]] = parseInt(mm[2], 10);
}

const lines = [];
lines.push('# 奶龙大乱斗 · 全角色招式表（v0.6 · 奶娃九形态）');
lines.push('');
lines.push('> **K 重击**与 **U 技能**为每个角色量身定做的**远程攻击**；**双击方向 = 虚步**（长距离 + 全程无敌 + 可穿人绕后 + 残影）；');
lines.push('> 场地为 z 轴多层平台大地图；全员血量提升（1350~1650），J 轻击与 K 远程重击伤害已下调，更耐打。');
lines.push('');
for (const id of NL.charOrder) {
  const c = NL.chars[id];
  lines.push('## ' + c.name + ' · ' + c.title);
  lines.push('');
  lines.push(c.desc);
  lines.push('');
  lines.push('| 按键 | 招式 | 伤害 | 特点 |');
  lines.push('|---|---|---|---|');
  for (const kv of KEYS) {
    const k = kv[0], btn = kv[1];
    const m = c.moves[k];
    if (!m) continue;
    const feat = [];
    if (m.nohit && m.spawn) feat.push('远程·' + (SPAWN_NAME[m.spawn.type] || m.spawn.type) + (m.spawn.count > 1 ? '×' + m.spawn.count : ''));
    if (m.rehit) feat.push('多段');
    if (m.lunge) feat.push('突进');
    if (m.big) feat.push('重磅');
    if (m.invuln) feat.push('无敌帧');
    if (m.unblockable) feat.push('不可防御');
    if (m.throwTo) feat.push('背摔');
    if (m.heal) feat.push('回血+' + m.heal);
    if (m.deepStun) feat.push('笑场传染');
    if (m.meteor) feat.push('流星');
    if (m.air) feat.push('空中');
    let dmgText = String(m.damage || '-');
    if (m.spawn && PROJ_DMG[m.spawn.type]) {
      dmgText = String(PROJ_DMG[m.spawn.type]);
      if (m.spawn.count > 1) dmgText = dmgText + '×' + m.spawn.count;
    }
    lines.push('| ' + btn + ' | ' + m.label + ' | ' + dmgText + ' | ' + (feat.join('·') || '—') + ' |');
  }
  lines.push('');
}
fs.writeFileSync(path.join(__dirname, 'movelist.md'), lines.join('\n'), 'utf8');
console.log('movelist.md 已生成：' + lines.length + ' 行');
