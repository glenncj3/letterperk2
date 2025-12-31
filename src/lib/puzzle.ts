import { RepositoryFactory } from '../repositories/repositoryFactory';

/**
 * Loads a daily puzzle configuration.
 * Uses the repository pattern for database access.
 * 
 * @deprecated Use RepositoryFactory.getPuzzleRepository().loadDailyPuzzle() directly
 * This function is kept for backward compatibility.
 */
export async function loadDailyPuzzle(date: string, seed: number) {
  const puzzleRepo = RepositoryFactory.getPuzzleRepository();
  return puzzleRepo.loadDailyPuzzle(date, seed);
}

import { GameResult } from '../repositories/interfaces/IGameResultRepository';

/**
 * Logs a completed game result.
 * Uses the repository pattern for database access.
 * 
 * @deprecated Use RepositoryFactory.getGameResultRepository().logGameResult() directly
 * This function is kept for backward compatibility.
 */
export async function logGameResult(
  puzzleDate: string,
  seed: number,
  totalScore: number,
  wordCount: number,
  mode: 'daily' | 'casual',
  words: Array<{ 
    word: string; 
    score: number; 
    index: number;
    bonuses: Array<{ type: string; value: number }>;
    bonusTilesCount: number;
  }>,
  durationSeconds?: number,
  startedAt?: string,
  totalBonusTilesUsed?: number
): Promise<void> {
  const gameResultRepo = RepositoryFactory.getGameResultRepository();
  
  const result: GameResult = {
    puzzleDate,
    seed,
    totalScore,
    wordCount,
    mode,
    words,
    durationSeconds,
    startedAt,
    totalBonusTilesUsed,
  };

  return gameResultRepo.logGameResult(result);
}

/**
 * Gets the leaderboard for a specific mode and date.
 * Uses the repository pattern for database access.
 * 
 * @deprecated Use RepositoryFactory.getGameResultRepository().getLeaderboard() directly
 * This function is kept for backward compatibility.
 */
export async function getLeaderboard(
  mode: 'daily' | 'casual',
  date: string
): Promise<Array<{ total_score: number; word_count: number; created_at: string }>> {
  const gameResultRepo = RepositoryFactory.getGameResultRepository();
  return gameResultRepo.getLeaderboard(mode, date);
}
