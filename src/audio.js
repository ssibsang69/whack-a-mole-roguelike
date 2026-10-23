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

export const sound = new SoundEngine();
