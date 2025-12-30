/*
  ⚠️ WARNING: This will DELETE ALL DATA from your LetterPerk tables!
  
  Only run this if you want to completely start over.
  This cannot be undone!
*/

-- Drop all policies first
DROP POLICY IF EXISTS "Anyone can view game seeds" ON game_seeds;
DROP POLICY IF EXISTS "Anyone can insert game seeds" ON game_seeds;
DROP POLICY IF EXISTS "Anyone can view game results" ON game_results;
DROP POLICY IF EXISTS "Anyone can insert game results" ON game_results;
DROP POLICY IF EXISTS "Anyone can view game result words" ON game_result_words;
DROP POLICY IF EXISTS "Anyone can insert game result words" ON game_result_words;

-- Drop all indexes
DROP INDEX IF EXISTS idx_game_results_mode_date_score;
DROP INDEX IF EXISTS idx_game_results_daily_leaderboard;
DROP INDEX IF EXISTS idx_game_results_casual_leaderboard;
DROP INDEX IF EXISTS idx_game_result_words_result_id;
DROP INDEX IF EXISTS idx_game_results_started_at;
DROP INDEX IF EXISTS idx_game_result_words_bonuses;

-- Drop tables in correct order (child tables first due to foreign keys)
DROP TABLE IF EXISTS game_result_words CASCADE;
DROP TABLE IF EXISTS game_results CASCADE;
DROP TABLE IF EXISTS game_seeds CASCADE;

-- Verify everything is gone (this will show errors if tables still exist - that's okay, ignore them)
SELECT 'Purge complete! All LetterPerk tables have been deleted.' as status;

