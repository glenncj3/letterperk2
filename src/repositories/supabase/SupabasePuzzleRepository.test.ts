import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabasePuzzleRepository } from './SupabasePuzzleRepository';
import { generateGameConfiguration } from '../../utils/seedGenerator';
import { getSupabase } from '../../lib/supabase';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(),
};

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockUpsert = vi.fn();

vi.mock('../../lib/supabase', () => ({
  getSupabase: vi.fn(),
}));

vi.mock('../../utils/seedGenerator', () => ({
  generateGameConfiguration: vi.fn((seed: number) => ({
    columnSequences: [[], [], []],
    bonusConfig: [],
    effects: [],
    seed,
  })),
}));

describe('SupabasePuzzleRepository', () => {
  let repository: SupabasePuzzleRepository;

  beforeEach(() => {
    repository = new SupabasePuzzleRepository();
    vi.clearAllMocks();

    // Reset mock chain
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      maybeSingle: mockMaybeSingle,
    });
    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    // Default: Supabase is available
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);
  });

  describe('loadDailyPuzzle', () => {
    it('should return existing puzzle from database', async () => {
      const mockConfig = {
        columnSequences: [[{ letter: 'A', points: 1 }], [], []],
        bonusConfig: [],
        effects: [],
      };

      mockMaybeSingle.mockResolvedValue({
        data: { configuration: mockConfig },
        error: null,
      });

      const result = await repository.loadDailyPuzzle('2025-01-15', 11525);

      expect(result).toEqual(mockConfig);
      expect(mockSupabase.from).toHaveBeenCalledWith('game_seeds');
      expect(mockEq).toHaveBeenCalledWith('puzzle_date', '2025-01-15');
    });

    it('should generate and save puzzle if not found', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      mockUpsert.mockResolvedValue({ error: null });

      // Setup upsert chain
      const mockUpsertChain = {
        upsert: mockUpsert,
      };
      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect,
      }).mockReturnValueOnce(mockUpsertChain);

      const result = await repository.loadDailyPuzzle('2025-01-15', 11525);

      expect(result).toBeDefined();
      expect(generateGameConfiguration).toHaveBeenCalledWith(11525);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          seed: 11525,
          puzzle_date: '2025-01-15',
        }),
        { onConflict: 'seed' }
      );
    });

    it('should fallback to local generation on error', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await repository.loadDailyPuzzle('2025-01-15', 11525);

      expect(result).toBeDefined();
      expect(generateGameConfiguration).toHaveBeenCalledWith(11525);
    });

    it('should fallback to local generation if Supabase not configured', async () => {
      vi.mocked(getSupabase).mockReturnValue(null);

      const result = await repository.loadDailyPuzzle('2025-01-15', 11525);

      expect(result).toBeDefined();
      expect(generateGameConfiguration).toHaveBeenCalledWith(11525);
    });
  });

  describe('saveDailyPuzzle', () => {
    it('should save puzzle to database', async () => {
      const config = generateGameConfiguration(11525);
      mockUpsert.mockResolvedValue({ error: null });

      const mockUpsertChain = {
        upsert: mockUpsert,
      };
      mockSupabase.from.mockReturnValue(mockUpsertChain);

      await repository.saveDailyPuzzle('2025-01-15', 11525, config);

      expect(mockSupabase.from).toHaveBeenCalledWith('game_seeds');
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          seed: 11525,
          puzzle_date: '2025-01-15',
          configuration: config,
        },
        { onConflict: 'seed' }
      );
    });

    it('should handle unique constraint violation gracefully', async () => {
      const config = generateGameConfiguration(11525);
      const mockUpsertChain = {
        upsert: mockUpsert,
      };
      mockUpsert.mockResolvedValue({ error: { code: '23505' } });

      mockSupabase.from.mockReturnValue(mockUpsertChain);

      // Should not throw
      await expect(
        repository.saveDailyPuzzle('2025-01-15', 11525, config)
      ).resolves.not.toThrow();
    });

    it('should handle other errors', async () => {
      const config = generateGameConfiguration(11525);
      const mockUpsertChain = {
        upsert: mockUpsert,
      };
      mockUpsert.mockResolvedValue({ error: { code: 'OTHER_ERROR', message: 'Error' } });

      mockSupabase.from.mockReturnValue(mockUpsertChain);

      // Should not throw, but should log error
      await expect(
        repository.saveDailyPuzzle('2025-01-15', 11525, config)
      ).resolves.not.toThrow();
    });

    it('should handle missing Supabase gracefully', async () => {
      vi.mocked(getSupabase).mockReturnValue(null);

      const config = generateGameConfiguration(11525);

      await expect(
        repository.saveDailyPuzzle('2025-01-15', 11525, config)
      ).resolves.not.toThrow();
    });
  });
});

