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
