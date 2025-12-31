import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadDictionary, isValidWord } from './dictionary';

// Mock fetch
global.fetch = vi.fn();

describe('dictionary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module state by clearing the dictionary
    vi.resetModules();
  });

  describe('loadDictionary', () => {
    it('should load dictionary from /dictionary.json', async () => {
      const { loadDictionary, isValidWord } = await import('./dictionary');
      const mockWords = ['HELLO', 'WORLD', 'TEST'];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockWords,
      });

      await loadDictionary();

      expect(global.fetch).toHaveBeenCalledWith('/dictionary.json');
      expect(isValidWord('HELLO')).toBe(true);
      expect(isValidWord('WORLD')).toBe(true);
      expect(isValidWord('INVALID')).toBe(false);
    });

    it('should handle dictionary load failure gracefully', async () => {
      const { loadDictionary, isValidWord } = await import('./dictionary');
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      await loadDictionary();

      // Should not throw, and should use permissive validation
      expect(isValidWord('ANYWORD')).toBe(true); // Permissive: length >= 2
      expect(isValidWord('A')).toBe(false); // Too short
    });

    it('should handle 404 response', async () => {
      const { loadDictionary, isValidWord } = await import('./dictionary');
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 404,
      });

      await loadDictionary();

      // Should use permissive validation
      expect(isValidWord('ANYWORD')).toBe(true);
    });

    it('should convert words to uppercase', async () => {
      const { loadDictionary, isValidWord } = await import('./dictionary');
      const mockWords = ['hello', 'world'];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockWords,
      });

      await loadDictionary();

      expect(isValidWord('HELLO')).toBe(true);
      expect(isValidWord('hello')).toBe(true); // Should work case-insensitively
      expect(isValidWord('Hello')).toBe(true);
    });

    it('should not load dictionary multiple times', async () => {
      const { loadDictionary } = await import('./dictionary');
      const mockWords = ['TEST'];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockWords,
      });

      await Promise.all([loadDictionary(), loadDictionary(), loadDictionary()]);

      // Should only fetch once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('isValidWord', () => {
    it('should use permissive validation when dictionary not loaded', async () => {
      const { isValidWord } = await import('./dictionary');
      // Dictionary not loaded yet
      expect(isValidWord('AB')).toBe(true); // Length >= 2
      expect(isValidWord('A')).toBe(false); // Length < 2
      expect(isValidWord('LONGWORD')).toBe(true); // Length >= 2
    });

    it('should trigger lazy loading on first call', async () => {
      const { isValidWord } = await import('./dictionary');
      const mockWords = ['HELLO'];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockWords,
      });

      // First call triggers loading
      isValidWord('TEST');

      // Wait for dictionary to load
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should validate against dictionary when loaded', async () => {
      const { loadDictionary, isValidWord } = await import('./dictionary');
      const mockWords = ['HELLO', 'WORLD', 'TEST'];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockWords,
      });

      await loadDictionary();

      expect(isValidWord('HELLO')).toBe(true);
      expect(isValidWord('WORLD')).toBe(true);
      expect(isValidWord('TEST')).toBe(true);
      expect(isValidWord('INVALID')).toBe(false);
      expect(isValidWord('NOTINLIST')).toBe(false);
    });

    it('should handle empty dictionary gracefully', async () => {
      const { loadDictionary, isValidWord } = await import('./dictionary');
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await loadDictionary();

      // Empty dictionary should use permissive validation
      expect(isValidWord('ANYWORD')).toBe(true);
      expect(isValidWord('A')).toBe(false);
    });

    it('should be case-insensitive', async () => {
      const { loadDictionary, isValidWord } = await import('./dictionary');
      const mockWords = ['HELLO'];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockWords,
      });

      await loadDictionary();

      expect(isValidWord('HELLO')).toBe(true);
      expect(isValidWord('hello')).toBe(true);
      expect(isValidWord('Hello')).toBe(true);
      expect(isValidWord('HeLlO')).toBe(true);
    });

    it('should reject words shorter than 2 characters', async () => {
      const { loadDictionary, isValidWord } = await import('./dictionary');
      const mockWords = ['A', 'I', 'AB']; // Single letters and a valid word
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockWords,
      });

      await loadDictionary();

      // Even if in dictionary, words < 2 chars should be invalid
      expect(isValidWord('A')).toBe(false);
      expect(isValidWord('I')).toBe(false);
      // AB is in dictionary and >= 2 chars, so should be valid
      expect(isValidWord('AB')).toBe(true);
    });
  });
});

