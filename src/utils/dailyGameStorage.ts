import { getTodayUTC, formatUTCDateString } from './seedGenerator';

export interface DailyGameResult {
  score: number;
  wordCount: number;
  playedAt: string; // ISO timestamp
  puzzleDate: string; // YYYY-MM-DD format
}

const STORAGE_KEY_PREFIX = 'daily_game_played_';
const CLEANUP_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

/**
 * Gets the storage key for a specific date
 */
function getStorageKey(date: string): string {
  return `${STORAGE_KEY_PREFIX}${date}`;
}

/**
 * Checks if a specific date's daily game has been played
 */
export function hasPlayedDaily(date: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  const key = getStorageKey(date);
  const stored = localStorage.getItem(key);
  return stored !== null;
}

/**
 * Gets the stored result for a specific date's daily game
 */
export function getDailyGameResult(date: string): DailyGameResult | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  const key = getStorageKey(date);
  const stored = localStorage.getItem(key);
  
  if (!stored) {
    return null;
  }

  try {
    const result = JSON.parse(stored) as DailyGameResult;
    // Verify the puzzle date matches
    if (result.puzzleDate === date) {
      return result;
    }
    // If date doesn't match, remove the invalid entry
    localStorage.removeItem(key);
    return null;
  } catch (error) {
    // If parsing fails, remove the corrupted entry
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Marks a date's daily game as played with score data
 */
export function markDailyAsPlayed(
  date: string,
  score: number,
  wordCount: number
): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  const key = getStorageKey(date);
  const result: DailyGameResult = {
    score,
    wordCount,
    playedAt: new Date().toISOString(),
    puzzleDate: date,
  };

  try {
    localStorage.setItem(key, JSON.stringify(result));
  } catch (error) {
    // Handle quota exceeded or other storage errors
    console.warn('Failed to store daily game result:', error);
  }
}

/**
 * Removes entries older than 48 hours
 */
export function cleanupOldDailyRecords(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  const now = Date.now();
  const keysToRemove: string[] = [];

  // Iterate through all localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(STORAGE_KEY_PREFIX)) {
      continue;
    }

    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        continue;
      }

      const result = JSON.parse(stored) as DailyGameResult;
      const playedAt = new Date(result.playedAt).getTime();
      const age = now - playedAt;

      // Remove if older than 48 hours
      if (age > CLEANUP_THRESHOLD_MS) {
        keysToRemove.push(key);
      }
    } catch (error) {
      // If parsing fails, remove the corrupted entry
      keysToRemove.push(key);
    }
  }

  // Remove old entries
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      // Handle potential errors (e.g., quota exceeded, storage disabled)
      console.warn('Failed to remove localStorage key:', key, error);
    }
  });
}

/**
 * Gets today's date in the format used for storage
 */
export function getTodayDateString(): string {
  const today = getTodayUTC();
  return formatUTCDateString(today);
}

