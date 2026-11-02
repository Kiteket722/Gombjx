/*
# Add free case cooldown tracking

1. Changes to existing tables
- `players`: add `last_free_case_at` column (timestamptz, nullable). Stores the server timestamp
  of the last time a player opened the free case. NULL means the player has never opened it.

2. Security
- No new tables. RLS already enabled on `players`.
- The existing GRANT for `service_role` covers the new column since it is a table-level grant.

3. Notes
- The cooldown is enforced server-side in the game edge function using `now() - last_free_case_at >= 24 hours`.
- This prevents client-side time manipulation: the server's clock is authoritative.
- The column is nullable so existing players who haven't opened a free case yet are not blocked.
*/

ALTER TABLE players ADD COLUMN IF NOT EXISTS last_free_case_at timestamptz;
