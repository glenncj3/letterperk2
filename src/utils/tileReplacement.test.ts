import { describe, it, expect } from 'vitest';
import { replaceTilesInColumns } from './tileReplacement';
import { Tile, BonusType } from '../types/game';
import { GRID_COLS, TILES_PER_COLUMN } from '../constants/gameConstants';
import { createTile } from './tileUtils';

describe('replaceTilesInColumns', () => {
  const createTestTile = (
    letter: string,
    points: number,
    row: number,
    col: number,
    bonusType?: BonusType
  ): Tile => ({
    id: `${letter}-${row}-${col}`,
    letter,
    points,
    row,
    col,
    bonusType,
  });

  const createTestSequence = (col: number, length: number) => {
    return Array.from({ length }, (_, i) => ({
      letter: String.fromCharCode(65 + i), // A, B, C, ...
      points: 1,
      bonusType: undefined as BonusType | undefined,
    }));
  };

  it('should replace selected tiles with new tiles from sequences', () => {
    const remainingTiles: Tile[] = [
      createTestTile('A', 1, 0, 0),
      createTestTile('B', 1, 1, 0),
      createTestTile('C', 1, 0, 1),
      createTestTile('D', 1, 1, 1),
    ];

    const selectedTiles: Tile[] = [
      createTestTile('B', 1, 1, 0),
    ];

    const sequences = [
      createTestSequence(0, 10),
      createTestSequence(1, 10),
      createTestSequence(2, 10),
    ];

    const indices: [number, number, number] = [2, 2, 0];

    const result = replaceTilesInColumns(
      remainingTiles,
      selectedTiles,
      sequences,
      indices
    );

    // Should fill all columns to TILES_PER_COLUMN (3)
    // Col 0: 2 remaining (A, B removed) + 1 new = 3
    // Col 1: 2 remaining (C, D) + 1 new = 3
    // Col 2: 0 remaining + 3 new = 3
    // Total: 9 tiles
    expect(result.newTiles.length).toBe(9);
    expect(result.newIndices[0]).toBe(3); // Index incremented by 1
    expect(result.newIndices[1]).toBe(3); // Index incremented by 1
    expect(result.newIndices[2]).toBe(3); // Index incremented by 3
  });

  it('should fill all columns to TILES_PER_COLUMN when tiles are removed', () => {
    const remainingTiles: Tile[] = [
      createTestTile('A', 1, 0, 0),
      createTestTile('B', 1, 1, 0),
      // Column 0 needs 1 more tile
      createTestTile('C', 1, 0, 1),
      // Column 1 needs 2 more tiles
      // Column 2 needs 3 tiles
    ];

    const selectedTiles: Tile[] = [
      createTestTile('B', 1, 1, 0),
      createTestTile('C', 1, 0, 1),
    ];

    const sequences = [
      createTestSequence(0, 10),
      createTestSequence(1, 10),
      createTestSequence(2, 10),
    ];

    const indices: [number, number, number] = [0, 0, 0];

    const result = replaceTilesInColumns(
      remainingTiles,
      selectedTiles,
      sequences,
      indices
    );

    // Should fill all columns to TILES_PER_COLUMN (3)
    // Col 0: 1 remaining + 2 new = 3 tiles
    // Col 1: 0 remaining + 3 new = 3 tiles
    // Col 2: 0 remaining + 3 new = 3 tiles
    // Total: 9 tiles
    expect(result.newTiles.length).toBe(9);

    // Verify column counts - all should be filled to TILES_PER_COLUMN (3)
    const col0Tiles = result.newTiles.filter(t => t.col === 0);
    const col1Tiles = result.newTiles.filter(t => t.col === 1);
    const col2Tiles = result.newTiles.filter(t => t.col === 2);

    expect(col0Tiles.length).toBe(3); // 1 remaining + 2 new
    expect(col1Tiles.length).toBe(3); // 0 remaining + 3 new
    expect(col2Tiles.length).toBe(3); // 0 remaining + 3 new
  });

  it('should use negative row numbers for new tiles so they sort to top', () => {
    const remainingTiles: Tile[] = [
      createTestTile('A', 1, 0, 0),
      createTestTile('B', 1, 1, 0),
    ];

    const selectedTiles: Tile[] = [
      createTestTile('A', 1, 0, 0),
    ];

    const sequences = [
      createTestSequence(0, 10),
      createTestSequence(1, 10),
      createTestSequence(2, 10),
    ];

    const indices: [number, number, number] = [0, 0, 0];

    const result = replaceTilesInColumns(
      remainingTiles,
      selectedTiles,
      sequences,
      indices
    );

    // New tiles should have negative row numbers
    const newTilesInCol0 = result.newTiles.filter(t => t.col === 0 && t.row < 0);
    expect(newTilesInCol0.length).toBeGreaterThan(0);
    expect(newTilesInCol0[0].row).toBeLessThan(0);
  });

  it('should wrap around sequence when index exceeds sequence length', () => {
    const remainingTiles: Tile[] = [];

    const selectedTiles: Tile[] = [];

    const sequences = [
      createTestSequence(0, 3), // Only 3 tiles in sequence
      createTestSequence(1, 3),
      createTestSequence(2, 3),
    ];

    const indices: [number, number, number] = [5, 5, 5]; // Beyond sequence length

    const result = replaceTilesInColumns(
      remainingTiles,
      selectedTiles,
      sequences,
      indices
    );

    // Should use modulo to wrap around
    // Each column needs 3 tiles, so indices increment by 3
    expect(result.newIndices[0]).toBe(8); // 5 + 3
    expect(result.newIndices[1]).toBe(8); // 5 + 3
    expect(result.newIndices[2]).toBe(8); // 5 + 3

    // Should still create tiles (using modulo)
    expect(result.newTiles.length).toBe(9); // 3 columns * 3 tiles
  });

  it('should preserve bonus types from sequences', () => {
    const remainingTiles: Tile[] = [];

    const selectedTiles: Tile[] = [];

    const sequences = [
      [
        { letter: 'A', points: 1, bonusType: 'green' as BonusType },
        { letter: 'B', points: 1, bonusType: undefined },
        { letter: 'C', points: 1, bonusType: 'red' as BonusType },
      ],
      createTestSequence(1, 3),
      createTestSequence(2, 3),
    ];

    const indices: [number, number, number] = [0, 0, 0];

    const result = replaceTilesInColumns(
      remainingTiles,
      selectedTiles,
      sequences,
      indices
    );

    const col0Tiles = result.newTiles.filter(t => t.col === 0);
    expect(col0Tiles[0].bonusType).toBe('green');
    expect(col0Tiles[1].bonusType).toBeUndefined();
    expect(col0Tiles[2].bonusType).toBe('red');
  });

  it('should handle empty remaining tiles (all tiles selected)', () => {
    const remainingTiles: Tile[] = [];

    const selectedTiles: Tile[] = [
      createTestTile('A', 1, 0, 0),
      createTestTile('B', 1, 1, 0),
      createTestTile('C', 1, 2, 0),
      createTestTile('D', 1, 0, 1),
      createTestTile('E', 1, 1, 1),
      createTestTile('F', 1, 2, 1),
      createTestTile('G', 1, 0, 2),
      createTestTile('H', 1, 1, 2),
      createTestTile('I', 1, 2, 2),
    ];

    const sequences = [
      createTestSequence(0, 10),
      createTestSequence(1, 10),
      createTestSequence(2, 10),
    ];

    const indices: [number, number, number] = [0, 0, 0];

    const result = replaceTilesInColumns(
      remainingTiles,
      selectedTiles,
      sequences,
      indices
    );

    // Should create 9 new tiles (3 per column)
    expect(result.newTiles.length).toBe(9);
    expect(result.newIndices[0]).toBe(3);
    expect(result.newIndices[1]).toBe(3);
    expect(result.newIndices[2]).toBe(3);
  });

  it('should handle no tiles selected (refresh scenario)', () => {
    const remainingTiles: Tile[] = [
      createTestTile('A', 1, 0, 0),
      createTestTile('B', 1, 1, 0),
      createTestTile('C', 1, 2, 0),
    ];

    const selectedTiles: Tile[] = [];

    const sequences = [
      createTestSequence(0, 10),
      createTestSequence(1, 10),
      createTestSequence(2, 10),
    ];

    const indices: [number, number, number] = [0, 0, 0];

    const result = replaceTilesInColumns(
      remainingTiles,
      selectedTiles,
      sequences,
      indices
    );

    // Should fill all columns to TILES_PER_COLUMN (3)
    // Col 0: 3 remaining + 0 new = 3 tiles
    // Col 1: 0 remaining + 3 new = 3 tiles
    // Col 2: 0 remaining + 3 new = 3 tiles
    // Total: 9 tiles
    expect(result.newTiles.length).toBe(9);
    expect(result.newIndices[0]).toBe(0); // No change needed
    expect(result.newIndices[1]).toBe(3); // Added 3 tiles
    expect(result.newIndices[2]).toBe(3); // Added 3 tiles
  });
});

