-- Add active_effects column to users table
ALTER TABLE users ADD COLUMN active_effects JSONB NOT NULL DEFAULT '[]';

-- Add index for efficient effect queries
CREATE INDEX users_active_effects_idx ON users USING GIN (active_effects);
