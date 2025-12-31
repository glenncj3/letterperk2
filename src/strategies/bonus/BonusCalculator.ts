import { Tile, ScoreBreakdown } from '../../types/game';
import { IBonusStrategy, BonusContext, BonusResult } from './IBonusStrategy';
import { GreenBonusStrategy } from './GreenBonusStrategy';
import { YellowBonusStrategy } from './YellowBonusStrategy';
import { RedBonusStrategy } from './RedBonusStrategy';
import { BlueBonusStrategy } from './BlueBonusStrategy';
import { PurpleBonusStrategy } from './PurpleBonusStrategy';
import { BlackBonusStrategy } from './BlackBonusStrategy';
import { PURPLE_BONUS_MIN_LENGTH, PURPLE_BONUS_MULTIPLIER } from '../../constants/gameConstants';

/**
 * Calculator for word scores with bonuses.
 * Uses strategy pattern to calculate bonuses for each bonus type.
 */
export class BonusCalculator {
  private strategies: Map<string, IBonusStrategy>;

  constructor() {
    this.strategies = new Map();
    this.registerStrategy(new GreenBonusStrategy());
    this.registerStrategy(new YellowBonusStrategy());
    this.registerStrategy(new RedBonusStrategy());
    this.registerStrategy(new BlueBonusStrategy());
    this.registerStrategy(new PurpleBonusStrategy());
    this.registerStrategy(new BlackBonusStrategy());
  }

  /**
   * Registers a bonus strategy.
   */
  registerStrategy(strategy: IBonusStrategy): void {
    this.strategies.set(strategy.type, strategy);
  }

  /**
   * Calculates the score breakdown for a word.
   * 
   * @param word - The word string
   * @param selectedTiles - The tiles used to form the word
   * @returns Score breakdown with base score, bonuses, and final score
   */
  calculateScore(word: string, selectedTiles: Tile[]): ScoreBreakdown {
    const baseScore = selectedTiles.reduce((sum, tile) => sum + tile.points, 0);
    const bonuses: Array<{ type: string; value: number }> = [];

    let currentScore = baseScore;
    let purpleValue: number | null = null;

    // Calculate bonuses for each tile
    selectedTiles.forEach((tile, index) => {
      if (!tile.bonusType) return;

      const strategy = this.strategies.get(tile.bonusType);
      if (!strategy) return;

      const context: BonusContext = {
        word,
        selectedTiles,
        tileIndex: index,
        baseScore,
        currentScore,
      };

      const result = strategy.calculate(context);
      if (result && result.applied) {
        if (result.isMultiplicative) {
          // Multiplicative bonuses (like purple) are applied after additive bonuses
          // Store the value to add to bonuses array later
          purpleValue = result.value;
        } else {
          // Additive bonuses
          bonuses.push({ type: tile.bonusType, value: result.value });
          currentScore += result.value;
        }
      }
    });

    // Apply multiplicative bonuses (like purple) after all additive bonuses
    // Check if any purple tiles exist and word length is sufficient
    const hasPurple = selectedTiles.some(t => t.bonusType === 'purple');
    if (hasPurple && word.length >= PURPLE_BONUS_MIN_LENGTH) {
      bonuses.push({ type: 'purple', value: currentScore });
      currentScore *= PURPLE_BONUS_MULTIPLIER;
    }

    return {
      baseScore,
      bonuses,
      finalScore: currentScore,
    };
  }
}

// Singleton instance for convenience
let calculatorInstance: BonusCalculator | null = null;

/**
 * Gets the singleton bonus calculator instance.
 */
export function getBonusCalculator(): BonusCalculator {
  if (!calculatorInstance) {
    calculatorInstance = new BonusCalculator();
  }
  return calculatorInstance;
}

