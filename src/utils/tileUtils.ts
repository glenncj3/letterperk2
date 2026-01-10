import { Tile, BonusType } from '../types/game';
import { GRID_ROWS, GRID_COLS } from '../constants/gameConstants';

export function applyGravity(tiles: Tile[]): Tile[] {
  const updatedTiles = [...tiles];

  for (let col = 0; col < GRID_COLS; col++) {
    const columnTiles = updatedTiles
      .filter(tile => tile.col === col)
      .sort((a, b) => b.row - a.row);

    let targetRow = GRID_ROWS - 1;
    columnTiles.forEach(tile => {
      tile.targetRow = targetRow;
      tile.row = targetRow;
      targetRow--;
    });
  }

  return updatedTiles;
}

export function createTile(
  letter: string,
  points: number,
  row: number,
  col: number,
  bonusType?: BonusType
): Tile {
  return {
    id: `${letter}-${row}-${col}-${Date.now()}-${Math.random()}`,
    letter,
    points,
    row,
    col,
    bonusType
  };
}

export function getTilesByColumn(tiles: Tile[], col: number): Tile[] {
  return tiles
    .filter(tile => tile.col === col)
    .sort((a, b) => a.row - b.row);
}

export function getEmptyPositions(tiles: Tile[]): Array<{ row: number; col: number }> {
  const occupied = new Set(tiles.map(t => `${t.row}-${t.col}`));
  const empty: Array<{ row: number; col: number }> = [];

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (!occupied.has(`${row}-${col}`)) {
        empty.push({ row, col });
      }
    }
  }

  return empty;
}

/**
 * Generates a derangement (permutation with no fixed points) of indices.
 * Ensures that no element ends up in its original position.
 * 
 * @param length - Length of the array to derange
 * @param random - Random function to use
 * @returns Array of indices representing a derangement
 */
function generateDerangement(length: number, random: () => number): number[] {
  if (length <= 1) return [0];
  if (length === 2) return [1, 0]; // Only one derangement for 2 elements
  
  // For small arrays, use rejection sampling
  // Try up to 100 times to find a valid derangement
  for (let attempt = 0; attempt < 100; attempt++) {
    const indices = Array.from({ length }, (_, i) => i);
    
    // Shuffle using Fisher-Yates
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    // Check if it's a derangement (no fixed points)
    let isDerangement = true;
    for (let i = 0; i < length; i++) {
      if (indices[i] === i) {
        isDerangement = false;
        break;
      }
    }
    
    if (isDerangement) {
      return indices;
    }
  }
  
  // Fallback: if we can't find a derangement after 100 attempts,
  // use a cyclic shift (guaranteed derangement for length > 1)
  const result = Array.from({ length }, (_, i) => (i + 1) % length);
  return result;
}

/**
 * Shuffles tiles within each column, keeping tiles in their respective columns
 * but randomizing their row positions. Guarantees that each tile moves to a
 * different position (no tile stays in its original position).
 * 
 * @param tiles - Array of tiles to shuffle
 * @param random - Random function to use for shuffling (defaults to Math.random)
 * @returns New array of tiles with shuffled row positions
 */
export function shuffleTiles(tiles: Tile[], random: () => number = Math.random): Tile[] {
  const shuffledTiles: Tile[] = [];

  // Group tiles by column and shuffle each column independently
  for (let col = 0; col < GRID_COLS; col++) {
    const columnTiles = tiles.filter(tile => tile.col === col);
    
    if (columnTiles.length === 0) continue;
    
    // Sort tiles by row descending (same way gravity does) to get current order
    // This gives us the current position order from bottom to top
    const sortedByRow = [...columnTiles].sort((a, b) => b.row - a.row);
    
    // Generate a derangement of positions
    // This ensures tile at position i goes to a different position
    const derangement = generateDerangement(sortedByRow.length, random);
    
    // Calculate the target rows (from bottom: GRID_ROWS-1, GRID_ROWS-2, ...)
    const targetRows: number[] = [];
    for (let i = 0; i < sortedByRow.length; i++) {
      targetRows.push(GRID_ROWS - 1 - i);
    }
    
    // Create mapping from tile ID to new target row
    const tileToNewRow = new Map<string, number>();
    sortedByRow.forEach((tile, currentPosition) => {
      // The derangement tells us which final position this tile should occupy
      const newPosition = derangement[currentPosition];
      // Get the target row for that position
      const newRow = targetRows[newPosition];
      tileToNewRow.set(tile.id, newRow);
    });
    
    // Assign each tile to its new row position
    columnTiles.forEach((tile) => {
      const newRow = tileToNewRow.get(tile.id)!;
      shuffledTiles.push({
        ...tile,
        row: newRow,
      });
    });
  }

  // Apply gravity to ensure proper positioning (this will handle any gaps)
  return applyGravity(shuffledTiles);
}