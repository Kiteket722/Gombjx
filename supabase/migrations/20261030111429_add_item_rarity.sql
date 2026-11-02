/*
# Add item rarity

1. Changes to existing tables
- `loot_items`: new column `rarity` with one of six tiers: common, rare, epic, mythic, legendary, unique. Existing items are classified by their picture: stones and berries become common, the pickaxe and medkit become rare.

2. Security
- No change to access. Only the server-side game function (service_role) reads and writes items.

3. Notes
- The tier is stored as text restricted by a check constraint, so unknown values are rejected.
*/

ALTER TABLE loot_items ADD COLUMN IF NOT EXISTS rarity text NOT NULL DEFAULT 'common';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'loot_items_rarity_check'
  ) THEN
    ALTER TABLE loot_items ADD CONSTRAINT loot_items_rarity_check
      CHECK (rarity IN ('common', 'rare', 'epic', 'mythic', 'legendary', 'unique'));
  END IF;
END $$;

UPDATE loot_items SET rarity = 'rare' WHERE image_key IN ('pickaxe', 'medkit') AND rarity = 'common';
