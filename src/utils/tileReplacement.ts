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

  // Draw tiles in round-robin order: each column draws from positions that belong to it
  // Track how many tiles each column draws
  const tilesDrawnPerColumn: [number, number, number] = [0, 0, 0];
  
  // Calculate total tiles needed
  const totalTilesNeeded = tilesNeededPerColumn.reduce((sum, count) => sum + count, 0);
  
  // Draw tiles in round-robin fashion (col0, col1, col2, col0, col1, col2, ...)
  let tilesDrawn = 0;
  let currentCol = 0;
  
  while (tilesDrawn < totalTilesNeeded) {
    // Find next column that needs tiles
    while (tilesDrawnPerColumn[currentCol] >= tilesNeededPerColumn[currentCol]) {
      currentCol = (currentCol + 1) % GRID_COLS;
    }
    
    // Draw one tile for this column from the chain position that belongs to it
    // In round-robin: col0 gets positions 0, 3, 6, 9...; col1 gets 1, 4, 7, 10...; col2 gets 2, 5, 8, 11...
    // Current position for this column = indices[currentCol] * GRID_COLS + currentCol + tilesDrawnPerColumn[currentCol] * GRID_COLS
    const colIndex = indices[currentCol] + tilesDrawnPerColumn[currentCol];
    const chainPos = colIndex * GRID_COLS + currentCol;
    const tileData = singleChain[chainPos % singleChain.length];
    
    tilesDrawnPerColumn[currentCol]++;
    tilesDrawn++;

    // Use negative row numbers so they sort last and go to top after gravity
    // (gravity sorts descending, so lower numbers = sorted last = placed at top)
    const newTile = createTile(
      tileData.letter,
      tileData.points,
      -1 - (tilesDrawnPerColumn[currentCol] - 1),
      currentCol,
      tileData.bonusType
    );
    freshTiles.push(newTile);
    
    // Move to next column for round-robin
    currentCol = (currentCol + 1) % GRID_COLS;
  }

  // Update indices: add the number of tiles drawn to each column's current index
  const newIndices: [number, number, number] = [
    indices[0] + tilesDrawnPerColumn[0],
    indices[1] + tilesDrawnPerColumn[1],
    indices[2] + tilesDrawnPerColumn[2],
  ];

  // Combine remaining tiles with new tiles
  // Note: Gravity will be applied by the caller
  const allTiles = [...remainingTiles, ...freshTiles];

  return {
    newTiles: allTiles,
    newIndices,
  };
}

