import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dateToSeed, getTodayUTC, formatUTCDateString } from './seedGenerator';

describe('seedGenerator - UTC functions', () => {
  beforeEach(() => {
    // Mock Date to ensure consistent testing
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getTodayUTC', () => {
    it('should return current UTC date', () => {
      // Set a specific UTC time: 2025-01-15 12:00:00 UTC
      const mockDate = new Date('2025-01-15T12:00:00Z');
      vi.setSystemTime(mockDate);

      const today = getTodayUTC();
      expect(today.toISOString()).toBe('2025-01-15T12:00:00.000Z');
    });

    it('should return correct date at midnight UTC', () => {
      const mockDate = new Date('2025-01-15T00:00:00Z');
      vi.setSystemTime(mockDate);

      const today = getTodayUTC();
      expect(today.toISOString()).toBe('2025-01-15T00:00:00.000Z');
    });

    it('should return correct date just before midnight UTC', () => {
      const mockDate = new Date('2025-01-15T23:59:59Z');
      vi.setSystemTime(mockDate);

      const today = getTodayUTC();
      expect(today.toISOString()).toBe('2025-01-15T23:59:59.000Z');
    });

    it('should handle date boundaries correctly', () => {
      // Test at 00:00:01 UTC (should still be same day)
      const mockDate = new Date('2025-01-15T00:00:01Z');
      vi.setSystemTime(mockDate);

      const today = getTodayUTC();
      expect(today.getUTCDate()).toBe(15);
      expect(today.getUTCMonth()).toBe(0); // January is 0
      expect(today.getUTCFullYear()).toBe(2025);
    });
  });

  describe('formatUTCDateString', () => {
    it('should format UTC date as YYYY-MM-DD', () => {
      const date = new Date('2025-01-15T12:00:00Z');
      const formatted = formatUTCDateString(date);
      expect(formatted).toBe('2025-01-15');
    });

    it('should format single digit months and days with leading zeros', () => {
      const date = new Date('2025-01-05T12:00:00Z');
      const formatted = formatUTCDateString(date);
      expect(formatted).toBe('2025-01-05');
    });

    it('should format correctly at year boundaries', () => {
      const date = new Date('2024-12-31T23:59:59Z');
      const formatted = formatUTCDateString(date);
      expect(formatted).toBe('2024-12-31');
    });

    it('should format correctly at month boundaries', () => {
      const date = new Date('2025-02-01T00:00:00Z');
      const formatted = formatUTCDateString(date);
      expect(formatted).toBe('2025-02-01');
    });

    it('should use UTC date components, not local time', () => {
      // Create a date that would be different in PST
      // 2025-01-15 08:00:00 UTC = 2025-01-15 00:00:00 PST
      // But we want UTC date, so should be 2025-01-15
      const date = new Date('2025-01-15T08:00:00Z');
      const formatted = formatUTCDateString(date);
      expect(formatted).toBe('2025-01-15');
    });
  });

  describe('dateToSeed', () => {
    it('should generate seed from UTC date in MMDDYY format', () => {
      const date = new Date('2025-01-15T12:00:00Z');
      const seed = dateToSeed(date);
      expect(seed).toBe(11525); // 01-15-25
    });

    it('should generate seed with correct month padding', () => {
      const date = new Date('2025-12-15T12:00:00Z');
      const seed = dateToSeed(date);
      expect(seed).toBe(121525); // 12-15-25
    });

    it('should generate seed with correct day padding', () => {
      const date = new Date('2025-01-05T12:00:00Z');
      const seed = dateToSeed(date);
      expect(seed).toBe(10525); // 01-05-25
    });

    it('should use UTC date components, not local time', () => {
      // Test that it uses UTC month/day, not local
      const date = new Date('2025-01-15T08:00:00Z');
      const seed = dateToSeed(date);
      expect(seed).toBe(11525); // Should be based on UTC date (01-15), not local
    });

    it('should generate same seed for same UTC date regardless of time', () => {
      const date1 = new Date('2025-01-15T00:00:00Z');
      const date2 = new Date('2025-01-15T23:59:59Z');
      const seed1 = dateToSeed(date1);
      const seed2 = dateToSeed(date2);
      expect(seed1).toBe(seed2);
      expect(seed1).toBe(11525);
    });

    it('should generate different seeds for different dates', () => {
      const date1 = new Date('2025-01-15T12:00:00Z');
      const date2 = new Date('2025-01-16T12:00:00Z');
      const seed1 = dateToSeed(date1);
      const seed2 = dateToSeed(date2);
      expect(seed1).not.toBe(seed2);
      expect(seed1).toBe(11525);
      expect(seed2).toBe(11625);
    });
  });

  describe('Integration: getTodayUTC + formatUTCDateString + dateToSeed', () => {
    it('should produce consistent results when used together', () => {
      const mockDate = new Date('2025-01-15T12:34:56Z');
      vi.setSystemTime(mockDate);

      const today = getTodayUTC();
      const dateString = formatUTCDateString(today);
      const seed = dateToSeed(today);

      expect(dateString).toBe('2025-01-15');
      expect(seed).toBe(11525);
    });

    it('should produce same date string and seed for all times on same UTC day', () => {
      const times = [
        '2025-01-15T00:00:00Z',
        '2025-01-15T12:00:00Z',
        '2025-01-15T23:59:59Z',
      ];

      const results = times.map(time => {
        vi.setSystemTime(new Date(time));
        const today = getTodayUTC();
        return {
          dateString: formatUTCDateString(today),
          seed: dateToSeed(today),
        };
      });

      // All should have same date string and seed
      expect(results[0].dateString).toBe('2025-01-15');
      expect(results[0].seed).toBe(11525);
      expect(results[1].dateString).toBe(results[0].dateString);
      expect(results[1].seed).toBe(results[0].seed);
      expect(results[2].dateString).toBe(results[0].dateString);
      expect(results[2].seed).toBe(results[0].seed);
    });

    it('should produce different date string and seed for different UTC days', () => {
      const date1 = new Date('2025-01-15T23:59:59Z');
      const date2 = new Date('2025-01-16T00:00:00Z');

      vi.setSystemTime(date1);
      const today1 = getTodayUTC();
      const dateString1 = formatUTCDateString(today1);
      const seed1 = dateToSeed(today1);

      vi.setSystemTime(date2);
      const today2 = getTodayUTC();
      const dateString2 = formatUTCDateString(today2);
      const seed2 = dateToSeed(today2);

      expect(dateString1).toBe('2025-01-15');
      expect(dateString2).toBe('2025-01-16');
      expect(seed1).toBe(11525);
      expect(seed2).toBe(11625);
    });
  });
});

