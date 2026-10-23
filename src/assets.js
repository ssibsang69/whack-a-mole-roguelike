/**
 * 두더지 및 게임 오브젝트 벡터 그래픽 (SVG) 생성기
 * 해상도에 구애받지 않는 또렷한 2D 카툰 벡터 스타일
 */

export const SVG_ASSETS = {
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
