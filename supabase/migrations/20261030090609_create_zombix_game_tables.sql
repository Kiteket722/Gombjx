/*
# Create Zombix game tables

1. New Tables
- `players`: one row per browser-based player. Holds a secret `token` (kept in the player's browser), gold balance and search count.
- `loot_items`: items found in caches or obtained from contracts, owned by a player.
- `contract_tickets`: history of contract attempts, with the outcome (won / lost).

2. Security
- Row level security is enabled on all three tables.
- No policies are granted to the public `anon` and `authenticated` roles, so the browser cannot read or write these tables directly.
- Only the server-side game function (service_role) reads and writes them, which keeps balances and outcomes tamper-proof.

3. Notes
- Gold can never go negative (check constraint).
- Deleting a player cascades to their loot and tickets.
*/

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  gold integer NOT NULL DEFAULT 500 CHECK (gold >= 0),
  searches integer NOT NULL DEFAULT 0 CHECK (searches >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loot_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  name text NOT NULL,
  value integer NOT NULL CHECK (value > 0),
  found_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS loot_items_player_id_idx ON loot_items (player_id);

CREATE TABLE IF NOT EXISTS contract_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  item_value integer NOT NULL,
  target_value integer NOT NULL,
  chance integer NOT NULL CHECK (chance BETWEEN 0 AND 100),
  result text NOT NULL CHECK (result IN ('won', 'lost')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contract_tickets_player_id_idx ON contract_tickets (player_id);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE loot_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_tickets ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON players, loot_items, contract_tickets TO service_role;
