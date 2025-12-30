# Connecting Supabase to Your Game on Netlify

This guide will walk you through connecting your Supabase database to your game, both for local development and Netlify deployment.

---

## Part 1: Get Your Supabase Credentials

### Step 1: Open Supabase Dashboard
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Log in
3. Click on your **LetterPerk project**

### Step 2: Find Your API Credentials
1. In the left sidebar, click **"Project Settings"** (gear icon at the bottom)
2. Click **"API"** in the settings menu
3. You'll see two important values:

   **Project URL:**
   - This looks like: `https://xxxxxxxxxxxxx.supabase.co`
   - Copy this entire URL

   **anon/public key:**
   - This is a long string starting with `eyJ...`
   - Click the **eye icon** to reveal it (or click "Reveal")
   - Copy this entire key

**⚠️ IMPORTANT:** 
- The `anon` key is safe to use in your frontend code (it's public)
- Never share your `service_role` key (that's secret!)
- You're using the `anon` key, which is correct

---

## Part 2: Set Up Local Development (Your Computer)

### Step 1: Create Environment File
1. In your project folder (`letterperk2`), create a new file called `.env`
2. **Important:** Make sure it's called exactly `.env` (with the dot at the start)
3. **Important:** Make sure it's in the root folder (same folder as `package.json`)

### Step 2: Add Your Credentials
Open the `.env` file and paste this, replacing with YOUR actual values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjE2MjM5MDIyfQ.your-actual-key-here
```

**Replace:**
- `https://your-project-id.supabase.co` with your actual Project URL
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` with your actual anon key

### Step 3: Verify It Works Locally
1. Save the `.env` file
2. **Restart your development server** (stop it with Ctrl+C, then run `npm run dev` again)
3. Play a game and submit a word
4. Check your Supabase dashboard → Table Editor → `game_results`
5. You should see your game data appear!

**Note:** The `.env` file is already in `.gitignore`, so it won't be committed to GitHub (this is good - keeps your secrets safe).

---

## Part 3: Set Up Netlify Deployment

### Step 1: Deploy Your Site to Netlify

**Option A: If you haven't deployed yet**
1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Log in (or sign up)
3. Click **"Add new site"** → **"Import an existing project"**
4. Connect to your GitHub repository
5. Netlify will detect it's a Vite project
6. Build settings should be:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
7. Click **"Deploy site"**

**Option B: If you already have a site**
1. Go to your Netlify dashboard
2. Click on your site

### Step 2: Add Environment Variables in Netlify

1. In your Netlify site dashboard, click **"Site configuration"** (or "Site settings")
2. Click **"Environment variables"** in the left menu
3. Click **"Add a variable"** button
4. Add the first variable:
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** Your Supabase Project URL (the same one you used in `.env`)
   - **Scopes:** Check **"Production"**, **"Deploy previews"**, and **"Branch deploys"**
   - Click **"Create variable"**

5. Click **"Add a variable"** again
6. Add the second variable:
   - **Key:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** Your Supabase anon key (the same one you used in `.env`)
   - **Scopes:** Check **"Production"**, **"Deploy previews"**, and **"Branch deploys"**
   - Click **"Create variable"**

### Step 3: Redeploy Your Site

**Important:** After adding environment variables, you MUST redeploy for them to take effect.

1. In Netlify, go to **"Deploys"** tab
2. Click the **"..."** menu (three dots) on the most recent deploy
3. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
4. Wait for the deploy to finish (usually 1-2 minutes)

**OR** if you have auto-deploy enabled:
- Just push a new commit to GitHub
- Netlify will automatically redeploy with the new environment variables

### Step 4: Verify It Works on Netlify

1. Go to your live site URL (the one Netlify gave you)
2. Play a game and submit a word
3. Check your Supabase dashboard → Table Editor → `game_results`
4. You should see your game data appear!

---

## Part 4: Troubleshooting

### Problem: "Supabase credentials not found" in browser console

**Solution:**
- Make sure you added `VITE_` prefix to the variable names (required for Vite)
- Make sure you redeployed after adding variables
- Check that the variable names are EXACTLY: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Problem: Data not saving to database

**Check:**
1. Open browser console (F12)
2. Look for errors
3. Check that your Supabase tables exist (run the setup SQL if needed)
4. Verify your anon key is correct (not the service_role key)

### Problem: "Failed to fetch" or network errors

**Check:**
1. Make sure your Supabase project URL is correct
2. Make sure your Supabase project is not paused (free tier pauses after inactivity)
3. Check Supabase dashboard → Settings → API → make sure CORS is enabled

### Problem: Environment variables not working on Netlify

**Solution:**
1. Double-check variable names (must have `VITE_` prefix)
2. Make sure you redeployed after adding variables
3. Check that variables are set for the correct scope (Production, etc.)
4. Try clearing Netlify's build cache and redeploying

### Problem: Can't find Project Settings in Supabase

**Solution:**
- Look for a gear icon (⚙️) at the bottom of the left sidebar
- It might be called "Settings" or "Project Settings"
- Click it, then click "API"

---

## Quick Reference

### Environment Variable Names (MUST be exact):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Where to Find Supabase Credentials:
1. Supabase Dashboard → Project Settings → API
2. Copy "Project URL" → use for `VITE_SUPABASE_URL`
3. Copy "anon public" key → use for `VITE_SUPABASE_ANON_KEY`

### Files You Need:
- `.env` file (for local development) - in root folder
- Netlify environment variables (for production) - in Netlify dashboard

### Important Notes:
- ✅ The `anon` key is safe to use in frontend code
- ✅ Never commit `.env` to GitHub (it's already in `.gitignore`)
- ✅ Always redeploy Netlify after adding/changing environment variables
- ✅ Variable names MUST start with `VITE_` for Vite to see them

---

## Testing Checklist

After setup, verify everything works:

- [ ] Local development: Game saves data to Supabase
- [ ] Netlify production: Game saves data to Supabase
- [ ] Check Supabase Table Editor: See `game_results` entries
- [ ] Check Supabase Table Editor: See `game_result_words` entries
- [ ] Check that analytics fields are populated (duration, bonuses, etc.)

---

## Need More Help?

If you're stuck:
1. Check the browser console (F12) for error messages
2. Check Netlify deploy logs for build errors
3. Verify your Supabase project is active (not paused)
4. Make sure you ran the database setup SQL (from `01_COMPLETE_SETUP.sql`)

