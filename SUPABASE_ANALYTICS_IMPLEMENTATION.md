# Supabase Analytics Implementation Summary

## What Was Implemented

### 1. Database Schema Updates
**File:** `supabase/migrations/20250101000000_add_analytics_fields.sql`

Added new columns to existing tables:

#### `game_results` table:
- `duration_seconds` (INTEGER) - Time from game start to finish
- `total_bonus_tiles_used` (SMALLINT) - Total bonus tiles used across all words
- `started_at` (TIMESTAMPTZ) - When the game started

#### `game_result_words` table:
- `bonuses` (JSONB) - Array of bonuses with values: `[{type: string, value: number}, ...]`
- `bonus_tiles_count` (SMALLINT) - Number of bonus tiles used in this word

### 2. Type Updates
**File:** `src/types/game.ts`

- Added `gameStartedAt?: string` to `GameState` interface
- Added `bonusBreakdown: Array<{ type: BonusType; value: number }>` to `CompletedWord` interface

### 3. Logging Function Updates
**File:** `src/lib/puzzle.ts`

Updated `logGameResult()` to accept and store:
- Duration in seconds
- Game start timestamp
- Total bonus tiles used
- Per-word bonus breakdown with values
- Per-word bonus tile counts

### 4. Game Context Updates
**File:** `src/contexts/GameContext.tsx`

- Automatically sets `gameStartedAt` when game status changes to 'playing'
- Calculates duration when game ends
- Counts total bonus tiles used across all words
- Stores full bonus breakdown (with values) for each word
- Passes all analytics data to logging function

## Data Being Collected

### For Each Word:
✅ Date (already existed)
✅ Bonuses used with their values (NEW)
✅ Bonus tile count (NEW)

### For Each Game:
✅ Date (already existed)
✅ Total bonus tiles used (NEW)
✅ Duration in seconds (NEW)
✅ Game mode (daily/casual) (already existed)

## Next Steps

### 1. Run the Migration
```bash
# Apply the migration to your Supabase database
# Use Supabase CLI or run the SQL directly in Supabase dashboard
```

### 2. Test the Implementation
- Play a game and verify data is being logged
- Check Supabase tables to confirm new fields are populated
- Verify bonus values are stored correctly in JSONB format

### 3. Letter Value Tracking (Optional - See LETTER_VALUE_TRACKING.md)
If you want to track letter values, you'll need to:
- Create a `letter_usage` table (see LETTER_VALUE_TRACKING.md)
- Update word submission to log individual letter data
- Build analytics queries

## Example Queries

### Get bonus usage statistics:
```sql
SELECT 
  puzzle_date,
  mode,
  AVG(total_bonus_tiles_used) as avg_bonus_tiles,
  AVG(duration_seconds) as avg_duration
FROM game_results
WHERE total_bonus_tiles_used IS NOT NULL
GROUP BY puzzle_date, mode
ORDER BY puzzle_date DESC;
```

### Analyze bonus effectiveness:
```sql
SELECT 
  bonus->>'type' as bonus_type,
  AVG((bonus->>'value')::numeric) as avg_value,
  COUNT(*) as usage_count
FROM game_result_words,
LATERAL jsonb_array_elements(bonuses) as bonus
GROUP BY bonus->>'type'
ORDER BY avg_value DESC;
```

### Word-level bonus analysis:
```sql
SELECT 
  word,
  score,
  bonus_tiles_count,
  bonuses,
  puzzle_date
FROM game_result_words
WHERE bonus_tiles_count > 0
ORDER BY score DESC
LIMIT 100;
```

## Notes

- All new fields are nullable to maintain backward compatibility
- Bonus data is stored as JSONB for flexibility
- Game start time is automatically tracked when status changes to 'playing'
- Duration is calculated on game completion

