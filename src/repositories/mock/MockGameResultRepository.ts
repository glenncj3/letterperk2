import { IGameResultRepository, GameResult, LeaderboardEntry } from '../interfaces/IGameResultRepository';

/**
 * Mock implementation of IGameResultRepository for testing.
 * Stores results in memory.
 */
export class MockGameResultRepository implements IGameResultRepository {
  private results: GameResult[] = [];

  async logGameResult(result: GameResult): Promise<void> {
    this.results.push(result);
  }

  async getLeaderboard(
    mode: 'daily' | 'casual',
    date: string
  ): Promise<LeaderboardEntry[]> {
    const filtered = this.results.filter(
      r => r.mode === mode && r.puzzleDate === date
    );

    // Sort by score descending
    filtered.sort((a, b) => b.totalScore - a.totalScore);

    // Deduplicate by score
    const uniqueScores = new Map<number, LeaderboardEntry>();
    filtered.forEach(result => {
      if (!uniqueScores.has(result.totalScore)) {
        uniqueScores.set(result.totalScore, {
          total_score: result.totalScore,
          word_count: result.wordCount,
          created_at: result.startedAt || new Date().toISOString(),
        });
      }
    });

    return Array.from(uniqueScores.values()).slice(0, 10);
  }

  // Test helper methods
  clear(): void {
    this.results = [];
  }

  getResults(): GameResult[] {
    return [...this.results];
  }

  getResultCount(): number {
    return this.results.length;
  }
}

