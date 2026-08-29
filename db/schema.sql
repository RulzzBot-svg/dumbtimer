-- Optional: paste this in the Neon SQL editor. The app also creates these
-- tables on first use.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  avatar TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS presets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  share_code TEXT NOT NULL UNIQUE,
  time TEXT,
  query TEXT NOT NULL,
  gif_json TEXT,
  repeat TEXT NOT NULL DEFAULT 'daily',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  preset_id TEXT NOT NULL,
  from_user_id TEXT NOT NULL,
  to_username TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS preset_groups (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  share_code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

ALTER TABLE presets ADD COLUMN IF NOT EXISTS group_id TEXT;
