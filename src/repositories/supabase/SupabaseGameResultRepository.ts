import { IGameResultRepository, GameResult, LeaderboardEntry } from '../interfaces/IGameResultRepository';
import { getSupabase } from '../../lib/supabase';
import { getLogger } from '../../services/Logger';

/**
 * Supabase implementation of IGameResultRepository.
 */
export class SupabaseGameResultRepository implements IGameResultRepository {
  async logGameResult(result: GameResult): Promise<void> {
    const supabase = getSupabase();

    if (!supabase) {
      getLogger().warn('Cannot log game result: Supabase not configured');
      return;
    }

    const logger = getLogger();
    logger.gameEvent('logging_game_result', {
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
        logger.error('Error logging game result', resultError, { errorDetails: JSON.stringify(resultError, null, 2) });
        return;
      }

      logger.info('Game result logged successfully', { resultId: gameResult.id });

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

        logger.debug('Logging word records', { count: wordRecords.length });

        const { error: wordsError } = await supabase
          .from('game_result_words')
          .insert(wordRecords);

        if (wordsError) {
          logger.error('Error logging game words', wordsError, { errorDetails: JSON.stringify(wordsError, null, 2) });
        } else {
          logger.info('Word records logged successfully');
        }
      } else {
        logger.warn('No words to log or result is null', {
          result: !!gameResult,
          wordsLength: result.words.length,
        });
      }
    } catch (error) {
      logger.error('Error in logGameResult', error);
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
      // Fetch more records to ensure we get 10 unique scores after deduplication
      const { data, error } = await supabase
        .from('game_results')
        .select('total_score, word_count, created_at')
        .eq('mode', mode)
        .eq('puzzle_date', date)
        .order('total_score', { ascending: false })
        .limit(50);

      if (error) {
        getLogger().error('Error fetching leaderboard', error);
        return [];
      }

      // Deduplicate by score (keep first occurrence)
      const uniqueScores = new Map<number, LeaderboardEntry>();
      data?.forEach(result => {
        if (!uniqueScores.has(result.total_score)) {
          uniqueScores.set(result.total_score, result);
        }
      });

      // Return top 10 unique scores
      return Array.from(uniqueScores.values()).slice(0, 10);
    } catch (error) {
      getLogger().error('Error in getLeaderboard', error);
      return [];
    }
  }
}

