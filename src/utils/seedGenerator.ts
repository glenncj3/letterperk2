import { GameConfiguration, BonusConfig } from '../types/game';
import { LETTER_DISTRIBUTION, DEFAULT_BONUS_CONFIG, GRID_COLS } from '../constants/gameConstants';

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

  return {
    columnSequences: shuffledColumnSequences,
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
