# Complete Supabase Database Setup Instructions

## ⚠️ IMPORTANT: Read This First

This guide will help you:
1. **Delete everything** in your Supabase database (if you want a clean start)
2. **Create everything fresh** with all the analytics fields

**You will lose all existing game data** if you run the purge script. Make sure that's what you want!

---

## Step 1: Open Supabase Dashboard

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Log in to your account
3. Click on your **LetterPerk project** (or create one if you don't have one)

---

## Step 2: Open the SQL Editor

1. In your Supabase project, look at the left sidebar
2. Click on **"SQL Editor"** (it has a database icon)
3. You should see a blank editor window

---

## Step 3: Purge Existing Data (OPTIONAL - Only if you want to start fresh)

**⚠️ WARNING: This deletes ALL your game data. Skip this step if you want to keep existing data.**

1. In the SQL Editor, click **"New query"** (button at the top)
2. Open the file `supabase/00_PURGE_DATABASE.sql` from your project
3. **Copy ALL the text** from that file (Ctrl+A, then Ctrl+C)
4. **Paste it** into the SQL Editor in Supabase (Ctrl+V)
5. Click the **"Run"** button (or press Ctrl+Enter)
6. You should see a message saying "Purge complete!"
7. If you see any errors about tables not existing, that's fine - it means they were already deleted

**What this does:**
- Deletes all your game data
- Removes all tables
- Removes all security policies
- Removes all indexes

---

## Step 4: Create Everything Fresh

1. In the SQL Editor, click **"New query"** again (to start fresh)
2. Open the file `supabase/01_COMPLETE_SETUP.sql` from your project
3. **Copy ALL the text** from that file (Ctrl+A, then Ctrl+C)
4. **Paste it** into the SQL Editor in Supabase (Ctrl+V)
5. Click the **"Run"** button (or press Ctrl+Enter)
6. You should see a success message with a table showing:
   - `status`: "Setup complete! All tables, policies, and indexes have been created."
   - `tables_created`: 3
   - `game_seeds_exists`: 1
   - `game_results_exists`: 1
   - `game_result_words_exists`: 1

**What this does:**
- Creates 3 tables: `game_seeds`, `game_results`, `game_result_words`
- Adds all analytics fields (duration, bonuses, etc.)
- Sets up security so anyone can read/write (for anonymous games)
- Creates indexes for fast queries

---

## Step 5: Verify Everything Works

1. In Supabase, click on **"Table Editor"** in the left sidebar
2. You should see 3 tables:
   - `game_seeds`
   - `game_results`
   - `game_result_words`
3. Click on `game_results` to see its columns
4. You should see these columns:
   - `id`, `puzzle_date`, `seed`, `total_score`, `word_count`, `mode`, `created_at`
   - **Plus the new ones:** `duration_seconds`, `total_bonus_tiles_used`, `started_at`
5. Click on `game_result_words` to see its columns
6. You should see these columns:
   - `id`, `result_id`, `puzzle_date`, `submission_index`, `word`, `score`, `created_at`
   - **Plus the new ones:** `bonuses`, `bonus_tiles_count`

If you see all these columns, **you're done!** ✅

---

## Troubleshooting

### "Permission denied" error
- Make sure you're logged in as the project owner
- Check that you're in the correct project

### "Table already exists" error
- You need to run the purge script first (Step 3)
- Or manually delete the tables in Table Editor

### "Policy already exists" error
- This means you ran the setup script before
- Run the purge script first, then run setup again

### Can't find the SQL Editor
- Make sure you're in the Supabase dashboard (not your local code)
- Look for "SQL Editor" in the left sidebar menu
- It might be under a "Database" or "Tools" section

---

## What Each Table Does

### `game_seeds`
- Stores daily puzzle configurations
- One row per day
- Contains the tile sequences and bonus placements

### `game_results`
- Stores each completed game
- One row per game
- Contains: score, duration, bonus usage, game mode

### `game_result_words`
- Stores each word submitted in a game
- Multiple rows per game (one per word)
- Contains: word, score, bonuses used, bonus tile count

---

## Next Steps

Once the database is set up:
1. **Connect your game to Supabase** - See `NETLIFY_SUPABASE_SETUP.md` for complete instructions
2. Your game will automatically start logging data once connected
3. Play a test game to verify data is being saved
4. Check the `game_results` table to see your test game
5. Check the `game_result_words` table to see the words you submitted

**⚠️ IMPORTANT:** The database setup is only half the work! You also need to:
- Get your Supabase credentials (Project URL and anon key)
- Set up environment variables in Netlify
- See `NETLIFY_SUPABASE_SETUP.md` for the complete connection guide

---

## Need Help?

If something goes wrong:
1. Take a screenshot of the error
2. Check which step you were on
3. Make sure you copied the ENTIRE SQL file (not just part of it)
4. Try running the purge script again, then the setup script

