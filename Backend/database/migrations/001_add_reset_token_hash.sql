-- Migration: add reset token hash and expires to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;

-- Optional: set index for lookup by reset_token_hash
CREATE INDEX IF NOT EXISTS idx_users_reset_token_hash ON users(reset_token_hash);
