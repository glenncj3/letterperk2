import { getSupabase } from './supabase';
import { GameConfiguration } from '../types/game';
import { generateGameConfiguration } from '../utils/seedGenerator';

export async function loadDailyPuzzle(date: string, seed: number): Promise<GameConfiguration> {
  const supabase = getSupabase();

  if (!supabase) {
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

    const configuration = generateGameConfiguration(seed);

    const { error: insertError } = await supabase
      .from('game_seeds')
      .upsert({
        seed,
        puzzle_date: date,
        configuration
      }, {
        onConflict: 'seed'
      });

    if (insertError && insertError.code !== '23505') {
      console.error('Error saving daily puzzle:', insertError);
    }

    return configuration;
  } catch (error) {
    console.error('Error in loadDailyPuzzle:', error);
    return generateGameConfiguration(seed);
  }
}

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
  const supabase = getSupabase();

  if (!supabase) {
    console.warn('Cannot log game result: Supabase not configured');
    return;
  }

  console.log('Logging game result:', {
    puzzleDate,
    seed,
    totalScore,
    wordCount,
    mode,
    wordsCount: words.length,
    durationSeconds,
    startedAt,
    totalBonusTilesUsed
  });

  try {
    const { data: result, error: resultError } = await supabase
      .from('game_results')
      .insert({
        puzzle_date: puzzleDate,
        seed,
        total_score: totalScore,
        word_count: wordCount,
        mode,
        duration_seconds: durationSeconds ?? null,
        started_at: startedAt ?? null,
        total_bonus_tiles_used: totalBonusTilesUsed ?? null
      })
      .select()
      .single();

    if (resultError) {
      console.error('Error logging game result:', resultError);
      console.error('Error details:', JSON.stringify(resultError, null, 2));
      return;
    }

    console.log('Game result logged successfully:', result.id);

    if (result && words.length > 0) {
      const wordRecords = words.map(w => ({
        result_id: result.id,
        puzzle_date: puzzleDate,
        submission_index: w.index,
        word: w.word,
        score: w.score,
        bonuses: w.bonuses || [],
        bonus_tiles_count: w.bonusTilesCount || 0
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
      console.warn('No words to log or result is null', { result: !!result, wordsLength: words.length });
    }
  } catch (error) {
    console.error('Error in logGameResult:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
  }
}

export async function getLeaderboard(
  mode: 'daily' | 'casual',
  date: string
): Promise<Array<{ total_score: number; word_count: number; created_at: string }>> {
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

    const uniqueScores = new Map();
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
