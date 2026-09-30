# Database

`server/migrations/001_initial.sql` defines the PostgreSQL schema. `npm run migrate` applies it and performs a one-time import. Migration version and import marker are separate so repeated starts do not overwrite edited content.

| Table | Records |
| --- | --- |
| global_settings | Global site settings and one-time import marker |
| admin_users | Unique usernames, bcrypt hashes, encrypted TOTP secret, hashed recovery codes, replay counter and session version |
| blog_posts | Title, immutable slug, thumbnail, excerpt, sanitized HTML content, author, date, category, draft/published status |
| result_categories | Category title, thumbnail, description and order |
| results | Category ID, level, poster, session, year, student name and rank |
| programs | Stable ID, title, category/filter, icon, description, duration, course URL and order |
| branches | Branch ID, name, phone and order; remaining layout/address content uses the visual editor |
| contact_submissions | Validated form data, original source, timestamp, deduplication fingerprint and CRM delivery status |
| form_dedup_keys | Atomic two-minute duplicate-submission claim |
| media_files | File ID, public URL, original name, MIME, size and creation time |
| session | Production server-side administrator sessions with expiry |
| schema_migrations | Applied SQL migration versions |

Content tables use a stable primary key and JSONB data so new CMS fields can be added without rewriting every page. Unique blog-slug and results-category indexes support retrieval; application validation checks required fields, safe URLs, states and category membership. Result-category deletion is refused while results refer to it. SQL values are parameterized, and dynamic table names use a fixed allowlist.

The database is authoritative for settings, programme records, articles and results after import. HTML documents, shared partials and image/PDF bytes remain on the persistent filesystem to preserve the original visual editor. Odoo's protected configuration and integration log also retain their original file formats. `data/site-settings.json` and `data/content-seed.json` are import sources, not live content after migration.

No existing blog publication dates were supplied; imported articles keep an empty date instead of inventing one. The six pre-existing article bodies are imported. Existing lead data is imported without resending it to Odoo.

Production backup example: use your provider's database snapshot facility or `pg_dump` with a protected credentials file. Back up uploads, pages, assets, partials and secrets at the same time. Restore the database to a separate staging instance before promoting it. No destructive down-migration is included.
