import { describe, it, expect, beforeEach } from 'vitest';
import { MockPuzzleRepository } from './MockPuzzleRepository';
import { generateGameConfiguration } from '../../utils/seedGenerator';

vi.mock('../../utils/seedGenerator', () => ({
  generateGameConfiguration: vi.fn((seed: number) => ({
    columnSequences: [[], [], []],
    bonusConfig: [],
    effects: [],
    seed,
  })),
}));

describe('MockPuzzleRepository', () => {
  let repository: MockPuzzleRepository;

  beforeEach(() => {
    repository = new MockPuzzleRepository();
  });

  describe('loadDailyPuzzle', () => {
    it('should generate puzzle if not found', async () => {
      const result = await repository.loadDailyPuzzle('2025-01-15', 11525);

      expect(result).toBeDefined();
      expect(generateGameConfiguration).toHaveBeenCalledWith(11525);
      expect(repository.hasPuzzle('2025-01-15', 11525)).toBe(true);
    });

    it('should return cached puzzle if already loaded', async () => {
      const first = await repository.loadDailyPuzzle('2025-01-15', 11525);
      vi.clearAllMocks();

      const second = await repository.loadDailyPuzzle('2025-01-15', 11525);

      expect(second).toBe(first);
      expect(generateGameConfiguration).not.toHaveBeenCalled();
    });

    it('should handle different dates separately', async () => {
      await repository.loadDailyPuzzle('2025-01-15', 11525);
      await repository.loadDailyPuzzle('2025-01-16', 11625);

      expect(repository.getPuzzleCount()).toBe(2);
      expect(repository.hasPuzzle('2025-01-15', 11525)).toBe(true);
      expect(repository.hasPuzzle('2025-01-16', 11625)).toBe(true);
    });
  });

  describe('saveDailyPuzzle', () => {
    it('should save puzzle', async () => {
      const config = generateGameConfiguration(11525);
      await repository.saveDailyPuzzle('2025-01-15', 11525, config);

      expect(repository.hasPuzzle('2025-01-15', 11525)).toBe(true);
    });

    it('should overwrite existing puzzle', async () => {
      const config1 = generateGameConfiguration(11525);
      const config2 = generateGameConfiguration(11526);

      await repository.saveDailyPuzzle('2025-01-15', 11525, config1);
      await repository.saveDailyPuzzle('2025-01-15', 11525, config2);

      const loaded = await repository.loadDailyPuzzle('2025-01-15', 11525);
      expect(loaded).toBe(config2);
    });
  });

  describe('test helpers', () => {
    it('should clear all puzzles', async () => {
      await repository.loadDailyPuzzle('2025-01-15', 11525);
      expect(repository.getPuzzleCount()).toBe(1);

      repository.clear();
      expect(repository.getPuzzleCount()).toBe(0);
    });
  });
});

