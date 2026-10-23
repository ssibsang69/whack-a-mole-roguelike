/**
 * 핵심 게임 엔진 (Core Game Loop & State Machine)
 */

import { sound } from './audio.js';
import { storage } from './storage.js';
import { AugmentManager } from './augments.js';
import { BossInstance, BOSS_TYPES } from './boss.js';
import { ShopManager } from './shop.js';

export const GAME_STATES = {
  MENU: 'MENU',
  COUNTDOWN: 'COUNTDOWN',
  PLAYING: 'PLAYING',
  AUGMENT_SELECT: 'AUGMENT_SELECT',
  BOSS_WARNING: 'BOSS_WARNING',
  BOSS_PLAYING: 'BOSS_PLAYING',
  BOSS_REWARD: 'BOSS_REWARD',
  BOSS_FLED: 'BOSS_FLED',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY'
};

export class GameEngine {
  constructor(callbacks = {}) {
    this.cb = callbacks; // UI 이벤트 콜백들
    this.augmentManager = new AugmentManager();
    this.shopManager = new ShopManager();

    this.state = GAME_STATES.MENU;
    this.gridSize = 3; // 3x3 = 9, 4x4 = 16
    this.holes = [];

    // 게임 수치
    this.score = 0;
    this.coins = 0;
    this.wave = 1;
    this.maxWave = 9;
    this.waveTimeLeft = 30;
    this.combo = 0;
    this.maxComboThisGame = 0;
    this.comboTimer = 0;
    this.comboMaxDuration = 2.4;

    this.totalKills = 0;
    this.normalKills = 0;
    this.goldenKills = 0;
    this.bossKills = 0;
    this.missClicks = 0;
    this.molesEscaped = 0;

    // 증강 선택 카운터 (일반 두더지 15마리마다)
    this.killsTowardsAugment = 0;
    this.killsPerAugmentGoal = 15;

    // 방어막
    this.shields = 0;

    // 상점 버프
    this.shopBuffs = {
      exposureBoost: 0,
      guaranteedGoldMoles: 0
    };

    // 봉쇄된 구멍 목록
    this.blockedHoles = new Set();

    // 보스 인스턴스
    this.bossInstance = null;

    // 루프 타이머들
    this.lastFrameTime = 0;
    this.animFrameId = null;
    this.spawnTimer = 0;
    this.autoMalletTimer = 0;
    this.isPaused = false;
  }

  init(gridSize = 3) {
    this.gridSize = gridSize;
    this.createHoles();
  }

  setGridSize(size) {
    this.gridSize = size;
    this.createHoles();
    if (this.cb.onGridChanged) {
      this.cb.onGridChanged(this.gridSize);
    }
  }

  createHoles() {
    const total = this.gridSize * this.gridSize;
    this.holes = [];
    for (let i = 0; i < total; i++) {
      this.holes.push({
        index: i,
        hasMole: false,
        moleType: 'normal', // 'normal', 'golden', 'bomb', 'boss', 'boss_clone'
        isHit: false,
        isWeakPoint: false,
        isCloneFake: false,
        timer: 0,
        maxTimer: 1.5,
        state: 'IDLE' // 'IDLE', 'EMERGING', 'ACTIVE', 'HIT', 'RETREATING'
      });
    }
  }

  startNewGame() {
    this.score = 0;
    this.coins = 0;
    this.wave = 1;
    this.combo = 0;
    this.maxComboThisGame = 0;
    this.comboTimer = 0;
    this.totalKills = 0;
    this.normalKills = 0;
    this.goldenKills = 0;
    this.bossKills = 0;
    this.missClicks = 0;
    this.molesEscaped = 0;
    this.killsTowardsAugment = 0;

    this.augmentManager.reset();
    this.shopManager.resetWave();
    this.blockedHoles.clear();
    this.shopBuffs = { exposureBoost: 0, guaranteedGoldMoles: 0 };

    this.createHoles();
    this.shields = this.augmentManager.getShieldsPerWave();

    this.startCountdown();
  }

  startCountdown() {
    this.setState(GAME_STATES.COUNTDOWN);
    let count = 3;
    if (this.cb.onCountdown) this.cb.onCountdown(count);

    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        sound.playClick();
        if (this.cb.onCountdown) this.cb.onCountdown(count);
      } else {
        clearInterval(timer);
        if (this.cb.onCountdown) this.cb.onCountdown('시작!');
        sound.playComboMilestone();
        setTimeout(() => {
          this.startWave(this.wave);
        }, 500);
      }
    }, 900);
  }

  startWave(waveNum) {
    this.wave = waveNum;
    this.clearAllMoles();
    this.shopBuffs.exposureBoost = 0;
    this.shopManager.resetWave();

    // 철갑 두더지 도주 패널티(구멍 1개 봉쇄) 만료 처리
    if (this.blockedHoles.size > 0 && waveNum !== 7) {
      this.blockedHoles.clear();
    }

    // 불굴의 의지 증강: 웨이브 시작 시 보호막 재충전
    this.shields = Math.max(this.shields, this.augmentManager.getShieldsPerWave());

    // 보스 웨이브인지 체크
    if (waveNum === 3 || waveNum === 6 || waveNum === 9) {
      this.triggerBossEncounter(waveNum);
      return;
    }

    // 일반 웨이브
    this.setState(GAME_STATES.PLAYING);
    sound.startBGM('normal');

    const extraTime = this.augmentManager.getExtraTime();
    this.waveTimeLeft = 28 + extraTime;
    this.spawnTimer = 0.5;

    if (this.cb.onWaveStart) {
      this.cb.onWaveStart(this.wave, this.waveTimeLeft);
    }

    this.startLoop();
  }

  triggerBossEncounter(waveNum) {
    this.setState(GAME_STATES.BOSS_WARNING);
    sound.stopBGM();
    sound.playBossWarning();

    const bossKey = waveNum === 3 ? 'mole_king' : waveNum === 6 ? 'iron_mole' : 'demon_mole';
    this.bossInstance = new BossInstance(bossKey, this.augmentManager);

    if (this.cb.onBossWarning) {
      this.cb.onBossWarning(this.bossInstance.config);
    }

    // 2.2초 후 보스전 진입
    setTimeout(() => {
      if (this.state !== GAME_STATES.BOSS_WARNING) return;
      this.setState(GAME_STATES.BOSS_PLAYING);
      sound.startBGM('boss');
      this.bossInstance.relocate(this.holes.length);
      this.syncBossHoles();
      this.startLoop();
    }, 2200);
  }

  startLoop() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.lastFrameTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  stopLoop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = currentTime;

    if (!this.isPaused) {
      this.update(dt);
    }

    if (
      this.state === GAME_STATES.PLAYING ||
      this.state === GAME_STATES.BOSS_PLAYING
    ) {
      this.animFrameId = requestAnimationFrame(this.loop);
    }
  }

  update(dt) {
    // 콤보 타이머 감소
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.resetCombo(false); // 타임아웃 콤보 초기화
      }
    }

    // 자동 망치 증강 체크
    this.updateAutoMallet(dt);

    // 일반 웨이브 진행 중
    if (this.state === GAME_STATES.PLAYING) {
      this.waveTimeLeft -= dt;
      if (this.waveTimeLeft <= 0) {
        this.waveTimeLeft = 0;
        this.completeWave();
        return;
      }

      // 두더지 스폰
      this.updateSpawner(dt);

      // 개별 두더지 상태 업데이트
      this.updateMoles(dt);
    }

    // 보스전 진행 중
    else if (this.state === GAME_STATES.BOSS_PLAYING && this.bossInstance) {
      this.bossInstance.update(dt, this.holes.length);
      this.syncBossHoles();

      // 보스 처치 판정
      if (this.bossInstance.state === 'DEFEATED') {
        this.handleBossDefeated();
        return;
      }

      // 보스 도주 판정
      if (this.bossInstance.state === 'FLED') {
        this.handleBossFled();
        return;
      }
    }

    if (this.cb.onTick) {
      this.cb.onTick({
        score: this.score,
        coins: this.coins,
        wave: this.wave,
        waveTimeLeft: this.waveTimeLeft,
        combo: this.combo,
        comboRatio: Math.max(0, this.comboTimer / this.getComboMaxDuration()),
        boss: this.bossInstance
      });
    }
  }

  updateSpawner(dt) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnMole();

      // 다음 스폰 간격 (웨이브가 오를수록 단축)
      const baseInterval = Math.max(0.55, 1.3 - this.wave * 0.08);
      this.spawnTimer = baseInterval * (0.8 + Math.random() * 0.4);
    }
  }

  spawnMole() {
    // 빈 구멍 찾기 (봉쇄된 구멍 제외)
    const availableHoles = this.holes.filter(
      (h) => !h.hasMole && !this.blockedHoles.has(h.index)
    );
    if (availableHoles.length === 0) return;

    // 동시 출현 수 제한 (웨이브별 2 ~ 4마리)
    const maxActive = Math.min(
      this.gridSize === 4 ? 6 : 4,
      Math.floor(2 + this.wave * 0.3)
    );
    const activeCount = this.holes.filter((h) => h.hasMole).length;
    if (activeCount >= maxActive) return;

    const hole = availableHoles[Math.floor(Math.random() * availableHoles.length)];

    // 두더지 종류 결정
    let moleType = 'normal';
    const goldBonus = this.augmentManager.getLuckyMoleBonus();

    if (this.shopBuffs.guaranteedGoldMoles > 0) {
      moleType = 'golden';
      this.shopBuffs.guaranteedGoldMoles--;
    } else {
      const roll = Math.random();
      const goldChance = 0.08 + goldBonus;
      const bombChance = Math.min(0.18, 0.06 + this.wave * 0.015);

      if (roll < bombChance) {
        moleType = 'bomb';
      } else if (roll < bombChance + goldChance) {
        moleType = 'golden';
      } else {
        moleType = 'normal';
      }
    }

    // 노출 지속 시간 계산
    const baseDuration = Math.max(1.1, 2.0 - this.wave * 0.09);
    const exposureBonus = this.augmentManager.getExposureBonus() + this.shopBuffs.exposureBoost;
    const duration = baseDuration * (1 + exposureBonus);

    hole.hasMole = true;
    hole.moleType = moleType;
    hole.isHit = false;
    hole.timer = duration;
    hole.maxTimer = duration;
    hole.state = 'ACTIVE';

    if (this.cb.onMoleSpawn) {
      this.cb.onMoleSpawn(hole);
    }
  }

  updateMoles(dt) {
    for (const hole of this.holes) {
      if (!hole.hasMole) continue;

      if (hole.state === 'ACTIVE') {
        hole.timer -= dt;
        if (hole.timer <= 0) {
          // 도망침 (두더지 놓침)
          hole.state = 'RETREATING';
          if (hole.moleType !== 'bomb' && !hole.isHit) {
            this.molesEscaped++;
            // 두더지 놓치면 콤보 초기화
            this.resetCombo(false);
          }
          if (this.cb.onMoleRetreat) this.cb.onMoleRetreat(hole);

          setTimeout(() => {
            hole.hasMole = false;
            hole.state = 'IDLE';
            if (this.cb.onMoleCleared) this.cb.onMoleCleared(hole);
          }, 300);
        }
      }
    }
  }

  syncBossHoles() {
    if (!this.bossInstance) return;
    for (const hole of this.holes) {
      const clone = this.bossInstance.cloneHoles.find((c) => c.holeIndex === hole.index);
      if (clone) {
        hole.hasMole = true;
        hole.moleType = 'boss';
        hole.isCloneFake = !clone.isReal;
        hole.isWeakPoint = clone.isReal && this.bossInstance.isWeakPointExposed;
        hole.state = 'ACTIVE';
      } else if (hole.moleType === 'boss') {
        hole.hasMole = false;
        hole.state = 'IDLE';
      }
    }
    if (this.cb.onBossSync) {
      this.cb.onBossSync(this.bossInstance, this.holes);
    }
  }

  // --- 타격 핸들러 ---
  whackHole(holeIndex, isWeakPointArea = false) {
    if (
      this.state !== GAME_STATES.PLAYING &&
      this.state !== GAME_STATES.BOSS_PLAYING
    ) {
      return null;
    }

    const hole = this.holes[holeIndex];
    if (!hole) return null;

    // 보스전 타격
    if (this.state === GAME_STATES.BOSS_PLAYING && this.bossInstance) {
      return this.whackBoss(holeIndex, isWeakPointArea);
    }

    // 일반 웨이브 타격
    if (!hole.hasMole || hole.state !== 'ACTIVE' || hole.isHit) {
      // 헛스윙(미스 클릭)
      this.missClicks++;
      this.handleMiss();
      return { type: 'MISS', holeIndex };
    }

    // 타격 성공 처리
    hole.isHit = true;
    hole.state = 'HIT';

    if (hole.moleType === 'bomb') {
      return this.handleBombHit(hole);
    } else if (hole.moleType === 'golden') {
      return this.handleGoldenHit(hole);
    } else {
      return this.handleNormalHit(hole);
    }
  }

  handleNormalHit(hole) {
    sound.playHitNormal();
    this.totalKills++;
    this.normalKills++;
    this.killsTowardsAugment++;

    this.incrementCombo();

    // 점수 계산
    const baseScore = 100;
    const scoreMult = this.augmentManager.getScoreMultiplier();
    const comboMult = this.getComboMultiplier();
    let earnedScore = Math.floor(baseScore * scoreMult * comboMult);

    // 황금 손 증강
    let isMidas = false;
    if (Math.random() < this.augmentManager.getMidasChance()) {
      earnedScore *= 2;
      isMidas = true;
    }
    this.score += earnedScore;

    // 코인 획득
    let earnedCoins = 1;
    if (Math.random() < this.augmentManager.getCoinBonusChance()) {
      earnedCoins += this.augmentManager.getCoinBonusAmount();
    }
    if (isMidas) earnedCoins *= 2;
    this.coins += earnedCoins;
    sound.playCoin();

    // 증강 효과: 번개, 광역, 충격파
    this.triggerOnHitAugments(hole.index);

    if (this.cb.onMoleHit) {
      this.cb.onMoleHit({
        hole,
        type: 'normal',
        score: earnedScore,
        coins: earnedCoins,
        isMidas,
        combo: this.combo
      });
    }

    // 증강 선택 조건 체크 (일반 두더지 15마리마다)
    if (this.killsTowardsAugment >= this.killsPerAugmentGoal) {
      this.killsTowardsAugment = 0;
      this.triggerAugmentSelect();
    }

    this.scheduleMoleClean(hole);
    return { type: 'NORMAL', score: earnedScore, coins: earnedCoins };
  }

  handleGoldenHit(hole) {
    sound.playHitGolden();
    this.totalKills++;
    this.goldenKills++;

    this.incrementCombo();

    let baseScore = 500;
    let baseCoins = 10;

    // 시너지 [황금 만개]: 코인 & 점수 3배
    const hasGoldenBloom = this.augmentManager.hasSynergy('golden_bloom');
    if (hasGoldenBloom) {
      baseScore *= 3;
      baseCoins *= 3;
    }

    const scoreMult = this.augmentManager.getScoreMultiplier();
    const comboMult = this.getComboMultiplier();
    let earnedScore = Math.floor(baseScore * scoreMult * comboMult);
    let earnedCoins = baseCoins + this.augmentManager.getCoinBonusAmount() * 2;

    if (Math.random() < this.augmentManager.getMidasChance()) {
      earnedScore *= 2;
      earnedCoins *= 2;
    }

    this.score += earnedScore;
    this.coins += earnedCoins;

    this.triggerOnHitAugments(hole.index);

    if (this.cb.onMoleHit) {
      this.cb.onMoleHit({
        hole,
        type: 'golden',
        score: earnedScore,
        coins: earnedCoins,
        isBloom: hasGoldenBloom,
        combo: this.combo
      });
    }

    this.scheduleMoleClean(hole);
    return { type: 'GOLDEN', score: earnedScore, coins: earnedCoins };
  }

  handleBombHit(hole) {
    sound.playHitBomb();
    const penalty = 200;
    this.score = Math.max(0, this.score - penalty);

    let shielded = false;
    if (this.shields > 0) {
      this.shields--;
      shielded = true;
    } else {
      this.resetCombo(true);
    }

    if (this.cb.onBombHit) {
      this.cb.onBombHit({
        hole,
        penalty,
        shielded
      });
    }

    this.scheduleMoleClean(hole);
    return { type: 'BOMB', penalty, shielded };
  }

  whackBoss(holeIndex, isWeakPointArea) {
    const result = this.bossInstance.hit(holeIndex, isWeakPointArea);
    if (!result) return null;

    if (result.isFake) {
      // 마왕 두더지 가짜 분신 타격
      sound.playHitBomb();
      this.resetCombo(true);
      if (this.cb.onBossFakeHit) {
        this.cb.onBossFakeHit({ holeIndex, penalty: result.penaltySeconds });
      }
      return { type: 'BOSS_FAKE', penalty: result.penaltySeconds };
    }

    // 보스 본체 타격 성공
    sound.playHitBoss(result.isWeakPoint);
    this.incrementCombo();

    const scoreMult = this.augmentManager.getScoreMultiplier();
    const comboMult = this.getComboMultiplier();
    const earnedScore = Math.floor(
      (result.isWeakPoint ? 600 : 250) * result.damage * scoreMult * comboMult
    );
    this.score += earnedScore;

    if (this.cb.onBossHit) {
      this.cb.onBossHit({
        holeIndex,
        damage: result.damage,
        isWeakPoint: result.isWeakPoint,
        isStunned: result.isStunned,
        remainingHp: result.remainingHp,
        score: earnedScore,
        combo: this.combo
      });
    }

    // 마왕 두더지 본체 타격 시 즉시 재배치
    if (this.bossInstance.config.id === 'demon_mole') {
      this.bossInstance.relocate(this.holes.length);
      this.syncBossHoles();
    }

    return { type: 'BOSS_HIT', ...result, score: earnedScore };
  }

  scheduleMoleClean(hole) {
    setTimeout(() => {
      hole.hasMole = false;
      hole.state = 'IDLE';
      hole.isHit = false;
      if (this.cb.onMoleCleared) this.cb.onMoleCleared(hole);
    }, 350);
  }

  handleMiss() {
    if (this.shields > 0) {
      this.shields--;
      if (this.cb.onShieldUsed) this.cb.onShieldUsed();
    } else {
      this.resetCombo(true);
    }
  }

  // --- 콤보 로직 ---
  incrementCombo() {
    this.combo++;
    if (this.combo > this.maxComboThisGame) {
      this.maxComboThisGame = this.combo;
    }
    this.comboTimer = this.getComboMaxDuration();
    sound.playCombo(this.combo);

    // 충격파 증강 체크
    const shockReq = this.augmentManager.getShockwaveRequirement();
    if (shockReq > 0 && this.combo > 0 && this.combo % shockReq === 0) {
      this.triggerShockwave();
    }
  }

  resetCombo(isPenalty = false) {
    if (this.combo > 0) {
      this.combo = 0;
      this.comboTimer = 0;
      if (this.cb.onComboReset) {
        this.cb.onComboReset(isPenalty);
      }
    }
  }

  getComboMaxDuration() {
    const bonus = this.augmentManager.getComboDurationBonus();
    return this.comboMaxDuration + bonus;
  }

  getComboMultiplier() {
    let mult = 1.0;
    if (this.combo >= 35) mult = 4.0;
    else if (this.combo >= 20) mult = 3.0;
    else if (this.combo >= 10) mult = 2.0;
    else if (this.combo >= 5) mult = 1.5;

    // 광전사 증강
    if (this.combo >= 10) {
      mult += this.augmentManager.getBerserkBonus();
    }
    return mult;
  }

  // --- 증강 발동 로직 ---
  triggerOnHitAugments(hitHoleIndex) {
    // 1. 번개 타격
    const lightning = this.augmentManager.getLightningConfig();
    if (lightning && Math.random() < lightning.chance) {
      this.triggerLightning(hitHoleIndex, lightning.targets);
    }

    // 2. 광역 망치
    const splashCount = this.augmentManager.getSplashCount();
    if (splashCount > 0) {
      this.triggerSplash(hitHoleIndex, splashCount);
    }
  }

  triggerLightning(sourceIndex, targetCount) {
    const candidates = this.holes.filter(
      (h) =>
        h.hasMole &&
        h.state === 'ACTIVE' &&
        !h.isHit &&
        h.index !== sourceIndex &&
        h.moleType !== 'bomb'
    );
    if (candidates.length === 0) return;

    sound.playLightning();
    const hits = candidates.slice(0, targetCount);
    hits.forEach((targetHole) => {
      targetHole.isHit = true;
      targetHole.state = 'HIT';
      this.totalKills++;
      this.score += 80;
      if (this.cb.onLightningHit) {
        this.cb.onLightningHit(sourceIndex, targetHole.index);
      }
      this.scheduleMoleClean(targetHole);
    });
  }

  triggerSplash(sourceIndex, count) {
    const r = Math.floor(sourceIndex / this.gridSize);
    const c = sourceIndex % this.gridSize;
    const neighbors = [
      { r: r - 1, c },
      { r: r + 1, c },
      { r, c: c - 1 },
      { r, c: c + 1 }
    ];

    let hits = 0;
    neighbors.forEach(({ r: nr, c: nc }) => {
      if (hits >= count) return;
      if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize) {
        const nIndex = nr * this.gridSize + nc;
        const targetHole = this.holes[nIndex];
        if (
          targetHole &&
          targetHole.hasMole &&
          targetHole.state === 'ACTIVE' &&
          !targetHole.isHit &&
          targetHole.moleType !== 'bomb'
        ) {
          targetHole.isHit = true;
          targetHole.state = 'HIT';
          this.totalKills++;
          this.score += 70;
          hits++;
          if (this.cb.onSplashHit) {
            this.cb.onSplashHit(nIndex);
          }
          this.scheduleMoleClean(targetHole);
        }
      }
    });
  }

  triggerShockwave() {
    sound.playShockwave();
    if (this.cb.onShockwave) this.cb.onShockwave();

    if (this.state === GAME_STATES.PLAYING) {
      // 일반 웨이브: 폭탄을 제외한 모든 두더지 일망타진
      this.holes.forEach((h) => {
        if (h.hasMole && h.state === 'ACTIVE' && !h.isHit && h.moleType !== 'bomb') {
          h.isHit = true;
          h.state = 'HIT';
          this.totalKills++;
          this.score += 120;
          this.scheduleMoleClean(h);
        }
      });
    } else if (this.state === GAME_STATES.BOSS_PLAYING && this.bossInstance) {
      // 보스전: 보스에게 강력한 충격파 피해
      this.bossInstance.hit(this.bossInstance.currentHoleIndex, true);
    }
  }

  updateAutoMallet(dt) {
    const interval = this.augmentManager.getAutoMalletInterval();
    if (!interval) return;

    this.autoMalletTimer += dt * 1000;
    if (this.autoMalletTimer >= interval) {
      this.autoMalletTimer = 0;
      this.triggerAutoMallet();
    }
  }

  triggerAutoMallet() {
    if (this.state === GAME_STATES.PLAYING) {
      const activeTargets = this.holes.filter(
        (h) => h.hasMole && h.state === 'ACTIVE' && !h.isHit && h.moleType !== 'bomb'
      );
      if (activeTargets.length > 0) {
        const chosen = activeTargets[Math.floor(Math.random() * activeTargets.length)];
        this.whackHole(chosen.index);
      }
    } else if (this.state === GAME_STATES.BOSS_PLAYING && this.bossInstance) {
      // 보스전 시 보스 자동 타격
      this.whackHole(this.bossInstance.currentHoleIndex);
    }
  }

  // --- 증강 선택 모달 트리거 ---
  triggerAugmentSelect() {
    this.setState(GAME_STATES.AUGMENT_SELECT);
    sound.playAugmentSelect();
    const choices = this.augmentManager.getRandomSelection(3);

    if (this.cb.onShowAugmentModal) {
      this.cb.onShowAugmentModal(choices);
    }
  }

  applyAugmentSelection(augmentId) {
    this.augmentManager.selectAugment(augmentId);

    // 다시 플레이 상태로 복귀
    if (this.wave === 3 || this.wave === 6 || this.wave === 9) {
      this.setState(GAME_STATES.BOSS_PLAYING);
    } else {
      this.setState(GAME_STATES.PLAYING);
    }
    this.startLoop();
  }

  // --- 웨이브 완료 및 전환 ---
  completeWave() {
    this.clearAllMoles();
    const nextWave = this.wave + 1;

    if (nextWave > this.maxWave) {
      this.handleGameVictory();
      return;
    }

    if (this.cb.onWaveCleared) {
      this.cb.onWaveCleared(this.wave, nextWave);
    }

    // 다음 웨이브로 진행
    setTimeout(() => {
      this.startWave(nextWave);
    }, 1800);
  }

  // --- 보스 처치 ---
  handleBossDefeated() {
    sound.stopBGM();
    sound.playBossDefeat();
    this.bossKills++;

    // 대량의 보상 점수 & 코인
    const bossBonusScore = this.bossInstance.config.wave * 1500;
    const bossBonusCoins = this.bossInstance.config.wave * 15;
    this.score += bossBonusScore;
    this.coins += bossBonusCoins;

    const defeatedBossKey = this.bossInstance.config.id;
    this.clearAllMoles();

    // 최종 보스(마왕 두더지) 처치 시 바로 게임 클리어!
    if (defeatedBossKey === 'demon_mole') {
      this.handleGameVictory();
      return;
    }

    // 보스 전용 증강 보상 선택창
    this.setState(GAME_STATES.BOSS_REWARD);
    const bossRewards = this.augmentManager.getBossRewardSelection();

    if (this.cb.onShowBossRewardModal) {
      this.cb.onShowBossRewardModal({
        bossConfig: this.bossInstance.config,
        bonusScore: bossBonusScore,
        bonusCoins: bossBonusCoins,
        choices: bossRewards
      });
    }
  }

  applyBossRewardSelection(rewardId) {
    if (rewardId) {
      this.augmentManager.selectAugment(rewardId);
    }
    // 다음 웨이브로 이동
    const nextWave = this.wave + 1;
    this.startWave(nextWave);
  }

  // --- 보스 도주 (실패) ---
  handleBossFled() {
    sound.stopBGM();
    sound.playBossFlee();
    this.clearAllMoles();

    const bossConfig = this.bossInstance.config;
    const damageDealt = this.bossInstance.totalDamageTaken;
    const remainingHp = this.bossInstance.currentHp;

    // 패널티 적용 (철갑 두더지의 경우 다음 웨이브 구멍 1개 봉쇄)
    if (bossConfig.id === 'iron_mole') {
      const blockedIdx = Math.floor(Math.random() * this.holes.length);
      this.blockedHoles.add(blockedIdx);
    }

    this.setState(GAME_STATES.BOSS_FLED);

    if (this.cb.onShowBossFledModal) {
      this.cb.onShowBossFledModal({
        bossConfig,
        damageDealt,
        remainingHp,
        nextWave: this.wave + 1
      });
    }
  }

  continueAfterBossFled() {
    const nextWave = this.wave + 1;
    if (nextWave > this.maxWave) {
      this.handleGameOver();
    } else {
      this.startWave(nextWave);
    }
  }

  // --- 게임 종료 / 승리 ---
  handleGameOver() {
    this.stopLoop();
    sound.stopBGM();
    this.setState(GAME_STATES.GAME_OVER);
    this.finalizeStats(false);
  }

  handleGameVictory() {
    this.stopLoop();
    sound.stopBGM();
    sound.playBossDefeat();
    this.setState(GAME_STATES.VICTORY);
    this.finalizeStats(true);
  }

  finalizeStats(isVictory) {
    const result = storage.recordGameStats({
      score: this.score,
      maxCombo: this.maxComboThisGame,
      kills: this.totalKills,
      goldenKills: this.goldenKills,
      bossKills: this.bossKills,
      coins: this.coins,
      context: {
        isVictory,
        bossKilled: this.bossInstance?.state === 'DEFEATED' ? this.bossInstance.config.id : null,
        hasMaxAugment: Object.values(this.augmentManager.owned).some((lvl) => lvl >= 3),
        hasSynergy: this.augmentManager.activeSynergies.length > 0
      }
    });

    if (this.cb.onGameEnded) {
      this.cb.onGameEnded({
        isVictory,
        score: this.score,
        maxCombo: this.maxComboThisGame,
        totalKills: this.totalKills,
        normalKills: this.normalKills,
        goldenKills: this.goldenKills,
        bossKills: this.bossKills,
        coins: this.coins,
        molesEscaped: this.molesEscaped,
        missClicks: this.missClicks,
        accuracy: this.getAccuracy(),
        augments: this.augmentManager.owned,
        bossAugments: this.augmentManager.bossAugments,
        synergies: this.augmentManager.activeSynergies,
        isNewHighScore: result.isNewHighScore,
        isNewMaxCombo: result.isNewMaxCombo,
        newAchievements: result.newAchievements
      });
    }
  }

  getAccuracy() {
    const totalClicks = this.totalKills + this.missClicks;
    if (totalClicks === 0) return 100;
    return Math.round((this.totalKills / totalClicks) * 100);
  }

  clearAllMoles() {
    this.holes.forEach((h) => {
      h.hasMole = false;
      h.state = 'IDLE';
      h.isHit = false;
    });
    if (this.cb.onClearAllMoles) this.cb.onClearAllMoles();
  }

  setState(newState) {
    this.state = newState;
    if (this.cb.onStateChange) {
      this.cb.onStateChange(this.state);
    }
  }

  destroy() {
    this.stopLoop();
    sound.stopBGM();
  }
}
