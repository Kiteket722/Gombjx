ALTER TABLE deal_tickets
  ADD COLUMN currency text NOT NULL DEFAULT 'gold' CHECK (currency IN ('gold', 'rub')),
  ADD COLUMN rub_amount numeric CHECK (rub_amount > 0),
  ADD COLUMN phone text,
  ADD COLUMN bank text,
  ALTER COLUMN nickname DROP NOT NULL,
  ALTER COLUMN location DROP NOT NULL;
