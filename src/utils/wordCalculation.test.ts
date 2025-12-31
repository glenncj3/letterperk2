import { describe, it, expect, vi } from 'vitest';
import { calculateWordState } from './wordCalculation';
import { Tile, BonusType } from '../types/game';

// Mock the dictionary and bonus utils
vi.mock('../lib/dictionary', () => ({
  isValidWord: vi.fn((word: string) => word.length >= 2 && word.length <= 10),
}));

vi.mock('./bonusUtils', () => ({
  calculateScore: vi.fn((word: string, tiles: Tile[]) => {
    const baseScore = tiles.reduce((sum, t) => sum + t.points, 0);
    return {
      baseScore,
      bonuses: [],
      finalScore: baseScore,
    };
  }),
}));

describe('calculateWordState', () => {
  const createTestTile = (
    letter: string,
    points: number,
    bonusType?: BonusType
  ): Tile => ({
    id: `${letter}-${Date.now()}`,
    letter,
    points,
    row: 0,
    col: 0,
    bonusType,
  });

  it('should calculate word state from selected tiles', () => {
    const selectedTiles: Tile[] = [
      createTestTile('H', 2),
      createTestTile('E', 1),
      createTestTile('L', 2),
      createTestTile('L', 2),
      createTestTile('O', 1),
    ];

    const result = calculateWordState(selectedTiles);

    expect(result.word).toBe('HELLO');
    expect(result.isValid).toBe(true);
    expect(result.score.baseScore).toBe(8);
  });

  it('should return empty state for no tiles', () => {
    const result = calculateWordState([]);

    expect(result.word).toBe('');
    expect(result.isValid).toBe(false);
    expect(result.score.baseScore).toBe(0);
    expect(result.score.finalScore).toBe(0);
  });

  it('should mark invalid words correctly', () => {
    const selectedTiles: Tile[] = [
      createTestTile('X', 8),
    ];

    const result = calculateWordState(selectedTiles);

    expect(result.word).toBe('X');
    expect(result.isValid).toBe(false); // Single letter is invalid
  });

  it('should handle tiles with bonuses', () => {
    const selectedTiles: Tile[] = [
      createTestTile('A', 1, 'green'),
      createTestTile('B', 2),
    ];

    const result = calculateWordState(selectedTiles);

    expect(result.word).toBe('AB');
    expect(result.isValid).toBe(true);
    // Score calculation should include bonuses
    expect(result.score.bonuses).toBeDefined();
  });

  it('should be pure function (same input = same output)', () => {
    const selectedTiles: Tile[] = [
      createTestTile('T', 1),
      createTestTile('E', 1),
      createTestTile('S', 1),
      createTestTile('T', 1),
    ];

    const result1 = calculateWordState(selectedTiles);
    const result2 = calculateWordState(selectedTiles);

    expect(result1).toEqual(result2);
  });
});

