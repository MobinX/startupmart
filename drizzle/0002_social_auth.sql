-- Custom migration for social authentication
-- Since this is a breaking change from password-based to Firebase auth,
-- we'll recreate the users table with the new schema

-- Create new users table with updated schema
CREATE TABLE users_new (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    firebase_uid TEXT NOT NULL UNIQUE,
    auth_provider TEXT CHECK (auth_provider IN ('google', 'facebook', 'github', 'apple')) NOT NULL,
    role TEXT CHECK (role IN ('startup_owner', 'investor')) NOT NULL,
    current_pricing_plan TEXT CHECK (current_pricing_plan IN ('free', 'premium')) NOT NULL DEFAULT 'free',
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Copy data if any exists (migrating role and email, firebase_uid will be set on next login)
INSERT INTO users_new (id, email, role, auth_provider, firebase_uid)
SELECT id, email, role, 'google', '' FROM users;

-- Drop old table and rename new one
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- Create index on firebase_uid for faster lookups
CREATE UNIQUE INDEX users_firebase_uid_idx ON users(firebase_uid);