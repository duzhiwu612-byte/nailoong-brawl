/* 奶龙大乱斗 - 输入系统（键盘 + 虚拟玩家状态） */
var NL = window.NL = window.NL || {};
(function () {
  'use strict';

  var KEYMAP = [
    { // 1P
      left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS',
      light: 'KeyJ', heavy: 'KeyK', skill1: 'KeyL', skill2: 'KeyU', sup: 'KeyI'
    },
    { // 2P（小键盘）
      left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown',
      light: 'Numpad1', heavy: 'Numpad2', skill1: 'Numpad3', skill2: 'Numpad4', sup: 'Numpad5'
    }
  ];

  var raw = {};          // 物理按键按住状态
  var rawPressed = {};   // 自上次清理以来"按下过"的键（边沿）
  var pstate = [freshState(), freshState()];
  var lastTap = [{ left: -999, right: -999 }, { left: -999, right: -999 }];
  var tick = 0;

  function freshState() {
    return {
      left: false, right: false, up: false, down: false,
      light: false, heavy: false, skill1: false, skill2: false, sup: false,
      pLeft: false, pRight: false, pUp: false, pDown: false,
      pLight: false, pHeavy: false, pSkill1: false, pSkill2: false, pSup: false,
      pDash: 0
    };
  }

  var I = NL.Input = {
    KEYMAP: KEYMAP,
    pstate: pstate,

    init: function () {
      window.addEventListener('keydown', function (e) {
        NL.SFX.init();  // 浏览器要求用户与页面交互后才允许发声
        if (e.repeat) return;
        raw[e.code] = true;
        rawPressed[e.code] = true;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) >= 0) {
          e.preventDefault();
        }
      });
      window.addEventListener('keyup', function (e) { raw[e.code] = false; });
      window.addEventListener('blur', function () {
        for (var k in raw) raw[k] = false;
      });
    },

    /* 逻辑帧调用：刷新两名键盘玩家的按住状态与按下边沿 */
    poll: function () {
      tick++;
      for (var p = 0; p < 2; p++) {
        var m = KEYMAP[p], s = pstate[p];
        var pairs = [
          ['left', 'pLeft'], ['right', 'pRight'], ['up', 'pUp'], ['down', 'pDown'],
          ['light', 'pLight'], ['heavy', 'pHeavy'],
          ['skill1', 'pSkill1'], ['skill2', 'pSkill2'], ['sup', 'pSup']
        ];
        for (var i = 0; i < pairs.length; i++) {
          var code = m[pairs[i][0]];
          s[pairs[i][0]] = !!raw[code];
          s[pairs[i][1]] = !!rawPressed[code];
        }
        // 双击方向 → 冲刺
        s.pDash = 0;
        for (var d = 0; d < 2; d++) {
          var dir = d === 0 ? 'left' : 'right';
          var field = dir === 'left' ? 'pLeft' : 'pRight';
          if (s[field]) {
            if (tick - lastTap[p][dir] <= 14) s.pDash = dir === 'left' ? -1 : 1;
            lastTap[p][dir] = tick;
          }
        }
      }
    },

    clearEdges: function () { rawPressed = {}; },

    /* 菜单用：消费某个按键的"按下"边沿 */
    consumePressed: function (code) {
      if (rawPressed[code]) { delete rawPressed[code]; return true; }
      return false;
    },

    isDown: function (code) { return !!raw[code]; },

    /* 触屏/外部注入：模拟按键状态变化（手机虚拟按键用） */
    setKey: function (code, down) {
      down = !!down;
      if (down) {
        if (NL.SFX && NL.SFX.init) NL.SFX.init();
        if (!raw[code]) rawPressed[code] = true;
        raw[code] = true;
      } else {
        raw[code] = false;
      }
    }
  };
})();
