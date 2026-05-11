-- Nullable because ALTER TABLE ADD COLUMN forbids function defaults in SQLite; NULL means never explicitly updated.
ALTER TABLE cast_members ADD COLUMN updated_at TEXT;
ALTER TABLE history ADD COLUMN updated_at TEXT;
