import { Tile, ScoreBreakdown } from '../types/game';
import { isValidWord } from '../lib/dictionary';
import { calculateScore } from './bonusUtils';

export interface WordState {
  word: string;
  isValid: boolean;
  score: ScoreBreakdown;
}

/**
 * Calculates the current word state from selected tiles.
 * This is a pure function that can be memoized.
 * 
 * @param selectedTiles - Array of selected tiles
 * @returns Word state including word string, validity, and score breakdown
 */
export function calculateWordState(selectedTiles: Tile[]): WordState {
  if (selectedTiles.length === 0) {
    return {
      word: '',
      isValid: false,
      score: { baseScore: 0, bonuses: [], finalScore: 0 },
    };
  }

  const word = selectedTiles.map(t => t.letter).join('');
  const isValid = isValidWord(word) && word.length >= 2;
  const score = calculateScore(word, selectedTiles);

  return {
    word,
    isValid,
    score,
  };
}

