import { Tile, BonusType } from '../../types/game';

/**
 * Context information for bonus calculation.
 */
export interface BonusContext {
  word: string;
  selectedTiles: Tile[];
  tileIndex: number;
  baseScore: number;
  currentScore: number;
}

/**
 * Result of applying a bonus strategy.
 */
export interface BonusResult {
  /** Whether this bonus was applied */
  applied: boolean;
  /** The bonus value (if additive) or multiplier (if multiplicative) */
  value: number;
  /** Whether this is a multiplicative bonus (like purple) */
  isMultiplicative?: boolean;
}

/**
 * Strategy interface for calculating bonuses.
 * Each bonus type implements this interface to define its calculation logic.
 */
export interface IBonusStrategy {
  /**
   * The bonus type this strategy handles.
   */
  readonly type: BonusType;

  /**
   * Calculates the bonus for a specific tile.
   * 
   * @param context - Context information about the word and tiles
   * @returns Bonus result, or null if bonus doesn't apply
   */
  calculate(context: BonusContext): BonusResult | null;
}

