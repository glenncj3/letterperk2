import { describe, it, expect, beforeEach } from 'vitest';
import { MockGameResultRepository, GameResult } from './MockGameResultRepository';

describe('MockGameResultRepository', () => {
  let repository: MockGameResultRepository;

  beforeEach(() => {
    repository = new MockGameResultRepository();
  });

  describe('logGameResult', () => {
    it('should store game result', async () => {
      const result: GameResult = {
        puzzleDate: '2025-01-15',
        seed: 11525,
        totalScore: 100,
        wordCount: 4,
        mode: 'daily',
        words: [
          { word: 'HELLO', score: 25, index: 1, bonuses: [], bonusTilesCount: 0 },
        ],
      };

      await repository.logGameResult(result);

      expect(repository.getResultCount()).toBe(1);
      expect(repository.getResults()[0]).toEqual(result);
    });

    it('should store multiple results', async () => {
      const result1: GameResult = {
        puzzleDate: '2025-01-15',
        seed: 11525,
        totalScore: 100,
        wordCount: 4,
        mode: 'daily',
        words: [],
      };

      const result2: GameResult = {
        puzzleDate: '2025-01-15',
        seed: 11525,
        totalScore: 150,
        wordCount: 4,
        mode: 'daily',
        words: [],
      };

      await repository.logGameResult(result1);
      await repository.logGameResult(result2);

      expect(repository.getResultCount()).toBe(2);
    });
  });

  describe('getLeaderboard', () => {
    it('should return empty array when no results', async () => {
      const leaderboard = await repository.getLeaderboard('daily', '2025-01-15');
      expect(leaderboard).toEqual([]);
    });

    it('should filter by mode and date', async () => {
      await repository.logGameResult({
        puzzleDate: '2025-01-15',
        seed: 11525,
        totalScore: 100,
        wordCount: 4,
        mode: 'daily',
        words: [],
      });

      await repository.logGameResult({
        puzzleDate: '2025-01-16',
        seed: 11625,
        totalScore: 200,
        wordCount: 4,
        mode: 'daily',
        words: [],
      });

      await repository.logGameResult({
        puzzleDate: '2025-01-15',
        seed: 11525,
        totalScore: 150,
        wordCount: 4,
        mode: 'casual',
        words: [],
      });

      const daily = await repository.getLeaderboard('daily', '2025-01-15');
      expect(daily).toHaveLength(1);
      expect(daily[0].total_score).toBe(100);
    });

    it('should sort by score descending', async () => {
      await repository.logGameResult({
        puzzleDate: '2025-01-15',
        seed: 11525,
        totalScore: 100,
        wordCount: 4,
        mode: 'daily',
        words: [],
      });

      await repository.logGameResult({
        puzzleDate: '2025-01-15',
        seed: 11525,
        totalScore: 300,
        wordCount: 4,
        mode: 'daily',
        words: [],
      });

      await repository.logGameResult({
        puzzleDate: '2025-01-15',
        seed: 11525,
        totalScore: 200,
        wordCount: 4,
        mode: 'daily',
        words: [],
      });

      const leaderboard = await repository.getLeaderboard('daily', '2025-01-15');
      expect(leaderboard).toHaveLength(3);
      expect(leaderboard[0].total_score).toBe(300);
      expect(leaderboard[1].total_score).toBe(200);
      expect(leaderboard[2].total_score).toBe(100);
    });

    it('should deduplicate by score', async () => {
      await repository.logGameResult({
        puzzleDate: '2025-01-15',
        seed: 11525,
        totalScore: 100,
        wordCount: 4,
        mode: 'daily',
        words: [],
        startedAt: '2025-01-15T10:00:00Z',
      });

      await repository.logGameResult({
        puzzleDate: '2025-01-15',
        seed: 11525,
        totalScore: 100,
        wordCount: 4,
        mode: 'daily',
        words: [],
        startedAt: '2025-01-15T11:00:00Z',
      });

      const leaderboard = await repository.getLeaderboard('daily', '2025-01-15');
      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0].total_score).toBe(100);
    });

    it('should limit to top 10', async () => {
      // Add 15 results
      for (let i = 1; i <= 15; i++) {
        await repository.logGameResult({
          puzzleDate: '2025-01-15',
          seed: 11525,
          totalScore: i * 10,
          wordCount: 4,
          mode: 'daily',
          words: [],
        });
      }

      const leaderboard = await repository.getLeaderboard('daily', '2025-01-15');
      expect(leaderboard).toHaveLength(10);
      expect(leaderboard[0].total_score).toBe(150);
      expect(leaderboard[9].total_score).toBe(60);
    });
  });

  describe('test helpers', () => {
    it('should clear all results', async () => {
      await repository.logGameResult({
        puzzleDate: '2025-01-15',
        seed: 11525,
        totalScore: 100,
        wordCount: 4,
        mode: 'daily',
        words: [],
      });

      repository.clear();
      expect(repository.getResultCount()).toBe(0);
    });
  });
});

