# Security measures and operational limits

## Implemented

- Express server with an explicit static-file allowlist. Environment files, Git history, database seed files, backups, server source and package metadata are not served publicly.
- Bcrypt password hashes (cost 12), administrator creation by CLI, no shipped/default credentials, and password changes invalidate existing sessions.
- PostgreSQL-backed production sessions; HttpOnly, SameSite=Strict cookies; Secure cookies in production; 12-hour absolute session limit; explicit logout.
- Same-origin mutation checks and session-bound CSRF tokens for authenticated admin writes. Public forms accept validated JSON, have IP rate limits and honeypots, and use atomic two-minute duplicate protection.
- Separate login and authenticator attempt limits. Rate limits are process-local; deploy one application process.
- Optional TOTP with QR setup, password confirmation, setup expiry, encrypted AES-256-GCM secrets, replay counters and hashed one-use recovery codes. Disabling requires password plus an authenticator/recovery code. Back up the encryption key.
- Server-side authentication/authorization before every CMS route. Public APIs exclude drafts, brochure URLs and custom head code.
- Blog sanitization, safe URL validation and escaped content output. CMS administrators retain trusted developer/HTML/tracking access as in the original system; do not grant admin access to untrusted users.
- Upload extension/MIME checks, decoded-image validation, image pixel limits, 20 MB image limit and random filenames. SVG uploads are rejected for active/external content and rasterized to PNG. Existing SVG files receive a restrictive sandbox CSP when served directly. PDFs retain the existing 30 MB brochure limit and require a PDF signature.
- Helmet security headers, nosniff, same-origin framing, strict-origin referrer policy, production HSTS, and CSP. Inline script/style compatibility remains enabled to preserve the existing CMS and tracking scripts. CSP is not a substitute for trusting administrator-authored HTML.
- Brochure files are not directly public; a validated lead creates a short-lived download token.
- Parameterized SQL and fixed table allowlists; CSV output neutralizes spreadsheet formula prefixes.
- Secrets are omitted from the deliverable. `.gitignore` excludes live credentials, session database files and integration logs. The integration API returns only whether secrets are configured, never the saved secret.

## Required configuration

HTTPS, a correct reverse-proxy trust setting, persistent PostgreSQL, protected filesystem permissions, unique admin credentials, random session/encryption keys, database/backups and proxy upload limits are hosting responsibilities. See SETUP.md and deploy/.

Retain your existing HTTPS certificate and set PUBLIC_ORIGIN exactly. Keep the Node port private. Limit file access to the service account. Keep dependency and OS updates current. Review your analytics/privacy notice and retention requirements before production deployment.

## Verification limits

Automated tests exercise security behavior in an isolated embedded PostgreSQL-compatible engine. External PostgreSQL TLS/session persistence, the real reverse proxy, real email delivery, real Odoo authentication/lead creation and production analytics receipt require staging/live verification. This package does not send notification email because no email service was supplied. Form submissions are stored and routed through the existing CRM mechanism.

Failed CRM delivery is visible in lead status and the protected integration log. There is no automatic blind retry because a remote timeout can occur after the CRM created a lead. Review the CRM before retrying manually.

A full independent penetration test or audit is not claimed. Production certification is outside the local test evidence.
