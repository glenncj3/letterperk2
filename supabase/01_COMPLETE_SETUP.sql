/*
  # Complete LetterPerk Database Setup
  
  This script creates everything you need for the game:
  - All tables with analytics fields
  - Security policies
  - Indexes for performance
  
  Run this AFTER running 00_PURGE_DATABASE.sql (if you want a clean start)
*/

-- ============================================================================
-- TABLE 1: game_seeds
-- Stores daily puzzle configurations
-- ============================================================================
CREATE TABLE game_seeds (
  seed INTEGER PRIMARY KEY CHECK (seed >= 100000 AND seed <= 999999),
  puzzle_date DATE NOT NULL UNIQUE,
  configuration JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 2: game_results
-- Stores completed game information
-- ============================================================================
CREATE TABLE game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_date DATE NOT NULL,
  seed INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  word_count SMALLINT NOT NULL CHECK (word_count BETWEEN 0 AND 4),
  mode TEXT NOT NULL CHECK (mode IN ('daily', 'casual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Analytics fields
  duration_seconds INTEGER,
  total_bonus_tiles_used SMALLINT DEFAULT 0,
  started_at TIMESTAMPTZ
);

-- ============================================================================
-- TABLE 3: game_result_words
-- Stores individual word submissions
-- ============================================================================
CREATE TABLE game_result_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID NOT NULL REFERENCES game_results(id) ON DELETE CASCADE,
  puzzle_date DATE NOT NULL,
  submission_index SMALLINT NOT NULL CHECK (submission_index BETWEEN 1 AND 4),
  word TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Analytics fields
  bonuses JSONB DEFAULT '[]'::jsonb,
  bonus_tiles_count SMALLINT DEFAULT 0
);

-- ============================================================================
-- SECURITY: Row Level Security (RLS)
-- Enables security policies on all tables
-- ============================================================================
ALTER TABLE game_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_result_words ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECURITY POLICIES
-- Allows anyone (anonymous users) to read and insert data
-- ============================================================================

-- game_seeds policies
CREATE POLICY "Anyone can view game seeds"
  ON game_seeds FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert game seeds"
  ON game_seeds FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- game_results policies
CREATE POLICY "Anyone can view game results"
  ON game_results FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert game results"
  ON game_results FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- game_result_words policies
CREATE POLICY "Anyone can view game result words"
  ON game_result_words FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert game result words"
  ON game_result_words FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ============================================================================
-- INDEXES
-- Improves query performance
-- ============================================================================

-- Leaderboard indexes
CREATE INDEX idx_game_results_mode_date_score 
  ON game_results(mode, puzzle_date, total_score DESC);

CREATE INDEX idx_game_results_daily_leaderboard 
  ON game_results(mode, puzzle_date, total_score DESC) 
  WHERE mode = 'daily';

CREATE INDEX idx_game_results_casual_leaderboard 
  ON game_results(mode, puzzle_date, total_score DESC) 
  WHERE mode = 'casual';

-- Word lookup index
CREATE INDEX idx_game_result_words_result_id 
  ON game_result_words(result_id);

-- Analytics indexes
CREATE INDEX idx_game_results_started_at 
  ON game_results(started_at);

CREATE INDEX idx_game_result_words_bonuses 
  ON game_result_words USING GIN (bonuses);

-- ============================================================================
-- VERIFICATION
-- Check that everything was created successfully
-- ============================================================================
SELECT 
  'Setup complete! All tables, policies, and indexes have been created.' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('game_seeds', 'game_results', 'game_result_words')) as tables_created,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'game_seeds') as game_seeds_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'game_results') as game_results_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'game_result_words') as game_result_words_exists;

