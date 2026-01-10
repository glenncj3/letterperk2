import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTodayUTC, formatUTCDateString, dateToSeed } from './seedGenerator';
import { GameInitializer } from '../services/GameInitializer';
import { MockPuzzleRepository } from '../repositories/mock/MockPuzzleRepository';

/**
 * Critical test: Simulates what will happen tomorrow at EST midnight.
 * This test ensures the puzzle reset will work correctly.
 */
describe('Tomorrow Reset Simulation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should correctly reset puzzle at EST midnight tomorrow', async () => {
    // Use a fixed date for reliable testing: Jan 15, 2025
    const testYear = 2025;
    const testMonth = 1;
    const testDay = 15;
    
    // Test 1: Just before EST midnight (04:59:59 UTC in winter)
    const beforeMidnight = new Date(Date.UTC(testYear, testMonth - 1, testDay, 4, 59, 59));
    vi.setSystemTime(beforeMidnight);
    
    const today1 = getTodayUTC();
    const date1 = formatUTCDateString(today1);
    const seed1 = dateToSeed(today1);
    
    // Should still be Jan 14 (previous day)
    expect(date1).toBe('2025-01-14');
    expect(seed1).toBeGreaterThanOrEqual(100000);
    expect(seed1).toBeLessThanOrEqual(999999);

    // Test 2: Exactly at EST midnight (05:00:00 UTC)
    const atMidnight = new Date(Date.UTC(testYear, testMonth - 1, testDay, 5, 0, 0));
    vi.setSystemTime(atMidnight);
    
    const today2 = getTodayUTC();
    const date2 = formatUTCDateString(today2);
    const seed2 = dateToSeed(today2);
    
    // Should be Jan 15 (new day)
    expect(date2).toBe('2025-01-15');
    expect(seed2).toBeGreaterThanOrEqual(100000);
    expect(seed2).toBeLessThanOrEqual(999999);
    expect(seed2).not.toBe(seed1); // Should be different seed

    // Test 3: Just after EST midnight (05:00:01 UTC)
    const afterMidnight = new Date(Date.UTC(testYear, testMonth - 1, testDay, 5, 0, 1));
    vi.setSystemTime(afterMidnight);
    
    const today3 = getTodayUTC();
    const date3 = formatUTCDateString(today3);
    const seed3 = dateToSeed(today3);
    
    // Should still be Jan 15
    expect(date3).toBe(date2);
    expect(seed3).toBe(seed2);

    // Test 4: Integration test with GameInitializer
    const repo = new MockPuzzleRepository();
    
    // Before midnight - should load Jan 14's puzzle
    vi.setSystemTime(beforeMidnight);
    const setup1 = await new GameInitializer(repo).initialize('daily');
    expect(setup1.date).toBe('2025-01-14');
    expect(setup1.seed).toBe(111425);
    
    // At midnight - should load Jan 15's puzzle
    vi.setSystemTime(atMidnight);
    const setup2 = await new GameInitializer(repo).initialize('daily');
    expect(setup2.date).toBe('2025-01-15');
    expect(setup2.seed).toBe(111525);
    expect(setup2.seed).not.toBe(setup1.seed);
    
    // After midnight - should still load Jan 15's puzzle
    vi.setSystemTime(afterMidnight);
    const setup3 = await new GameInitializer(repo).initialize('daily');
    expect(setup3.date).toBe('2025-01-15');
    expect(setup3.seed).toBe(111525);
  });

  it('should handle EST midnight reset consistently across multiple calls', () => {
    // Test that multiple calls at the same time produce the same result
    const testTimes = [
      new Date('2025-01-15T05:00:00Z'), // EST midnight
      new Date('2025-07-15T04:00:00Z'), // EDT midnight
      new Date('2025-12-31T05:00:00Z'), // EST midnight on year boundary
    ];

    testTimes.forEach(testTime => {
      vi.setSystemTime(testTime);
      
      const results = [];
      for (let i = 0; i < 10; i++) {
        const today = getTodayUTC();
        results.push({
          date: formatUTCDateString(today),
          seed: dateToSeed(today),
        });
      }
      
      // All results should be identical
      const first = results[0];
      results.forEach(result => {
        expect(result.date).toBe(first.date);
        expect(result.seed).toBe(first.seed);
      });
    });
  });
});

/**
 * Helper function to determine if a date is in daylight saving time for EST/EDT
 */
function isDaylightSavingTime(date: Date): boolean {
  // DST in US Eastern Time typically runs from second Sunday in March
  // to first Sunday in November
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  
  // Before March or after November = EST
  if (month < 3 || month > 11) {
    return false;
  }
  
  // March through October = EDT (except possibly first Sunday of March and last Sunday of October)
  if (month > 3 && month < 11) {
    return true;
  }
  
  // For March and November, need to check specific dates
  // This is a simplified check - in practice, DST rules can change
  // But for testing purposes, this should work for most cases
  if (month === 3) {
    // After second Sunday in March
    const day = date.getDate();
    return day >= 8; // Simplified: assume second Sunday is around day 8-14
  }
  
  if (month === 11) {
    // Before first Sunday in November
    const day = date.getDate();
    return day < 7; // Simplified: assume first Sunday is around day 1-7
  }
  
  return false;
}

