import { Tile, BonusType, ScoreBreakdown, BonusConfig } from '../types/game';
import { PURPLE_BONUS_MIN_LENGTH, RED_BONUS_MAX_LENGTH } from '../constants/gameConstants';

export function calculateScore(
  word: string,
  selectedTiles: Tile[]
): ScoreBreakdown {
  let baseScore = selectedTiles.reduce((sum, tile) => sum + tile.points, 0);
  const bonuses: Array<{ type: BonusType; value: number }> = [];

  let hasPurple = false;
  const yellowCount = selectedTiles.filter(t => t.bonusType === 'yellow').length;

  selectedTiles.forEach((tile, index) => {
    if (!tile.bonusType) return;

    switch (tile.bonusType) {
      case 'green':
        bonuses.push({ type: 'green', value: 1 });
        break;

      case 'purple':
        if (word.length >= PURPLE_BONUS_MIN_LENGTH) {
          hasPurple = true;
        }
        break;

      case 'red':
        if (word.length <= RED_BONUS_MAX_LENGTH) {
          bonuses.push({ type: 'red', value: 10 });
        }
        break;

      case 'blue':
        if (index === 0 || index === selectedTiles.length - 1) {
          bonuses.push({ type: 'blue', value: 5 });
        }
        break;
    }
  });

  // Yellow bonus: points equal to the square of the number of yellows used
  if (yellowCount > 0) {
    bonuses.push({ type: 'yellow', value: yellowCount * yellowCount });
  }

  const additiveBonus = bonuses.reduce((sum, bonus) => sum + bonus.value, 0);
  let finalScore = baseScore + additiveBonus;

  if (hasPurple) {
    bonuses.push({ type: 'purple', value: finalScore });
    finalScore *= 2;
  }

  return {
    baseScore,
    bonuses,
    finalScore
  };
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
