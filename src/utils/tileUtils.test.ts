import { describe, it, expect } from 'vitest';
import { applyGravity, createTile, getTilesByColumn, getEmptyPositions } from './tileUtils';
import { Tile, BonusType } from '../types/game';
import { GRID_ROWS, GRID_COLS } from '../constants/gameConstants';

describe('tileUtils', () => {
  describe('createTile', () => {
    it('should create a tile with all properties', () => {
      const tile = createTile('A', 1, 0, 0, 'green');
      
      expect(tile.letter).toBe('A');
      expect(tile.points).toBe(1);
      expect(tile.row).toBe(0);
      expect(tile.col).toBe(0);
      expect(tile.bonusType).toBe('green');
      expect(tile.id).toBeDefined();
      expect(typeof tile.id).toBe('string');
    });

    it('should create a tile without bonus type', () => {
      const tile = createTile('B', 2, 1, 1);
      
      expect(tile.letter).toBe('B');
      expect(tile.points).toBe(2);
      expect(tile.row).toBe(1);
      expect(tile.col).toBe(1);
      expect(tile.bonusType).toBeUndefined();
    });

    it('should generate unique IDs', () => {
      const tile1 = createTile('A', 1, 0, 0);
      const tile2 = createTile('A', 1, 0, 0);
      
      expect(tile1.id).not.toBe(tile2.id);
    });
  });

  describe('applyGravity', () => {
    it('should move tiles to bottom of their columns', () => {
      const tiles: Tile[] = [
        createTile('A', 1, 0, 0),
        createTile('B', 1, 2, 0), // Gap at row 1
        createTile('C', 1, 1, 1),
      ];

      const result = applyGravity(tiles);

      // Column 0: B should be at row 2, A at row 1
      const col0Tiles = result.filter(t => t.col === 0);
      expect(col0Tiles.length).toBe(2);
      const bTile = col0Tiles.find(t => t.letter === 'B');
      const aTile = col0Tiles.find(t => t.letter === 'A');
      expect(bTile?.row).toBe(2); // Bottom
      expect(aTile?.row).toBe(1); // Above B
    });

    it('should handle empty columns', () => {
      const tiles: Tile[] = [
        createTile('A', 1, 0, 0),
        // Column 1 is empty
        createTile('B', 1, 0, 2),
      ];

      const result = applyGravity(tiles);

      expect(result.length).toBe(2);
      expect(result.find(t => t.letter === 'A')?.row).toBe(2); // Bottom of col 0
      expect(result.find(t => t.letter === 'B')?.row).toBe(2); // Bottom of col 2
    });

    it('should preserve tile properties', () => {
      const tiles: Tile[] = [
        createTile('A', 1, 0, 0, 'green'),
        createTile('B', 2, 2, 0),
      ];

      const result = applyGravity(tiles);

      const aTile = result.find(t => t.letter === 'A');
      expect(aTile?.bonusType).toBe('green');
      expect(aTile?.points).toBe(1);
      expect(aTile?.letter).toBe('A');
    });

    it('should handle all tiles in one column', () => {
      const tiles: Tile[] = [
        createTile('A', 1, 0, 0),
        createTile('B', 1, 1, 0),
        createTile('C', 1, 2, 0),
      ];

      const result = applyGravity(tiles);

      expect(result.length).toBe(3);
      const col0Tiles = result.filter(t => t.col === 0).sort((a, b) => b.row - a.row);
      expect(col0Tiles[0].letter).toBe('C');
      expect(col0Tiles[1].letter).toBe('B');
      expect(col0Tiles[2].letter).toBe('A');
    });
  });

  describe('getTilesByColumn', () => {
    it('should return tiles for a specific column', () => {
      const tiles: Tile[] = [
        createTile('A', 1, 0, 0),
        createTile('B', 1, 1, 0),
        createTile('C', 1, 0, 1),
        createTile('D', 1, 1, 1),
      ];

      const col0Tiles = getTilesByColumn(tiles, 0);

      expect(col0Tiles.length).toBe(2);
      expect(col0Tiles.map(t => t.letter)).toEqual(['A', 'B']);
    });

    it('should return empty array for column with no tiles', () => {
      const tiles: Tile[] = [
        createTile('A', 1, 0, 0),
      ];

      const col1Tiles = getTilesByColumn(tiles, 1);

      expect(col1Tiles).toEqual([]);
    });

    it('should sort tiles by row ascending', () => {
      const tiles: Tile[] = [
        createTile('A', 1, 2, 0),
        createTile('B', 1, 0, 0),
        createTile('C', 1, 1, 0),
      ];

      const col0Tiles = getTilesByColumn(tiles, 0);

      expect(col0Tiles.map(t => t.letter)).toEqual(['B', 'C', 'A']);
      expect(col0Tiles.map(t => t.row)).toEqual([0, 1, 2]);
    });
  });

  describe('getEmptyPositions', () => {
    it('should return all positions when no tiles exist', () => {
      const tiles: Tile[] = [];

      const empty = getEmptyPositions(tiles);

      expect(empty.length).toBe(GRID_ROWS * GRID_COLS);
    });

    it('should return empty positions excluding occupied ones', () => {
      const tiles: Tile[] = [
        createTile('A', 1, 0, 0),
        createTile('B', 1, 2, 2),
      ];

      const empty = getEmptyPositions(tiles);

      expect(empty.length).toBe(GRID_ROWS * GRID_COLS - 2);
      expect(empty.some(p => p.row === 0 && p.col === 0)).toBe(false);
      expect(empty.some(p => p.row === 2 && p.col === 2)).toBe(false);
    });

    it('should return correct positions for partially filled grid', () => {
      const tiles: Tile[] = [
        createTile('A', 1, 0, 0),
        createTile('B', 1, 1, 0),
        createTile('C', 1, 2, 0),
        // Column 0 is full, columns 1 and 2 are empty
      ];

      const empty = getEmptyPositions(tiles);

      expect(empty.length).toBe(GRID_ROWS * GRID_COLS - 3);
      // All positions in columns 1 and 2 should be empty
      expect(empty.filter(p => p.col === 1).length).toBe(GRID_ROWS);
      expect(empty.filter(p => p.col === 2).length).toBe(GRID_ROWS);
    });

    it('should handle full grid', () => {
      const tiles: Tile[] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        for (let row = 0; row < GRID_ROWS; row++) {
          tiles.push(createTile('A', 1, row, col));
        }
      }

      const empty = getEmptyPositions(tiles);

      expect(empty).toEqual([]);
    });
  });
});

