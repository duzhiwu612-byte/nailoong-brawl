/* 奶龙大乱斗 - 音效模块（全部用 Web Audio 代码合成，无需任何素材文件） */
var NL = window.NL = window.NL || {};
(function () {
  'use strict';

  var S = NL.SFX = {
    ctx: null,
    master: null,
    ready: false,
    muted: false
  };

  S.init = function () {
    if (S.ready) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      S.ctx = new AC();
      S.master = S.ctx.createGain();
      S.master.gain.value = S.muted ? 0 : 0.5;
      S.master.connect(S.ctx.destination);
      S.ready = true;
    } catch (e) { /* 无音频环境（如自动化测试）时保持静默 */ }
  };

  S.resume = function () {
    try { if (S.ctx && S.ctx.state === 'suspended') S.ctx.resume(); } catch (e) {}
  };

  S.toggleMute = function () {
    S.muted = !S.muted;
    if (S.master) S.master.gain.value = S.muted ? 0 : 0.5;
    return S.muted;
  };

  function tone(opt) {
    if (!S.ctx) return;
    var c = S.ctx, t = c.currentTime + (opt.delay || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = opt.type || 'sine';
    o.frequency.setValueAtTime(opt.f0, t);
    if (opt.f1 && opt.f1 !== opt.f0) {
      o.frequency.exponentialRampToValueAtTime(Math.max(1, opt.f1), t + opt.dur);
    }
    var vol = opt.vol || 0.3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (opt.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + opt.dur);
    o.connect(g); g.connect(S.master);
    o.start(t); o.stop(t + opt.dur + 0.03);
  }

  function noise(opt) {
    if (!S.ctx) return;
    var c = S.ctx, t = c.currentTime + (opt.delay || 0);
    var dur = opt.dur || 0.1;
    var len = Math.max(1, Math.floor(c.sampleRate * dur));
    var buf = c.createBuffer(1, len, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = c.createBufferSource(); src.buffer = buf;
    var f = c.createBiquadFilter();
    f.type = opt.ftype || 'bandpass';
    f.frequency.setValueAtTime(opt.f0 || 1000, t);
    if (opt.f1) f.frequency.exponentialRampToValueAtTime(Math.max(1, opt.f1), t + dur);
    f.Q.value = opt.q || 1;
    var g = c.createGain();
    g.gain.setValueAtTime(opt.vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(S.master);
    src.start(t); src.stop(t + dur + 0.03);
  }

  var RECIPES = {
    swing: function () { noise({ ftype: 'bandpass', f0: 1600, f1: 500, dur: 0.08, vol: 0.14, q: 1.2 }); },
    hit: function () {
      tone({ type: 'triangle', f0: 220, f1: 60, dur: 0.1, vol: 0.5 });
      noise({ ftype: 'highpass', f0: 900, dur: 0.06, vol: 0.22 });
    },
    hitBig: function () {
      tone({ type: 'sine', f0: 150, f1: 40, dur: 0.2, vol: 0.7 });
      noise({ ftype: 'lowpass', f0: 700, dur: 0.12, vol: 0.3 });
    },
    block: function () { tone({ type: 'square', f0: 950, f1: 700, dur: 0.06, vol: 0.15 }); },
    clash: function () {
      tone({ type: 'square', f0: 1500, f1: 950, dur: 0.05, vol: 0.16 });
      tone({ type: 'square', f0: 2050, f1: 1350, dur: 0.08, vol: 0.12, delay: 0.02 });
      noise({ ftype: 'highpass', f0: 2600, dur: 0.05, vol: 0.12 });
    },
    jump: function () { tone({ type: 'sine', f0: 300, f1: 640, dur: 0.12, vol: 0.16 }); },
    land: function () { noise({ ftype: 'lowpass', f0: 320, dur: 0.08, vol: 0.25 }); },
    dash: function () { noise({ ftype: 'bandpass', f0: 600, f1: 2000, dur: 0.14, vol: 0.16 }); },
    duang: function () {
      tone({ type: 'sine', f0: 520, f1: 130, dur: 0.28, vol: 0.4 });
      tone({ type: 'sine', f0: 780, f1: 200, dur: 0.18, vol: 0.15, delay: 0.02 });
    },
    pop: function () { tone({ type: 'sine', f0: 620, f1: 980, dur: 0.07, vol: 0.2 }); },
    select: function () { tone({ type: 'square', f0: 520, f1: 520, dur: 0.05, vol: 0.12 }); },
    confirm: function () {
      tone({ type: 'triangle', f0: 620, f1: 940, dur: 0.09, vol: 0.25 });
      tone({ type: 'triangle', f0: 940, f1: 1250, dur: 0.1, vol: 0.2, delay: 0.08 });
    },
    back: function () { tone({ type: 'triangle', f0: 500, f1: 300, dur: 0.09, vol: 0.2 }); },
    ko: function () {
      tone({ type: 'sawtooth', f0: 520, f1: 60, dur: 0.65, vol: 0.4 });
      noise({ ftype: 'lowpass', f0: 500, dur: 0.5, vol: 0.25 });
    },
    laugh: function () {
      var f = [300, 270, 240, 210];
      for (var i = 0; i < 4; i++) {
        tone({ type: 'triangle', f0: f[i], f1: f[i] * 0.88, dur: 0.09, vol: 0.22, delay: i * 0.1 });
        noise({ ftype: 'bandpass', f0: 700, dur: 0.05, vol: 0.05, delay: i * 0.1 });
      }
    },
    win: function () {
      var notes = [523, 659, 784, 1046];
      for (var i = 0; i < notes.length; i++) {
        tone({ type: 'triangle', f0: notes[i], f1: notes[i], dur: 0.12, vol: 0.25, delay: i * 0.11 });
      }
    },
    countdown: function () { tone({ type: 'square', f0: 700, dur: 0.08, vol: 0.18 }); },
    superFlash: function () {
      tone({ type: 'sawtooth', f0: 900, f1: 200, dur: 0.35, vol: 0.3 });
      noise({ ftype: 'highpass', f0: 1500, dur: 0.3, vol: 0.2 });
    }
  };

  S.play = function (name) {
    if (!S.ctx) return;
    S.resume();
    var r = RECIPES[name];
    if (!r) return;
    try { r(); } catch (e) {}
  };
})();
