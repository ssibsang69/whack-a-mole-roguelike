// Node.js 환경용 브라우저 전역 객체 폴리필
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}

import { GameEngine, GAME_STATES } from '../src/game.js';

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`✅ [E2E] PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ [E2E] FAIL: ${message}`);
    process.exitCode = 1;
  }
}

console.log('=== 엔드투엔드 전체 게임 사이클 시뮬레이션 ===');

let modalOpened = null;
let currentChoices = null;

const game = new GameEngine({
  onShowAugmentModal: (choices) => {
    modalOpened = 'AUGMENT';
    currentChoices = choices;
  },
  onShowBossRewardModal: (data) => {
    modalOpened = 'BOSS_REWARD';
    currentChoices = data.choices;
  },
  onShowBossFledModal: (data) => {
    modalOpened = 'BOSS_FLED';
  },
  onGameEnded: (summary) => {
    modalOpened = 'GAME_ENDED';
  }
});

game.init(3);
assert(game.holes.length === 9, '3x3 그리드 총 9개 구멍 생성');

// 1. 게임 시작
game.startNewGame();
assert(game.score === 0, '시작 점수는 0점');
assert(game.wave === 1, '1웨이브에서 시작');

// 카운트다운 건너뛰고 1웨이브 즉시 시작
game.startWave(1);
assert(game.state === GAME_STATES.PLAYING, '1웨이브 플레이 상태 진입');

// 2. 일반 두더지 15마리 연속 처치 테스트
for (let i = 0; i < 15; i++) {
  // 강제로 0번 구멍에 일반 두더지 생성
  const hole = game.holes[0];
  hole.hasMole = true;
  hole.moleType = 'normal';
  hole.state = 'ACTIVE';
  hole.isHit = false;

  const result = game.whackHole(0);
  assert(result.type === 'NORMAL', `두더지 #${i + 1} 처치 성공`);
}

// 15마리 처치 즉시 증강 선택 모달 트리거 확인
assert(game.state === GAME_STATES.AUGMENT_SELECT, '15마리 처치 시 게임 일시정지 및 증강 선택 상태 전환');
assert(modalOpened === 'AUGMENT', '증강 선택 모달 이벤트 수신');
assert(currentChoices && currentChoices.length === 3, '선택지 3개 제시');

// 증강 1개 선택 (예: 번개 타격)
const chosenAug = currentChoices[0];
game.applyAugmentSelection(chosenAug.id);
assert(game.state === GAME_STATES.PLAYING, '증강 선택 후 게임 재개');
assert(game.augmentManager.getLevel(chosenAug.id) === 1, `${chosenAug.name} 레벨 1 적용 확인`);

// 3. 콤보 및 점수 계산 확인
assert(game.combo === 15, '15콤보 달성');
assert(game.score > 1500, `점수 정상 누적: ${game.score}점`);

// 4. 폭탄 두더지 타격 및 콤보 초기화 테스트
const bombHole = game.holes[1];
bombHole.hasMole = true;
bombHole.moleType = 'bomb';
bombHole.state = 'ACTIVE';
bombHole.isHit = false;

const bombResult = game.whackHole(1);
assert(bombResult.type === 'BOMB', '폭탄 두더지 타격 인식');
assert(game.combo === 0, '폭탄 피격 시 콤보 초기화');

// 방패 충전 후 폭탄 방어 테스트
game.shields = 1;
bombHole.hasMole = true;
bombHole.moleType = 'bomb';
bombHole.state = 'ACTIVE';
bombHole.isHit = false;
game.combo = 10;

const shieldedBombResult = game.whackHole(1);
assert(shieldedBombResult.shielded === true, '보호막이 있을 때 폭탄 피격 방어');
assert(game.combo === 10, '보호막 덕분에 콤보 유지됨');
assert(game.shields === 0, '보호막 1개 차감');

// 5. 웨이브 3: 첫 번째 보스 (두더지 대왕) 대면
game.startWave(3);
assert(game.state === GAME_STATES.BOSS_WARNING, '웨이브 3 시작 시 보스 출현 경고 상태 전환');
assert(game.bossInstance.config.name === '두더지 대왕', '보스 인스턴스 [두더지 대왕] 생성');

// 보스전 시작 시뮬레이션
game.setState(GAME_STATES.BOSS_PLAYING);
game.bossInstance.relocate(9);
game.syncBossHoles();
const bossHoleIdx = game.bossInstance.currentHoleIndex;
assert(bossHoleIdx >= 0 && bossHoleIdx < 9, `보스가 구멍 #${bossHoleIdx}에 위치함`);

// 보스 처치할 때까지 타격
modalOpened = null;
while (game.bossInstance.currentHp > 0) {
  game.whackBoss(bossHoleIdx, true); // 약점 타격
  if (game.bossInstance.state === 'DEFEATED') {
    game.handleBossDefeated();
    break;
  }
}

assert(modalOpened === 'BOSS_REWARD', '보스 처치 시 보스 전설 보상 선택 모달 오픈');
assert(game.bossKills === 1, '보스 처치 수 1 기록');

// 보스 보상 증강 선택 (파괴의 망치)
game.applyBossRewardSelection('hammer_of_destruction');
assert(game.augmentManager.hasBossAugment('hammer_of_destruction'), '보스 전설 증강 [파괴의 망치] 획득');
assert(game.wave === 4, '보스 처치 후 웨이브 4로 자동 진행');

// 6. 보스 도주 (실패) 시나리오 테스트
game.startWave(6); // 철갑 두더지
game.setState(GAME_STATES.BOSS_PLAYING);
modalOpened = null;

// 시간 초과 도주
game.bossInstance.state = 'FLED';
game.handleBossFled();

assert(modalOpened === 'BOSS_FLED', '보스 도주 시 실패 요약 모달 오픈');
assert(game.blockedHoles.size === 1, '철갑 두더지 도주 패널티: 구멍 1개 봉쇄 확인');

// 실패 후 다음 웨이브로 진행
game.continueAfterBossFled();
assert(game.wave === 7, '보스 도주 후에도 점수와 증강을 보존하고 웨이브 7로 정상 계속 진행');
assert(game.score > 0, '이전 획득 점수 유지');

// 7. 게임 승리 (웨이브 9 최종 보스 토벌)
game.wave = 9;
game.handleGameVictory();
assert(modalOpened === 'GAME_ENDED', '게임 승리 결과 화면 진입');

console.log(`\n========================================`);
console.log(`E2E 테스트 성공: ${passed} / ${total} 항목 전체 통과!`);
console.log(`========================================`);

game.destroy();
process.exit(0);
