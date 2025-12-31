import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateShareText, copyToClipboard } from './shareUtils';
import { GameState } from '../types/game';
import { createTile } from './tileUtils';

// Mock the logger
vi.mock('../services/Logger', () => ({
  getLogger: () => ({
    error: vi.fn(),
  }),
}));

describe('shareUtils', () => {
  describe('generateShareText', () => {
    it('should return empty string if puzzle is null', () => {
      const state: GameState = {
        gameMode: 'daily',
        puzzle: null,
        gameStatus: 'playing',
        columnSequences: [[], [], []],
        columnDrawIndices: [0, 0, 0],
        randomFunc: null,
        tiles: [],
        selectedTiles: [],
        currentWord: '',
        isWordValid: false,
        totalScore: 0,
        currentWordScore: { baseScore: 0, bonuses: [], finalScore: 0 },
        wordsCompleted: [],
        wordsRemaining: 4,
        activeEffects: [],
        tradesAvailable: 1,
        error: null,
        isLoading: false,
        tooltip: null,
      };

      const result = generateShareText(state);

      expect(result).toBe('');
    });

    it('should generate share text with date and score', () => {
      const state: GameState = {
        gameMode: 'daily',
        puzzle: {
          date: '2025-01-15',
          seed: 11525,
          configuration: {
            columnSequences: [[], [], []],
            bonusConfig: [],
            effects: [],
          },
        },
        gameStatus: 'gameover',
        columnSequences: [[], [], []],
        columnDrawIndices: [0, 0, 0],
        randomFunc: null,
        tiles: [],
        selectedTiles: [],
        currentWord: '',
        isWordValid: false,
        totalScore: 100,
        currentWordScore: { baseScore: 0, bonuses: [], finalScore: 0 },
        wordsCompleted: [],
        wordsRemaining: 0,
        activeEffects: [],
        tradesAvailable: 0,
        error: null,
        isLoading: false,
        tooltip: null,
      };

      const result = generateShareText(state);

      expect(result).toContain('LetterPerk');
      // Date formatting uses local timezone, so just check it contains a date
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      expect(result).toContain('Score: 100');
    });

    it('should include emoji squares for completed words', () => {
      const state: GameState = {
        gameMode: 'daily',
        puzzle: {
          date: '2025-01-15',
          seed: 11525,
          configuration: {
            columnSequences: [[], [], []],
            bonusConfig: [],
            effects: [],
          },
        },
        gameStatus: 'gameover',
        columnSequences: [[], [], []],
        columnDrawIndices: [0, 0, 0],
        randomFunc: null,
        tiles: [],
        selectedTiles: [],
        currentWord: '',
        isWordValid: false,
        totalScore: 100,
        currentWordScore: { baseScore: 0, bonuses: [], finalScore: 0 },
        wordsCompleted: [
          {
            word: 'HELLO',
            score: 50,
            bonusesApplied: ['green'],
            tileBonuses: ['green', null, null, null, null],
            bonusBreakdown: [{ type: 'green', value: 2 }],
          },
          {
            word: 'WORLD',
            score: 50,
            bonusesApplied: ['purple'],
            tileBonuses: ['purple', null, null, null, null],
            bonusBreakdown: [{ type: 'purple', value: 25 }],
          },
        ],
        wordsRemaining: 0,
        activeEffects: [],
        tradesAvailable: 0,
        error: null,
        isLoading: false,
        tooltip: null,
      };

      const result = generateShareText(state);

      expect(result).toContain('🟩'); // Green bonus
      expect(result).toContain('🟪'); // Purple bonus
      expect(result.split('\n').length).toBeGreaterThan(3); // Header + score + 2 word lines
    });

    it('should handle words with multiple bonus types', () => {
      const state: GameState = {
        gameMode: 'daily',
        puzzle: {
          date: '2025-01-15',
          seed: 11525,
          configuration: {
            columnSequences: [[], [], []],
            bonusConfig: [],
            effects: [],
          },
        },
        gameStatus: 'gameover',
        columnSequences: [[], [], []],
        columnDrawIndices: [0, 0, 0],
        randomFunc: null,
        tiles: [],
        selectedTiles: [],
        currentWord: '',
        isWordValid: false,
        totalScore: 100,
        currentWordScore: { baseScore: 0, bonuses: [], finalScore: 0 },
        wordsCompleted: [
          {
            word: 'HELLO',
            score: 50,
            bonusesApplied: ['green', 'blue'],
            tileBonuses: ['green', null, null, 'blue', null],
            bonusBreakdown: [
              { type: 'green', value: 2 },
              { type: 'blue', value: 5 },
            ],
          },
        ],
        wordsRemaining: 0,
        activeEffects: [],
        tradesAvailable: 0,
        error: null,
        isLoading: false,
        tooltip: null,
      };

      const result = generateShareText(state);

      expect(result).toContain('🟩'); // Green
      expect(result).toContain('🟦'); // Blue
      expect(result).toContain('⬜'); // Normal tiles
    });
  });

  describe('copyToClipboard', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should use modern clipboard API when available', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      global.navigator.clipboard = {
        writeText: mockWriteText,
      } as unknown as Clipboard;

      const result = await copyToClipboard('test text');

      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith('test text');
    });

    it('should fallback to execCommand for older browsers', async () => {
      // Remove modern clipboard API
      delete (global.navigator as { clipboard?: Clipboard }).clipboard;

      const mockExecCommand = vi.fn().mockReturnValue(true);
      document.execCommand = mockExecCommand;

      // Mock createElement and DOM manipulation
      const mockTextArea = {
        value: '',
        style: {},
        select: vi.fn(),
      };
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockTextArea as unknown as HTMLElement);
      document.body.appendChild = mockAppendChild;
      document.body.removeChild = mockRemoveChild;

      const result = await copyToClipboard('test text');

      expect(result).toBe(true);
      expect(mockTextArea.value).toBe('test text');
      expect(mockTextArea.select).toHaveBeenCalled();
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it('should return false on error', async () => {
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard error'));
      global.navigator.clipboard = {
        writeText: mockWriteText,
      } as unknown as Clipboard;

      const result = await copyToClipboard('test text');

      expect(result).toBe(false);
    });

    it('should return false when execCommand fails', async () => {
      delete (global.navigator as { clipboard?: Clipboard }).clipboard;

      const mockExecCommand = vi.fn().mockReturnValue(false);
      document.execCommand = mockExecCommand;

      const mockTextArea = {
        value: '',
        style: {},
        select: vi.fn(),
      };
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockTextArea as unknown as HTMLElement);
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();

      const result = await copyToClipboard('test text');

      expect(result).toBe(false);
    });
  });
});

