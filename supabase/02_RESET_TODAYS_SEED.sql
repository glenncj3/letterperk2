/*
  # Reset Today's Daily Seed
  
  This script deletes today's puzzle configuration from the database.
  The next time someone loads today's puzzle, it will regenerate with the latest code.
  
  IMPORTANT: Replace 'YYYY-MM-DD' with today's date in PST timezone!
  Format: YYYY-MM-DD (e.g., '2025-12-30')
*/

-- Delete today's puzzle seed
-- REPLACE 'YYYY-MM-DD' with today's date in PST!
DELETE FROM game_seeds
WHERE puzzle_date = 'YYYY-MM-DD';

-- Verify it was deleted (should return 0 rows)
SELECT * FROM game_seeds WHERE puzzle_date = 'YYYY-MM-DD';

