/*
# Add player spending leaderboard

1. New Tables
- `player_spending`: one row per player with the total gold they have spent.
  - `player_id`: the player this row belongs to (removed automatically if the player is deleted).
  - `display_name`: public name shown on the leaderboard, such as "Игрок A1B2". It never reveals the player's secret token.
  - `total_spent`: total gold spent on opening cases and on contracts.
  - `updated_at`: when the total last changed.

2. Functions
- `add_player_spending`: adds gold to a player's total, creating the row on the first purchase. Only the server-side game function can call it.

3. Security
- Row level security is enabled on `player_spending`.
- Anyone (anon and signed-in roles) can read rows, because the leaderboard is intentionally public. Only the public-safe columns are exposed here.
- No public role can insert, update or delete rows; writes go through the server-side game function.

4. Realtime
- The table is added to the realtime publication so the leaderboard updates live in the browser.

5. Notes
- Totals start at zero; spending made before this migration is not recorded.
- Amounts must be non-negative whole numbers.
*/

CREATE TABLE IF NOT EXISTS player_spending (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  total_spent integer NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS player_spending_total_spent_idx ON player_spending (total_spent DESC);

ALTER TABLE player_spending ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON player_spending TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON player_spending TO service_role;

DROP POLICY IF EXISTS "public_select_player_spending" ON player_spending;
CREATE POLICY "public_select_player_spending" ON player_spending FOR SELECT
TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION add_player_spending(p_player_id uuid, p_amount integer)
RETURNS void
LANGUAGE sql
AS $$
  INSERT INTO player_spending (player_id, display_name, total_spent)
  VALUES (p_player_id, 'Игрок ' || upper(left(p_player_id::text, 4)), p_amount)
  ON CONFLICT (player_id) DO UPDATE
    SET total_spent = player_spending.total_spent + EXCLUDED.total_spent,
        updated_at = now();
$$;

REVOKE EXECUTE ON FUNCTION add_player_spending(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION add_player_spending(uuid, integer) TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'player_spending'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.player_spending;
  END IF;
END $$;
