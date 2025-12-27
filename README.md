# LetterPerk v2

A word puzzle game where players spell words using letter tiles with bonus multipliers.

## What's Built

### Core Game Mechanics
- 3×4 tile grid with gravity system
- Column-based tile sequences (3 independent columns)
- Seeded random generation for daily puzzles
- 6 bonus types: Green (+2), Purple (2×), Red (+8), Yellow (+6 pair), Blue (+4 start), Black (+4 end)
- Word validation system
- Score calculation with bonus stacking

### Game Modes
- **Daily Mode**: Deterministic puzzles based on date (shared by all players)
- **Casual Mode**: Random unique puzzles (unlimited games)

### UI Components
- Clean, minimal design matching LetterPerk.com
- Interactive tile selection with bonus indicators
- Real-time word validation and score preview
- Mode selector (Daily/Casual)
- Game over modal with score breakdown
- How to Play modal with bonus explanations
- Redraw tiles feature (one-time use)

### Database Integration
- Supabase database with 3 tables:
  - `game_seeds`: Daily puzzle configurations
  - `game_results`: Completed games with scores
  - `game_result_words`: Individual word submissions
- Automatic puzzle loading/generation
- Game result logging (anonymous, no auth)
- RLS policies for public access

## What's Missing

### Dictionary
Add a Scrabble dictionary JSON file at `/public/dictionary.json`:
```json
["AA", "AB", "ACE", "WORD", ...]
```

The game will work without it (permissive validation) but won't validate words properly.

### Optional Future Features
- Leaderboard UI (data structure ready)
- Share functionality
- Passive game effects system (architecture in place)
- Analytics/tracking

## Getting Started

1. Add dictionary file to `/public/dictionary.json`
2. Run `npm install`
3. Run `npm run dev`
4. Open browser to localhost

## Environment Variables

The Supabase credentials are already configured:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Architecture

```
src/
├── components/
│   ├── game/          # Game UI components
│   └── modals/        # Modal components
├── contexts/          # React context (GameContext)
├── hooks/             # Custom hooks
├── lib/               # External integrations (Supabase, dictionary)
├── utils/             # Pure utility functions
├── types/             # TypeScript types
└── constants/         # Game constants
```

## Key Files

- `src/contexts/GameContext.tsx`: Main game state management
- `src/utils/seedGenerator.ts`: Puzzle generation logic
- `src/utils/bonusUtils.ts`: Scoring and bonus calculations
- `src/lib/puzzle.ts`: Database integration for puzzles
- `src/constants/gameConstants.ts`: All game constants

## Testing

The game currently:
- ✅ Builds successfully
- ✅ Core logic implemented
- ✅ UI matches design
- ✅ Database integration complete
- ⏳ Needs dictionary for full validation

## Notes

- Passive game effects system is designed but not implemented (toggle in constants)
- Leaderboard queries are ready but UI not built
- All anonymous (no authentication required)
- Database has proper RLS policies
