/*
# Allow decimal gold and item values

1. Changes to existing tables
- `players.gold`: now stores gold with up to two decimal places (for example 12.37). Existing whole-number balances are kept exactly as they are.
- `loot_items.value`: item values can have two decimal places, needed for the berry that is worth between 0.10 and 0.80 gold.
- `contract_tickets.item_value`: same change, so contract history keeps the exact value of the item.
- `deal_tickets.amount`: withdrawal totals can include decimal item values.

2. Security
- No access changes. Row level security and grants stay the same.

3. Notes
- The change only widens the number format; no rows are removed or altered in value.
- Gold and values must stay non-negative (existing checks are kept).
*/

ALTER TABLE players ALTER COLUMN gold TYPE numeric(12,2);
ALTER TABLE loot_items ALTER COLUMN value TYPE numeric(12,2);
ALTER TABLE contract_tickets ALTER COLUMN item_value TYPE numeric(12,2);
ALTER TABLE deal_tickets ALTER COLUMN amount TYPE numeric(12,2);
