/*
  # Create LetterPerk Game Tables

  1. New Tables
    - `game_seeds`
      - `seed` (integer, primary key) - 6-digit seed (100000-999999)
      - `puzzle_date` (date, unique) - Date of the daily puzzle
      - `configuration` (jsonb) - Serialized game configuration
      - `created_at` (timestamptz) - Timestamp of creation
    
    - `game_results`
      - `id` (uuid, primary key) - Unique identifier
      - `puzzle_date` (date) - Date of the game
      - `seed` (integer) - Seed used for the game
      - `total_score` (integer) - Total score achieved
      - `word_count` (smallint) - Number of words completed
      - `mode` (text) - Game mode ('daily' or 'casual')
      - `created_at` (timestamptz) - Timestamp of completion
    
    - `game_result_words`
      - `id` (uuid, primary key) - Unique identifier
      - `result_id` (uuid, foreign key) - Reference to game_results
      - `puzzle_date` (date) - Date of the game
      - `submission_index` (smallint) - Order of word submission (1-4)
      - `word` (text) - The word submitted
      - `score` (integer) - Score for this word
      - `created_at` (timestamptz) - Timestamp of submission

  2. Security
    - Enable RLS on all tables
    - Add policies for public read/insert access (anonymous game)
  
  3. Indexes
    - Index on mode, puzzle_date, and total_score for leaderboard queries
    - Index on result_id for word lookups
*/

CREATE TABLE IF NOT EXISTS game_seeds (
  seed INTEGER PRIMARY KEY CHECK (seed >= 100000 AND seed <= 999999),
  puzzle_date DATE NOT NULL UNIQUE,
  configuration JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_date DATE NOT NULL,
  seed INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  word_count SMALLINT NOT NULL CHECK (word_count BETWEEN 0 AND 4),
  mode TEXT NOT NULL CHECK (mode IN ('daily', 'casual')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_result_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID NOT NULL REFERENCES game_results(id) ON DELETE CASCADE,
  puzzle_date DATE NOT NULL,
  submission_index SMALLINT NOT NULL CHECK (submission_index BETWEEN 1 AND 4),
  word TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE game_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_result_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game seeds"
  ON game_seeds FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert game seeds"
  ON game_seeds FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view game results"
  ON game_results FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert game results"
  ON game_results FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view game result words"
  ON game_result_words FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert game result words"
  ON game_result_words FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_game_results_mode_date_score 
  ON game_results(mode, puzzle_date, total_score DESC);

CREATE INDEX IF NOT EXISTS idx_game_results_daily_leaderboard 
  ON game_results(mode, puzzle_date, total_score DESC) 
  WHERE mode = 'daily';

CREATE INDEX IF NOT EXISTS idx_game_results_casual_leaderboard 
  ON game_results(mode, puzzle_date, total_score DESC) 
  WHERE mode = 'casual';

CREATE INDEX IF NOT EXISTS idx_game_result_words_result_id 
  ON game_result_words(result_id);
