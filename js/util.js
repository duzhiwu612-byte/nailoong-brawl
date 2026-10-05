/* 奶龙大乱斗 - 基础工具函数 */
var NL = window.NL = window.NL || {};
(function () {
  'use strict';

  var U = NL.util = {};

  U.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  U.lerp = function (a, b, t) { return a + (b - a) * t; };
  U.rand = function (a, b) { return a + Math.random() * (b - a); };
  U.randInt = function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); };
  U.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  U.sign = function (v) { return v < 0 ? -1 : (v > 0 ? 1 : 0); };

  U.approach = function (cur, target, step) {
    if (cur < target) return Math.min(cur + step, target);
    return Math.max(cur - step, target);
  };

  U.aabb = function (ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  };

  /* 圆角矩形路径（不填充，仅构建路径） */
  U.roundRectPath = function (ctx, x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  /* 椭圆路径 */
  U.ellipse = function (ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, Math.PI * 2);
    ctx.closePath();
  };

  /* 胶囊状四肢（带描边） */
  U.limb = function (ctx, x1, y1, x2, y2, w, color, outline, outlineW) {
    ctx.save();
    ctx.lineCap = 'round';
    if (outline) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = w + (outlineW || 6);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  };

  U.easeOutQuad = function (t) { return 1 - (1 - t) * (1 - t); };
  U.easeInQuad = function (t) { return t * t; };
  U.easeOutBack = function (t) {
    var c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };

  U.now = function () {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  };

  /* ===== 全局视觉比例（角色建模整体尺寸） ===== */
  NL.MODEL_SCALE = 0.8;

  /* ===== 相机：跟随双人中点，拉开距离时轻微拉远 ===== */
  NL.camState = function () { return { x: 640, s: 1 }; };

  NL.camUpdate = function (cam, a, b, snap) {
    var midX = (a.x + b.x) / 2;
    var span = Math.abs(a.x - b.x) + 560;
    var ts = U.clamp(1280 / span, 0.72, 1);
    var halfW = 640 / ts;
    var tx = U.clamp(midX, (NL.WALL_L || 150) + halfW - 260, (NL.WALL_R || 1130) - halfW + 260);
    if (snap) { cam.x = tx; cam.s = ts; return; }
    cam.x = U.approach(cam.x, tx, 22);
    cam.s = U.approach(cam.s, ts, 0.02);
  };

  NL.camApply = function (ctx, cam) {
    ctx.translate(640, NL.GROUND || 620);
    ctx.scale(cam.s, cam.s);
    ctx.translate(-cam.x, -(NL.GROUND || 620));
  };
})();
