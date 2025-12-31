import { IBonusStrategy, BonusContext, BonusResult } from './IBonusStrategy';

/**
 * Strategy for yellow bonus: points equal to the square of yellow tiles used.
 * This is calculated once for all yellow tiles combined.
 */
export class YellowBonusStrategy implements IBonusStrategy {
  readonly type = 'yellow' as const;

  calculate(context: BonusContext): BonusResult | null {
    // Yellow bonus is calculated once for all yellow tiles
    // Only calculate on the first yellow tile encountered
    const yellowCount = context.selectedTiles.filter(t => t.bonusType === 'yellow').length;
    
    if (yellowCount === 0) {
      return null;
    }

    // Only return result for the first yellow tile
    const isFirstYellow = context.selectedTiles[context.tileIndex]?.bonusType === 'yellow' &&
      context.selectedTiles.slice(0, context.tileIndex).every(t => t.bonusType !== 'yellow');

    if (!isFirstYellow) {
      return null;
    }

    return {
      applied: true,
      value: yellowCount * yellowCount,
      isMultiplicative: false,
    };
  }
}

