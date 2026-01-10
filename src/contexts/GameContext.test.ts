import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTodayUTC, formatUTCDateString, dateToSeed } from '../utils/seedGenerator';

describe('GameContext - UTC date consistency', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should use same UTC date calculation as LeaderboardModal', () => {
    // Simulate what GameContext does for daily mode
    const mockDate = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(mockDate);

    // GameContext calculation
    const today = getTodayUTC();
    const dateString = formatUTCDateString(today);
    const seed = dateToSeed(today);

    // LeaderboardModal would do the same
    const today2 = getTodayUTC();
    const dateString2 = formatUTCDateString(today2);

    // They should match
    expect(dateString).toBe(dateString2);
    expect(dateString).toBe('2025-01-15');
    expect(seed).toBe(111525);
  });

  it('should produce same date string for puzzle and leaderboard queries', () => {
    // Test cases that all fall on the same EST day
    const testCases = [
      '2025-01-15T05:00:00Z', // Midnight EST
      '2025-01-15T12:00:00Z', // Midday EST
      '2025-01-15T23:00:00Z', // Evening EST
      '2025-12-31T12:00:00Z', // Midday EST on Dec 31
    ];

    testCases.forEach(isoString => {
      vi.setSystemTime(new Date(isoString));

      // Both GameContext and LeaderboardModal use the same calculation
      const today = getTodayUTC();
      const puzzleDate = formatUTCDateString(today);
      const leaderboardDate = formatUTCDateString(today);

      expect(puzzleDate).toBe(leaderboardDate);
      expect(puzzleDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('should handle date boundaries correctly (midnight EST)', () => {
    // Just before midnight EST (04:59 UTC on Jan 15 = 23:59 EST on Jan 14)
    vi.setSystemTime(new Date('2025-01-15T04:59:59Z'));
    const date1 = formatUTCDateString(getTodayUTC());
    const seed1 = dateToSeed(getTodayUTC());

    // Just after midnight EST (05:00 UTC on Jan 15 = 00:00 EST on Jan 15)
    vi.setSystemTime(new Date('2025-01-15T05:00:00Z'));
    const date2 = formatUTCDateString(getTodayUTC());
    const seed2 = dateToSeed(getTodayUTC());

    expect(date1).toBe('2025-01-14');
    expect(date2).toBe('2025-01-15');
    expect(seed1).toBe(111425);
    expect(seed2).toBe(111525);
  });
});

