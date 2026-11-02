/*
# Add item upgrade level and rename existing rewards

1. Modified Tables
- `loot_items`
  - New column `level` (integer, default 1, must be between 1 and 5). Existing items become level 1.
  - Renamed existing rows: Камень -> Ткань, Кирка -> Ремки, Знак Великого -> Пасс, Пистолет -> Ор иник.

2. Security
- No changes to RLS or grants. Existing policies on `loot_items` still apply.

3. Important Notes
- No rows are deleted or re-typed; only the new column is added and names are updated.
*/

ALTER TABLE loot_items ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'loot_items_level_check'
  ) THEN
    ALTER TABLE loot_items ADD CONSTRAINT loot_items_level_check CHECK (level BETWEEN 1 AND 5);
  END IF;
END $$;

UPDATE loot_items SET name = 'Ткань' WHERE image_key = 'rock';
UPDATE loot_items SET name = 'Ремки' WHERE image_key = 'pickaxe';
UPDATE loot_items SET name = 'Пасс' WHERE image_key = 'badge';
UPDATE loot_items SET name = 'Ор иник' WHERE image_key = 'pistol';
