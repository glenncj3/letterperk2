import { IBonusStrategy, BonusContext, BonusResult } from './IBonusStrategy';

/**
 * Strategy for black bonus: grants +1 trade (handled separately in game logic).
 * This strategy returns null as black bonus doesn't affect score calculation.
 */
export class BlackBonusStrategy implements IBonusStrategy {
  readonly type = 'black' as const;

  calculate(context: BonusContext): BonusResult | null {
    // Black bonus doesn't affect score, it grants trades
    // This is handled separately in the game reducer
    return null;
  }
}

