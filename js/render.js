/* 奶龙大乱斗 - Q版奶龙渲染器 v2（整体式造型：头身一体化 + 统一轮廓 + 层次光影） */
var NL = window.NL = window.NL || {};
(function () {
  'use strict';
  var U = NL.util;

  /* 颜色工具 */
  function shade(hex, k) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, Math.min(255, Math.round(r * k)));
    g = Math.max(0, Math.min(255, Math.round(g * k)));
    b = Math.max(0, Math.min(255, Math.round(b * k)));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  /* ================= 动作表（数据驱动） =================
     每个键支持三种写法：
       数字          —— 固定值
       [a,b]        —— 攻击段从 a 到 b
       {w:[..],s:[..],r:[..]} —— 起手/攻击/收招三段
     特殊字段：legs 腿型预设 · mouth/eyes 全程表情 · mouthS 攻击段表情
              brow 怒眉 · speedLines 冲刺线 · spin 旋转量('full'=整招旋转)
              custom(pose,f,s,t) 自定义钩子
  */
  var LEGS = {
    stand: {},
    brace: { legF: 0.25, legB: -0.25 },
    lunge: { legF: 0.7, legB: -0.6 },
    tuck: { legF: 0.6, legB: -0.5, legLiftF: 4 },
    trail: { legF: -0.45, legB: -0.7 },
    split: { legF: 0.9, legB: -0.8 },
    kick: { legF: 1.5, legB: -0.4 }
  };

  var ANIMS = {
    jabF: {
      armF: { w: [-0.2, -0.9], s: [-0.9, 1.5], r: [1.5, -0.2] },
      armLenF: { s: [1, 1.35], r: [1.35, 1] },
      lean: { w: [0, -0.05], s: [-0.05, 0.12], r: [0.12, 0] },
      mouthS: 'open', brow: true, legs: 'brace'
    },
    jabB: {
      armB: { w: [-0.1, -0.8], s: [-0.8, 1.55], r: [1.55, -0.1] },
      armLenB: { s: [1, 1.4], r: [1.4, 1] },
      lean: { w: [0, -0.04], s: [-0.04, 0.15], r: [0.15, 0] },
      mouthS: 'open', brow: true, legs: 'brace'
    },
    quickJabs: {
      armF: { s: [-0.5, 1.65], r: [1.65, -0.15] },
      armLenF: { s: [1, 1.45], r: [1.45, 1] },
      lean: { s: [0, 0.1], r: [0.1, 0] },
      mouthS: 'open', brow: true, legs: 'brace'
    },
    stickChop: {
      armF: { w: [-0.2, -1.9], s: [-1.9, 1.2], r: [1.2, -0.2] },
      armLenF: { s: [1, 1.35], r: [1.35, 1] },
      lean: { w: [0, -0.1], s: [-0.1, 0.2], r: [0.2, 0] },
      mouthS: 'open', brow: true, legs: 'brace'
    },
    twinPunch: {
      armF: { s: [-0.3, 1.5], r: [1.5, -0.15] },
      armB: { s: [-0.25, 1.4], r: [1.4, -0.1] },
      armLenF: { s: [1, 1.25], r: [1.25, 1] },
      lean: { s: [0, 0.16], r: [0.16, 0] },
      mouthS: 'open', brow: true, legs: 'lunge'
    },
    bellyPush: {
      armF: { s: [-0.2, -1.25], r: [-1.25, -0.2] },
      armB: { s: [-0.1, -1.1], r: [-1.1, -0.1] },
      lean: { w: [0, -0.18], s: [-0.18, 0.22], r: [0.22, 0] },
      sx: { w: [1, 0.94], s: [0.94, 1.14], r: [1.14, 1] },
      bob: { s: [0, -4], r: [-4, 0] },
      mouthS: 'open', brow: true, legs: 'brace'
    },
    bigSwing: {
      armF: { w: [-0.3, -2.4], s: [-2.4, 1.9], r: [1.9, -0.15] },
      armLenF: { s: [1, 1.4], r: [1.4, 1] },
      lean: { w: [0, -0.12], s: [-0.12, 0.2], r: [0.2, 0] },
      mouthS: 'open', brow: true, legs: 'lunge'
    },
    overheadSlam: {
      armF: { w: [-0.2, -2.5], s: [-2.5, -0.8], r: [-0.8, -0.2] },
      armB: { w: [-0.1, -2.35], s: [-2.35, -0.7], r: [-0.7, -0.1] },
      armLenF: { s: [1, 1.2], r: [1.2, 1] },
      bob: { w: [0, 6], s: [6, -11], r: [-11, 0] },
      sy: { w: [1, 0.86], s: [0.86, 1.06], r: [1.06, 1] },
      lean: { w: [0, -0.08], s: [-0.08, 0.27], r: [0.27, 0] },
      mouthS: 'open', brow: true, legs: 'brace'
    },
    uppercut: {
      armF: { w: [-0.2, -0.5], s: [-0.5, 2.9], r: [2.9, -0.2] },
      armLenF: { s: [1, 1.4], r: [1.4, 1] },
      lean: { w: [0, -0.05], s: [-0.05, 0.3], r: [0.3, 0] },
      bob: { s: [0, -10], r: [-10, 0] },
      mouthS: 'open', brow: true, legs: 'lunge'
    },
    spinKick: {
      spin: Math.PI * 2,
      legF: { s: [0, 1.55], r: [1.55, 0] },
      armF: { s: [-0.2, -1.4], r: [-1.4, -0.2] },
      armB: { s: [-0.1, -1.3], r: [-1.3, -0.1] },
      lean: { s: [0, 0.12], r: [0.12, 0] },
      speedLines: true, mouthS: 'open', brow: true
    },
    diveSlam: {
      lean: { s: [0, 0.5], r: [0.5, 0.2] },
      armF: { s: [-0.2, -2.3], r: [-2.3, -0.2] },
      armB: { s: [-0.1, -2.2], r: [-2.2, -0.1] },
      legF: { s: [0, 0.85], r: [0.85, 0.4] },
      legB: { s: [0, -0.75], r: [-0.75, -0.3] },
      speedLines: true, mouthS: 'open', brow: true
    },
    pounceSlam: {
      bob: { w: [0, 6], s: [6, -16], r: [-16, 0] },
      sy: { w: [1, 0.88], s: [0.88, 1.08], r: [1.08, 1] },
      armF: { w: [-0.2, -1.6], s: [-1.6, 1.2], r: [1.2, -0.2] },
      armB: { w: [-0.1, -1.5], s: [-1.5, 1.1], r: [1.1, -0.1] },
      lean: { w: [0, -0.1], s: [-0.1, 0.3], r: [0.3, 0] },
      speedLines: true, mouthS: 'open', brow: true, legs: 'lunge'
    },
    castF: {
      armF: { w: [-0.2, -0.9], s: [-0.9, 1.65], r: [1.65, -0.2] },
      armB: { w: [-0.1, -0.85], s: [-0.85, 1.5], r: [1.5, -0.1] },
      armLenF: { s: [1, 1.15], r: [1.15, 1] },
      lean: { w: [0, -0.08], s: [-0.08, 0.16], r: [0.16, 0] },
      mouthS: 'open', brow: true, legs: 'brace'
    },
    throwGrab: {
      armF: { w: [-0.2, -1.0], s: [-1.0, 1.35], r: [1.35, -0.2] },
      armB: { w: [-0.1, -0.9], s: [-0.9, 1.25], r: [1.25, -0.1] },
      lean: { w: [0, -0.1], s: [-0.1, 0.28], r: [0.28, 0] },
      bob: { s: [0, -6], r: [-6, 0] },
      mouthS: 'open', brow: true, legs: 'lunge'
    },
    throwHeave: {
      armF: { s: [-0.2, 2.7], r: [2.7, -0.2] },
      armB: { s: [-0.1, 2.4], r: [2.4, -0.1] },
      lean: { s: [0, -0.24], r: [-0.24, 0] },
      bob: { s: [0, -8], r: [-8, 0] },
      mouthS: 'open', brow: true, legs: 'lunge'
    },
    parryStance: {
      lean: { w: [0, -0.18], s: [-0.18, -0.1], r: [-0.1, 0] },
      armF: { w: [-0.2, 1.6], s: [1.6, 1.75], r: [1.75, -0.2] },
      armB: { w: [-0.1, 1.3], s: [1.3, 1.45], r: [1.45, -0.1] },
      mouth: 'flat', eyes: 'squint', legs: 'brace'
    },
    parryCounter: {
      armF: { w: [-0.2, 1.65], s: [1.65, 1.9], r: [1.9, -0.2] },
      armB: { w: [-0.1, 1.45], s: [1.45, 1.6], r: [1.6, -0.1] },
      armLenF: { s: [1, 1.3], r: [1.3, 1] },
      lean: { w: [0, -0.2], s: [-0.2, 0.18], r: [0.18, 0] },
      eyes: 'squint', mouthS: 'open', brow: true, legs: 'brace'
    },
    eatSnack: {
      armF: { w: [-0.2, 1.9], s: [1.9, 1.55], r: [1.55, -0.2] },
      armLenF: { s: [1, 0.8], r: [0.8, 1] },
      mouth: 'grin', eyes: 'happy',
      custom: function (pose, f, s, t) {
        if (s.phase === 1) {
          pose.bob = (pose.bob || 0) + Math.sin(t * 0.6) * 2.2;
          pose.sx = 1 + Math.sin(t * 0.6) * 0.02;
        }
      },
      legs: 'stand'
    },
    shout: {
      lean: { w: [0, -0.26], s: [-0.26, -0.12], r: [-0.12, 0] },
      armF: { s: [-0.2, -1.7], r: [-1.7, -0.2] },
      armB: { s: [-0.1, -1.5], r: [-1.5, -0.1] },
      sx: { s: [1, 1.08], r: [1.08, 1] },
      mouth: 'open', eyes: 'closed', brow: true, legs: 'stand'
    },
    laughPose: {
      armF: { s: [-0.2, 0.95], r: [0.95, -0.2] },
      armB: { s: [-0.1, 0.9], r: [0.9, -0.1] },
      lean: { s: [0, -0.12], r: [-0.12, 0] },
      mouth: 'grin', eyes: 'happy',
      custom: function (pose, f, s, t) {
        if (s.phase >= 1) {
          pose.bob = (pose.bob || 0) + Math.sin(t * 0.55) * 1.8;
          pose.sx = 1 + Math.sin(t * 0.55) * 0.025;
        }
      },
      legs: 'brace'
    },
    moneyThrow: {
      armF: { w: [-0.2, -1.9], s: [-1.9, 0.9], r: [0.9, -0.2] },
      armLenF: { s: [1, 1.3], r: [1.3, 1] },
      lean: { s: [0, 0.1], r: [0.1, 0] },
      mouthS: 'open', brow: true, legs: 'lunge'
    },
    laserEyes: {
      lean: { w: [0, -0.14], s: [-0.14, 0.12], r: [0.12, 0] },
      armF: { s: [-0.2, -0.95], r: [-0.95, -0.2] },
      armB: { s: [-0.1, -0.85], r: [-0.85, -0.1] },
      mouthS: 'open', eyes: 'squint', brow: true, legs: 'stand'
    },
    rollSpin: {
      spin: 'full',
      armF: { s: [-0.2, 0.55], r: [0.55, 0.55] },
      armB: { s: [-0.1, 0.45], r: [0.45, 0.45] },
      legF: { s: [0, 0.6], r: [0.6, 0.6] },
      legB: { s: [0, -0.55], r: [-0.55, -0.55] },
      sx: { s: [1, 1.05] },
      sy: { s: [1, 1.05] },
      speedLines: true, mouth: 'grin', eyes: 'star'
    },
    hopBounce: {
      bob: { s: [0, -14], r: [-14, 0] },
      legF: { s: [0, 0.5], r: [0.5, 0] },
      legB: { s: [0, -0.45], r: [-0.45, 0] },
      armF: { s: [-0.2, 2.5], r: [2.5, -0.2] },
      armB: { s: [-0.1, 2.3], r: [2.3, -0.1] },
      mouthS: 'open', brow: true
    },
    jetDash: {
      lean: { s: [0, 0.44], r: [0.44, 0] },
      armF: { s: [-0.2, -1.65], r: [-1.65, -0.2] },
      armB: { s: [-0.1, -1.5], r: [-1.5, -0.1] },
      sx: { s: [1, 1.07], r: [1.07, 1] },
      sy: { s: [1, 0.94], r: [0.94, 1] },
      speedLines: true, mouthS: 'open', legs: 'trail'
    },
    airDrop: {
      lean: { s: [0, 0.34], r: [0.34, 0.1] },
      armF: { s: [-0.2, 2.2], r: [2.2, -0.2] },
      armB: { s: [-0.1, 2.0], r: [2.0, -0.1] },
      legF: { s: [0, 0.6], r: [0.6, 0.2] },
      legB: { s: [0, -0.5], r: [-0.5, -0.2] },
      mouthS: 'open', brow: true
    }
  };

  var DEFAULTS = {
    armF: -0.15, armB: -0.1, armLenF: 1, armLenB: 1,
    lean: 0, bob: 0, sx: 1, sy: 1, legF: 0, legB: 0
  };

  function phaseVal(spec, phase, u, cur) {
    if (typeof spec === 'number') return spec;
    if (Array.isArray(spec)) {
      if (phase === 1) return U.lerp(spec[0], spec[1], U.easeOutQuad(u));
      if (phase === 0) return spec[0];
      return spec[1];
    }
    var seg = (phase === 0) ? spec.w : (phase === 1 ? spec.s : spec.r);
    if (seg === undefined) {
      if (phase === 2) return null;   // 收招无定义 → 由调用方回落到默认值
      return null;
    }
    if (Array.isArray(seg)) return U.lerp(seg[0], seg[1], phase === 1 ? U.easeOutQuad(u) : u);
    return seg;
  }

  function applyAnim(pose, def, s, f, t) {
    if (!def) return;
    if (def.legs && LEGS[def.legs]) {
      var L = LEGS[def.legs];
      for (var lk in L) pose[lk] = L[lk];
    }
    var keys = ['armF', 'armB', 'armLenF', 'armLenB', 'lean', 'bob', 'sx', 'sy', 'legF', 'legB'];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (def[k] === undefined) continue;
      var v = phaseVal(def[k], s.phase, s.u, pose[k]);
      if (v === null) {
        if (s.phase === 2) {
          pose[k] = U.lerp(pose[k], DEFAULTS[k], U.easeOutQuad(s.u));
        }
      } else {
        pose[k] = v;
      }
    }
    if (def.mouth) pose.mouth = def.mouth;
    if (def.eyes) pose.eyes = def.eyes;
    if (def.mouthS && s.phase === 1) pose.mouth = def.mouthS;
    if (def.eyesS && s.phase === 1) pose.eyes = def.eyesS;
    if (def.brow) pose.brow = 'angry';
    if (def.speedLines && s.phase === 1) pose.speedLines = 1;
    if (def.spin !== undefined) {
      if (def.spin === 'full') {
        var m = f.move;
        var total = m ? (m.startup + m.active + m.recovery) : 60;
        pose.spin = ((f.moveFrame + 1) / Math.max(1, total)) * Math.PI * 4;
      } else {
        var prog = s.phase === 1 ? s.u : (s.phase === 2 ? 1 : 0);
        pose.spin = prog * def.spin;
      }
    }
    if (def.custom) def.custom(pose, f, s, t);
  }

  /* ================= 姿势计算 ================= */
  function computePose(f, t) {
    var st = f.state, stt = f.stateTime;
    var seed = f.seed || 0;
    var pose = {
      bob: 0, lean: 0, sx: 1, sy: 1,
      armF: -0.15, armB: -0.1, armLenF: 1, armLenB: 1,
      legF: 0, legB: 0, legLiftF: 0, legLiftB: 0,
      spin: 0, speedLines: 0,
      eyes: 'normal', mouth: 'smile', brow: null
    };

    var blink = ((t + seed * 37) % 230) < 7;
    var laughQuirk = (f.char.id === 'rage') && (st === 'idle' || st === 'walk') &&
      (((t + seed * 53) % 340) < 80);

    if (st === 'idle') {
      pose.bob = Math.sin(t * 0.08) * 2.5;
      pose.sx = 1 + Math.sin(t * 0.08) * 0.015;
      pose.sy = 1 - Math.sin(t * 0.08) * 0.02;
      pose.armF = -0.15 + Math.sin(t * 0.07) * 0.06;
      pose.armB = -0.1 - Math.sin(t * 0.07 + 1) * 0.06;

    } else if (st === 'walk') {
      var ph = t * 0.22;
      pose.bob = -Math.abs(Math.sin(ph)) * 3;
      pose.lean = 0.06;
      pose.legF = Math.sin(ph) * 0.5;
      pose.legB = -Math.sin(ph) * 0.5;
      pose.legLiftF = Math.max(0, Math.sin(ph)) * 6;
      pose.legLiftB = Math.max(0, -Math.sin(ph)) * 6;
      pose.armF = -0.2 - Math.sin(ph) * 0.35;
      pose.armB = -0.15 + Math.sin(ph) * 0.35;

    } else if (st === 'dash') {
      pose.lean = 0.24;
      pose.sx = 1.06; pose.sy = 0.94;
      pose.armF = -1.3; pose.armB = -1.15;
      pose.legF = 0.55; pose.legB = -0.6;
      pose.speedLines = 1;
      pose.mouth = 'flat';

    } else if (st === 'jump') {
      var rising = f.vy < 0;
      pose.bob = -2;
      if (rising) {
        pose.legF = 0.7; pose.legB = -0.5;
        pose.armF = 2.4; pose.armB = 2.15;
      } else {
        pose.legF = 0.4; pose.legB = -0.35;
        pose.armF = 2.7 + Math.sin(t * 0.3) * 0.15;
        pose.armB = 2.5;
        pose.mouth = 'open';
      }

    } else if (st === 'attack' && f.move) {
      var m = f.move;
      var total = m.startup + m.active + m.recovery;
      var p = f.moveFrame / Math.max(1, total);
      var p0 = m.startup / Math.max(1, total);
      var p1 = (m.startup + m.active) / Math.max(1, total);
      var def = ANIMS[m.anim] || ANIMS.jabF;
      var phase, u;
      if (p < p0) { phase = 0; u = p / Math.max(0.0001, p0); }
      else if (p < p1) { phase = 1; u = (p - p0) / Math.max(0.0001, p1 - p0); }
      else { phase = 2; u = (p - p1) / Math.max(0.0001, 1 - p1); }
      applyAnim(pose, def, { phase: phase, u: u }, f, t);

    } else if (st === 'block') {
      pose.sy = 0.88;
      pose.bob = 4;
      pose.armF = 1.15; pose.armB = 1.0;
      pose.armLenF = 0.85;
      pose.eyes = 'squint';
      pose.mouth = 'flat';

    } else if (st === 'hurt') {
      pose.lean = -0.3;
      pose.bob = -2;
      pose.armF = 2.5; pose.armB = 2.3;
      pose.eyes = 'x';
      pose.mouth = 'ouch';
      pose.sy = 0.96;

    } else if (st === 'hurtAir') {
      pose.lean = -0.5;
      pose.armF = 2.6; pose.armB = 2.4;
      pose.legF = 0.6; pose.legB = -0.5;
      pose.eyes = 'x';
      pose.mouth = 'ouch';

    } else if (st === 'downed' || (st === 'ko' && f.onGround)) {
      pose.lean = -1.38;
      pose.armF = 1.9; pose.armB = 1.6;
      pose.legF = 0.35; pose.legB = -0.3;
      pose.eyes = (st === 'ko') ? 'x' : 'swirl';
      pose.mouth = (st === 'ko') ? 'flat' : 'ouch';
      if (st === 'downed') {
        var wig = Math.sin(t * 0.4) * 0.03 * Math.max(0, 1 - stt / 30);
        pose.lean += wig;
      }

    } else if (st === 'getup') {
      var uu = U.clamp(stt / 20, 0, 1);
      pose.lean = U.lerp(-1.38, 0, U.easeOutQuad(uu));
      pose.eyes = 'squint';
      pose.mouth = 'flat';

    } else if (st === 'ko') {
      pose.lean = -0.5;
      pose.armF = 2.6; pose.armB = 2.4;
      pose.eyes = 'x';
      pose.mouth = 'flat';

    } else if (st === 'win') {
      pose.bob = -Math.abs(Math.sin(t * 0.09)) * 16;
      pose.armF = 2.7 + Math.sin(t * 0.18) * 0.25;
      pose.armB = 2.3 + Math.cos(t * 0.18) * 0.25;
      pose.legF = Math.sin(t * 0.09) * 0.3;
      pose.legB = -Math.sin(t * 0.09) * 0.3;
      pose.eyes = 'happy';
      pose.mouth = 'grin';
      pose.legLiftF = Math.max(0, Math.sin(t * 0.09)) * 5;
      pose.legLiftB = Math.max(0, -Math.sin(t * 0.09)) * 5;

    } else if (st === 'intro') {
      pose.bob = Math.sin(t * 0.1) * 2;
      pose.armF = 2.7 + Math.sin(t * 0.2) * 0.3;
      pose.armB = -0.1;
      pose.eyes = 'happy';
      pose.mouth = 'smile';
    }

    // 被"笑场传染"
    if (f.laughStun && (st === 'hurt' || st === 'hurtAir' || st === 'downed')) {
      pose.eyes = 'happy';
      pose.mouth = 'grin';
      pose.bob = (pose.bob || 0) + Math.sin(t * 0.5) * 1.6;
    }

    if (laughQuirk) {
      pose.eyes = 'happy';
      pose.mouth = 'grin';
      pose.bob = Math.sin(t * 0.5) * 1.6;
      pose.sx = 1 + Math.sin(t * 0.5) * 0.03;
      pose.armF = 0.9 + Math.sin(t * 0.5) * 0.1;
      pose.armB = 0.85;
    }
    if (blink && pose.eyes === 'normal') pose.eyes = 'closed';
    return pose;
  }

  /* ================= 锚点（v0.5 官方原版比例：小头 / 大肚 / 底重蛋形） ================= */
  function buildAnchors(hs, bs) {
    var bellyRX = 66 * bs, bellyRY = 54 * bs;
    var headRX = 37 * hs, headRY = 36 * hs;
    var belly = { x: 0, y: -54 * bs, rx: bellyRX, ry: bellyRY };
    var bellyTop = belly.y - bellyRY;
    var head = { x: 4 * hs, y: bellyTop - headRY * 0.5, rx: headRX, ry: headRY };
    var neck = {
      x: 2 * hs,
      y: (bellyTop + (head.y + head.ry)) / 2,
      rx: Math.min(bellyRX, headRX) * 0.94,
      ry: 26 * bs
    };
    var hr = headRX / 48, hrY = headRY / 46;   // 五官按头径等比缩放
    return {
      body: belly,
      head: head,
      neck: neck,
      eyeF: { x: head.x + 18 * hr, y: head.y - 8 * hrY, rx: 10 * hr, ry: 12 * hrY },
      eyeB: { x: head.x - 6 * hr, y: head.y - 4 * hrY, rx: 8.5 * hr, ry: 10.5 * hrY },
      mouth: { x: head.x + 20 * hr, y: head.y + 20 * hrY },
      blushF: { x: head.x + 34 * hr, y: head.y + 10 * hrY, rx: 9 * hr, ry: 5.5 * hrY },
      blushB: { x: head.x - 13 * hr, y: head.y + 12 * hrY, rx: 7 * hr, ry: 4.5 * hrY },
      horns: [
        { x: head.x + 6 * hr, y: head.y - head.ry * 0.88, r: 10 * hr },
        { x: head.x - 22 * hr, y: head.y - head.ry * 0.8, r: 8.5 * hr }
      ]
    };
  }

  /* ================= 脸部 ================= */
  function drawEye(ctx, e, style, pal) {
    var x = e.x, y = e.y, rx = e.rx, ry = e.ry;
    ctx.save();
    ctx.lineCap = 'round';
    if (style === 'closed') {
      ctx.strokeStyle = pal.eye;
      ctx.lineWidth = Math.max(2.5, rx * 0.32);
      ctx.beginPath();
      ctx.moveTo(x - rx * 0.85, y);
      ctx.lineTo(x + rx * 0.85, y);
      ctx.stroke();
    } else if (style === 'happy') {
      ctx.strokeStyle = pal.eye;
      ctx.lineWidth = Math.max(3, rx * 0.36);
      ctx.beginPath();
      ctx.moveTo(x - rx * 0.85, y + ry * 0.2);
      ctx.quadraticCurveTo(x, y - ry * 0.95, x + rx * 0.85, y + ry * 0.2);
      ctx.stroke();
    } else if (style === 'squint') {
      ctx.strokeStyle = pal.eye;
      ctx.lineWidth = Math.max(3, rx * 0.4);
      ctx.beginPath();
      ctx.moveTo(x - rx * 0.9, y - ry * 0.1);
      ctx.quadraticCurveTo(x, y + ry * 0.25, x + rx * 0.9, y - ry * 0.1);
      ctx.stroke();
    } else if (style === 'x') {
      ctx.strokeStyle = pal.eye;
      ctx.lineWidth = Math.max(2.5, rx * 0.38);
      ctx.beginPath();
      ctx.moveTo(x - rx * 0.75, y - ry * 0.75);
      ctx.lineTo(x + rx * 0.75, y + ry * 0.75);
      ctx.moveTo(x + rx * 0.75, y - ry * 0.75);
      ctx.lineTo(x - rx * 0.75, y + ry * 0.75);
      ctx.stroke();
    } else if (style === 'swirl') {
      ctx.strokeStyle = pal.eye;
      ctx.lineWidth = Math.max(2, rx * 0.3);
      ctx.beginPath();
      ctx.arc(x, y, rx * 0.7, 0.4, 4.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + rx * 0.1, y, rx * 0.3, 1.5, 5.5);
      ctx.stroke();
    } else if (style === 'star') {
      ctx.fillStyle = pal.eye;
      var rr = rx * 1.05;
      ctx.beginPath();
      ctx.moveTo(x, y - rr);
      ctx.quadraticCurveTo(x + rr * 0.2, y - rr * 0.2, x + rr, y);
      ctx.quadraticCurveTo(x + rr * 0.2, y + rr * 0.2, x, y + rr);
      ctx.quadraticCurveTo(x - rr * 0.2, y + rr * 0.2, x - rr, y);
      ctx.quadraticCurveTo(x - rr * 0.2, y - rr * 0.2, x, y - rr);
      ctx.fill();
    } else {
      ctx.fillStyle = pal.eye;
      U.ellipse(ctx, x, y, rx, ry);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.arc(x + rx * 0.32, y - ry * 0.38, rx * 0.38, 0, 6.3);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - rx * 0.28, y + ry * 0.3, rx * 0.16, 0, 6.3);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMouth(ctx, x, y, style, pal) {
    ctx.save();
    ctx.lineCap = 'round';
    if (style === 'smile') {
      ctx.strokeStyle = pal.mouth;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(x, y - 3, 10, Math.PI * 0.22, Math.PI * 0.78);
      ctx.stroke();
    } else if (style === 'flat') {
      ctx.strokeStyle = pal.mouth;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x - 7, y);
      ctx.lineTo(x + 6, y);
      ctx.stroke();
    } else if (style === 'open') {
      ctx.fillStyle = '#7A3B2E';
      ctx.strokeStyle = pal.outline;
      ctx.lineWidth = 2.5;
      U.ellipse(ctx, x, y + 2, 9.5, 11.5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FF8F8F';
      U.ellipse(ctx, x + 1, y + 7, 5, 4);
      ctx.fill();
    } else if (style === 'grin') {
      ctx.fillStyle = '#7A3B2E';
      ctx.strokeStyle = pal.outline;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x - 14, y - 2);
      ctx.quadraticCurveTo(x, y + 16, x + 14, y - 2);
      ctx.quadraticCurveTo(x, y + 4, x - 14, y - 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FF8F8F';
      U.ellipse(ctx, x + 1, y + 7, 6, 4.5);
      ctx.fill();
    } else if (style === 'ouch') {
      ctx.fillStyle = '#7A3B2E';
      ctx.strokeStyle = pal.outline;
      ctx.lineWidth = 2.5;
      U.ellipse(ctx, x, y + 2, 7.5, 8.5);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFace(ctx, a, pose, pal) {
    if (pose.brow === 'angry') {
      ctx.save();
      ctx.strokeStyle = pal.outline;
      ctx.lineWidth = 3.6;
      ctx.lineCap = 'round';
      var eF = a.eyeF, eB = a.eyeB;
      ctx.beginPath();
      ctx.moveTo(eF.x - eF.rx * 0.7, eF.y - eF.ry * 1.25);
      ctx.lineTo(eF.x + eF.rx * 0.8, eF.y - eF.ry * 0.75);
      ctx.moveTo(eB.x - eB.rx * 0.7, eB.y - eB.ry * 1.2);
      ctx.lineTo(eB.x + eB.rx * 0.6, eB.y - eB.ry * 0.75);
      ctx.stroke();
      ctx.restore();
    }
    drawEye(ctx, a.eyeF, pose.eyes, pal);
    drawEye(ctx, a.eyeB, pose.eyes === 'star' ? 'star' : pose.eyes, pal);
    // 腮红
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = pal.blush;
    U.ellipse(ctx, a.blushF.x, a.blushF.y, a.blushF.rx, a.blushF.ry);
    ctx.fill();
    U.ellipse(ctx, a.blushB.x, a.blushB.y, a.blushB.rx, a.blushB.ry);
    ctx.fill();
    ctx.restore();
    drawMouth(ctx, a.mouth.x, a.mouth.y, pose.mouth, pal);
  }

  /* 像素大头照（彩蛋角色）：关闭采样平滑，保持像素颗粒感 */
  function drawPixelHead(ctx, a, img) {
    var w = a.head.rx * 3.0;
    var sm = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, a.head.x - w * 0.5 + a.head.rx * 0.02, a.head.y - w * 0.49, w, w);
    ctx.imageSmoothingEnabled = sm;
  }

  /* ================= 四肢 ================= */
  function drawArm(ctx, a, pose, side, pal, bs, C) {
    var isF = (side === 'F');
    var shX = (isF ? 34 : -32) * bs;
    var shY = (isF ? -100 : -98) * bs;
    var ang = isF ? pose.armF : pose.armB;
    var lenMul = isF ? pose.armLenF : pose.armLenB;
    var L = 30 * lenMul;
    var ex = shX + Math.sin(ang) * L;
    var ey = shY + Math.cos(ang) * L;
    var col = C(isF ? pal.body : shade(pal.body, 0.9));
    U.limb(ctx, shX, shY, ex, ey, 15, col, pal.outline, 6.5);
    ctx.fillStyle = col;
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(ex, ey, 12.5, 0, 6.3);
    ctx.fill();
    ctx.stroke();
  }

  function drawLeg(ctx, pose, side, pal, bs, C) {
    var isF = (side === 'F');
    var hipX = (isF ? 22 : -22) * bs;
    var hipY = -28 * bs;
    var ang = isF ? pose.legF : pose.legB;
    var lift = isF ? pose.legLiftF : pose.legLiftB;
    var L = 26;
    var ex = hipX + Math.sin(ang) * L;
    var ey = hipY + Math.cos(ang) * L - lift;
    var col = C(isF ? pal.body : shade(pal.body, 0.9));
    U.limb(ctx, hipX, hipY, ex, ey, 14, col, pal.outline, 6.5);
    ctx.save();
    ctx.translate(ex + 3, ey + 2);
    ctx.rotate(ang * 0.4);
    ctx.fillStyle = col;
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = 3.5;
    U.ellipse(ctx, 0, 0, 18, 11);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /* ================= 主体 ================= */
  function drawFighter(ctx, f, t) {
    var ch = f.char, pal = ch.pal;
    var hs = ch.headScale || 1;
    var bs = ch.bodyScale || 1;
    var pose = computePose(f, t);
    var sqx = (f.squash && f.squash.x) || 1;
    var sqy = (f.squash && f.squash.y) || 1;

    function C(c) {
      if (f.flash > 0 && (f.flash % 4) < 2) return '#FFFFFF';
      return c;
    }

    var groundY = NL.GROUND || 620;
    ctx.save();

    // 地面影子
    var airH = Math.max(0, groundY - f.y);
    ctx.globalAlpha = 0.2 * (1 - Math.min(1, airH / 280));
    ctx.fillStyle = '#000000';
    var shrink = 1 - Math.min(0.45, airH / 800);
    var dsc = f.drawScale || 1;
    U.ellipse(ctx, f.x, groundY + 8, 62 * shrink * dsc, 12 * shrink * dsc);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.translate(f.x, f.y);
    var dscale = f.drawScale || 1;
    ctx.scale(f.facing * pose.sx * sqx * dscale, pose.sy * sqy * dscale);
    if (pose.spin) {
      ctx.translate(2, -84);
      ctx.rotate(pose.spin);
      ctx.translate(-2, 84);
    }
    if (pose.lean) ctx.rotate(pose.lean);

    var a = buildAnchors(hs, bs);
    var ol = pal.outline;
    var headRec = NL.headImg && NL.headImg[ch.id];
    var useHeadImg = !!(headRec && headRec.ok);

    var bodyGrad = ctx.createLinearGradient(0, a.head.y - a.head.ry, 0, 0);
    bodyGrad.addColorStop(0, C(shade(pal.body, 1.07)));
    bodyGrad.addColorStop(0.55, C(pal.body));
    bodyGrad.addColorStop(1, C(shade(pal.body, 0.86)));

    // 冲刺线
    if (pose.speedLines) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (var i = 0; i < 3; i++) {
        var ly = -34 - i * 28 + Math.sin(t * 0.5 + i) * 4;
        var lx = -70 - i * 16;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx - 26, ly);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 背饰
    if (ch.decorBack) ch.decorBack(ctx, a, f, t);

    // 尾巴
    var wag = Math.sin(t * 0.1 + (f.seed || 0)) * 4;
    U.limb(ctx, -54 * bs, -40 * bs, -88 * bs + wag * 0.5, -14 * bs + wag, 13 * bs,
      C(shade(pal.body, 0.96)), ol, 6.5);
    ctx.fillStyle = C(shade(pal.body, 0.96));
    ctx.strokeStyle = ol;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(-88 * bs + wag * 0.5, -14 * bs + wag, 9.5 * bs, 0, 6.3);
    ctx.fill();
    ctx.stroke();

    // 犄角（画在头后面，底部藏进身体；像素大头照角色不画）
    if (!useHeadImg) {
      for (var hI = 0; hI < a.horns.length; hI++) {
        var horn = a.horns[hI];
        ctx.fillStyle = C(pal.horn);
        ctx.strokeStyle = ol;
        ctx.lineWidth = 3.5;
        U.ellipse(ctx, horn.x, horn.y, horn.r, horn.r * 1.1);
        ctx.fill();
        ctx.stroke();
      }
    }

    // 后腿 / 后手
    drawLeg(ctx, pose, 'B', pal, bs, C);
    drawArm(ctx, a, pose, 'B', pal, bs, C);

    // ===== 一体化身体：先轮廓层（整体外轮廓），再填色层 =====
    var blobs = [a.body, a.head, a.neck];
    ctx.fillStyle = ol;
    ctx.strokeStyle = ol;
    ctx.lineWidth = 7.5;
    ctx.lineJoin = 'round';
    for (var bI = 0; bI < blobs.length; bI++) {
      U.ellipse(ctx, blobs[bI].x, blobs[bI].y, blobs[bI].rx, blobs[bI].ry);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = bodyGrad;
    for (var bJ = 0; bJ < blobs.length; bJ++) {
      U.ellipse(ctx, blobs[bJ].x, blobs[bJ].y, blobs[bJ].rx, blobs[bJ].ry);
      ctx.fill();
    }

    // 头顶高光（像素大头照角色跳过）
    if (!useHeadImg) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#FFFFFF';
      U.ellipse(ctx, a.head.x + 12 * hs, a.head.y - 18 * hs, 22 * hs, 13 * hs);
      ctx.fill();
      ctx.globalAlpha = 0.32;
      U.ellipse(ctx, a.head.x + 2 * hs, a.head.y - 26 * hs, 11 * hs, 6 * hs);
      ctx.fill();
      ctx.restore();
    }

    // 肚皮（更大更圆，贴近原画的奶油大肚子占比）
    ctx.fillStyle = C(pal.belly);
    U.ellipse(ctx, a.body.x + 12 * bs, a.body.y + 4 * bs, 50 * bs, 44 * bs);
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#FFFFFF';
    U.ellipse(ctx, a.body.x + 21 * bs, a.body.y - 9 * bs, 12 * bs, 8 * bs);
    ctx.fill();
    ctx.restore();

    // 前腿
    drawLeg(ctx, pose, 'F', pal, bs, C);

    // 脸（像素大头照 / 常规绘制）
    if (useHeadImg) {
      drawPixelHead(ctx, a, headRec.img);
    } else {
      drawFace(ctx, a, pose, pal);
    }

    // 前手
    drawArm(ctx, a, pose, 'F', pal, bs, C);

    // 防御光盾
    if (f.state === 'block') {
      ctx.save();
      ctx.strokeStyle = (f.blockT > 0) ? 'rgba(140,220,255,0.85)' : 'rgba(140,220,255,0.4)';
      ctx.lineWidth = (f.blockT > 0) ? 7 : 5;
      ctx.beginPath();
      ctx.arc(30, -66, 56, -1.05, 1.05);
      ctx.stroke();
      ctx.restore();
    }

    // 前饰
    if (ch.decorFront) ch.decorFront(ctx, a, f, t);

    ctx.restore();
  }

  /* ================= 小头像 ================= */
  function miniFace(ctx, x, y, r, ch, expr, t) {
    var pal = ch.pal;
    t = t || 0;
    var hr = NL.headImg && NL.headImg[ch.id];
    if (hr && hr.ok) {
      var sm2 = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(hr.img, x - r * 1.15, y - r * 1.15, r * 2.3, r * 2.3);
      ctx.imageSmoothingEnabled = sm2;
      return;
    }
    var hs = r / 48;
    ctx.save();
    ctx.translate(x, y);
    // 犄角
    ctx.fillStyle = pal.horn;
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = 3;
    U.ellipse(ctx, 6 * hs, -40.5 * hs, 10 * hs, 11 * hs);
    ctx.fill(); ctx.stroke();
    U.ellipse(ctx, -22 * hs, -37 * hs, 8.5 * hs, 9.4 * hs);
    ctx.fill(); ctx.stroke();
    // 头
    var grad = ctx.createLinearGradient(0, -46 * hs, 0, 46 * hs);
    grad.addColorStop(0, shade(pal.body, 1.07));
    grad.addColorStop(0.6, pal.body);
    grad.addColorStop(1, shade(pal.body, 0.88));
    ctx.fillStyle = grad;
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = 4;
    U.ellipse(ctx, 0, 0, 48 * hs, 46 * hs);
    ctx.fill(); ctx.stroke();
    // 眼
    var eyes = 'normal', mouth = 'smile', brow = null;
    if (expr === 'happy') { eyes = 'happy'; mouth = 'smile'; }
    if (expr === 'angry') { eyes = 'normal'; brow = 'angry'; mouth = 'flat'; }
    if (expr === 'ko') { eyes = 'x'; mouth = 'flat'; }
    var blink = ((t + 11) % 230) < 7;
    if (blink && eyes === 'normal') eyes = 'closed';
    if (brow === 'angry') {
      ctx.strokeStyle = pal.outline;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(11 * hs, -25 * hs); ctx.lineTo(27 * hs, -18 * hs);
      ctx.moveTo(-13 * hs, -22 * hs); ctx.lineTo(-3 * hs, -17 * hs);
      ctx.stroke();
    }
    var eF = { x: 18 * hs, y: -8 * hs, rx: 10 * hs, ry: 12 * hs };
    var eB = { x: -6 * hs, y: -4 * hs, rx: 8.5 * hs, ry: 10.5 * hs };
    drawEye(ctx, eF, eyes, pal);
    drawEye(ctx, eB, eyes, pal);
    drawMouth(ctx, 20 * hs, 20 * hs, mouth, pal);
    ctx.restore();
  }

  /* 虚步残影 */
  function drawGhost(ctx, f, g) {
    var pal = f.char.pal;
    ctx.save();
    ctx.globalAlpha = Math.max(0, g.a);
    ctx.translate(g.x, g.y);
    ctx.scale(g.facing * (f.drawScale || 1), f.drawScale || 1);
    ctx.fillStyle = pal.body;
    U.ellipse(ctx, 0, -54, 64, 52); ctx.fill();
    U.ellipse(ctx, 4, -126, 36, 35); ctx.fill();
    U.limb(ctx, -54, -40, -86, -12, 13, pal.body, null);
    ctx.restore();
  }

  NL.draw = {
    fighter: drawFighter,
    miniFace: miniFace,
    computePose: computePose,
    ghost: drawGhost,
    _anims: ANIMS
  };
})();
