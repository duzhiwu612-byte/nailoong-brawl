/* 奶龙大乱斗 - 场景背景（龙村草地 · 大战场 + z轴多层平台） */
var NL = window.NL = window.NL || {};
(function () {
  'use strict';
  var U = NL.util;

  /* z轴多层平台（世界坐标；模式：从上方落上去，可走出边缘掉下） */
  NL.PLATFORMS = [
    { x: 640, y: 390, w: 330 },
    { x: 250, y: 495, w: 250 },
    { x: 1030, y: 495, w: 250 },
    { x: -150, y: 435, w: 200 },
    { x: 1430, y: 435, w: 200 }
  ];

  function drawCloud(ctx, x, y, s) {
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(x, y, 34 * s, 0, 6.3);
    ctx.arc(x + 40 * s, y - 14 * s, 28 * s, 0, 6.3);
    ctx.arc(x + 78 * s, y, 30 * s, 0, 6.3);
    ctx.arc(x + 40 * s, y + 10 * s, 34 * s, 0, 6.3);
    ctx.fill();
  }

  function drawHill(ctx, cx, baseY, w, h, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, baseY);
    ctx.quadraticCurveTo(cx, baseY - h * 1.7, cx + w / 2, baseY);
    ctx.closePath();
    ctx.fill();
  }

  function drawTree(ctx, x, baseY, s) {
    ctx.save();
    // 树干
    ctx.fillStyle = '#A8764C';
    ctx.strokeStyle = '#7A5230';
    ctx.lineWidth = 3;
    U.roundRectPath(ctx, x - 9 * s, baseY - 95 * s, 18 * s, 95 * s, 6);
    ctx.fill();
    ctx.stroke();
    // 树冠
    ctx.fillStyle = '#7BCB6F';
    ctx.strokeStyle = '#4E9B48';
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(x, baseY - 120 * s, 46 * s, 0, 6.3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 36 * s, baseY - 96 * s, 34 * s, 0, 6.3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 36 * s, baseY - 96 * s, 34 * s, 0, 6.3); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawSignpost(ctx, x, baseY) {
    ctx.save();
    ctx.fillStyle = '#B98A5A';
    ctx.strokeStyle = '#7A5230';
    ctx.lineWidth = 3.5;
    U.roundRectPath(ctx, x - 7, baseY - 96, 14, 96, 5);
    ctx.fill();
    ctx.stroke();
    U.roundRectPath(ctx, x - 78, baseY - 138, 156, 52, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7A5230';
    ctx.font = '900 30px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('龙 村', x, baseY - 110);
    ctx.restore();
  }

  function drawSnacks(ctx, x, baseY) {
    ctx.save();
    // 野餐布
    ctx.fillStyle = '#F27E7E';
    ctx.strokeStyle = '#C65A5A';
    ctx.lineWidth = 3;
    U.roundRectPath(ctx, x - 90, baseY - 26, 180, 40, 8);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    for (var i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 80 + i * 44, baseY - 26);
      ctx.lineTo(x - 80 + i * 44, baseY + 14);
      ctx.stroke();
    }
    // 零食：薯片袋 + 饮料
    ctx.fillStyle = '#FFD93B';
    ctx.strokeStyle = '#B98A2A';
    ctx.lineWidth = 2.5;
    U.roundRectPath(ctx, x - 58, baseY - 60, 34, 44, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7FD4F5';
    U.roundRectPath(ctx, x + 10, baseY - 54, 24, 38, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F27E7E';
    ctx.beginPath(); ctx.arc(x + 44, baseY - 26, 10, 0, 6.3); ctx.fill();
    ctx.restore();
  }

  function drawFlowers(ctx, x, baseY, n) {
    ctx.save();
    for (var i = 0; i < (n || 3); i++) {
      var fx = x + i * 26;
      var col = ['#FFB4D8', '#FFE066', '#FF9F9F'][i % 3];
      ctx.strokeStyle = '#4E9B48';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(fx, baseY);
      ctx.lineTo(fx, baseY - 16);
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(fx, baseY - 20, 5.5, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#FFF7C2';
      ctx.beginPath(); ctx.arc(fx, baseY - 20, 2.2, 0, 6.3); ctx.fill();
    }
    ctx.restore();
  }

  /* z轴平台：草皮小岛 */
  function drawPlatform(ctx, pl, t) {
    var x = pl.x - pl.w / 2, y = pl.y, w = pl.w;
    ctx.save();
    // 土底
    ctx.fillStyle = '#8A6A3B';
    ctx.strokeStyle = '#5A4318';
    ctx.lineWidth = 4;
    U.roundRectPath(ctx, x + 10, y + 8, w - 20, 26, 10);
    ctx.fill();
    ctx.stroke();
    // 草皮
    var g = ctx.createLinearGradient(0, y - 14, 0, y + 12);
    g.addColorStop(0, '#A6E88A');
    g.addColorStop(1, '#6BC46A');
    ctx.fillStyle = g;
    U.roundRectPath(ctx, x, y - 12, w, 24, 12);
    ctx.fill();
    ctx.stroke();
    // 草叶（随风摆）
    ctx.strokeStyle = 'rgba(46,130,58,0.7)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    var n = Math.max(2, Math.floor(w / 70));
    for (var i = 0; i <= n; i++) {
      var gx = x + 16 + (w - 32) * (i / n);
      var sway = Math.sin(t * 0.05 + i * 1.7) * 1.5;
      ctx.beginPath();
      ctx.moveTo(gx, y - 11);
      ctx.quadraticCurveTo(gx + sway - 3, y - 20, gx + sway - 6, y - 26);
      ctx.moveTo(gx, y - 11);
      ctx.quadraticCurveTo(gx + sway + 2, y - 19, gx + sway + 5, y - 25);
      ctx.stroke();
    }
    // 小花
    ctx.fillStyle = '#FFB4D8';
    ctx.beginPath(); ctx.arc(x + w * 0.24, y - 20, 5, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#FFE066';
    ctx.beginPath(); ctx.arc(x + w * 0.74, y - 22, 5, 0, 6.3); ctx.fill();
    ctx.restore();
  }

  function Stage(id) {
    this.id = id || 'village';
    this.bees = [];
    for (var i = 0; i < 7; i++) {
      this.bees.push({ x: U.rand(-300, 1700), y: U.rand(300, 480), ph: U.rand(0, 6), sp: U.rand(0.3, 0.7) });
    }
  }

  /* 远景层（屏幕空间 + 视差）。带 cam 时只画远景（战场由 drawWorld 在相机变换内绘制）；
     不带 cam（菜单场景）时直接接着画世界层。 */
  Stage.prototype.draw = function (ctx, t, cam) {
    var hasCam = !!cam;
    cam = cam || { x: 640, s: 1 };
    var px = cam.x - 640;
    var groundY = NL.GROUND || 620;

    // 天空
    var g = ctx.createLinearGradient(0, 0, 0, groundY);
    g.addColorStop(0, '#7FD0FF');
    g.addColorStop(0.6, '#CDEEFF');
    g.addColorStop(1, '#F0FAFF');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1280, groundY + 10);

    // 太阳（视差 0.15）
    ctx.save();
    ctx.translate(1085 - px * 0.15, 120);
    ctx.save();
    ctx.rotate(t * 0.004);
    ctx.fillStyle = 'rgba(255,224,102,0.45)';
    for (var i = 0; i < 12; i++) {
      ctx.rotate(Math.PI * 2 / 12);
      ctx.fillRect(20, -5, 62, 10);
    }
    ctx.restore();
    ctx.fillStyle = '#FFE066';
    ctx.beginPath(); ctx.arc(0, 0, 58, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#FFF3B0';
    ctx.beginPath(); ctx.arc(-12, -12, 40, 0, 6.3); ctx.fill();
    ctx.restore();

    // 云（视差 0.3）
    drawCloud(ctx, ((t * 0.25) % 1700) - 380 - px * 0.3, 105, 1.15);
    drawCloud(ctx, ((t * 0.16 + 800) % 1800) - 420 - px * 0.3, 195, 0.85);
    drawCloud(ctx, ((t * 0.2 + 1300) % 1900) - 480 - px * 0.3, 60, 0.65);

    // 远山（视差 0.5，铺满更宽的战场）
    for (var hi = 0; hi < 6; hi++) {
      var hx = -260 + hi * 430 - px * 0.5;
      drawHill(ctx, hx, groundY - 60, 430, 150 + (hi % 3) * 30, (hi % 2 === 0) ? '#A6DFAD' : '#8FD49A');
    }

    if (!hasCam) this.drawWorld(ctx, t, false);   // 菜单场景：直接拼接世界层（不画平台）
  };

  /* 世界层（相机变换内）：草地、地面、树、道具、z轴平台、蜜蜂 */
  Stage.prototype.drawWorld = function (ctx, t, withPlats) {
    var groundY = NL.GROUND || 620;
    if (withPlats === undefined) withPlats = true;
    var X0 = (NL.WALL_L || 150) - 600;
    var X1 = (NL.WALL_R || 1130) + 600;
    var W = X1 - X0;

    // 草地大带
    var g2 = ctx.createLinearGradient(0, groundY - 150, 0, 720);
    g2.addColorStop(0, '#8FE08A');
    g2.addColorStop(1, '#57B862');
    ctx.fillStyle = g2;
    ctx.fillRect(X0, groundY - 150, W, 720 - (groundY - 150));

    // 战斗地面带（稍深）
    ctx.fillStyle = 'rgba(70,170,80,0.35)';
    ctx.fillRect(X0, groundY, W, 34);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(X0, groundY, W, 3);

    // 草簇
    for (var k = 0; k < 130; k++) {
      var gx = X0 + ((k * 137 + 60) % W);
      var gy = groundY + 6 + (k % 3) * 10;
      ctx.strokeStyle = 'rgba(46,130,58,0.5)';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(gx, gy + 12);
      ctx.quadraticCurveTo(gx - 4, gy, gx - 8, gy - 8);
      ctx.moveTo(gx, gy + 12);
      ctx.quadraticCurveTo(gx + 2, gy - 2, gx + 4, gy - 10);
      ctx.stroke();
    }

    // 装饰
    drawTree(ctx, -420, groundY - 40, 0.9);
    drawTree(ctx, 150, groundY - 40, 1.0);
    drawTree(ctx, 1140, groundY - 40, 0.85);
    drawTree(ctx, 1900, groundY - 40, 0.95);
    drawSignpost(ctx, 190, groundY - 30);
    drawSnacks(ctx, 1060, groundY - 6);
    drawFlowers(ctx, -60, groundY + 2, 3);
    drawFlowers(ctx, 1500, groundY + 2, 3);

    // z轴多层平台
    if (withPlats) {
      var plats = NL.PLATFORMS || [];
      for (var pi = 0; pi < plats.length; pi++) drawPlatform(ctx, plats[pi], t);
    }

    // 蜜蜂
    for (var b = 0; b < this.bees.length; b++) {
      var bee = this.bees[b];
      var bx = bee.x + Math.sin(t * 0.02 * bee.sp + bee.ph) * 60;
      var by = bee.y + Math.cos(t * 0.03 * bee.sp + bee.ph * 2) * 24;
      ctx.fillStyle = '#FFD93B';
      ctx.strokeStyle = '#8A6A10';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(bx, by, 7, 0, 6.3); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#4A4A4A';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx - 6, by); ctx.lineTo(bx + 6, by); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.arc(bx - 2, by - 8, 5, 0, 6.3); ctx.fill();
    }
  };

  NL.Stage = Stage;
})();
