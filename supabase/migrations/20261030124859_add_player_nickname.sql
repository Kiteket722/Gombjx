/*
# Add player nicknames

1. Changes to existing tables
- `players`: new optional column `nickname`. It is chosen once by the player on their first visit and cannot be changed afterwards. Existing players have no nickname yet and will be asked to choose one.
  - Nicknames are 1 to 24 characters long.

2. Functions
- `add_player_spending`: the leaderboard name now comes from the player's nickname instead of a generated name.

3. Security
- No new access is granted. Only the server-side game function changes nicknames and writes leaderboard rows.

4. Notes
- The nickname check constraint blocks empty or overly long names.
*/

ALTER TABLE players ADD COLUMN IF NOT EXISTS nickname text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'players_nickname_length'
  ) THEN
    ALTER TABLE players
      ADD CONSTRAINT players_nickname_length
      CHECK (nickname IS NULL OR char_length(nickname) BETWEEN 1 AND 24);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION add_player_spending(p_player_id uuid, p_amount integer)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  INSERT INTO player_spending (player_id, display_name, total_spent)
  SELECT p.id, p.nickname, p_amount
  FROM players p
  WHERE p.id = p_player_id AND p.nickname IS NOT NULL
  ON CONFLICT (player_id) DO UPDATE
    SET total_spent = player_spending.total_spent + EXCLUDED.total_spent,
        updated_at = now();
$$;
