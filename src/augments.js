/**
 * 증강(Augments) 및 시너지(Synergies) 시스템 정의
 */

export const AUGMENTS_DATA = {
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

export const BOSS_AUGMENTS_DATA = {
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

export const SYNERGIES = [
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

export class AugmentManager {
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
