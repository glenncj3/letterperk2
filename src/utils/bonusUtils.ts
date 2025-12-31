import { Tile, BonusType, ScoreBreakdown, BonusConfig } from '../types/game';
import { getBonusCalculator } from '../strategies/bonus/BonusCalculator';

/**
 * Calculates the score for a word with bonuses.
 * 
 * @deprecated Use getBonusCalculator().calculateScore() directly
 * This function is kept for backward compatibility.
 */
export function calculateScore(
  word: string,
  selectedTiles: Tile[]
): ScoreBreakdown {
  const calculator = getBonusCalculator();
  return calculator.calculateScore(word, selectedTiles);
}

export function assignBonuses(
  tiles: Tile[],
  config: BonusConfig[],
  random: () => number
): Tile[] {
  const tilesCopy = [...tiles];
  const availableTiles = [...tilesCopy];

  config.forEach(bonusConfig => {
    const count = bonusConfig.minCount || 1;

    for (let i = 0; i < count && availableTiles.length > 0; i++) {
      const index = Math.floor(random() * availableTiles.length);
      const tile = availableTiles[index];
      tile.bonusType = bonusConfig.type;
      availableTiles.splice(index, 1);
    }
  });

  return tilesCopy;
}

export function assignBonusesToSequences(
  sequences: Array<Array<{ letter: string; points: number }>>,
  config: BonusConfig[],
  random: () => number
): Array<Array<{ letter: string; points: number; bonusType?: BonusType }>> {
  const flatTiles = sequences.flatMap((seq, col) =>
    seq.map((tile, index) => ({ ...tile, col, index }))
  );

  const availableIndices = flatTiles.map((_, i) => i);

  config.forEach(bonusConfig => {
    const count = bonusConfig.minCount || 1;

    for (let i = 0; i < count && availableIndices.length > 0; i++) {
      const randomIndex = Math.floor(random() * availableIndices.length);
      const tileIndex = availableIndices[randomIndex];
      flatTiles[tileIndex].bonusType = bonusConfig.type;
      availableIndices.splice(randomIndex, 1);
    }
  });

  const result: Array<Array<{ letter: string; points: number; bonusType?: BonusType }>> = [[], [], []];
  flatTiles.forEach(tile => {
    result[tile.col][tile.index] = {
      letter: tile.letter,
      points: tile.points,
      bonusType: tile.bonusType
    };
  });

  return result;
}
