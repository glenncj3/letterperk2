import { IBonusStrategy, BonusContext, BonusResult } from './IBonusStrategy';
import { BLUE_BONUS_VALUE } from '../../constants/gameConstants';

/**
 * Strategy for blue bonus: +5 points if tile is at first or last position.
 */
export class BlueBonusStrategy implements IBonusStrategy {
  readonly type = 'blue' as const;

  calculate(context: BonusContext): BonusResult | null {
    const isFirstOrLast =
      context.tileIndex === 0 || context.tileIndex === context.selectedTiles.length - 1;

    if (isFirstOrLast) {
      return {
        applied: true,
        value: BLUE_BONUS_VALUE,
        isMultiplicative: false,
      };
    }
    return null;
  }
}

