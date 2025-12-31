import { describe, it, expect } from 'vitest';
import { detectTileChanges, setupNewGameAnimation, TileChangeResult } from './tileAnimation';
import { Tile } from '../types/game';

describe('tileAnimation utilities', () => {
  const createTestTile = (id: string, row: number, col: number): Tile => ({
    id,
    letter: 'A',
    points: 1,
    row,
    col,
  });

  describe('detectTileChanges', () => {
    it('should detect new tiles', () => {
      const previousIds = new Set<string>(['tile1', 'tile2']);
      const previousPositions = new Map<string, { row: number; col: number }>([
        ['tile1', { row: 0, col: 0 }],
        ['tile2', { row: 1, col: 0 }],
      ]);

      const currentTiles = [
        createTestTile('tile1', 0, 0),
        createTestTile('tile2', 1, 0),
        createTestTile('tile3', 2, 0), // New tile
      ];

      const result = detectTileChanges(
        currentTiles,
        previousIds,
        previousPositions
      );

      expect(result.newTileIds).toContain('tile3');
      expect(result.newTileIds.size).toBe(1);
      expect(result.movedTileIds.size).toBe(0);
    });

    it('should detect moved tiles', () => {
      const previousIds = new Set<string>(['tile1', 'tile2']);
      const previousPositions = new Map<string, { row: number; col: number }>([
        ['tile1', { row: 0, col: 0 }],
        ['tile2', { row: 1, col: 0 }],
      ]);

      const currentTiles = [
        createTestTile('tile1', 2, 0), // Moved from row 0 to row 2
        createTestTile('tile2', 1, 0),
      ];

      const result = detectTileChanges(
        currentTiles,
        previousIds,
        previousPositions
      );

      expect(result.movedTileIds).toContain('tile1');
      expect(result.movedTileIds.size).toBe(1);
      expect(result.newTileIds.size).toBe(0);
    });

    it('should detect both new and moved tiles', () => {
      const previousIds = new Set<string>(['tile1']);
      const previousPositions = new Map<string, { row: number; col: number }>([
        ['tile1', { row: 0, col: 0 }],
      ]);

      const currentTiles = [
        createTestTile('tile1', 1, 0), // Moved
        createTestTile('tile2', 0, 0), // New
      ];

      const result = detectTileChanges(
        currentTiles,
        previousIds,
        previousPositions
      );

      expect(result.newTileIds).toContain('tile2');
      expect(result.movedTileIds).toContain('tile1');
    });

    it('should return empty sets when no changes', () => {
      const previousIds = new Set<string>(['tile1', 'tile2']);
      const previousPositions = new Map<string, { row: number; col: number }>([
        ['tile1', { row: 0, col: 0 }],
        ['tile2', { row: 1, col: 0 }],
      ]);

      const currentTiles = [
        createTestTile('tile1', 0, 0),
        createTestTile('tile2', 1, 0),
      ];

      const result = detectTileChanges(
        currentTiles,
        previousIds,
        previousPositions
      );

      expect(result.newTileIds.size).toBe(0);
      expect(result.movedTileIds.size).toBe(0);
    });

    it('should handle empty previous state', () => {
      const previousIds = new Set<string>();
      const previousPositions = new Map<string, { row: number; col: number }>();

      const currentTiles = [
        createTestTile('tile1', 0, 0),
        createTestTile('tile2', 1, 0),
      ];

      const result = detectTileChanges(
        currentTiles,
        previousIds,
        previousPositions
      );

      // All tiles should be considered new
      expect(result.newTileIds.size).toBe(2);
      expect(result.newTileIds).toContain('tile1');
      expect(result.newTileIds).toContain('tile2');
    });
  });

  describe('setupNewGameAnimation', () => {
    it('should create animation delays for all tiles', () => {
      const tiles = [
        createTestTile('tile1', 0, 0),
        createTestTile('tile2', 1, 0),
        createTestTile('tile3', 0, 1),
      ];

      const result = setupNewGameAnimation(tiles);

      expect(result.tileIds.size).toBe(3);
      expect(result.tileIds).toContain('tile1');
      expect(result.tileIds).toContain('tile2');
      expect(result.tileIds).toContain('tile3');
      expect(result.delays.size).toBe(3);
    });

    it('should generate delays based on position', () => {
      const tiles = [
        createTestTile('tile1', 0, 0), // col 0, row 0
        createTestTile('tile2', 0, 1), // col 1, row 0
        createTestTile('tile3', 1, 0), // col 0, row 1
      ];

      const result = setupNewGameAnimation(tiles);

      // Delays should be different for different positions
      const delay1 = result.delays.get('tile1');
      const delay2 = result.delays.get('tile2');
      const delay3 = result.delays.get('tile3');

      expect(delay1).toBeDefined();
      expect(delay2).toBeDefined();
      expect(delay3).toBeDefined();
      // Column 1 should have higher delay than column 0
      expect(delay2!).toBeGreaterThan(delay1!);
    });

    it('should handle empty tile array', () => {
      const result = setupNewGameAnimation([]);

      expect(result.tileIds.size).toBe(0);
      expect(result.delays.size).toBe(0);
    });
  });
});

