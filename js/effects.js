/* 奶龙大乱斗 - 特效：打击火花、尘土、漂浮文字、震屏、白闪 */
var NL = window.NL = window.NL || {};
(function () {
  'use strict';
  var U = NL.util;

  var FX = NL.FX = {
    parts: [],
    texts: [],
    shakeMag: 0,
    shakeX: 0, shakeY: 0,
    flashT: 0,
    flashColor: '#ffffff'
  };

  FX.clear = function () {
    FX.parts = [];
    FX.texts = [];
    FX.shakeMag = 0; FX.shakeX = 0; FX.shakeY = 0;
    FX.flashT = 0;
  };

  FX.shake = function (mag) { FX.shakeMag = Math.max(FX.shakeMag, mag); };
  FX.flash = function (t, color) { FX.flashT = Math.max(FX.flashT, t); FX.flashColor = color || '#ffffff'; };

  function add(p) { FX.parts.push(p); }

  function drawStarShape(ctx, r) {
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 0.18, -r * 0.18, r, 0);
    ctx.quadraticCurveTo(r * 0.18, r * 0.18, 0, r);
    ctx.quadraticCurveTo(-r * 0.18, r * 0.18, -r, 0);
    ctx.quadraticCurveTo(-r * 0.18, -r * 0.18, 0, -r);
    ctx.closePath();
  }

  FX.spawnHit = function (x, y, big) {
    var n = big ? 16 : 10;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = U.rand(120, big ? 430 : 300);
      add({
        type: 'star', x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, g: 900,
        life: U.randInt(14, 28), max: 28, size: U.rand(4, big ? 13 : 9),
        rot: Math.random() * 6.3, vr: U.rand(-8, 8), color: '#FFD93B'
      });
    }
    add({ type: 'ring', x: x, y: y, vx: 0, vy: 0, g: 0, life: 14, max: 14, size: big ? 26 : 16, color: '#FFF7C2' });
    if (big) {
      add({ type: 'starBig', x: x, y: y, vx: 0, vy: -40, g: 0, life: 16, max: 16, size: 62, rot: Math.random() * 6.3, vr: 2, color: '#FFC93B' });
    }
  };

  FX.spawnBlock = function (x, y) {
    for (var i = 0; i < 6; i++) {
      var a = U.rand(-2.6, -0.4);
      var sp = U.rand(90, 240);
      add({
        type: 'shard', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 700,
        life: U.randInt(10, 18), max: 18, size: U.rand(3, 7), rot: Math.random() * 6.3, vr: U.rand(-9, 9), color: '#9AD9FF'
      });
    }
    add({ type: 'ring', x: x, y: y, vx: 0, vy: 0, g: 0, life: 10, max: 10, size: 14, color: '#BFE9FF' });
  };

  FX.spawnDust = function (x, y, dir) {
    for (var i = 0; i < 8; i++) {
      add({
        type: 'dust', x: x + U.rand(-16, 16), y: y - U.rand(0, 8),
        vx: U.rand(-60, 60) + (dir || 0) * 70, vy: -U.rand(20, 90), g: 150,
        life: U.randInt(18, 30), max: 30, size: U.rand(9, 18), color: 'rgba(255,255,255,0.75)'
      });
    }
  };

  /* 招式小特效组（咖啡 / 金币 / 火焰 / 音波 / 白雾） */
  FX.cue = function (x, y, name, dir) {
    dir = dir || 1;
    var i, a, sp;
    if (name === 'coffee') {
      for (i = 0; i < 8; i++) {
        a = U.rand(-2.4, -0.7);
        sp = U.rand(60, 200);
        add({
          type: 'dust', x: x, y: y, vx: Math.cos(a) * sp * dir, vy: Math.sin(a) * sp,
          g: 900, life: U.randInt(14, 26), max: 26, size: U.rand(3, 6), color: '#8A5A3B'
        });
      }
    } else if (name === 'coins' || name === 'gold') {
      for (i = 0; i < 8; i++) {
        a = U.rand(-2.6, -0.5);
        sp = U.rand(80, 240);
        add({
          type: 'star', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          g: 700, life: U.randInt(12, 24), max: 24, size: U.rand(4, 8),
          rot: U.rand(0, 6.3), vr: U.rand(-6, 6), color: (i % 2) ? '#FFD93B' : '#FFF6C2'
        });
      }
    } else if (name === 'flame') {
      for (i = 0; i < 10; i++) {
        add({
          type: 'dust', x: x - dir * 18 + U.rand(-6, 6), y: y + U.rand(-8, 10),
          vx: -dir * U.rand(60, 160), vy: -U.rand(30, 120), g: 300,
          life: U.randInt(10, 20), max: 20, size: U.rand(5, 11),
          color: (i % 2) ? '#FF9F43' : '#FFD93B'
        });
      }
    } else if (name === 'note') {
      for (i = 0; i < 6; i++) {
        a = U.rand(0, 6.3);
        add({
          type: 'ring', x: x, y: y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, g: 0,
          life: U.randInt(10, 18), max: 18, size: U.rand(7, 13), color: '#FF9FDF'
        });
      }
    } else {
      for (i = 0; i < 8; i++) {
        a = U.rand(-3.1, 0);
        add({
          type: 'dust', x: x + U.rand(-10, 10), y: y,
          vx: Math.cos(a) * U.rand(40, 120), vy: Math.sin(a) * U.rand(40, 120), g: 260,
          life: U.randInt(12, 22), max: 22, size: U.rand(7, 13),
          color: name === 'splash' ? 'rgba(150,200,255,0.85)' : 'rgba(255,255,255,0.85)'
        });
      }
    }
  };

  FX.text = function (x, y, str, opt) {
    opt = opt || {};
    FX.texts.push({
      x: x, y: y, str: str, t: 0, dur: opt.dur || 46,
      color: opt.color || '#FFFFFF', size: opt.size || 26,
      stroke: opt.stroke || '#5A4318',
      vy: (opt.vy !== undefined) ? opt.vy : -1.1,
      pop: opt.pop !== false,
      rot: (opt.rot !== undefined) ? opt.rot : U.rand(-0.12, 0.12)
    });
  };

  FX.update = function () {
    for (var i = FX.parts.length - 1; i >= 0; i--) {
      var p = FX.parts[i];
      p.life--;
      if (p.life <= 0) { FX.parts.splice(i, 1); continue; }
      p.vy += (p.g || 0) / 60;
      p.x += p.vx / 60;
      p.y += p.vy / 60;
      if (p.vr) p.rot += p.vr / 60;
    }
    for (var j = FX.texts.length - 1; j >= 0; j--) {
      var tx = FX.texts[j];
      tx.t++;
      tx.y += tx.vy;
      if (tx.t >= tx.dur) FX.texts.splice(j, 1);
    }
    FX.shakeMag *= 0.88;
    if (FX.shakeMag < 0.3) FX.shakeMag = 0;
    FX.shakeX = U.rand(-FX.shakeMag, FX.shakeMag);
    FX.shakeY = U.rand(-FX.shakeMag, FX.shakeMag);
    if (FX.flashT > 0) FX.flashT--;
  };

  FX.draw = function (ctx) {
    ctx.save();
    for (var i = 0; i < FX.parts.length; i++) {
      var p = FX.parts[i];
      var k = p.life / p.max;
      ctx.save();
      ctx.globalAlpha = Math.min(1, k * 1.6);
      if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 5 * k + 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.6 - k * 0.9), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'starBig') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        drawStarShape(ctx, p.size * (1.15 - 0.3 * k));
        ctx.fill();
        ctx.strokeStyle = 'rgba(120,80,20,0.55)';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (p.type === 'shard') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
      } else if (p.type === 'dust') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size * k), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        drawStarShape(ctx, p.size * (0.5 + k * 0.5));
        ctx.fill();
      }
      ctx.restore();
    }
    for (var j = 0; j < FX.texts.length; j++) {
      var t = FX.texts[j];
      var kk = t.t / t.dur;
      var scale = 1;
      if (t.pop) scale = kk < 0.18 ? U.easeOutBack(kk / 0.18) : 1;
      ctx.save();
      ctx.globalAlpha = kk > 0.72 ? Math.max(0, (1 - kk) / 0.28) : 1;
      ctx.translate(t.x, t.y);
      ctx.rotate(t.rot);
      ctx.scale(scale, scale);
      ctx.font = '900 ' + t.size + 'px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = t.stroke;
      ctx.lineWidth = Math.max(3, t.size * 0.16);
      ctx.strokeText(t.str, 0, 0);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  };
})();
