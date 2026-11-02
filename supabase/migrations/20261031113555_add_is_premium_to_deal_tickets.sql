-- Add is_premium column to deal_tickets to distinguish premium (PLUS) tickets.
ALTER TABLE deal_tickets ADD COLUMN is_premium boolean NOT NULL DEFAULT false;
