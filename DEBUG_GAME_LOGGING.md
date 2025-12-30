# Debugging Game Result Logging

If game results aren't appearing in your Supabase database, follow these steps:

## Step 1: Check Browser Console

1. Open your production site on Netlify
2. Open browser Developer Tools (F12 or Right-click → Inspect)
3. Go to the **Console** tab
4. Play a complete game (submit 4 words)
5. Look for these messages:

**You should see:**
- `"Game over detected, preparing to log result..."`
- `"Calling logGameResult with: {...}"`
- `"Logging game result: {...}"`
- `"Game result logged successfully: [uuid]"`
- `"Logging word records: 4"`
- `"Word records logged successfully"`

**If you see errors instead:**
- Copy the error message
- Common errors:
  - `"Cannot log game result: Supabase not configured"` → Environment variables not set
  - `"Error logging game result: ..."` → Database/RLS issue
  - `"Error logging game words: ..."` → Database/RLS issue

## Step 2: Verify Environment Variables

1. In Netlify, go to **Site Settings** → **Environment Variables**
2. Verify both variables exist:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Make sure they're set for **Production** scope
4. **Important:** After adding/changing variables, you MUST redeploy

## Step 3: Check Database Tables Exist

1. Go to Supabase Dashboard → **Table Editor**
2. Verify you see these tables:
   - `game_results`
   - `game_result_words`
3. If tables don't exist, run `01_COMPLETE_SETUP.sql` (see SUPABASE_SETUP_INSTRUCTIONS.md)

## Step 4: Check RLS Policies

1. In Supabase, go to **Authentication** → **Policies**
2. Or use SQL Editor and run:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'game_results';
   SELECT * FROM pg_policies WHERE tablename = 'game_result_words';
   ```
3. You should see policies allowing INSERT for `anon` role

## Step 5: Test Database Connection

1. In Supabase SQL Editor, run this test:
   ```sql
   INSERT INTO game_results (
     puzzle_date, seed, total_score, word_count, mode
   ) VALUES (
     '2025-01-01', 123456, 100, 4, 'daily'
   ) RETURNING id;
   ```
2. If this works, the database is fine
3. If this fails, check RLS policies

## Step 6: Check Game Completion

The logging only happens when:
- Game status is `'gameover'`
- This happens when you submit your 4th word
- Check console for `"Game over detected"` message

**If you don't see "Game over detected":**
- The game might not be completing properly
- Check that you're submitting exactly 4 words
- Check that `wordsRemaining` reaches 0

## Step 7: Manual Database Check

1. In Supabase, go to **Table Editor** → `game_results`
2. Click **"Insert row"** (if you can't, RLS is blocking you)
3. Try to manually insert a test row
4. If manual insert works but game doesn't log, it's a code issue
5. If manual insert fails, it's a database/RLS issue

## Common Issues & Solutions

### Issue: "Supabase not configured"
**Solution:**
- Environment variables not set in Netlify
- Redeploy after adding variables
- Check variable names are exact: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Issue: "Error logging game result" with permission error
**Solution:**
- RLS policies not set up correctly
- Run `01_COMPLETE_SETUP.sql` again
- Check that policies allow INSERT for `anon` role

### Issue: Game completes but no console logs
**Solution:**
- Check that game status actually changes to `'gameover'`
- Check browser console for JavaScript errors
- Verify the useEffect is running (check dependencies)

### Issue: Console shows success but no data in database
**Solution:**
- Check Supabase logs (Dashboard → Logs)
- Verify you're looking at the correct project
- Check if there's a delay (refresh table editor)

### Issue: Only `game_seeds` updates, nothing else
**Solution:**
- This means Supabase connection works (seeds are saving)
- But game result logging isn't happening
- Check console for errors during game completion
- Verify game reaches 'gameover' status

## Quick Test

Run this in browser console on your production site:

```javascript
// Check if Supabase is configured
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

If both show values, environment variables are loaded.
If they're undefined, environment variables aren't set correctly.

## Still Stuck?

1. Check Netlify deploy logs for build errors
2. Check Supabase logs for database errors
3. Verify you're testing on the production URL (not localhost)
4. Make sure you completed a full game (4 words submitted)

