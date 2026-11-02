/*
# Add is_banned column to players table

Allows the admin to ban a player. When is_banned = true, the game edge
function will refuse to return game state, effectively locking the player
out of the site.
*/

ALTER TABLE players ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;
