/**
 * 인게임 코인 상점 시스템
 */

export const SHOP_ITEMS = [
  {
    id: 'speed_tonic',
    name: '신속의 묘약',
    icon: '🧪',
    price: 20,
    desc: '이번 웨이브 동안 두더지가 25% 더 오래 머뭅니다.',
    apply: (game) => {
      game.shopBuffs.exposureBoost = 0.25;
    }
  },
  {
    id: 'shield_orb',
    name: '수호의 보주',
    icon: '🔮',
    price: 25,
    desc: '실수나 폭탄 피격 시 콤보가 끊기지 않는 보호막을 1개 충전합니다.',
    apply: (game) => {
      game.shields += 1;
    }
  },
  {
    id: 'gold_bait',
    name: '황금 미끼',
    icon: '✨🍯',
    price: 30,
    desc: '다음 일반 웨이브에 황금 두더지가 3마리 확정 등장합니다.',
    apply: (game) => {
      game.shopBuffs.guaranteedGoldMoles += 3;
    }
  },
  {
    id: 'time_hourglass',
    name: '시간의 모래시계',
    icon: '⌛',
    price: 35,
    desc: '현재 웨이브 또는 다음 보스전의 제한 시간을 즉시 +10초 연장합니다.',
    apply: (game) => {
      game.waveTimeLeft += 10;
      if (game.bossInstance) {
        game.bossInstance.remainingTime += 10;
      }
    }
  }
];

export class ShopManager {
  constructor() {
    this.purchasedThisWave = {};
  }

  resetWave() {
    this.purchasedThisWave = {};
  }

  canBuy(itemId, coins) {
    const item = SHOP_ITEMS.find((it) => it.id === itemId);
    if (!item) return false;
    return coins >= item.price;
  }

  buy(itemId, game) {
    const item = SHOP_ITEMS.find((it) => it.id === itemId);
    if (!item) return { success: false, reason: '아이템이 존재하지 않습니다.' };

    if (game.coins < item.price) {
      return { success: false, reason: '코인이 부족합니다!' };
    }

    game.coins -= item.price;
    item.apply(game);
    this.purchasedThisWave[itemId] = (this.purchasedThisWave[itemId] || 0) + 1;

    return {
      success: true,
      item,
      remainingCoins: game.coins
    };
  }
}
