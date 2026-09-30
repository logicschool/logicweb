# Setup and deployment — Logic CMS 7.1

Already running CMS 7 locally? Follow **UPDATE-CMS-7.1.md** to preserve your current database, account and files.

This package upgrades the supplied Node website. It is **not a static-hosting ZIP**. Use a Node.js host plus PostgreSQL. Uploading it to GitHub Pages or opening index.html directly will not run the CMS, shared layout, forms or database content.

## Before replacing the live site

1. Back up the entire existing application, uploads, protected data directory, environment and reverse-proxy configuration. Keep the original FINAL_DRAFT.zip as the source backup.
2. Deploy this package to a staging directory. Do not overwrite the live site first.
3. Use Node.js 22 or 24 and a supported PostgreSQL server. Create a dedicated database and restricted application role; do not use the PostgreSQL superuser for the application.
4. Keep existing `uploads/` and the original `data/site-settings.json`, `data/leads.ndjson` and protected integration configuration for the first migration. When upgrading a newer live installation, copy its current versions into staging before importing. The attached ZIP is a September 24 snapshot; it may not contain later live edits.

## Install

```sh
npm ci --omit=dev
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run the random-key command twice. Use one output for SESSION_SECRET and the other for TOTP_ENCRYPTION_KEY. Keep both stable across restarts and back them up separately. Configure `.env` with the database connection and your HTTPS origin. Never commit this file.

```sh
npm run migrate
# Temporarily set ADMIN_USERNAME and ADMIN_PASSWORD in .env.
npm run admin:create
# Remove ADMIN_PASSWORD from .env after the account is created.
npm start
```

Use a unique 12–72-byte admin password. There is no default password. The previous file-based admin account is not automatically trusted or imported; create a new administrator. Visit `/admin/`.

The migration is repeatable. It imports settings, existing blog text, course cards, result categories, existing lead records and media metadata only on the first import. Existing placeholder posters become category thumbnails; they are not published as real student results. The original blog URLs remain available. New blog posts use `/blog/<slug>.html` dynamically, with no manually created HTML file. Existing slugs cannot be changed in the CMS because those are public URLs.

## Environment

| Variable | Purpose |
| --- | --- |
| NODE_ENV | `production` for live hosting |
| DATABASE_URL | PostgreSQL connection string |
| PGSSL | `true` to require verified database TLS; install your provider's CA if necessary |
| PUBLIC_ORIGIN | Exact origin, e.g. `https://site.logiceducation.org`, without a trailing slash |
| SESSION_SECRET | At least 32 random characters; signs the session cookie |
| TOTP_ENCRYPTION_KEY | Exactly 64 hex characters; encrypts authenticator secrets |
| HOST / PORT | Default `127.0.0.1:8080` behind the proxy |
| TRUST_PROXY | `1` only with precisely one trusted reverse proxy; configure explicitly for other topologies |
| ODOO_API_KEY | Secret override for existing Odoo configuration |
| CRM_WEBHOOK_SECRET | Secret override for the existing webhook route |
| ADMIN_USERNAME / ADMIN_PASSWORD | Used only by `npm run admin:create` |

Odoo's model mapping and lead sources are retained. Secrets are omitted from the deliverable. Re-enter the Odoo API key or webhook secret securely. Keep the existing URL, database, username, model and custom mapping from your live system. Open CMS → CRM / Odoo, check settings and use Test Connection. Enable delivery only after testing. Stored leads have a CRM delivery status. Failed delivery remains stored locally; inspect the protected integration log and the CRM before manually retrying to avoid duplicate remote records.

## Hosting configuration

- Use the example `deploy/nginx.conf.example` with your real TLS certificate paths. It proxies all requests to Node; do not serve the project root as a public static directory.
- Set the reverse proxy body limit to at least **45 MB** for base64 image/PDF requests. The application allows 20 MB image bytes and the existing 30 MB PDF brochure limit. Proxy limits can cause HTTP 413 before Node sees the upload.
- Configure a persistent writable application filesystem. The legacy visual editor saves HTML, assets, shared partials and backups on disk. Persist `uploads/`, `data/`, pages, `assets/` and `partials/`.
- Run one Node process. Login/form rate limits and brochure download tokens are process-local. PostgreSQL stores admin sessions. Multi-instance operation needs shared rate limiting, brochure tokens, filesystem and cache invalidation before scaling.
- Use a process supervisor; adapt `deploy/logic.service.example` to your actual Node path and service user.
- Back up PostgreSQL, content files, uploads and encryption keys. Test restoring to staging.
- Ensure the host can reach your configured Odoo/webhook, Google/Meta tracking services and required font/image hosts.

## Editing

- Branding & Global: shared logo, favicon, colours, phone, WhatsApp, email, address, navigation and social links.
- Content Manager: blog, programme cards, result categories, results and branch names/phone numbers.
- Page Editor: hero, buttons, avatars, testimonial/campus/partner/affiliation images and other page content. Alt-click a nested programme element to select its whole card. Programme text, icon, category, duration and link edits also save to the database.
- Global Header / Global Footer: dedicated fields for shared layout content, links, logo sizing, buttons and newsletter controls. Save once for every page. Shared partials still control structural markup; use the global editors for routine changes.
- Result Posters / Placement Posters / Banners: direct image upload, thumbnail previews, ordering, publish/draft and delete controls. Results remain grouped on existing course result URLs.
- Blog article content accepts basic formatted HTML; active scripts are removed.
- Student avatars are labelled placeholder images. Replace all three with approved student photos in Page Editor → Choose from Media.
- Result records support category, level (CA Foundation / CA Intermediate / CA Final), poster, exam session, year, student name and rank. Add approved results; category pages are generated automatically.
- Uploaded SVGs are validated then converted to PNG. Keep the source SVG offline if later vector editing is needed.
- Security → Manage two-step verification: confirm your password, scan the QR code, verify the code and save the one-time recovery codes securely.

## Local development and tests

```sh
npm ci
# Local preview only: set NODE_ENV=development, DEV_DATABASE=pglite,
# PUBLIC_ORIGIN=http://127.0.0.1:8080, valid random keys; leave DATABASE_URL unset.
npm run migrate
npm run admin:create
npm start
npm test
npm run test:browser
```

PGlite is an embedded PostgreSQL engine for local validation; production requires an external PostgreSQL database. Browser tests use an isolated development database and a packaged headless Chromium; `CHROMIUM_PATH` can override the executable for your machine. The bundled Chromium is Linux-specific; on Windows use Playwright's installed Chromium and adapt the test launcher.

## Go-live check

Verify every important public page, mobile navigation, admin login/2FA, a brochure download, all form types, Odoo source fields, tracking requests and uploaded media on staging. Then switch the reverse proxy to the new application. If verification fails, switch back to the previous directory/database snapshot. Do not import stale seed data into an already customized production database.
