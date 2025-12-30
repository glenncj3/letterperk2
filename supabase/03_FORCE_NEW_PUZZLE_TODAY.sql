/*
  # Force a New Puzzle for Today
  
  This script deletes today's puzzle and you'll need to manually trigger regeneration
  OR manually insert a new configuration with a modified seed.
  
  IMPORTANT: Replace 'YYYY-MM-DD' with today's date in PST!
  Format: YYYY-MM-DD (e.g., '2025-12-30')
*/

-- Step 1: Delete today's existing puzzle
DELETE FROM game_seeds
WHERE puzzle_date = 'YYYY-MM-DD';

-- Step 2: Verify it's deleted (should return 0 rows)
SELECT * FROM game_seeds WHERE puzzle_date = 'YYYY-MM-DD';

/*
  After running this, you have two options:
  
  OPTION A: Let it regenerate automatically
  - Just load the game and it will regenerate with your new code
  - BUT: It will use the same seed, so tile sequence will be similar
  
  OPTION B: Manually insert with a modified seed (for a truly different puzzle)
  - See the instructions below for how to generate a new configuration
*/

