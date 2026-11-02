-- Add telegram column to deal_tickets (replaces the "deal time" field in the UI).
-- deal_time is kept for backward compatibility but is now nullable and defaults to now().
ALTER TABLE deal_tickets
  ADD COLUMN telegram text,
  ALTER COLUMN deal_time SET DEFAULT now(),
  ALTER COLUMN deal_time DROP NOT NULL;
