/*
# Add SELECT policy on players table

The players table has RLS enabled but NO policies, meaning the anon-key
frontend cannot read any rows. This was hidden because the leaderboard
previously only queried player_spending (which has a public SELECT policy).

Now that the leaderboard joins players!inner(xp), the missing policy on
players causes the join to return zero rows, making the leaderboard empty.

1. Security changes
- Add public SELECT policy on players (TO anon, authenticated)
  - The app is no-auth (no sign-in screen), so all data is intentionally shared
  - This allows the leaderboard to join player_spending -> players(xp)
*/

DROP POLICY IF EXISTS "public_select_players" ON players;
CREATE POLICY "public_select_players" ON players FOR SELECT
  TO anon, authenticated USING (true);
