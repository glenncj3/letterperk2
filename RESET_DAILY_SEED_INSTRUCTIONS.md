# How to Reset Today's Daily Seed

When you make changes to the game (like bonus values, grid size, etc.), you need to reset today's daily puzzle so it regenerates with the new code.

## ⚠️ IMPORTANT: Understanding How Seeds Work

The seed is **deterministic** - the same date always produces the same seed number, which means the same tile sequence. However, your code changes (like grid size, bonus configs) WILL be applied to the regenerated puzzle.

**What changes when you regenerate:**
- ✅ Grid layout (3 rows vs 4 rows)
- ✅ Bonus configurations (new bonus counts, values)
- ✅ How bonuses are assigned
- ❌ Tile sequence (same letters in same order - this is by design for consistency)

## Step 1: Make Sure Your Code is Deployed

**CRITICAL:** Your code changes must be deployed to production before resetting the seed!

1. **If testing locally:** Make sure you're running the latest code
2. **If testing production:** Make sure Netlify has deployed your latest changes
3. **Clear browser cache** or use incognito/private mode

## Step 2: Get Today's Date in PST

The game uses PST (Pacific Standard Time) for the daily puzzle date. You need to know today's date in PST format.

**Format needed:** `YYYY-MM-DD` (e.g., `2025-12-30`)

**How to find it:**
- If it's currently PST time, use today's date
- If you're in a different timezone, check what date it is in PST
- You can also check your Supabase `game_seeds` table to see what date was last created

## Step 3: Open Supabase SQL Editor

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Log in and select your LetterPerk project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

## Step 4: Delete Today's Seed

Copy and paste this SQL, **replacing `YYYY-MM-DD` with today's actual date**:

```sql
DELETE FROM game_seeds
WHERE puzzle_date = '2025-12-30';
```

**Example:** If today is December 30, 2025, use:
```sql
DELETE FROM game_seeds
WHERE puzzle_date = '2025-12-30';
```

## Step 5: Verify It Worked

Run this to confirm the row was deleted (should return 0 rows):

```sql
SELECT * FROM game_seeds WHERE puzzle_date = '2025-12-30';
```

## Step 6: Test It

1. **Clear your browser cache** or use incognito mode
2. Go to your game (make sure it's using the latest deployed code)
3. Make sure you're in Daily mode
4. Refresh the page or start a new game
5. The puzzle should regenerate with your latest code changes

## What Happens

- The old puzzle configuration is deleted
- The next time someone loads today's puzzle, `loadDailyPuzzle()` will see no data exists
- It will call `generateGameConfiguration(seed)` with your **updated code**
- The new configuration will be saved to the database
- **Note:** The tile sequence will be the same (by design), but the grid layout, bonus configs, etc. will use your new code

## Quick Reference

**To reset today's seed:**
```sql
DELETE FROM game_seeds WHERE puzzle_date = 'YYYY-MM-DD';
```

**To check what dates have seeds:**
```sql
SELECT puzzle_date, seed, created_at FROM game_seeds ORDER BY puzzle_date DESC;
```

**To delete a specific date's seed:**
```sql
DELETE FROM game_seeds WHERE puzzle_date = '2025-12-30';
```

## Troubleshooting

**Problem:** "Puzzle regenerated but still has old values"
- **Most likely:** Your code changes aren't deployed yet
  - Check Netlify to see if your latest code is deployed
  - Clear browser cache completely
  - Try incognito/private mode
  - Check that your local code actually has the changes you expect

**Problem:** "0 rows affected" when deleting
- Check that the date format is correct (YYYY-MM-DD)
- Check that a seed exists for that date
- Run `SELECT * FROM game_seeds;` to see all existing seeds

**Problem:** Puzzle doesn't regenerate
- Make sure you deleted the correct date
- Clear your browser cache
- Make sure you're testing in Daily mode (not Casual)
- Check browser console for errors

**Problem:** "Tile sequence is the same"
- This is **expected behavior** - the seed is deterministic
- Same date = same seed = same tile sequence
- Your code changes (grid size, bonuses) should still be applied
- If you want a completely different sequence, you'd need to modify the seed calculation (not recommended)

**Problem:** Not sure what today's date is in PST
- Check the `created_at` timestamp in your `game_seeds` table
- Or use a timezone converter to see what date it is in PST right now

**Problem:** Changes not showing up
1. Verify code is deployed to production
2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser console for errors
4. Verify the seed was actually deleted from database
5. Try a different browser or incognito mode

