/*
# Pin search path for the spending function

1. Changes
- `add_player_spending`: sets a fixed search path so the function always resolves the public tables it writes to.

2. Security
- No access changes; execute permissions stay limited to the server-side game function.
*/

CREATE OR REPLACE FUNCTION add_player_spending(p_player_id uuid, p_amount integer)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  INSERT INTO player_spending (player_id, display_name, total_spent)
  VALUES (p_player_id, 'Игрок ' || upper(left(p_player_id::text, 4)), p_amount)
  ON CONFLICT (player_id) DO UPDATE
    SET total_spent = player_spending.total_spent + EXCLUDED.total_spent,
        updated_at = now();
$$;
