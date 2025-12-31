import { getLogger } from '../services/Logger';

let dictionaryWords: Set<string> | null = null;
let dictionaryLoadingPromise: Promise<void> | null = null;
let dictionaryLoadAttempted = false;

export async function loadDictionary(): Promise<void> {
  if (dictionaryWords) return;
  if (dictionaryLoadingPromise) return dictionaryLoadingPromise;

  dictionaryLoadAttempted = true;
  dictionaryLoadingPromise = (async () => {
    try {
      const response = await fetch('/dictionary.json');
      if (!response.ok) {
        throw new Error('Dictionary not found');
      }
      const words: string[] = await response.json();
      dictionaryWords = new Set(words.map(w => w.toUpperCase()));
      getLogger().info(`Dictionary loaded: ${dictionaryWords.size} words`);
    } catch (error) {
      getLogger().warn('Dictionary not loaded, using permissive validation', error);
      dictionaryWords = new Set();
    }
  })();

  return dictionaryLoadingPromise;
}

import { MIN_WORD_LENGTH } from '../constants/gameConstants';

export function isValidWord(word: string): boolean {
  // Always enforce minimum word length
  if (word.length < MIN_WORD_LENGTH) {
    return false;
  }

  // Trigger lazy loading on first validation attempt
  if (!dictionaryLoadAttempted) {
    loadDictionary().catch(err => {
      getLogger().warn('Failed to load dictionary', err);
    });
  }

  // If dictionary hasn't loaded yet, use permissive validation (length already checked)
  if (!dictionaryWords) {
    return true;
  }

  // If dictionary loaded but is empty (error case), use permissive validation
  if (dictionaryWords.size === 0) {
    return true;
  }

  return dictionaryWords.has(word.toUpperCase());
}
