/* 奶龙大乱斗 - 战斗角色：物理、状态机、招式、受击 */
var NL = window.NL = window.NL || {};
(function () {
  'use strict';
  var U = NL.util;

  NL.GROUND = 620;
  NL.WALL_L = -460;
  NL.WALL_R = 1740;

  var GRAV = 1750;
  var FALL_GRAV = 2250;

  var EMPTY_INPUT = {
    left: false, right: false, up: false, down: false,
    light: false, heavy: false, skill1: false, skill2: false, sup: false,
    pLeft: false, pRight: false, pUp: false, pDown: false,
    pLight: false, pHeavy: false, pSkill1: false, pSkill2: false, pSup: false,
    pSub: false,
    pDash: 0
  };
  NL.EMPTY_INPUT = EMPTY_INPUT;

  function Fighter(opts) {
    var ch = NL.chars[opts.charId];
    this.char = ch;
    this.charId = opts.charId;
    this.playerIndex = opts.playerIndex || 0;
    this.source = opts.source || { type: 'keyboard', player: 0 };

    this.x = opts.x || 500;
    this.y = NL.GROUND;
    this.vx = 0;
    this.vy = 0;
    this.facing = opts.facing || 1;
    this.onGround = true;
    this.jumps = 0;

    this.maxHp = ch.stats.maxHp;
    this.hp = this.maxHp;
    this.hpGhost = this.maxHp;
    this.maxEnergy = 100;
    this.energy = 0;

    this.state = 'intro';
    this.stateTime = 0;
    this.move = null;
    this.moveFrame = 0;
    this.hitCd = 0;
    this.chainQueued = false;

    this.hurtT = 0;
    this.downT = 0;
    this.bounceCount = 0;
    this.burnT = 0;   // v0.13：灼烧状态剩余帧
    this.invuln = 0;
    this.flash = 0;
    this.blockT = 0;

    this.combo = 0;
    this.comboTimer = 0;

    this.usedAirAtk = false;
    this.dashDir = 0;
    this.dashT = 0;

    this.squash = { x: 1, y: 1 };
    this.seed = U.randInt(0, 999);
    this.drawScale = (NL.MODEL_SCALE || 1) * (this.char.scaleMul || 1);
    this.oppRef = null;
    this.laughStun = false;
    this.meteorLanded = false;
    this.ghosts = [];
    this.dashCd = 0;
    this.jcanCut = false;
  }

  Fighter.prototype.toIdle = function () {
    this.state = 'idle';
    this.stateTime = 0;
    this.move = null;
    this.moveFrame = 0;
    this.chainQueued = false;
    this.laughStun = false;
    this.meteorLanded = false;
  };

  Fighter.prototype.faceOpp = function (opp) {
    this.facing = (opp.x >= this.x) ? 1 : -1;
  };

  Fighter.prototype.jump = function () {
    var s = this.char.stats;
    this.vy = -s.jump;
    this.onGround = false;
    this.jumps = 1;
    this.state = 'jump';
    this.stateTime = 0;
    this.usedAirAtk = false;
    this.jcanCut = true;
    this.squash.x = 0.9;
    this.squash.y = 1.12;
    NL.SFX.play('jump');
    NL.FX.spawnDust(this.x, this.y, 0);
  };

  /* 虚步：长距离位移 + 全程无敌 + 残影 */
  Fighter.prototype.startDash = function (dir) {
    if (this.dashCd > 0) return;
    this.dashCd = 36;
    this.state = 'dash';
    this.stateTime = 0;
    this.dashDir = dir;
    this.dashT = 0;
    this.ghosts.length = 0;
    NL.SFX.play('dash');
    NL.FX.spawnDust(this.x, this.y, -dir);
  };

  Fighter.prototype.startAttack = function (name) {
    var mv = this.char.moves;
    if (!mv) return false;
    var m = mv[name];
    if (!m) return false;
    if (m.cost && this.energy < m.cost) return false;
    if (m.cost) this.energy -= m.cost;

    this.state = 'attack';
    this.stateTime = 0;
    this.move = m;
    this.moveFrame = 0;
    this.hitCd = 0;
    this.chainQueued = false;
    this.meteorLanded = false;
    if (m.hop) { this.vy = m.hop; this.onGround = false; }
    NL.SFX.play('swing');
    if (m.superMove) {
      NL.FX.flash(12, '#FFF7C2');
      NL.SFX.play('superFlash');
      NL.FX.shake(9);
      NL.FX.text(this.x, this.y - 150, '必杀：' + m.label, { size: 30, color: '#FF9FDF', dur: 60 });
    }
    return true;
  };

  Fighter.prototype.handleGround = function (inp, opp) {
    var mv = this.char.moves;
    if (!mv) { this.vx = 0; return; }
    var stats = this.char.stats;

    // 优先级：必杀 > 技能 > 组合技（跳/防 + 轻/重） > 普通攻击 > 防御 > 冲刺 > 跳跃 > 移动
    if (inp.pSup && mv.super && this.energy >= (mv.super.cost || 100)) { this.startAttack('super'); return; }
    if (inp.pSkill1 && mv.skill1 && this.energy >= (mv.skill1.cost || 0)) { this.startAttack('skill1'); return; }
    if (inp.pSkill2 && mv.skill2 && this.energy >= (mv.skill2.cost || 0)) { this.startAttack('skill2'); return; }
    if (inp.pLight && inp.up && mv.upLight) { this.startAttack('upLight'); return; }
    if (inp.pHeavy && inp.up && mv.upHeavy) { this.startAttack('upHeavy'); return; }
    if (inp.pLight && inp.down && mv.guardLight) { this.startAttack('guardLight'); return; }
    if (inp.pHeavy && inp.down && mv.guardHeavy) { this.startAttack('guardHeavy'); return; }
    if (inp.pLight) { this.startAttack('light1'); return; }
    if (inp.pHeavy) { this.startAttack('heavy'); return; }
    if (inp.down) {
      this.state = 'block';
      this.stateTime = 0;
      this.vx = 0;
      return;
    }
    if (inp.pDash) { this.startDash(inp.pDash); return; }
    if (inp.pUp) { this.jump(); return; }

    var dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (dir !== 0) {
      var fwd = (dir === this.facing);
      this.vx = dir * (fwd ? stats.walk : stats.back);
      if (this.state !== 'walk') { this.state = 'walk'; this.stateTime = 0; }
      if (this.stateTime % 14 === 7) NL.FX.spawnRunDust(this.x - this.facing * 26, this.y, -dir);
    } else {
      this.vx = 0;
      if (this.state !== 'idle') { this.state = 'idle'; this.stateTime = 0; }
    }
  };

  Fighter.prototype.airControl = function (inp) {
    var stats = this.char.stats;
    var dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (dir !== 0) {
      this.vx = U.approach(this.vx, dir * stats.walk * 0.95, 26);
    } else {
      this.vx = U.approach(this.vx, 0, 6);
    }
    // 跳跃松键 → 短跳（更跟手）
    if (this.jcanCut && !inp.up && this.vy < -180) {
      this.vy *= 0.78;
      this.jcanCut = false;
    }
    if (inp.pUp && this.jumps < 2) {
      this.jumps = 2;
      this.vy = -stats.jump2;
      this.jcanCut = true;
      this.squash.x = 0.88;
      this.squash.y = 1.14;
      NL.SFX.play('jump');
      NL.FX.spawnDust(this.x, this.y, 0);
    }
  };

  Fighter.prototype.updateAttack = function (inp) {
    var m = this.move;
    if (!m) { this.toIdle(); return; }
    this.moveFrame++;
    // 突进在"生效帧"才发力（起手阶段原地蓄力）
    if (m.lunge && this.moveFrame === m.startup) this.vx = this.facing * m.lunge;
    // 无敌帧窗口（防反 / 必杀演出）
    if (m.invuln && this.moveFrame >= m.invuln[0] && this.moveFrame <= m.invuln[1]) {
      this.invuln = Math.max(this.invuln, 2);
    }
    // 回血（干饭回血 / 喝咖啡）
    if (m.heal && this.moveFrame === (m.healAt || m.startup)) {
      this.hp = Math.min(this.maxHp, this.hp + m.heal);
      var healWord = this.char.id === 'loving' ? ' 治愈!' : (this.char.id === 'nailoong' ? ' 干饭!' : ' 回血!');
      NL.FX.text(this.x, this.y - 130, '+' + m.heal + healWord, { size: 26, color: '#8BFF9E', dur: 50 });
      NL.SFX.play('pop');
    }
    // 特效提示（撒币 / 火焰 / 金光）
    if (m.cue && this.moveFrame === (m.cue.at || m.startup)) {
      NL.FX.cue(this.x + this.facing * 42, this.y - 95, m.cue.type, this.facing);
    }
    // 发射投射物（音波 / 咖啡 / 激光 / 小紫兵 / 金币）
    if (m.spawn && this.moveFrame === m.spawn.at) {
      this.fireSpawn(m.spawn);
    }
    // 天降流星（异星奶龙必杀）：升空 → 锁定对手 → 砸下
    if (m.meteor && !this.meteorLanded) {
      var mt = this.moveFrame - m.startup;
      if (mt >= 0 && mt < 20) {
        this.onGround = false;
        this.vy = -1000;
        if (this.y < NL.GROUND - 480) this.y = NL.GROUND - 480;
      } else if (mt >= 20 && mt < 28) {
        this.onGround = false;
        this.vy = -15;
        var tx1 = this.oppRef ? this.oppRef.x : null;
        if (tx1 !== null) this.x += U.clamp(tx1 - this.x, -30, 30);
      } else if (mt >= 28) {
        this.onGround = false;
        this.vy = 1500;
        var tx2 = this.oppRef ? this.oppRef.x : null;
        if (tx2 !== null && this.y < NL.GROUND - 60) this.x += U.clamp(tx2 - this.x, -26, 26);
      }
    }
    var total = m.startup + m.active + m.recovery;
    var cancelPoint = m.startup + m.active + Math.floor(m.recovery * 0.45);

    if (m.next && inp.pLight && this.moveFrame >= m.startup) this.chainQueued = true;

    var decay = (m.vxDecay !== undefined) ? m.vxDecay : 0.86;
    this.vx *= decay;

    if (this.chainQueued && m.next && this.moveFrame >= cancelPoint) {
      this.chainQueued = false;
      if (this.startAttack(m.next)) {
        this.vx = this.facing * 70;
        return;
      }
    }
    if (this.moveFrame >= total) {
      this.toIdle();
    }
  };

  Fighter.prototype.update = function (opp, inp) {
    inp = inp || EMPTY_INPUT;
    // v0.12 替身术：受击 / 击倒时按 H（P2 小键盘 0）消耗 50 奶量脱身
    if (inp.pSub && (this.state === 'hurt' || this.state === 'hurtAir' || this.state === 'downed')) {
      this.trySubstitute(opp);
    }
    this.oppRef = opp;
    if (this.flash > 0) this.flash--;
    if (this.subCd > 0) this.subCd--;
    if (this.invuln > 0) this.invuln--;
    if (this.burnT > 0) {   // v0.13：灼烧状态（持续掉血）
      this.burnT--;
      if (this.burnT % 20 === 0 && this.hp > 0 && this.state !== 'ko') {
        this.hp = Math.max(0, this.hp - 9);
        this.flash = Math.max(this.flash || 0, 3);
        NL.FX.cue(this.x + Math.sin(this.burnT * 1.7) * 16, this.y - 46 - (this.burnT % 60), 'flame', (this.burnT % 2) ? 1 : -1);
        if (this.hp <= 0) this.die();
      }
    }
    if (this.hitCd > 0) this.hitCd--;
    if (this.blockT > 0) this.blockT--;
    if (this.dashCd > 0) this.dashCd--;
    // 虚步残影淡出
    for (var gI = this.ghosts.length - 1; gI >= 0; gI--) {
      this.ghosts[gI].a *= 0.84;
      if (this.ghosts[gI].a < 0.05) this.ghosts.splice(gI, 1);
    }
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer === 0) this.combo = 0;
    }
    this.squash.x = U.approach(this.squash.x, 1, 0.035);
    this.squash.y = U.approach(this.squash.y, 1, 0.035);
    this.stateTime++;

    switch (this.state) {
      case 'intro':
        if (this.stateTime > 80) this.toIdle();
        break;
      case 'idle':
      case 'walk':
        this.faceOpp(opp);
        this.handleGround(inp, opp);
        break;
      case 'block':
        this.vx = 0;
        // 防御中也能出"防反/投技"（按住防御键再按轻/重击）
        if (inp.pLight && this.char.moves && this.char.moves.guardLight) { this.startAttack('guardLight'); break; }
        if (inp.pHeavy && this.char.moves && this.char.moves.guardHeavy) { this.startAttack('guardHeavy'); break; }
        if (!inp.down && this.blockT <= 0) this.toIdle();
        break;
      case 'dash':
        this.dashT++;
        this.vx = this.dashDir * this.char.stats.dash * 4.2 * Math.max(0, 1 - this.dashT / 18);
        this.invuln = Math.max(this.invuln, 3);
        if (this.dashT % 2 === 1 && this.ghosts.length < 14) {
          this.ghosts.push({ x: this.x, y: this.y, facing: this.facing, a: 0.38 });
        }
        if (inp.pUp && this.onGround) { this.jump(); break; }
        if (inp.pLight) { this.startAttack('light1'); break; }
        if (inp.pHeavy) { this.startAttack('heavy'); break; }
        if (this.stateTime >= 15) { this.invuln = Math.max(this.invuln, 5); this.toIdle(); }
        break;
      case 'jump':
        this.airControl(inp);
        if (inp.pLight && !this.usedAirAtk) {
          this.usedAirAtk = true;
          this.startAttack('air');
        }
        break;
      case 'attack':
        this.updateAttack(inp);
        break;
      case 'hurt':
        this.vx = Math.abs(this.vx) < 6 ? 0 : this.vx * 0.88;
        if (this.stateTime >= this.hurtT) this.toIdle();
        break;
      case 'hurtAir':
        this.vx *= 0.99;
        break;
      case 'downed':
        if (this.stateTime >= this.downT) {
          this.state = 'getup';
          this.stateTime = 0;
          this.invuln = Math.max(this.invuln, 40);   // v0.12.1：起身全程无敌（含起身 20 帧 + 收尾余韵）
        }
        break;
      case 'getup':
        if (this.stateTime >= 20) {
          this.toIdle();
          this.invuln = 25;
        }
        break;
      case 'ko':
        this.vx = Math.abs(this.vx) < 6 ? 0 : this.vx * 0.96;
        break;
      case 'win':
        this.vx = 0;
        break;
    }

    // ===== 物理 =====
    if (!this.onGround) {
      this.vy += (this.vy > 0 ? FALL_GRAV : GRAV) / 60;
    }
    var prevY = this.y;
    this.x += this.vx / 60;
    this.y += this.vy / 60;

    // 多层平台（z轴）：下落时从上方落在平台上
    var ignorePlat = (this.state === 'attack' && this.move && this.move.meteor);
    if (!ignorePlat && this.vy >= 0) {
      var plats = NL.PLATFORMS || [];
      for (var pi = 0; pi < plats.length; pi++) {
        var pl = plats[pi];
        if (prevY <= pl.y + 1 && this.y >= pl.y &&
            this.x > pl.x - pl.w / 2 - 12 && this.x < pl.x + pl.w / 2 + 12) {
          this.y = pl.y;
          if (!this.onGround) {
            var imp = this.vy;
            this.onGround = true;
            this.onLand(imp);
            if (this.onGround) {
              this.vy = 0;
              this.jumps = 0;
              this.jcanCut = false;
            }
          } else {
            this.vy = 0;
          }
          break;
        }
      }
    }

    if (this.x < NL.WALL_L) { this.x = NL.WALL_L; if (this.vx < 0) this.vx = 0; }
    if (this.x > NL.WALL_R) { this.x = NL.WALL_R; if (this.vx > 0) this.vx = 0; }

    if (this.y >= NL.GROUND) {
      this.y = NL.GROUND;
      if (!this.onGround) {
        var impact = this.vy;
        this.onGround = true;
        this.onLand(impact);
        if (this.onGround) {
          this.vy = 0;
          this.jumps = 0;
          this.jcanCut = false;
        }
      } else {
        this.vy = 0;
      }
    } else if (this.onGround) {
      // 站在平台上：检查脚下是否还有支撑（走出边缘就掉下去）
      var supported = false;
      var plats2 = NL.PLATFORMS || [];
      for (var qi = 0; qi < plats2.length; qi++) {
        var q = plats2[qi];
        if (Math.abs(this.y - q.y) < 3 &&
            this.x > q.x - q.w / 2 - 12 && this.x < q.x + q.w / 2 + 12) { supported = true; break; }
      }
      if (!supported) this.onGround = false;
    }
  };

  Fighter.prototype.onLand = function (impact) {
    NL.SFX.play('land');
    NL.FX.spawnDust(this.x, this.y, 0);
    this.squash.x = 1.14;
    this.squash.y = 0.82;

    if (this.state === 'hurtAir') {
      if (Math.abs(impact) > 520 && this.bounceCount < 1) {
        this.bounceCount++;
        this.vy = -Math.abs(impact) * 0.45;
        this.vx *= 0.55;
        this.onGround = false;
        NL.SFX.play('duang');
        NL.FX.text(this.x, this.y - 140, 'duang~', { size: 30, color: '#FFE066' });
      } else {
        this.state = 'downed';
        this.stateTime = 0;
        this.downT = 46;
        this.vx = 0;
        this.vy = 0;
        if (this.hp <= 0) {
          this.state = 'ko';
          this.stateTime = 0;
        }
      }
    } else if (this.state === 'ko') {
      this.vx = 0;
      this.vy = 0;
    } else if (this.state === 'attack') {
      if (this.move && this.move.meteor) {
        this.meteorLanded = true;
        NL.FX.shake(18);
        NL.FX.flash(10, '#FFE9A8');
        NL.FX.spawnDust(this.x, this.y, 0);
        NL.SFX.play('hitBig');
      }
      if (this.move && (this.move.air || this.move.meteor)) this.toIdle();
    } else if (this.state === 'jump') {
      this.state = 'idle';
      this.stateTime = 0;
    }
  };

  Fighter.prototype.getHitbox = function () {
    if (this.state !== 'attack' || !this.move) return null;
    var m = this.move;
    if (m.nohit) return null;
    if (this.moveFrame < m.startup) return null;
    if (this.moveFrame >= m.startup + m.active) return null;
    if (this.hitCd > 0) return null;
    var hb = m.hitbox;
    var S = NL.MODEL_SCALE || 1;
    var x = this.facing === 1 ? this.x + hb.x * S : this.x - (hb.x + hb.w) * S;
    return { x: x, y: this.y + hb.y * S, w: hb.w * S, h: hb.h * S };
  };

  Fighter.prototype.getHurtbox = function () {
    var S = (NL.MODEL_SCALE || 1) * (this.char.scaleMul || 1);
    if (this.state === 'downed' || (this.state === 'ko' && this.onGround)) {
      return { x: this.x - 48 * S, y: this.y - 46 * S, w: 96 * S, h: 46 * S };
    }
    return { x: this.x - 34 * S, y: this.y - 122 * S, w: 68 * S, h: 122 * S };
  };

  Fighter.prototype.canBeHit = function () {
    if (this.invuln > 0) return false;
    if (this.state === 'downed') return false;
    if (this.state === 'ko') return false;
    return true;
  };

  Fighter.prototype.takeHit = function (attacker, m, blocked) {
    var wf = 1 / (this.char.stats.weight || 1);
    if (this.hp <= 0) return;

    if (blocked) {
      var chip = Math.max(1, Math.round((m.damage || 0) * 0.08));
      this.hp = Math.max(0, this.hp - chip);
      this.energy = Math.min(this.maxEnergy, this.energy + 4);
      attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + 6);
      this.blockT = m.blockstun || 8;
      this.state = 'block';
      this.stateTime = 0;
      this.vx = attacker.facing * (m.kbx || 100) * 0.45 * wf;
      this.flash = 4;
      if (this.hp <= 0) this.die();
      return 'block';
    }

    var dmg = Math.round(m.damage || 0);
    this.hp = Math.max(0, this.hp - dmg);
    this.energy = Math.min(this.maxEnergy, this.energy + 5);
    attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + (m.energyGain || 8));
    attacker.combo++;
    attacker.comboTimer = 110;

    this.flash = 7;
    this.squash.x = 1.16;
    this.squash.y = 0.84;
    this.vx = attacker.facing * (m.kbx || 100) * wf;
    var launch = (m.kvy || 0);
    if (launch < 0 && !m.rehit) {
      this.state = 'hurtAir';
      this.stateTime = 0;
      this.vy = launch * wf;
      this.onGround = false;
      this.bounceCount = 0;
    } else {
      this.state = 'hurt';
      this.stateTime = 0;
      this.hurtT = m.hitstun || 15;
      this.vy = 0;
    }
    // 笑场传染：被魔性笑声击中会笑到停不下来
    if (m.deepStun) {
      this.state = 'hurt';
      this.stateTime = 0;
      this.hurtT = Math.max(this.hurtT || 0, m.deepStun);
      this.vy = 0;
      this.laughStun = true;
      NL.FX.text(this.x, this.y - 152, '笑抽了！', { size: 28, color: '#FF9FDF', dur: 60 });
    }
    // 背摔（投技）：把对手甩到身后
    if (m.throwTo) {
      this.x = attacker.x - attacker.facing * 62;
      this.facing = attacker.facing;
      this.state = 'hurtAir';
      this.stateTime = 0;
      this.vy = -420;
      this.vx = -attacker.facing * 40;
      this.onGround = false;
      this.bounceCount = 1;
      NL.FX.text(this.x, this.y - 165, '背摔！', { size: 32, color: '#FFD93B', dur: 60 });
    }
    if (this.hp <= 0) this.die();
    return 'hit';
  };

  /* v0.12：替身术——受击/击倒时消耗一半奶量，原地留木桩、瞬移到攻击者身后 */
  Fighter.prototype.trySubstitute = function (opp) {
    if (this.energy < 50 || (this.subCd > 0)) return false;
    var st = this.state;
    if (st !== 'hurt' && st !== 'hurtAir' && st !== 'downed') return false;
    this.energy -= 50;
    this.subCd = 70;
    if (this.battle && this.battle.spawnDecoy) this.battle.spawnDecoy(this.x, this.y, this.facing);
    var tx = opp ? (opp.x - opp.facing * 150) : (this.x - this.facing * 150);
    tx = U.clamp(tx, (NL.WALL_L || 150) + 60, (NL.WALL_R || 1130) - 60);
    NL.FX.cue(this.x, this.y - 46, 'poof', 1);
    this.x = tx;
    this.y = NL.GROUND;
    this.vx = 0; this.vy = 0;
    this.onGround = true;
    this.state = 'idle'; this.stateTime = 0;
    this.move = null; this.moveFrame = 0;
    this.hurtT = 0; this.laughStun = false;
    this.bounceCount = 0;
    this.invuln = Math.max(this.invuln, 45);
    this.flash = 6;
    if (opp) this.facing = (opp.x >= this.x) ? 1 : -1;
    this.ghosts.push({ x: this.x, y: this.y, facing: this.facing, a: 0.4 });
    NL.FX.cue(this.x, this.y - 46, 'poof', -1);
    NL.FX.text(this.x, this.y - 150, '替身术！', { size: 30, color: '#BFE9FF', dur: 56 });
    NL.SFX.play('substitute');
    return true;
  };

  Fighter.prototype.die = function () {
    this.state = 'ko';
    this.stateTime = 0;
    this.invuln = 99999;
    this.move = null;
    if (this.onGround) {
      this.vy = -340;
      this.onGround = false;
    }
  };

  Fighter.prototype.resetRound = function (x, facing) {
    this.x = x;
    this.y = NL.GROUND;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.onGround = true;
    this.jumps = 0;
    this.hp = this.maxHp;
    this.hpGhost = this.maxHp;
    this.energy = 0;
    this.state = 'intro';
    this.stateTime = 0;
    this.move = null;
    this.moveFrame = 0;
    this.hitCd = 0;
    this.burnT = 0;   // v0.13：灼烧状态剩余帧
    this.invuln = 0;
    this.flash = 0;
    this.blockT = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.usedAirAtk = false;
    this.bounceCount = 0;
    this.squash = { x: 1, y: 1 };
    this.laughStun = false;
    this.meteorLanded = false;
    this.ghosts.length = 0;
    this.dashCd = 0;
    this.subCd = 0;
    this.jcanCut = false;
    this.drawScale = (NL.MODEL_SCALE || 1) * (this.char.scaleMul || 1);
  };

  /* 发射投射物（由招式 spawn 字段驱动） */
  Fighter.prototype.fireSpawn = function (sp) {
    if (!this.battle) return;
    var dir = this.facing;
    var n = sp.count || 1;
    var S = NL.MODEL_SCALE || 1;
    // 看笑了必杀·天降旧手机山：从高空瞄准对手当前位置砸下
    if (sp.type === 'phonemountain') {
      var opp = this.battle.fighters[1 - this.playerIndex];
      var tx = U.clamp(opp ? opp.x : this.x + dir * 220, NL.WALL_L + 150, NL.WALL_R - 150);
      this.battle.spawnProjectile({
        type: 'phonemountain', x: tx, y: NL.GROUND - 1000, dir: dir, vy: 760, owner: this
      });
      NL.SFX.play('swing');
      NL.FX.cue(this.x + dir * 48 * S, this.y - 100 * S, 'poof', dir);
      return;
    }
    // v0.12：巨型香蕉 / 黑板 —— 从高空瞄准对手砸下
    if (sp.type === 'giantbanana' || sp.type === 'blackboard') {
      var oppG = this.battle.fighters[1 - this.playerIndex];
      var txG = U.clamp(oppG ? oppG.x : this.x + dir * 220, NL.WALL_L + 130, NL.WALL_R - 130);
      this.battle.spawnProjectile({
        type: sp.type, x: txG, y: NL.GROUND - 950, dir: dir, vy: 120, owner: this
      });
      NL.SFX.play('swing');
      NL.FX.cue(this.x + dir * 50 * S, this.y - 110 * S, 'poof', dir);
      return;
    }
    // v0.12：九一必杀·音波领域 —— 向左右两侧全图扩散的音波墙
    if (sp.type === 'screenwave') {
      this.battle.spawnProjectile({ type: 'screenwave', x: this.x, y: this.y - 150 * S, dir: 1, owner: this });
      this.battle.spawnProjectile({ type: 'screenwave', x: this.x, y: this.y - 150 * S, dir: -1, owner: this });
      NL.FX.flash(8, '#BFE9FF');
      NL.FX.shake(10);
      NL.SFX.play('superFlash');
      NL.FX.cue(this.x, this.y - 110 * S, 'note', 1);
      return;
    }
    // v0.13：大高个必杀·黑板之盾（跟随持有者的黑板壁垒）
    if (sp.type === 'boardshield') {
      this.battle.spawnProjectile({
        type: 'boardshield',
        x: this.x + dir * 76 * S,
        y: this.y - 92,
        dir: dir, vy: 0, owner: this
      });
      NL.SFX.play('block');
      NL.FX.cue(this.x + dir * 60 * S, this.y - 120 * S, 'poof', dir);
      NL.FX.text(this.x, this.y - 190 * S, '黑板之盾！', { size: 30, color: '#BFE9FF', dur: 56 });
      return;
    }
    // v0.13：老白必杀·大范围烟雾（宽超全屏 · 遇火爆炸）
    if (sp.type === 'smoke') {
      this.battle.spawnProjectile({
        type: 'smoke',
        x: this.x + dir * 140,
        y: NL.GROUND - 196,
        dir: dir, vy: 0, owner: this
      });
      NL.SFX.play('flame');
      NL.FX.flash(5, '#D8D2C8');
      NL.FX.cue(this.x + dir * 90 * S, this.y - 120 * S, 'poof', dir);
      NL.FX.text(this.x, this.y - 200 * S, '烟雾弥漫…', { size: 30, color: '#CFCFCF', dur: 60 });
      return;
    }
    // v0.13：苦瓜必杀·全屏香蕉雨（14 根从天而降）
    if (sp.type === 'rainbanana') {
      for (var rb = 0; rb < 14; rb++) {
        var bx2 = this.x - 720 + rb * (1440 / 13);
        this.battle.spawnProjectile({
          type: 'rainbanana',
          x: U.clamp(bx2, NL.WALL_L + 40, NL.WALL_R - 40),
          y: NL.GROUND - 880 - (rb % 3) * 60,
          dir: (rb % 2 === 0) ? 1 : -1,
          vy: 40 + (rb % 3) * 90,
          owner: this
        });
      }
      NL.SFX.play('superFlash');
      NL.FX.shake(8);
      NL.FX.text(this.x, this.y - 200 * S, '香蕉雨！', { size: 32, color: '#FFE066', dur: 64 });
      return;
    }
    // v0.12：老白喷火 —— 面前形成横向火柱（大招更宽更远）
    if (sp.type === 'firestrip' || sp.type === 'bigfire') {
      var isBig = (sp.type === 'bigfire');
      this.battle.spawnProjectile({
        type: sp.type,
        x: this.x + dir * (isBig ? 320 : 300) * S,   // v0.12.1：火柱整体前移（加长后仍从面前喷出）
        y: NL.GROUND - 98,
        dir: dir, vy: 0, owner: this
      });
      NL.SFX.play('flame');
      NL.FX.cue(this.x + dir * 56 * S, this.y - 96 * S, 'flame', dir);
      return;
    }
    for (var i = 0; i < n; i++) {
      var off = (n > 1) ? (i - (n - 1) / 2) : 0;
      var vy = 0;
      if (sp.type === 'note') vy = off * 26;
      else if (sp.type === 'coin') vy = -260 + off * 70;
      else if (sp.type === 'rocket') vy = off * 20;
      else if (sp.type === 'banana') vy = -390 + off * 30;                    // 抛物线
      else if (sp.type === 'winebottle') vy = 0;                              // v0.12.1：水平投掷（终点炸开留水渍）
      else if (sp.type === 'laser' || sp.type === 'laser3') vy = off * 30;    // 多管扇形
      else vy = off * 16;
      var sy = this.y - 100 * S + off * 8;
      if (sp.type === 'laughwave') { sy = NL.GROUND - 46; vy = 0; }
      if (sp.type === 'rollmelon') { sy = NL.GROUND - 22; vy = 0; }           // 贴地滚动
      this.battle.spawnProjectile({
        type: sp.type,
        x: this.x + dir * 48 * S,
        y: sy,
        dir: dir,
        vy: vy,
        owner: this
      });
    }
    NL.SFX.play('swing');
    NL.FX.cue(this.x + dir * 48 * S, this.y - 100 * S,
      (sp.type === 'minion' || sp.type === 'phone' || sp.type === 'phonespin' ||
        sp.type === 'banana' || sp.type === 'rollmelon' || sp.type === 'winebottle' ||
        sp.type === 'chalk' || sp.type === 'eraser') ? 'poof'
        : (sp.type === 'note' ? 'note' : 'flame'), dir);
  };

  NL.Fighter = Fighter;
})();
