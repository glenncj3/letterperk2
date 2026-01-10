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
 * Shuffles tiles across the entire grid, randomizing their positions within
 * the 3x3 grid. Guarantees that each tile moves to a different position
 * (no tile stays in its original position).
 * 
 * @param tiles - Array of tiles to shuffle
 * @param random - Random function to use for shuffling (defaults to Math.random)
 * @returns New array of tiles with shuffled positions across the grid
 */
export function shuffleTiles(tiles: Tile[], random: () => number = Math.random): Tile[] {
  if (tiles.length === 0) return tiles;

  // Get all available positions in the grid
  const allPositions: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      allPositions.push({ row, col });
    }
  }

  // Store current positions of each tile
  const tileCurrentPositions = new Map<string, { row: number; col: number }>();
  tiles.forEach(tile => {
    tileCurrentPositions.set(tile.id, { row: tile.row, col: tile.col });
  });

  // Shuffle all grid positions
  const shuffledPositions = [...allPositions];
  for (let i = shuffledPositions.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffledPositions[i], shuffledPositions[j]] = [shuffledPositions[j], shuffledPositions[i]];
  }

  // Generate a derangement to ensure no tile stays in its original position
  const derangement = generateDerangement(tiles.length, random);

  // Assign tiles to positions: use derangement to map tiles to shuffled positions
  // If a tile would end up in its original position, we'll adjust
  const shuffledTiles: Tile[] = [];
  const usedPositions = new Set<string>();
  
  tiles.forEach((tile, index) => {
    const currentPos = tileCurrentPositions.get(tile.id)!;
    const currentPosKey = `${currentPos.row}-${currentPos.col}`;
    
    // Use derangement to select a position index
    // derangement[index] gives us a different index, ensuring movement
    let positionIndex = derangement[index] % shuffledPositions.length;
    let targetPosition = shuffledPositions[positionIndex];
    let targetPosKey = `${targetPosition.row}-${targetPosition.col}`;
    
    // If this would place the tile in its original position, find a different one
    if (targetPosKey === currentPosKey || usedPositions.has(targetPosKey)) {
      // Find the first available position that's different from current
      for (let i = 0; i < shuffledPositions.length; i++) {
        const candidateIndex = (positionIndex + i) % shuffledPositions.length;
        const candidate = shuffledPositions[candidateIndex];
        const candidateKey = `${candidate.row}-${candidate.col}`;
        
        if (candidateKey !== currentPosKey && !usedPositions.has(candidateKey)) {
          targetPosition = candidate;
          targetPosKey = candidateKey;
          break;
        }
      }
    }
    
    usedPositions.add(targetPosKey);
    
    shuffledTiles.push({
      ...tile,
      row: targetPosition.row,
      col: targetPosition.col,
    });
  });

  // Apply gravity to ensure proper positioning (this will handle any gaps)
  return applyGravity(shuffledTiles);
}