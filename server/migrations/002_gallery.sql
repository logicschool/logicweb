CREATE TABLE IF NOT EXISTS placement_posters (id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS banners (id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
INSERT INTO schema_migrations(version) VALUES ('002') ON CONFLICT DO NOTHING;
