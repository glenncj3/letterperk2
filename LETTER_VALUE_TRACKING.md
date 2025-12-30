# Letter Value Tracking Ideas

## Current Data Available
- Word submissions with scores
- Letter tiles used (from tileBonuses array)
- Bonus values applied
- Game outcomes

## Proposed Metrics for Letter Value

### 1. **Letter Contribution Score**
Track how much each letter contributes to word scores:
- For each word, calculate: `letter_contribution = (word_score / word_length)`
- Aggregate by letter to see average contribution per letter
- Compare letter's base point value vs actual contribution

**SQL Example:**
```sql
-- Average score contribution per letter
SELECT 
  letter,
  AVG(word_score / word_length) as avg_contribution,
  COUNT(*) as usage_count
FROM (
  SELECT 
    unnest(string_to_array(word, NULL)) as letter,
    score as word_score,
    length(word) as word_length
  FROM game_result_words
) subq
GROUP BY letter
ORDER BY avg_contribution DESC;
```

### 2. **Letter Position Value**
Track which positions in words are most valuable:
- First letter vs middle vs last
- Track letter + position combinations
- See if certain letters are more valuable in specific positions

**Schema Addition:**
```sql
ALTER TABLE game_result_words
  ADD COLUMN letter_positions JSONB; 
  -- Store: [{"letter": "A", "position": 0, "points": 1}, ...]
```

### 3. **Letter Efficiency Ratio**
Compare letter's base point value to its actual score contribution:
- `efficiency = (actual_score_contribution / base_point_value)`
- Letters with efficiency > 1 are "overperforming"
- Letters with efficiency < 1 are "underperforming"

### 4. **Letter + Bonus Combinations**
Track which letters work best with which bonuses:
- Which letters are most often used with green/purple/red bonuses?
- Do certain letters benefit more from specific bonuses?

**Query Example:**
```sql
SELECT 
  letter,
  bonus_type,
  AVG(score) as avg_score_with_bonus,
  COUNT(*) as usage_count
FROM game_result_words wrw
CROSS JOIN LATERAL jsonb_array_elements(wrw.bonuses) as bonus
CROSS JOIN LATERAL unnest(string_to_array(wrw.word, NULL)) WITH ORDINALITY as letter_data(letter, pos)
GROUP BY letter, bonus->>'type'
ORDER BY avg_score_with_bonus DESC;
```

### 5. **Letter Frequency vs Score Correlation**
- Track letter usage frequency
- Compare to average scores when letter is used
- Identify "hidden gems" (rarely used but high value)

### 6. **Letter Pair/Triplet Analysis**
Track common letter combinations:
- Which 2-3 letter combinations appear most?
- Which combinations score highest?
- Useful for understanding word formation patterns

## Recommended Implementation

### Phase 1: Basic Letter Tracking
Add a `letter_usage` table:
```sql
CREATE TABLE letter_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id UUID REFERENCES game_result_words(id),
  letter TEXT NOT NULL,
  position SMALLINT NOT NULL,
  base_points SMALLINT NOT NULL,
  word_score INTEGER NOT NULL,
  word_length SMALLINT NOT NULL,
  had_bonus BOOLEAN DEFAULT FALSE,
  bonus_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 2: Enhanced Analysis
Add computed columns or materialized views for:
- Letter efficiency metrics
- Position-based value
- Bonus combination effectiveness

### Phase 3: Real-time Insights
Create views/dashboards showing:
- Most valuable letters
- Underutilized high-value letters
- Optimal letter-bonus pairings

## Data Collection Strategy

1. **Store letter positions** when words are submitted
2. **Calculate contribution** = word_score / word_length (simple average)
3. **Track bonus context** for each letter (was it part of a bonus tile?)
4. **Aggregate over time** to build statistical models

## Example Queries

### Find most efficient letters:
```sql
SELECT 
  letter,
  AVG(word_score::float / word_length) as avg_contribution,
  AVG(base_points) as avg_base_points,
  AVG(word_score::float / word_length) / NULLIF(AVG(base_points), 0) as efficiency_ratio
FROM letter_usage
GROUP BY letter
HAVING COUNT(*) >= 10  -- Minimum sample size
ORDER BY efficiency_ratio DESC;
```

### Letters that benefit most from bonuses:
```sql
SELECT 
  letter,
  AVG(CASE WHEN had_bonus THEN word_score::float / word_length END) as avg_with_bonus,
  AVG(CASE WHEN NOT had_bonus THEN word_score::float / word_length END) as avg_without_bonus,
  AVG(CASE WHEN had_bonus THEN word_score::float / word_length END) - 
  AVG(CASE WHEN NOT had_bonus THEN word_score::float / word_length END) as bonus_premium
FROM letter_usage
GROUP BY letter
HAVING COUNT(*) >= 5
ORDER BY bonus_premium DESC;
```

