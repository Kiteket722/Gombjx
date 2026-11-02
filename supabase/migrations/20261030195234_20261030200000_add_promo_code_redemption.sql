/*
# Add single-use promo code redemption

1. New Tables
- `promo_code_claims`: records which player has redeemed a promo code, preventing repeat claims for the same player and code.
- `id`: unique claim identifier.
- `player_id`: the player who redeemed the code.
- `code`: normalized promo code value.
- `created_at`: time the claim was recorded.

2. New Functions
- `redeem_promo_code`: validates the supported code, atomically records the claim, and credits the fixed reward to the player's balance.

3. Security
- Row level security is enabled on `promo_code_claims`.
- No browser roles receive table access; only the server-side game function can use it.
- The balance-changing function is executable only by `service_role` and uses a fixed server-side reward.

4. Important Notes
- The supported code is `тест` and can be redeemed once per player.
- The browser never supplies the reward amount.
- A failed redemption rolls back the claim so a valid code is not consumed by an unsuccessful credit.
*/

CREATE TABLE IF NOT EXISTS promo_code_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE promo_code_claims ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS promo_code_claims_player_code_key
  ON promo_code_claims (player_id, lower(code));

GRANT SELECT, INSERT ON promo_code_claims TO service_role;

CREATE OR REPLACE FUNCTION redeem_promo_code(p_player_id uuid, p_code text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gold numeric;
BEGIN
  IF lower(trim(p_code)) <> 'тест' THEN
    RAISE EXCEPTION 'Invalid promo code';
  END IF;

  INSERT INTO promo_code_claims (player_id, code)
  VALUES (p_player_id, lower(trim(p_code)))
  ON CONFLICT (player_id, lower(code)) DO NOTHING;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Promo code already used';
  END IF;

  UPDATE players
  SET gold = gold + 10000
  WHERE id = p_player_id
  RETURNING gold INTO v_gold;

  IF v_gold IS NULL THEN
    RAISE EXCEPTION 'Player not found';
  END IF;

  RETURN v_gold;
END;
$$;

REVOKE EXECUTE ON FUNCTION redeem_promo_code(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION redeem_promo_code(uuid, text) TO service_role;