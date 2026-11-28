-- Run once against the same Neon database used by DATABASE_URL.
CREATE TABLE IF NOT EXISTS local_auth_users (
  id text PRIMARY KEY,
  username text NOT NULL UNIQUE,
  name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'Karyawan' CHECK (role IN ('Admin', 'Karyawan')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS local_auth_sessions (
  token_hash text PRIMARY KEY,
  user_id text NOT NULL REFERENCES local_auth_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS local_auth_sessions_expires_at_idx
  ON local_auth_sessions (expires_at);
