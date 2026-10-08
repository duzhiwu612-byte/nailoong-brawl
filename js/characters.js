/* 奶龙大乱斗 - 角色数据 v3（奶娃九形态：慈爱/暗黑/愤怒/战斗/奶龙/空虚/温柔/神龙/忧郁）
   形态设定与造型取自 B站视频《奶娃的各种形态》(BV1MqHs66E1a) */
var NL = window.NL = window.NL || {};
(function () {
  'use strict';

  /* 招式构造器 */
  function mv(name, label, anim, st, ac, rc, hb, dmg, kbx, kvy, opt) {
    var o = {
      name: name, label: label, anim: anim,
      startup: st, active: ac, recovery: rc,
      hitbox: hb, damage: dmg,
      hitstun: 15, blockstun: 8,
      kbx: kbx, kvy: kvy
    };
    if (opt) {
      for (var k in opt) {
        if (k === 'hitstun' || k === 'blockstun') continue;
        o[k] = opt[k];
      }
      if (opt.hitstun) o.hitstun = opt.hitstun;
      if (opt.blockstun) o.blockstun = opt.blockstun;
    }
    return o;
  }

  /* 连段自动串接 */
  function chain(list) {
    for (var i = 0; i < list.length - 1; i++) {
      if (!list[i].next) list[i].next = list[i + 1].name;
    }
    var out = {};
    for (var j = 0; j < list.length; j++) out[list[j].name] = list[j];
    return out;
  }

  var chars = NL.chars = {};

  /* ============================================================
     1. 慈爱模式 —— 治愈·爱心流（绿）
     ============================================================ */
  chars.loving = {
    id: 'loving', name: '慈爱模式', title: '摸头天使',
    winQuote: '来，摸摸头～下次要加油哦',
    desc: '绿油油的慈爱形态：见谁都先摸头再说话。打着打着，连对手都不好意思还手了。',
    playable: true,
    pal: {
      body: '#68CB6E', bodyDark: '#4EA855', belly: '#F2E8C4', outline: '#2F7D33',
      blush: '#FFB8C4', eye: '#1E331E', mouth: '#6B4426', horn: '#8CCB7A'
    },
    headScale: 1.14, bodyScale: 0.86,
    stats: { maxHp: 1500, walk: 330, back: 290, jump: 870, jump2: 800, dash: 620, weight: 0.9 },
    moves: (function () {
      var m = chain([
        mv('light1', '爱心掌', 'jabF', 5, 4, 7, { x: 28, y: -80, w: 62, h: 48 }, 24, 120, 0),
        mv('light2', '抱抱撞', 'bellyPush', 6, 5, 9, { x: 24, y: -82, w: 72, h: 58 }, 27, 150, 0, { lunge: 90 }),
        mv('light3', '转圈圈', 'spinKick', 6, 6, 11, { x: 22, y: -78, w: 72, h: 60 }, 30, 170, 0, { lunge: 130 }),
        mv('light4', '贴贴大抱', 'bigSwing', 9, 5, 15, { x: 24, y: -92, w: 86, h: 66 }, 38, 300, -260, { hitstun: 22 })
      ]);
      m.heavy = mv('heavy', '爱心飞弹', 'castF', 11, 4, 20, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { nohit: true, spawn: { at: 11, type: 'heart', count: 1 } });
      m.air = mv('air', '空中抱抱', 'airDrop', 5, 6, 10, { x: 18, y: -72, w: 72, h: 62 }, 37, 230, 0, { air: true, hitstun: 18 });
      m.upLight = mv('upLight', '举高高', 'uppercut', 7, 5, 16, { x: 20, y: -112, w: 66, h: 88 }, 58, 130, -420);
      m.upHeavy = mv('upHeavy', '扑倒抱', 'pounceSlam', 9, 6, 18, { x: 16, y: -102, w: 84, h: 76 }, 75, 340, -340, { lunge: 280 });
      m.guardLight = mv('guardLight', '温柔反击', 'parryCounter', 4, 4, 18, { x: 24, y: -92, w: 72, h: 60 }, 85, 330, -250, { invuln: [1, 12] });
      m.guardHeavy = mv('guardHeavy', '抱抱背摔', 'throwGrab', 8, 6, 20, { x: 8, y: -100, w: 78, h: 104 }, 100, 0, -410, { unblockable: true, throwTo: true });
      m.skill1 = mv('skill1', '爱心冲刺', 'jetDash', 8, 12, 16, { x: 20, y: -88, w: 68, h: 68 }, 65, 360, -150, { cost: 25, lunge: 400, big: true, vxDecay: 0.96 });
      m.skill2 = mv('skill2', '治愈之心', 'eatSnack', 14, 6, 20, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { cost: 25, nohit: true, heal: 55, healAt: 8, spawn: { at: 14, type: 'heart', count: 2, spread: 40 } });
      m.super = mv('super', '大爱无疆', 'rollSpin', 18, 30, 26, { x: 6, y: -88, w: 78, h: 78 }, 52, 220, -80, { cost: 100, lunge: 300, rehit: 6, big: true, vxDecay: 0.985, superMove: true, hitstun: 16, heal: 60, healAt: 12 });
      return m;
    })(),
    decorFront: function (ctx, a, f, t) {
      var U = NL.util;
      // 头顶漂浮的小爱心
      var bob = Math.sin(t * 0.09) * 5;
      var hx = a.head.x + a.head.rx * 0.15, hy = a.head.y - a.head.ry - 22 + bob;
      ctx.fillStyle = '#F2ECC8';
      ctx.strokeStyle = '#5E9E60';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hx, hy + 9);
      ctx.bezierCurveTo(hx - 12, hy - 2, hx - 4, hy - 12, hx, hy - 4);
      ctx.bezierCurveTo(hx + 4, hy - 12, hx + 12, hy - 2, hx, hy + 9);
      ctx.fill(); ctx.stroke();
      // 脸颊小爱心
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(a.eyeB.x, a.eyeB.y + 14);
      ctx.bezierCurveTo(a.eyeB.x - 5, a.eyeB.y + 9, a.eyeB.x - 2, a.eyeB.y + 4, a.eyeB.x, a.eyeB.y + 7);
      ctx.bezierCurveTo(a.eyeB.x + 2, a.eyeB.y + 4, a.eyeB.x + 5, a.eyeB.y + 9, a.eyeB.x, a.eyeB.y + 14);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  /* ============================================================
     2. 暗黑模式 —— 影袭·压迫流（黑红）
     ============================================================ */
  chars.dark = {
    id: 'dark', name: '暗黑模式', title: '暗夜零号',
    winQuote: '黑暗，才是一切的主宰…',
    desc: '暗黑化的奶娃：眼睛失去高光、浑身冒着黑气。它不说话，只是把影子伸向对手。',
    playable: true,
    pal: {
      body: '#18181E', bodyDark: '#0E0E12', belly: '#14141A', outline: '#0B0B0E',
      blush: '#202026', eye: '#E8E8E8', mouth: '#4A3A36', horn: '#202026'
    },
    headScale: 1.15, bodyScale: 0.87,
    stats: { maxHp: 1450, walk: 335, back: 300, jump: 880, jump2: 810, dash: 650, weight: 0.92 },
    moves: (function () {
      var m = chain([
        mv('light1', '黑掌', 'jabF', 4, 4, 7, { x: 28, y: -78, w: 62, h: 48 }, 25, 110, 0),
        mv('light2', '影手', 'jabB', 4, 4, 7, { x: 26, y: -80, w: 64, h: 50 }, 27, 130, 0),
        mv('light3', '暗影刺', 'quickJabs', 5, 4, 9, { x: 26, y: -80, w: 70, h: 52 }, 30, 150, 0),
        mv('light4', '黑雾扫', 'bigSwing', 9, 5, 16, { x: 24, y: -92, w: 86, h: 66 }, 40, 320, -280, { hitstun: 22 })
      ]);
      m.heavy = mv('heavy', '暗影弹', 'castF', 11, 4, 20, { x: 0, y: -84, w: 1, h: 1 }, 0, 0, 0, { nohit: true, spawn: { at: 11, type: 'darkorb', count: 1 } });
      m.air = mv('air', '暗袭俯冲', 'diveSlam', 5, 6, 12, { x: 16, y: -80, w: 76, h: 70 }, 40, 270, -40, { air: true, hitstun: 18 });
      m.upLight = mv('upLight', '上勾黑拳', 'uppercut', 7, 5, 15, { x: 20, y: -118, w: 66, h: 90 }, 60, 130, -430);
      m.upHeavy = mv('upHeavy', '暗影突袭', 'pounceSlam', 9, 6, 17, { x: 16, y: -102, w: 84, h: 76 }, 78, 350, -360, { lunge: 320 });
      m.guardLight = mv('guardLight', '暗影反噬', 'parryCounter', 4, 4, 18, { x: 24, y: -94, w: 72, h: 62 }, 88, 340, -260, { invuln: [1, 13] });
      m.guardHeavy = mv('guardHeavy', '黑影背摔', 'throwGrab', 8, 6, 20, { x: 8, y: -102, w: 78, h: 104 }, 105, 0, -420, { unblockable: true, throwTo: true });
      m.skill1 = mv('skill1', '影步突进', 'jetDash', 8, 12, 16, { x: 20, y: -90, w: 68, h: 70 }, 68, 370, -160, { cost: 25, lunge: 420, big: true, vxDecay: 0.955 });
      m.skill2 = mv('skill2', '暗影漩涡', 'castF', 12, 4, 22, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { cost: 25, nohit: true, spawn: { at: 12, type: 'darkorb', count: 2, spread: 70 } });
      m.super = mv('super', '暗黑降临', 'rollSpin', 18, 30, 26, { x: 6, y: -88, w: 78, h: 78 }, 54, 220, -80, { cost: 100, lunge: 320, rehit: 6, big: true, vxDecay: 0.985, superMove: true, hitstun: 16 });
      return m;
    })(),
    decorBack: function (ctx, a, f, t) {
      // 黑色气场
      var pulse = 0.25 + Math.sin(t * 0.08) * 0.08;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#14141A';
      NL.util.ellipse(ctx, a.body.x, a.body.y - 6, a.body.rx * 1.34, a.body.ry * 1.34);
      ctx.fill();
      ctx.globalAlpha = pulse * 1.6;
      ctx.fillStyle = '#2A1420';
      NL.util.ellipse(ctx, a.head.x, a.head.y - 4, a.head.rx * 1.3, a.head.ry * 1.3);
      ctx.fill();
      ctx.restore();
    },
    decorFront: function (ctx, a, f, t) {
      // 苍白瞳芒（原画是白瞳反光，不是红光）
      ctx.save();
      ctx.globalAlpha = 0.32 + Math.sin(t * 0.12) * 0.14;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(a.eyeF.x + 2, a.eyeF.y - 2, a.eyeF.rx * 0.3, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(a.eyeB.x + 2, a.eyeB.y - 2, a.eyeB.rx * 0.28, 0, 6.3); ctx.fill();
      ctx.restore();
    }
  };

  /* ============================================================
     3. 愤怒模式 —— 暴走·爆伤流（红橙）
     ============================================================ */
  chars.rage = {
    id: 'rage', name: '愤怒模式', title: '暴走火种',
    winQuote: '哼！惹我生气的就这下场！',
    desc: '愤怒形态：头顶三丈火，见谁都吼。拳头比脑子快，威力全场第一，就是收不住。',
    playable: true,
    pal: {
      body: '#E23A2A', bodyDark: '#B02416', belly: '#F5BA90', outline: '#B01414',
      blush: '#FF9A80', eye: '#3A1410', mouth: '#8A3A28', horn: '#E89078'
    },
    headScale: 1.16, bodyScale: 0.9,
    stats: { maxHp: 1550, walk: 340, back: 300, jump: 860, jump2: 790, dash: 630, weight: 1.05 },
    moves: (function () {
      var m = chain([
        mv('light1', '怒拳', 'jabF', 5, 5, 9, { x: 28, y: -80, w: 66, h: 50 }, 33, 150, 0),
        mv('light2', '火掌', 'jabB', 5, 5, 9, { x: 26, y: -82, w: 68, h: 52 }, 35, 170, 0),
        mv('light3', '火焰头槌', 'bellyPush', 7, 5, 11, { x: 22, y: -86, w: 74, h: 60 }, 39, 200, 0, { lunge: 130 }),
        mv('light4', '爆炎扫', 'bigSwing', 9, 6, 17, { x: 24, y: -94, w: 88, h: 68 }, 48, 340, -300, { hitstun: 22 })
      ]);
      m.heavy = mv('heavy', '怒火弹', 'castF', 12, 4, 21, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { nohit: true, spawn: { at: 12, type: 'flame', count: 1 } });
      m.air = mv('air', '流星怒砸', 'diveSlam', 5, 6, 12, { x: 16, y: -82, w: 78, h: 72 }, 43, 280, -20, { air: true, hitstun: 18 });
      m.upLight = mv('upLight', '怒焰升龙', 'uppercut', 8, 5, 17, { x: 20, y: -120, w: 68, h: 92 }, 66, 140, -450);
      m.upHeavy = mv('upHeavy', '暴怒扑击', 'pounceSlam', 10, 6, 19, { x: 16, y: -104, w: 86, h: 80 }, 88, 370, -380, { lunge: 340 });
      m.guardLight = mv('guardLight', '怒火反击', 'parryCounter', 4, 5, 19, { x: 24, y: -96, w: 74, h: 64 }, 100, 360, -280, { invuln: [1, 12] });
      m.guardHeavy = mv('guardHeavy', '怒火背摔', 'throwGrab', 8, 6, 21, { x: 8, y: -104, w: 80, h: 108 }, 118, 0, -430, { unblockable: true, throwTo: true });
      m.skill1 = mv('skill1', '暴走冲锋', 'jetDash', 8, 13, 18, { x: 20, y: -92, w: 70, h: 74 }, 80, 400, -180, { cost: 25, lunge: 460, big: true, vxDecay: 0.95 });
      m.skill2 = mv('skill2', '火焰连弹', 'castF', 12, 4, 22, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { cost: 25, nohit: true, spawn: { at: 12, type: 'flame', count: 2, spread: 60 } });
      m.super = mv('super', '怒火燎原', 'moneyThrow', 18, 10, 28, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { cost: 100, nohit: true, big: true, superMove: true, spawn: { at: 18, type: 'flame', count: 6, spread: 150 } });
      return m;
    })(),
    decorFront: function (ctx, a, f, t) {
      // 头顶火焰（跳动）
      var fl = Math.sin(t * 0.22) * 3, fl2 = Math.sin(t * 0.31 + 1) * 2.4;
      var hx = a.head.x - a.head.rx * 0.1, hy = a.head.y - a.head.ry - 4;
      ctx.fillStyle = '#F46038';
      ctx.beginPath();
      ctx.moveTo(hx - 12, hy + 2);
      ctx.quadraticCurveTo(hx - 16, hy - 14 + fl, hx - 2, hy - 24 + fl);
      ctx.quadraticCurveTo(hx + 4, hy - 12, hx + 12, hy + 2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FF9A62';
      ctx.beginPath();
      ctx.moveTo(hx - 6, hy + 2);
      ctx.quadraticCurveTo(hx - 7, hy - 8 + fl2, hx + 1, hy - 15 + fl2);
      ctx.quadraticCurveTo(hx + 6, hy - 6, hx + 6, hy + 2);
      ctx.closePath(); ctx.fill();
      // 怒气青筋
      ctx.strokeStyle = '#E85540';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(a.head.x + a.head.rx * 0.55, a.head.y - a.head.ry * 0.45);
      ctx.lineTo(a.head.x + a.head.rx * 0.68, a.head.y - a.head.ry * 0.6);
      ctx.stroke();
    }
  };

  /* ============================================================
     4. 战斗模式 —— 军武·连击流（深灰橙）
     ============================================================ */
  chars.war = {
    id: 'war', name: '战斗模式', title: '百战老兵',
    winQuote: '战斗，是刻在骨子里的本能！',
    desc: '战斗形态：披着小肩甲、绑着护额，开口就是"冲"。别看个头小，一身都是战术素养。',
    playable: true,
    pal: {
      body: '#1E1E1E', bodyDark: '#161614', belly: '#F0D8B4', outline: '#101008',
      blush: '#7A7A62', eye: '#20201A', mouth: '#6A5A3A', horn: '#8A8A72'
    },
    headScale: 1.13, bodyScale: 0.9,
    stats: { maxHp: 1600, walk: 320, back: 290, jump: 850, jump2: 780, dash: 600, weight: 1.08 },
    moves: (function () {
      var m = chain([
        mv('light1', '军拳', 'jabF', 5, 4, 8, { x: 28, y: -80, w: 64, h: 50 }, 30, 140, 0),
        mv('light2', '盾击', 'jabB', 5, 4, 8, { x: 26, y: -82, w: 66, h: 52 }, 32, 160, 0),
        mv('light3', '战术顶', 'bellyPush', 7, 5, 10, { x: 22, y: -86, w: 74, h: 60 }, 37, 190, 0, { lunge: 120 }),
        mv('light4', '军刀斩', 'stickChop', 7, 4, 12, { x: 24, y: -92, w: 78, h: 62 }, 41, 230, 0, { lunge: 130 }),
        mv('light5', '战术收势', 'twinPunch', 8, 5, 15, { x: 24, y: -94, w: 84, h: 64 }, 42, 300, -270, { hitstun: 22 })
      ]);
      m.heavy = mv('heavy', '飞刀突袭', 'castF', 11, 4, 20, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { nohit: true, spawn: { at: 11, type: 'blade', count: 1 } });
      m.air = mv('air', '空降作战', 'airDrop', 5, 6, 11, { x: 18, y: -80, w: 76, h: 66 }, 41, 260, 0, { air: true, hitstun: 18 });
      m.upLight = mv('upLight', '军刀上挑', 'uppercut', 7, 5, 16, { x: 20, y: -118, w: 66, h: 90 }, 62, 130, -430);
      m.upHeavy = mv('upHeavy', '冲锋扑倒', 'pounceSlam', 9, 6, 18, { x: 16, y: -104, w: 86, h: 78 }, 84, 360, -370, { lunge: 330 });
      m.guardLight = mv('guardLight', '军事反击', 'parryCounter', 4, 4, 18, { x: 24, y: -96, w: 74, h: 64 }, 92, 340, -265, { invuln: [1, 12] });
      m.guardHeavy = mv('guardHeavy', '缴械背摔', 'throwGrab', 8, 6, 20, { x: 8, y: -104, w: 80, h: 106 }, 108, 0, -420, { unblockable: true, throwTo: true });
      m.skill1 = mv('skill1', '装甲冲锋', 'jetDash', 9, 13, 17, { x: 20, y: -90, w: 70, h: 72 }, 74, 390, -160, { cost: 25, lunge: 430, big: true, vxDecay: 0.955 });
      m.skill2 = mv('skill2', '三连飞刀', 'castF', 12, 4, 22, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { cost: 25, nohit: true, spawn: { at: 12, type: 'blade', count: 3, spread: 40 } });
      m.super = mv('super', '全军突击', 'rollSpin', 18, 30, 26, { x: 6, y: -90, w: 78, h: 78 }, 55, 220, -80, { cost: 100, lunge: 330, rehit: 6, big: true, vxDecay: 0.985, superMove: true, hitstun: 16 });
      return m;
    })(),
    decorFront: function (ctx, a, f, t) {
      var U = NL.util;
      // 胸前装甲块（橙色）
      ctx.fillStyle = '#EFD8B4';
      ctx.strokeStyle = '#6E6656';
      ctx.lineWidth = 3;
      U.roundRectPath(ctx, a.body.x - 26, a.body.y - 30, 52, 40, 10);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#B89868';
      ctx.beginPath(); ctx.arc(a.body.x, a.body.y - 10, 6, 0, 6.3); ctx.fill();
      ctx.strokeStyle = '#6E6656';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(a.body.x - 14, a.body.y - 10); ctx.lineTo(a.body.x + 14, a.body.y - 10); ctx.stroke();
      // 护额带
      ctx.strokeStyle = '#3C3C32';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(a.head.x, a.head.y - 2, a.head.rx * 0.92, Math.PI * 1.06, Math.PI * 1.94);
      ctx.stroke();
      ctx.fillStyle = '#B89868';
      ctx.beginPath(); ctx.arc(a.head.x, a.head.y - a.head.ry * 0.92, 4, 0, 6.3); ctx.fill();
    }
  };

  /* ============================================================
     5. 奶龙模式 —— 奶瓶本体（金黄，经典形态）
     ============================================================ */
  chars.nailoong = {
    id: 'nailoong', name: '奶龙模式', title: '奶龙本龙',
    winQuote: '奶龙我，宇宙最强！',
    desc: '切换为奶龙形态！熟悉的金黄、熟悉的大肚子——奶瓶才是本体，谁抢跟谁急。',
    playable: true,
    pal: {
      body: '#F2C838', bodyDark: '#DBA81E', belly: '#FBF08E', outline: '#D8A012',
      blush: '#FFAEC0', eye: '#2A2012', mouth: '#7A4A2B', horn: '#F8E8A8'
    },
    headScale: 1.14, bodyScale: 0.86,
    stats: { maxHp: 1400, walk: 345, back: 300, jump: 890, jump2: 815, dash: 660, weight: 0.85 },
    moves: (function () {
      var m = chain([
        mv('light1', '奶拳·一', 'jabF', 4, 4, 7, { x: 24, y: -80, w: 58, h: 46 }, 26, 130, 0),
        mv('light2', '奶拳·二', 'jabB', 4, 4, 7, { x: 24, y: -76, w: 60, h: 48 }, 28, 150, 0),
        mv('light3', '奶瓶敲', 'stickChop', 5, 4, 8, { x: 22, y: -86, w: 64, h: 52 }, 33, 190, 0, { lunge: 100 }),
        mv('light4', '宝宝打滚', 'rollSpin', 7, 5, 14, { x: 18, y: -72, w: 72, h: 60 }, 40, 300, -240, { hitstun: 20 })
      ]);
      m.heavy = mv('heavy', '奶瓶飞弹', 'castF', 12, 4, 20, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { nohit: true, spawn: { at: 12, type: 'milkbottle', count: 1 } });
      m.air = mv('air', '宝宝屁股蹲', 'airDrop', 5, 6, 11, { x: 18, y: -70, w: 72, h: 62 }, 39, 240, 0, { air: true, hitstun: 18 });
      m.upLight = mv('upLight', '小手乱挥', 'uppercut', 6, 5, 15, { x: 20, y: -108, w: 66, h: 84 }, 60, 130, -440);
      m.upHeavy = mv('upHeavy', '火箭奶嘴冲', 'pounceSlam', 9, 6, 17, { x: 16, y: -96, w: 82, h: 72 }, 80, 350, -370, { lunge: 300 });
      m.guardLight = mv('guardLight', '委屈大哭反击', 'parryCounter', 4, 4, 18, { x: 24, y: -88, w: 72, h: 58 }, 88, 340, -260, { invuln: [1, 14] });
      m.guardHeavy = mv('guardHeavy', '过肩小摔', 'throwGrab', 8, 6, 20, { x: 8, y: -92, w: 78, h: 100 }, 105, 0, -430, { unblockable: true, throwTo: true });
      m.skill1 = mv('skill1', '学步车冲锋', 'jetDash', 8, 12, 16, { x: 20, y: -82, w: 68, h: 66 }, 70, 360, -150, { cost: 25, lunge: 390, big: true, vxDecay: 0.96 });
      m.skill2 = mv('skill2', '咿呀回旋奶嘴', 'castF', 10, 4, 22, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { cost: 25, nohit: true, spawn: { at: 10, type: 'pacifier', count: 1 } });
      m.super = mv('super', '天降奶瓶雨', 'moneyThrow', 18, 10, 26, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { cost: 100, nohit: true, big: true, superMove: true, spawn: { at: 22, type: 'milkbottle', count: 6, spread: 150 } });
      return m;
    })()
  };

  /* ============================================================
     6. 空虚模式 —— 虚无·空间流（白灰）
     ============================================================ */
  chars.void = {
    id: 'void', name: '空虚模式', title: '空心状态',
    winQuote: '赢了…可是好空虚…',
    desc: '空虚形态：眼神空洞、说话带回声。谁也猜不透它在想什么——连它自己也不知道。',
    playable: true,
    pal: {
      body: '#DCD9D2', bodyDark: '#BDBAB0', belly: '#F0EEE7', outline: '#A8A59A',
      blush: '#C9C6BC', eye: '#4A4842', mouth: '#8A8578', horn: '#D5D2C8'
    },
    headScale: 1.16, bodyScale: 0.85,
    stats: { maxHp: 1450, walk: 310, back: 285, jump: 840, jump2: 770, dash: 590, weight: 0.8 },
    moves: (function () {
      var m = chain([
        mv('light1', '空掌', 'jabF', 5, 4, 8, { x: 28, y: -78, w: 62, h: 48 }, 22, 100, 0),
        mv('light2', '虚无拍', 'jabB', 5, 4, 8, { x: 26, y: -80, w: 64, h: 50 }, 24, 120, 0),
        mv('light3', '空洞撞', 'bellyPush', 7, 5, 11, { x: 22, y: -84, w: 72, h: 58 }, 28, 160, 0, { lunge: 100 }),
        mv('light4', '归墟扫', 'bigSwing', 10, 5, 17, { x: 24, y: -94, w: 88, h: 68 }, 38, 310, -270, { hitstun: 22 })
      ]);
      m.heavy = mv('heavy', '虚空弹', 'castF', 12, 5, 22, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { nohit: true, spawn: { at: 12, type: 'voidorb', count: 1 } });
      m.air = mv('air', '虚浮下坠', 'airDrop', 6, 6, 12, { x: 18, y: -78, w: 74, h: 64 }, 36, 220, 0, { air: true, hitstun: 18 });
      m.upLight = mv('upLight', '空之上升', 'uppercut', 7, 5, 16, { x: 20, y: -116, w: 66, h: 90 }, 56, 120, -420);
      m.upHeavy = mv('upHeavy', '虚无坠', 'pounceSlam', 10, 6, 19, { x: 16, y: -102, w: 84, h: 76 }, 74, 340, -340, { lunge: 290 });
      m.guardLight = mv('guardLight', '空洞反击', 'parryCounter', 4, 4, 18, { x: 24, y: -94, w: 72, h: 62 }, 84, 330, -250, { invuln: [1, 13] });
      m.guardHeavy = mv('guardHeavy', '虚无吞噬', 'throwGrab', 8, 6, 21, { x: 8, y: -102, w: 78, h: 104 }, 102, 0, -410, { unblockable: true, throwTo: true });
      m.skill1 = mv('skill1', '空间跳动', 'jetDash', 8, 12, 16, { x: 20, y: -88, w: 68, h: 68 }, 62, 350, -140, { cost: 25, lunge: 400, big: true, vxDecay: 0.96 });
      m.skill2 = mv('skill2', '空洞凝视', 'castF', 14, 5, 24, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { cost: 25, nohit: true, spawn: { at: 14, type: 'voidorb', count: 2, spread: 46 } });
      m.super = mv('super', '万物皆空', 'rollSpin', 18, 30, 26, { x: 6, y: -88, w: 78, h: 78 }, 50, 220, -80, { cost: 100, lunge: 300, rehit: 6, big: true, vxDecay: 0.985, superMove: true, hitstun: 16 });
      return m;
    })(),
    decorFront: function (ctx, a, f, t) {
      var U = NL.util;
      // 头顶漂浮的"空洞"圆环
      var bob = Math.sin(t * 0.07) * 6;
      var rx = a.head.rx * 0.42, ry = rx * 0.34;
      ctx.strokeStyle = '#B4B1A8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(a.head.x + a.head.rx * 0.1, a.head.y - a.head.ry - 26 + bob, rx, ry, 0.3, 0, 6.3);
      ctx.stroke();
      ctx.fillStyle = '#4E4C46';
      ctx.beginPath();
      ctx.arc(a.head.x + a.head.rx * 0.1, a.head.y - a.head.ry - 26 + bob, rx * 0.5, 0, 6.3);
      ctx.fill();
    }
  };

  /* ============================================================
     7. 温柔模式 —— 花瓣·轻柔流（粉）
     ============================================================ */
  chars.tender = {
    id: 'tender', name: '温柔模式', title: '春风小可爱',
    winQuote: '辛苦啦～回去喝杯奶茶吧',
    desc: '温柔形态：声音软软的，像花瓣一样轻。但别误会——温柔的人打人也可以很疼。',
    playable: true,
    pal: {
      body: '#E8A0AA', bodyDark: '#C87E88', belly: '#F8E2DC', outline: '#A85E68',
      blush: '#F0AEB4', eye: '#40202C', mouth: '#9A6270', horn: '#F0C4C4'
    },
    headScale: 1.15, bodyScale: 0.85,
    stats: { maxHp: 1425, walk: 335, back: 300, jump: 880, jump2: 810, dash: 645, weight: 0.85 },
    moves: (function () {
      var m = chain([
        mv('light1', '柔光掌', 'jabF', 5, 4, 7, { x: 28, y: -78, w: 62, h: 48 }, 23, 110, 0),
        mv('light2', '轻声拍', 'jabB', 5, 4, 7, { x: 26, y: -80, w: 64, h: 50 }, 25, 130, 0),
        mv('light3', '拥抱撞', 'bellyPush', 6, 5, 10, { x: 22, y: -84, w: 72, h: 58 }, 28, 150, 0, { lunge: 100 }),
        mv('light4', '花瓣舞', 'spinKick', 8, 6, 14, { x: 22, y: -82, w: 76, h: 62 }, 34, 280, -240, { hitstun: 20, lunge: 160 }),
        mv('light5', '花瓣收尾', 'twinPunch', 8, 5, 15, { x: 24, y: -92, w: 82, h: 62 }, 38, 290, -255, { hitstun: 22 })
      ]);
      m.heavy = mv('heavy', '花瓣飞吻', 'castF', 11, 4, 20, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { nohit: true, spawn: { at: 11, type: 'petal', count: 1 } });
      m.air = mv('air', '花瓣飘落', 'airDrop', 6, 6, 11, { x: 18, y: -78, w: 74, h: 64 }, 36, 230, 0, { air: true, hitstun: 18 });
      m.upLight = mv('upLight', '柔风上拂', 'uppercut', 7, 5, 16, { x: 20, y: -114, w: 66, h: 88 }, 57, 125, -425);
      m.upHeavy = mv('upHeavy', '温柔扑击', 'pounceSlam', 9, 6, 18, { x: 16, y: -102, w: 84, h: 76 }, 75, 340, -345, { lunge: 300 });
      m.guardLight = mv('guardLight', '温柔反击', 'parryCounter', 4, 4, 18, { x: 24, y: -92, w: 72, h: 60 }, 86, 330, -250, { invuln: [1, 12] });
      m.guardHeavy = mv('guardHeavy', '温柔背摔', 'throwGrab', 8, 6, 20, { x: 8, y: -100, w: 78, h: 104 }, 100, 0, -410, { unblockable: true, throwTo: true });
      m.skill1 = mv('skill1', '花舞冲锋', 'jetDash', 8, 12, 16, { x: 20, y: -88, w: 68, h: 68 }, 64, 360, -150, { cost: 25, lunge: 410, big: true, vxDecay: 0.96 });
      m.skill2 = mv('skill2', '花瓣三连', 'castF', 12, 4, 22, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { cost: 25, nohit: true, spawn: { at: 12, type: 'petal', count: 3, spread: 50 } });
      m.super = mv('super', '樱吹雪', 'moneyThrow', 18, 10, 28, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { cost: 100, nohit: true, big: true, superMove: true, spawn: { at: 18, type: 'petal', count: 7, spread: 170 } });
      return m;
    })(),
    decorFront: function (ctx, a, f, t) {
      // 头顶小花
      var sway = Math.sin(t * 0.06) * 2;
      var hx = a.head.x + a.head.rx * 0.1 + sway, hy = a.head.y - a.head.ry - 8;
      ctx.strokeStyle = '#88A868';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(hx, hy + 10); ctx.lineTo(hx + 2, hy + 2); ctx.stroke();
      for (var i = 0; i < 5; i++) {
        var ang = i / 5 * 6.283 + t * 0.01;
        ctx.fillStyle = '#F5C2CC';
        ctx.strokeStyle = '#C87E88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(hx + 2 + Math.cos(ang) * 6, hy - 2 + Math.sin(ang) * 6, 5, 3.6, ang, 0, 6.3);
        ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = '#FFE28A';
      ctx.beginPath(); ctx.arc(hx + 2, hy - 2, 3.6, 0, 6.3); ctx.fill();
    }
  };

  /* ============================================================
     8. 神龙模式 —— 龙威·重击流（棕金）
     ============================================================ */
  chars.divine = {
    id: 'divine', name: '神龙模式', title: '真龙显圣',
    winQuote: '神龙摆尾，凡尘无敌！',
    desc: '神龙形态：头生龙角、颌下龙须，浑身金鳞。据说它一抬爪，云都要让路。',
    playable: true,
    pal: {
      body: '#D0B08C', bodyDark: '#A0784A', belly: '#F0E2BE', outline: '#6A4A22',
      blush: '#E5B694', eye: '#3A2A10', mouth: '#7A5424', horn: '#B07050'
    },
    headScale: 1.16, bodyScale: 0.95,
    stats: { maxHp: 1650, walk: 300, back: 275, jump: 835, jump2: 765, dash: 575, weight: 1.15 },
    moves: (function () {
      var m = chain([
        mv('light1', '龙爪拍', 'jabF', 6, 4, 10, { x: 28, y: -82, w: 66, h: 52 }, 34, 150, 0),
        mv('light2', '龙尾扫', 'jabB', 6, 4, 10, { x: 26, y: -84, w: 70, h: 54 }, 36, 170, 0),
        mv('light3', '龙鳞顶', 'bellyPush', 8, 5, 12, { x: 22, y: -88, w: 76, h: 62 }, 41, 200, 0, { lunge: 120 }),
        mv('light4', '神龙摆尾', 'bigSwing', 10, 6, 18, { x: 24, y: -96, w: 92, h: 70 }, 50, 350, -310, { hitstun: 22 })
      ]);
      m.heavy = mv('heavy', '龙息金波', 'castF', 13, 5, 22, { x: 0, y: -88, w: 1, h: 1 }, 0, 0, 0, { nohit: true, spawn: { at: 13, type: 'goldwave', count: 1 } });
      m.air = mv('air', '神龙坠', 'airDrop', 6, 6, 12, { x: 18, y: -82, w: 78, h: 68 }, 44, 280, 0, { air: true, hitstun: 18 });
      m.upLight = mv('upLight', '龙角上挑', 'uppercut', 8, 5, 17, { x: 20, y: -122, w: 68, h: 94 }, 68, 140, -450);
      m.upHeavy = mv('upHeavy', '神龙扑', 'pounceSlam', 10, 6, 19, { x: 16, y: -106, w: 88, h: 80 }, 90, 370, -380, { lunge: 340 });
      m.guardLight = mv('guardLight', '龙威反击', 'parryCounter', 5, 5, 19, { x: 24, y: -98, w: 76, h: 66 }, 105, 360, -280, { invuln: [1, 13] });
      m.guardHeavy = mv('guardHeavy', '神龙摆尾摔', 'throwGrab', 9, 6, 21, { x: 8, y: -106, w: 82, h: 108 }, 122, 0, -430, { unblockable: true, throwTo: true });
      m.skill1 = mv('skill1', '腾云冲锋', 'jetDash', 9, 13, 17, { x: 20, y: -94, w: 72, h: 76 }, 82, 400, -180, { cost: 25, lunge: 450, big: true, vxDecay: 0.95 });
      m.skill2 = mv('skill2', '双龙戏珠', 'castF', 12, 5, 22, { x: 0, y: -88, w: 1, h: 1 }, 0, 0, 0, { cost: 25, nohit: true, spawn: { at: 12, type: 'goldwave', count: 2, spread: 60 } });
      m.super = mv('super', '天降金龙', 'rollSpin', 20, 32, 28, { x: 6, y: -92, w: 82, h: 82 }, 60, 230, -90, { cost: 100, lunge: 340, rehit: 6, big: true, vxDecay: 0.985, superMove: true, hitstun: 16 });
      return m;
    })(),
    decorFront: function (ctx, a, f, t) {
      var U = NL.util;
      // 龙角（分叉）
      ctx.strokeStyle = '#B07050';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      // 左角
      ctx.beginPath(); ctx.moveTo(a.head.x - a.head.rx * 0.42, a.head.y - a.head.ry * 0.72);
      ctx.lineTo(a.head.x - a.head.rx * 0.66, a.head.y - a.head.ry * 1.35); ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(a.head.x - a.head.rx * 0.6, a.head.y - a.head.ry * 1.16);
      ctx.lineTo(a.head.x - a.head.rx * 0.92, a.head.y - a.head.ry * 1.28); ctx.stroke();
      // 右角
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(a.head.x + a.head.rx * 0.3, a.head.y - a.head.ry * 0.78);
      ctx.lineTo(a.head.x + a.head.rx * 0.5, a.head.y - a.head.ry * 1.4); ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(a.head.x + a.head.rx * 0.44, a.head.y - a.head.ry * 1.2);
      ctx.lineTo(a.head.x + a.head.rx * 0.76, a.head.y - a.head.ry * 1.32); ctx.stroke();
      // 龙须（飘动）
      var sw = Math.sin(t * 0.1) * 4;
      ctx.strokeStyle = '#E8D8A8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(a.mouth.x - 4, a.mouth.y + 6);
      ctx.quadraticCurveTo(a.mouth.x + 22, a.mouth.y + 16 + sw, a.mouth.x + 44, a.mouth.y + 8 + sw * 1.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(a.mouth.x - 8, a.mouth.y + 12);
      ctx.quadraticCurveTo(a.mouth.x + 14, a.mouth.y + 26 - sw, a.mouth.x + 36, a.mouth.y + 22 - sw * 1.4);
      ctx.stroke();
      // 金鳞
      ctx.strokeStyle = 'rgba(212,175,55,0.85)';
      ctx.lineWidth = 2.5;
      for (var i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(a.body.x + 16 - i * 8, a.body.y + 14 + i * 9, 9, Math.PI * 0.2, Math.PI * 0.95);
        ctx.stroke();
      }
    }
  };

  /* ============================================================
     9. 忧郁模式 —— 雨泪·远程流（蓝）
     ============================================================ */
  chars.sad = {
    id: 'sad', name: '忧郁模式', title: '雨天心情',
    winQuote: '赢了比赛，输给了心情…',
    desc: '忧郁形态：头顶自带小乌云，走到哪里哪里下雨。它的眼泪，掉下来就是武器。',
    playable: true,
    pal: {
      body: '#3EA6F0', bodyDark: '#2A6EC4', belly: '#D6EAFF', outline: '#1260B4',
      blush: '#7FB0E8', eye: '#14243E', mouth: '#2E5A8A', horn: '#58CCF0'
    },
    headScale: 1.15, bodyScale: 0.85,
    stats: { maxHp: 1400, walk: 330, back: 295, jump: 870, jump2: 800, dash: 630, weight: 0.85 },
    moves: (function () {
      var m = chain([
        mv('light1', '泪掌', 'jabF', 5, 4, 7, { x: 28, y: -78, w: 62, h: 48 }, 24, 115, 0),
        mv('light2', '低声拍', 'jabB', 5, 4, 7, { x: 26, y: -80, w: 64, h: 50 }, 26, 135, 0),
        mv('light3', '浸湿撞', 'bellyPush', 6, 5, 10, { x: 22, y: -84, w: 72, h: 58 }, 29, 155, 0, { lunge: 100 }),
        mv('light4', '倾泻而下', 'bigSwing', 9, 6, 16, { x: 24, y: -94, w: 88, h: 68 }, 40, 320, -280, { hitstun: 22 })
      ]);
      m.heavy = mv('heavy', '泪滴弹', 'castF', 11, 4, 20, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { nohit: true, spawn: { at: 11, type: 'tear', count: 1 } });
      m.air = mv('air', '落雨坠', 'airDrop', 6, 6, 11, { x: 18, y: -78, w: 74, h: 64 }, 38, 240, 0, { air: true, hitstun: 18 });
      m.upLight = mv('upLight', '泪雨上涌', 'uppercut', 7, 5, 16, { x: 20, y: -116, w: 66, h: 90 }, 58, 128, -425);
      m.upHeavy = mv('upHeavy', '哭泣扑击', 'pounceSlam', 9, 6, 18, { x: 16, y: -102, w: 84, h: 76 }, 76, 345, -350, { lunge: 300 });
      m.guardLight = mv('guardLight', '泣不成声反击', 'parryCounter', 4, 4, 18, { x: 24, y: -94, w: 72, h: 62 }, 87, 335, -255, { invuln: [1, 12] });
      m.guardHeavy = mv('guardHeavy', '忧郁背摔', 'throwGrab', 8, 6, 20, { x: 8, y: -102, w: 78, h: 104 }, 101, 0, -410, { unblockable: true, throwTo: true });
      m.skill1 = mv('skill1', '雨步冲锋', 'jetDash', 8, 12, 16, { x: 20, y: -88, w: 68, h: 68 }, 63, 355, -145, { cost: 25, lunge: 405, big: true, vxDecay: 0.96 });
      m.skill2 = mv('skill2', '泪如雨下', 'castF', 12, 5, 22, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { cost: 25, nohit: true, spawn: { at: 12, type: 'tear', count: 3, spread: 55 } });
      m.super = mv('super', '倾盆大雨', 'moneyThrow', 18, 10, 28, { x: 0, y: -86, w: 1, h: 1 }, 0, 0, 0, { cost: 100, nohit: true, big: true, superMove: true, spawn: { at: 18, type: 'tear', count: 7, spread: 170 } });
      return m;
    })(),
    decorFront: function (ctx, a, f, t) {
      var U = NL.util;
      // 头顶小乌云 + 雨滴
      var bob = Math.sin(t * 0.05) * 3;
      var cx = a.head.x + a.head.rx * 0.05, cy = a.head.y - a.head.ry - 26 + bob;
      ctx.fillStyle = '#4E7CB8';
      ctx.beginPath(); ctx.arc(cx - 16, cy + 2, 11, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy - 5, 15, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 16, cy + 2, 11, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#7096CC';
      ctx.beginPath(); ctx.arc(cx - 4, cy + 3, 9, 0, 6.3); ctx.fill();
      // 雨滴（循环下落）
      var drip = (t * 1.6) % 26;
      ctx.fillStyle = '#7EC8F8';
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy + 12 + drip);
      ctx.quadraticCurveTo(cx - 14, cy + 20 + drip, cx - 10, cy + 21 + drip);
      ctx.quadraticCurveTo(cx - 6, cy + 20 + drip, cx - 10, cy + 12 + drip);
      ctx.fill();
      if (drip > 13) {
        ctx.beginPath();
        ctx.moveTo(cx + 8, cy + 12 + (drip - 13));
        ctx.quadraticCurveTo(cx + 4, cy + 20 + (drip - 13), cx + 8, cy + 21 + (drip - 13));
        ctx.quadraticCurveTo(cx + 12, cy + 20 + (drip - 13), cx + 8, cy + 12 + (drip - 13));
        ctx.fill();
      }
    }
  };

  NL.charOrder = ['loving', 'dark', 'rage', 'war', 'nailoong', 'void', 'tender', 'divine', 'sad'];

  /* ============================================================
     彩蛋：看笑了（像素限定）—— 只保留头（像素大头照），身体用奶龙
     ============================================================ */
  chars.xiaole = {
    id: 'xiaole', name: '看笑了', title: '像素限定',
    winQuote: '看笑了',
    desc: '从一张表情包里挖出来的神秘形态：顶着像素版大头照打满全场。它笑得越开心，下手越突然。',
    playable: true, bonus: true,
    pal: {
      body: '#F2C838', bodyDark: '#DBA81E', belly: '#FBF08E', outline: '#D8A012',
      blush: '#FFAEC0', eye: '#2A2012', mouth: '#7A4A2B', horn: '#F8E8A8'
    },
    headScale: 1.2, bodyScale: 0.9,
    stats: { maxHp: 1500, walk: 335, back: 295, jump: 875, jump2: 805, dash: 645, weight: 0.9 },
    moves: null
  };
  /* 身体是奶龙模式——近战同款，但远程投掷物全部换成手机（v0.9.1） */
  chars.xiaole.moves = (function () {
    var src = chars.nailoong.moves, out = {};
    for (var k in src) {
      var m = out[k] = {};
      for (var f in src[k]) m[f] = src[k][f];
    }
    out.heavy.label = '气得扔手机';
    out.heavy.spawn = { at: 12, type: 'phone', count: 1 };
    out.skill2.label = '回旋手机';
    out.skill2.spawn = { at: 10, type: 'phonespin', count: 1 };
    out.super.label = '天降手机雨';
    out.super.spawn = { at: 22, type: 'phone', count: 6, spread: 150 };
    return out;
  })();
  NL.bonusId = 'xiaole';
})();
