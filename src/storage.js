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

export const ACHIEVEMENTS_DEF = [
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

export const storage = new StorageManager();
