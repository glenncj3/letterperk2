import { Tile, BonusType } from '../types/game';
import { GRID_COLS, TILES_PER_COLUMN } from '../constants/gameConstants';
import { createTile } from './tileUtils';

export interface ReplaceTilesResult {
  newTiles: Tile[];
  newIndices: [number, number, number];
}

/**
 * Reconstructs the single chain from column sequences.
 * Since columns are populated round-robin from a single chain, we can reconstruct it
 * by interleaving the columns back together.
 */
function reconstructSingleChain(
  sequences: Array<Array<{ letter: string; points: number; bonusType?: BonusType }>>
): Array<{ letter: string; points: number; bonusType?: BonusType }> {
  const singleChain: Array<{ letter: string; points: number; bonusType?: BonusType }> = [];
  const maxLength = Math.max(...sequences.map(seq => seq.length));
  
  // Reconstruct by interleaving columns (reverse of round-robin)
  // Original: chain[0] -> col0, chain[1] -> col1, chain[2] -> col2, chain[3] -> col0, etc.
  // Reconstruction: col0[0], col1[0], col2[0], col0[1], col1[1], col2[1], etc.
  for (let i = 0; i < maxLength; i++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (i < sequences[col].length) {
        singleChain.push(sequences[col][i]);
      }
    }
  }
  
  return singleChain;
}

/**
 * Replaces selected tiles with new tiles drawn from a single chain sequence.
 * The chain is reconstructed from column sequences (which were populated round-robin).
 * This is used both for word submission and tile trading.
 * 
 * @param remainingTiles - Tiles that were not selected
 * @param selectedTiles - Tiles that were selected and need to be replaced
 * @param sequences - Column sequences (used to reconstruct single chain)
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
  
  // Reconstruct the single chain from column sequences
  const singleChain = reconstructSingleChain(sequences);
  
  // Calculate current position in the single chain
  // Since columns are populated round-robin from the single chain:
  // - chain[0] -> col0, chain[1] -> col1, chain[2] -> col2, chain[3] -> col0, etc.
  // If indices = [a, b, c], that means:
  // - col0 has drawn 'a' tiles (positions 0, 3, 6, 9, ...)
  // - col1 has drawn 'b' tiles (positions 1, 4, 7, 10, ...)
  // - col2 has drawn 'c' tiles (positions 2, 5, 8, 11, ...)
  // The total chain position = max(indices) * GRID_COLS - (GRID_COLS - 1) + offset
  // where offset depends on which columns have reached max(indices)
  const maxIndex = Math.max(...indices);
  const minIndex = Math.min(...indices);
  
  // Calculate base position: if all columns had maxIndex tiles
  const basePosition = maxIndex * GRID_COLS;
  
  // Adjust for columns that haven't reached maxIndex yet
  // Count how many columns are at maxIndex
  const columnsAtMax = indices.filter(idx => idx === maxIndex).length;
  let chainPosition = basePosition - (GRID_COLS - columnsAtMax);

  // Calculate how many new tiles are needed per column
  const tilesNeededPerColumn: number[] = [];
  for (let col = 0; col < GRID_COLS; col++) {
    const columnTiles = remainingTiles.filter(t => t.col === col);
    tilesNeededPerColumn[col] = TILES_PER_COLUMN - columnTiles.length;
  }

  // Draw tiles sequentially from the single chain and assign to columns
  for (let col = 0; col < GRID_COLS; col++) {
    const tilesNeeded = tilesNeededPerColumn[col];
    
    for (let i = 0; i < tilesNeeded; i++) {
      const tileData = singleChain[chainPosition % singleChain.length];
      chainPosition++;

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

  // Update indices: since we're drawing from a single chain sequentially,
  // we need to update all indices to reflect the new chain position
  // The new position divided by GRID_COLS gives us how many "rounds" we've completed
  const totalTilesDrawn = chainPosition;
  const baseIndex = Math.floor(totalTilesDrawn / GRID_COLS);
  const remainder = totalTilesDrawn % GRID_COLS;
  
  // Distribute the remainder across columns
  const newIndices: [number, number, number] = [
    baseIndex + (remainder > 0 ? 1 : 0),
    baseIndex + (remainder > 1 ? 1 : 0),
    baseIndex + (remainder > 2 ? 1 : 0),
  ];

  // Combine remaining tiles with new tiles
  // Note: Gravity will be applied by the caller
  const allTiles = [...remainingTiles, ...freshTiles];

  return {
    newTiles: allTiles,
    newIndices,
  };
}

