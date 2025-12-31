export interface GameResultWord {
  word: string;
  score: number;
  index: number;
  bonuses: Array<{ type: string; value: number }>;
  bonusTilesCount: number;
}

export interface GameResult {
  puzzleDate: string;
  seed: number;
  totalScore: number;
  wordCount: number;
  mode: 'daily' | 'casual';
  words: GameResultWord[];
  durationSeconds?: number;
  startedAt?: string;
  totalBonusTilesUsed?: number;
}

export interface LeaderboardEntry {
  total_score: number;
  word_count: number;
  created_at: string;
}

/**
 * Repository interface for game result operations.
 * Abstracts database access for game results and leaderboards.
 */
export interface IGameResultRepository {
  /**
   * Logs a completed game result.
   * 
   * @param result - Game result data
   * @returns Promise that resolves when logging is complete
   */
  logGameResult(result: GameResult): Promise<void>;

  /**
   * Gets the leaderboard for a specific mode and date.
   * 
   * @param mode - Game mode ('daily' or 'casual')
   * @param date - Puzzle date in YYYY-MM-DD format
   * @returns Array of leaderboard entries (top 10 unique scores)
   */
  getLeaderboard(
    mode: 'daily' | 'casual',
    date: string
  ): Promise<LeaderboardEntry[]>;
}

