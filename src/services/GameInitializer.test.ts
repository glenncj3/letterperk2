import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameInitializer } from './GameInitializer';
import { GameMode } from '../types/game';
import { MockPuzzleRepository } from '../repositories/mock/MockPuzzleRepository';
import { generateGameConfiguration, seededRandom, getTodayUTC, dateToSeed, formatUTCDateString } from '../utils/seedGenerator';
import { assignBonusesToSequences } from '../utils/bonusUtils';
import { createTile } from '../utils/tileUtils';
import { GRID_COLS, TILES_PER_COLUMN } from '../constants/gameConstants';

vi.mock('../utils/seedGenerator');
vi.mock('../utils/bonusUtils');
vi.mock('../utils/tileUtils');

describe('GameInitializer', () => {
  let initializer: GameInitializer;
  let mockPuzzleRepo: MockPuzzleRepository;

  beforeEach(() => {
    mockPuzzleRepo = new MockPuzzleRepository();
    initializer = new GameInitializer(mockPuzzleRepo);
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize daily mode game', async () => {
      const mockDate = new Date('2025-01-15T12:00:00Z');
      vi.mocked(getTodayUTC).mockReturnValue(mockDate);
      vi.mocked(formatUTCDateString).mockReturnValue('2025-01-15');
      vi.mocked(dateToSeed).mockReturnValue(11525);
      vi.mocked(generateGameConfiguration).mockReturnValue({
        columnSequences: [[], [], []],
        bonusConfig: [],
        effects: [],
      });
      vi.mocked(seededRandom).mockReturnValue(() => 0.5);
      // Mock sequences with enough tiles for grid (3 rows per column)
      vi.mocked(assignBonusesToSequences).mockReturnValue([
        [{ letter: 'A', points: 1 }, { letter: 'B', points: 2 }, { letter: 'C', points: 3 }],
        [{ letter: 'D', points: 4 }, { letter: 'E', points: 5 }, { letter: 'F', points: 6 }],
        [{ letter: 'G', points: 7 }, { letter: 'H', points: 8 }, { letter: 'I', points: 9 }],
      ]);
      vi.mocked(createTile).mockImplementation((letter, points, row, col, bonusType) => ({
        id: `${letter}-${row}-${col}`,
        letter,
        points,
        row,
        col,
        bonusType,
      }));

      const result = await initializer.initialize('daily');

      expect(result.date).toBe('2025-01-15');
      expect(result.seed).toBe(11525);
      expect(result.configuration).toBeDefined();
      expect(result.tiles).toBeDefined();
      expect(result.columnSequences).toBeDefined();
      expect(result.randomFunc).toBeDefined();
    });

    it('should initialize casual mode game', async () => {
      const mockDate = new Date('2025-01-15T12:00:00Z');
      vi.mocked(getTodayUTC).mockReturnValue(mockDate);
      vi.mocked(formatUTCDateString).mockReturnValue('2025-01-15');
      vi.mocked(generateGameConfiguration).mockReturnValue({
        columnSequences: [[], [], []],
        bonusConfig: [],
        effects: [],
      });
      vi.mocked(seededRandom).mockReturnValue(() => 0.5);
      // Mock sequences with enough tiles for grid (3 rows per column)
      vi.mocked(assignBonusesToSequences).mockReturnValue([
        [{ letter: 'A', points: 1 }, { letter: 'B', points: 2 }, { letter: 'C', points: 3 }],
        [{ letter: 'D', points: 4 }, { letter: 'E', points: 5 }, { letter: 'F', points: 6 }],
        [{ letter: 'G', points: 7 }, { letter: 'H', points: 8 }, { letter: 'I', points: 9 }],
      ]);
      vi.mocked(createTile).mockImplementation((letter, points, row, col) => ({
        id: `${letter}-${row}-${col}`,
        letter,
        points,
        row,
        col,
      }));

      const result = await initializer.initialize('casual');

      expect(result.date).toBe('2025-01-15');
      expect(result.seed).toBeGreaterThanOrEqual(100000);
      expect(result.seed).toBeLessThanOrEqual(999999);
      expect(result.configuration).toBeDefined();
    });

    it('should load puzzle from repository for daily mode', async () => {
      const mockDate = new Date('2025-01-15T12:00:00Z');
      vi.mocked(getTodayUTC).mockReturnValue(mockDate);
      vi.mocked(formatUTCDateString).mockReturnValue('2025-01-15');
      vi.mocked(dateToSeed).mockReturnValue(11525);

      const mockConfig = {
        columnSequences: [[{ letter: 'A', points: 1 }], [], []],
        bonusConfig: [],
        effects: [],
      };

      await mockPuzzleRepo.saveDailyPuzzle('2025-01-15', 11525, mockConfig);

      vi.mocked(seededRandom).mockReturnValue(() => 0.5);
      // Mock sequences with enough tiles for grid (3 rows per column)
      vi.mocked(assignBonusesToSequences).mockReturnValue([
        [{ letter: 'A', points: 1 }, { letter: 'B', points: 2 }, { letter: 'C', points: 3 }],
        [{ letter: 'D', points: 4 }, { letter: 'E', points: 5 }, { letter: 'F', points: 6 }],
        [{ letter: 'G', points: 7 }, { letter: 'H', points: 8 }, { letter: 'I', points: 9 }],
      ]);
      vi.mocked(createTile).mockImplementation((letter, points, row, col) => ({
        id: `${letter}-${row}-${col}`,
        letter,
        points,
        row,
        col,
      }));

      const result = await initializer.initialize('daily');

      expect(mockPuzzleRepo.hasPuzzle('2025-01-15', 11525)).toBe(true);
    });

    it('should generate tiles for all grid positions', async () => {
      const mockDate = new Date('2025-01-15T12:00:00Z');
      vi.mocked(getTodayUTC).mockReturnValue(mockDate);
      vi.mocked(formatUTCDateString).mockReturnValue('2025-01-15');
      vi.mocked(dateToSeed).mockReturnValue(11525);
      vi.mocked(generateGameConfiguration).mockReturnValue({
        columnSequences: [
          [{ letter: 'A', points: 1 }, { letter: 'B', points: 2 }, { letter: 'C', points: 3 }],
          [{ letter: 'D', points: 4 }, { letter: 'E', points: 5 }, { letter: 'F', points: 6 }],
          [{ letter: 'G', points: 7 }, { letter: 'H', points: 8 }, { letter: 'I', points: 9 }],
        ],
        bonusConfig: [],
        effects: [],
      });
      vi.mocked(seededRandom).mockReturnValue(() => 0.5);
      vi.mocked(assignBonusesToSequences).mockImplementation((seqs) => seqs);
      vi.mocked(createTile).mockImplementation((letter, points, row, col) => ({
        id: `${letter}-${row}-${col}`,
        letter,
        points,
        row,
        col,
      }));

      const result = await initializer.initialize('daily');

      // Should have 9 tiles (3 columns * 3 rows)
      expect(result.tiles).toHaveLength(9);
      expect(createTile).toHaveBeenCalledTimes(9);
    });
  });
});

