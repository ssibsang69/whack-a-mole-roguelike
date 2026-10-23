/**
 * 두더지 대작전! UI 조율자 및 인터랙션 핸들러 (Application Coordinator)
 */

import { sound } from './audio.js';
import { storage, ACHIEVEMENTS_DEF } from './storage.js';
import { GameEngine, GAME_STATES } from './game.js';
import { SVG_ASSETS } from './assets.js';
import { SHOP_ITEMS } from './shop.js';
import { AUGMENTS_DATA, BOSS_AUGMENTS_DATA, SYNERGIES } from './augments.js';

class MoleApp {
  constructor() {
    this.game = null;
    this.boardEl = null;
    this.hammerCursorEl = null;
    this.floatingContainerEl = null;

    // 키보드 매핑 (3x3 기준: 789/456/123 넘패드 또는 1~9 또는 QWE/ASD/ZXC)
    this.keyMaps = {
      '1': 0, '2': 1, '3': 2,
      '4': 3, '5': 4, '6': 5,
      '7': 6, '8': 7, '9': 8,
      'q': 0, 'w': 1, 'e': 2,
      'a': 3, 's': 4, 'd': 5,
      'z': 6, 'x': 7, 'c': 8
    };

    this.init();
  }

  init() {
    this.cacheDomElements();
    this.setupGameEngine();
    this.setupEventListeners();
    this.setupCustomHammer();
    this.applyInitialSettings();
    this.renderStartScreenStats();
  }

  cacheDomElements() {
    // 화면들
    this.screenStart = document.getElementById('screen-start');
    this.screenGame = document.getElementById('screen-game');
    this.screenResult = document.getElementById('screen-result');

    // 모달들
    this.modalAugment = document.getElementById('modal-augment');
    this.modalBossReward = document.getElementById('modal-boss-reward');
    this.modalBossFled = document.getElementById('modal-boss-fled');
    this.modalShop = document.getElementById('modal-shop');
    this.modalAchievements = document.getElementById('modal-achievements');
    this.modalGuide = document.getElementById('modal-guide');
    this.modalSettings = document.getElementById('modal-settings');

    // HUD
    this.hudScore = document.getElementById('hud-score');
    this.hudCoins = document.getElementById('hud-coins');
    this.hudWave = document.getElementById('hud-wave');
    this.hudTime = document.getElementById('hud-time');
    this.hudComboCount = document.getElementById('hud-combo-count');
    this.hudComboBar = document.getElementById('hud-combo-bar');
    this.hudComboMultiplier = document.getElementById('hud-combo-multiplier');
    this.hudShields = document.getElementById('hud-shields');
    this.hudAugmentProgress = document.getElementById('hud-augment-progress');

    // 보스 HUD
    this.bossHud = document.getElementById('boss-hud');
    this.bossNameEl = document.getElementById('boss-name');
    this.bossHpFill = document.getElementById('boss-hp-fill');
    this.bossHpText = document.getElementById('boss-hp-text');
    this.bossTimerEl = document.getElementById('boss-timer');
    this.bossStatusText = document.getElementById('boss-status-text');

    // 보드 및 하단 바
    this.boardEl = document.getElementById('game-board');
    this.hammerCursorEl = document.getElementById('custom-hammer');
    this.floatingContainerEl = document.getElementById('floating-container');
    this.activeAugmentsListEl = document.getElementById('active-augments-list');
    this.activeSynergiesListEl = document.getElementById('active-synergies-list');

    // 오버레이 연출
    this.screenAlertEl = document.getElementById('screen-alert');
    this.countdownEl = document.getElementById('countdown-display');
  }

  setupGameEngine() {
    this.game = new GameEngine({
      onStateChange: (state) => this.handleGameStateChange(state),
      onCountdown: (text) => this.handleCountdown(text),
      onWaveStart: (wave, time) => this.handleWaveStart(wave, time),
      onBossWarning: (bossConfig) => this.handleBossWarning(bossConfig),
      onTick: (data) => this.handleTick(data),
      onMoleSpawn: (hole) => this.renderMoleInHole(hole),
      onMoleRetreat: (hole) => this.animateMoleRetreat(hole),
      onMoleCleared: (hole) => this.clearMoleFromHole(hole),
      onMoleHit: (data) => this.handleMoleHit(data),
      onBombHit: (data) => this.handleBombHit(data),
      onBossHit: (data) => this.handleBossHit(data),
      onBossFakeHit: (data) => this.handleBossFakeHit(data),
      onBossSync: (boss, holes) => this.renderBossInHoles(boss, holes),
      onShockwave: () => this.animateShockwave(),
      onLightningHit: (src, dst) => this.animateLightning(src, dst),
      onSplashHit: (idx) => this.animateSplash(idx),
      onShowAugmentModal: (choices) => this.showAugmentModal(choices),
      onShowBossRewardModal: (data) => this.showBossRewardModal(data),
      onShowBossFledModal: (data) => this.showBossFledModal(data),
      onGameEnded: (summary) => this.showResultScreen(summary),
      onGridChanged: (size) => this.rebuildBoard(size)
    });

    this.game.init(storage.settings.fieldSize || 3);
    this.rebuildBoard(this.game.gridSize);
  }

  rebuildBoard(gridSize) {
    this.boardEl.innerHTML = '';
    this.boardEl.className = `game-board grid-${gridSize}x${gridSize}`;

    for (let i = 0; i < gridSize * gridSize; i++) {
      const holeEl = document.createElement('div');
      holeEl.className = 'board-hole';
      holeEl.dataset.index = i;

      // 3D 구멍 구조: 백그라운드 구멍 -> 두더지 래퍼 -> 프론트 마운드
      holeEl.innerHTML = `
        <div class="hole-back">${SVG_ASSETS.holeBack()}</div>
        <div class="mole-wrapper" id="mole-${i}"></div>
        <div class="hole-front">${SVG_ASSETS.holeFrontMound()}</div>
        <div class="hole-key-badge" id="key-badge-${i}"></div>
      `;

      // 클릭 및 터치 이벤트
      holeEl.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.handleHoleClick(i, e);
      });

      this.boardEl.appendChild(holeEl);
    }

    this.updateKeyBadges();
  }

  updateKeyBadges() {
    const show = storage.settings.showKeyGuide;
    for (let i = 0; i < this.game.gridSize * this.game.gridSize; i++) {
      const badge = document.getElementById(`key-badge-${i}`);
      if (!badge) continue;
      if (show && i < 9) {
        badge.style.display = 'block';
        badge.textContent = `${i + 1}`;
      } else {
        badge.style.display = 'none';
      }
    }
  }

  setupEventListeners() {
    // 시작 버튼
    document.getElementById('btn-play-game').addEventListener('click', () => {
      sound.init();
      sound.playClick();
      this.startGame();
    });

    // 재도전 버튼
    document.getElementById('btn-restart').addEventListener('click', () => {
      sound.playClick();
      this.startGame();
    });

    // 메인으로 돌아가기 버튼
    document.getElementById('btn-home').addEventListener('click', () => {
      sound.playClick();
      this.goToHome();
    });

    // 상점 열기 버튼
    document.getElementById('btn-open-shop').addEventListener('click', () => {
      sound.playClick();
      this.openShopModal();
    });

    document.getElementById('btn-close-shop').addEventListener('click', () => {
      sound.playClick();
      this.closeModal(this.modalShop);
    });

    // 업적 모달 버튼
    document.querySelectorAll('.btn-achievements').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClick();
        this.openAchievementsModal();
      });
    });

    document.getElementById('btn-close-achievements').addEventListener('click', () => {
      sound.playClick();
      this.closeModal(this.modalAchievements);
    });

    // 가이드 모달
    document.querySelectorAll('.btn-rules').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClick();
        this.modalGuide.classList.remove('hidden');
      });
    });

    document.getElementById('btn-close-guide').addEventListener('click', () => {
      sound.playClick();
      this.closeModal(this.modalGuide);
    });

    // 설정 모달
    document.querySelectorAll('.btn-settings').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClick();
        this.openSettingsModal();
      });
    });

    document.getElementById('btn-close-settings').addEventListener('click', () => {
      sound.playClick();
      this.closeModal(this.modalSettings);
    });

    // 사운드 토글 버튼 (HUD 상단 퀵버튼)
    document.getElementById('btn-toggle-sfx').addEventListener('click', (e) => {
      storage.settings.sfx = !storage.settings.sfx;
      sound.setSfxEnabled(storage.settings.sfx);
      storage.saveSettings();
      this.updateSoundButtons();
      sound.playClick();
    });

    document.getElementById('btn-toggle-bgm').addEventListener('click', (e) => {
      storage.settings.bgm = !storage.settings.bgm;
      sound.setBgmEnabled(storage.settings.bgm);
      storage.saveSettings();
      this.updateSoundButtons();
      sound.playClick();
    });

    // 보스 도주 후 계속 진행 버튼
    document.getElementById('btn-boss-fled-continue').addEventListener('click', () => {
      sound.playClick();
      this.closeModal(this.modalBossFled);
      this.game.continueAfterBossFled();
    });

    // 키보드 타격 이벤트
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (this.keyMaps.hasOwnProperty(key)) {
        const holeIdx = this.keyMaps[key];
        if (holeIdx < this.game.gridSize * this.game.gridSize) {
          const holeEl = this.boardEl.children[holeIdx];
          if (holeEl) {
            const rect = holeEl.getBoundingClientRect();
            this.triggerHammerWhack(rect.left + rect.width / 2, rect.top + rect.height / 3);
            this.game.whackHole(holeIdx);
          }
        }
      }
    });
  }

  setupCustomHammer() {
    this.hammerCursorEl.innerHTML = SVG_ASSETS.malletCursor();
    this.hammerCursorEl.style.display = 'none';

    window.addEventListener('pointermove', (e) => {
      if (
        this.game &&
        (this.game.state === GAME_STATES.PLAYING || this.game.state === GAME_STATES.BOSS_PLAYING)
      ) {
        this.hammerCursorEl.style.display = 'block';
        this.hammerCursorEl.style.left = `${e.clientX}px`;
        this.hammerCursorEl.style.top = `${e.clientY}px`;
      } else {
        this.hammerCursorEl.style.display = 'none';
      }
    });
  }

  triggerHammerWhack(x, y) {
    this.hammerCursorEl.classList.remove('whacking');
    // 리플로우 강제
    void this.hammerCursorEl.offsetWidth;
    this.hammerCursorEl.classList.add('whacking');

    // 타격 지점 만화 먼지/스타 파티클 생성
    this.createHitImpact(x, y);
  }

  handleHoleClick(index, e) {
    this.triggerHammerWhack(e.clientX, e.clientY);
    this.game.whackHole(index);
  }

  startGame() {
    this.screenStart.classList.add('hidden');
    this.screenResult.classList.add('hidden');
    this.screenGame.classList.remove('hidden');
    this.game.startNewGame();
    this.updateBottomAugmentBar();
  }

  goToHome() {
    this.game.destroy();
    this.screenGame.classList.add('hidden');
    this.screenResult.classList.add('hidden');
    this.screenStart.classList.remove('hidden');
    this.hammerCursorEl.style.display = 'none';
    this.renderStartScreenStats();
  }

  handleGameStateChange(state) {
    if (state === GAME_STATES.BOSS_PLAYING) {
      this.bossHud.classList.remove('hidden');
    } else {
      this.bossHud.classList.add('hidden');
    }

    if (state !== GAME_STATES.PLAYING && state !== GAME_STATES.BOSS_PLAYING) {
      this.hammerCursorEl.style.display = 'none';
    }
  }

  handleCountdown(text) {
    this.countdownEl.classList.remove('hidden');
    this.countdownEl.textContent = text;
    this.countdownEl.classList.add('pop-anim');
    setTimeout(() => {
      this.countdownEl.classList.remove('pop-anim');
      if (text === '시작!') {
        this.countdownEl.classList.add('hidden');
      }
    }, 450);
  }

  handleWaveStart(wave, time) {
    this.showScreenAlert(`🌊 W A V E  ${wave}`, '#38bdf8');
    this.updateBottomAugmentBar();
  }

  handleBossWarning(bossConfig) {
    this.showScreenAlert(`⚠️ WARNING! 보스 출현: ${bossConfig.name} ⚠️`, '#ef4444', 2000);
  }

  showScreenAlert(text, color = '#fbbf24', duration = 1200) {
    this.screenAlertEl.textContent = text;
    this.screenAlertEl.style.color = color;
    this.screenAlertEl.classList.remove('hidden');
    this.screenAlertEl.classList.add('alert-anim');

    setTimeout(() => {
      this.screenAlertEl.classList.remove('alert-anim');
      this.screenAlertEl.classList.add('hidden');
    }, duration);
  }

  handleTick(data) {
    // HUD 수치 갱신
    this.hudScore.textContent = data.score.toLocaleString();
    this.hudCoins.textContent = data.coins;
    this.hudWave.textContent = `WAVE ${data.wave}`;
    this.hudTime.textContent = Math.ceil(data.waveTimeLeft);

    // 콤보 HUD
    this.hudComboCount.textContent = `${data.combo} COMBO!`;
    this.hudComboBar.style.width = `${Math.min(100, data.comboRatio * 100)}%`;

    const mult = this.game.getComboMultiplier();
    this.hudComboMultiplier.textContent = `${mult.toFixed(1)}x`;

    // 콤보 수치에 따른 불타는 시각 효과
    if (data.combo >= 20) {
      this.hudComboCount.className = 'combo-text combo-fever';
    } else if (data.combo >= 10) {
      this.hudComboCount.className = 'combo-text combo-hot';
    } else {
      this.hudComboCount.className = 'combo-text';
    }

    // 보호막
    this.hudShields.textContent = `🛡️ x${this.game.shields}`;

    // 증강 진행 게이지 (15마리마다)
    const progress = Math.min(100, (this.game.killsTowardsAugment / this.game.killsPerAugmentGoal) * 100);
    this.hudAugmentProgress.style.width = `${progress}%`;

    // 보스 HUD 갱신
    if (data.boss && this.game.state === GAME_STATES.BOSS_PLAYING) {
      const boss = data.boss;
      this.bossNameEl.textContent = `${boss.config.name} (${boss.config.title})`;
      const hpPercent = Math.max(0, (boss.currentHp / boss.maxHp) * 100);
      this.bossHpFill.style.width = `${hpPercent}%`;
      this.bossHpText.textContent = `${boss.currentHp} / ${boss.maxHp}`;
      this.bossTimerEl.textContent = `⏱️ ${Math.ceil(boss.remainingTime)}초`;

      if (boss.isWeakPointExposed) {
        this.bossStatusText.textContent = `⚡ 약점 노출 중! [${boss.config.weakPointName}] 타격 시 대폭 피해!`;
        this.bossStatusText.style.color = '#ef4444';
      } else if (boss.isStunned) {
        this.bossStatusText.textContent = '💫 기절 상태! 집중 타격!';
        this.bossStatusText.style.color = '#facc15';
      } else if (boss.isEnraged) {
        this.bossStatusText.textContent = '🔥 광폭화! 움직임이 빨라집니다!';
        this.bossStatusText.style.color = '#f97316';
      } else {
        this.bossStatusText.textContent = '보스를 타격하여 지하로 물리치세요!';
        this.bossStatusText.style.color = '#e2e8f0';
      }
    }
  }

  // --- 두더지 렌더링 ---
  renderMoleInHole(hole) {
    const moleEl = document.getElementById(`mole-${hole.index}`);
    if (!moleEl) return;

    if (hole.moleType === 'normal') {
      moleEl.innerHTML = SVG_ASSETS.normalMole(false);
    } else if (hole.moleType === 'golden') {
      moleEl.innerHTML = SVG_ASSETS.goldenMole(false);
    } else if (hole.moleType === 'bomb') {
      moleEl.innerHTML = SVG_ASSETS.bombMole(false);
    }

    moleEl.className = 'mole-wrapper emerging';
    setTimeout(() => {
      if (hole.state === 'ACTIVE') {
        moleEl.className = 'mole-wrapper active';
      }
    }, 180);
  }

  renderBossInHoles(boss, holes) {
    holes.forEach((hole) => {
      const moleEl = document.getElementById(`mole-${hole.index}`);
      if (!moleEl) return;

      if (hole.hasMole && hole.moleType === 'boss') {
        if (boss.config.id === 'mole_king') {
          moleEl.innerHTML = SVG_ASSETS.bossKing(hole.isWeakPoint, hole.isHit);
        } else if (boss.config.id === 'iron_mole') {
          moleEl.innerHTML = SVG_ASSETS.bossIron(hole.isWeakPoint, hole.isHit);
        } else if (boss.config.id === 'demon_mole') {
          moleEl.innerHTML = SVG_ASSETS.bossDemon(hole.isCloneFake, hole.isWeakPoint, hole.isHit);
        }
        moleEl.className = 'mole-wrapper boss-active';
      } else {
        moleEl.innerHTML = '';
        moleEl.className = 'mole-wrapper';
      }
    });
  }

  animateMoleRetreat(hole) {
    const moleEl = document.getElementById(`mole-${hole.index}`);
    if (moleEl) {
      moleEl.className = 'mole-wrapper retreating';
    }
  }

  clearMoleFromHole(hole) {
    const moleEl = document.getElementById(`mole-${hole.index}`);
    if (moleEl) {
      moleEl.innerHTML = '';
      moleEl.className = 'mole-wrapper';
    }
  }

  // --- 타격 연출 ---
  handleMoleHit(data) {
    const { hole, type, score, coins, isMidas, isBloom } = data;
    const moleEl = document.getElementById(`mole-${hole.index}`);
    if (moleEl) {
      if (type === 'normal') {
        moleEl.innerHTML = SVG_ASSETS.normalMole(true);
      } else if (type === 'golden') {
        moleEl.innerHTML = SVG_ASSETS.goldenMole(true);
      }
      moleEl.className = 'mole-wrapper hit-dizzy';
    }

    // 부동 텍스트 팝업
    const holeEl = this.boardEl.children[hole.index];
    const rect = holeEl.getBoundingClientRect();

    let text = `+${score}`;
    let color = '#facc15';
    if (isMidas) {
      text += ' (황금 손 x2!)';
      color = '#f59e0b';
    } else if (isBloom) {
      text += ' (황금 만개 x3!)';
      color = '#fbbf24';
    }

    this.spawnFloatingText(text, rect.left + rect.width / 2, rect.top + 20, color);
    if (coins > 0) {
      this.spawnFloatingText(`+${coins} 🪙`, rect.left + rect.width / 2 + 30, rect.top + 40, '#fde047');
    }

    this.shakeScreen(6);
  }

  handleBombHit(data) {
    const { hole, penalty, shielded } = data;
    const moleEl = document.getElementById(`mole-${hole.index}`);
    if (moleEl) {
      moleEl.innerHTML = SVG_ASSETS.bombMole(true);
      moleEl.className = 'mole-wrapper hit-dizzy';
    }

    const holeEl = this.boardEl.children[hole.index];
    const rect = holeEl.getBoundingClientRect();

    if (shielded) {
      this.spawnFloatingText('🛡️ 방패 방어! 콤보 보호!', rect.left + rect.width / 2, rect.top + 20, '#38bdf8');
    } else {
      this.spawnFloatingText(`💥 -${penalty} (콤보 초기화!)`, rect.left + rect.width / 2, rect.top + 20, '#ef4444');
      this.shakeScreen(14);
    }
  }

  handleBossHit(data) {
    const { holeIndex, damage, isWeakPoint, isStunned, score } = data;
    const holeEl = this.boardEl.children[holeIndex];
    if (!holeEl) return;
    const rect = holeEl.getBoundingClientRect();

    let txt = `-${damage} HP! (+${score})`;
    let color = '#fbbf24';

    if (isWeakPoint) {
      txt = `⚡ CRITICAL! -${damage} HP!`;
      color = '#ef4444';
      this.shakeScreen(12);
    } else {
      this.shakeScreen(8);
    }

    if (isStunned) {
      txt += ' 💫 기절!';
    }

    this.spawnFloatingText(txt, rect.left + rect.width / 2, rect.top + 10, color);
  }

  handleBossFakeHit(data) {
    const { holeIndex, penalty } = data;
    const holeEl = this.boardEl.children[holeIndex];
    if (!holeEl) return;
    const rect = holeEl.getBoundingClientRect();

    this.spawnFloatingText(`💨 가짜 분신! -${penalty}초`, rect.left + rect.width / 2, rect.top + 20, '#a855f7');
    this.shakeScreen(10);
  }

  spawnFloatingText(text, x, y, color = '#facc15') {
    const floatEl = document.createElement('div');
    floatEl.className = 'floating-score-text';
    floatEl.textContent = text;
    floatEl.style.left = `${x}px`;
    floatEl.style.top = `${y}px`;
    floatEl.style.color = color;

    this.floatingContainerEl.appendChild(floatEl);
    setTimeout(() => {
      floatEl.remove();
    }, 1100);
  }

  createHitImpact(x, y) {
    const impactEl = document.createElement('div');
    impactEl.className = 'hit-impact-burst';
    impactEl.style.left = `${x}px`;
    impactEl.style.top = `${y}px`;
    this.floatingContainerEl.appendChild(impactEl);

    setTimeout(() => {
      impactEl.remove();
    }, 400);
  }

  shakeScreen(amount = 8) {
    document.body.style.transform = `translate(${(Math.random() - 0.5) * amount}px, ${(Math.random() - 0.5) * amount}px)`;
    setTimeout(() => {
      document.body.style.transform = 'none';
    }, 80);
  }

  animateShockwave() {
    const waveEl = document.createElement('div');
    waveEl.className = 'full-shockwave-ring';
    document.body.appendChild(waveEl);
    this.shakeScreen(15);
    setTimeout(() => waveEl.remove(), 700);
  }

  animateLightning(srcIdx, dstIdx) {
    const srcEl = this.boardEl.children[srcIdx];
    const dstEl = this.boardEl.children[dstIdx];
    if (!srcEl || !dstEl) return;

    const r1 = srcEl.getBoundingClientRect();
    const r2 = dstEl.getBoundingClientRect();

    const beam = document.createElement('div');
    beam.className = 'lightning-arc';
    const x1 = r1.left + r1.width / 2;
    const y1 = r1.top + r1.height / 2;
    const x2 = r2.left + r2.width / 2;
    const y2 = r2.top + r2.height / 2;

    const dist = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    beam.style.width = `${dist}px`;
    beam.style.left = `${x1}px`;
    beam.style.top = `${y1}px`;
    beam.style.transform = `rotate(${angle}deg)`;

    document.body.appendChild(beam);
    setTimeout(() => beam.remove(), 350);
  }

  animateSplash(idx) {
    const holeEl = this.boardEl.children[idx];
    if (!holeEl) return;
    const splash = document.createElement('div');
    splash.className = 'splash-ring';
    holeEl.appendChild(splash);
    setTimeout(() => splash.remove(), 400);
  }

  // --- 증강 모달창 ---
  showAugmentModal(choices) {
    const cardsContainer = document.getElementById('augment-cards-container');
    cardsContainer.innerHTML = '';

    choices.forEach((aug) => {
      const card = document.createElement('div');
      card.className = `augment-card rarity-${aug.rarity}`;

      card.innerHTML = `
        <div class="card-icon">${aug.icon}</div>
        <div class="card-title">${aug.name}</div>
        <div class="card-level-badge">
          Lv.${aug.currentLevel} → <span class="next-level">Lv.${aug.nextLevel}</span>
        </div>
        <div class="card-desc">${aug.nextDescription}</div>
        <button class="btn-select-card">선택하기</button>
      `;

      card.addEventListener('click', () => {
        sound.playClick();
        this.closeModal(this.modalAugment);
        this.game.applyAugmentSelection(aug.id);
        this.updateBottomAugmentBar();
      });

      cardsContainer.appendChild(card);
    });

    this.modalAugment.classList.remove('hidden');
  }

  // --- 보스 보상 모달창 ---
  showBossRewardModal(data) {
    const { bossConfig, bonusScore, bonusCoins, choices } = data;
    document.getElementById('boss-reward-title').textContent = `🏆 ${bossConfig.name} 토벌 성공!`;
    document.getElementById('boss-reward-bonus').textContent = `보너스 보상: +${bonusScore.toLocaleString()} 점, +${bonusCoins} 코인 🪙`;

    const container = document.getElementById('boss-reward-cards-container');
    container.innerHTML = '';

    choices.forEach((aug) => {
      const card = document.createElement('div');
      card.className = 'augment-card rarity-legendary';

      card.innerHTML = `
        <div class="card-icon">${aug.icon}</div>
        <div class="card-title">${aug.name}</div>
        <div class="card-level-badge">보스 전용 전설 증강</div>
        <div class="card-desc">${aug.nextDescription}</div>
        <button class="btn-select-card">보상 획득</button>
      `;

      card.addEventListener('click', () => {
        sound.playClick();
        this.closeModal(this.modalBossReward);
        this.game.applyBossRewardSelection(aug.id);
        this.updateBottomAugmentBar();
      });

      container.appendChild(card);
    });

    this.modalBossReward.classList.remove('hidden');
  }

  // --- 보스 도주 (실패) 모달창 ---
  showBossFledModal(data) {
    const { bossConfig, damageDealt, remainingHp, nextWave } = data;
    document.getElementById('boss-fled-title').textContent = `💨 ${bossConfig.name}이(가) 도망쳤습니다!`;
    document.getElementById('boss-fled-stats').innerHTML = `
      <p>입힌 총 피해량: <strong>${damageDealt} HP</strong></p>
      <p>남은 보스 체력: <strong>${remainingHp} HP</strong></p>
      <p class="penalty-text">${bossConfig.escapePenaltyDesc}</p>
      <p>보스 처치 보상은 받지 못했지만, 획득한 점수와 증강은 그대로 유지됩니다!</p>
    `;

    document.getElementById('btn-boss-fled-continue').textContent = `웨이브 ${nextWave}로 계속하기`;
    this.modalBossFled.classList.remove('hidden');
  }

  // --- 상점 모달창 ---
  openShopModal() {
    const listEl = document.getElementById('shop-items-list');
    document.getElementById('shop-current-coins').textContent = this.game.coins;
    listEl.innerHTML = '';

    SHOP_ITEMS.forEach((item) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'shop-item-card';

      const canAfford = this.game.coins >= item.price;

      itemEl.innerHTML = `
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-info">
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.desc}</div>
        </div>
        <button class="btn-buy ${canAfford ? '' : 'disabled'}" ${canAfford ? '' : 'disabled'}>
          ${item.price} 🪙 구매
        </button>
      `;

      const buyBtn = itemEl.querySelector('.btn-buy');
      buyBtn.addEventListener('click', () => {
        const res = this.game.shopManager.buy(item.id, this.game);
        if (res.success) {
          sound.playCoin();
          this.openShopModal(); // 갱신
          this.hudCoins.textContent = this.game.coins;
          this.hudShields.textContent = `🛡️ x${this.game.shields}`;
        }
      });

      listEl.appendChild(itemEl);
    });

    this.modalShop.classList.remove('hidden');
  }

  // --- 업적 모달창 ---
  openAchievementsModal() {
    const listEl = document.getElementById('achievements-list');
    listEl.innerHTML = '';

    const unlocked = storage.achievements;
    let unlockedCount = 0;

    ACHIEVEMENTS_DEF.forEach((ach) => {
      const isUnlocked = !!unlocked[ach.id];
      if (isUnlocked) unlockedCount++;

      const item = document.createElement('div');
      item.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
      item.innerHTML = `
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-details">
          <div class="ach-title">${ach.title} ${isUnlocked ? '✅' : '🔒'}</div>
          <div class="ach-desc">${ach.desc}</div>
        </div>
      `;
      listEl.appendChild(item);
    });

    document.getElementById('achievements-counter').textContent = `${unlockedCount} / ${ACHIEVEMENTS_DEF.length} 해금 완료`;
    this.modalAchievements.classList.remove('hidden');
  }

  // --- 설정 모달창 ---
  openSettingsModal() {
    const sfxCheckbox = document.getElementById('setting-sfx');
    const bgmCheckbox = document.getElementById('setting-bgm');
    const keyGuideCheckbox = document.getElementById('setting-key-guide');
    const fieldSizeSelect = document.getElementById('setting-field-size');

    sfxCheckbox.checked = storage.settings.sfx;
    bgmCheckbox.checked = storage.settings.bgm;
    keyGuideCheckbox.checked = storage.settings.showKeyGuide;
    fieldSizeSelect.value = storage.settings.fieldSize || 3;

    sfxCheckbox.onchange = () => {
      storage.settings.sfx = sfxCheckbox.checked;
      sound.setSfxEnabled(storage.settings.sfx);
      storage.saveSettings();
      this.updateSoundButtons();
    };

    bgmCheckbox.onchange = () => {
      storage.settings.bgm = bgmCheckbox.checked;
      sound.setBgmEnabled(storage.settings.bgm);
      storage.saveSettings();
      this.updateSoundButtons();
    };

    keyGuideCheckbox.onchange = () => {
      storage.settings.showKeyGuide = keyGuideCheckbox.checked;
      storage.saveSettings();
      this.updateKeyBadges();
    };

    fieldSizeSelect.onchange = () => {
      const size = parseInt(fieldSizeSelect.value, 10);
      storage.settings.fieldSize = size;
      storage.saveSettings();
      this.game.setGridSize(size);
    };

    document.getElementById('btn-reset-data').onclick = () => {
      if (confirm('모든 기록, 최고 점수 및 해금 업적을 초기화하시겠습니까?')) {
        storage.resetAll();
        alert('데이터가 초기화되었습니다.');
        this.renderStartScreenStats();
        this.openSettingsModal();
      }
    };

    this.modalSettings.classList.remove('hidden');
  }

  // --- 하단 보유 증강 & 시너지 렌더링 ---
  updateBottomAugmentBar() {
    this.activeAugmentsListEl.innerHTML = '';
    const owned = this.game.augmentManager.owned;
    const bossAugments = this.game.augmentManager.bossAugments;

    // 일반 증강
    Object.keys(owned).forEach((id) => {
      const lvl = owned[id];
      const data = AUGMENTS_DATA[id];
      if (!data) return;

      const badge = document.createElement('div');
      badge.className = `aug-mini-badge rarity-${data.rarity}`;
      badge.title = `${data.name} (Lv.${lvl}): ${data.descriptions[lvl - 1]}`;
      badge.innerHTML = `<span>${data.icon}</span><span class="badge-lvl">Lv.${lvl}</span>`;
      this.activeAugmentsListEl.appendChild(badge);
    });

    // 보스 전설 증강
    Object.keys(bossAugments).forEach((id) => {
      const data = BOSS_AUGMENTS_DATA[id];
      if (!data) return;

      const badge = document.createElement('div');
      badge.className = 'aug-mini-badge rarity-legendary';
      badge.title = `[보스 전설] ${data.name}: ${data.descriptions[0]}`;
      badge.innerHTML = `<span>${data.icon}</span><span class="badge-lvl">★</span>`;
      this.activeAugmentsListEl.appendChild(badge);
    });

    // 활성 시너지
    this.activeSynergiesListEl.innerHTML = '';
    this.game.augmentManager.activeSynergies.forEach((syn) => {
      const synBadge = document.createElement('div');
      synBadge.className = 'synergy-badge';
      synBadge.title = `[시너지 효과] ${syn.name}: ${syn.desc}`;
      synBadge.innerHTML = `<span>${syn.icon}</span> <span>${syn.name}</span>`;
      this.activeSynergiesListEl.appendChild(synBadge);
    });
  }

  // --- 결과 화면 ---
  showResultScreen(summary) {
    this.screenGame.classList.add('hidden');
    this.screenResult.classList.remove('hidden');

    const titleEl = document.getElementById('result-title');
    if (summary.isVictory) {
      titleEl.textContent = '🎉 평화를 되찾은 두더지 마을! (GAME CLEAR)';
      titleEl.style.color = '#facc15';
    } else {
      titleEl.textContent = 'GAME OVER';
      titleEl.style.color = '#ef4444';
    }

    document.getElementById('result-score').textContent = summary.score.toLocaleString();
    document.getElementById('result-kills').textContent = summary.totalKills;
    document.getElementById('result-max-combo').textContent = `${summary.maxCombo} 콤보`;
    document.getElementById('result-accuracy').textContent = `${summary.accuracy}%`;
    document.getElementById('result-coins').textContent = summary.coins;
    document.getElementById('result-boss-kills').textContent = `${summary.bossKills} 마리`;

    const highEl = document.getElementById('result-is-high-score');
    if (summary.isNewHighScore) {
      highEl.classList.remove('hidden');
    } else {
      highEl.classList.add('hidden');
    }

    // 결과 창 증강 요약
    const augSummaryEl = document.getElementById('result-augments-summary');
    augSummaryEl.innerHTML = '';
    Object.keys(summary.augments).forEach((id) => {
      const lvl = summary.augments[id];
      const d = AUGMENTS_DATA[id];
      if (d) {
        const item = document.createElement('span');
        item.className = 'result-aug-item';
        item.textContent = `${d.icon} ${d.name} Lv.${lvl}`;
        augSummaryEl.appendChild(item);
      }
    });

    // 새로 달성한 업적 안내
    if (summary.newAchievements && summary.newAchievements.length > 0) {
      summary.newAchievements.forEach((ach) => {
        this.spawnFloatingText(`🏆 업적 달성! [${ach.title}]`, window.innerWidth / 2, 80, '#facc15');
      });
    }
  }

  renderStartScreenStats() {
    const stats = storage.stats;
    document.getElementById('start-high-score').textContent = stats.highScore.toLocaleString();
    document.getElementById('start-max-combo').textContent = `${stats.maxCombo} 콤보`;
    document.getElementById('start-total-kills').textContent = stats.totalKills.toLocaleString();
  }

  updateSoundButtons() {
    const sfxBtn = document.getElementById('btn-toggle-sfx');
    const bgmBtn = document.getElementById('btn-toggle-bgm');
    sfxBtn.textContent = storage.settings.sfx ? '🔊 효과음 ON' : '🔇 효과음 OFF';
    bgmBtn.textContent = storage.settings.bgm ? '🎵 BGM ON' : '🔇 BGM OFF';
  }

  applyInitialSettings() {
    sound.setSfxEnabled(storage.settings.sfx);
    sound.setBgmEnabled(storage.settings.bgm);
    this.updateSoundButtons();
  }

  closeModal(modalEl) {
    if (modalEl) modalEl.classList.add('hidden');
  }
}

// DOM 준비 상태에 따라 안전하게 앱 실행
function initApp() {
  if (!window.moleApp) {
    try {
      window.moleApp = new MoleApp();
      console.log('두더지 대작전 게임이 정상적으로 초기화되었습니다.');
    } catch (err) {
      console.error('MoleApp 초기화 오류:', err);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
