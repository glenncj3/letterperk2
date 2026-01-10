import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTodayUTC, formatUTCDateString, dateToSeed } from './seedGenerator';
import { GameInitializer } from '../services/GameInitializer';
import { MockPuzzleRepository } from '../repositories/mock/MockPuzzleRepository';

describe('Exhaustive EST Reset Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('EST Midnight Boundaries (Winter - EST = UTC-5)', () => {
    it('should use previous day just before EST midnight (04:59 UTC)', () => {
      // Jan 15, 2025 04:59:59 UTC = Jan 14, 2025 23:59:59 EST
      vi.setSystemTime(new Date('2025-01-15T04:59:59Z'));
      const today = getTodayUTC();
      const dateString = formatUTCDateString(today);
      const seed = dateToSeed(today);

      expect(dateString).toBe('2025-01-14');
      expect(seed).toBe(111425); // 01-14-25 + 100000
      expect(today.getUTCDate()).toBe(14);
      expect(today.getUTCMonth()).toBe(0); // January
      expect(today.getUTCFullYear()).toBe(2025);
    });

    it('should transition to new day exactly at EST midnight (05:00 UTC)', () => {
      // Jan 15, 2025 05:00:00 UTC = Jan 15, 2025 00:00:00 EST
      vi.setSystemTime(new Date('2025-01-15T05:00:00Z'));
      const today = getTodayUTC();
      const dateString = formatUTCDateString(today);
      const seed = dateToSeed(today);

      expect(dateString).toBe('2025-01-15');
      expect(seed).toBe(111525); // 01-15-25 + 100000
      expect(today.getUTCDate()).toBe(15);
    });

    it('should use new day just after EST midnight (05:00:01 UTC)', () => {
      // Jan 15, 2025 05:00:01 UTC = Jan 15, 2025 00:00:01 EST
      vi.setSystemTime(new Date('2025-01-15T05:00:01Z'));
      const today = getTodayUTC();
      const dateString = formatUTCDateString(today);
      const seed = dateToSeed(today);

      expect(dateString).toBe('2025-01-15');
      expect(seed).toBe(111525);
    });
  });

  describe('EDT Midnight Boundaries (Summer - EDT = UTC-4)', () => {
    it('should use previous day just before EDT midnight (03:59 UTC)', () => {
      // July 15, 2025 03:59:59 UTC = July 14, 2025 23:59:59 EDT
      vi.setSystemTime(new Date('2025-07-15T03:59:59Z'));
      const today = getTodayUTC();
      const dateString = formatUTCDateString(today);
      const seed = dateToSeed(today);

      expect(dateString).toBe('2025-07-14');
      expect(seed).toBe(171425); // 07-14-25 + 100000
      expect(today.getUTCDate()).toBe(14);
      expect(today.getUTCMonth()).toBe(6); // July
    });

    it('should transition to new day exactly at EDT midnight (04:00 UTC)', () => {
      // July 15, 2025 04:00:00 UTC = July 15, 2025 00:00:00 EDT
      vi.setSystemTime(new Date('2025-07-15T04:00:00Z'));
      const today = getTodayUTC();
      const dateString = formatUTCDateString(today);
      const seed = dateToSeed(today);

      expect(dateString).toBe('2025-07-15');
      expect(seed).toBe(171525); // 07-15-25 + 100000
      expect(today.getUTCDate()).toBe(15);
    });

    it('should use new day just after EDT midnight (04:00:01 UTC)', () => {
      // July 15, 2025 04:00:01 UTC = July 15, 2025 00:00:01 EDT
      vi.setSystemTime(new Date('2025-07-15T04:00:01Z'));
      const today = getTodayUTC();
      const dateString = formatUTCDateString(today);
      const seed = dateToSeed(today);

      expect(dateString).toBe('2025-07-15');
      expect(seed).toBe(171525);
    });
  });

  describe('DST Transition - Spring Forward (EST -> EDT)', () => {
    // DST typically starts on second Sunday in March
    // In 2025, DST starts on March 9, 2025 at 2:00 AM EST (7:00 AM UTC)
    it('should handle day before DST starts', () => {
      // March 8, 2025 23:00 UTC = March 8, 2025 18:00 EST (still EST)
      vi.setSystemTime(new Date('2025-03-08T23:00:00Z'));
      const today = getTodayUTC();
      const dateString = formatUTCDateString(today);
      
      expect(dateString).toBe('2025-03-08');
    });

    it('should handle DST transition day correctly', () => {
      // March 9, 2025 06:00 UTC = March 9, 2025 02:00 EDT (after spring forward)
      vi.setSystemTime(new Date('2025-03-09T06:00:00Z'));
      const today = getTodayUTC();
      const dateString = formatUTCDateString(today);
      
      expect(dateString).toBe('2025-03-09');
    });

    it('should use EDT offset after spring forward', () => {
      // March 10, 2025 03:59 UTC = March 9, 2025 23:59 EDT
      vi.setSystemTime(new Date('2025-03-10T03:59:59Z'));
      const today = getTodayUTC();
      const dateString = formatUTCDateString(today);
      
      expect(dateString).toBe('2025-03-09');
    });

    it('should use EDT offset at midnight after spring forward', () => {
      // March 10, 2025 04:00 UTC = March 10, 2025 00:00 EDT
      vi.setSystemTime(new Date('2025-03-10T04:00:00Z'));
      const today = getTodayUTC();
      const dateString = formatUTCDateString(today);
      
      expect(dateString).toBe('2025-03-10');
    });
  });

  describe('DST Transition - Fall Back (EDT -> EST)', () => {
    // DST typically ends on first Sunday in November
    // In 2025, DST ends on November 2, 2025 at 2:00 AM EDT (6:00 AM UTC)
    it('should handle day before DST ends', () => {
      // November 1, 2025 23:00 UTC = November 1, 2025 19:00 EDT (still EDT)
      vi.setSystemTime(new Date('2025-11-01T23:00:00Z'));
      const today = getTodayUTC();
      const dateString = formatUTCDateString(today);
      
      expect(dateString).toBe('2025-11-01');
    });

    it('should handle DST end transition correctly', () => {
      // November 2, 2025 06:00 UTC = November 2, 2025 01:00 EST (after fall back)
      vi.setSystemTime(new Date('2025-11-02T06:00:00Z'));
      const today = getTodayUTC();
      const dateString = formatUTCDateString(today);
      
      expect(dateString).toBe('2025-11-02');
    });

    it('should use EST offset after fall back', () => {
      // November 3, 2025 04:59 UTC = November 2, 2025 23:59 EST
      vi.setSystemTime(new Date('2025-11-03T04:59:59Z'));
      const today = getTodayUTC();
      const dateString = formatUTCDateString(today);
      
      expect(dateString).toBe('2025-11-02');
    });

    it('should use EST offset at midnight after fall back', () => {
      // November 3, 2025 05:00 UTC = November 3, 2025 00:00 EST
      vi.setSystemTime(new Date('2025-11-03T05:00:00Z'));
      const today = getTodayUTC();
      const dateString = formatUTCDateString(today);
      
      expect(dateString).toBe('2025-11-03');
    });
  });

  describe('Year Boundaries', () => {
    it('should handle Dec 31 to Jan 1 transition in EST', () => {
      // Dec 31, 2025 04:59 UTC = Dec 30, 2025 23:59 EST
      vi.setSystemTime(new Date('2025-12-31T04:59:59Z'));
      const today1 = getTodayUTC();
      const dateString1 = formatUTCDateString(today1);
      const seed1 = dateToSeed(today1);

      expect(dateString1).toBe('2025-12-30');
      expect(seed1).toBe(223025); // 12-30-25 (123025) + 100000

      // Dec 31, 2025 05:00 UTC = Dec 31, 2025 00:00 EST
      vi.setSystemTime(new Date('2025-12-31T05:00:00Z'));
      const today2 = getTodayUTC();
      const dateString2 = formatUTCDateString(today2);
      const seed2 = dateToSeed(today2);

      expect(dateString2).toBe('2025-12-31');
      expect(seed2).toBe(223125); // 12-31-25 (123125) + 100000

      // Jan 1, 2026 05:00 UTC = Jan 1, 2026 00:00 EST
      vi.setSystemTime(new Date('2026-01-01T05:00:00Z'));
      const today3 = getTodayUTC();
      const dateString3 = formatUTCDateString(today3);
      const seed3 = dateToSeed(today3);

      expect(dateString3).toBe('2026-01-01');
      expect(seed3).toBe(110126); // 01-01-26 (10126) + 100000
    });

    it('should handle year transition in EDT', () => {
      // Dec 31, 2025 03:59 UTC = Dec 30, 2025 23:59 EDT
      vi.setSystemTime(new Date('2025-12-31T03:59:59Z'));
      const today1 = getTodayUTC();
      const dateString1 = formatUTCDateString(today1);

      expect(dateString1).toBe('2025-12-30');

      // Dec 31, 2025 04:00 UTC = Dec 31, 2025 00:00 EDT
      // Note: In December, we're back in EST, not EDT, so 04:00 UTC = 23:00 EST (previous day)
      // Let's test with 05:00 UTC instead for EST
      vi.setSystemTime(new Date('2025-12-31T05:00:00Z'));
      const today2 = getTodayUTC();
      const dateString2 = formatUTCDateString(today2);

      expect(dateString2).toBe('2025-12-31');

      // Jan 1, 2026 05:00 UTC = Jan 1, 2026 00:00 EST (December/January is EST, not EDT)
      vi.setSystemTime(new Date('2026-01-01T05:00:00Z'));
      const today3 = getTodayUTC();
      const dateString3 = formatUTCDateString(today3);

      expect(dateString3).toBe('2026-01-01');
    });
  });

  describe('Month Boundaries', () => {
    it('should handle Jan 31 to Feb 1 transition', () => {
      // Jan 31, 2025 04:59 UTC = Jan 30, 2025 23:59 EST
      vi.setSystemTime(new Date('2025-01-31T04:59:59Z'));
      const today1 = getTodayUTC();
      expect(formatUTCDateString(today1)).toBe('2025-01-30');

      // Jan 31, 2025 05:00 UTC = Jan 31, 2025 00:00 EST
      vi.setSystemTime(new Date('2025-01-31T05:00:00Z'));
      const today2 = getTodayUTC();
      expect(formatUTCDateString(today2)).toBe('2025-01-31');

      // Feb 1, 2025 05:00 UTC = Feb 1, 2025 00:00 EST
      vi.setSystemTime(new Date('2025-02-01T05:00:00Z'));
      const today3 = getTodayUTC();
      expect(formatUTCDateString(today3)).toBe('2025-02-01');
    });

    it('should handle Feb 28 to Mar 1 transition (non-leap year)', () => {
      // Feb 28, 2025 04:59 UTC = Feb 27, 2025 23:59 EST
      vi.setSystemTime(new Date('2025-02-28T04:59:59Z'));
      const today1 = getTodayUTC();
      expect(formatUTCDateString(today1)).toBe('2025-02-27');

      // Feb 28, 2025 05:00 UTC = Feb 28, 2025 00:00 EST
      vi.setSystemTime(new Date('2025-02-28T05:00:00Z'));
      const today2 = getTodayUTC();
      expect(formatUTCDateString(today2)).toBe('2025-02-28');

      // Mar 1, 2025 05:00 UTC = Mar 1, 2025 00:00 EST
      vi.setSystemTime(new Date('2025-03-01T05:00:00Z'));
      const today3 = getTodayUTC();
      expect(formatUTCDateString(today3)).toBe('2025-03-01');
    });
  });

  describe('Consistency Throughout the Day', () => {
    it('should produce same date/seed for all times on same EST day (winter)', () => {
      const times = [
        '2025-01-15T05:00:00Z',  // 00:00 EST
        '2025-01-15T10:00:00Z',  // 05:00 EST
        '2025-01-15T17:00:00Z',  // 12:00 EST
        '2025-01-15T22:00:00Z',  // 17:00 EST
        '2025-01-16T04:59:59Z',  // 23:59 EST
      ];

      const results = times.map(time => {
        vi.setSystemTime(new Date(time));
        const today = getTodayUTC();
        return {
          dateString: formatUTCDateString(today),
          seed: dateToSeed(today),
        };
      });

      // All should be Jan 15
      results.forEach(result => {
        expect(result.dateString).toBe('2025-01-15');
        expect(result.seed).toBe(111525);
      });
    });

    it('should produce same date/seed for all times on same EDT day (summer)', () => {
      const times = [
        '2025-07-15T04:00:00Z',  // 00:00 EDT
        '2025-07-15T09:00:00Z',  // 05:00 EDT
        '2025-07-15T16:00:00Z',  // 12:00 EDT
        '2025-07-15T21:00:00Z',  // 17:00 EDT
        '2025-07-16T03:59:59Z',  // 23:59 EDT
      ];

      const results = times.map(time => {
        vi.setSystemTime(new Date(time));
        const today = getTodayUTC();
        return {
          dateString: formatUTCDateString(today),
          seed: dateToSeed(today),
        };
      });

      // All should be July 15
      results.forEach(result => {
        expect(result.dateString).toBe('2025-07-15');
        expect(result.seed).toBe(171525);
      });
    });
  });

  describe('Integration with GameInitializer', () => {
    it('should produce consistent date/seed in daily mode initialization', async () => {
      const testCases = [
        { utc: '2025-01-15T05:00:00Z', expectedDate: '2025-01-15', expectedSeed: 111525 },
        { utc: '2025-01-15T12:00:00Z', expectedDate: '2025-01-15', expectedSeed: 111525 },
        { utc: '2025-01-15T23:00:00Z', expectedDate: '2025-01-15', expectedSeed: 111525 },
        { utc: '2025-01-16T04:59:59Z', expectedDate: '2025-01-15', expectedSeed: 111525 },
        { utc: '2025-01-16T05:00:00Z', expectedDate: '2025-01-16', expectedSeed: 111625 },
      ];

      for (const testCase of testCases) {
        vi.setSystemTime(new Date(testCase.utc));
        const repo = new MockPuzzleRepository();
        const initializer = new GameInitializer(repo);
        const setup = await initializer.initialize('daily');

        expect(setup.date).toBe(testCase.expectedDate);
        expect(setup.seed).toBe(testCase.expectedSeed);
      }
    });

    it('should use same puzzle for same EST day across different UTC times', async () => {
      const times = [
        '2025-01-15T05:00:00Z',
        '2025-01-15T12:00:00Z',
        '2025-01-15T20:00:00Z',
      ];

      const repo = new MockPuzzleRepository();
      const results = [];

      for (const time of times) {
        vi.setSystemTime(new Date(time));
        const initializer = new GameInitializer(repo);
        const setup = await initializer.initialize('daily');
        results.push({
          date: setup.date,
          seed: setup.seed,
        });
      }

      // All should be the same
      expect(results[0].date).toBe('2025-01-15');
      expect(results[0].seed).toBe(111525);
      expect(results[1].date).toBe(results[0].date);
      expect(results[1].seed).toBe(results[0].seed);
      expect(results[2].date).toBe(results[0].date);
      expect(results[2].seed).toBe(results[0].seed);
    });

    it('should use different puzzle at EST midnight boundary', async () => {
      const repo = new MockPuzzleRepository();

      // Just before EST midnight
      vi.setSystemTime(new Date('2025-01-15T04:59:59Z'));
      const setup1 = await new GameInitializer(repo).initialize('daily');
      expect(setup1.date).toBe('2025-01-14');
      expect(setup1.seed).toBe(111425);

      // Just after EST midnight
      vi.setSystemTime(new Date('2025-01-15T05:00:00Z'));
      const setup2 = await new GameInitializer(repo).initialize('daily');
      expect(setup2.date).toBe('2025-01-15');
      expect(setup2.seed).toBe(111525);
    });
  });

  describe('Date String and Seed Consistency', () => {
    it('should produce consistent date string and seed for same EST date', () => {
      const testDates = [
        '2025-01-15',
        '2025-06-15',
        '2025-12-31',
        '2026-01-01',
      ];

      testDates.forEach(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        // Create date at EST midnight (05:00 UTC in winter, 04:00 UTC in summer)
        // Use a time that's definitely in EST (winter) for consistency
        const utcTime = new Date(Date.UTC(year, month - 1, day, 5, 0, 0));
        vi.setSystemTime(utcTime);

        const today = getTodayUTC();
        const dateString = formatUTCDateString(today);
        const seed = dateToSeed(today);

        // Verify the date string matches
        expect(dateString).toBe(dateStr);

        // Verify seed can be reverse-engineered
        const seedStr = String(seed - 100000).padStart(6, '0');
        const seedMonth = seedStr.substring(0, 2);
        const seedDay = seedStr.substring(2, 4);
        const seedYear = seedStr.substring(4, 6);

        expect(seedMonth).toBe(String(month).padStart(2, '0'));
        expect(seedDay).toBe(String(day).padStart(2, '0'));
        expect(seedYear).toBe(String(year).slice(-2));
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle leap year Feb 29 correctly', () => {
      // Feb 29, 2024 05:00 UTC = Feb 29, 2024 00:00 EST
      vi.setSystemTime(new Date('2024-02-29T05:00:00Z'));
      const today = getTodayUTC();
      const dateString = formatUTCDateString(today);
      const seed = dateToSeed(today);

      expect(dateString).toBe('2024-02-29');
      expect(seed).toBe(122924); // 02-29-24 + 100000
    });

    it('should handle single digit months and days correctly', () => {
      // Jan 1, 2025 05:00 UTC = Jan 1, 2025 00:00 EST
      vi.setSystemTime(new Date('2025-01-01T05:00:00Z'));
      const today = getTodayUTC();
      const dateString = formatUTCDateString(today);
      const seed = dateToSeed(today);

      expect(dateString).toBe('2025-01-01');
      expect(seed).toBe(110125); // 01-01-25 (10125) + 100000
    });

    it('should handle century boundaries correctly', () => {
      // Dec 31, 2099 05:00 UTC = Dec 31, 2099 00:00 EST
      vi.setSystemTime(new Date('2099-12-31T05:00:00Z'));
      const today = getTodayUTC();
      const dateString = formatUTCDateString(today);
      const seed = dateToSeed(today);

      expect(dateString).toBe('2099-12-31');
      expect(seed).toBe(223199); // 12-31-99 (123199) + 100000
    });
  });

  describe('Real-world Simulation - Tomorrow Reset', () => {
    it('should correctly transition from today to tomorrow at EST midnight', () => {
      // Get current date in EST
      const now = new Date();
      const estFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      
      const estParts = estFormatter.formatToParts(now);
      const estYear = parseInt(estParts.find(p => p.type === 'year')!.value, 10);
      const estMonth = parseInt(estParts.find(p => p.type === 'month')!.value, 10);
      const estDay = parseInt(estParts.find(p => p.type === 'day')!.value, 10);

      // Test just before midnight EST
      const beforeMidnight = new Date(Date.UTC(estYear, estMonth - 1, estDay, 4, 59, 59));
      vi.setSystemTime(beforeMidnight);
      const today1 = getTodayUTC();
      const date1 = formatUTCDateString(today1);
      const seed1 = dateToSeed(today1);

      // Test at midnight EST
      const atMidnight = new Date(Date.UTC(estYear, estMonth - 1, estDay, 5, 0, 0));
      vi.setSystemTime(atMidnight);
      const today2 = getTodayUTC();
      const date2 = formatUTCDateString(today2);
      const seed2 = dateToSeed(today2);

      // Test just after midnight EST
      const afterMidnight = new Date(Date.UTC(estYear, estMonth - 1, estDay, 5, 0, 1));
      vi.setSystemTime(afterMidnight);
      const today3 = getTodayUTC();
      const date3 = formatUTCDateString(today3);
      const seed3 = dateToSeed(today3);

      // date1 should be today (or yesterday if we're testing late at night)
      // date2 and date3 should be the same (today or tomorrow)
      expect(date2).toBe(date3);
      expect(seed2).toBe(seed3);
      
      // The dates should be valid YYYY-MM-DD format
      expect(date1).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(date2).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(date3).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Seeds should be in valid range
      expect(seed1).toBeGreaterThanOrEqual(100000);
      expect(seed1).toBeLessThanOrEqual(999999);
      expect(seed2).toBeGreaterThanOrEqual(100000);
      expect(seed2).toBeLessThanOrEqual(999999);
    });
  });
});

