import { IBonusStrategy, BonusContext, BonusResult } from './IBonusStrategy';
import { GREEN_BONUS_VALUE } from '../../constants/gameConstants';

/**
 * Strategy for green bonus: +2 points per green tile.
 */
export class GreenBonusStrategy implements IBonusStrategy {
  readonly type = 'green' as const;

  calculate(context: BonusContext): BonusResult | null {
    // Green bonus always applies if tile has green bonus
    return {
      applied: true,
      value: GREEN_BONUS_VALUE,
      isMultiplicative: false,
    };
  }
}

