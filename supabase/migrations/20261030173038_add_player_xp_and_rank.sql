/*
# Add XP and rank system to players

1. Changes to existing tables
- `players` table: add `xp` column (integer, not null, default 0)
  - Tracks total experience points earned from opening cases
  - XP is awarded based on case cost: more expensive cases give more XP

2. Security
- No new tables or policies needed
- The existing RLS policies on `players` already cover the new column
- `service_role` (used by edge functions) bypasses RLS

3. Important notes
- XP is calculated as: round(casePrice * 10) per case opened
  - Free case: 0 XP (price = 0)
  - Cheap case (50 gold): 5 XP per open
  - Mid case (200 gold): 20 XP per open
  - Expensive case (500 gold): 50 XP per open
- Ranks are computed from XP thresholds, not stored in DB
- All 24 ranks defined in the edge function and frontend
*/

ALTER TABLE players ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0;
