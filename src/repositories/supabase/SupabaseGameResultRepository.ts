import { IGameResultRepository, GameResult, LeaderboardEntry } from '../interfaces/IGameResultRepository';
import { getSupabase } from '../../lib/supabase';

/**
 * Supabase implementation of IGameResultRepository.
 */
export class SupabaseGameResultRepository implements IGameResultRepository {
  async logGameResult(result: GameResult): Promise<void> {
    const supabase = getSupabase();

    if (!supabase) {
      console.warn('Cannot log game result: Supabase not configured');
      return;
    }

    console.log('Logging game result:', {
      puzzleDate: result.puzzleDate,
      seed: result.seed,
      totalScore: result.totalScore,
      wordCount: result.wordCount,
      mode: result.mode,
      wordsCount: result.words.length,
      durationSeconds: result.durationSeconds,
      startedAt: result.startedAt,
      totalBonusTilesUsed: result.totalBonusTilesUsed,
    });

    try {
      const { data: gameResult, error: resultError } = await supabase
        .from('game_results')
        .insert({
          puzzle_date: result.puzzleDate,
          seed: result.seed,
          total_score: result.totalScore,
          word_count: result.wordCount,
          mode: result.mode,
          duration_seconds: result.durationSeconds ?? null,
          started_at: result.startedAt ?? null,
          total_bonus_tiles_used: result.totalBonusTilesUsed ?? null,
        })
        .select()
        .single();

      if (resultError) {
        console.error('Error logging game result:', resultError);
        console.error('Error details:', JSON.stringify(resultError, null, 2));
        return;
      }

      console.log('Game result logged successfully:', gameResult.id);

      if (gameResult && result.words.length > 0) {
        const wordRecords = result.words.map(w => ({
          result_id: gameResult.id,
          puzzle_date: result.puzzleDate,
          submission_index: w.index,
          word: w.word,
          score: w.score,
          bonuses: w.bonuses || [],
          bonus_tiles_count: w.bonusTilesCount || 0,
        }));

        console.log('Logging word records:', wordRecords.length);

        const { error: wordsError } = await supabase
          .from('game_result_words')
          .insert(wordRecords);

        if (wordsError) {
          console.error('Error logging game words:', wordsError);
          console.error('Words error details:', JSON.stringify(wordsError, null, 2));
        } else {
          console.log('Word records logged successfully');
        }
      } else {
        console.warn('No words to log or result is null', {
          result: !!gameResult,
          wordsLength: result.words.length,
        });
      }
    } catch (error) {
      console.error('Error in logGameResult:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    }
  }

  async getLeaderboard(
    mode: 'daily' | 'casual',
    date: string
  ): Promise<LeaderboardEntry[]> {
    const supabase = getSupabase();

    if (!supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('game_results')
        .select('total_score, word_count, created_at')
        .eq('mode', mode)
        .eq('puzzle_date', date)
        .order('total_score', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
      }

      // Deduplicate by score (keep first occurrence)
      const uniqueScores = new Map<number, LeaderboardEntry>();
      data?.forEach(result => {
        if (!uniqueScores.has(result.total_score)) {
          uniqueScores.set(result.total_score, result);
        }
      });

      return Array.from(uniqueScores.values()).slice(0, 10);
    } catch (error) {
      console.error('Error in getLeaderboard:', error);
      return [];
    }
  }
}

