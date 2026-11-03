/*
# Add per-case legendary guarantee counters

1. New Tables
- `player_case_guarantees`: one row per player and guaranteed case, counting openings since the last epic-or-better drop.
  - `player_id`: the player this row belongs to (removed automatically if the player is deleted).
  - `case_key`: the case the counter belongs to.
  - `misses`: openings in a row without an epic, mythic, legendary or unique drop.
  - `updated_at`: when the counter last changed.

2. Security
- Row level security is enabled on `player_case_guarantees`.
- No public role (anon or authenticated) has any access; the counters are read and written only by the server-side game function, which bypasses row level security.

3. Notes
- Counters start at zero, so every player begins with a full guarantee of 20 openings.
*/

CREATE TABLE IF NOT EXISTS player_case_guarantees (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  case_key text NOT NULL,
  misses integer NOT NULL DEFAULT 0 CHECK (misses >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, case_key)
);

ALTER TABLE player_case_guarantees ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON player_case_guarantees TO service_role;
