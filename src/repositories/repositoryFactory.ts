import { IPuzzleRepository } from './interfaces/IPuzzleRepository';
import { IGameResultRepository } from './interfaces/IGameResultRepository';
import { SupabasePuzzleRepository } from './supabase/SupabasePuzzleRepository';
import { SupabaseGameResultRepository } from './supabase/SupabaseGameResultRepository';

/**
 * Factory for creating repository instances.
 * Centralizes repository creation and allows for easy swapping of implementations.
 */
export class RepositoryFactory {
  private static puzzleRepository: IPuzzleRepository | null = null;
  private static gameResultRepository: IGameResultRepository | null = null;

  /**
   * Gets or creates the puzzle repository instance.
   */
  static getPuzzleRepository(): IPuzzleRepository {
    if (!this.puzzleRepository) {
      this.puzzleRepository = new SupabasePuzzleRepository();
    }
    return this.puzzleRepository;
  }

  /**
   * Gets or creates the game result repository instance.
   */
  static getGameResultRepository(): IGameResultRepository {
    if (!this.gameResultRepository) {
      this.gameResultRepository = new SupabaseGameResultRepository();
    }
    return this.gameResultRepository;
  }

  /**
   * Sets custom repository instances (useful for testing).
   */
  static setPuzzleRepository(repo: IPuzzleRepository): void {
    this.puzzleRepository = repo;
  }

  static setGameResultRepository(repo: IGameResultRepository): void {
    this.gameResultRepository = repo;
  }

  /**
   * Resets all repositories (useful for testing).
   */
  static reset(): void {
    this.puzzleRepository = null;
    this.gameResultRepository = null;
  }
}

