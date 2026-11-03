/*
# Add player profile stats

1. New Tables
- `player_stats`: one row per player with profile figures that are public on the leaderboard profile.
  - `player_id`: the player this row belongs to (removed automatically if the player is deleted).
  - `best_drop_name`, `best_drop_rarity`, `best_drop_image_key`, `best_drop_value`: the most valuable item the player has ever obtained from a case.
  - `total_deposited`: total gold credited to the player through completed deposit tickets.
  - `updated_at`: when the row last changed.

2. Functions
- `record_player_drop`: stores a drop as the best drop if it is worth more than the current best. Only the server-side game function can call it.
- `add_player_deposit`: adds gold to a player's total deposited. Only the server-side admin function can call it.

3. Security
- Row level security is enabled on `player_stats`.
- Anyone (anon and signed-in roles) can read rows, because the profile figures are intentionally public. Only public-safe columns exist here.
- No public role can insert, update or delete rows; writes go through server-side functions.

4. Notes
- Figures start at zero; drops and deposits made before this migration are not recorded.
- Amounts must be non-negative.
*/

CREATE TABLE IF NOT EXISTS player_stats (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  best_drop_name text,
  best_drop_rarity text,
  best_drop_image_key text,
  best_drop_value numeric CHECK (best_drop_value IS NULL OR best_drop_value >= 0),
  total_deposited numeric NOT NULL DEFAULT 0 CHECK (total_deposited >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON player_stats TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON player_stats TO service_role;

DROP POLICY IF EXISTS "public_select_player_stats" ON player_stats;
CREATE POLICY "public_select_player_stats" ON player_stats FOR SELECT
TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION record_player_drop(
  p_player_id uuid,
  p_name text,
  p_rarity text,
  p_image_key text,
  p_value numeric
)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  INSERT INTO player_stats (player_id, best_drop_name, best_drop_rarity, best_drop_image_key, best_drop_value)
  VALUES (p_player_id, p_name, p_rarity, p_image_key, p_value)
  ON CONFLICT (player_id) DO UPDATE
    SET best_drop_name = EXCLUDED.best_drop_name,
        best_drop_rarity = EXCLUDED.best_drop_rarity,
        best_drop_image_key = EXCLUDED.best_drop_image_key,
        best_drop_value = EXCLUDED.best_drop_value,
        updated_at = now()
    WHERE player_stats.best_drop_value IS NULL
       OR EXCLUDED.best_drop_value > player_stats.best_drop_value;
$$;

CREATE OR REPLACE FUNCTION add_player_deposit(p_player_id uuid, p_amount numeric)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  INSERT INTO player_stats (player_id, total_deposited)
  VALUES (p_player_id, p_amount)
  ON CONFLICT (player_id) DO UPDATE
    SET total_deposited = player_stats.total_deposited + EXCLUDED.total_deposited,
        updated_at = now();
$$;

REVOKE EXECUTE ON FUNCTION record_player_drop(uuid, text, text, text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_player_drop(uuid, text, text, text, numeric) TO service_role;

REVOKE EXECUTE ON FUNCTION add_player_deposit(uuid, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION add_player_deposit(uuid, numeric) TO service_role;
