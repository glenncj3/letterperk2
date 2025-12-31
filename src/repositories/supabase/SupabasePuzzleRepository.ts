import { IPuzzleRepository } from '../interfaces/IPuzzleRepository';
import { GameConfiguration } from '../../types/game';
import { getSupabase } from '../../lib/supabase';
import { generateGameConfiguration } from '../../utils/seedGenerator';

/**
 * Supabase implementation of IPuzzleRepository.
 */
export class SupabasePuzzleRepository implements IPuzzleRepository {
  async loadDailyPuzzle(date: string, seed: number): Promise<GameConfiguration> {
    const supabase = getSupabase();

    if (!supabase) {
      // Fallback to local generation if Supabase not configured
      return generateGameConfiguration(seed);
    }

    try {
      const { data, error } = await supabase
        .from('game_seeds')
        .select('*')
        .eq('puzzle_date', date)
        .maybeSingle();

      if (error) {
        console.error('Error loading daily puzzle:', error);
        return generateGameConfiguration(seed);
      }

      if (data) {
        return data.configuration as GameConfiguration;
      }

      // Puzzle not found, generate and save it
      const configuration = generateGameConfiguration(seed);
      await this.saveDailyPuzzle(date, seed, configuration);

      return configuration;
    } catch (error) {
      console.error('Error in loadDailyPuzzle:', error);
      return generateGameConfiguration(seed);
    }
  }

  async saveDailyPuzzle(
    date: string,
    seed: number,
    configuration: GameConfiguration
  ): Promise<void> {
    const supabase = getSupabase();

    if (!supabase) {
      console.warn('Cannot save puzzle: Supabase not configured');
      return;
    }

    try {
      const { error } = await supabase
        .from('game_seeds')
        .upsert(
          {
            seed,
            puzzle_date: date,
            configuration,
          },
          {
            onConflict: 'seed',
          }
        );

      if (error && error.code !== '23505') {
        // 23505 is unique constraint violation (expected if already exists)
        console.error('Error saving daily puzzle:', error);
      }
    } catch (error) {
      console.error('Error in saveDailyPuzzle:', error);
    }
  }
}

