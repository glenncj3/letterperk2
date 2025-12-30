/*
  # Add Analytics Fields to Game Tables

  1. New Columns
    - `game_results`:
      - `duration_seconds` (integer) - Time from game start to finish
      - `total_bonus_tiles_used` (smallint) - Total bonus tiles used across all words
      - `started_at` (timestamptz) - When the game started
    
    - `game_result_words`:
      - `bonuses` (jsonb) - Array of bonuses used: [{type: string, value: number}, ...]
      - `bonus_tiles_count` (smallint) - Number of bonus tiles used in this word

  2. Indexes
    - Index on started_at for time-based queries
*/

-- Add new columns to game_results
ALTER TABLE game_results
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS total_bonus_tiles_used SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Add new columns to game_result_words
ALTER TABLE game_result_words
  ADD COLUMN IF NOT EXISTS bonuses JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS bonus_tiles_count SMALLINT DEFAULT 0;

-- Create index for time-based queries
CREATE INDEX IF NOT EXISTS idx_game_results_started_at 
  ON game_results(started_at);

-- Create index for bonus analysis
CREATE INDEX IF NOT EXISTS idx_game_result_words_bonuses 
  ON game_result_words USING GIN (bonuses);

