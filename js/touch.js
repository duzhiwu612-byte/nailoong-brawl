/* 奶龙大乱斗 - 手机端触屏支持（虚拟按键 / 自动横屏渲染 / 全屏锁横屏 / 音频解锁 / 画布点选）
   仅在有触屏的设备或 URL 带 ?touch=1 时启用；桌面环境完全零介入、零影响。
   测试页：tools/touchcheck.html?touch=1 ；强制关闭：?touch=0 ；关闭自动旋转：?rot=0
   v0.9.4：竖屏一律用 CSS 旋转把整屏渲染成横屏（不依赖任何浏览器 API，微信/锁竖屏也生效）；
           支持全屏的浏览器（安卓 Chrome 等）首次点按画面自动进全屏并锁横屏。 */
var NL = window.NL = window.NL || {};
(function () {
  'use strict';
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  var qs = String(location.search || '') + '&' + String(location.hash || '');
  var forcedOn = /touch=(1|on)\b/.test(qs);
  var forcedOff = /touch=(0|off)\b/.test(qs);
  var auto = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) ||
    /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(navigator.userAgent || '');
  var enabled = forcedOff ? false : (forcedOn || auto);

  var UI = NL.touchUI = { enabled: enabled, forced: forcedOn };
  if (!enabled) return;

  /* ================= 样式 ================= */
  var css = [
    'html.touch-on, html.touch-on body { touch-action: none; overscroll-behavior: none; }',
    '#touchui { position: fixed; inset: 0; pointer-events: none; z-index: 60; font-family: "Microsoft YaHei", "PingFang SC", sans-serif; }',
    '#touchui .cluster { position: absolute; }',
    '#touchui .tbtn { position: absolute; width: 58px; height: 58px; pointer-events: auto; display: flex; flex-direction: column;',
    '  align-items: center; justify-content: center; border-radius: 50%; background: rgba(28,22,10,0.46);',
    '  border: 2.5px solid rgba(255,217,59,0.72); color: #FFE9A8; box-shadow: 0 3px 10px rgba(0,0,0,0.35);',
    '  -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; touch-action: none; }',
    '#touchui .tbtn b { font-size: 19px; line-height: 1; }',
    '#touchui .tbtn i { font-style: normal; font-size: 10px; opacity: 0.85; margin-top: 2px; }',
    '#touchui .tbtn.pressed { background: rgba(255,217,59,0.92); color: #3A2C14; transform: scale(0.92); }',
    '#touchui .tbtn.sys { width: 42px; height: 42px; border-width: 2px; background: rgba(28,22,10,0.36); }',
    '#touchui .tbtn.sys b { font-size: 17px; }',
    '#touchui #tc-cluster-menu, #touchui #tc-cluster-move, #touchui #tc-cluster-atk, #touchui #tc-cluster-sys { display: none; }',
    '#touchui.mode-menu #tc-cluster-menu { display: block; }',
    '#touchui.mode-menu #tc-cluster-sys { display: block; }',
    '#touchui.mode-battle #tc-cluster-move, #touchui.mode-battle #tc-cluster-atk { display: block; }',
    '#touchui.mode-battle #tc-cluster-sys { display: block; }',
    '#touchui .sys-pause { display: none; }',
    '#touchui.mode-battle .sys-pause { display: flex; }',
    /* 自动旋转层：竖屏时整层旋转 90°，把横屏画面铺满竖屏 */
    '#rot-root { position: fixed; left: 0; top: 0; width: 100%; height: 100%; }',
    'html.rot-on #rot-root { width: 100vh; height: 100vw; transform-origin: 0 0;',
    '  transform: translateX(100vw) rotate(90deg); }',
    'html.rot-on #game { max-width: 100vh !important; max-height: 100vw !important; }',
    '#rot-hint { position: fixed; left: 50%; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%);',
    '  z-index: 80; padding: 10px 22px; border-radius: 24px; background: rgba(28,22,10,0.88); border: 2px solid rgba(255,217,59,0.65);',
    '  color: #FFE9A8; font-size: 15px; letter-spacing: 1px; pointer-events: none; opacity: 0; transition: opacity 0.4s;',
    '  font-family: "Microsoft YaHei", "PingFang SC", sans-serif; white-space: nowrap; }',
    '#rot-hint.show { opacity: 1; }'
  ].join('\n');
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);
  document.documentElement.classList.add('touch-on');

  /* ================= 构建虚拟按键 ================= */
  var root = document.createElement('div');
  root.id = 'touchui';
  document.body.appendChild(root);

  var byCode = {};   // code -> [els]

  function mkBtn(parent, code, main, sub, style, cls) {
    var el = document.createElement('div');
    el.className = 'tbtn' + (cls ? ' ' + cls : '');
    el.setAttribute('data-code', code);
    if (style) el.setAttribute('style', style);
    el.innerHTML = '<b>' + main + '</b>' + (sub ? '<i>' + sub + '</i>' : '');
    (byCode[code] = byCode[code] || []).push(el);
    parent.appendChild(el);
    return el;
  }
  function mkCluster(id, style) {
    var d = document.createElement('div');
    d.id = id;
    d.className = 'cluster';
    d.setAttribute('style', style);
    root.appendChild(d);
    return d;
  }

  var SAFE = {
    l: 'env(safe-area-inset-left, 0px)', r: 'env(safe-area-inset-right, 0px)',
    b: 'env(safe-area-inset-bottom, 0px)', t: 'env(safe-area-inset-top, 0px)'
  };

  /* 左下：移动（战斗） */
  var cMove = mkCluster('tc-cluster-move',
    'left:calc(12px + ' + SAFE.l + '); bottom:calc(12px + ' + SAFE.b + '); width:190px; height:190px;');
  mkBtn(cMove, 'KeyW', '▲', '跳', 'left:66px; top:0px;');
  mkBtn(cMove, 'KeyA', '◀', '左', 'left:0px; top:66px;');
  mkBtn(cMove, 'KeyD', '▶', '右', 'left:132px; top:66px;');
  mkBtn(cMove, 'KeyS', '▼', '防御', 'left:66px; top:132px;');

  /* 右下：攻击（战斗） */
  var cAtk = mkCluster('tc-cluster-atk',
    'right:calc(12px + ' + SAFE.r + '); bottom:calc(12px + ' + SAFE.b + '); width:186px; height:122px;');
  mkBtn(cAtk, 'KeyL', '技①', 'L', 'left:0px; top:0px;');
  mkBtn(cAtk, 'KeyU', '技②', 'U·远程', 'left:64px; top:0px;');
  mkBtn(cAtk, 'KeyI', '必杀', 'I', 'left:128px; top:0px;');
  mkBtn(cAtk, 'KeyK', '重击', 'K·远程', 'left:64px; top:64px;');
  mkBtn(cAtk, 'KeyJ', '轻击', 'J', 'left:128px; top:64px;');

  /* 右下：菜单（标题/模式/选人） */
  var cMenu = mkCluster('tc-cluster-menu',
    'right:calc(12px + ' + SAFE.r + '); bottom:calc(12px + ' + SAFE.b + '); width:122px; height:186px;');
  mkBtn(cMenu, 'ArrowLeft', '◀', '', 'left:0px; top:0px; width:52px; height:52px;');
  mkBtn(cMenu, 'ArrowRight', '▶', '', 'left:66px; top:0px; width:52px; height:52px;');
  mkBtn(cMenu, 'KeyW', '▲', '', 'left:0px; top:64px; width:52px; height:52px;');
  mkBtn(cMenu, 'Enter', '✓', '确认', 'left:66px; top:64px; width:52px; height:52px;');
  mkBtn(cMenu, 'KeyS', '▼', '', 'left:0px; top:128px; width:52px; height:52px;');
  mkBtn(cMenu, 'Escape', '✕', '返回', 'left:66px; top:128px; width:52px; height:52px;');

  /* 右上：系统键（静音 / 暂停 / 全屏） */
  var cSys = mkCluster('tc-cluster-sys',
    'right:calc(12px + ' + SAFE.r + '); top:calc(10px + ' + SAFE.t + '); width:138px; height:42px;');
  mkBtn(cSys, 'KeyM', '🔊', '', 'left:0px; top:0px;', 'sys');
  mkBtn(cSys, 'Escape', '⏸', '', 'left:48px; top:0px;', 'sys sys-pause');
  var btnFs = mkBtn(cSys, 'FS', '⛶', '', 'left:96px; top:0px;', 'sys');
  if (!document.documentElement.requestFullscreen && !document.documentElement.webkitRequestFullscreen) {
    btnFs.style.display = 'none';
  }

  /* ================= 一键横屏全屏 ================= */
  function fullscreenEl() {
    return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || null;
  }
  function tryLockLandscape() {
    try {
      var so = window.screen && screen.orientation;
      if (so && so.lock) {
        var p = so.lock('landscape');
        if (p && p['catch']) p['catch'](function () {});
        return true;
      }
      if (screen.lockOrientation) { screen.lockOrientation('landscape'); return true; }
      if (screen.webkitLockOrientation) { screen.webkitLockOrientation('landscape'); return true; }
      if (screen.mozLockOrientation) { screen.mozLockOrientation('landscape'); return true; }
    } catch (e) {}
    return false;
  }
  function enterLandscapeFs() {
    UI._fsTried = true;
    if (fullscreenEl()) { tryLockLandscape(); return; }
    var de = document.documentElement;
    var req = null;
    try {
      if (de.requestFullscreen) req = de.requestFullscreen();
      else if (de.webkitRequestFullscreen) req = de.webkitRequestFullscreen();
    } catch (e) {}
    var later = function () { tryLockLandscape(); };
    if (req && req.then) {
      req.then(function () { setTimeout(later, 60); });
      if (req['catch']) req['catch'](function () { setTimeout(later, 60); });
      return;
    }
    setTimeout(later, 120);
  }
  function exitLandscapeFs() {
    try {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } catch (e) {}
    try { if (window.screen && screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
  }
  UI.enterLandscapeFs = enterLandscapeFs;
  UI.exitLandscapeFs = exitLandscapeFs;
  UI._fsTried = false;

  /* ================= 自动旋转层：竖屏时把整个游戏旋转 90° 铺满屏幕 ================= */
  var rotAllowed = !/rot=(0|off)/.test(qs);
  var rotRoot = document.createElement('div');
  rotRoot.id = 'rot-root';
  document.body.insertBefore(rotRoot, document.body.firstChild);
  var stageEl = document.getElementById('wrap') || document.getElementById('game');
  if (stageEl) rotRoot.appendChild(stageEl);
  rotRoot.appendChild(root);   // 触控 UI 一起进旋转层 → 按键跟着画面转到横屏位置的"左下/右下"

  var rotOn = false;
  var hint = document.createElement('div');
  hint.id = 'rot-hint';
  hint.innerHTML = '📱 把手机向左横过来，立刻横屏开玩 ↺';
  document.body.appendChild(hint);
  var hintTimer = 0;
  function hintShow(on) {
    if (on) {
      hint.classList.add('show');
      clearTimeout(hintTimer);
      hintTimer = setTimeout(function () { hint.classList.remove('show'); }, 12000);
    } else {
      hint.classList.remove('show');
    }
  }

  function updateRotate() {
    var W = window.innerWidth, H = window.innerHeight;
    var portrait = H > W * 1.04;
    var want = rotAllowed && portrait;
    if (want !== rotOn) {
      rotOn = want;
      UI._rotOn = rotOn;
      document.documentElement.classList.toggle('rot-on', rotOn);
      if (rotOn) {
        rotRoot.style.width = H + 'px';
        rotRoot.style.height = W + 'px';
      } else {
        rotRoot.style.width = '';
        rotRoot.style.height = '';
      }
      try { window.dispatchEvent(new Event('resize')); } catch (e) {}   // 让主程序按交换后宽高重排画布
      hintShow(rotOn);
    }
    if (rotOn) {   // 地址栏伸缩等导致尺寸变化时保持同步
      if (rotRoot.style.width !== H + 'px') rotRoot.style.width = H + 'px';
      if (rotRoot.style.height !== W + 'px') rotRoot.style.height = W + 'px';
    }
  }

  /* ================= 按压 → 按键注入 ================= */
  var active = {};   // pointerId -> code

  function unlockAudio() {
    try { if (NL.SFX) { NL.SFX.init(); NL.SFX.resume(); } } catch (e) {}
  }
  document.addEventListener('pointerdown', unlockAudio, true);
  document.addEventListener('touchstart', unlockAudio, true);
  document.addEventListener('mousedown', unlockAudio, true);

  function press(code, id, el) {
    if (active[id] !== undefined) return;
    active[id] = code;
    if (el) el.classList.add('pressed');
    if (NL.Input && NL.Input.setKey) NL.Input.setKey(code, true);
  }
  function release(id) {
    var code = active[id];
    if (code === undefined) return;
    delete active[id];
    if (NL.Input && NL.Input.setKey) NL.Input.setKey(code, false);
    var els = byCode[code] || [];
    for (var i = 0; i < els.length; i++) els[i].classList.remove('pressed');
  }

  var allBtns = root.querySelectorAll('.tbtn');
  var bi;
  if (window.PointerEvent) {
    for (bi = 0; bi < allBtns.length; bi++) {
      (function (el) {
        var code = el.getAttribute('data-code');
        el.addEventListener('pointerdown', function (e) {
          e.preventDefault();
          if (e.stopPropagation) e.stopPropagation();
          try { el.setPointerCapture(e.pointerId); } catch (err) {}
          press(code, e.pointerId, el);
        });
      })(allBtns[bi]);
    }
    window.addEventListener('pointerup', function (e) { release(e.pointerId); }, true);
    window.addEventListener('pointercancel', function (e) { release(e.pointerId); }, true);
  } else {
    for (bi = 0; bi < allBtns.length; bi++) {
      (function (el) {
        var code = el.getAttribute('data-code');
        el.addEventListener('touchstart', function (e) {
          e.preventDefault();
          for (var i = 0; i < e.changedTouches.length; i++) press(code, e.changedTouches[i].identifier, el);
        }, { passive: false });
        el.addEventListener('touchend', function (e) {
          for (var i = 0; i < e.changedTouches.length; i++) release(e.changedTouches[i].identifier);
        });
        el.addEventListener('touchcancel', function (e) {
          for (var i = 0; i < e.changedTouches.length; i++) release(e.changedTouches[i].identifier);
        });
      })(allBtns[bi]);
    }
  }

  /* 全屏按钮：切换全屏（进入时锁横屏，退出时解锁） */
  btnFs.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    if (fullscreenEl()) exitLandscapeFs();
    else enterLandscapeFs();
  });

  /* ================= 滚动 / 缩放 / 长按菜单抑制 ================= */
  document.addEventListener('touchmove', function (e) {
    var t = e.target;
    var inside = t && t.closest && (t.closest('#touchui') || t.closest('#rot-root') || t.id === 'game' || t.id === 'wrap');
    if (inside) e.preventDefault();
  }, { passive: false });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('keydown', function (e) {
    if (e.code === 'KeyM') UI.muted = !UI.muted;
  });

  /* ================= 场景显隐 + 自动横屏 ================= */
  var lastMode = '';

  function refresh() {
    var g = NL.game;
    var inBattle = !!(g && g.scene && g.scenes && g.scene === g.scenes.battle);
    var mode = inBattle ? 'mode-battle' : 'mode-menu';
    if (mode !== lastMode) {
      root.classList.remove('mode-battle', 'mode-menu');
      root.classList.add(mode);
      lastMode = mode;
    }
    updateRotate();
  }
  UI._refresh = refresh;

  function tick() {
    refresh();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ================= 画布点选（标题开始 / 点卡片选人 / 点暂停菜单） ================= */
  function keyTap(code) {
    if (!NL.Input || !NL.Input.setKey) return;
    NL.Input.setKey(code, true);
    setTimeout(function () { NL.Input.setKey(code, false); }, 90);
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || t.id === 'touchui' || t.id === 'rot-hint') return;
    if (t.closest && t.closest('#touchui')) return;
    var cv = document.getElementById('game');
    if (!cv) return;
    if (!(t === cv || cv.contains(t) || t.id === 'wrap')) return;

    // 首次点按画布：自动尝试横屏全屏（每页仅一次；不依赖游戏状态）
    if (!UI._fsTried) enterLandscapeFs();

    var g = NL.game;
    if (!g || !g.scene || !g.scenes) return;
    var r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var nx, ny;
    if (UI._rotOn) {
      // 旋转 90° 后的画布：物理坐标 → 游戏坐标需要换轴
      nx = (e.clientY - r.top) / r.height;
      ny = (r.right - e.clientX) / r.width;
    } else {
      nx = (e.clientX - r.left) / r.width;
      ny = (e.clientY - r.top) / r.height;
    }
    var x = nx * 1280;
    var y = ny * 720;
    hint.classList.remove('show');   // 用户开始操作了，提示可以收起来了

    if (g.scene === g.scenes.title) {
      keyTap('Enter');
      return;
    }
    if (g.scene === g.scenes.select) {
      var sc = g.scenes.select;
      if (!sc) return;
      var aiOpp = (NL.game.mode.type === 'ai' && sc.picking === 1);
      if (sc.picking !== 0 && !aiOpp) return;
      if (sc.netPicked) return;   // 联机已选完，等对方
      var cw = 292, chh = 178, gap = 18, rowGap = 14;
      var startX = (1280 - 3 * cw - 2 * gap) / 2;
      var rowY = [96, 96 + chh + rowGap, 96 + (chh + rowGap) * 2];
      var col = -1, row = -1;
      for (var ci = 0; ci < 3; ci++) {
        var cx = startX + ci * (cw + gap);
        if (x >= cx && x <= cx + cw) col = ci;
      }
      for (var ri = 0; ri < 3; ri++) {
        if (y >= rowY[ri] && y <= rowY[ri] + chh) row = ri;
      }
      if (col >= 0 && row >= 0) {
        sc.cursor[sc.picking] = row * 3 + col;
        NL.SFX && NL.SFX.play && NL.SFX.play('select');
        keyTap('KeyJ');
      } else if (x < 180 && y >= 90 && y <= 665) {
        sc.cursor[sc.picking] = NL.charOrder.length;
        NL.SFX && NL.SFX.play && NL.SFX.play('select');
        keyTap('KeyJ');
      } else if (aiOpp && x >= 1006 && x <= 1256 && y >= 658 && y <= 706) {
        // 🎲 随机对手（选对手阶段）
        sc.cursor[1] = Math.floor(Math.random() * (NL.charOrder.length + 1));
        NL.SFX && NL.SFX.play && NL.SFX.play('select');
        keyTap('KeyJ');
      }
      return;
    }
    if (g.scene === g.scenes.net) {
      var ns = g.scenes.net;
      if (!ns || !ns.regions) return;
      for (var ni = 0; ni < ns.regions.length; ni++) {
        var rg = ns.regions[ni];
        if (x >= rg.x && x <= rg.x + rg.w && y >= rg.y && y <= rg.y + rg.h) {
          NL.SFX && NL.SFX.play && NL.SFX.play('select');
          ns.doAction(rg.act);
          break;
        }
      }
      return;
    }
    if (g.scene === g.scenes.battle) {
      var bs = g.scenes.battle, b = bs && bs.battle;
      if (!b) return;
      if (!(b.paused || b.matchOver)) return;
      if (x < 410 || x > 870) return;
      for (var mi = 0; mi < 3; mi++) {
        var my = 340 + mi * 58;
        if (Math.abs(y - my) < 27) {
          bs.menuIdx = mi;
          keyTap('Enter');
          break;
        }
      }
    }
  });
})();
