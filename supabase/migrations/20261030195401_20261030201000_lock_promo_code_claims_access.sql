/*
# Restrict promo code claim access

1. Modified Tables
- `promo_code_claims`: removes direct browser access to redemption records.

2. Security
- Revokes all table privileges from `anon` and `authenticated`.
- Keeps server-side access for `service_role`, which is used by the game edge function.
- The browser can only redeem through the validated server function and cannot inspect, insert, update, or delete claims.

3. Important Notes
- This change does not remove any rows or change player balances.
- The single-use rule remains enforced by the unique player/code index and the server-side function.
*/

REVOKE ALL ON TABLE promo_code_claims FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE promo_code_claims TO service_role;