import { Tile, BonusType } from '../types/game';
import { GRID_COLS, TILES_PER_COLUMN } from '../constants/gameConstants';
import { createTile } from './tileUtils';

export interface ReplaceTilesResult {
  newTiles: Tile[];
  newIndices: [number, number, number];
}

/**
 * Replaces selected tiles with new tiles drawn from column sequences.
 * This is used both for word submission and tile trading.
 * 
 * @param remainingTiles - Tiles that were not selected
 * @param selectedTiles - Tiles that were selected and need to be replaced
 * @param sequences - Column sequences to draw new tiles from
 * @param indices - Current draw indices for each column
 * @returns New tiles array and updated indices
 */
export function replaceTilesInColumns(
  remainingTiles: Tile[],
  selectedTiles: Tile[],
  sequences: Array<Array<{ letter: string; points: number; bonusType?: BonusType }>>,
  indices: [number, number, number]
): ReplaceTilesResult {
  const freshTiles: Tile[] = [];
  const newIndices: [number, number, number] = [...indices];

  // Calculate how many new tiles are needed per column
  for (let col = 0; col < GRID_COLS; col++) {
    const columnTiles = remainingTiles.filter(t => t.col === col);
    const tilesNeeded = TILES_PER_COLUMN - columnTiles.length;

    // Draw new tiles from the sequence to fill the column
    for (let i = 0; i < tilesNeeded; i++) {
      const sequence = sequences[col];
      const tileData = sequence[newIndices[col] % sequence.length];
      newIndices[col]++;

      // Use negative row numbers so they sort last and go to top after gravity
      // (gravity sorts descending, so lower numbers = sorted last = placed at top)
      const newTile = createTile(
        tileData.letter,
        tileData.points,
        -1 - i,
        col,
        tileData.bonusType
      );
      freshTiles.push(newTile);
    }
  }

  // Combine remaining tiles with new tiles
  // Note: Gravity will be applied by the caller
  const allTiles = [...remainingTiles, ...freshTiles];

  return {
    newTiles: allTiles,
    newIndices,
  };
}

