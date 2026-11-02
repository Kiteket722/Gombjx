/*
# Remember items held by withdrawal tickets

1. Changes to existing tables
- `deal_tickets`: new column `held_items` that stores a snapshot of the inventory items taken for a withdrawal, exactly as they were before the withdrawal. Existing rows get an empty list.

2. Why
- When a withdrawal is cancelled, the snapshot lets the server give the items back with their original values.

3. Security
- No change to access. Only the server-side game and admin functions (service_role) use this table.
*/

ALTER TABLE deal_tickets ADD COLUMN IF NOT EXISTS held_items jsonb NOT NULL DEFAULT '[]'::jsonb;
