/* 두더지 대작전! 단일 번들 스크립트 */
(function() {
"use strict";


/* --- MODULE: src/audio.js --- */
/**
 * Web Audio API 기반 절차적 사운드 신디사이저
 * 외부 오디오 파일 없이 100% 브라우저 자체 합성으로 아케이드 효과음 및 BGM 재생
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.bgmEnabled = true;
    this.masterVolume = 0.7;
    this.sfxVolume = 0.8;
    this.bgmVolume = 0.4;

    this.bgmGainNode = null;
    this.sfxGainNode = null;
    this.masterGainNode = null;

    this.bgmInterval = null;
    this.bgmStep = 0;
    this.currentBgmTrack = 'normal'; // 'normal', 'boss', 'victory'
    this.isPlayingBgm = false;
  }

  init() {
    if (this.ctx) return;
    if (typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();

      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGainNode.connect(this.ctx.destination);

      this.sfxGainNode = this.ctx.createGain();
      this.sfxGainNode.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGainNode.connect(this.masterGainNode);

      this.bgmGainNode = this.ctx.createGain();
      this.bgmGainNode.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
      this.bgmGainNode.connect(this.masterGainNode);
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = enabled;
  }

  setBgmEnabled(enabled) {
    this.bgmEnabled = enabled;
    if (!enabled) {
      this.stopBGM();
    } else if (this.isPlayingBgm) {
      this.startBGM(this.currentBgmTrack);
    }
  }

  // --- SFX GENERATORS ---

  playHitNormal() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start(now);
    osc.stop(now + 0.12);

    // 타격 노이즈 추가 (우드 해머 질감)
    this.playThudNoise(0.08, 0.4);
  }

  playThudNoise(duration, vol) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGainNode);

    noise.start(now);
  }

  playHitGolden() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    // 영롱한 아르페지오 (C6 -> E6 -> G6 -> B6)
    const notes = [1046.5, 1318.5, 1567.98, 1975.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  playHitBomb() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;

    // 폭발 저음
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.4);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);
    osc.start(now);
    osc.stop(now + 0.4);

    // 폭발 노이즈
    this.playThudNoise(0.45, 0.9);

    // 에러 비프
    const beep = this.ctx.createOscillator();
    const beepGain = this.ctx.createGain();
    beep.type = 'square';
    beep.frequency.setValueAtTime(130, now + 0.15);
    beepGain.gain.setValueAtTime(0.4, now + 0.15);
    beepGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    beep.connect(beepGain);
    beepGain.connect(this.sfxGainNode);
    beep.start(now + 0.15);
    beep.stop(now + 0.45);
  }

  playHitBoss(isWeakPoint = false) {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    if (isWeakPoint) {
      // 크리티컬 약점 타격음!
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);

      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);
      osc.start(now);
      osc.stop(now + 0.25);

      // 크런치 징 소리
      const chime = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chime.type = 'square';
      chime.frequency.setValueAtTime(1200, now);
      chime.frequency.exponentialRampToValueAtTime(400, now + 0.3);
      chimeGain.gain.setValueAtTime(0.5, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      chime.connect(chimeGain);
      chimeGain.connect(this.sfxGainNode);
      chime.start(now);
      chime.stop(now + 0.3);
    } else {
      // 일반 보스 타격음 (묵직한 철제/가죽 충격음)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.18);

      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);
      osc.start(now);
      osc.stop(now + 0.18);
      this.playThudNoise(0.15, 0.6);
    }
  }

  playCombo(combo) {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const baseFreq = 440;
    // 콤보가 올라갈수록 음정이 경쾌하게 상승 (반음 단위)
    const semitones = Math.min(24, combo);
    const freq = baseFreq * Math.pow(2, semitones / 12);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start(now);
    osc.stop(now + 0.15);

    // 10콤보 단위마다 특별 팡파레
    if (combo > 0 && combo % 10 === 0) {
      this.playComboMilestone();
    }
  }

  playComboMilestone() {
    if (!this.sfxEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    chords.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.05;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  playLightning() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);
    osc.start(now);
    osc.stop(now + 0.22);

    this.playThudNoise(0.2, 0.7);
  }

  playShockwave() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);
    osc.start(now);
    osc.stop(now + 0.5);

    this.playThudNoise(0.35, 0.8);
  }

  playAugmentSelect() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    // 레벨업 팡파레 (도-솔-도-미)
    const notes = [523.25, 783.99, 1046.5, 1318.51];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  playBossWarning() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    // 긴급 경보 사이렌 (저음 두-두-두-우웅)
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.28;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.linearRampToValueAtTime(440, t + 0.18);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);
      osc.start(t);
      osc.stop(t + 0.25);
    }
  }

  playBossDefeat() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    // 영광스러운 승리 코드 아르페지오
    const arpeggio = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    arpeggio.forEach((f, i) => {
      const t = now + i * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  playBossFlee() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    // 익살스러운 하강 슬라이드 (휘익 도망감)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.6);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);
    osc.start(now);
    osc.stop(now + 0.6);

    this.playThudNoise(0.5, 0.5);
  }

  playCoin() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playClick() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // --- ADAPTIVE PROCEDURAL BGM ENGINE ---

  startBGM(track = 'normal') {
    this.init();
    this.resume();
    this.currentBgmTrack = track;
    this.isPlayingBgm = true;

    if (!this.bgmEnabled) return;

    this.stopBGM();
    this.bgmStep = 0;

    // 16비트 스텝 시퀀서 (템포: 보통 130 BPM, 보스 150 BPM)
    const bpm = track === 'boss' ? 150 : 130;
    const stepDurationMs = (60 / bpm / 4) * 1000;

    // 멜로디 / 코드 진행 정의
    const normalBass = [130.81, 130.81, 146.83, 164.81, 174.61, 174.61, 164.81, 146.83]; // C D E F G...
    const bossBass = [98, 98, 116.54, 98, 130.81, 123.47, 116.54, 98]; // G Bb C B...
    const melodyNotes = track === 'boss'
      ? [392, 0, 466.16, 523.25, 0, 466.16, 392, 0, 587.33, 0, 523.25, 0, 466.16, 392, 0, 329.63]
      : [523.25, 0, 659.25, 0, 783.99, 659.25, 523.25, 0, 587.33, 0, 698.46, 0, 783.99, 0, 659.25, 0];

    this.bgmInterval = setInterval(() => {
      if (!this.bgmEnabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const step16 = this.bgmStep % 16;
      const bassSeq = track === 'boss' ? bossBass : normalBass;
      const bassNote = bassSeq[Math.floor(this.bgmStep / 2) % bassSeq.length];

      // 베이스 (모든 짝수 스텝마다)
      if (this.bgmStep % 2 === 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = track === 'boss' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(bassNote, now);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

        osc.connect(gain);
        gain.connect(this.bgmGainNode);
        osc.start(now);
        osc.stop(now + 0.14);
      }

      // 하이햇 / 리듬 클릭 (모든 4번째 스텝 또는 엇박)
      if (step16 % 4 === 2) {
        this.playHiHat(now, 0.05);
      }

      // 리드 멜로디
      const leadFreq = melodyNotes[step16];
      if (leadFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(leadFreq, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.18);

        osc.connect(gain);
        gain.connect(this.bgmGainNode);
        osc.start(now);
        osc.stop(now + 0.18);
      }

      this.bgmStep++;
    }, stepDurationMs);
  }

  playHiHat(time, vol) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGainNode);
    noise.start(time);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

const sound = new SoundEngine();


/* --- MODULE: src/storage.js --- */
/**
 * LocalStorage 관리 및 업적 시스템
 */

const STORAGE_KEYS = {
  STATS: 'whack_mole_stats',
  ACHIEVEMENTS: 'whack_mole_achievements',
  SETTINGS: 'whack_mole_settings'
};

const DEFAULT_STATS = {
  highScore: 0,
  maxCombo: 0,
  totalKills: 0,
  goldenKills: 0,
  bossKills: 0,
  totalCoins: 0,
  gamesPlayed: 0
};

const DEFAULT_SETTINGS = {
  sfx: true,
  bgm: true,
  fieldSize: 3, // 3 (3x3) or 4 (4x4)
  showKeyGuide: true
};

const ACHIEVEMENTS_DEF = [
  {
    id: 'first_hit',
    title: '두더지 사냥의 시작',
    desc: '첫 번째 두더지를 처치하세요.',
    icon: '🎯',
    check: (stats) => stats.totalKills >= 1
  },
  {
    id: 'mole_hunter_100',
    title: '백발백중 두더지 헌터',
    desc: '누적 두더지 100마리를 처치하세요.',
    icon: '🔨',
    check: (stats) => stats.totalKills >= 100
  },
  {
    id: 'combo_20',
    title: '콤보 마스터',
    desc: '한 판에서 20 콤보를 달성하세요.',
    icon: '🔥',
    check: (stats) => stats.maxCombo >= 20
  },
  {
    id: 'combo_50',
    title: '초신속의 신기원',
    desc: '한 판에서 50 콤보를 달성하세요.',
    icon: '⚡',
    check: (stats) => stats.maxCombo >= 50
  },
  {
    id: 'golden_10',
    title: '황금빛 행운',
    desc: '황금 두더지 10마리를 처치하세요.',
    icon: '✨',
    check: (stats) => stats.goldenKills >= 10
  },
  {
    id: 'boss_king_clear',
    title: '왕관의 몰락',
    desc: '두더지 대왕(웨이브 3 보스)을 처치하세요.',
    icon: '👑',
    check: (stats, context) => context?.bossKilled === 'mole_king' || stats.bossKills >= 1
  },
  {
    id: 'boss_iron_clear',
    title: '철갑을 뚫는 망치',
    desc: '철갑 두더지(웨이브 6 보스)를 처치하세요.',
    icon: '🛡️',
    check: (stats, context) => context?.bossKilled === 'iron_mole'
  },
  {
    id: 'boss_demon_clear',
    title: '마왕 토벌과 평화',
    desc: '마왕 두더지(웨이브 9 최종 보스)를 처치하고 게임을 클리어하세요.',
    icon: '👹',
    check: (stats, context) => context?.bossKilled === 'demon_mole'
  },
  {
    id: 'augment_max',
    title: '완벽한 진화',
    desc: '하나의 증강을 최고 단계(3단계)까지 강화하세요.',
    icon: '⭐',
    check: (stats, context) => context?.hasMaxAugment === true
  },
  {
    id: 'synergy_master',
    title: '시너지 연금술사',
    desc: '증강 시너지를 1개 이상 활성화하세요.',
    icon: '🔮',
    check: (stats, context) => context?.hasSynergy === true
  },
  {
    id: 'rich_mole',
    title: '두더지 골드러시',
    desc: '누적 코인 150개 이상을 획득하세요.',
    icon: '💰',
    check: (stats) => stats.totalCoins >= 150
  },
  {
    id: 'score_10000',
    title: '전설의 망치잡이',
    desc: '최고 점수 10,000점 이상을 달성하세요.',
    icon: '🏆',
    check: (stats) => stats.highScore >= 10000
  }
];

class StorageManager {
  constructor() {
    this.stats = this.loadStats();
    this.achievements = this.loadAchievements();
    this.settings = this.loadSettings();
    this.newlyUnlocked = [];
  }

  loadStats() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return { ...DEFAULT_STATS };
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      return data ? { ...DEFAULT_STATS, ...JSON.parse(data) } : { ...DEFAULT_STATS };
    } catch (e) {
      console.warn('Storage read failed:', e);
      return { ...DEFAULT_STATS };
    }
  }

  saveStats() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(this.stats));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  loadAchievements() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return {};
      const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.warn('Achievements read failed:', e);
      return {};
    }
  }

  saveAchievements() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(this.achievements));
    } catch (e) {
      console.warn('Achievements save failed:', e);
    }
  }

  loadSettings() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return { ...DEFAULT_SETTINGS };
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
    } catch (e) {
      console.warn('Settings read failed:', e);
      return { ...DEFAULT_SETTINGS };
    }
  }

  saveSettings() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Settings save failed:', e);
    }
  }

  recordGameStats({ score, maxCombo, kills, goldenKills, bossKills, coins, context = {} }) {
    let isNewHighScore = false;
    let isNewMaxCombo = false;

    if (score > this.stats.highScore) {
      this.stats.highScore = score;
      isNewHighScore = true;
    }

    if (maxCombo > this.stats.maxCombo) {
      this.stats.maxCombo = maxCombo;
      isNewMaxCombo = true;
    }

    this.stats.totalKills += (kills || 0);
    this.stats.goldenKills += (goldenKills || 0);
    this.stats.bossKills += (bossKills || 0);
    this.stats.totalCoins += (coins || 0);
    this.stats.gamesPlayed += 1;

    this.saveStats();
    const newAchievements = this.checkAchievements(context);

    return {
      isNewHighScore,
      isNewMaxCombo,
      newAchievements
    };
  }

  checkAchievements(context = {}) {
    const unlockedNow = [];
    ACHIEVEMENTS_DEF.forEach((ach) => {
      if (!this.achievements[ach.id]) {
        if (ach.check(this.stats, context)) {
          this.achievements[ach.id] = {
            unlockedAt: new Date().toISOString()
          };
          unlockedNow.push(ach);
        }
      }
    });

    if (unlockedNow.length > 0) {
      this.saveAchievements();
    }
    return unlockedNow;
  }

  resetAll() {
    this.stats = { ...DEFAULT_STATS };
    this.achievements = {};
    this.saveStats();
    this.saveAchievements();
  }
}

const storage = new StorageManager();


/* --- MODULE: src/augments.js --- */
/**
 * 증강(Augments) 및 시너지(Synergies) 시스템 정의
 */

const AUGMENTS_DATA = {
  golden_hammer: {
    id: 'golden_hammer',
    name: '황금 망치',
    icon: '🔨',
    rarity: 'rare',
    maxLevel: 3,
    descriptions: [
      '타격 기본 점수가 50% 증가합니다.',
      '타격 기본 점수가 100% 증가합니다.',
      '타격 기본 점수가 160% 증가합니다.'
    ],
    bonusMultiplier: [1.5, 2.0, 2.6]
  },
  combo_master: {
    id: 'combo_master',
    name: '연속 타격',
    icon: '⏳',
    rarity: 'common',
    maxLevel: 3,
    descriptions: [
      '콤보 유지 시간이 +1.5초 증가합니다.',
      '콤보 유지 시간이 +3.0초 증가합니다.',
      '콤보 유지 시간이 +5.0초 증가합니다.'
    ],
    bonusDuration: [1.5, 3.0, 5.0]
  },
  gold_magnet: {
    id: 'gold_magnet',
    name: '황금 자석',
    icon: '🧲',
    rarity: 'rare',
    maxLevel: 3,
    descriptions: [
      '두더지 처치 시 코인 획득 확률 +30%, 획득량 +1',
      '두더지 처치 시 코인 획득 확률 +60%, 획득량 +2',
      '두더지 처치 시 코인 획득 확률 +100%, 획득량 +3'
    ],
    coinChance: [0.3, 0.6, 1.0],
    coinBonus: [1, 2, 3]
  },
  lightning_strike: {
    id: 'lightning_strike',
    name: '번개 타격',
    icon: '⚡',
    rarity: 'epic',
    maxLevel: 3,
    descriptions: [
      '타격 시 30% 확률로 다른 구멍의 두더지에 번개를 내리쳐 처치합니다.',
      '타격 시 50% 확률로 다른 구멍의 두더지에 번개를 내리쳐 처치합니다.',
      '타격 시 75% 확률로 다른 구멍의 두더지 2마리까지 번개 처치합니다.'
    ],
    chance: [0.3, 0.5, 0.75],
    targets: [1, 1, 2]
  },
  splash_hammer: {
    id: 'splash_hammer',
    name: '광역 망치',
    icon: '💥',
    rarity: 'epic',
    maxLevel: 3,
    descriptions: [
      '타격 시 인접한 구멍 1개의 일반 두더지를 함께 처치합니다.',
      '타격 시 인접한 구멍 2개의 일반 두더지를 함께 처치합니다.',
      '타격 시 인접한 모든(상하좌우) 구멍의 일반 두더지를 함께 처치합니다.'
    ],
    splashCount: [1, 2, 4]
  },
  auto_mallet: {
    id: 'auto_mallet',
    name: '자동 망치',
    icon: '🤖',
    rarity: 'rare',
    maxLevel: 3,
    descriptions: [
      '매 5초마다 필드의 무작위 두더지를 자동으로 1마리 타격합니다.',
      '매 4초마다 필드의 무작위 두더지를 자동으로 1마리 타격합니다.',
      '매 3초마다 필드의 무작위 두더지를 자동으로 1마리 타격합니다.'
    ],
    interval: [5000, 4000, 3000]
  },
  time_warp: {
    id: 'time_warp',
    name: '시간 왜곡',
    icon: '🌀',
    rarity: 'common',
    maxLevel: 3,
    descriptions: [
      '두더지가 지상에 머무르는 노출 시간이 25% 증가합니다.',
      '두더지가 지상에 머무르는 노출 시간이 50% 증가합니다.',
      '두더지가 지상에 머무르는 노출 시간이 85% 증가합니다.'
    ],
    exposureBonus: [0.25, 0.50, 0.85]
  },
  midas_touch: {
    id: 'midas_touch',
    name: '황금 손',
    icon: '🖐️',
    rarity: 'rare',
    maxLevel: 3,
    descriptions: [
      '타격 시 20% 확률로 점수 및 코인이 2배로 지급됩니다.',
      '타격 시 35% 확률로 점수 및 코인이 2배로 지급됩니다.',
      '타격 시 55% 확률로 점수 및 코인이 2배로 지급됩니다.'
    ],
    doubleChance: [0.20, 0.35, 0.55]
  },
  berserker: {
    id: 'berserker',
    name: '광전사',
    icon: '🩸',
    rarity: 'rare',
    maxLevel: 3,
    descriptions: [
      '10 콤보 이상일 때 콤보 비례 점수 배율이 +50% 추가 적용됩니다.',
      '10 콤보 이상일 때 콤보 비례 점수 배율이 +100% 추가 적용됩니다.',
      '10 콤보 이상일 때 콤보 비례 점수 배율이 +180% 추가 적용됩니다.'
    ],
    berserkBonus: [0.5, 1.0, 1.8]
  },
  lucky_mole: {
    id: 'lucky_mole',
    name: '행운의 두더지',
    icon: '🍀',
    rarity: 'common',
    maxLevel: 3,
    descriptions: [
      '황금 두더지의 출현 확률이 12% 증가합니다.',
      '황금 두더지의 출현 확률이 25% 증가합니다.',
      '황금 두더지의 출현 확률이 45% 증가합니다.'
    ],
    goldSpawnBonus: [0.12, 0.25, 0.45]
  },
  weakness_exploit: {
    id: 'weakness_exploit',
    name: '약점 포착',
    icon: '🎯',
    rarity: 'rare',
    maxLevel: 3,
    descriptions: [
      '보스의 약점 노출 시간이 +40% 증가합니다.',
      '보스의 약점 노출 시간이 +80% 증가합니다.',
      '보스의 약점 노출 시간이 +130% 증가합니다.'
    ],
    weakPointDurationBonus: [0.4, 0.8, 1.3]
  },
  boss_slayer: {
    id: 'boss_slayer',
    name: '보스 사냥꾼',
    icon: '⚔️',
    rarity: 'epic',
    maxLevel: 3,
    descriptions: [
      '보스에게 주는 피해량이 +1 증가합니다 (타격당 2 피해).',
      '보스에게 주는 피해량이 +2 증가합니다 (타격당 3 피해).',
      '보스에게 주는 피해량이 +3 증가합니다 (타격당 4 피해).'
    ],
    bonusDamage: [1, 2, 3]
  },
  overtime: {
    id: 'overtime',
    name: '시간 연장',
    icon: '⏱️',
    rarity: 'common',
    maxLevel: 3,
    descriptions: [
      '웨이브 및 보스전 제한 시간이 +5초 연장됩니다.',
      '웨이브 및 보스전 제한 시간이 +10초 연장됩니다.',
      '웨이브 및 보스전 제한 시간이 +16초 연장됩니다.'
    ],
    extraSeconds: [5, 10, 16]
  },
  iron_will: {
    id: 'iron_will',
    name: '불굴의 의지',
    icon: '🛡️',
    rarity: 'rare',
    maxLevel: 3,
    descriptions: [
      '실수나 폭탄으로 인한 콤보 초기화를 웨이브당 1회 방어합니다.',
      '실수나 폭탄으로 인한 콤보 초기화를 웨이브당 2회 방어합니다.',
      '실수나 폭탄으로 인한 콤보 초기화를 웨이브당 3회 방어합니다.'
    ],
    shieldsPerWave: [1, 2, 3]
  },
  shockwave: {
    id: 'shockwave',
    name: '충격파',
    icon: '🌊',
    rarity: 'epic',
    maxLevel: 3,
    descriptions: [
      '매 15 콤보 달성 시 필드의 모든 일반 두더지를 쓸어버리는 충격파가 발동합니다.',
      '매 12 콤보 달성 시 필드의 모든 일반 두더지를 쓸어버리는 충격파가 발동합니다.',
      '매 10 콤보 달성 시 대형 충격파가 발동하며 보스에게도 큰 피해를 줍니다.'
    ],
    comboRequirement: [15, 12, 10]
  }
};

const BOSS_AUGMENTS_DATA = {
  hammer_of_destruction: {
    id: 'hammer_of_destruction',
    name: '파괴의 망치',
    icon: '🌋',
    rarity: 'legendary',
    maxLevel: 1,
    descriptions: [
      '모든 타격 피해량이 영구적으로 2배가 되며, 타격 시 폭발 반경 3x3의 두더지들을 일제 소탕합니다.'
    ]
  },
  chain_lightning: {
    id: 'chain_lightning',
    name: '연쇄 번개',
    icon: '🌩️',
    rarity: 'legendary',
    maxLevel: 1,
    descriptions: [
      '모든 타격 시 100% 확률로 최대 3마리의 다른 두더지에게 연쇄 번개가 전파되어 감전 처치합니다.'
    ]
  },
  time_master: {
    id: 'time_master',
    name: '시간 지배자',
    icon: '🌌',
    rarity: 'legendary',
    maxLevel: 1,
    descriptions: [
      '모든 두더지의 이동 속도가 35% 느려지며, 보스의 약점 노출 시간이 2배로 증가합니다.'
    ]
  }
};

const SYNERGIES = [
  {
    id: 'golden_bloom',
    name: '황금 만개',
    icon: '🌸✨',
    req: ['golden_hammer', 'gold_magnet'],
    desc: '황금 두더지 처치 시 코인과 점수가 3배가 되며, 화면 가득 황금 불꽃이 튑니다.'
  },
  {
    id: 'thunder_storm',
    name: '뇌전 폭풍',
    icon: '⛈️⚡',
    req: ['lightning_strike', 'shockwave'],
    desc: '번개가 2회 연속 전파되며, 충격파 발동 콤보 요구치가 8콤보로 대폭 감소합니다.'
  },
  {
    id: 'furious_barrage',
    name: '무한의 난타',
    icon: '🔥🥊',
    req: ['berserker', 'combo_master'],
    desc: '콤보 배율 상한이 해제되며, 15 콤보 이상일 때 모든 타격이 광역 타격으로 강화됩니다.'
  },
  {
    id: 'fatal_strike',
    name: '치명타 마스터',
    icon: '🗡️🎯',
    req: ['weakness_exploit', 'boss_slayer'],
    desc: '보스의 약점을 공격할 때 피해량이 3배로 증폭되고 보스가 1.5초간 기절합니다.'
  }
];

class AugmentManager {
  constructor() {
    this.owned = {}; // augmentId -> level (1, 2, 3)
    this.bossAugments = {}; // bossAugmentId -> 1
    this.activeSynergies = [];
    this.stats = {
      augmentsChosen: 0
    };
  }

  reset() {
    this.owned = {};
    this.bossAugments = {};
    this.activeSynergies = [];
    this.stats.augmentsChosen = 0;
  }

  getLevel(id) {
    return this.owned[id] || 0;
  }

  hasBossAugment(id) {
    return !!this.bossAugments[id];
  }

  hasSynergy(id) {
    return this.activeSynergies.some((s) => s.id === id);
  }

  // 무작위 증강 3개 뽑기 (레벨 3 미만인 것 중 중복 없이)
  getRandomSelection(count = 3) {
    const pool = Object.values(AUGMENTS_DATA).filter((aug) => {
      const curLvl = this.getLevel(aug.id);
      return curLvl < aug.maxLevel;
    });

    // 셔플 알고리즘 (Fisher-Yates)
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, count);
    return selected.map((aug) => {
      const currentLevel = this.getLevel(aug.id);
      const nextLevel = currentLevel + 1;
      return {
        ...aug,
        currentLevel,
        nextLevel,
        nextDescription: aug.descriptions[nextLevel - 1]
      };
    });
  }

  // 보스 전용 증강 3개 (또는 남은 보스 증강)
  getBossRewardSelection() {
    const pool = Object.values(BOSS_AUGMENTS_DATA).filter((b) => !this.hasBossAugment(b.id));
    return pool.map((b) => ({
      ...b,
      currentLevel: 0,
      nextLevel: 1,
      nextDescription: b.descriptions[0]
    }));
  }

  // 증강 적용
  selectAugment(id) {
    if (BOSS_AUGMENTS_DATA[id]) {
      this.bossAugments[id] = 1;
    } else if (AUGMENTS_DATA[id]) {
      const current = this.getLevel(id);
      if (current < AUGMENTS_DATA[id].maxLevel) {
        this.owned[id] = current + 1;
      }
    }
    this.stats.augmentsChosen++;
    this.checkSynergies();
  }

  checkSynergies() {
    const newlyActivated = [];
    SYNERGIES.forEach((syn) => {
      const alreadyActive = this.hasSynergy(syn.id);
      const meetsReq = syn.req.every((reqId) => this.getLevel(reqId) >= 1);
      if (meetsReq && !alreadyActive) {
        this.activeSynergies.push(syn);
        newlyActivated.push(syn);
      }
    });
    return newlyActivated;
  }

  // 계산 헬퍼 함수들
  getScoreMultiplier() {
    const lvl = this.getLevel('golden_hammer');
    let mult = 1;
    if (lvl > 0) mult = AUGMENTS_DATA.golden_hammer.bonusMultiplier[lvl - 1];
    if (this.hasBossAugment('hammer_of_destruction')) mult *= 2.0;
    return mult;
  }

  getComboDurationBonus() {
    const lvl = this.getLevel('combo_master');
    return lvl > 0 ? AUGMENTS_DATA.combo_master.bonusDuration[lvl - 1] : 0;
  }

  getCoinBonusChance() {
    const lvl = this.getLevel('gold_magnet');
    return lvl > 0 ? AUGMENTS_DATA.gold_magnet.coinChance[lvl - 1] : 0;
  }

  getCoinBonusAmount() {
    const lvl = this.getLevel('gold_magnet');
    return lvl > 0 ? AUGMENTS_DATA.gold_magnet.coinBonus[lvl - 1] : 0;
  }

  getLightningConfig() {
    if (this.hasBossAugment('chain_lightning')) {
      return { chance: 1.0, targets: 3, isChain: true };
    }
    const lvl = this.getLevel('lightning_strike');
    if (lvl === 0) return null;
    let targets = AUGMENTS_DATA.lightning_strike.targets[lvl - 1];
    if (this.hasSynergy('thunder_storm')) targets += 1;
    return {
      chance: AUGMENTS_DATA.lightning_strike.chance[lvl - 1],
      targets
    };
  }

  getSplashCount() {
    if (this.hasBossAugment('hammer_of_destruction')) return 8; // 3x3 전체
    if (this.hasSynergy('furious_barrage')) return 4;
    const lvl = this.getLevel('splash_hammer');
    return lvl > 0 ? AUGMENTS_DATA.splash_hammer.splashCount[lvl - 1] : 0;
  }

  getAutoMalletInterval() {
    const lvl = this.getLevel('auto_mallet');
    return lvl > 0 ? AUGMENTS_DATA.auto_mallet.interval[lvl - 1] : null;
  }

  getExposureBonus() {
    let bonus = 0;
    const lvl = this.getLevel('time_warp');
    if (lvl > 0) bonus += AUGMENTS_DATA.time_warp.exposureBonus[lvl - 1];
    if (this.hasBossAugment('time_master')) bonus += 0.35;
    return bonus;
  }

  getMidasChance() {
    const lvl = this.getLevel('midas_touch');
    return lvl > 0 ? AUGMENTS_DATA.midas_touch.doubleChance[lvl - 1] : 0;
  }

  getBerserkBonus() {
    const lvl = this.getLevel('berserker');
    return lvl > 0 ? AUGMENTS_DATA.berserker.berserkBonus[lvl - 1] : 0;
  }

  getLuckyMoleBonus() {
    const lvl = this.getLevel('lucky_mole');
    return lvl > 0 ? AUGMENTS_DATA.lucky_mole.goldSpawnBonus[lvl - 1] : 0;
  }

  getWeaknessDurationMultiplier() {
    let mult = 1.0;
    const lvl = this.getLevel('weakness_exploit');
    if (lvl > 0) mult += AUGMENTS_DATA.weakness_exploit.weakPointDurationBonus[lvl - 1];
    if (this.hasBossAugment('time_master')) mult *= 2.0;
    return mult;
  }

  getBossDamageBonus() {
    const lvl = this.getLevel('boss_slayer');
    let bonus = lvl > 0 ? AUGMENTS_DATA.boss_slayer.bonusDamage[lvl - 1] : 0;
    if (this.hasBossAugment('hammer_of_destruction')) bonus += 2;
    return bonus;
  }

  getExtraTime() {
    const lvl = this.getLevel('overtime');
    return lvl > 0 ? AUGMENTS_DATA.overtime.extraSeconds[lvl - 1] : 0;
  }

  getShieldsPerWave() {
    const lvl = this.getLevel('iron_will');
    return lvl > 0 ? AUGMENTS_DATA.iron_will.shieldsPerWave[lvl - 1] : 0;
  }

  getShockwaveRequirement() {
    if (this.hasSynergy('thunder_storm')) return 8;
    const lvl = this.getLevel('shockwave');
    return lvl > 0 ? AUGMENTS_DATA.shockwave.comboRequirement[lvl - 1] : 0;
  }
}


/* --- MODULE: src/boss.js --- */
/**
 * 보스 시스템: 두더지 대왕, 철갑 두더지, 마왕 두더지
 */

const BOSS_TYPES = {
  mole_king: {
    id: 'mole_king',
    name: '두더지 대왕',
    title: '지하 왕국의 거만한 군주',
    wave: 3,
    maxHp: 16,
    baseTimeLimit: 30,
    icon: '👑',
    avatar: 'boss-king',
    weakPointName: '번쩍이는 황금 왕관',
    color: '#f59e0b',
    escapePenaltyDesc: '보스가 약올리며 도망쳤습니다! (패널티 없음)'
  },
  iron_mole: {
    id: 'iron_mole',
    name: '철갑 두더지',
    title: '강철 방패의 수호자',
    wave: 6,
    maxHp: 28,
    baseTimeLimit: 30,
    icon: '🛡️',
    avatar: 'boss-iron',
    weakPointName: '열린 투구 틈새',
    color: '#64748b',
    escapePenaltyDesc: '도망치며 진흙을 뿌려 다음 웨이브 동안 구멍 1개가 봉쇄됩니다!'
  },
  demon_mole: {
    id: 'demon_mole',
    name: '마왕 두더지',
    title: '어둠의 심연 지배자',
    wave: 9,
    maxHp: 44,
    baseTimeLimit: 35,
    icon: '👹',
    avatar: 'boss-demon',
    weakPointName: '혼돈의 마력 핵',
    color: '#9333ea',
    escapePenaltyDesc: '어둠 속으로 도망쳤습니다. 최후의 보상을 놓쳤습니다!'
  }
};

class BossInstance {
  constructor(bossTypeKey, augmentManager) {
    this.config = BOSS_TYPES[bossTypeKey];
    this.augmentManager = augmentManager;

    this.maxHp = this.config.maxHp;
    this.currentHp = this.maxHp;
    this.totalDamageTaken = 0;

    const extraTime = augmentManager.getExtraTime();
    this.timeLimit = this.config.baseTimeLimit + extraTime;
    this.remainingTime = this.timeLimit;

    this.currentHoleIndex = -1;
    this.cloneHoles = []; // 마왕 두더지 분신 구멍들: [{ holeIndex, isReal }]

    this.isWeakPointExposed = false;
    this.isEnraged = false;
    this.isStunned = false;
    this.stunTimer = 0;

    this.state = 'SPAWNING'; // SPAWNING, ACTIVE, SUBMERGED, DEFEATED, FLED
    this.timer = 0;
    this.cycleTimer = 0;
    this.weakPointTimer = 0;

    // 움직임 주기 (초)
    this.stayDuration = bossTypeKey === 'mole_king' ? 2.2 : bossTypeKey === 'iron_mole' ? 2.5 : 2.8;
  }

  update(dt, totalHoles) {
    if (this.state === 'DEFEATED' || this.state === 'FLED') return;

    // 시간 감소
    this.remainingTime -= dt;
    if (this.remainingTime <= 0) {
      this.remainingTime = 0;
      this.state = 'FLED';
      return;
    }

    // 기절 처리
    if (this.isStunned) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
      } else {
        return; // 기절 중에는 위치 이동 및 패턴 갱신 중지
      }
    }

    // 분노 상태 체크 (체력 40% 이하 시)
    if (!this.isEnraged && this.currentHp <= this.maxHp * 0.4) {
      this.isEnraged = true;
      this.stayDuration *= 0.75; // 분노 시 더 빠르게 이동
    }

    // 약점 노출 타이머
    if (this.isWeakPointExposed) {
      this.weakPointTimer -= dt;
      if (this.weakPointTimer <= 0) {
        this.isWeakPointExposed = false;
      }
    }

    // 보스 구멍 변경 주기
    this.cycleTimer += dt;
    if (this.cycleTimer >= this.stayDuration) {
      this.cycleTimer = 0;
      this.relocate(totalHoles);
    }
  }

  relocate(totalHoles) {
    // 이전 위치와 다른 무작위 구멍 선택
    let newHole;
    do {
      newHole = Math.floor(Math.random() * totalHoles);
    } while (newHole === this.currentHoleIndex && totalHoles > 1);

    this.currentHoleIndex = newHole;

    // 마왕 두더지의 경우 분신 2개 추가 생성
    if (this.config.id === 'demon_mole') {
      const otherHoles = [];
      for (let i = 0; i < totalHoles; i++) {
        if (i !== newHole) otherHoles.push(i);
      }
      // 셔플 후 2개 선택
      otherHoles.sort(() => Math.random() - 0.5);
      const fake1 = otherHoles[0];
      const fake2 = otherHoles[1];

      this.cloneHoles = [
        { holeIndex: newHole, isReal: true },
        { holeIndex: fake1, isReal: false },
        { holeIndex: fake2, isReal: false }
      ];
    } else {
      this.cloneHoles = [{ holeIndex: newHole, isReal: true }];
    }

    // 일정 확률로 약점 노출 상태 시작
    const weakChance = this.config.id === 'iron_mole' ? 0.45 : 0.55;
    if (Math.random() < weakChance) {
      this.triggerWeakPoint();
    } else {
      this.isWeakPointExposed = false;
    }
  }

  triggerWeakPoint() {
    this.isWeakPointExposed = true;
    const baseDuration = this.config.id === 'iron_mole' ? 1.5 : 1.3;
    const mult = this.augmentManager.getWeaknessDurationMultiplier();
    this.weakPointTimer = baseDuration * mult;
  }

  hit(holeIndex, isWeakPointClick = false) {
    if (this.state === 'DEFEATED' || this.state === 'FLED') return null;

    // 마왕 두더지 분신 클릭 검증
    if (this.config.id === 'demon_mole') {
      const clone = this.cloneHoles.find((c) => c.holeIndex === holeIndex);
      if (clone && !clone.isReal) {
        // 가짜 분신 클릭! 패널티
        this.remainingTime = Math.max(0, this.remainingTime - 1.5);
        return {
          success: false,
          isFake: true,
          damage: 0,
          penaltySeconds: 1.5
        };
      }
    }

    // 약점 클릭 판정
    const hitWeakPoint = this.isWeakPointExposed || isWeakPointClick;
    const bonusDmg = this.augmentManager.getBossDamageBonus();

    let damage = 1 + bonusDmg;

    // 철갑 두더지: 방패 상태(약점 미노출)일 때 피해 1 고정
    if (this.config.id === 'iron_mole' && !hitWeakPoint) {
      damage = 1;
    }

    // 약점 타격 보너스
    if (hitWeakPoint) {
      if (this.augmentManager.hasSynergy('fatal_strike')) {
        damage *= 3; // 치명타 마스터 시너지 3배!
        this.isStunned = true;
        this.stunTimer = 1.5; // 보스 1.5초 기절
      } else {
        damage = Math.floor(damage * 1.8) + 1;
      }
    }

    this.currentHp -= damage;
    this.totalDamageTaken += damage;

    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.state = 'DEFEATED';
    }

    return {
      success: true,
      damage,
      isWeakPoint: hitWeakPoint,
      isStunned: this.isStunned,
      remainingHp: this.currentHp,
      isDefeated: this.currentHp <= 0
    };
  }
}


/* --- MODULE: src/shop.js --- */
/**
 * 인게임 코인 상점 시스템
 */

const SHOP_ITEMS = [
  {
    id: 'speed_tonic',
    name: '신속의 묘약',
    icon: '🧪',
    price: 20,
    desc: '이번 웨이브 동안 두더지가 25% 더 오래 머뭅니다.',
    apply: (game) => {
      game.shopBuffs.exposureBoost = 0.25;
    }
  },
  {
    id: 'shield_orb',
    name: '수호의 보주',
    icon: '🔮',
    price: 25,
    desc: '실수나 폭탄 피격 시 콤보가 끊기지 않는 보호막을 1개 충전합니다.',
    apply: (game) => {
      game.shields += 1;
    }
  },
  {
    id: 'gold_bait',
    name: '황금 미끼',
    icon: '✨🍯',
    price: 30,
    desc: '다음 일반 웨이브에 황금 두더지가 3마리 확정 등장합니다.',
    apply: (game) => {
      game.shopBuffs.guaranteedGoldMoles += 3;
    }
  },
  {
    id: 'time_hourglass',
    name: '시간의 모래시계',
    icon: '⌛',
    price: 35,
    desc: '현재 웨이브 또는 다음 보스전의 제한 시간을 즉시 +10초 연장합니다.',
    apply: (game) => {
      game.waveTimeLeft += 10;
      if (game.bossInstance) {
        game.bossInstance.remainingTime += 10;
      }
    }
  }
];

class ShopManager {
  constructor() {
    this.purchasedThisWave = {};
  }

  resetWave() {
    this.purchasedThisWave = {};
  }

  canBuy(itemId, coins) {
    const item = SHOP_ITEMS.find((it) => it.id === itemId);
    if (!item) return false;
    return coins >= item.price;
  }

  buy(itemId, game) {
    const item = SHOP_ITEMS.find((it) => it.id === itemId);
    if (!item) return { success: false, reason: '아이템이 존재하지 않습니다.' };

    if (game.coins < item.price) {
      return { success: false, reason: '코인이 부족합니다!' };
    }

    game.coins -= item.price;
    item.apply(game);
    this.purchasedThisWave[itemId] = (this.purchasedThisWave[itemId] || 0) + 1;

    return {
      success: true,
      item,
      remainingCoins: game.coins
    };
  }
}


/* --- MODULE: src/assets.js --- */
/**
 * 두더지 및 게임 오브젝트 벡터 그래픽 (SVG) 생성기
 * 해상도에 구애받지 않는 또렷한 2D 카툰 벡터 스타일
 */

const SVG_ASSETS = {
  // 1. 일반 두더지
  normalMole: (isHit = false) => `
    <svg viewBox="0 0 120 120" class="mole-svg normal-mole ${isHit ? 'is-hit' : ''}">
      <defs>
        <radialGradient id="normalFur" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#b47146" />
          <stop offset="70%" stop-color="#804323" />
          <stop offset="100%" stop-color="#5a2c13" />
        </radialGradient>
        <radialGradient id="snoutGrad" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stop-color="#fed7aa" />
          <stop offset="100%" stop-color="#fba86c" />
        </radialGradient>
        <filter id="moleShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>
      <g filter="url(#moleShadow)">
        <!-- 귀 -->
        <circle cx="28" cy="40" r="12" fill="#804323" />
        <circle cx="28" cy="40" r="7" fill="#fed7aa" />
        <circle cx="92" cy="40" r="12" fill="#804323" />
        <circle cx="92" cy="40" r="7" fill="#fed7aa" />

        <!-- 몸체 및 머리 -->
        <path d="M 24 110 C 20 60, 30 24, 60 24 C 90 24, 100 60, 96 110 Z" fill="url(#normalFur)" />

        <!-- 주둥이 -->
        <ellipse cx="60" cy="68" rx="26" ry="18" fill="url(#snoutGrad)" />
        <ellipse cx="60" cy="58" rx="8" ry="5" fill="#3b1d11" />

        <!-- 눈 또는 피격 시 소용돌이 눈 -->
        ${
          isHit
            ? `
          <!-- 소용돌이 눈 @_@ -->
          <path d="M 40 48 Q 44 44 48 48 Q 44 52 40 48" stroke="#3b1d11" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M 72 48 Q 76 44 80 48 Q 76 52 72 48" stroke="#3b1d11" stroke-width="3" fill="none" stroke-linecap="round"/>
          <!-- 피격 별 -->
          <polygon points="60,20 64,30 75,30 66,36 70,46 60,40 50,46 54,36 45,30 56,30" fill="#facc15" stroke="#ca8a04" stroke-width="1.5" class="hit-star"/>
        `
            : `
          <!-- 호기심 가득한 눈 -->
          <ellipse cx="44" cy="46" rx="6" ry="8" fill="#1e1b18" />
          <circle cx="42" cy="43" r="2.5" fill="#ffffff" />
          <ellipse cx="76" cy="46" rx="6" ry="8" fill="#1e1b18" />
          <circle cx="74" cy="43" r="2.5" fill="#ffffff" />
          <!-- 뺨 홍조 -->
          <circle cx="34" cy="62" r="6" fill="#f87171" opacity="0.4" />
          <circle cx="86" cy="62" r="6" fill="#f87171" opacity="0.4" />
          <!-- 앞니 -->
          <rect x="56" y="73" width="8" height="7" rx="1.5" fill="#ffffff" stroke="#3b1d11" stroke-width="1" />
        `
        }

        <!-- 앞발 -->
        <ellipse cx="32" cy="98" rx="11" ry="8" fill="url(#snoutGrad)" />
        <ellipse cx="88" cy="98" rx="11" ry="8" fill="url(#snoutGrad)" />
      </g>
    </svg>
  `,

  // 2. 황금 두더지
  goldenMole: (isHit = false) => `
    <svg viewBox="0 0 120 120" class="mole-svg golden-mole ${isHit ? 'is-hit' : ''}">
      <defs>
        <radialGradient id="goldFur" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fef08a" />
          <stop offset="50%" stop-color="#eab308" />
          <stop offset="100%" stop-color="#a16207" />
        </radialGradient>
        <radialGradient id="goldSnout" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stop-color="#fffbeb" />
          <stop offset="100%" stop-color="#fef08a" />
        </radialGradient>
        <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <g filter="url(#goldGlow)">
        <!-- 반짝이 광채 효과 -->
        <circle cx="60" cy="50" r="42" fill="#fde047" opacity="0.25" class="sparkle-pulse"/>

        <!-- 귀 -->
        <circle cx="28" cy="40" r="12" fill="#ca8a04" />
        <circle cx="28" cy="40" r="7" fill="#fef08a" />
        <circle cx="92" cy="40" r="12" fill="#ca8a04" />
        <circle cx="92" cy="40" r="7" fill="#fef08a" />

        <!-- 몸체 -->
        <path d="M 24 110 C 20 60, 30 24, 60 24 C 90 24, 100 60, 96 110 Z" fill="url(#goldFur)" />

        <!-- 머리 위 미니 왕관 / 별 -->
        <path d="M 46 22 L 52 14 L 60 20 L 68 14 L 74 22 Z" fill="#fbbf24" stroke="#d97706" stroke-width="2" />

        <!-- 주둥이 -->
        <ellipse cx="60" cy="68" rx="26" ry="18" fill="url(#goldSnout)" />
        <ellipse cx="60" cy="58" rx="8" ry="5" fill="#78350f" />

        ${
          isHit
            ? `
          <path d="M 40 48 Q 44 44 48 48 Q 44 52 40 48" stroke="#78350f" stroke-width="3" fill="none"/>
          <path d="M 72 48 Q 76 44 80 48 Q 76 52 72 48" stroke="#78350f" stroke-width="3" fill="none"/>
          <polygon points="60,10 65,22 78,22 68,30 72,42 60,34 48,42 52,30 42,22 55,22" fill="#fff" stroke="#f59e0b" stroke-width="2" class="hit-star"/>
        `
            : `
          <!-- 반짝이는 눈 -->
          <ellipse cx="44" cy="46" rx="6" ry="8" fill="#451a03" />
          <circle cx="42" cy="43" r="2.8" fill="#ffffff" />
          <ellipse cx="76" cy="46" rx="6" ry="8" fill="#451a03" />
          <circle cx="74" cy="43" r="2.8" fill="#ffffff" />
          <!-- 눈웃음 광채 -->
          <circle cx="34" cy="62" r="6" fill="#fbbf24" opacity="0.6" />
          <circle cx="86" cy="62" r="6" fill="#fbbf24" opacity="0.6" />
          <!-- 황금 앞니 -->
          <rect x="56" y="73" width="8" height="7" rx="1.5" fill="#fffbeb" stroke="#d97706" stroke-width="1.5" />
        `
        }

        <!-- 앞발 -->
        <ellipse cx="32" cy="98" rx="11" ry="8" fill="url(#goldSnout)" stroke="#d97706" stroke-width="1"/>
        <ellipse cx="88" cy="98" rx="11" ry="8" fill="url(#goldSnout)" stroke="#d97706" stroke-width="1"/>
      </g>
    </svg>
  `,

  // 3. 폭탄 두더지
  bombMole: (isHit = false) => `
    <svg viewBox="0 0 120 120" class="mole-svg bomb-mole ${isHit ? 'is-hit' : ''}">
      <defs>
        <radialGradient id="bombFur" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#475569" />
          <stop offset="70%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#0f172a" />
        </radialGradient>
      </defs>
      <g>
        <!-- 도화선 & 불꽃 -->
        <path d="M 60 24 Q 72 10 78 18" stroke="#b45309" stroke-width="4" fill="none" stroke-linecap="round"/>
        <!-- 타오르는 도화선 불꽃 -->
        <circle cx="80" cy="18" r="6" fill="#ef4444" class="fuse-spark"/>
        <circle cx="80" cy="18" r="3" fill="#facc15"/>

        <!-- 귀 -->
        <circle cx="28" cy="42" r="11" fill="#1e293b" />
        <circle cx="28" cy="42" r="6" fill="#475569" />
        <circle cx="92" cy="42" r="11" fill="#1e293b" />
        <circle cx="92" cy="42" r="6" fill="#475569" />

        <!-- 몸체 -->
        <path d="M 24 110 C 20 60, 30 26, 60 26 C 90 26, 100 60, 96 110 Z" fill="url(#bombFur)" />

        <!-- 해골 마크 또는 폭탄 밴드 -->
        <rect x="34" y="36" width="52" height="6" rx="3" fill="#dc2626" />

        <!-- 주둥이 -->
        <ellipse cx="60" cy="72" rx="24" ry="16" fill="#64748b" />
        <ellipse cx="60" cy="62" rx="7" ry="5" fill="#0f172a" />

        ${
          isHit
            ? `
          <!-- 폭발 연기 -->
          <circle cx="60" cy="50" r="35" fill="#ef4444" opacity="0.6"/>
          <text x="60" y="55" font-size="20" font-weight="900" fill="#fff" text-anchor="middle">BOOM!</text>
        `
            : `
          <!-- 험악한 앵그리 눈 -->
          <path d="M 38 42 L 52 48" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
          <ellipse cx="44" cy="49" rx="5" ry="6" fill="#ef4444" />
          <path d="M 82 42 L 68 48" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
          <ellipse cx="76" cy="49" rx="5" ry="6" fill="#ef4444" />
          <!-- 뾰족한 이빨 -->
          <polygon points="54,76 58,82 62,76" fill="#ffffff" />
          <polygon points="62,76 66,82 70,76" fill="#ffffff" />
        `
        }

        <!-- 앞발 (검은 장갑) -->
        <ellipse cx="32" cy="100" rx="10" ry="8" fill="#334155" />
        <ellipse cx="88" cy="100" rx="10" ry="8" fill="#334155" />
      </g>
    </svg>
  `,

  // 4. 보스 1: 두더지 대왕
  bossKing: (isWeakPoint = false, isHit = false) => `
    <svg viewBox="0 0 140 140" class="mole-svg boss-svg boss-king ${isWeakPoint ? 'weakpoint-active' : ''} ${isHit ? 'is-hit' : ''}">
      <defs>
        <radialGradient id="kingFur" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#b45309" />
          <stop offset="70%" stop-color="#78350f" />
          <stop offset="100%" stop-color="#451a03" />
        </radialGradient>
        <filter id="crownGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g>
        <!-- 빨간 왕실 망토 칼라 -->
        <path d="M 20 130 Q 70 85 120 130 Z" fill="#dc2626" stroke="#991b1b" stroke-width="3" />
        <path d="M 26 130 Q 70 95 114 130" stroke="#facc15" stroke-width="4" fill="none" />

        <!-- 거대한 몸체 -->
        <path d="M 18 130 C 14 60, 28 28, 70 28 C 112 28, 126 60, 122 130 Z" fill="url(#kingFur)" stroke="#451a03" stroke-width="2"/>

        <!-- 약점: 찬란하게 빛나는 거대 왕관 -->
        <g class="weakpoint-crown ${isWeakPoint ? 'weakpoint-pulsing' : ''}" filter="${isWeakPoint ? 'url(#crownGlow)' : 'none'}">
          <!-- 왕관 밑단 -->
          <rect x="42" y="24" width="56" height="10" rx="3" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>
          <!-- 왕관 뾰족 부분 -->
          <polygon points="42,24 50,8 60,20 70,4 80,20 90,8 98,24" fill="#fbbf24" stroke="#d97706" stroke-width="2"/>
          <!-- 루비 보석들 -->
          <circle cx="50" cy="12" r="3.5" fill="#ef4444" stroke="#7f1d1d" stroke-width="1"/>
          <circle cx="70" cy="9" r="4.5" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.5" class="ruby-center"/>
          <circle cx="90" cy="12" r="3.5" fill="#ef4444" stroke="#7f1d1d" stroke-width="1"/>
          ${
            isWeakPoint
              ? `
            <!-- 약점 타겟 조준선 -->
            <circle cx="70" cy="18" r="24" stroke="#ef4444" stroke-width="2.5" fill="none" stroke-dasharray="4,4" class="target-crosshair"/>
            <text x="70" y="4" font-size="11" font-weight="900" fill="#facc15" text-anchor="middle" class="weak-label">WEAK POINT!</text>
          `
              : ''
          }
        </g>

        <!-- 위엄 넘치는 수염 주둥이 -->
        <ellipse cx="70" cy="80" rx="30" ry="20" fill="#fed7aa" />
        <ellipse cx="70" cy="68" rx="10" ry="6" fill="#3b1d11" />

        <!-- 왕의 근엄한 눈과 눈썹 -->
        <path d="M 46 50 Q 56 46 62 52" stroke="#451a03" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="54" cy="56" rx="6" ry="7" fill="#1e1b18" />
        <circle cx="52" cy="54" r="2" fill="#fff" />

        <path d="M 94 50 Q 84 46 78 52" stroke="#451a03" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="86" cy="56" rx="6" ry="7" fill="#1e1b18" />
        <circle cx="84" cy="54" r="2" fill="#fff" />

        <!-- 풍성한 흰 콧수염 -->
        <path d="M 50 78 Q 62 88 70 76 Q 78 88 90 78 Q 80 94 70 84 Q 60 94 50 78 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>

        <!-- 거대한 왕의 손발 -->
        <ellipse cx="28" cy="115" rx="13" ry="10" fill="#fed7aa" stroke="#78350f" stroke-width="1.5"/>
        <ellipse cx="112" cy="115" rx="13" ry="10" fill="#fed7aa" stroke="#78350f" stroke-width="1.5"/>
      </g>
    </svg>
  `,

  // 5. 보스 2: 철갑 두더지
  bossIron: (isWeakPoint = false, isHit = false) => `
    <svg viewBox="0 0 140 140" class="mole-svg boss-svg boss-iron ${isWeakPoint ? 'weakpoint-active' : ''} ${isHit ? 'is-hit' : ''}">
      <defs>
        <linearGradient id="ironPlate" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#94a3b8" />
          <stop offset="50%" stop-color="#475569" />
          <stop offset="100%" stop-color="#334155" />
        </linearGradient>
      </defs>
      <g>
        <!-- 강철 투구 본체 -->
        <path d="M 22 130 C 18 55, 30 20, 70 20 C 110 20, 122 55, 118 130 Z" fill="url(#ironPlate)" stroke="#1e293b" stroke-width="3"/>

        <!-- 투구 뿔/장식 -->
        <polygon points="70,6 64,22 76,22" fill="#cbd5e1" stroke="#334155" stroke-width="2"/>

        ${
          isWeakPoint
            ? `
          <!-- 열린 바이저 (약점 노출 상태!) -->
          <rect x="36" y="44" width="68" height="32" rx="4" fill="#0f172a" stroke="#ef4444" stroke-width="3"/>
          <!-- 당황한 두더지 얼굴 노출 -->
          <circle cx="52" cy="60" r="7" fill="#fed7aa"/>
          <circle cx="52" cy="60" r="3.5" fill="#000"/>
          <circle cx="88" cy="60" r="7" fill="#fed7aa"/>
          <circle cx="88" cy="60" r="3.5" fill="#000"/>
          <ellipse cx="70" cy="68" rx="8" ry="5" fill="#fba86c"/>
          <!-- 타겟 조준선 -->
          <circle cx="70" cy="60" r="28" stroke="#ef4444" stroke-width="2.5" fill="none" stroke-dasharray="5,3" class="target-crosshair"/>
          <text x="70" y="38" font-size="11" font-weight="900" fill="#ef4444" text-anchor="middle" class="weak-label">OPEN VISOR!</text>
        `
            : `
          <!-- 닫힌 단단한 철갑 바이저 (피해 감소 방어 상태) -->
          <rect x="34" y="44" width="72" height="28" rx="4" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
          <line x1="42" y1="52" x2="98" y2="52" stroke="#0ea5e9" stroke-width="3" stroke-linecap="round"/>
          <line x1="42" y1="62" x2="98" y2="62" stroke="#0ea5e9" stroke-width="3" stroke-linecap="round"/>
          <!-- 리벳 징 -->
          <circle cx="38" cy="48" r="2" fill="#cbd5e1"/>
          <circle cx="102" cy="48" r="2" fill="#cbd5e1"/>
          <circle cx="38" cy="68" r="2" fill="#cbd5e1"/>
          <circle cx="102" cy="68" r="2" fill="#cbd5e1"/>
        `
        }

        <!-- 거대한 강철 방패 -->
        <path d="M 26 95 L 46 88 L 46 128 L 26 120 Z" fill="#64748b" stroke="#334155" stroke-width="2"/>
        <path d="M 114 95 L 94 88 L 94 128 L 114 120 Z" fill="#64748b" stroke="#334155" stroke-width="2"/>
      </g>
    </svg>
  `,

  // 6. 보스 3: 마왕 두더지
  bossDemon: (isFake = false, isWeakPoint = false, isHit = false) => `
    <svg viewBox="0 0 140 140" class="mole-svg boss-svg boss-demon ${isFake ? 'is-clone-fake' : ''} ${isWeakPoint ? 'weakpoint-active' : ''} ${isHit ? 'is-hit' : ''}">
      <defs>
        <radialGradient id="demonFur" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="${isFake ? '#581c87' : '#7e22ce'}" />
          <stop offset="70%" stop-color="${isFake ? '#3b0764' : '#581c87'}" />
          <stop offset="100%" stop-color="#1e1b4b" />
        </radialGradient>
        <filter id="demonAura" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="${isFake ? '2' : '6'}" result="glow"/>
          <feMerge>
            <feMergeNode in="glow"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <g filter="${isFake ? 'none' : 'url(#demonAura)'}">
        <!-- 악마의 불길 오라 -->
        ${
          !isFake
            ? `
          <path d="M 20 60 Q 30 10 70 14 Q 110 10 120 60 Z" fill="#a855f7" opacity="0.3" class="flame-aura"/>
        `
            : ''
        }

        <!-- 거대한 악마의 뿔 -->
        <path d="M 38 40 Q 18 20 22 4 Q 38 14 46 32 Z" fill="#e11d48" stroke="#881337" stroke-width="2"/>
        <path d="M 102 40 Q 122 20 118 4 Q 102 14 94 32 Z" fill="#e11d48" stroke="#881337" stroke-width="2"/>

        <!-- 몸체 -->
        <path d="M 22 130 C 16 65, 30 26, 70 26 C 110 26, 124 65, 118 130 Z" fill="url(#demonFur)" stroke="#3b0764" stroke-width="2"/>

        <!-- 약점: 혼돈의 마력 핵 -->
        ${
          isWeakPoint && !isFake
            ? `
          <circle cx="70" cy="28" r="10" fill="#f43f5e" stroke="#ffe4e6" stroke-width="2" class="chaos-core"/>
          <circle cx="70" cy="28" r="22" stroke="#f43f5e" stroke-width="2" fill="none" stroke-dasharray="4,4" class="target-crosshair"/>
          <text x="70" y="10" font-size="11" font-weight="900" fill="#f43f5e" text-anchor="middle" class="weak-label">STRIKE CORE!</text>
        `
            : ''
        }

        <!-- 붉고 어두운 주둥이 -->
        <ellipse cx="70" cy="80" rx="28" ry="18" fill="#4c0519" />
        <ellipse cx="70" cy="68" rx="9" ry="5" fill="#000000" />

        <!-- 불타는 황금/적색 눈 -->
        <polygon points="46,50 62,56 48,60" fill="${isFake ? '#9333ea' : '#facc15'}" />
        <polygon points="94,50 78,56 92,60" fill="${isFake ? '#9333ea' : '#facc15'}" />

        <!-- 마왕의 송곳니 -->
        <polygon points="56,84 60,94 64,84" fill="#ffffff" />
        <polygon points="76,84 80,94 84,84" fill="#ffffff" />

        <!-- 발톱 -->
        <ellipse cx="28" cy="115" rx="12" ry="9" fill="#881337" />
        <ellipse cx="112" cy="115" rx="12" ry="9" fill="#881337" />
      </g>
    </svg>
  `,

  // 7. 구멍(Hole) 3D 배경 및 마운드
  holeBack: () => `
    <svg viewBox="0 0 140 70" class="hole-back-svg" preserveAspectRatio="none">
      <defs>
        <radialGradient id="holeDepth" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0a0503" />
          <stop offset="70%" stop-color="#1c0f09" />
          <stop offset="100%" stop-color="#3b1d11" />
        </radialGradient>
      </defs>
      <ellipse cx="70" cy="35" rx="66" ry="32" fill="url(#holeDepth)" />
    </svg>
  `,

  holeFrontMound: () => `
    <svg viewBox="0 0 150 55" class="hole-front-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="dirtMound" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#6c3b1e" />
          <stop offset="40%" stop-color="#542e17" />
          <stop offset="100%" stop-color="#3b1d11" />
        </linearGradient>
      </defs>
      <!-- 흙더미 -->
      <path d="M 5 50 Q 75 0 145 50 Q 75 42 5 50 Z" fill="url(#dirtMound)" />
      <!-- 잔디 풀잎 디테일 -->
      <path d="M 15 48 L 22 36 L 26 48 L 32 34 L 38 49" stroke="#4ade80" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path d="M 112 49 L 118 35 L 124 48 L 130 38 L 136 49" stroke="#4ade80" stroke-width="3" stroke-linecap="round" fill="none"/>
      <!-- 작은 조약돌 -->
      <circle cx="50" cy="44" r="3" fill="#a8a29e" />
      <circle cx="95" cy="45" r="2.5" fill="#78716c" />
    </svg>
  `,

  // 8. 망치 커서 (Mallet)
  malletCursor: () => `
    <svg viewBox="0 0 100 100" class="mallet-cursor-svg">
      <defs>
        <linearGradient id="hammerHead" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#d97706" />
          <stop offset="50%" stop-color="#92400e" />
          <stop offset="100%" stop-color="#451a03" />
        </linearGradient>
        <linearGradient id="metalRim" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#e2e8f0" />
          <stop offset="100%" stop-color="#64748b" />
        </linearGradient>
      </defs>
      <!-- 나무 자루 -->
      <rect x="52" y="32" width="12" height="60" rx="5" fill="#fde68a" stroke="#b45309" stroke-width="2" transform="rotate(-35 58 62)"/>
      <!-- 망치 헤드 (우드 블록) -->
      <g transform="rotate(-35 45 35)">
        <rect x="25" y="15" width="40" height="30" rx="4" fill="url(#hammerHead)" stroke="#451a03" stroke-width="2.5"/>
        <!-- 쇠테 테두리 -->
        <rect x="22" y="18" width="6" height="24" rx="2" fill="url(#metalRim)" stroke="#334155" stroke-width="1.5"/>
        <rect x="62" y="18" width="6" height="24" rx="2" fill="url(#metalRim)" stroke="#334155" stroke-width="1.5"/>
        <!-- 황금 별 장식 -->
        <polygon points="45,24 47,28 52,28 48,31 50,36 45,33 40,36 42,31 38,28 43,28" fill="#fbbf24"/>
      </g>
    </svg>
  `
};


/* --- MODULE: src/game.js --- */
/**
 * 핵심 게임 엔진 (Core Game Loop & State Machine)
 */






const GAME_STATES = {
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

class GameEngine {
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


/* --- MODULE: src/app.js --- */
/**
 * 두더지 대작전! UI 조율자 및 인터랙션 핸들러 (Application Coordinator)
 */







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


})();
