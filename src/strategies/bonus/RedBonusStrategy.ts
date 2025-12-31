import { IBonusStrategy, BonusContext, BonusResult } from './IBonusStrategy';
import { RED_BONUS_MAX_LENGTH, RED_BONUS_VALUE } from '../../constants/gameConstants';

/**
 * Strategy for red bonus: +10 points if word length <= RED_BONUS_MAX_LENGTH.
 */
export class RedBonusStrategy implements IBonusStrategy {
  readonly type = 'red' as const;

  calculate(context: BonusContext): BonusResult | null {
    if (context.word.length <= RED_BONUS_MAX_LENGTH) {
      return {
        applied: true,
        value: RED_BONUS_VALUE,
        isMultiplicative: false,
      };
    }
    return null;
  }
}

