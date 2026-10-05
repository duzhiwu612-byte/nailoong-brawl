/* 奶龙大乱斗 - 电脑对手 AI（三档难度） */
var NL = window.NL = window.NL || {};
(function () {
  'use strict';
  var U = NL.util;

  var LEVELS = [
    {
      name: '菜鸡奶龙', thinkMin: 26, thinkMax: 52,
      idleChance: 0.34, blockChance: 0.10, jumpChance: 0.08,
      dashChance: 0.08, aggr: 0.45, superChance: 0.25, skillChance: 0.25
    },
    {
      name: '普通奶龙', thinkMin: 10, thinkMax: 26,
      idleChance: 0.14, blockChance: 0.32, jumpChance: 0.14,
      dashChance: 0.22, aggr: 0.75, superChance: 0.45, skillChance: 0.45
    },
    {
      name: '暴走奶龙', thinkMin: 5, thinkMax: 13,
      idleChance: 0.03, blockChance: 0.55, jumpChance: 0.16,
      dashChance: 0.35, aggr: 0.95, superChance: 0.6, skillChance: 0.6
    }
  ];

  function AI(level) {
    this.level = U.clamp(level || 0, 0, 2);
    this.cfg = LEVELS[this.level];
    this.plan = null;
    this.planT = 0;
  }

  AI.prototype.emptyState = function () {
    return {
      left: false, right: false, up: false, down: false,
      light: false, heavy: false, skill1: false, skill2: false, sup: false,
      pLeft: false, pRight: false, pUp: false, pDown: false,
      pLight: false, pHeavy: false, pSkill1: false, pSkill2: false, pSup: false,
      pDash: 0
    };
  };

  AI.prototype.decide = function (f, opp, dist, dir) {
    var cfg = this.cfg;
    var p = { type: 'idle', age: 0 };
    this.planT = U.randInt(cfg.thinkMin, cfg.thinkMax);

    // 危险感知：对手近身出招 → 防御 或 防反
    var oppAttacking = (opp.state === 'attack') && opp.moveFrame < 14;
    if (oppAttacking && dist < 180) {
      var roll = Math.random();
      if (roll < cfg.blockChance * 0.55) {
        p.type = 'block';
        this.planT = U.randInt(14, 28);
        this.plan = p;
        return;
      }
      if (roll < cfg.blockChance * 0.9) {
        p.type = 'counter';
        this.planT = 26;
        this.plan = p;
        return;
      }
    }
    // 对空：对手在空中 → 上挑
    if (!opp.onGround && dist < 170 && dist > 30 && Math.random() < 0.5) {
      p.type = 'anti';
      this.planT = 24;
      this.plan = p;
      return;
    }
    // 贴身 → 投技
    if (dist < 80 && Math.random() < 0.3 * cfg.aggr) {
      p.type = 'throw';
      this.planT = 30;
      this.plan = p;
      return;
    }

    var mv = f.char.moves;

    // 必杀就绪
    if (mv && mv.super && f.energy >= (mv.super.cost || 100) && dist < 300 && Math.random() < cfg.superChance) {
      p.type = 'super';
      this.planT = 34;
      this.plan = p;
      return;
    }
    // 技能
    if (mv && mv.skill1 && f.energy >= (mv.skill1.cost || 0) && dist > 150 && dist < 430 && Math.random() < cfg.skillChance) {
      p.type = 'skill';
      this.planT = 28;
      this.plan = p;
      return;
    }
    // 技能2
    if (mv && mv.skill2 && f.energy >= (mv.skill2.cost || 0) && dist > 120 && dist < 430 && Math.random() < cfg.skillChance * 0.7) {
      p.type = 'skill2';
      this.planT = 30;
      this.plan = p;
      return;
    }
    // 平台追击：对手在上方平台 → 跳上去打
    if (opp.y < f.y - 70 && Math.abs(dx) < 420 && Math.random() < 0.75) {
      p.type = 'jumpUp';
      this.planT = 48;
      this.plan = p;
      return;
    }
    // 远程压制：中远距离扔远程重击
    if (dist > 240 && dist < 720 && Math.random() < 0.35 * cfg.aggr) {
      p.type = 'heavy';
      this.planT = 40;
      this.plan = p;
      return;
    }

    if (dist > 360) {
      if (Math.random() < cfg.dashChance) { p.type = 'dashIn'; this.planT = 20; }
      else { p.type = 'walkTo'; this.planT = U.randInt(20, 40); }
    } else if (dist > 145) {
      var r = Math.random();
      if (r < cfg.jumpChance) { p.type = 'jumpIn'; this.planT = 36; }
      else if (r < cfg.jumpChance + cfg.dashChance) { p.type = 'dashIn'; this.planT = 18; }
      else if (r < cfg.jumpChance + cfg.dashChance + cfg.aggr) { p.type = 'walkTo'; this.planT = U.randInt(14, 28); }
      else { p.type = 'retreat'; this.planT = U.randInt(12, 26); }
    } else {
      var r2 = Math.random();
      if (r2 < cfg.idleChance) { p.type = 'idle'; }
      else if (r2 < cfg.idleChance + 0.85 * cfg.aggr) { p.type = 'attack'; this.planT = U.randInt(24, 46); }
      else if (r2 < cfg.idleChance + 0.85 * cfg.aggr + 0.12) { p.type = 'heavy'; this.planT = 32; }
      else { p.type = 'retreat'; this.planT = U.randInt(10, 20); }
    }
    this.plan = p;
  };

  AI.prototype.getState = function (f, opp, battle) {
    var s = this.emptyState();
    var dx = opp.x - f.x;
    var dist = Math.abs(dx);
    var dir = dx >= 0 ? 1 : -1;

    if (!this.plan || this.planT <= 0) {
      this.decide(f, opp, dist, dir);
    }
    var p = this.plan;
    this.planT--;
    p.age++;

    switch (p.type) {
      case 'idle':
        break;
      case 'walkTo':
        if (dir > 0) s.right = true; else s.left = true;
        break;
      case 'retreat':
        if (dir > 0) s.left = true; else s.right = true;
        break;
      case 'block':
        s.down = true;
        break;
      case 'jumpIn':
        if (p.age === 1) s.pUp = true;
        if (p.age > 2 && p.age < 26) {
          if (dir > 0) s.right = true; else s.left = true;
        }
        break;
      case 'jumpUp':
        if (p.age === 1) s.pUp = true;
        if (p.age === 16 && f.jumps < 2) s.pUp = true;
        if (p.age > 2) { if (dir > 0) s.right = true; else s.left = true; }
        break;
      case 'dashIn':
        if (p.age === 1) s.pDash = dir;
        if (dir > 0) s.right = true; else s.left = true;
        break;
      case 'attack':
        if (p.age % 8 === 1) s.pLight = true;
        break;
      case 'heavy':
        if (p.age === 1) s.pHeavy = true;
        break;
      case 'skill':
        if (p.age === 1) s.pSkill1 = true;
        break;
      case 'skill2':
        if (p.age === 1) s.pSkill2 = true;
        break;
      case 'counter':
        if (p.age === 1) { s.down = true; s.pLight = true; }
        else if (p.age < 8) { s.down = true; }
        break;
      case 'throw':
        if (p.age === 1) { s.down = true; s.pHeavy = true; }
        else if (p.age < 6) { s.down = true; }
        break;
      case 'anti':
        if (p.age === 1) { s.up = true; s.pLight = true; }
        break;
      case 'super':
        if (p.age === 1) s.pSup = true;
        break;
    }
    return s;
  };

  AI.prototype.label = function () {
    return this.cfg.name;
  };

  NL.AI = AI;
  NL.AI_LEVELS = LEVELS;
})();
