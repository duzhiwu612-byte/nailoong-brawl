/* 奶龙大乱斗 - 联机对战（PeerJS 云信令 + WebRTC P2P 数据通道 + 输入锁步）
   房主注册房间 nlbrawl-<code>-h；加入方输入 4 位房间码直连。
   锁步模型：双方各自提前 5 帧采样本地输入并互发，凑齐后一起执行同一帧（帧同步）。
   联机组件（peerjs）只在进入联机时从 CDN 按需加载；核心游戏依旧零依赖。 */
var NL = window.NL = window.NL || {};
(function () {
  'use strict';

  var NET_VER = 1;
  var DELAY = 5;                                       // 输入延迟（帧）
  var CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混的 I O 0 1
  var CDN_LIST = [
    'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js',
    'https://fastly.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js',
    'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'
  ];
  var ICE = [
    { urls: 'stun:stun.miwifi.com:3478' },
    { urls: 'stun:stun.l.google.com:19302' }
  ];

  /* ================= 输入采样器：键盘/触屏按键 → 位掩码 =================
     bit0-3 方向按住 · bit4 跳 · bit5-9 轻/重/技1/技2/必杀（边沿）· bit10-11 虚步 */
  function makeSampler() {
    var prev = {};
    var sTick = 0;
    var tapAt = { left: -999, right: -999 };
    function edge(code, cur) { var was = !!prev[code]; prev[code] = cur; return cur && !was; }
    return {
      sample: function () {
        sTick++;
        var I = NL.Input;
        var left = I.isDown('KeyA'), right = I.isDown('KeyD'),
          up = I.isDown('KeyW'), down = I.isDown('KeyS');
        var m = 0;
        if (left) m |= 1;
        if (right) m |= 2;
        if (up) m |= 4;
        if (down) m |= 8;
        if (edge('KeyW', up)) m |= 16;
        if (edge('KeyJ', I.isDown('KeyJ'))) m |= 32;
        if (edge('KeyK', I.isDown('KeyK'))) m |= 64;
        if (edge('KeyL', I.isDown('KeyL'))) m |= 128;
        if (edge('KeyU', I.isDown('KeyU'))) m |= 256;
        if (edge('KeyI', I.isDown('KeyI'))) m |= 512;
        if (edge('KeyA', left)) {
          if (sTick - tapAt.left <= 14) m |= 1024;      // 双击左 → 虚步
          tapAt.left = sTick;
        }
        if (edge('KeyD', right)) {
          if (sTick - tapAt.right <= 14) m |= 2048;     // 双击右 → 虚步
          tapAt.right = sTick;
        }
        return m;
      }
    };
  }

  function decodeMask(m) {
    m = m | 0;
    var dy = (m >> 10) & 3;
    return {
      left: !!(m & 1), right: !!(m & 2), up: !!(m & 4), down: !!(m & 8),
      light: false, heavy: false, skill1: false, skill2: false, sup: false,
      pLeft: false, pRight: false, pUp: !!(m & 16), pDown: false,
      pLight: !!(m & 32), pHeavy: !!(m & 64), pSkill1: !!(m & 128),
      pSkill2: !!(m & 256), pSup: !!(m & 512),
      pDash: (dy === 1) ? -1 : ((dy === 2) ? 1 : 0)
    };
  }

  /* ================= 联机核心（可多实例，测试用） ================= */
  function NetCore() {
    this.state = 'idle';   // idle|loading|hosting|joining|connected|battle|closed|error
    this.isHost = false;
    this.code = '';
    this.err = '';
    this.peer = null;
    this.conn = null;
    this.onEvent = null;
    this.picks = [null, null];
    this.wantRematch = false;
    this._remoteRematch = false;
    this._started = false;
    this._libLoading = false;
    this._libCbs = [];
    this._frame = 0;
    this._local = {};
    this._remote = {};
    this._sampleUntil = -1;
    this._sampler = null;
    this._samplerOverride = null;
    this._netIn = [0, 0];
  }

  NetCore.prototype._emit = function (ev, data) {
    if (typeof this.onEvent === 'function') { try { this.onEvent(ev, data); } catch (e) {} }
  };
  NetCore.prototype._send = function (obj) {
    try { if (this.conn) this.conn.send(obj); } catch (e) {}
  };
  NetCore.prototype.makeCode = function () {
    var s = '';
    for (var i = 0; i < 4; i++) s += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
    return s;
  };

  NetCore.prototype.loadLib = function (cb) {
    var self = this;
    if (window.Peer) { cb(null); return; }
    this._libCbs.push(cb);
    if (this._libLoading) return;
    this._libLoading = true;
    var idx = 0;
    function tryLoad() {
      if (idx >= CDN_LIST.length) {
        self._libLoading = false;
        var cbs = self._libCbs; self._libCbs = [];
        for (var i = 0; i < cbs.length; i++) { try { cbs[i]('联机组件加载失败，请检查网络后重试'); } catch (e) {} }
        return;
      }
      var s = document.createElement('script');
      s.src = CDN_LIST[idx++];
      s.onload = function () {
        self._libLoading = false;
        var cbs = self._libCbs; self._libCbs = [];
        for (var i = 0; i < cbs.length; i++) { try { cbs[i](null); } catch (e) {} }
      };
      s.onerror = function () { try { s.remove(); } catch (e) {} tryLoad(); };
      document.head.appendChild(s);
    }
    tryLoad();
  };

  NetCore.prototype._makePeer = function (id, onOpen, onError) {
    var peer = new window.Peer(id || undefined, { debug: 1, config: { iceServers: ICE } });
    this.peer = peer;
    peer.on('open', function () { onOpen(peer); });
    peer.on('error', function (e) { onError((e && e.type) || 'unknown', e); });
    peer.on('disconnected', function () { try { peer.reconnect(); } catch (e2) {} });
    return peer;
  };

  NetCore.prototype._failRaw = function (msg) {
    this.state = 'error';
    this.err = msg;
    this._emit('error');
    this._closeQuiet();
  };
  NetCore.prototype._fail = function (t) {
    var msg = (t === 'peer-unavailable') ? '房间不存在或已过期，请检查房间码'
      : (t === 'browser-incompatible') ? '当前浏览器不支持联机（需要 WebRTC）'
        : (t === 'network' || t === 'server-error') ? '连接联机服务器失败（网络受限）'
          : ('联机出错：' + t);
    this._failRaw(msg);
  };

  NetCore.prototype.supported = function () {
    return !!(window.RTCPeerConnection || window.webkitRTCPeerConnection);
  };

  NetCore.prototype.host = function (fixedCode) {
    var self = this;
    if (this.state !== 'idle' && this.state !== 'error') return;
    if (!this.supported()) { this._failRaw('当前浏览器不支持联机（需要 WebRTC）'); return; }
    this.isHost = true;
    this._fixedCode = String(fixedCode || '').toUpperCase();
    this.state = 'loading';
    this.err = '';
    this.loadLib(function (err) {
      if (err) { self._failRaw(err); return; }
      self._hostTry(4);
    });
  };

  NetCore.prototype._hostTry = function (left) {
    var self = this;
    if (left <= 0) { this._failRaw('创建房间失败，请稍后再试'); return; }
    var code = this._fixedCode || this.makeCode();
    var opened = false;
    this._makePeer('nlbrawl-' + code.toLowerCase() + '-h', function (peer) {
      opened = true;
      self.code = code;
      self.state = 'hosting';
      self._emit('state');
      peer.on('connection', function (conn) {
        conn.on('open', function () {});
        self._bind(conn);
      });
    }, function (t) {
      if (!opened && t === 'unavailable-id') {
        try { self.peer.destroy(); } catch (e) {}
        self._hostTry(left - 1);
      } else if (!opened && (t === 'network' || t === 'server-error')) {
        self._fail(t);
      } else {
        self._fail(t);
      }
    });
  };

  NetCore.prototype.join = function (code) {
    var self = this;
    if (this.state !== 'idle' && this.state !== 'error') return;
    if (!this.supported()) { this._failRaw('当前浏览器不支持联机（需要 WebRTC）'); return; }
    this.isHost = false;
    this.code = String(code || '').toUpperCase();
    this.state = 'loading';
    this.err = '';
    this.loadLib(function (err) {
      if (err) { self._failRaw(err); return; }
      var tries = 5;
      function tryJoin() {
        var opened = false;
        self._makePeer(null, function (peer) {
          opened = true;
          self.state = 'joining';
          self._emit('state');
          var conn;
          try {
            conn = peer.connect('nlbrawl-' + self.code.toLowerCase() + '-h', { reliable: true, serialization: 'json' });
          } catch (e) { self._failRaw('连接失败：' + e.message); return; }
          conn.on('open', function () { self._bind(conn); });
          var t0 = Date.now();
          peer.on('error', function (e) {
            var t = (e && e.type) || '';
            if (t === 'peer-unavailable' && !self.conn) {
              if (Date.now() - t0 < 15000 && tries-- > 0) {
                try { peer.destroy(); } catch (er) {}
                setTimeout(tryJoin, 1500);
              } else if (!self.conn) {
                self._failRaw('房间不存在或已过期，请检查房间码');
              }
            }
          });
        }, function (t) {
          if (!opened && (t === 'network' || t === 'server-error')) { self._fail(t); return; }
          if (!opened) { setTimeout(tryJoin, 800); return; }
          self._fail(t);
        });
      }
      tryJoin();
    });
  };

  NetCore.prototype._bind = function (conn) {
    var self = this;
    this.conn = conn;
    conn.on('data', function (obj) { self._recv(obj); });
    conn.on('close', function () { self._closed(); });
    conn.on('error', function () {});
    this.err = '';
    if (this.isHost) this.state = 'connected';   // 等 hi 完成握手后 emit connected
    else this.state = 'connected';
    this._emit('state');
    if (!this.isHost) this._send({ t: 'hi', v: NET_VER });
  };

  NetCore.prototype._recv = function (obj) {
    if (!obj || typeof obj !== 'object') return;
    var t = obj.t;
    if (t === 'hi') {
      if (obj.v !== NET_VER) { this._failRaw('双方版本不一致，请都刷新到最新版'); return; }
      this._send({ t: 'hello', v: NET_VER });
      this._emit('connected');
    } else if (t === 'hello') {
      if (obj.v !== NET_VER) { this._failRaw('双方版本不一致，请都刷新到最新版'); return; }
      this._emit('connected');
    } else if (t === 'pick') {
      this.picks[this.isHost ? 1 : 0] = obj.c;
      this._emit('state');
      this._maybeStart();
    } else if (t === 'start') {
      this.picks[0] = obj.p1;
      this.picks[1] = obj.p2;
      this._started = true;
      this._emit('start');
    } else if (t === 'in') {
      this._remote[obj.f | 0] = obj.k | 0;
    } else if (t === 'rematch') {
      this._remoteRematch = true;
      this._emit('rematch');
    } else if (t === 'bye') {
      this._closed();
    }
  };

  NetCore.prototype.pick = function (cid) {
    this.picks[this.isHost ? 0 : 1] = cid;
    this._send({ t: 'pick', c: cid });
    this._maybeStart();
  };
  NetCore.prototype._maybeStart = function () {
    if (!this.isHost || this._started) return;
    if (this.picks[0] && this.picks[1]) {
      this._started = true;
      this._send({ t: 'start', p1: this.picks[0], p2: this.picks[1] });
      this._emit('start');
    }
  };
  NetCore.prototype.resetPicks = function () {
    this.picks = [null, null];
    this.wantRematch = false;
    this._remoteRematch = false;
    this._started = false;
  };
  NetCore.prototype.requestRematch = function () {
    this.wantRematch = true;
    this._send({ t: 'rematch' });
    return !!this._remoteRematch;
  };

  NetCore.prototype.quit = function () {
    try { this._send({ t: 'bye' }); } catch (e) {}
    this._closeQuiet();
    this.state = 'idle';
    this._emit('state');
  };
  NetCore.prototype._closeQuiet = function () {
    try { if (this.conn) this.conn.close(); } catch (e) {}
    try { if (this.peer) this.peer.destroy(); } catch (e) {}
    this.conn = null;
    this.peer = null;
  };
  NetCore.prototype._closed = function () {
    if (this.state === 'closed' || this.state === 'idle') return;
    this._closeQuiet();
    this.state = 'closed';
    this._emit('closed');
  };
  NetCore.prototype.reset = function () {
    this._closeQuiet();
    this.state = 'idle';
    this.err = '';
    this.isHost = false;
    this.code = '';
    this.resetPicks();
    this._frame = 0;
    this._local = {};
    this._remote = {};
    this._sampleUntil = -1;
  };

  /* ================= 战斗锁步驱动 ================= */
  NetCore.prototype.battleInit = function (b) {
    var self = this;
    this.state = 'battle';
    this._frame = 0;
    this._local = {};
    this._remote = {};
    this._sampleUntil = -1;
    this._sampler = makeSampler();
    this.wantRematch = false;
    this._remoteRematch = false;
    this._started = true;
    for (var f = 0; f < DELAY; f++) { this._local[f] = 0; this._remote[f] = 0; }   // 预填中立输入
    this._netIn = [0, 0];
    b._netIn = this._netIn;
    b.inputFor = function (f) { return decodeMask(self._netIn[f.playerIndex] | 0); };
    this._emit('state');
  };

  /* 每个逻辑帧调用一次：采样并发送未来帧输入；凑齐双方输入后推进一帧 */
  NetCore.prototype.step = function (b) {
    if (this.state !== 'battle' || !this.conn || !b) return false;
    var F = this._frame;
    if (F + DELAY > this._sampleUntil) {
      var k = this._samplerOverride ? (this._samplerOverride() | 0) : this._sampler.sample();
      this._local[F + DELAY] = k;
      this._send({ t: 'in', f: F + DELAY, k: k });
      this._sampleUntil = F + DELAY;
    }
    if (!(F in this._local) || !(F in this._remote)) return false;
    var lm = this._local[F] | 0, rm = this._remote[F] | 0;
    this._netIn[0] = this.isHost ? lm : rm;
    this._netIn[1] = this.isHost ? rm : lm;
    delete this._local[F];
    delete this._remote[F];
    b.update();
    this._frame++;
    return true;
  };

  /* ================= 测试专用：内存假链路（同步投递） ================= */
  NetCore.prototype._linkFake = function (other) {
    this.conn = {
      send: function (obj) { other._recv(JSON.parse(JSON.stringify(obj))); },
      close: function () {},
      _fake: true
    };
  };

  /* ================= 导出 ================= */
  NL.NetCore = NetCore;
  NL.netUtil = { decodeMask: decodeMask, makeSampler: makeSampler, DELAY: DELAY, NET_VER: NET_VER };
  NL.Net = new NetCore();
})();
