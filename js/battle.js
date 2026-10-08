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
    phonemountain: { r: 56, speed: 0, damage: 95, hitstun: 26, kbx: 420, kvy: -300, life: 220, g: 1700, blockable: true },
    oldphone: { r: 15, speed: 250, damage: 15, hitstun: 14, kbx: 130, kvy: -170, life: 60, g: 900, blockable: true },
    /* v0.6 奶娃九形态专属弹道 */
    heart: { r: 22, speed: 470, damage: 62, hitstun: 18, kbx: 340, kvy: -260, life: 100, g: 40, blockable: true },
    darkorb: { r: 24, speed: 520, damage: 68, hitstun: 19, kbx: 360, kvy: -240, life: 95, g: 0, blockable: true },
    flame: { r: 24, speed: 540, damage: 74, hitstun: 20, kbx: 380, kvy: -230, life: 90, g: 0, blockable: true },
    blade: { r: 20, speed: 620, damage: 66, hitstun: 18, kbx: 330, kvy: -210, life: 85, g: 0, blockable: true },
    petal: { r: 20, speed: 560, damage: 60, hitstun: 18, kbx: 320, kvy: -250, life: 95, g: 20, blockable: true },
    voidorb: { r: 26, speed: 460, damage: 72, hitstun: 20, kbx: 370, kvy: -220, life: 110, g: 0, blockable: true },
    tear: { r: 19, speed: 540, damage: 63, hitstun: 18, kbx: 330, kvy: -240, life: 95, g: 60, blockable: true }
  };

  function Battle(cfg) {
    this.cfg = cfg;
    this.mode = cfg.mode || 'ai';
    this.stage = new NL.Stage('village');

    var s1 = { type: 'keyboard', player: 0 };
    var s2 = (this.mode === '2p') ? { type: 'keyboard', player: 1 } : new NL.AI(cfg.difficulty || 0);

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
    if (this.projectiles.length >= 20) return;
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
  };

  Battle.prototype.updateProjectiles = function () {
    var ps = this.projectiles;
    for (var i = ps.length - 1; i >= 0; i--) {
      var p = ps[i], d = p.def;
      p.t++;
      p.life--;
      p.vy += (d.g || 0) / 60;
      p.x += p.vx / 60;
      p.y += p.vy / 60;
      var dead = false;
      if (p.y > NL.GROUND - 4) {
        if (d.bounce) {
          p.y = NL.GROUND - 4;
          p.vy = -Math.abs(p.vy) * 0.65;
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
      if (p.x < NL.WALL_L - 80 || p.x > NL.WALL_R + 80) dead = true;
      if (p.life <= 0) dead = true;
      if (dead) { ps.splice(i, 1); continue; }

      for (var fI = 0; fI < this.fighters.length; fI++) {
        var def = this.fighters[fI];
        if (def === p.owner || !def.canBeHit()) continue;
        var hurt = def.getHurtbox();
        var cx = U.clamp(p.x, hurt.x, hurt.x + hurt.w);
        var cy = U.clamp(p.y, hurt.y, hurt.y + hurt.h);
        var ddx = p.x - cx, ddy = p.y - cy;
        if (ddx * ddx + ddy * ddy <= (p.r + 4) * (p.r + 4)) {
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
          if (p.type === 'phonemountain') this.shatterMountain(p);
          ps.splice(i, 1);
          break;
        }
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
    NL.FX.clear();
    NL.camUpdate(this.cam, this.p1, this.p2, true);
    this.setAnnounce('第 ' + this.round + ' 回合', '能不能吃到零食就看这局了！', 100);
    NL.SFX.play('countdown');
  };

  Battle.prototype.updatePhases = function () {
    var f1 = this.p1, f2 = this.p2;

    if (this.phase === 'intro') {
      if (this.phaseT === 62) this.setAnnounce('准备…', '', 60);
      if (this.phaseT === 100) {
        this.phase = 'fight';
        this.setAnnounce('干饭！', '', 50);
        NL.SFX.play('confirm');
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

    var fs = this.fighters.slice().sort(function (a, b) { return a.y - b.y; });
    for (var i = 0; i < fs.length; i++) {
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

  NL.Battle = Battle;
})();
