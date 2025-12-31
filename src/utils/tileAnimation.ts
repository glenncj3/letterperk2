import { Tile } from '../types/game';

export interface TileChangeResult {
  newTileIds: Set<string>;
  movedTileIds: Set<string>;
}

export interface AnimationSetup {
  tileIds: Set<string>;
  delays: Map<string, number>;
}

/**
 * Detects which tiles are new and which have moved positions.
 * 
 * @param currentTiles - Current tiles array
 * @param previousIds - Set of previous tile IDs
 * @param previousPositions - Map of previous tile positions
 * @returns Object containing sets of new and moved tile IDs
 */
export function detectTileChanges(
  currentTiles: Tile[],
  previousIds: Set<string>,
  previousPositions: Map<string, { row: number; col: number }>
): TileChangeResult {
  const currentIds = new Set(currentTiles.map(t => t.id));
  const newTileIds = new Set<string>();
  const movedTileIds = new Set<string>();

  // Find new tiles (in current but not in previous)
  currentTiles.forEach(tile => {
    if (!previousIds.has(tile.id)) {
      newTileIds.add(tile.id);
    } else {
      // Check if tile moved
      const previousPos = previousPositions.get(tile.id);
      if (previousPos && (previousPos.row !== tile.row || previousPos.col !== tile.col)) {
        movedTileIds.add(tile.id);
      }
    }
  });

  return { newTileIds, movedTileIds };
}

/**
 * Sets up animation for a new game (all tiles should animate).
 * Generates delays based on tile position.
 * 
 * @param tiles - All tiles to animate
 * @returns Object containing tile IDs to animate and their delays
 */
export function setupNewGameAnimation(tiles: Tile[]): AnimationSetup {
  const tileIds = new Set<string>();
  const delays = new Map<string, number>();

  tiles.forEach(tile => {
    tileIds.add(tile.id);
    // Generate delay based on position with some randomness
    const delay = (tile.col * 40) + (tile.row * 30) + (Math.random() * 200);
    delays.set(tile.id, delay);
  });

  return { tileIds, delays };
}

/**
 * Generates animation delays for tiles that changed.
 * 
 * @param tiles - Tiles that need animation
 * @param previousPositions - Previous positions for moved tiles
 * @returns Map of tile ID to delay in milliseconds
 */
export function generateAnimationDelays(
  tiles: Tile[],
  previousPositions: Map<string, { row: number; col: number }>
): Map<string, number> {
  const delays = new Map<string, number>();

  tiles.forEach(tile => {
    const previousPos = previousPositions.get(tile.id);
    if (previousPos) {
      // Calculate delay based on movement distance
      const rowDiff = Math.abs(previousPos.row - tile.row);
      const delay = (tile.col * 40) + (tile.row * 30) + (rowDiff * 50);
      delays.set(tile.id, delay);
    } else {
      // New tile - use standard delay
      const delay = (tile.col * 40) + (tile.row * 30) + (Math.random() * 200);
      delays.set(tile.id, delay);
    }
  });

  return delays;
}

/**
 * Creates a position map from tiles array.
 * 
 * @param tiles - Tiles array
 * @returns Map of tile ID to position
 */
export function createPositionMap(tiles: Tile[]): Map<string, { row: number; col: number }> {
  const positions = new Map<string, { row: number; col: number }>();
  tiles.forEach(tile => {
    positions.set(tile.id, { row: tile.row, col: tile.col });
  });
  return positions;
}

