const fs = require('fs');
const path = require('path');

// 간단한 가상 DOM 환경 구성
const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// HTML에서 필요한 모든 id 추출 확인
const requiredIds = [
  'screen-start', 'screen-game', 'screen-result',
  'btn-play-game', 'btn-restart', 'btn-home',
  'btn-open-shop', 'btn-close-shop',
  'btn-close-achievements', 'btn-close-guide', 'btn-close-settings',
  'btn-toggle-sfx', 'btn-toggle-bgm', 'btn-boss-fled-continue',
  'modal-augment', 'modal-boss-reward', 'modal-boss-fled',
  'modal-shop', 'modal-achievements', 'modal-guide', 'modal-settings',
  'hud-score', 'hud-coins', 'hud-wave', 'hud-time',
  'hud-combo-count', 'hud-combo-bar', 'hud-combo-multiplier',
  'hud-shields', 'hud-augment-progress',
  'boss-hud', 'boss-name', 'boss-hp-fill', 'boss-hp-text', 'boss-timer', 'boss-status-text',
  'game-board', 'custom-hammer', 'floating-container',
  'active-augments-list', 'active-synergies-list',
  'screen-alert', 'countdown-display',
  'start-high-score', 'start-max-combo', 'start-total-kills',
  'shop-current-coins', 'shop-items-list',
  'achievements-counter', 'achievements-list',
  'setting-sfx', 'setting-bgm', 'setting-key-guide', 'setting-field-size', 'btn-reset-data',
  'result-title', 'result-score', 'result-kills', 'result-max-combo',
  'result-accuracy', 'result-coins', 'result-boss-kills',
  'result-is-high-score', 'result-augments-summary',
  'augment-cards-container', 'boss-reward-title', 'boss-reward-bonus',
  'boss-reward-cards-container', 'boss-fled-title', 'boss-fled-stats'
];

let missingIds = [];
for (const id of requiredIds) {
  if (!htmlContent.includes(`id="${id}"`)) {
    missingIds.push(id);
  }
}

if (missingIds.length === 0) {
  console.log(`✅ [DOM TEST] index.html 내 필수 ID ${requiredIds.length}개 모두 완벽 일치! 누락된 요소 없음.`);
} else {
  console.error(`❌ [DOM TEST] 누락된 ID 발견:`, missingIds);
  process.exitCode = 1;
}

// script src 확인
if (htmlContent.includes('src="bundle.js"')) {
  console.log('✅ [DOM TEST] bundle.js가 index.html에 정상적으로 링크되어 있습니다.');
} else {
  console.error('❌ [DOM TEST] bundle.js 링크 누락!');
  process.exitCode = 1;
}
