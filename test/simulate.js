/**
 * 헤드리스 게임 엔진 시뮬레이션 및 로직 검증 스크립트
 */

import { GameEngine, GAME_STATES } from '../src/game.js';
import { AugmentManager, AUGMENTS_DATA, SYNERGIES } from '../src/augments.js';
import { BossInstance, BOSS_TYPES } from '../src/boss.js';
import { storage, ACHIEVEMENTS_DEF } from '../src/storage.js';
import { ShopManager, SHOP_ITEMS } from '../src/shop.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

console.log('--- 1. 증강 및 시너지 시스템 검증 ---');
const augMgr = new AugmentManager();
assert(augMgr.getLevel('golden_hammer') === 0, '초기 증강 레벨은 0');

// 무작위 증강 3개 뽑기
const choices1 = augMgr.getRandomSelection(3);
assert(choices1.length === 3, '증강 선택지 3개 제공');
assert(new Set(choices1.map(c => c.id)).size === 3, '선택지는 서로 중복되지 않음');

// 레벨업 테스트
augMgr.selectAugment('golden_hammer');
assert(augMgr.getLevel('golden_hammer') === 1, '황금 망치 1단계 적용');
assert(augMgr.getScoreMultiplier() === 1.5, '황금 망치 1단계 점수 배율 1.5x');

augMgr.selectAugment('golden_hammer');
assert(augMgr.getLevel('golden_hammer') === 2, '황금 망치 2단계 적용');
assert(augMgr.getScoreMultiplier() === 2.0, '황금 망치 2단계 점수 배율 2.0x');

augMgr.selectAugment('golden_hammer');
assert(augMgr.getLevel('golden_hammer') === 3, '황금 망치 3단계 (최대 단계) 도달');

// 3단계 증강은 선택지에서 제외되는지 확인
for (let i = 0; i < 20; i++) {
  const choices = augMgr.getRandomSelection(3);
  const hasMax = choices.some(c => c.id === 'golden_hammer');
  assert(!hasMax, '최대 레벨 도달한 황금 망치는 선택 목록에서 제외됨');
  if (hasMax) break;
}

// 시너지 활성화 테스트 (황금 망치 + 황금 자석 -> 황금 만개)
assert(!augMgr.hasSynergy('golden_bloom'), '황금 자석 획득 전에는 시너지 미발동');
augMgr.selectAugment('gold_magnet');
assert(augMgr.hasSynergy('golden_bloom'), '황금 망치 + 황금 자석 조합 시 [황금 만개] 시너지 자동 활성화');

console.log('\n--- 2. 보스 시스템 검증 ---');
const kingBoss = new BossInstance('mole_king', augMgr);
assert(kingBoss.config.name === '두더지 대왕', '보스 1은 두더지 대왕');
assert(kingBoss.maxHp === 16, '두더지 대왕 초기 HP 16');
assert(kingBoss.timeLimit === 30, '기본 제한 시간 30초');

// 약점 타격 테스트
kingBoss.isWeakPointExposed = true;
const hitResult1 = kingBoss.hit(kingBoss.currentHoleIndex, true);
assert(hitResult1.success === true, '보스 타격 성공');
assert(hitResult1.isWeakPoint === true, '약점 타격 인식');
assert(hitResult1.damage > 1, `약점 타격 시 추가 피해 적용 (피해량: ${hitResult1.damage})`);

// 보스 도주 타임아웃 테스트
kingBoss.update(35, 9);
assert(kingBoss.state === 'FLED', '30초 초과 시 보스 도주 상태 전환');

// 보스 2 (철갑 두더지) 방어력 및 약점 노출 검증
const ironBoss = new BossInstance('iron_mole', augMgr);
ironBoss.isWeakPointExposed = false;
const armoredHit = ironBoss.hit(0, false);
assert(armoredHit.damage === 1, '철갑 두더지 방패 상태일 때는 피해 1로 감소');

ironBoss.isWeakPointExposed = true;
const weakIronHit = ironBoss.hit(0, true);
assert(weakIronHit.damage > 1, '철갑 두더지 약점 노출 시 정상 피해 적용');

console.log('\n--- 3. 상점 시스템 검증 ---');
const shopMgr = new ShopManager();
const mockGame = {
  coins: 50,
  waveTimeLeft: 20,
  shields: 0,
  shopBuffs: { exposureBoost: 0, guaranteedGoldMoles: 0 }
};

const buyShield = shopMgr.buy('shield_orb', mockGame);
assert(buyShield.success === true, '코인이 충분할 때 방패 아이템 구매 성공');
assert(mockGame.coins === 25, '구매 후 코인 정확히 25 차감 (50 - 25 = 25)');
assert(mockGame.shields === 1, '방패 1개 충전 완료');

const failBuy = shopMgr.buy('time_hourglass', mockGame); // price 35, coins 25
assert(failBuy.success === false, '코인이 부족할 때 구매 거절');

console.log('\n--- 4. 업적 및 스토리지 검증 ---');
const unlocked = storage.checkAchievements({
  bossKilled: 'mole_king',
  hasMaxAugment: true,
  hasSynergy: true
});
assert(storage.achievements['boss_king_clear'], '두더지 대왕 처치 업적 해금');
assert(storage.achievements['augment_max'], '증강 3단계 달성 업적 해금');
assert(storage.achievements['synergy_master'], '증강 시너지 활성화 업적 해금');

console.log(`\n========================================`);
console.log(`테스트 완료: ${passedTests} / ${totalTests} 항목 통과!`);
console.log(`========================================`);
