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

  // export 변환
  content = content.replace(/^export\s+(const|class|function|let|var)\s+/gm, '$1 ');
  content = content.replace(/^export\s+default\s+/gm, '');
  content = content.replace(/^export\s+\{.*?\};?\s*$/gm, '');

  bundleContent += `\n/* --- MODULE: ${file} --- */\n` + content + '\n';
}

bundleContent += '\n})();\n';

// 1. 루트에 bundle.js 생성
fs.writeFileSync(path.join(__dirname, 'bundle.js'), bundleContent, 'utf8');

// 2. Vercel 및 정적 배포용 public 디렉터리 구성
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// bundle.js 복사
fs.writeFileSync(path.join(publicDir, 'bundle.js'), bundleContent, 'utf8');

// index.html 복사
fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(publicDir, 'index.html'));

// styles 디렉터리 복사
const publicStylesDir = path.join(publicDir, 'styles');
if (!fs.existsSync(publicStylesDir)) {
  fs.mkdirSync(publicStylesDir, { recursive: true });
}

const stylesDir = path.join(__dirname, 'styles');
const styleFiles = fs.readdirSync(stylesDir);
for (const sf of styleFiles) {
  fs.copyFileSync(path.join(stylesDir, sf), path.join(publicStylesDir, sf));
}

console.log('✅ 빌드 완료: public/ 디렉터리에 배포 에셋이 완벽하게 준비되었습니다! (bundle.js:', (bundleContent.length / 1024).toFixed(1), 'KB)');
