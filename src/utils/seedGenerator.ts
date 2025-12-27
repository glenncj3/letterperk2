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

function ensureNoDuplicatesInFirstFour<T extends { letter: string }>(
  sequence: T[],
  random: () => number
): T[] {
  if (sequence.length < TILES_PER_COLUMN) {
    return sequence;
  }

  const result = [...sequence];
  const firstFour: T[] = [];
  const usedLetters = new Set<string>();
  const remaining = [...result];

  // Build first 4 positions with unique letters
  for (let i = 0; i < TILES_PER_COLUMN && remaining.length > 0; i++) {
    // Find the first tile with a unique letter
    let foundIndex = -1;
    for (let j = 0; j < remaining.length; j++) {
      if (!usedLetters.has(remaining[j].letter)) {
        foundIndex = j;
        break;
      }
    }

    if (foundIndex >= 0) {
      // Found a unique letter
      firstFour.push(remaining[foundIndex]);
      usedLetters.add(remaining[foundIndex].letter);
      remaining.splice(foundIndex, 1);
    } else {
      // No unique letter available, take from remaining and swap with later position if needed
      // This should be rare, but handle it by taking the first available
      firstFour.push(remaining[0]);
      remaining.splice(0, 1);
    }
  }

  // Shuffle the remaining tiles
  const shuffledRemaining = shuffleArray(remaining, random);

  // Combine: first 4 unique letters, then the rest
  return [...firstFour, ...shuffledRemaining];
}

export function generateGameConfiguration(seed: number): GameConfiguration {
  const random = seededRandom(seed);

  const tileBag: Array<{ letter: string; points: number }> = [];
  LETTER_DISTRIBUTION.forEach(({ letter, points, count }) => {
    for (let i = 0; i < count; i++) {
      tileBag.push({ letter, points });
    }
  });

  const shuffledTiles = shuffleArray(tileBag, random);

  const vowels = ['A', 'E', 'I', 'O', 'U'];
  const vowelTiles: Array<{ letter: string; points: number }> = [];
  const otherTiles: Array<{ letter: string; points: number }> = [];

  shuffledTiles.forEach(tile => {
    if (vowels.includes(tile.letter)) {
      vowelTiles.push(tile);
    } else {
      otherTiles.push(tile);
    }
  });

  const columnSequences: Array<Array<{ letter: string; points: number }>> = [[], [], []];

  vowelTiles.forEach((tile, index) => {
    columnSequences[index % GRID_COLS].push(tile);
  });

  otherTiles.forEach((tile, index) => {
    columnSequences[index % GRID_COLS].push(tile);
  });

  const shuffledColumnSequences = columnSequences.map(sequence =>
    shuffleArray(sequence, random)
  );

  // Ensure no duplicate letters in the first 4 tiles of each column
  const constrainedSequences = shuffledColumnSequences.map(sequence =>
    ensureNoDuplicatesInFirstFour(sequence, random)
  );

  return {
    columnSequences: constrainedSequences,
    bonusConfig: DEFAULT_BONUS_CONFIG,
    effects: []
  };
}

export function dateToSeed(date: Date): number {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return parseInt(month + day + year, 10);
}

export function getTodayPST(): Date {
  const now = new Date();
  const pstOffset = -8 * 60;
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const pst = new Date(utc + (pstOffset * 60000));
  return pst;
}
