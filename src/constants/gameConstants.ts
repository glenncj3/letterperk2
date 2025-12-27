import { BonusConfig, GameEffect } from '../types/game';

export const GRID_ROWS = 4;
export const GRID_COLS = 3;
export const TILES_PER_DRAW = 12;
export const TILES_PER_COLUMN = 4;

export const MAX_WORDS_PER_GAME = 4;
export const MIN_WORD_LENGTH = 2;
export const TOTAL_TILES = 92;

export const PURPLE_BONUS_MIN_LENGTH = 7;
export const RED_BONUS_MAX_LENGTH = 4;

export const DEFAULT_BONUS_CONFIG: BonusConfig[] = [
  { type: 'green', minCount: 3, maxCount: 3},
  { type: 'purple', minCount: 3, maxCount: 3},
  { type: 'red', minCount: 3, maxCount: 3},
  { type: 'yellow', minCount: 6, maxCount: 6},
  { type: 'blue', minCount: 3, maxCount: 3},
  { type: 'black', minCount: 3, maxCount: 3},
];

export const EFFECT_ENABLED = false;

export const EXAMPLE_EFFECTS: GameEffect[] = [
  {
    id: 'vowels_plus_one',
    type: 'point_modifier',
    timing: 'word_submission',
    name: 'Vowel Bonus',
    description: 'All vowels are worth +1 point',
    enabled: false,
    params: { letters: ['A', 'E', 'I', 'O', 'U'], modifier: 1 }
  },
  {
    id: 'long_words_penalty',
    type: 'score_modifier',
    timing: 'word_submission',
    name: 'Length Penalty',
    description: 'Words with more than 4 letters have -4 points',
    enabled: false,
    params: { minLength: 5, penalty: -4 }
  }
];

export const FLASH_DURATION_MS = 300;
export const ANIMATION_DELAY_MS = 50;
export const TOOLTIP_DELAY_MS = 500;
export const GAME_OVER_DELAY_MS = 500;

export const LETTER_DISTRIBUTION = [
  { letter: 'A', points: 1, count: 8 },
  { letter: 'B', points: 2, count: 2 },
  { letter: 'C', points: 3, count: 2 },
  { letter: 'D', points: 2, count: 4 },
  { letter: 'E', points: 1, count: 10 },
  { letter: 'F', points: 3, count: 2 },
  { letter: 'G', points: 3, count: 2 },
  { letter: 'H', points: 2, count: 2 },
  { letter: 'I', points: 1, count: 8 },
  { letter: 'J', points: 10, count: 1 },
  { letter: 'K', points: 5, count: 1 },
  { letter: 'L', points: 2, count: 4 },
  { letter: 'M', points: 3, count: 2 },
  { letter: 'N', points: 1, count: 6 },
  { letter: 'O', points: 1, count: 8 },
  { letter: 'P', points: 2, count: 2 },
  { letter: 'Q', points: 10, count: 1 },
  { letter: 'R', points: 1, count: 6 },
  { letter: 'S', points: 1, count: 4 },
  { letter: 'T', points: 1, count: 6 },
  { letter: 'U', points: 2, count: 4 },
  { letter: 'V', points: 4, count: 2 },
  { letter: 'W', points: 4, count: 2 },
  { letter: 'X', points: 8, count: 1 },
  { letter: 'Y', points: 4, count: 1 },
  { letter: 'Z', points: 6, count: 1 },
];

export const BONUS_COLORS = {
  green: {
    bg: 'bg-green-500',
    border: 'border-green-500',
    text: 'text-green-600',
    name: 'Extra, Extra',
    description: '+2 points'
  },
  purple: {
    bg: 'bg-purple-500',
    border: 'border-purple-500',
    text: 'text-purple-600',
    name: 'Big Bingo',
    description: '2x score (7+ letters)'
  },
  red: {
    bg: 'bg-red-500',
    border: 'border-red-500',
    text: 'text-red-600',
    name: 'Small Words',
    description: '+8 points (≤4 letters)'
  },
  yellow: {
    bg: 'bg-yellow-400',
    border: 'border-yellow-400',
    text: 'text-yellow-600',
    name: 'Top Pair',
    description: '+6 points (both yellows)'
  },
  blue: {
    bg: 'bg-blue-500',
    border: 'border-blue-500',
    text: 'text-blue-600',
    name: 'Starting Block',
    description: '+4 points (first letter)'
  },
  black: {
    bg: 'bg-gray-900',
    border: 'border-gray-900',
    text: 'text-gray-800',
    name: 'Finish Line',
    description: '+4 points (last letter)'
  }
};
