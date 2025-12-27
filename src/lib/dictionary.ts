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
      console.log(`Dictionary loaded: ${dictionaryWords.size} words`);
    } catch (error) {
      console.warn('Dictionary not loaded, using permissive validation', error);
      dictionaryWords = new Set();
    }
  })();

  return dictionaryLoadingPromise;
}

export function isValidWord(word: string): boolean {
  // Trigger lazy loading on first validation attempt
  if (!dictionaryLoadAttempted) {
    loadDictionary().catch(err => {
      console.warn('Failed to load dictionary:', err);
    });
  }

  // If dictionary hasn't loaded yet, use permissive validation
  if (!dictionaryWords) {
    return word.length >= 2;
  }

  // If dictionary loaded but is empty (error case), use permissive validation
  if (dictionaryWords.size === 0) {
    return word.length >= 2;
  }

  return dictionaryWords.has(word.toUpperCase());
}
