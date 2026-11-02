/*
# Add item pictures and player deal tickets

1. Changes to existing tables
- `loot_items`: new optional column `image_key` that says which picture the item uses (for example "medkit"). Existing rows keep an empty value and show a placeholder.

2. New tables
- `deal_tickets`: a withdrawal or deposit request a player creates from their profile.
  - `number`: ticket number, assigned automatically and never reused.
  - `kind`: "withdraw" or "deposit".
  - `nickname`, `location`, `deal_time`: details the player enters for the deal.
  - `amount`: gold amount of the deal.
  - `status`: "in_progress" (default), "completed" or "rejected".

3. Security
- Row level security is enabled on `deal_tickets`. No public or signed-in role is granted access, so only the server-side game function (service_role) reads and writes tickets.

4. Notes
- Amounts must be positive whole numbers.
- Ticket status values are restricted by a check constraint.
*/

ALTER TABLE loot_items ADD COLUMN IF NOT EXISTS image_key text;

CREATE TABLE IF NOT EXISTS deal_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('withdraw', 'deposit')),
  nickname text NOT NULL,
  location text NOT NULL,
  deal_time timestamptz NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_tickets_player_id_idx ON deal_tickets (player_id);

ALTER TABLE deal_tickets ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON deal_tickets TO service_role;
