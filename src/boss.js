/**
 * 보스 시스템: 두더지 대왕, 철갑 두더지, 마왕 두더지
 */

export const BOSS_TYPES = {
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

export class BossInstance {
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
