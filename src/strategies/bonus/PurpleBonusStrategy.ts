import { IBonusStrategy, BonusContext, BonusResult } from './IBonusStrategy';
import { PURPLE_BONUS_MIN_LENGTH } from '../../constants/gameConstants';

/**
 * Strategy for purple bonus: doubles the final score if word length >= PURPLE_BONUS_MIN_LENGTH.
 * This is a multiplicative bonus applied after all additive bonuses.
 */
export class PurpleBonusStrategy implements IBonusStrategy {
  readonly type = 'purple' as const;

  calculate(context: BonusContext): BonusResult | null {
    if (context.word.length >= PURPLE_BONUS_MIN_LENGTH) {
      // Purple bonus is multiplicative and applied to the current score
      return {
        applied: true,
        value: context.currentScore, // The value to add to bonuses array (for display)
        isMultiplicative: true,
      };
    }
    return null;
  }
}

