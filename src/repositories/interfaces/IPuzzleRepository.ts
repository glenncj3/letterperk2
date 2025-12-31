import { GameConfiguration } from '../../types/game';

/**
 * Repository interface for puzzle operations.
 * Abstracts database access for puzzles/seeds.
 */
export interface IPuzzleRepository {
  /**
   * Loads a daily puzzle configuration for the given date and seed.
   * If not found, generates and saves a new configuration.
   * 
   * @param date - Puzzle date in YYYY-MM-DD format
   * @param seed - Seed number for puzzle generation
   * @returns Game configuration
   */
  loadDailyPuzzle(date: string, seed: number): Promise<GameConfiguration>;

  /**
   * Saves a daily puzzle configuration.
   * 
   * @param date - Puzzle date in YYYY-MM-DD format
   * @param seed - Seed number
   * @param configuration - Game configuration to save
   */
  saveDailyPuzzle(
    date: string,
    seed: number,
    configuration: GameConfiguration
  ): Promise<void>;
}

