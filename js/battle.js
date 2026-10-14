/* 奶龙大乱斗 - 对战流程：回合、判定、HUD */
var NL = window.NL = window.NL || {};
(function () {
  'use strict';
  var U = NL.util;

  /* 投射物定义（音波 / 咖啡 / 激光 / 金币 / 小紫兵 / 冲击波） */
  var PROJ_DEFS = {
    note: { r: 30, speed: 300, damage: 30, hitstun: 18, kbx: 170, kvy: -60, life: 110, g: 0, blockable: true },
    coffee: { r: 19, speed: 400, damage: 38, hitstun: 16, kbx: 190, kvy: 0, life: 100, g: 500, blockable: true },
    laser: { r: 15, speed: 760, damage: 62, hitstun: 18, kbx: 260, kvy: -140, life: 80, g: 0, blockable: true },
    goldbeam: { r: 17, speed: 700, damage: 68, hitstun: 18, kbx: 260, kvy: -140, life: 80, g: 0, blockable: true },
    coin: { r: 15, speed: 430, damage: 34, hitstun: 14, kbx: 160, kvy: -120, life: 120, g: 640, blockable: true },
    minion: { r: 26, speed: 120, damage: 48, hitstun: 20, kbx: 220, kvy: -90, life: 170, g: 800, bounce: true, blockable: true },
    shockwave: { r: 36, speed: 340, damage: 45, hitstun: 20, kbx: 260, kvy: -150, life: 70, g: 0, blockable: true },
    /* —— 远程重击（K）与远程技能（U）专用 —— */
    riceball: { r: 16, speed: 520, damage: 58, hitstun: 18, kbx: 300, kvy: -180, life: 90, g: 85, blockable: true },
    bubble: { r: 32, speed: 265, damage: 72, hitstun: 20, kbx: 340, kvy: -220, life: 130, g: -12, blockable: true },
    chopstick: { r: 12, speed: 900, damage: 53, hitstun: 16, kbx: 240, kvy: -130, life: 70, g: 90, blockable: true },
    nunchaku: { r: 24, speed: 560, damage: 88, hitstun: 20, kbx: 380, kvy: -240, life: 150, g: 0, blockable: true, returns: 400 },
    laughball: { r: 26, speed: 305, damage: 62, hitstun: 20, kbx: 340, kvy: -230, life: 120, g: -20, blockable: true },
    laughwave: { r: 30, speed: 430, damage: 50, hitstun: 22, kbx: 180, kvy: -60, life: 95, g: 0, blockable: true, stun: 52 },
    keyboard: { r: 21, speed: 570, damage: 64, hitstun: 19, kbx: 330, kvy: -230, life: 105, g: 120, blockable: true },
    wok: { r: 25, speed: 500, damage: 92, hitstun: 20, kbx: 300, kvy: -270, life: 115, g: 105, blockable: true },
    rocketfist: { r: 19, speed: 720, damage: 64, hitstun: 19, kbx: 350, kvy: -210, life: 85, g: 0, blockable: true },
    rocket: { r: 15, speed: 640, damage: 55, hitstun: 15, kbx: 200, kvy: -140, life: 85, g: 0, blockable: true },
    shell: { r: 31, speed: 345, damage: 72, hitstun: 22, kbx: 430, kvy: -310, life: 130, g: 75, blockable: true },
    goldwave: { r: 34, speed: 520, damage: 69, hitstun: 20, kbx: 390, kvy: -250, life: 85, g: 0, blockable: true },
    /* —— 奶娃专属（v0.5 新角色）—— */
    milkbottle: { r: 17, speed: 495, damage: 56, hitstun: 18, kbx: 300, kvy: -200, life: 95, g: 120, blockable: true },
    pacifier: { r: 22, speed: 520, damage: 84, hitstun: 20, kbx: 370, kvy: -230, life: 150, g: 0, blockable: true, returns: 400 },
    /* v0.9.1 看笑了专属：手机（数值与奶瓶/奶嘴一一对应，仅外观不同） */
    phone: { r: 17, speed: 495, damage: 56, hitstun: 18, kbx: 300, kvy: -200, life: 95, g: 120, blockable: true },
    phonespin: { r: 22, speed: 520, damage: 84, hitstun: 20, kbx: 370, kvy: -230, life: 150, g: 0, blockable: true, returns: 400 },
    /* v0.9.2 看笑了必杀：旧手机山（天降）+ 爆机散落的碎屏旧机 */
    phonemountain: { r: 56, speed: 0, damage: 95, hitstun: 26, kbx: 420, kvy: -300, life: 220, g: 1700, blockable: true, prio: 2 },
    oldphone: { r: 15, speed: 250, damage: 15, hitstun: 14, kbx: 130, kvy: -170, life: 60, g: 900, blockable: true },
    /* v0.6 奶娃九形态专属弹道 */
    heart: { r: 22, speed: 470, damage: 62, hitstun: 18, kbx: 340, kvy: -260, life: 100, g: 40, blockable: true },
    darkorb: { r: 24, speed: 520, damage: 68, hitstun: 19, kbx: 360, kvy: -240, life: 95, g: 0, blockable: true },
    flame: { r: 24, speed: 540, damage: 74, hitstun: 20, kbx: 380, kvy: -230, life: 90, g: 0, blockable: true },
    blade: { r: 20, speed: 620, damage: 66, hitstun: 18, kbx: 330, kvy: -210, life: 85, g: 0, blockable: true },
    petal: { r: 20, speed: 560, damage: 60, hitstun: 18, kbx: 320, kvy: -250, life: 95, g: 20, blockable: true },
    voidorb: { r: 26, speed: 460, damage: 72, hitstun: 20, kbx: 370, kvy: -220, life: 110, g: 0, blockable: true },
    tear: { r: 19, speed: 540, damage: 63, hitstun: 18, kbx: 330, kvy: -240, life: 95, g: 60, blockable: true },
    /* ===== v0.12 新角色专属弹道 ===== */
    banana: { r: 15, speed: 430, damage: 30, hitstun: 14, kbx: 150, kvy: -50, life: 280, g: 900 },
    rollmelon: { r: 21, speed: 400, damage: 46, hitstun: 16, kbx: 230, kvy: -130, life: 155, g: 0 },
    giantbanana: { r: 58, speed: 0, damage: 92, hitstun: 24, kbx: 300, kvy: -300, life: 400, g: 1500, prio: 2 },
    laser: { r: 13, speed: 1500, damage: 52, hitstun: 16, kbx: 300, kvy: -60, life: 60, g: 0, prio: 2 },
    laser3: { r: 20, speed: 1450, damage: 62, hitstun: 18, kbx: 340, kvy: -80, life: 60, g: 0, prio: 3 },
    soundwave: { r: 16, speed: 250, damage: 40, hitstun: 15, kbx: 260, kvy: -40, life: 130, g: 0, grow: 0.55, prio: 1 },   // v0.12.1：普通优先级 → 与其它弹道互消
    screenwave: { r: 44, speed: 330, damage: 68, hitstun: 22, kbx: 360, kvy: -200, life: 200, g: 0, grow: 3.0, prio: 3, pierce: true },
    winebottle: { r: 15, speed: 660, damage: 44, hitstun: 15, kbx: 200, kvy: -80, life: 62, g: 0, rect: { w: 34, h: 118 } },   // v0.13：水平直飞＋加高命中框（不再从站立敌人身上穿过）
    chalk: { r: 12, speed: 1060, damage: 40, hitstun: 14, kbx: 220, kvy: -50, life: 115, g: 120 },   // v0.12.1：更平更远（天花板选手专属）
    eraser: { r: 17, speed: 470, damage: 50, hitstun: 16, kbx: 240, kvy: -90, life: 165, g: 0, returns: 300, prio: 2 },
    blackboard: { r: 70, speed: 0, damage: 96, hitstun: 26, kbx: 320, kvy: -260, life: 400, g: 1500, prio: 2 },
    firestrip: { r: 20, speed: 0, damage: 34, hitstun: 10, kbx: 60, kvy: 0, life: 52, g: 0, pierce: true, tick: 26, rect: { w: 780, h: 200 }, ignite: true },   // v0.13：更长更高（520→780 × 78→200）＋驻留灼烧（轻击退不倒地）
    /* ===== v0.13 新技能弹道 ===== */
    boardshield: { r: 64, speed: 0, damage: 24, hitstun: 18, kbx: 400, kvy: -180, life: 260, g: 0, prio: 3, pierce: true, tick: 55, follow: true, offset: 76, yOff: 92 },   // 黑板之盾（跟随持有者）
    smoke: { r: 34, speed: 0, damage: 12, hitstun: 8, kbx: 40, kvy: 0, life: 215, g: 0, prio: 3, noClash: true, pierce: true, tick: 30, rect: { w: 1500, h: 380 }, smoke: true },   // 大范围烟雾（不参与对撞，持续灼伤）
    phonepile: { r: 68, speed: 0, damage: 20, hitstun: 12, kbx: 270, kvy: -60, life: 470, g: 0, prio: 3, pierce: true, tick: 50 },                                          // 旧手机堆（残骸留场）
    rainbanana: { r: 15, speed: 26, damage: 34, hitstun: 14, kbx: 160, kvy: -70, life: 240, g: 950 },                                                                         // 香蕉雨
    bigfire: { r: 30, speed: 0, damage: 78, hitstun: 22, kbx: 300, kvy: -160, life: 62, g: 0, pierce: true, rect: { w: 720, h: 100 }, ignite: true, igniteAll: true, prio: 3 }
  };

  function Battle(cfg) {
    this.cfg = cfg;
    this.mode = cfg.mode || 'ai';
    this.stage = new NL.Stage('village');

    var s1 = { type: 'keyboard', player: 0 };
    var s2 = (this.mode === '2p' || this.mode === 'net') ? { type: 'keyboard', player: 1 } : new NL.AI(cfg.difficulty || 0);

    this.fighters = [
      new NL.Fighter({ charId: cfg.p1, playerIndex: 0, source: s1, x: 430, facing: 1 }),
      new NL.Fighter({ charId: cfg.p2, playerIndex: 1, source: s2, x: 850, facing: -1 })
    ];
    this.p1 = this.fighters[0];
    this.p2 = this.fighters[1];
    this.p1.battle = this;
    this.p2.battle = this;
    this.projectiles = [];
    this.cam = NL.camState();

    this.round = 1;
    this.wins = [0, 0];
    this.roundsToWin = 2;
    this.timer = 99 * 60;
    this.phase = 'intro';
    this.phaseT = 0;
    this.time = 0;
    this.hitstop = 0;
    this.slowT = 0;
    this.slowSkip = 0;
    this.paused = false;
    this.matchOver = false;
    this.winnerIdx = -1;
    this.announce = null;
    this.hazards = [];
    this.decoys = [];

    NL.FX.clear();
    this.setAnnounce('第 1 回合', '先干饭，再打架！', 100);
    NL.camUpdate(this.cam, this.p1, this.p2, true);
  }

  Battle.prototype.setAnnounce = function (text, sub, dur) {
    this.announce = { text: text, sub: sub || '', t: 0, dur: dur || 120 };
  };

  Battle.prototype.inputFor = function (f, opp) {
    if (f.source.type === 'keyboard') return NL.Input.pstate[f.source.player];
    return f.source.getState(f, opp, this);
  };

  Battle.prototype.update = function () {
    if (this.paused) return;

    // 慢动作
    if (this.slowT > 0) {
      this.slowT--;
      this.slowSkip = (this.slowSkip + 1) % 3;
      if (this.slowSkip !== 0) { NL.FX.update(); return; }
    }
    if (this.hitstop > 0) {
      this.hitstop--;
      NL.FX.update();
      return;
    }

    this.time++;
    this.phaseT++;
    if (this.announce) this.announce.t++;

    NL.Input.poll();
    var f1 = this.p1, f2 = this.p2;
    var lock = (this.phase !== 'fight');
    var inp1 = lock ? NL.EMPTY_INPUT : this.inputFor(f1, f2);
    var inp2 = lock ? NL.EMPTY_INPUT : this.inputFor(f2, f1);
    f1.update(f2, inp1);
    f2.update(f1, inp2);
    NL.Input.clearEdges();

    this.pushApart();
    this.resolveHits(f1, f2);
    this.resolveHits(f2, f1);
    this.updateProjectiles();
    this.updateHazards();
    this.updateDecoys();
    NL.camUpdate(this.cam, f1, f2);

    f1.hpGhost = U.approach(f1.hpGhost, f1.hp, 2.4);
    f2.hpGhost = U.approach(f2.hpGhost, f2.hp, 2.4);

    this.updatePhases();
    NL.FX.update();
  };

  Battle.prototype.pushApart = function () {
    var a = this.p1, b = this.p2;
    if (a.state === 'downed' || b.state === 'downed' || a.state === 'ko' || b.state === 'ko' || !a.onGround || !b.onGround) return;
    if (a.state === 'dash' || b.state === 'dash') return;   // 虚步可以穿过对手到其身后
    if (Math.abs(a.y - b.y) > 30) return;
    var minD = 54;
    var d = b.x - a.x;
    if (Math.abs(d) < minD) {
      var overlap = minD - Math.abs(d);
      var s = d >= 0 ? 1 : -1;
      a.x -= s * overlap / 2;
      b.x += s * overlap / 2;
      a.x = U.clamp(a.x, NL.WALL_L, NL.WALL_R);
      b.x = U.clamp(b.x, NL.WALL_L, NL.WALL_R);
    }
  };

  Battle.prototype.resolveHits = function (att, def) {
    if (this.phase !== 'fight') return;
    var hb = att.getHitbox();
    if (!hb) return;
    if (!def.canBeHit()) return;
    var hurt = def.getHurtbox();
    if (!U.aabb(hb.x, hb.y, hb.w, hb.h, hurt.x, hurt.y, hurt.w, hurt.h)) return;

    var m = att.move;
    att.hitCd = m.rehit ? m.rehit : 9999;
    var blocked = (def.state === 'block') && !m.unblockable;
    def.takeHit(att, m, blocked);

    var cx = (Math.max(hb.x, hurt.x) + Math.min(hb.x + hb.w, hurt.x + hurt.w)) / 2;
    var cy = (Math.max(hb.y, hurt.y) + Math.min(hb.y + hb.h, hurt.y + hurt.h)) / 2;

    if (blocked) {
      NL.FX.spawnBlock(cx, cy);
      NL.SFX.play('block');
      this.hitstop = Math.max(this.hitstop, 4);
      NL.FX.shake(3);
      NL.FX.text(cx, cy - 24, U.pick(['铛！', '挡住了！', '不疼！']), { size: 22, color: '#BFE9FF', dur: 34 });
    } else {
      var big = !!m.big;
      NL.FX.spawnHit(cx, cy, big);
      NL.SFX.play(big ? 'hitBig' : 'hit');
      this.hitstop = Math.max(this.hitstop, big ? 10 : 6);
      NL.FX.shake(big ? 11 : 5);
      if (big) {
        NL.FX.text(cx, cy - 56, U.pick(['duang!', '咣！', 'biang!']), { size: 30, color: '#FF9FDF', dur: 40 });
      }
      if (att.combo >= 2) {
        var word = att.combo >= 8 ? U.pick(['好残暴！', '这还是奶龙吗？！', '人间凶器！'])
          : att.combo >= 5 ? U.pick(['连击狂魔！', '太狠了！'])
            : U.pick(['好家伙！', '啪啪啪！', '打得好！']);
        NL.FX.text(cx, cy - 30, att.combo + ' 连击', { size: 30, color: '#FFE066' });
        if (att.combo % 3 === 0) NL.FX.text(cx, cy - 74, word, { size: 24, color: '#FF9FDF', dur: 42 });
      }
    }
  };

  /* ================= 投射物系统 ================= */
  Battle.prototype.spawnProjectile = function (o) {
    var def = PROJ_DEFS[o.type];
    if (!def) return;
    if (this.projectiles.length >= 36) return;   // v0.13：上限 20→36（香蕉雨 / 烟雾等大场面）
    var dir = (o.dir === undefined) ? 1 : o.dir;
    this.projectiles.push({
      type: o.type,
      def: def,
      owner: o.owner,
      x: o.x,
      y: o.y,
      vx: dir * def.speed,
      vy: o.vy || 0,
      r: def.r,
      life: def.life,
      t: 0,
      startX: o.x,
      phase: 1
    });
  };

  /* 旧手机山砸落：大震屏 + 四散爆机（碎屏旧机飞一地） */
  Battle.prototype.shatterMountain = function (p) {
    NL.FX.shake(15);
    var gy = Math.min(p.y, NL.GROUND - 60);
    for (var k = 0; k < 5; k++) {
      this.spawnProjectile({
        type: 'oldphone',
        x: p.x + (k - 2) * 42,
        y: gy,
        dir: (k % 2 === 0) ? 1 : -1,
        vy: -180 - (k % 3) * 70,
        owner: p.owner
      });
    }
    NL.FX.cue(p.x, gy - 10, 'poof', -1);
    NL.FX.cue(p.x + 30, gy - 4, 'poof', 1);
    // v0.13：留下手机堆——长时间占位、拦敌人攻击（不拦自己）、伤害触碰的敌人
    this.spawnProjectile({
      type: 'phonepile',
      x: U.clamp(p.x, NL.WALL_L + 90, NL.WALL_R - 90),
      y: NL.GROUND - 64,
      dir: 1, vy: 0, owner: p.owner
    });
  };

  Battle.prototype.updateProjectiles = function () {
    var ps = this.projectiles;
    for (var i = ps.length - 1; i >= 0; i--) {
      var p = ps[i], d = p.def;
      p.t++;
      p.life--;
      if (p.hitT) { for (var htk in p.hitT) { if (p.hitT[htk] > 0) p.hitT[htk]--; } }   // v0.13：驻留弹道再命中冷却
      if (d.grow) p.r += d.grow;     // v0.12：音波随距离变大
      p.vy += (d.g || 0) / 60;
      p.x += p.vx / 60;
      p.y += p.vy / 60;
      if (d.follow && p.owner) {     // v0.13：黑板之盾跟随持有者
        p.x = p.owner.x + p.owner.facing * (d.offset || 0);
        p.y = p.owner.y - (d.yOff || 92);
      }
      var dead = false;
      if (p.y > NL.GROUND - 4) {
        if (d.bounce) {
          p.y = NL.GROUND - 4;
          p.vy = -Math.abs(p.vy) * 0.65;
        } else if (p.type === 'banana' || p.type === 'rainbanana') {
          this.spawnHazard({ type: 'banana', x: p.x, owner: p.owner });
          NL.FX.cue(p.x, p.y - 8, 'poof', 1);
          dead = true;
        } else if (p.type === 'winebottle') {
          this.shatterBottle(p, p.x);
          dead = true;
        } else if (p.type === 'giantbanana') {
          this.shatterGiantBanana(p, p.x);
          dead = true;
        } else {
          var cmap = {
            coffee: 'splash', wok: 'splash', note: 'note', laughball: 'note', laughwave: 'note',
            coin: 'gold', goldbeam: 'gold', goldwave: 'gold',
            rocketfist: 'flame', rocket: 'flame', bubble: 'poof',
            heart: 'poof', darkorb: 'poof', flame: 'flame', blade: 'poof',
            petal: 'poof', voidorb: 'poof', tear: 'splash', milkbottle: 'poof', pacifier: 'poof',
            phone: 'poof', phonespin: 'poof', phonemountain: 'poof', oldphone: 'poof'
          };
          if (p.type === 'phonemountain') this.shatterMountain(p);
          NL.FX.cue(p.x, p.y - 6, cmap[p.type] || 'poof', Math.sign(p.vx) || 1);
          dead = true;
        }
      }
      // 回旋镖（双截棍）：飞出一定距离后折返
      if (d.returns && p.phase === 1 && Math.abs(p.x - p.startX) >= d.returns) {
        p.phase = 2;
        p.vx = -p.vx;
      }
      if (d.returns && p.phase === 2 && Math.abs(p.x - p.startX) < 46) dead = true;
      if (p.x < NL.WALL_L - 80 || p.x > NL.WALL_R + 80) {
        if (p.type === 'winebottle') this.burstBottle(p);   // v0.12.1：撞墙也炸开
        dead = true;
      }
      if (p.life <= 0) {
        if (p.type === 'winebottle') this.burstBottle(p);   // v0.12.1：抵达距离终点 → 炸开留水渍
        dead = true;
      }
      if (dead) { ps.splice(i, 1); continue; }

      for (var fI = 0; fI < this.fighters.length; fI++) {
        var def = this.fighters[fI];
        if (def === p.owner || !def.canBeHit()) continue;
        if (d.pierce && p.hitSet && p.hitSet[fI]) {
          if (d.tick && p.hitT && (p.hitT[fI] || 0) <= 0) { /* v0.13：冷却结束允许再次命中 */ }
          else continue;
        }
        var hurt = def.getHurtbox();
        var cx = U.clamp(p.x, hurt.x, hurt.x + hurt.w);
        var cy = U.clamp(p.y, hurt.y, hurt.y + hurt.h);
        var overlap;
        if (d.rect) {          // v0.12：矩形判定（火柱 / 音波墙）
          var rw = d.rect.w / 2, rh = d.rect.h / 2;
          overlap = (hurt.x < p.x + rw && hurt.x + hurt.w > p.x - rw &&
                     hurt.y < p.y + rh && hurt.y + hurt.h > p.y - rh);
        } else {
          var ddx = p.x - cx, ddy = p.y - cy;
          overlap = (ddx * ddx + ddy * ddy <= (p.r + 4) * (p.r + 4));
        }
        if (overlap) {
          var blocked = (def.state === 'block') && d.blockable !== false;
          def.takeHit(p.owner, { damage: d.damage, hitstun: d.hitstun, blockstun: 8, kbx: d.kbx, kvy: d.kvy, deepStun: d.stun }, blocked);
          if (blocked) {
            NL.FX.spawnBlock(p.x, p.y);
            NL.SFX.play('block');
          } else {
            NL.FX.spawnHit(p.x, p.y, d.damage >= 60);
            NL.SFX.play(d.damage >= 60 ? 'hitBig' : 'hit');
            if (p.owner && p.owner.combo >= 2) {
              NL.FX.text(p.x, p.y - 40, p.owner.combo + ' 连击', { size: 26, color: '#FFE066' });
            }
          }
          this.hitstop = Math.max(this.hitstop, d.damage >= 60 ? 6 : 4);
          NL.FX.shake(4);
          if (p.type === 'winebottle') this.shatterBottle(p, cx);
          if (p.type === 'giantbanana') this.shatterGiantBanana(p, cx);
          if (d.pierce) {        // 穿透型：记名后继续飞
            if (!p.hitSet) p.hitSet = {};
            p.hitSet[fI] = 1;
            if (d.tick) { if (!p.hitT) p.hitT = {}; p.hitT[fI] = d.tick; }   // v0.13：驻留弹道再命中冷却
          } else {
            if (p.type === 'phonemountain') this.shatterMountain(p);
            ps.splice(i, 1);
          }
          break;
        }
      }
      // v0.12：火柱点燃水渍
      if (d.ignite) {
        var hazL = this.hazards || [];
        for (var hi2 = 0; hi2 < hazL.length; hi2++) {
          var hh2 = hazL[hi2];
          if (hh2.type !== 'puddle' || hh2.burning) continue;
          if (d.igniteAll || Math.abs(hh2.x - p.x) < d.rect.w / 2 + 40) {
            hh2.burning = true;
            hh2.burnT = 220;
            NL.FX.cue(hh2.x, hh2.y - 24, 'flame', 1);
            NL.FX.cue(hh2.x - 18, hh2.y - 32, 'flame', -1);
            NL.SFX.play('flame');
          }
        }
      }
    }

    /* —— 弹道对撞：双方弹道相遇互相抵消（prio 高的吃掉 prio 低的） —— */
    if (ps.length > 1) {
      var clashed = false;
      for (var ci = ps.length - 1; ci >= 0; ci--) {
        var cp = ps[ci];
        if (cp.gone) continue;
        for (var cj = ci - 1; cj >= 0; cj--) {
          var cq = ps[cj];
          if (cq.gone || cq.owner === cp.owner) continue;
          if (cp.def.noClash || cq.def.noClash) continue;   // v0.13：烟雾等不参与对撞
          var mdx = cp.x - cq.x, mdy = cp.y - cq.y;
          var mrr = (cp.r + cq.r) * 0.92;
          if (mdx * mdx + mdy * mdy > mrr * mrr) continue;
          var mx = (cp.x + cq.x) / 2, my = (cp.y + cq.y) / 2;
          var cpi = cp.def.prio || 1, cqi = cq.def.prio || 1;
          if (cpi > cqi) cq.gone = true;
          else if (cqi > cpi) cp.gone = true;
          else { cp.gone = true; cq.gone = true; }
          NL.FX.cue(mx, my, 'poof', (cp.x >= cq.x) ? 1 : -1);
          NL.FX.cue(mx, my + 14, 'poof', (cp.x >= cq.x) ? -1 : 1);
          NL.SFX.play('clash');
          this.hitstop = Math.max(this.hitstop, 2);
          NL.FX.shake(3);
          clashed = true;
          if (cp.gone) break;
        }
      }
      if (clashed) {
        for (var ck = ps.length - 1; ck >= 0; ck--) {
          if (ps[ck].gone) ps.splice(ck, 1);
        }
      }
    }

    /* v0.13：烟雾遇火 → 更大范围爆炸（火与烟同归于尽，范围伤害） */
    for (var si2 = ps.length - 1; si2 >= 0; si2--) {
      var sp2 = ps[si2];
      if (sp2.type !== 'smoke' || sp2.boomed) continue;
      var touched = false;
      for (var fj2 = 0; fj2 < ps.length; fj2++) {
        var fp2 = ps[fj2];
        if (fp2 === sp2) continue;
        if (fp2.type === 'firestrip' && Math.abs(fp2.x - sp2.x) < 820) { fp2.gone = true; touched = true; }
      }
      var haz3 = this.hazards || [];
      for (var hj3 = 0; hj3 < haz3.length; hj3++) {
        if (haz3[hj3].type === 'puddle' && haz3[hj3].burning && Math.abs(haz3[hj3].x - sp2.x) < 820) touched = true;
      }
      if (touched) this.smokeBoom(sp2);
    }
    for (var sk2 = ps.length - 1; sk2 >= 0; sk2--) { if (ps[sk2].gone) ps.splice(sk2, 1); }
  };

  /* v0.13：烟雾遇火 → 更大范围爆炸 */
  Battle.prototype.smokeBoom = function (p) {
    p.boomed = true;
    p.gone = true;
    var x = p.x;
    NL.FX.flash(10, '#FFD9A0');
    NL.FX.shake(20);
    NL.SFX.play('hitBig');
    NL.FX.cue(x, NL.GROUND - 120, 'poof', 1);
    for (var k = 0; k < 9; k++) {
      var ang = k * 0.7;
      NL.FX.cue(x + Math.cos(ang) * (60 + k * 26), NL.GROUND - 70 - Math.abs(Math.sin(ang)) * 130, 'flame', 1);
    }
    for (var fI = 0; fI < this.fighters.length; fI++) {
      var f = this.fighters[fI];
      if (f === p.owner || !f.canBeHit()) continue;
      if (Math.abs(f.x - x) < 560) {
        f.takeHit(p.owner, { damage: 88, hitstun: 26, blockstun: 10, kbx: 480, kvy: -330 });
        NL.FX.text(f.x, f.y - 175, '轰！！！', { size: 36, color: '#FF9F67', dur: 64 });
      }
    }
  };

  /* 旧手机造型（碎屏 / 亮屏笑脸两版）——旧手机山与爆机散落共用 */
  function drawOldPhoneShape(ctx, tint, lit) {
    ctx.fillStyle = tint;
    ctx.strokeStyle = '#4A4038';
    ctx.lineWidth = 2.5;
    U.roundRectPath(ctx, -13, -22, 26, 44, 5);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = lit ? '#FFF6D8' : '#D9D3C2';
    U.roundRectPath(ctx, -10, -17, 20, 30, 3);
    ctx.fill();
    if (lit) {
      ctx.strokeStyle = '#4A3410';
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(-6, -8); ctx.quadraticCurveTo(-4, -11, -2, -8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, -8); ctx.quadraticCurveTo(4, -11, 6, -8); ctx.stroke();
      ctx.fillStyle = '#7A4A2B';
      ctx.beginPath(); ctx.arc(0, -1, 4.5, 0.25, Math.PI - 0.25); ctx.closePath(); ctx.fill();
    } else {
      ctx.strokeStyle = '#6A6056';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-8, -13); ctx.lineTo(-2, -5); ctx.lineTo(-7, 1); ctx.lineTo(-3, 9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(3, -8); ctx.lineTo(8, -2); ctx.lineTo(4, 6);
      ctx.stroke();
    }
    ctx.fillStyle = '#5A5046';
    ctx.beginPath(); ctx.arc(0, 17.5, 2.2, 0, 6.3); ctx.fill();
    ctx.fillRect(-5, -20.5, 10, 2);
  }

  Battle.prototype.drawProjectiles = function (ctx) {
    var ps = this.projectiles;
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      ctx.save();
      ctx.translate(p.x, p.y);
      var dir = p.vx >= 0 ? 1 : -1;
      if (this.drawProjExtra(ctx, p, dir)) { ctx.restore(); continue; }
      if (p.type === 'note') {
        ctx.strokeStyle = '#FF9FDF';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, 22 + Math.sin(p.t * 0.3) * 3, 0, 6.3);
        ctx.stroke();
        ctx.fillStyle = '#FF9FDF';
        ctx.font = '900 22px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('齁', 0, 1);
      } else if (p.type === 'coffee') {
        ctx.fillStyle = '#8A5A3B';
        ctx.beginPath(); ctx.arc(0, 0, 14, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#B4795A';
        ctx.beginPath(); ctx.arc(-4 * dir, -3, 6, 0, 6.3); ctx.fill();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#8A5A3B';
        ctx.beginPath(); ctx.arc(-18 * dir, -6, 5, 0, 6.3); ctx.fill();
        ctx.beginPath(); ctx.arc(-30 * dir, -12, 3.5, 0, 6.3); ctx.fill();
        ctx.globalAlpha = 1;
      } else if (p.type === 'laser' || p.type === 'goldbeam') {
        var col = (p.type === 'laser') ? '#FF6B9D' : '#FFD93B';
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = col;
        U.ellipse(ctx, -22 * dir, 0, 20, 6);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = col;
        U.ellipse(ctx, 0, 0, 28, 9);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        U.ellipse(ctx, 2 * dir, 0, 15, 4);
        ctx.fill();
      } else if (p.type === 'coin') {
        ctx.rotate(p.t * 0.2);
        ctx.fillStyle = '#FFD93B';
        ctx.strokeStyle = '#B98A2A';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 13, 0, 6.3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#B98A2A';
        ctx.font = '900 15px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('¥', 0, 1);
      } else if (p.type === 'minion') {
        var wob = Math.sin(p.t * 0.3) * 2;
        ctx.fillStyle = '#9B7BD4';
        ctx.strokeStyle = '#5A4A8A';
        ctx.lineWidth = 3;
        U.ellipse(ctx, 0, 0, 21, 19);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-8, -14); ctx.lineTo(-13, -26); ctx.lineTo(-1, -17);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(8, -14); ctx.lineTo(13, -24); ctx.lineTo(2, -17);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(7, -3 + wob * 0.2, 5.5, 0, 6.3); ctx.fill();
        ctx.beginPath(); ctx.arc(-4, -3 + wob * 0.2, 4.5, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#3A2C14';
        ctx.beginPath(); ctx.arc(8, -3 + wob * 0.2, 2.6, 0, 6.3); ctx.fill();
        ctx.beginPath(); ctx.arc(-3, -3 + wob * 0.2, 2.2, 0, 6.3); ctx.fill();
      } else if (p.type === 'shockwave') {
        ctx.strokeStyle = '#FFD93B';
        ctx.lineWidth = 7;
        ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.3); ctx.stroke();
        ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.arc(0, 0, p.r * 0.6, 0, 6.3); ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (p.type === 'riceball') {
        ctx.rotate(p.t * 0.12);
        ctx.fillStyle = '#FFFDF4';
        ctx.strokeStyle = '#8A7A5A';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, 6.3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#39424E';
        U.roundRectPath(ctx, -7, -5, 14, 11, 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath(); ctx.arc(-5, -7, 4, 0, 6.3); ctx.fill();
      } else if (p.type === 'bubble') {
        var wobB = 1 + Math.sin(p.t * 0.25) * 0.06;
        ctx.scale(wobB, wobB);
        ctx.globalAlpha = 0.68;
        ctx.fillStyle = '#9FDCFF';
        ctx.strokeStyle = '#5CA8D8';
        ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.arc(0, 0, 30, 0, 6.3); ctx.fill(); ctx.stroke();
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(-9, -10, 10, 0, 6.3); ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (p.type === 'chopstick') {
        ctx.rotate(p.t * 0.5);
        ctx.fillStyle = '#C08A50';
        ctx.strokeStyle = '#7A5230';
        ctx.lineWidth = 2.5;
        for (var csi = 0; csi < 2; csi++) {
          U.roundRectPath(ctx, -26, -8 + csi * 10, 52, 6, 3);
          ctx.fill(); ctx.stroke();
        }
      } else if (p.type === 'nunchaku') {
        ctx.rotate(p.t * 0.35);
        ctx.strokeStyle = '#8A5A3B';
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-4, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(22, 0); ctx.stroke();
        ctx.fillStyle = '#B98A5A';
        ctx.strokeStyle = '#7A5230';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, 6.3); ctx.fill(); ctx.stroke();
        ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.arc(0, 0, 26 + Math.sin(p.t * 0.4) * 3, 0, 6.3); ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (p.type === 'milkbottle') {
        ctx.rotate(p.t * 0.28);
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#B98A5A';
        ctx.lineWidth = 3;
        U.roundRectPath(ctx, -10, -14, 20, 25, 6);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFE9B8';
        U.roundRectPath(ctx, -8, -4, 16, 14, 4);
        ctx.fill();
        ctx.fillStyle = '#F2B6C6';
        ctx.beginPath(); ctx.arc(0, -17, 5.5, 0, 6.3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(180,150,110,0.75)';
        for (var mbi = 0; mbi < 3; mbi++) ctx.fillRect(3, -9 + mbi * 6, 5, 1.6);
      } else if (p.type === 'pacifier') {
        ctx.rotate(p.t * 0.4);
        ctx.fillStyle = '#FFB6CE';
        ctx.strokeStyle = '#D87A9C';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 13, 0, 6.3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFE6EF';
        ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#FFD060';
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, 6.3); ctx.fill();
        ctx.strokeStyle = 'rgba(255,182,206,0.65)';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath(); ctx.arc(0, 0, 22 + Math.sin(p.t * 0.5) * 3, 0, 6.3); ctx.stroke();
        ctx.setLineDash([]);
      } else if (p.type === 'phone' || p.type === 'phonespin') {
        // 手机：深色机身 + 屏幕大笑脸（回旋版转更快 + 虚线光环提示会折返）
        ctx.rotate(p.t * ((p.type === 'phonespin') ? 0.5 : 0.3));
        ctx.fillStyle = '#37474F';
        ctx.strokeStyle = '#1D262B';
        ctx.lineWidth = 3;
        U.roundRectPath(ctx, -11, -19, 22, 38, 6);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFF6D8';
        U.roundRectPath(ctx, -8, -14, 16, 26, 3);
        ctx.fill();
        ctx.strokeStyle = '#4A3410';
        ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(-5.5, -6.5); ctx.quadraticCurveTo(-3.5, -9.5, -1.5, -6.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(1.5, -6.5); ctx.quadraticCurveTo(3.5, -9.5, 5.5, -6.5); ctx.stroke();
        ctx.fillStyle = '#7A4A2B';
        ctx.beginPath(); ctx.arc(0, 0.5, 4.6, 0.25, Math.PI - 0.25); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#1D262B';
        ctx.beginPath(); ctx.arc(0, -16.4, 1.3, 0, 6.3); ctx.fill();
        ctx.fillRect(10.4, -8, 2.2, 8);
        if (p.type === 'phonespin') {
          ctx.strokeStyle = 'rgba(255,182,206,0.65)';
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 6]);
          ctx.beginPath(); ctx.arc(0, 0, 24 + Math.sin(p.t * 0.5) * 3, 0, 6.3); ctx.stroke();
          ctx.setLineDash([]);
        }
      } else if (p.type === 'oldphone') {
        var oTint = ['#8E9AA3', '#A89584', '#97928A', '#A3A095'][Math.abs(Math.round(p.startX)) % 4];
        ctx.rotate(p.t * 0.35);
        ctx.scale(0.85, 0.85);
        drawOldPhoneShape(ctx, oTint, false);
      } else if (p.type === 'phonemountain') {
        // 堆成山的旧手机：底宽顶窄，下落轻微摇晃；山顶一台还亮着笑脸屏
        ctx.rotate(Math.sin(p.t * 0.1) * 0.05);
        var MP = [
          [-58, 38, -0.5, '#94968F', false], [56, 40, 0.55, '#A3A095', false],
          [-44, 20, -0.16, '#8E9AA3', false], [-22, 24, 0.08, '#A89584', false],
          [0, 26, -0.06, '#97928A', false], [22, 22, 0.14, '#8A95A0', false],
          [44, 18, -0.1, '#A3A095', false],
          [-28, -6, 0.1, '#9A8E9C', false], [-8, -2, -0.12, '#8E9AA3', false],
          [14, -4, 0.06, '#AB9E8B', false], [34, -8, -0.08, '#94968F', false],
          [-14, -30, -0.05, '#9E93A4', false], [8, -32, 0.12, '#8C97A1', false],
          [-2, -56, 0.04, '#A79A87', true]
        ];
        for (var mi = 0; mi < MP.length; mi++) {
          ctx.save();
          ctx.translate(MP[mi][0], MP[mi][1]);
          ctx.rotate(MP[mi][2]);
          drawOldPhoneShape(ctx, MP[mi][3], MP[mi][4]);
          ctx.restore();
        }
      } else if (p.type === 'heart') {
        var hp2 = 1 + Math.sin(p.t * 0.3) * 0.08;
        ctx.scale(hp2, hp2);
        ctx.fillStyle = '#FF7FA0';
        ctx.strokeStyle = '#C94A6E';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.bezierCurveTo(-20, -2, -8, -20, 0, -8);
        ctx.bezierCurveTo(8, -20, 20, -2, 0, 14);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(-5, -4, 3.4, 0, 6.3); ctx.fill();
      } else if (p.type === 'darkorb') {
        ctx.fillStyle = '#141418';
        ctx.beginPath(); ctx.arc(0, 0, 20, 0, 6.3); ctx.fill();
        ctx.strokeStyle = '#5A2A3A'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, 20, 0, 6.3); ctx.stroke();
        ctx.fillStyle = '#FF4A3C';
        ctx.beginPath(); ctx.arc(0, 0, 7 + Math.sin(p.t * 0.4) * 1.5, 0, 6.3); ctx.fill();
      } else if (p.type === 'flame') {
        var fl3 = 1 + Math.sin(p.t * 0.55) * 0.14;
        ctx.scale(fl3, fl3);
        ctx.fillStyle = '#FF8A3C';
        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.quadraticCurveTo(16, -8, 12, 8);
        ctx.quadraticCurveTo(9, 20, 0, 22);
        ctx.quadraticCurveTo(-9, 20, -12, 8);
        ctx.quadraticCurveTo(-16, -8, 0, -24);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#FFC84A';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.quadraticCurveTo(8, 0, 6, 10);
        ctx.quadraticCurveTo(4, 17, 0, 18);
        ctx.quadraticCurveTo(-4, 17, -6, 10);
        ctx.quadraticCurveTo(-8, 0, 0, -10);
        ctx.closePath(); ctx.fill();
      } else if (p.type === 'blade') {
        ctx.rotate(p.t * 0.5);
        ctx.fillStyle = '#D8DCE2';
        ctx.strokeStyle = '#5A6270';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -20); ctx.lineTo(7, 0); ctx.lineTo(0, 20); ctx.lineTo(-7, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#C9A227';
        ctx.fillRect(-3, -2, 6, 12);
      } else if (p.type === 'petal') {
        ctx.rotate(p.t * 0.35);
        ctx.fillStyle = '#FFB3C8';
        ctx.strokeStyle = '#E07A9C';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.quadraticCurveTo(14, -8, 12, 6);
        ctx.quadraticCurveTo(10, 14, 0, 16);
        ctx.quadraticCurveTo(-4, 8, -2, 0);
        ctx.quadraticCurveTo(-10, -8, 0, -16);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (p.type === 'voidorb') {
        ctx.strokeStyle = '#8A877C';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(0, 0, 20, 0, 6.3); ctx.stroke();
        ctx.strokeStyle = '#C9C6BC';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 13, 0, 6.3); ctx.stroke();
        ctx.fillStyle = '#2A2823';
        ctx.beginPath(); ctx.arc(0, 0, 5 + Math.sin(p.t * 0.25) * 1.5, 0, 6.3); ctx.fill();
      } else if (p.type === 'tear') {
        ctx.fillStyle = '#5FB8F0';
        ctx.strokeStyle = '#2A7AC0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.quadraticCurveTo(12, 2, 8, 10);
        ctx.quadraticCurveTo(5, 18, 0, 18);
        ctx.quadraticCurveTo(-5, 18, -8, 10);
        ctx.quadraticCurveTo(-12, 2, 0, -18);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath(); ctx.arc(-3, 4, 3, 0, 6.3); ctx.fill();
      } else if (p.type === 'laughball') {
        var wobL = 1 + Math.sin(p.t * 0.3) * 0.08;
        ctx.scale(wobL, wobL);
        ctx.globalAlpha = 0.82;
        ctx.fillStyle = '#FFC2E8';
        ctx.strokeStyle = '#E86BB0';
        ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.arc(0, 0, 24, 0, 6.3); ctx.fill(); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#C4388A';
        ctx.font = '900 22px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('齁', 0, 1);
        ctx.font = '900 13px "Microsoft YaHei", sans-serif';
        ctx.fillText('哈哈', 16 * dir, -16);
      } else if (p.type === 'laughwave') {
        ctx.scale(dir, 1);
        ctx.globalAlpha = 0.9;
        for (var lwi = 0; lwi < 3; lwi++) {
          ctx.strokeStyle = lwi === 0 ? '#FFC2E8' : (lwi === 1 ? '#FF9FDF' : 'rgba(255,194,232,0.6)');
          ctx.lineWidth = 5 - lwi * 1.2;
          ctx.beginPath();
          ctx.arc(-lwi * 15, 0, 24 - lwi * 4, -Math.PI * 0.62, Math.PI * 0.62);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#E86BB0';
        ctx.font = '900 15px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('哈', 4, -28);
        ctx.fillText('哈', 20, -12);
      } else if (p.type === 'keyboard') {
        ctx.rotate(p.t * 0.22);
        ctx.fillStyle = '#3D4356';
        ctx.strokeStyle = '#232838';
        ctx.lineWidth = 3;
        U.roundRectPath(ctx, -24, -15, 48, 30, 5);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#8E97AC';
        for (var kyi = 0; kyi < 3; kyi++) {
          for (var kxi = 0; kxi < 5; kxi++) {
            U.roundRectPath(ctx, -20 + kxi * 8.4, -11 + kyi * 8, 6.4, 5.6, 1.5);
            ctx.fill();
          }
        }
      } else if (p.type === 'wok') {
        ctx.rotate(Math.sin(p.t * 0.2) * 0.35);
        ctx.fillStyle = '#4A4E5C';
        ctx.strokeStyle = '#25282F';
        ctx.lineWidth = 3;
        U.ellipse(ctx, 0, 2, 22, 13);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#5C6170';
        U.ellipse(ctx, 0, -2, 15, 8);
        ctx.fill();
        ctx.strokeStyle = '#4A4E5C';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-20 * dir, -6); ctx.lineTo(-42 * dir, -16); ctx.stroke();
      } else if (p.type === 'rocketfist' || p.type === 'rocket') {
        ctx.scale(dir, 1);
        var rkS = (p.type === 'rocketfist') ? 1 : 0.7;
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#FFB347';
        ctx.beginPath();
        ctx.moveTo(-30 * rkS, 0);
        ctx.lineTo(-10 * rkS, -9 * rkS);
        ctx.lineTo(-10 * rkS, 9 * rkS);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#F2D968';
        ctx.strokeStyle = '#8A6A20';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 14 * rkS, 0, 6.3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#E8C94E';
        ctx.beginPath(); ctx.arc(-5 * rkS, -5 * rkS, 4.4 * rkS, 0, 6.3); ctx.fill();
        ctx.beginPath(); ctx.arc(5 * rkS, -6 * rkS, 4.4 * rkS, 0, 6.3); ctx.fill();
      } else if (p.type === 'shell') {
        ctx.rotate(p.t * 0.18);
        ctx.fillStyle = '#BFE7FF';
        ctx.strokeStyle = '#4E93C8';
        ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.arc(0, 0, 27, 0, 6.3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#EAF6FF';
        ctx.beginPath(); ctx.arc(-4, -4, 18, 0, 6.3); ctx.fill();
        ctx.strokeStyle = '#8FC8E8';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(-4, -4, 10, 0, 6.3); ctx.stroke();
        ctx.fillStyle = '#4E93C8';
        ctx.font = '900 15px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('暴', 0, 1);
      } else if (p.type === 'goldwave') {
        ctx.scale(dir, 1);
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#FFD93B';
        ctx.lineWidth = 16;
        ctx.beginPath(); ctx.arc(8, 0, 26, -Math.PI * 0.55, Math.PI * 0.55); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#FFD93B';
        ctx.lineWidth = 8;
        ctx.beginPath(); ctx.arc(8, 0, 26, -Math.PI * 0.55, Math.PI * 0.55); ctx.stroke();
        ctx.strokeStyle = '#FFF7C2';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(10, 0, 22, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
      }
      ctx.restore();
    }
  };

  Battle.prototype.startEnd = function (winnerIdx, kind) {
    if (this.phase === 'ko' || this.phase === 'roundEnd' || this.phase === 'matchEnd') return;
    this.phase = 'ko';
    this.phaseT = 0;
    this.winnerIdx = winnerIdx;
    this.slowT = 120;

    if (kind === 'time') {
      var loserIdx = winnerIdx === 0 ? 1 : 0;
      if (winnerIdx === -1) loserIdx = -1;
      if (loserIdx >= 0) {
        var loser = this.fighters[loserIdx];
        loser.state = 'ko';
        loser.stateTime = 0;
        loser.vx = 0;
        loser.invuln = 99999;
      }
      this.setAnnounce('时间到！', '', 90);
      NL.SFX.play('countdown');
    } else {
      this.setAnnounce('K.O.！', '', 110);
      NL.SFX.play('ko');
      NL.FX.flash(14, '#FFFFFF');
      NL.FX.shake(16);
    }
    if (winnerIdx >= 0) this.wins[winnerIdx]++;
  };

  Battle.prototype.nextRound = function () {
    this.round++;
    this.timer = 99 * 60;
    this.phase = 'intro';
    this.phaseT = 0;
    this.winnerIdx = -1;
    this.slowT = 0;
    this.p1.resetRound(430, 1);
    this.p2.resetRound(850, -1);
    this.projectiles = [];
    this.hazards = [];
    this.decoys = [];
    NL.FX.clear();
    NL.camUpdate(this.cam, this.p1, this.p2, true);
    this.setAnnounce('第 ' + this.round + ' 回合', '能不能吃到零食就看这局了！', 100);
    NL.SFX.play('countdown');
  };

  /* v0.11：开场入场下落（120px 高度缓入，纯视觉偏移；0 = 已落地） */
  Battle.prototype.introOffset = function () {
    if (this.phase !== 'intro') return 0;
    var k = U.clamp((this.phaseT - 10) / 18, 0, 1);
    return Math.max(-8, 120 * (1 - U.easeOutBack(k)));
  };

  Battle.prototype.updatePhases = function () {
    var f1 = this.p1, f2 = this.p2;

    if (this.phase === 'intro') {
      if (this.phaseT === 28) {
        // v0.11 开场演出：双人落地 → 尘土 + 轻震 + 微闪
        NL.FX.spawnDust(f1.x, f1.y, 0);
        NL.FX.spawnDust(f2.x, f2.y, 0);
        NL.FX.shake(5);
        NL.FX.flash(6, '#FFFFFF');
      }
      if (this.phaseT === 62) this.setAnnounce('准备…', '', 60);
      if (this.phaseT === 100) {
        this.phase = 'fight';
        this.setAnnounce('干饭！', '', 50);
        NL.SFX.play('confirm');
        NL.FX.flash(5, '#FFF7C2');
      }
      return;
    }

    if (this.phase === 'fight') {
      this.timer--;
      if (this.timer <= 0) {
        var w = -1;
        var r1 = f1.hp / f1.maxHp, r2 = f2.hp / f2.maxHp;
        if (r1 > r2) w = 0; else if (r2 > r1) w = 1;
        this.startEnd(w, 'time');
        return;
      }
      if (f1.hp <= 0 || f2.hp <= 0) {
        var w2 = (f1.hp <= 0 && f2.hp <= 0) ? -1 : (f1.hp <= 0 ? 1 : 0);
        this.startEnd(w2, 'ko');
      }
      return;
    }

    if (this.phase === 'ko') {
      if (this.phaseT === 130) {
        var win = (this.winnerIdx >= 0) ? this.fighters[this.winnerIdx] : null;
        if (win) {
          win.state = 'win';
          win.stateTime = 0;
        }
        this.phase = 'roundEnd';
        this.phaseT = 0;
        if (win) {
          var extra;
          if (win.char.winQuote) {
            extra = '\u300c' + win.char.winQuote + '\u300d' + ((win.hp === win.maxHp) ? ' \u00b7 全程无伤！' : '');
          } else {
            extra = (win.hp === win.maxHp) ? '完美！全程无伤！'
              : U.pick(['太残暴了…', '毫无还手之力！', '这就是干饭的力量！', '回去再练两年吧！']);
          }
          this.setAnnounce(win.char.name + ' 获胜！', extra, 150);
          NL.SFX.play('win');
        } else {
          this.setAnnounce('双双倒地！', '这局算平手…', 150);
        }
      }
      return;
    }

    if (this.phase === 'roundEnd') {
      if (this.phaseT === 160) {
        if (this.winnerIdx >= 0 && this.wins[this.winnerIdx] >= this.roundsToWin) {
          this.phase = 'matchEnd';
          this.phaseT = 0;
          this.matchOver = true;
          var champ = this.fighters[this.winnerIdx];
          var msub = champ.char.winQuote ? ('胜利宣言：\u300c' + champ.char.winQuote + '\u300d') : '宇宙最强龙的称号是它的了！';
          this.setAnnounce(champ.char.name + ' 拿下比赛！', msub, 260);
        } else {
          this.nextRound();
        }
      }
      return;
    }
  };

  /* ==================== 绘制 ==================== */

  Battle.prototype.draw = function (ctx) {
    ctx.save();
    ctx.translate(NL.FX.shakeX, NL.FX.shakeY);
    this.stage.draw(ctx, this.time, this.cam);

    ctx.save();
    NL.camApply(ctx, this.cam);
    this.stage.drawWorld(ctx, this.time);

    // 虚步残影
    for (var gI = 0; gI < this.fighters.length; gI++) {
      var gf = this.fighters[gI];
      if (!gf.ghosts || !gf.ghosts.length) continue;
      for (var gj = 0; gj < gf.ghosts.length; gj++) {
        if (NL.draw.ghost) NL.draw.ghost(ctx, gf, gf.ghosts[gj]);
      }
    }

    this.drawHazards(ctx);
    this.drawDecoys(ctx);
    var fs = this.fighters.slice().sort(function (a, b) { return a.y - b.y; });
    var drop = this.introOffset();
    for (var i = 0; i < fs.length; i++) {
      fs[i].__oy = drop;
      NL.draw.fighter(ctx, fs[i], this.time);
    }
    this.drawWinBubble(ctx);
    this.drawProjectiles(ctx);
    NL.FX.draw(ctx);
    if (NL.debug) this.drawDebug(ctx);
    ctx.restore();
    ctx.restore();

    if (NL.FX.flashT > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.7, NL.FX.flashT / 14 * 0.7);
      ctx.fillStyle = NL.FX.flashColor;
      ctx.fillRect(0, 0, 1280, 720);
      ctx.restore();
    }

    this.drawHUD(ctx);
    this.drawAnnounce(ctx);
  };

  function drawPipStar(ctx, x, y, r, filled) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var ang = -Math.PI / 2 + i * Math.PI / 5;
      var rr = (i % 2 === 0) ? r : r * 0.48;
      if (i === 0) ctx.moveTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
      else ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
    }
    ctx.closePath();
    if (filled) { ctx.fillStyle = '#FFD93B'; ctx.fill(); }
    ctx.strokeStyle = '#5A4318';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  Battle.prototype.drawPlayerBar = function (ctx, f, side) {
    var w = 420, h = 30, x = (side === 0) ? 96 : (1280 - 96 - w), y = 44;

    // 小头像
    NL.draw.miniFace(ctx, (side === 0) ? 50 : 1230, 66, 26, f.char, f.hp > 0 ? 'happy' : 'ko', this.time);

    // 血条底
    ctx.fillStyle = 'rgba(30,20,10,0.55)';
    U.roundRectPath(ctx, x, y, w, h, 9);
    ctx.fill();

    // 残影
    var ghostW = w * U.clamp(f.hpGhost / f.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    if (side === 0) { U.roundRectPath(ctx, x, y, Math.max(0.01, ghostW), h, 9); }
    else { U.roundRectPath(ctx, x + w - ghostW, y, Math.max(0.01, ghostW), h, 9); }
    ctx.fill();

    // 血量
    var hpRatio = U.clamp(f.hp / f.maxHp, 0, 1);
    var hw = w * hpRatio;
    var grad = ctx.createLinearGradient(x, y, x, y + h);
    if (hpRatio > 0.35) { grad.addColorStop(0, '#FFE870'); grad.addColorStop(1, '#F5A623'); }
    else { grad.addColorStop(0, '#FFA36B'); grad.addColorStop(1, '#E4572E'); }
    ctx.fillStyle = grad;
    if (side === 0) { U.roundRectPath(ctx, x, y, Math.max(0.01, hw), h, 9); }
    else { U.roundRectPath(ctx, x + w - hw, y, Math.max(0.01, hw), h, 9); }
    ctx.fill();

    // 边框
    ctx.strokeStyle = '#5A4318';
    ctx.lineWidth = 4;
    U.roundRectPath(ctx, x, y, w, h, 9);
    ctx.stroke();

    // v0.11：残血警示（血量 <25% 红圈呼吸脉冲）
    if (hpRatio > 0 && hpRatio < 0.25) {
      ctx.save();
      ctx.globalAlpha = 0.4 + 0.35 * Math.sin(this.time * 0.3);
      ctx.strokeStyle = '#FF3B30';
      ctx.lineWidth = 5;
      U.roundRectPath(ctx, x - 3, y - 3, w + 6, h + 6, 11);
      ctx.stroke();
      ctx.restore();
    }

    // 名字
    ctx.font = '900 22px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = (side === 0) ? 'left' : 'right';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#5A4318';
    ctx.lineWidth = 6;
    var nameText = (side === 0 ? 'P1 · ' : 'P2 · ') + f.char.name;
    if (side === 0) { ctx.strokeText(nameText, x, y - 18); ctx.fillStyle = '#FFF'; ctx.fillText(nameText, x, y - 18); }
    else { ctx.strokeText(nameText, x + w, y - 18); ctx.fillStyle = '#FFF'; ctx.fillText(nameText, x + w, y - 18); }

    // 能量条（奶力）
    var ey = y + h + 7, eh = 13, ewFull = w * 0.8;
    ctx.fillStyle = 'rgba(30,20,10,0.55)';
    U.roundRectPath(ctx, x, ey, ewFull, eh, 7);
    ctx.fill();
    var energyRatio = U.clamp(f.energy / f.maxEnergy, 0, 1);
    var ew = ewFull * energyRatio;
    var g2 = ctx.createLinearGradient(x, ey, x, ey + eh);
    g2.addColorStop(0, '#FFB3E0');
    g2.addColorStop(1, '#FF6B9D');
    ctx.fillStyle = g2;
    if (side === 0) { U.roundRectPath(ctx, x, ey, Math.max(0.01, ew), eh, 7); }
    else { U.roundRectPath(ctx, x + ewFull - ew, ey, Math.max(0.01, ew), eh, 7); }
    ctx.fill();
    ctx.strokeStyle = '#5A4318';
    ctx.lineWidth = 3;
    U.roundRectPath(ctx, x, ey, ewFull, eh, 7);
    ctx.stroke();
    // 满能量闪烁
    if (f.energy >= f.maxEnergy) {
      var pulse = 0.5 + Math.sin(this.time * 0.3) * 0.5;
      ctx.save();
      ctx.globalAlpha = 0.4 + pulse * 0.6;
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 3;
      U.roundRectPath(ctx, x - 3, ey - 3, ewFull + 6, eh + 6, 8);
      ctx.stroke();
      ctx.restore();
    }

    // 小字"奶力"
    ctx.font = '700 13px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = (side === 0) ? 'left' : 'right';
    var labelX = (side === 0) ? x + ewFull + 8 : x + ewFull - ewFull - 8;
    if (side === 0) ctx.fillText('奶力值', x + ewFull + 8, ey + eh / 2);
    else ctx.fillText('奶力值', x - 8, ey + eh / 2);

    // 胜场星星
    for (var i = 0; i < this.roundsToWin; i++) {
      var px = (side === 0) ? (x + 14 + i * 34) : (x + w - 14 - i * 34);
      drawPipStar(ctx, px, ey + 40, 12, this.wins[side] > i);
    }
  };

  Battle.prototype.drawCombo = function (ctx, f, side) {
    if (f.combo < 2 || f.comboTimer <= 0) return;
    var x = (side === 0) ? 165 : 1115;
    var sinceHit = 110 - f.comboTimer;
    var pop = Math.max(0, 1 - sinceHit / 9);
    var scale = 1 + pop * 0.45;
    ctx.save();
    ctx.translate(x, 205);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 44px "Microsoft YaHei", sans-serif';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#5A4318';
    ctx.lineWidth = 10;
    ctx.strokeText(f.combo + ' 连击', 0, 0);
    ctx.fillStyle = '#FFE066';
    ctx.fillText(f.combo + ' 连击', 0, 0);
    ctx.restore();
  };

  Battle.prototype.drawHUD = function (ctx) {
    this.drawPlayerBar(ctx, this.p1, 0);
    this.drawPlayerBar(ctx, this.p2, 1);
    this.drawCombo(ctx, this.p1, 0);
    this.drawCombo(ctx, this.p2, 1);

    // 计时牌
    var sec = Math.max(0, Math.ceil(this.timer / 60));
    ctx.save();
    ctx.translate(640, 64);
    ctx.fillStyle = 'rgba(30,20,10,0.55)';
    ctx.beginPath(); ctx.arc(0, 0, 46, 0, 6.3); ctx.fill();
    ctx.strokeStyle = '#5A4318'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, 46, 0, 6.3); ctx.stroke();
    ctx.strokeStyle = '#FFD93B'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, 40, 0, 6.3); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 44px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = sec <= 10 ? '#FF6B6B' : '#FFFFFF';
    ctx.fillText(String(sec), 0, 2);
    ctx.font = '700 14px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText('干饭杯·倒计时', 0, 62);
    ctx.restore();
  };

  Battle.prototype.drawAnnounce = function (ctx) {
    var a = this.announce;
    if (!a || a.t > a.dur) return;
    var inT = Math.min(1, a.t / 10);
    var scale = U.easeOutBack(inT);
    var alpha = a.t > a.dur - 18 ? Math.max(0, (a.dur - a.t) / 18) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(640, 265);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.font = '900 64px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.strokeStyle = '#5A4318';
    ctx.lineWidth = 12;
    ctx.strokeText(a.text, 0, 0);
    ctx.fillStyle = '#FFE066';
    ctx.fillText(a.text, 0, 0);
    if (a.sub) {
      ctx.font = '700 24px "Microsoft YaHei", sans-serif';
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#5A4318';
      ctx.strokeText(a.sub, 0, 54);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(a.sub, 0, 54);
    }
    ctx.restore();
  };

  /* 胜利宣言：冠军头顶的漫画气泡 */
  Battle.prototype.drawWinBubble = function (ctx) {
    if (this.phase !== 'roundEnd' && this.phase !== 'matchEnd') return;
    if (this.winnerIdx < 0) return;
    var w = this.fighters[this.winnerIdx];
    if (!w || !w.char.winQuote) return;
    var quote = w.char.winQuote;
    var k = U.easeOutBack(U.clamp(this.phaseT / 12, 0, 1));
    if (k <= 0.02) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.font = '900 30px "Microsoft YaHei", "PingFang SC", sans-serif';
    var tw = ctx.measureText(quote).width;
    var bw = Math.max(150, tw + 68), bh = 58, by0 = -bh - 30;
    var bx = U.clamp(w.x, (NL.WALL_L || -460) + bw / 2 + 10, (NL.WALL_R || 1740) - bw / 2 - 10);

    ctx.translate(bx, w.y - 216 + Math.sin(this.time * 0.07) * 4);
    ctx.scale(k, k);

    ctx.fillStyle = '#FFFDF2';
    ctx.strokeStyle = '#5A4318';
    ctx.lineWidth = 4.5;

    // 小尾巴先画（主体盖住衔接处）
    ctx.beginPath();
    ctx.moveTo(-16, by0 + bh - 3);
    ctx.lineTo(2, -2);
    ctx.lineTo(18, by0 + bh - 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 气泡主体
    U.roundRectPath(ctx, -bw / 2, by0, bw, bh, 20);
    ctx.fill();
    ctx.stroke();

    // 宣言文字
    ctx.fillStyle = '#4A3410';
    ctx.fillText(quote, 0, by0 + bh / 2 + 1);
    ctx.restore();
  };

  Battle.prototype.drawDebug = function (ctx) {
    ctx.save();
    ctx.lineWidth = 2;
    for (var i = 0; i < this.fighters.length; i++) {
      var f = this.fighters[i];
      var hurt = f.getHurtbox();
      ctx.strokeStyle = '#4FB2FF';
      ctx.strokeRect(hurt.x, hurt.y, hurt.w, hurt.h);
      var hb = f.getHitbox();
      if (hb) {
        ctx.strokeStyle = '#FF4F4F';
        ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
      }
      ctx.fillStyle = '#FFFF00';
      ctx.font = '700 13px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(f.state + ' f=' + f.moveFrame + ' hp=' + f.hp + ' e=' + Math.round(f.energy),
        f.x - 60, f.y - 140 - i * 16);
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 13px monospace';
    ctx.fillText('phase=' + this.phase + ' t=' + this.phaseT + ' hitstop=' + this.hitstop + ' slow=' + this.slowT + ' time=' + this.time, 12, 700);
    ctx.restore();
  };

  /* ================= v0.12：地面道具（香蕉皮 / 酒水渍）与替身木桩 ================= */
  Battle.prototype.spawnHazard = function (o) {
    if (!this.hazards) this.hazards = [];
    var same = [];
    for (var i = 0; i < this.hazards.length; i++) {
      if (this.hazards[i].type === o.type) same.push(i);
    }
    if (same.length >= 4) this.hazards.splice(same[0], 1);   // 同类最多 4 个（性能护栏）
    this.hazards.push({
      type: o.type, x: o.x, y: NL.GROUND - 8,
      owner: o.owner || null, t: 0,
      life: (o.type === 'banana') ? 320 : 420,
      burning: false, burnT: 0
    });
  };

  Battle.prototype.updateHazards = function () {
    var hs = this.hazards;
    if (!hs) return;
    for (var i = hs.length - 1; i >= 0; i--) {
      var h = hs[i];
      h.t++; h.life--;
      if (h.life <= 0) { hs.splice(i, 1); continue; }
      // 燃烧的水渍：周期性灼伤站在上面的敌人
      if (h.burning) {
        h.burnT--;
        if (h.burnT <= 0) h.burning = false;
        else if (h.t % 22 === 0) {
          for (var fI = 0; fI < this.fighters.length; fI++) {
            var f = this.fighters[fI];
            if (f === h.owner || !f.canBeHit()) continue;
            if (f.onGround && Math.abs(f.x - h.x) < 88) {
              f.takeHit(h.owner, { damage: 10, hitstun: 8, blockstun: 6, kbx: 30, kvy: 0 });
              f.burnT = Math.max(f.burnT || 0, 120);   // v0.13：附着灼烧状态（持续掉血）
              NL.FX.cue(f.x, f.y - 12, 'flame', (f.x >= h.x) ? 1 : -1);
            }
          }
        }
      }
      // 香蕉皮：敌方踩到 → 滑倒
      if (h.type === 'banana') {
        for (var fJ = 0; fJ < this.fighters.length; fJ++) {
          var fj = this.fighters[fJ];
          if (fj === h.owner || !fj.canBeHit()) continue;
          if (fj.onGround && Math.abs(fj.x - h.x) < 42) {
            fj.takeHit(h.owner, { damage: 28, hitstun: 40, blockstun: 8, kbx: 0, kvy: -190 });   // v0.13：蕉皮踩到伤害 13→28
            NL.FX.text(fj.x, fj.y - 150, '踩到香蕉皮！', { size: 28, color: '#FFE066', dur: 56 });
            NL.SFX.play('duang');
            NL.FX.cue(h.x, h.y - 6, 'poof', 1);
            hs.splice(i, 1);
            break;
          }
        }
      }
    }
  };

  Battle.prototype.drawHazards = function (ctx) {
    var hs = this.hazards;
    if (!hs) return;
    for (var i = 0; i < hs.length; i++) {
      var h = hs[i];
      if (h.life < 70 && Math.floor(h.t / 6) % 2 === 1) continue;   // 快消失时闪烁
      ctx.save();
      ctx.translate(h.x, h.y);
      if (h.type === 'banana') {
        ctx.rotate(Math.sin(h.t * 0.03) * 0.06);
        ctx.fillStyle = '#FFE066';
        ctx.strokeStyle = '#B98A2A';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-24, 6);
        ctx.quadraticCurveTo(0, -16, 24, 6);
        ctx.quadraticCurveTo(0, 0, -24, 6);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#8A6A10';
        ctx.beginPath(); ctx.arc(-24, 5, 3.2, 0, 6.3); ctx.fill();
        ctx.beginPath(); ctx.arc(24, 5, 3.2, 0, 6.3); ctx.fill();
      } else {
        // 酒水渍
        ctx.fillStyle = h.burning ? 'rgba(90,70,50,0.85)' : 'rgba(140,170,205,0.78)';
        U.ellipse(ctx, 0, 2, 84, 17);   // v0.13：水渍范围加大
        ctx.fill();
        ctx.fillStyle = h.burning ? 'rgba(255,150,60,0.5)' : 'rgba(235,245,255,0.5)';
        U.ellipse(ctx, -26, 0, 24, 6);
        ctx.fill();
        U.ellipse(ctx, 28, 5, 15, 4.4);
        ctx.fill();
        if (h.burning) {
          for (var k = 0; k < 5; k++) {
            var fx = -70 + k * 35;
            var fl = 20 + Math.sin(h.t * 0.4 + k * 2) * 7;
            ctx.fillStyle = (k % 2) ? 'rgba(255,159,67,0.9)' : 'rgba(255,217,59,0.9)';
            ctx.beginPath();
            ctx.moveTo(fx - 9, 0);
            ctx.quadraticCurveTo(fx - 3, -fl * 0.7, fx, -fl);
            ctx.quadraticCurveTo(fx + 3, -fl * 0.7, fx + 9, 0);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }
  };

  Battle.prototype.spawnDecoy = function (x, y, facing) {
    if (!this.decoys) this.decoys = [];
    this.decoys.push({ x: x, y: y, facing: facing || 1, t: 0, life: 34 });
  };

  Battle.prototype.updateDecoys = function () {
    var ds = this.decoys;
    if (!ds) return;
    for (var i = ds.length - 1; i >= 0; i--) {
      ds[i].t++;
      if (ds[i].t >= ds[i].life) ds.splice(i, 1);
    }
  };

  Battle.prototype.drawDecoys = function (ctx) {
    var ds = this.decoys;
    if (!ds) return;
    for (var i = 0; i < ds.length; i++) {
      var d2 = ds[i];
      var k = 1 - d2.t / d2.life;
      ctx.save();
      ctx.translate(d2.x, d2.y);
      ctx.globalAlpha = Math.min(1, k * 2.2);
      // 木桩替身
      ctx.fillStyle = '#B98A5A';
      ctx.strokeStyle = '#7A5230';
      ctx.lineWidth = 4;
      U.roundRectPath(ctx, -20, -96, 40, 96, 12);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(122,82,48,0.7)';
      ctx.lineWidth = 2.5;
      for (var r2 = 0; r2 < 3; r2++) {
        ctx.beginPath();
        ctx.arc(0, -78 + r2 * 26, 12, 0.3, Math.PI - 0.3);
        ctx.stroke();
      }
      // 小树叶
      ctx.fillStyle = '#7BCB6F';
      ctx.strokeStyle = '#4E9B48';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(6, -102, 16, 9, -0.35, 0, 6.3);
      ctx.fill(); ctx.stroke();
      if (d2.t < 12 && Math.floor(d2.t / 3) % 2 === 0) {
        ctx.globalAlpha *= 0.7;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(-24, -60, 9, 0, 6.3); ctx.fill();
        ctx.beginPath(); ctx.arc(26, -44, 7, 0, 6.3); ctx.fill();
      }
      ctx.restore();
    }
  };

  /* v0.12.1：酒瓶飞抵距离终点 / 撞墙 → 炸开留水渍 */
  Battle.prototype.burstBottle = function (p) {
    NL.FX.shake(5);
    NL.FX.cue(p.x, p.y, 'poof', Math.sign(p.vx) || 1);
    NL.FX.cue(p.x - 16, p.y + 12, 'splash', -1);
    NL.FX.cue(p.x + 16, p.y + 12, 'splash', 1);
    this.shatterBottle(p, p.x);
  };

  /* 酒瓶碎裂 → 一地水渍 */
  Battle.prototype.shatterBottle = function (p, hitX) {
    var x = U.clamp(hitX || p.x, NL.WALL_L + 40, NL.WALL_R - 40);
    this.spawnHazard({ type: 'puddle', x: x, owner: p.owner });
    NL.SFX.play('splash');
    NL.FX.cue(x, NL.GROUND - 12, 'splash', 1);
    NL.FX.cue(x + 16, NL.GROUND - 8, 'splash', -1);
  };

  /* 巨型香蕉落地 → 大震屏 + 摔成三根香蕉皮 */
  Battle.prototype.shatterGiantBanana = function (p, hitX) {
    var x = U.clamp(hitX || p.x, NL.WALL_L + 60, NL.WALL_R - 60);
    NL.FX.shake(16);
    NL.FX.flash(8, '#FFF7C2');
    NL.SFX.play('hitBig');
    for (var k = 0; k < 3; k++) {
      this.spawnHazard({ type: 'banana', x: x + (k - 1) * 76, owner: p.owner });
    }
    NL.FX.cue(x, NL.GROUND - 14, 'poof', 1);
    NL.FX.cue(x - 30, NL.GROUND - 10, 'poof', -1);
    NL.FX.cue(x + 30, NL.GROUND - 10, 'poof', 1);
  };

  /* ================= v0.12：新弹道绘制（返回 true 表示已处理） ================= */
  Battle.prototype.drawProjExtra = function (ctx, p, dir) {
    var t = p.t;
    if (p.type === 'banana' || p.type === 'rainbanana') {
      ctx.rotate(t * 0.22 * dir);
      ctx.fillStyle = '#FFE066';
      ctx.strokeStyle = '#B98A2A';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-26, 0);
      ctx.quadraticCurveTo(0, -34, 26, 0);
      ctx.quadraticCurveTo(0, -8, -26, 0);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8A6A10';
      ctx.beginPath(); ctx.arc(-26, 0, 3.4, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(26, 0, 3.4, 0, 6.3); ctx.fill();
      return true;
    }
    if (p.type === 'giantbanana') {
      ctx.rotate(Math.sin(t * 0.1) * 0.12);
      ctx.fillStyle = '#FFE066';
      ctx.strokeStyle = '#B98A2A';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(-88, 6);
      ctx.quadraticCurveTo(0, -120, 88, 6);
      ctx.quadraticCurveTo(0, -30, -88, 6);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8A6A10';
      ctx.beginPath(); ctx.arc(-88, 6, 9, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(88, 6, 9, 0, 6.3); ctx.fill();
      ctx.strokeStyle = 'rgba(255,246,216,0.8)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-60, -18);
      ctx.quadraticCurveTo(0, -74, 60, -18);
      ctx.stroke();
      return true;
    }
    if (p.type === 'rollmelon') {
      ctx.rotate(t * 0.3 * dir);
      ctx.fillStyle = '#6FBF5A';
      ctx.strokeStyle = '#3F7D33';
      ctx.lineWidth = 4;
      U.ellipse(ctx, 0, 0, 26, 20);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(190,240,160,0.65)';
      for (var b3 = 0; b3 < 5; b3++) {
        var ba = b3 * 1.26 + t * 0.3;
        ctx.beginPath();
        ctx.arc(Math.cos(ba) * 13, Math.sin(ba) * 9, 4.2, 0, 6.3);
        ctx.fill();
      }
      ctx.fillStyle = '#8FBF6A';
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, 6.3); ctx.fill();
      return true;
    }
    if (p.type === 'laser' || p.type === 'laser3') {
      var isB = (p.type === 'laser3');
      var len = isB ? 330 : 240;
      ctx.rotate(Math.atan2(p.vy, p.vx));
      // 外发光
      ctx.fillStyle = 'rgba(255,70,70,0.30)';
      ctx.beginPath();
      ctx.moveTo(-len, -p.r * 1.6);
      ctx.lineTo(34, -p.r * 0.8);
      ctx.lineTo(34, p.r * 0.8);
      ctx.lineTo(-len, p.r * 1.6);
      ctx.closePath();
      ctx.fill();
      // 主光束
      var grad = ctx.createLinearGradient(-len, 0, 26, 0);
      grad.addColorStop(0, 'rgba(255,60,60,0.25)');
      grad.addColorStop(0.45, 'rgba(255,60,60,0.85)');
      grad.addColorStop(1, 'rgba(255,235,235,0.98)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-len, -p.r);
      ctx.lineTo(30, -p.r * 0.45);
      ctx.lineTo(30, p.r * 0.45);
      ctx.lineTo(-len, p.r);
      ctx.closePath();
      ctx.fill();
      // 白热核心
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      U.roundRectPath(ctx, -len * 0.55, -p.r * 0.32, len * 0.6, p.r * 0.64, p.r * 0.32);
      ctx.fill();
      // 枪口闪光
      ctx.fillStyle = 'rgba(255,80,80,0.95)';
      ctx.beginPath(); ctx.arc(24, 0, p.r * 0.7, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(24, 0, p.r * 0.36, 0, 6.3); ctx.fill();
      return true;
    }
    if (p.type === 'soundwave') {
      var rr = p.r;
      for (var w = 0; w < 3; w++) {
        var ph = (t * 0.12 + w * 0.33) % 1;
        ctx.strokeStyle = 'rgba(143,224,255,' + (0.85 - ph * 0.6).toFixed(2) + ')';
        ctx.lineWidth = 5 - w;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(4, rr * (0.4 + ph * 0.75)), -1.35, 1.35);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(200,240,255,0.4)';
      ctx.beginPath(); ctx.arc(0, 0, rr * 0.42, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 ' + Math.round(rr * 0.6) + 'px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('啊', 0, 1);
      return true;
    }
    if (p.type === 'screenwave') {
      var rw2 = p.r;
      for (var v = 0; v < 4; v++) {
        var ph2 = (t * 0.05 + v * 0.25) % 1;
        ctx.strokeStyle = 'rgba(191,233,255,' + (0.9 - ph2 * 0.65).toFixed(2) + ')';
        ctx.lineWidth = 9 - v * 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(10, rw2 * (0.5 + ph2 * 0.6)), -1.5, 1.5);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(220,245,255,0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, rw2 * 0.9, -1.5, 1.5);
      ctx.closePath();
      ctx.fill();
      return true;
    }
    if (p.type === 'boardshield') {
      // v0.13：黑板之盾（站立的大黑板，粉笔字）
      var bh2 = 92, bw2 = 60;
      ctx.save();
      ctx.globalAlpha = 0.26 + Math.sin(t * 0.1) * 0.08;
      ctx.fillStyle = '#BFE9FF';
      U.roundRectPath(ctx, -bw2 - 12, -bh2 - 12, (bw2 + 12) * 2, (bh2 + 12) * 2, 16);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#8A5A2B';
      ctx.strokeStyle = '#5A3A18';
      ctx.lineWidth = 4;
      U.roundRectPath(ctx, -bw2, -bh2, bw2 * 2, bh2 * 2, 10);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2F5D50';
      U.roundRectPath(ctx, -bw2 + 7, -bh2 + 7, bw2 * 2 - 14, bh2 * 2 - 14, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245,245,230,0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-34, -44); ctx.lineTo(30, -44);
      ctx.moveTo(-34, -22); ctx.lineTo(14, -22);
      ctx.moveTo(-34, 0); ctx.lineTo(24, 0);
      ctx.moveTo(-34, 22); ctx.lineTo(-6, 22);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,235,150,0.92)';
      ctx.font = '900 22px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('盾', 0, 52);
      return true;
    }
    if (p.type === 'phonepile') {
      // v0.13：手机堆（旧手机残骸，长时间挡路）
      ctx.save();
      ctx.scale(1.2, 1.2);
      ctx.fillStyle = 'rgba(70,80,95,0.35)';
      U.ellipse(ctx, 0, 30, 78, 20);
      ctx.fill();
      for (var pk2 = 0; pk2 < 6; pk2++) {
        var px3 = ((pk2 % 3) - 1) * 42;
        var py3 = -Math.floor(pk2 / 3) * 36;
        ctx.save();
        ctx.translate(px3, py3);
        ctx.rotate((((pk2 * 37) % 11) - 5) * 0.05);
        drawOldPhoneShape(ctx, (pk2 % 2) ? '#4A5568' : '#6B7280', pk2 % 3 === 0);
        ctx.restore();
      }
      ctx.restore();
      return true;
    }
    if (p.type === 'smoke') {
      // v0.13：大范围烟雾（两层半透明烟团，缓慢涌动）
      var rw3 = p.def.rect.w / 2, rh3 = p.def.rect.h / 2;
      ctx.save();
      for (var sk3 = 0; sk3 < 7; sk3++) {
        var sx3 = -rw3 + (sk3 + 0.5) * (p.def.rect.w / 7);
        var sy3 = rh3 * 0.08 + Math.sin(t * 0.03 + sk3 * 1.7) * 26;
        var rr3 = 118 + (sk3 % 3) * 26;
        var g3 = ctx.createRadialGradient(sx3, sy3, 8, sx3, sy3, rr3);
        g3.addColorStop(0, 'rgba(118,108,98,0.52)');
        g3.addColorStop(0.65, 'rgba(150,145,138,0.36)');
        g3.addColorStop(1, 'rgba(170,170,165,0.05)');
        ctx.fillStyle = g3;
        ctx.beginPath();
        ctx.arc(sx3, sy3, rr3, 0, 6.3);
        ctx.fill();
      }
      for (var sk4 = 0; sk4 < 5; sk4++) {
        var sx4 = -rw3 * 0.8 + (sk4 + 0.5) * (p.def.rect.w * 0.8 / 5 * 1.6);
        var sy4 = -rh3 * 0.42 + Math.cos(t * 0.026 + sk4 * 2.1) * 22;
        var rr4 = 104 + (sk4 % 2) * 34;
        var g4 = ctx.createRadialGradient(sx4, sy4, 8, sx4, sy4, rr4);
        g4.addColorStop(0, 'rgba(104,96,88,0.44)');
        g4.addColorStop(1, 'rgba(160,158,152,0.04)');
        ctx.fillStyle = g4;
        ctx.beginPath();
        ctx.arc(sx4, sy4, rr4, 0, 6.3);
        ctx.fill();
      }
      ctx.restore();
      return true;
    }
    if (p.type === 'winebottle') {
      ctx.rotate(t * 0.24 * dir);
      ctx.fillStyle = '#2E6B4F';
      ctx.strokeStyle = '#1C4531';
      ctx.lineWidth = 3.5;
      U.roundRectPath(ctx, -13, -8, 26, 34, 7);
      ctx.fill(); ctx.stroke();
      U.roundRectPath(ctx, -5, -26, 10, 20, 3);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#E8D8A8';
      U.roundRectPath(ctx, -11, 2, 22, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#C0392B';
      ctx.beginPath(); ctx.arc(0, 9, 4.2, 0, 6.3); ctx.fill();
      return true;
    }
    if (p.type === 'chalk') {
      ctx.rotate(-0.3 * dir);
      ctx.fillStyle = '#FDFDF6';
      ctx.strokeStyle = '#B9B9A8';
      ctx.lineWidth = 2.5;
      U.roundRectPath(ctx, -11, -5, 22, 10, 4);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(-16, 2, 3, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(-22, 5, 2, 0, 6.3); ctx.fill();
      return true;
    }
    if (p.type === 'eraser') {
      ctx.rotate(t * 0.34 * dir);
      ctx.fillStyle = '#4A5A66';
      ctx.strokeStyle = '#2E3A42';
      ctx.lineWidth = 3.5;
      U.roundRectPath(ctx, -20, -14, 40, 28, 6);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#DDE4E8';
      U.roundRectPath(ctx, -20, -14, 40, 9, 5);
      ctx.fill();
      ctx.fillStyle = 'rgba(240,240,230,0.75)';
      U.roundRectPath(ctx, -12, 1, 22, 8, 4);
      ctx.fill();
      return true;
    }
    if (p.type === 'blackboard') {
      ctx.rotate(Math.sin(t * 0.08) * 0.05);
      ctx.fillStyle = '#8A6A3B';
      ctx.strokeStyle = '#5A4318';
      ctx.lineWidth = 5;
      U.roundRectPath(ctx, -96, -62, 192, 124, 6);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2F4A3C';
      U.roundRectPath(ctx, -88, -54, 176, 108, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-70, -30); ctx.lineTo(-20, -30);
      ctx.moveTo(-70, -12); ctx.lineTo(-34, -12);
      ctx.moveTo(26, 10); ctx.lineTo(70, 10);
      ctx.moveTo(10, 28); ctx.lineTo(70, 28);
      ctx.stroke();
      return true;
    }
    if (p.type === 'firestrip' || p.type === 'bigfire') {
      var rectW = p.def.rect.w, rectH = p.def.rect.h;
      var hw = rectW / 2, hh = rectH / 2;
      var isBig2 = (p.type === 'bigfire');
      var fg = ctx.createLinearGradient(0, hh, 0, -hh);
      fg.addColorStop(0, 'rgba(255,120,40,0.85)');
      fg.addColorStop(0.6, 'rgba(255,180,60,0.75)');
      fg.addColorStop(1, 'rgba(255,240,160,0.15)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(-hw, hh);
      ctx.quadraticCurveTo(-hw * 0.55, -hh * (0.85 + Math.sin(t * 0.5) * 0.15), 0, -hh * (0.95 + Math.sin(t * 0.42 + 2) * 0.2));
      ctx.quadraticCurveTo(hw * 0.55, -hh * (0.85 + Math.sin(t * 0.47 + 4) * 0.15), hw, hh);
      ctx.closePath();
      ctx.fill();
      for (var fi = 0; fi < (isBig2 ? 9 : 5); fi++) {
        var nTong = isBig2 ? 9 : 5;
        var fx2 = -hw + (fi + 0.5) * (rectW / nTong);
        var fl2 = hh * (0.7 + 0.5 * Math.sin(t * 0.55 + fi * 1.9));
        ctx.fillStyle = (fi % 2) ? 'rgba(255,159,67,0.9)' : 'rgba(255,217,59,0.9)';
        ctx.beginPath();
        ctx.moveTo(fx2 - 14, hh);
        ctx.quadraticCurveTo(fx2 - 5, -fl2 * 0.8, fx2, -fl2);
        ctx.quadraticCurveTo(fx2 + 5, -fl2 * 0.8, fx2 + 14, hh);
        ctx.closePath();
        ctx.fill();
      }
      return true;
    }
    return false;
  };

  NL.Battle = Battle;
})();
