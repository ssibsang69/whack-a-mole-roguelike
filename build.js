const fs = require('fs');
const path = require('path');

const files = [
  'src/audio.js',
  'src/storage.js',
  'src/augments.js',
  'src/boss.js',
  'src/shop.js',
  'src/assets.js',
  'src/game.js',
  'src/app.js'
];

let bundleContent = '/* 두더지 대작전! 단일 번들 스크립트 */\n(function() {\n"use strict";\n\n';

for (const file of files) {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // import 문 제거
  content = content.replace(/^import\s+.*?;?\s*$/gm, '');

  // export const / export class / export function / export let / export default 변환
  content = content.replace(/^export\s+(const|class|function|let|var)\s+/gm, '$1 ');
  content = content.replace(/^export\s+default\s+/gm, '');
  content = content.replace(/^export\s+\{.*?\};?\s*$/gm, '');

  bundleContent += `\n/* --- MODULE: ${file} --- */\n` + content + '\n';
}

bundleContent += '\n})();\n';

fs.writeFileSync(path.join(__dirname, 'bundle.js'), bundleContent, 'utf8');
console.log('✅ bundle.js 생성이 완료되었습니다! (크기:', (bundleContent.length / 1024).toFixed(1), 'KB)');
