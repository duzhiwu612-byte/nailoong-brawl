/* 奶龙大乱斗 - 手机端触屏支持（虚拟按键 / 一键横屏全屏 / 音频解锁 / 画布点选）
   仅在有触屏的设备或 URL 带 ?touch=1 时启用；桌面环境完全零介入、零影响。
   测试页：tools/touchcheck.html?touch=1 ；强制关闭：?touch=0
   v0.9.3：竖屏大按钮"一键横屏全屏"（安卓自动转横屏）；横屏下首次点按自动进全屏。 */
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
    '#rotate-tip { position: fixed; inset: 0; z-index: 90; display: none; flex-direction: column; align-items: center; justify-content: center;',
    '  background: rgba(20,16,10,0.97); color: #FFE066; text-align: center; font-family: "Microsoft YaHei", "PingFang SC", sans-serif; }',
    '#rotate-tip.show { display: flex; }',
    '#rotate-tip .ph { font-size: 62px; transform: rotate(90deg); margin-bottom: 16px; }',
    '#rotate-tip p { font-size: 21px; margin: 6px 0; letter-spacing: 1px; }',
    '#rotate-tip .sub { font-size: 14px; color: rgba(255,224,102,0.72); }',
    '#rotate-tip .keep { pointer-events: auto; margin-top: 18px; padding: 8px 20px; border: 2px solid rgba(255,217,59,0.5);',
    '  border-radius: 22px; font-size: 13px; color: rgba(255,233,168,0.8); background: rgba(255,217,59,0.10); }',
    '#rotate-tip .go { pointer-events: auto; margin-top: 28px; padding: 15px 40px; border: 3px solid #FFD93B; border-radius: 38px;',
    '  font-size: 21px; font-weight: 700; color: #3A2C14; background: #FFE066; box-shadow: 0 8px 22px rgba(0,0,0,0.5);',
    '  font-family: inherit; -webkit-appearance: none; appearance: none; }',
    '#rotate-tip .go:active { transform: scale(0.95); }',
    '#rotate-tip .gohint { margin-top: 14px; font-size: 13px; }'
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

  /* 横屏提示：一键横屏全屏开玩 */
  var tip = document.createElement('div');
  tip.id = 'rotate-tip';
  tip.innerHTML = '<div class="ph">📱</div><p>横屏开打更爽！</p>' +
    '<p class="sub">《奶龙大乱斗》是横屏格斗游戏</p>' +
    '<button class="go" id="rotate-go">🔄 一键横屏全屏开玩</button>' +
    '<p class="sub gohint" id="rotate-hint">安卓：点了自动转横屏 · iPhone：请手动把手机横过来</p>' +
    '<div class="keep" id="rotate-keep">坚持竖屏</div>';
  document.body.appendChild(tip);
  var keepEl = tip.querySelector('#rotate-keep');
  var hintEl = tip.querySelector('#rotate-hint');
  if (keepEl) {
    keepEl.addEventListener('click', function (e) {
      if (e.stopPropagation) e.stopPropagation();
      UI.dismissRotate = true;
    });
  }
  function rotateGo() {
    enterLandscapeFs();
    if (hintEl) hintEl.textContent = '没反应？把手机横过来就行了 ✋';
  }
  var goEl = tip.querySelector('#rotate-go');
  if (goEl) goEl.addEventListener('click', function (e) {
    if (e.stopPropagation) e.stopPropagation();
    rotateGo();
  });
  tip.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'rotate-keep') return;
    rotateGo();
  });

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
    if (!UI._fsTried) enterLandscapeFs();   // 首次触碰任意按键 → 也自动尝试横屏全屏
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
    var inside = t && t.closest && (t.closest('#touchui') || t.closest('#rotate-tip') || t.id === 'game' || t.id === 'wrap');
    if (inside) e.preventDefault();
  }, { passive: false });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('keydown', function (e) {
    if (e.code === 'KeyM') UI.muted = !UI.muted;
  });

  /* ================= 场景显隐 + 横屏提示 ================= */
  var lastMode = '';
  var tipShown = false;

  function refresh() {
    var g = NL.game;
    var inBattle = !!(g && g.scene && g.scenes && g.scene === g.scenes.battle);
    var mode = inBattle ? 'mode-battle' : 'mode-menu';
    if (mode !== lastMode) {
      root.classList.remove('mode-battle', 'mode-menu');
      root.classList.add(mode);
      lastMode = mode;
    }
    var portrait = window.innerHeight > window.innerWidth * 1.04;
    var want = portrait && !UI.dismissRotate;
    if (want !== tipShown) {
      tip.classList.toggle('show', want);
      tipShown = want;
    }
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
    if (!t || t.id === 'touchui' || t.id === 'rotate-tip') return;
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
    var x = (e.clientX - r.left) * 1280 / r.width;
    var y = (e.clientY - r.top) * 720 / r.height;

    if (g.scene === g.scenes.title) {
      keyTap('Enter');
      return;
    }
    if (g.scene === g.scenes.select) {
      var sc = g.scenes.select;
      if (!sc || sc.picking !== 0) return;
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
