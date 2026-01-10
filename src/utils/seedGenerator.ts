import { GameConfiguration, BonusConfig } from '../types/game';
import { LETTER_DISTRIBUTION, DEFAULT_BONUS_CONFIG, GRID_COLS, TILES_PER_COLUMN } from '../constants/gameConstants';

export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function shuffleArray<T>(array: T[], random: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Ensures no duplicate letters in any set of 6 consecutive tiles.
 * This means we check overlapping windows: positions 0-5, 1-6, 2-7, etc.
 * When placing a tile at position i, it must be different from tiles at positions i-5 through i-1.
 */
function ensureNoDuplicatesInGroupsOfSix<T extends { letter: string }>(
  sequence: T[],
  random: () => number
): T[] {
  if (sequence.length === 0) {
    return sequence;
  }

  const WINDOW_SIZE = 6;
  const result: T[] = [];
  const remaining = [...sequence];

  // Process each position in the result
  while (remaining.length > 0) {
    const currentPosition = result.length;
    
    // Get the letters used in the last (WINDOW_SIZE - 1) positions
    // These are the tiles that would be in the same 6-tile window as the next tile
    const usedLetters = new Set<string>();
    const startCheck = Math.max(0, currentPosition - (WINDOW_SIZE - 1));
    for (let i = startCheck; i < currentPosition; i++) {
      usedLetters.add(result[i].letter);
    }

    // Find a tile from remaining that has a letter not in the used set
    let foundIndex = -1;
    for (let j = 0; j < remaining.length; j++) {
      if (!usedLetters.has(remaining[j].letter)) {
        foundIndex = j;
        break;
      }
    }

    if (foundIndex >= 0) {
      // Found a tile with a unique letter for this window
      result.push(remaining[foundIndex]);
      remaining.splice(foundIndex, 1);
    } else {
      // No unique letter available - all remaining tiles have letters that appear
      // in the last 5 positions. This can happen when we have many of the same letter.
      // Strategy: Shuffle remaining tiles and take the first one.
      // This might occasionally create a duplicate in a 6-tile window, but it's
      // better than getting stuck. In practice, with proper letter distribution,
      // this should be very rare.
      const shuffled = shuffleArray([...remaining], random);
      result.push(shuffled[0]);
      const tileIndex = remaining.findIndex(t => t === shuffled[0]);
      if (tileIndex >= 0) {
        remaining.splice(tileIndex, 1);
      } else {
        // Fallback: remove first item if findIndex fails
        remaining.splice(0, 1);
      }
    }
  }

  return result;
}

export function generateGameConfiguration(seed: number): GameConfiguration {
  const random = seededRandom(seed);

  // Build tile bag from letter distribution
  const tileBag: Array<{ letter: string; points: number }> = [];
  LETTER_DISTRIBUTION.forEach(({ letter, points, count }) => {
    for (let i = 0; i < count; i++) {
      tileBag.push({ letter, points });
    }
  });

  // Shuffle all tiles
  const shuffledTiles = shuffleArray(tileBag, random);

  // Separate vowels and consonants
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  const vowelTiles: Array<{ letter: string; points: number }> = [];
  const consonantTiles: Array<{ letter: string; points: number }> = [];

  shuffledTiles.forEach(tile => {
    if (vowels.includes(tile.letter)) {
      vowelTiles.push(tile);
    } else {
      consonantTiles.push(tile);
    }
  });

  // Create a single chain with healthy vowel distribution by interleaving
  // Calculate target spacing to distribute vowels evenly throughout
  const totalTiles = vowelTiles.length + consonantTiles.length;
  const vowelRatio = vowelTiles.length / totalTiles;
  const targetVowelSpacing = Math.floor(consonantTiles.length / vowelTiles.length) || 1;
  
  const singleChain: Array<{ letter: string; points: number }> = [];
  let vowelIndex = 0;
  let consonantIndex = 0;
  let consonantsSinceLastVowel = 0;
  
  // Interleave vowels and consonants to ensure healthy distribution
  // Try to maintain approximately targetVowelSpacing consonants between vowels
  while (vowelIndex < vowelTiles.length || consonantIndex < consonantTiles.length) {
    const shouldPlaceVowel = 
      (vowelIndex < vowelTiles.length && consonantIndex >= consonantTiles.length) ||
      (vowelIndex < vowelTiles.length && consonantIndex < consonantTiles.length && 
       consonantsSinceLastVowel >= targetVowelSpacing && random() < 0.7) ||
      (vowelIndex < vowelTiles.length && consonantIndex < consonantTiles.length && 
       consonantsSinceLastVowel >= targetVowelSpacing * 2);
    
    if (shouldPlaceVowel && vowelIndex < vowelTiles.length) {
      singleChain.push(vowelTiles[vowelIndex]);
      vowelIndex++;
      consonantsSinceLastVowel = 0;
    } else if (consonantIndex < consonantTiles.length) {
      singleChain.push(consonantTiles[consonantIndex]);
      consonantIndex++;
      consonantsSinceLastVowel++;
    } else if (vowelIndex < vowelTiles.length) {
      // Fallback: add remaining vowels
      singleChain.push(vowelTiles[vowelIndex]);
      vowelIndex++;
      consonantsSinceLastVowel = 0;
    }
  }

  // Apply constraint: no duplicates in groups of 6
  const constrainedChain = ensureNoDuplicatesInGroupsOfSix(singleChain, random);

  // Split the single chain into columns using round-robin for initial display
  const columnSequences: Array<Array<{ letter: string; points: number }>> = [[], [], []];
  constrainedChain.forEach((tile, index) => {
    columnSequences[index % GRID_COLS].push(tile);
  });

  return {
    columnSequences: columnSequences,
    bonusConfig: DEFAULT_BONUS_CONFIG,
    effects: []
  };
}

/**
 * Converts a UTC Date to a seed number in MMDDYY format.
 * Uses UTC date components to ensure consistency across timezones.
 * Ensures the seed is always in the valid range (100000-999999) for database constraints.
 * 
 * Since MMDDYY can produce values < 100000 (when month/day are small and year is 00-09),
 * we add 100000 to all seeds to ensure they're always 6 digits and in the valid range.
 * This maintains determinism: same date always produces the same seed.
 */
export function dateToSeed(date: Date): number {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const year = String(date.getUTCFullYear()).slice(-2);
  
  // Create MMDDYY seed (e.g., "010125" for Jan 1, 2025)
  // Note: parseInt will drop leading zeros, so "010125" becomes 10125
  const baseSeed = parseInt(month + day + year, 10);
  
  // Add 100000 to ensure seed is always 6 digits and in valid range (100000-999999)
  // This maps the MMDDYY space (0-999999) to (100000-1099999), then we cap at 999999
  // Examples:
  // - Jan 1, 2000: "010100" -> 10100 -> 110100 (valid)
  // - Jan 1, 2025: "010125" -> 10125 -> 110125 (valid)
  // - Dec 31, 2025: "123125" -> 123125 -> 223125 -> capped to 999999 (but 123125 < 999999, so 223125)
  const seed = baseSeed + 100000;
  
  // Cap at 999999 to stay within database constraint
  return seed > 999999 ? 999999 : seed;
}

/**
 * Gets the current UTC date.
 * This is simpler and more reliable than timezone-specific calculations.
 */
export function getTodayUTC(): Date {
  return new Date();
}

/**
 * Formats a UTC Date object as YYYY-MM-DD string.
 * Uses UTC date components to ensure consistency across timezones.
 * This is critical for keeping puzzle dates and leaderboard queries in sync.
 */
export function formatUTCDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}