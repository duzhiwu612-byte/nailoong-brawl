/* 奶龙大乱斗 - 主程序：场景流程 + 游戏循环 */
var NL = window.NL = window.NL || {};
(function () {
  'use strict';
  var U = NL.util;

  NL.debug = false;

  /* ===== 立绘（原版素材抠图；加载失败自动回退为代码绘制） ===== */
  var portraits = NL.portraits = {};
  if (typeof Image !== 'undefined') {
    (function () {
      var pids = ['loving', 'dark', 'rage', 'war', 'nailoong', 'void', 'tender', 'divine', 'sad', 'xiaole'];
      for (var pi = 0; pi < pids.length; pi++) {
        (function (pid) {
          var rec = { img: null, ok: false };
          portraits[pid] = rec;
          // 支持两种相对基准（index.html 在根目录 / tools 下的自检页在子目录）
          var cands = [
            '立绘/' + pid + '.webp', '立绘/' + pid + '.png', '立绘/' + pid + '.jpg',
            '../立绘/' + pid + '.webp', '../立绘/' + pid + '.png', '../立绘/' + pid + '.jpg'
          ];
          var ei = 0;
          var im = new Image();
          im.onload = function () { rec.img = im; rec.ok = true; };
          im.onerror = function () {
            ei++;
            if (ei < cands.length) { im.src = cands[ei]; }
            else { rec.ok = false; }
          };
          im.src = cands[ei];
        })(pids[pi]);
      }
    })();
  }

  /* 彩蛋角色像素头像（对局内建模用；缺失时自动回退普通脸） */
  NL.headImg = {};
  if (typeof Image !== 'undefined') {
    (function () {
      var rec = { img: null, ok: false };
      NL.headImg.xiaole = rec;
      var cands = ['立绘/xiaole_head.png', '../立绘/xiaole_head.png'];
      var ei = 0;
      var im = new Image();
      im.onload = function () { rec.img = im; rec.ok = true; };
      im.onerror = function () {
        ei++;
        if (ei < cands.length) { im.src = cands[ei]; }
        else { rec.ok = false; }
      };
      im.src = cands[ei];
    })();
  }

  var game = NL.game = {
    canvas: null,
    ctx: null,
    scene: null,
    scenes: {},
    mode: { type: 'ai', difficulty: 1 },
    pendingCfg: null,
    toast: { text: '', t: 0 }
  };

  game.go = function (name) {
    game.scene = game.scenes[name];
    if (game.scene && game.scene.enter) game.scene.enter();
  };

  game.showToast = function (text) {
    game.toast = { text: text, t: 70 };
  };

  // ===== UI 按键 =====
  function uiUp() { return NL.Input.consumePressed('KeyW') || NL.Input.consumePressed('ArrowUp'); }
  function uiDown() { return NL.Input.consumePressed('KeyS') || NL.Input.consumePressed('ArrowDown'); }
  function uiLeft() { return NL.Input.consumePressed('KeyA') || NL.Input.consumePressed('ArrowLeft'); }
  function uiRight() { return NL.Input.consumePressed('KeyD') || NL.Input.consumePressed('ArrowRight'); }
  function uiConfirm() {
    return NL.Input.consumePressed('Enter') || NL.Input.consumePressed('Space') ||
      NL.Input.consumePressed('KeyJ') || NL.Input.consumePressed('Numpad1');
  }

  function makePreview(ch, x, y, scale, seedOffset, state) {
    return {
      char: ch, x: x, y: y, facing: 1,
      state: state || 'idle', stateTime: 0,
      vy: -1, onGround: true,
      squash: { x: 1, y: 1 }, flash: 0,
      seed: seedOffset || 0, drawScale: scale || 1
    };
  }

  /* 立绘铺满绘制（保持比例裁剪） */
  function drawCover(ctx, img, x, y, w, h) {
    var s = Math.max(w / img.width, h / img.height);
    var dw = img.width * s, dh = img.height * s;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }

  // ================= 标题场景 =================
  var titleScene = {
    t: 0,
    enter: function () { this.t = 0; NL.FX.clear(); },
    update: function () {
      this.t++;
      if (uiConfirm()) { NL.SFX.play('confirm'); game.go('mode'); return; }
      NL.Input.clearEdges();
    },
    draw: function (ctx) {
      var t = this.t;
      if (!this.stage) this.stage = new NL.Stage('village');
      this.stage.draw(ctx, t);

      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.fillRect(0, 0, 1280, 720);

      // 两侧小奶娃（动画）
      NL.draw.fighter(ctx, makePreview(NL.chars.tender, 205, 664, 0.95, 21, 'win'), t);
      NL.draw.fighter(ctx, makePreview(NL.chars.rage, 1080, 650, 0.85, 55, 'idle'), t);
      // 主角：立绘（奶龙模式·视频九宫格抠图，未加载时回退为动画）
      var bobA = Math.sin(t * 0.06) * 6;
      var port = NL.portraits && NL.portraits.nailoong;
      if (port && port.ok) {
        var pw = 330, ph = 352, px0 = 640 - pw / 2, py0 = 320 + bobA;
        ctx.save();
        ctx.shadowColor = 'rgba(90,67,24,0.35)';
        ctx.shadowBlur = 26;
        ctx.shadowOffsetY = 10;
        ctx.fillStyle = '#FFF9E8';
        U.roundRectPath(ctx, px0, py0, pw, ph, 26);
        ctx.fill();
        ctx.restore();
        ctx.save();
        U.roundRectPath(ctx, px0, py0, pw, ph, 26);
        ctx.clip();
        drawCover(ctx, port.img, px0, py0, pw, ph);
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = '#5A4318';
        ctx.lineWidth = 6;
        U.roundRectPath(ctx, px0, py0, pw, ph, 26);
        ctx.stroke();
        ctx.restore();
      } else {
        NL.draw.fighter(ctx, makePreview(NL.chars.nailoong, 640, 676, 1.75, 7, 'idle'), t);
      }

      // 标题
      var bob = Math.sin(t * 0.06) * 8;
      ctx.save();
      ctx.translate(640, 176 + bob);
      var sc = 1 + Math.sin(t * 0.06) * 0.02;
      ctx.scale(sc, sc);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.font = '900 108px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.strokeStyle = '#5A4318';
      ctx.lineWidth = 20;
      ctx.strokeText('奶龙大乱斗', 0, 0);
      var tg = ctx.createLinearGradient(0, -60, 0, 60);
      tg.addColorStop(0, '#FFF3B0');
      tg.addColorStop(0.55, '#FFD93B');
      tg.addColorStop(1, '#F5A623');
      ctx.fillStyle = tg;
      ctx.fillText('奶龙大乱斗', 0, 0);
      ctx.font = '900 30px "Microsoft YaHei", sans-serif';
      ctx.strokeStyle = '#5A4318';
      ctx.lineWidth = 7;
      ctx.strokeText('—— 宇宙最强龙杯 · 干饭大会 ——', 0, 76);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('—— 宇宙最强龙杯 · 干饭大会 ——', 0, 76);
      ctx.restore();

      // 开始提示
      var alpha = 0.55 + 0.45 * Math.sin(t * 0.09);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 36px "Microsoft YaHei", sans-serif';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#5A4318';
      ctx.lineWidth = 9;
      var startTip = (NL.touchUI && NL.touchUI.enabled) ? '轻触屏幕开始游戏' : '按 Enter 开始游戏';
      ctx.strokeText(startTip, 640, 302);
      ctx.fillStyle = '#FFE066';
      ctx.fillText(startTip, 640, 302);
      ctx.restore();

      // 页脚
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '700 16px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText('玩法参考《死神VS火影》 · 同人练习作 · v0.9 (M11) · 奶娃九形态 · 📱 横屏触控 · 🎁 看笑了 · 🗯 胜利宣言', 640, 706);
      ctx.restore();
    }
  };

  // ================= 模式选择 =================
  var DIFF_DESC = [
    '会发呆、会放水，适合第一次玩',
    '会走位、会连招，正经对手',
    '读招怪！被打哭了可别怪它'
  ];

  var modeScene = {
    idx: 0,
    enter: function () { this.idx = 0; },
    update: function () {
      if (uiUp()) { this.idx = (this.idx + 2) % 3; NL.SFX.play('select'); }
      if (uiDown()) { this.idx = (this.idx + 1) % 3; NL.SFX.play('select'); }
      if (this.idx === 0) {
        if (uiLeft()) { game.mode.difficulty = (game.mode.difficulty + 2) % 3; NL.SFX.play('select'); }
        if (uiRight()) { game.mode.difficulty = (game.mode.difficulty + 1) % 3; NL.SFX.play('select'); }
      }
      if (uiConfirm()) {
        if (this.idx === 0) { game.mode.type = 'ai'; NL.SFX.play('confirm'); game.go('select'); return; }
        if (this.idx === 1) {
          if (NL.touchUI && NL.touchUI.enabled) {
            NL.SFX.play('back');
            game.showToast('📱 手机端暂不支持双人同屏，请在电脑上玩双人～');
          } else {
            game.mode.type = '2p'; NL.SFX.play('confirm'); game.go('select'); return;
          }
        } else {
          NL.SFX.play('back'); game.go('title'); return;
        }
      }
      if (NL.Input.consumePressed('Escape')) { NL.SFX.play('back'); game.go('title'); return; }
      NL.Input.clearEdges();
    },
    draw: function (ctx) {
      if (!this.stage) this.stage = new NL.Stage('village');
      this.stage.draw(ctx, this.t = (this.t || 0) + 1);
      ctx.fillStyle = 'rgba(20,30,10,0.45)';
      ctx.fillRect(0, 0, 1280, 720);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.font = '900 52px "Microsoft YaHei", sans-serif';
      ctx.strokeStyle = '#5A4318';
      ctx.lineWidth = 12;
      ctx.strokeText('选择对战模式', 640, 120);
      ctx.fillStyle = '#FFE066';
      ctx.fillText('选择对战模式', 640, 120);
      ctx.restore();

      var options = [
        { t: '单人 vs 电脑', s: '难度：◀ ' + NL.AI_LEVELS[game.mode.difficulty].name + ' ▶　' + DIFF_DESC[game.mode.difficulty] },
        { t: '双人对战（同屏双人）', s: '一人一个键盘区，喊上你的朋友一起互殴' },
        { t: '返回标题', s: '再想想……' }
      ];

      for (var i = 0; i < options.length; i++) {
        var y = 250 + i * 118;
        var sel = (i === this.idx);
        ctx.save();
        ctx.fillStyle = sel ? 'rgba(255,240,200,0.95)' : 'rgba(60,45,25,0.72)';
        U.roundRectPath(ctx, 300, y - 48, 680, 96, 18);
        ctx.fill();
        ctx.strokeStyle = sel ? '#FFD93B' : '#3A2C14';
        ctx.lineWidth = sel ? 6 : 4;
        U.roundRectPath(ctx, 300, y - 48, 680, 96, 18);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '900 34px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = sel ? '#5A4318' : '#FFFFFF';
        ctx.fillText(options[i].t, 640, y - 16);
        ctx.font = '700 18px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = sel ? '#8A6A30' : 'rgba(255,255,255,0.75)';
        ctx.fillText(options[i].s, 640, y + 22);
        ctx.restore();
      }

      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '700 15px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText('W/S 或 ↑/↓ 选择 · A/D 调难度 · Enter/J 确认 · Esc 返回', 640, 690);
      ctx.restore();
    }
  };

  // ================= 选人场景 =================
  var selectScene = {
    t: 0,
    picking: 0,
    cursor: [0, 0],
    picks: [null, null],
    shakeT: 0,
    hint: '',
    hintT: 0,

    enter: function () {
      this.t = 0;
      this.picking = 0;
      this.cursor = [0, 4];
      this.picks = [null, null];
      this.shakeT = 0;
      this.hint = '';
      this.hintT = 0;
    },

    startBattle: function () {
      game.pendingCfg = {
        mode: game.mode.type,
        difficulty: game.mode.difficulty,
        p1: this.picks[0],
        p2: this.picks[1]
      };
      game.go('battle');
    },

    update: function () {
      this.t++;
      if (this.shakeT > 0) this.shakeT--;
      if (this.hintT > 0) this.hintT--;

      var order = NL.charOrder;
      var total = order.length;
      var p = this.picking;
      var idx = this.cursor[p];
      var left, right, up, down, confirm;

      if (p === 0) {
        left = NL.Input.consumePressed('KeyA');
        right = NL.Input.consumePressed('KeyD');
        up = NL.Input.consumePressed('KeyW');
        down = NL.Input.consumePressed('KeyS');
        confirm = NL.Input.consumePressed('KeyJ') || NL.Input.consumePressed('Enter') || NL.Input.consumePressed('Space');
      } else {
        left = NL.Input.consumePressed('ArrowLeft');
        right = NL.Input.consumePressed('ArrowRight');
        up = NL.Input.consumePressed('ArrowUp');
        down = NL.Input.consumePressed('ArrowDown');
        confirm = NL.Input.consumePressed('Numpad1');
      }

      var BONUS = total;   // 彩蛋卡（看笑了）索引 = 9，位于九宫格左侧竖卡
      if (left) { this.cursor[p] = (idx % 3 === 0) ? BONUS : idx - 1; NL.SFX.play('select'); }
      else if (right) { this.cursor[p] = (idx === BONUS) ? 3 : (idx + 1) % total; NL.SFX.play('select'); }
      else if (up) { this.cursor[p] = (idx === BONUS) ? BONUS : (idx + total - 3) % total; NL.SFX.play('select'); }
      else if (down) { this.cursor[p] = (idx === BONUS) ? BONUS : (idx + 3) % total; NL.SFX.play('select'); }

      if (NL.Input.consumePressed('Escape')) {
        NL.SFX.play('back');
        game.go('mode');
        return;
      }

      idx = this.cursor[p];
      if (confirm) {
        var cid = (idx === total) ? NL.bonusId : order[idx];
        var ch = NL.chars[cid];
        if (!ch.playable) {
          this.shakeT = 14;
          this.hint = '「' + ch.name + '」还在干饭，敬请期待！';
          this.hintT = 110;
          NL.SFX.play('back');
        } else {
          NL.SFX.play('confirm');
          this.picks[p] = cid;
          if (game.mode.type === '2p') {
            if (p === 0) {
              this.picking = 1;
              this.hint = 'P2 请选择你的奶龙！';
              this.hintT = 110;
            } else {
              this.startBattle();
              return;
            }
          } else {
            var unlocked = [];
            for (var i = 0; i < total; i++) if (NL.chars[order[i]].playable) unlocked.push(order[i]);
            this.picks[1] = U.pick(unlocked);
            this.startBattle();
            return;
          }
        }
      }
      NL.Input.clearEdges();
    },

    draw: function (ctx) {
      var t = this.t;
      if (!this.stage) this.stage = new NL.Stage('village');
      this.stage.draw(ctx, t);
      ctx.fillStyle = 'rgba(20,30,10,0.5)';
      ctx.fillRect(0, 0, 1280, 720);

      // 标题
      var header = game.mode.type === '2p'
        ? (this.picking === 0 ? 'P1 选择你的奶龙（双人对战）' : 'P2 选择你的奶龙（双人对战）')
        : '选择你的奶龙（对战电脑）';
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.font = '900 40px "Microsoft YaHei", sans-serif';
      ctx.strokeStyle = '#5A4318';
      ctx.lineWidth = 10;
      ctx.strokeText(header, 640, 60);
      ctx.fillStyle = '#FFE066';
      ctx.fillText(header, 640, 60);
      ctx.restore();

      var order = NL.charOrder;
      var cw = 292, chh = 178, gap = 18, rowGap = 14;
      var totalW = 3 * cw + 2 * gap;
      var startX = (1280 - totalW) / 2;
      var rowY = [96, 96 + chh + rowGap, 96 + (chh + rowGap) * 2];

      for (var i = 0; i < order.length; i++) {
        var ch = NL.chars[order[i]];
        var col = i % 3, row = Math.floor(i / 3);
        var x = startX + col * (cw + gap);
        var y = rowY[row];
        var isShake = (this.shakeT > 0 && this.cursor[this.picking] === i && (Math.floor(this.shakeT / 3) % 2 === 1));
        if (isShake) x += U.rand(-7, 7);

        var selP1 = (this.cursor[0] === i);
        var selP2 = (game.mode.type === '2p' && this.picking === 1 && this.cursor[1] === i);
        var sel = (this.picking === 0 && selP1) || (this.picking === 1 && selP2);

        // 底板
        ctx.save();
        ctx.fillStyle = ch.playable ? 'rgba(255,250,235,0.95)' : 'rgba(205,205,205,0.9)';
        U.roundRectPath(ctx, x, y, cw, chh, 16);
        ctx.fill();
        ctx.restore();

        // 预览：立绘优先（原版素材抠图），未加载时回退为动画奶龙
        var hasArt = !!(NL.portraits && NL.portraits[order[i]] && NL.portraits[order[i]].ok);
        ctx.save();
        U.roundRectPath(ctx, x + 3, y + 3, cw - 6, chh - 6, 14);
        ctx.clip();
        if (hasArt) {
          drawCover(ctx, NL.portraits[order[i]].img, x + 3, y + 3, cw - 6, chh - 6);
          var vg = ctx.createLinearGradient(0, y + chh - 100, 0, y + chh - 3);
          vg.addColorStop(0, 'rgba(255,250,235,0)');
          vg.addColorStop(1, 'rgba(255,250,235,0.97)');
          ctx.fillStyle = vg;
          ctx.fillRect(x + 3, y + chh - 100, cw - 6, 97);
        } else {
          NL.draw.fighter(ctx, makePreview(ch, x + cw / 2, y + chh - 66, 0.66, i * 13 + 3, 'idle'), t + i * 23);
        }
        ctx.restore();

        // 名字（有立绘时移到底部渐隐区上）
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (hasArt) {
          ctx.font = '900 26px "Microsoft YaHei", sans-serif';
          ctx.fillStyle = '#5A4318';
          ctx.fillText(ch.name, x + cw / 2, y + chh - 52);
          ctx.font = '700 14px "Microsoft YaHei", sans-serif';
          ctx.fillStyle = '#8A6A30';
          ctx.fillText(ch.title, x + cw / 2, y + chh - 24);
        } else {
          ctx.font = '900 25px "Microsoft YaHei", sans-serif';
          ctx.fillStyle = '#5A4318';
          ctx.fillText(ch.name, x + cw / 2, y + 32);
          ctx.font = '700 14px "Microsoft YaHei", sans-serif';
          ctx.fillStyle = '#8A6A30';
          ctx.fillText(ch.title, x + cw / 2, y + 58);
        }
        ctx.restore();

        // 未完成角色遮罩
        if (!ch.playable) {
          ctx.save();
          ctx.fillStyle = 'rgba(90,90,110,0.6)';
          U.roundRectPath(ctx, x + 3, y + 3, cw - 6, chh - 6, 14);
          ctx.fill();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = '900 26px "Microsoft YaHei", sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.fillText('🔒 制作中', x + cw / 2, y + chh / 2 + 30);
          ctx.restore();
        }

        // 选中边框
        if (sel) {
          ctx.save();
          ctx.strokeStyle = '#FFD93B';
          ctx.lineWidth = 7;
          U.roundRectPath(ctx, x + 1, y + 1, cw - 2, chh - 2, 16);
          ctx.stroke();
          ctx.font = '900 20px "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#FF6B9D';
          ctx.strokeStyle = '#5A4318';
          ctx.lineWidth = 5;
          ctx.strokeText('▼ 选择中', x + 12, y + 22);
          ctx.fillText('▼ 选择中', x + 12, y + 22);
          ctx.restore();
        } else {
          ctx.save();
          ctx.strokeStyle = '#5A4318';
          ctx.lineWidth = 4;
          U.roundRectPath(ctx, x, y, cw, chh, 16);
          ctx.stroke();
          ctx.restore();
        }
      }

      /* ===== 彩蛋卡：看笑了（左侧竖卡，像素头 + 奶龙身体） ===== */
      var bsel = (this.cursor[this.picking] === order.length);
      var bx = 14, by = 96, bwid = 156, bhei = 562;
      ctx.save();
      ctx.fillStyle = 'rgba(255,250,235,0.95)';
      U.roundRectPath(ctx, bx, by, bwid, bhei, 16);
      ctx.fill();
      ctx.restore();
      var bp = NL.portraits && NL.portraits[NL.bonusId];
      if (bp && bp.ok) {
        ctx.save();
        U.roundRectPath(ctx, bx + 3, by + 3, bwid - 6, bhei - 6, 14);
        ctx.clip();
        drawCover(ctx, bp.img, bx + 3, by + 3, bwid - 6, bhei - 6);
        ctx.fillStyle = 'rgba(255,250,235,0.94)';
        ctx.fillRect(bx + 3, by + bhei - 96, bwid - 6, 90);
        ctx.restore();
      } else {
        NL.draw.fighter(ctx, makePreview(NL.chars[NL.bonusId], bx + bwid / 2, by + bhei - 110, 0.6, 77, 'idle'), t);
      }
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.font = '900 24px "Microsoft YaHei", sans-serif';
      ctx.strokeStyle = '#5A4318';
      ctx.lineWidth = 6;
      ctx.strokeText('看笑了', bx + bwid / 2, by + bhei - 66);
      ctx.fillStyle = '#5A4318';
      ctx.fillText('看笑了', bx + bwid / 2, by + bhei - 66);
      ctx.font = '700 13px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#8A6A30';
      ctx.fillText('彩蛋 · 像素限定', bx + bwid / 2, by + bhei - 40);
      ctx.font = '900 15px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#FF6B9D';
      ctx.fillText('🎁 彩蛋', bx + bwid / 2, by + 20);
      ctx.restore();
      if (bsel) {
        ctx.save();
        ctx.strokeStyle = '#FFD93B';
        ctx.lineWidth = 7;
        U.roundRectPath(ctx, bx + 1, by + 1, bwid - 2, bhei - 2, 16);
        ctx.stroke();
        ctx.font = '900 20px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FF6B9D';
        ctx.strokeStyle = '#5A4318';
        ctx.lineWidth = 5;
        ctx.strokeText('▼ 选择中', bx + 10, by + 48);
        ctx.fillText('▼ 选择中', bx + 10, by + 48);
        ctx.restore();
      } else {
        ctx.save();
        ctx.strokeStyle = '#5A4318';
        ctx.lineWidth = 4;
        U.roundRectPath(ctx, bx, by, bwid, bhei, 16);
        ctx.stroke();
        ctx.restore();
      }

      // 提示
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (this.hintT > 0 && this.hint) {
        ctx.globalAlpha = Math.min(1, this.hintT / 30);
        ctx.font = '900 26px "Microsoft YaHei", sans-serif';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#5A4318';
        ctx.lineWidth = 8;
        ctx.strokeText(this.hint, 640, 690);
        ctx.fillStyle = '#FFE066';
        ctx.fillText(this.hint, 640, 690);
      } else {
        ctx.font = '700 16px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        var touchUI = !!(NL.touchUI && NL.touchUI.enabled);
        var tip;
        if (touchUI) {
          tip = '点选角色卡片出战 · 左下方向键移动光标 · 右下 ✓ 确认 / ✕ 返回';
        } else {
          tip = (game.mode.type === '2p')
            ? (this.picking === 0 ? 'P1：A/D/W/S 选择 · J 确认　｜　Esc 返回' : 'P2：←/→/↑/↓ 选择 · 小键盘 1 确认')
            : 'WASD 选择 · J/Enter 确认 · 全场 9 种形态均可出战　｜　组合技：S+J 防反 · S+K 投技 · W+J 上挑 · W+K 跃击';
        }
        ctx.fillText(tip, 640, 674);
        if (!touchUI && game.mode.type !== '2p') {
          ctx.fillStyle = 'rgba(255,255,255,0.78)';
          ctx.fillText('对战中：K 重击=远程 · U 技能=远程 · 双击方向=虚步(无敌+可穿人绕后) · 台上台下都能打', 640, 696);
        }
      }
      ctx.restore();
    }
  };

  // ================= 对战场景 =================
  var battleScene = {
    battle: null,
    menuIdx: 0,
    wasOver: false,
    t: 0,

    enter: function () {
      this.battle = new NL.Battle(game.pendingCfg);
      this.menuIdx = 0;
      this.wasOver = false;
      this.t = 0;
    },

    update: function () {
      var b = this.battle;
      this.t++;

      if (NL.Input.consumePressed('Escape')) {
        if (b.paused) { b.paused = false; NL.SFX.play('select'); }
        else if (b.matchOver) { game.go('title'); return; }
        else { b.paused = true; this.menuIdx = 0; NL.SFX.play('select'); }
      }

      if (b.paused) {
        this.updatePauseMenu();
        return;
      }

      if (b.matchOver && !this.wasOver) {
        this.wasOver = true;
        this.menuIdx = 0;
      }
      if (b.matchOver) {
        this.updateEndMenu();
      }
      b.update();
    },

    updatePauseMenu: function () {
      var opts = 3;
      if (uiUp()) { this.menuIdx = (this.menuIdx + opts - 1) % opts; NL.SFX.play('select'); }
      if (uiDown()) { this.menuIdx = (this.menuIdx + 1) % opts; NL.SFX.play('select'); }
      if (uiConfirm()) {
        NL.SFX.play('confirm');
        if (this.menuIdx === 0) { this.battle.paused = false; NL.Input.clearEdges(); }
        else if (this.menuIdx === 1) { this.battle = new NL.Battle(game.pendingCfg); NL.Input.clearEdges(); }
        else { game.go('title'); return; }
      }
      NL.Input.clearEdges();
    },

    updateEndMenu: function () {
      var opts = 3;
      if (uiUp()) { this.menuIdx = (this.menuIdx + opts - 1) % opts; NL.SFX.play('select'); }
      if (uiDown()) { this.menuIdx = (this.menuIdx + 1) % opts; NL.SFX.play('select'); }
      if (uiConfirm()) {
        NL.SFX.play('confirm');
        if (this.menuIdx === 0) { this.battle = new NL.Battle(game.pendingCfg); this.wasOver = false; }
        else if (this.menuIdx === 1) { game.go('select'); return; }
        else { game.go('title'); return; }
      }
      NL.Input.clearEdges();
    },

    draw: function (ctx) {
      this.battle.draw(ctx);
      if (this.battle.paused) {
        this.drawOverlay(ctx, '暂停中…', ['继续战斗', '重新开始', '回到标题'], this.menuIdx, '奶龙也需要喘口气');
      } else if (this.battle.matchOver) {
        var b2 = this.battle;
        var cw = (b2.winnerIdx >= 0) ? b2.fighters[b2.winnerIdx] : null;
        var q = (cw && cw.char.winQuote) ? ('胜利宣言：\u300c' + cw.char.winQuote + '\u300d') : '';
        this.drawOverlay(ctx, '干饭冠军诞生！', ['再战一场', '重选奶龙', '回到标题'], this.menuIdx, q);
      }
    },

    drawOverlay: function (ctx, title, options, idx, sub) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, 1280, 720);

      ctx.fillStyle = 'rgba(60,45,25,0.95)';
      U.roundRectPath(ctx, 400, 200, 480, 330, 22);
      ctx.fill();
      ctx.strokeStyle = '#FFD93B';
      ctx.lineWidth = 5;
      U.roundRectPath(ctx, 400, 200, 480, 330, 22);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.font = '900 40px "Microsoft YaHei", sans-serif';
      ctx.strokeStyle = '#3A2C14';
      ctx.lineWidth = 9;
      ctx.strokeText(title, 640, 258);
      ctx.fillStyle = '#FFE066';
      ctx.fillText(title, 640, 258);
      if (sub) {
        ctx.font = '700 16px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(sub, 640, 292);
      }

      for (var i = 0; i < options.length; i++) {
        var y = 340 + i * 58;
        var sel = (i === idx);
        if (sel) {
          ctx.fillStyle = 'rgba(255,217,59,0.22)';
          U.roundRectPath(ctx, 440, y - 22, 400, 44, 12);
          ctx.fill();
        }
        ctx.font = sel ? '900 26px "Microsoft YaHei", sans-serif' : '700 23px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = sel ? '#FFE066' : 'rgba(255,255,255,0.85)';
        ctx.fillText((sel ? '▶ ' : '') + options[i], 640, y);
      }
      ctx.restore();
    }
  };

  // ================= 启动 =================
  NL.boot = function () {
    var canvas = document.getElementById('game');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    game.canvas = canvas;
    game.ctx = ctx;
    NL.Input.init();

    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      var s = Math.min(w / 1280, h / 720);
      canvas.style.width = Math.round(1280 * s) + 'px';
      canvas.style.height = Math.round(720 * s) + 'px';
    }
    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('keydown', function (e) {
      if (e.code === 'F1') { NL.debug = !NL.debug; e.preventDefault(); }
      if (e.code === 'KeyM') {
        var m = NL.SFX.toggleMute();
        game.showToast(m ? '🔇 已静音（按 M 恢复）' : '🔊 音效已恢复');
      }
    });

    game.scenes.title = titleScene;
    game.scenes.mode = modeScene;
    game.scenes.select = selectScene;
    game.scenes.battle = battleScene;
    game.go('title');

    var last = 0, acc = 0;
    var STEP = 1000 / 60;

    function frame(now) {
      requestAnimationFrame(frame);
      if (!last) last = now;
      var dt = Math.min(120, now - last);
      last = now;
      acc += dt;
      var n = 0;
      while (acc >= STEP && n < 5) {
        acc -= STEP;
        n++;
        if (game.scene && game.scene.update) game.scene.update();
      }
      if (ctx) {
        ctx.save();
        ctx.clearRect(0, 0, 1280, 720);
        if (game.scene && game.scene.draw) game.scene.draw(ctx);
        ctx.restore();
      }
      // 提示
      if (game.toast.t > 0) {
        game.toast.t--;
        ctx.save();
        ctx.globalAlpha = Math.min(1, game.toast.t / 20);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '900 24px "Microsoft YaHei", sans-serif';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#3A2C14';
        ctx.lineWidth = 7;
        ctx.strokeText(game.toast.text, 640, 640);
        ctx.fillStyle = '#FFE066';
        ctx.fillText(game.toast.text, 640, 640);
        ctx.restore();
      }
    }
    requestAnimationFrame(frame);
  };

  if (!NL.__HEADLESS__ && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { NL.boot(); });
    } else {
      NL.boot();
    }
  }
})();
